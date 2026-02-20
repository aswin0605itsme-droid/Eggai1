import React, { useState, useCallback } from 'react';
import { predictEggGenderFromMeasurements } from '../services/geminiService';
import type { GenderPredictionResult, AnalysisRecord } from '../types';
import { Sparkles, AlertTriangle, Plus, Trash2, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MeasurementRow {
    id: string;
    length: string;
    width: string;
    weight: string;
}

interface CalculationResult extends GenderPredictionResult {
    id: string;
    inputs: { length: number; width: number; weight: number; };
    shapeIndex: number;
}

interface ShapeIndexCalculatorProps {
    onAnalysisComplete: (record: AnalysisRecord) => void;
}

const ShapeIndexCalculator: React.FC<ShapeIndexCalculatorProps> = ({ onAnalysisComplete }) => {
    const [batchNumber, setBatchNumber] = useState('');
    const [rows, setRows] = useState<MeasurementRow[]>([{ id: crypto.randomUUID(), length: '', width: '', weight: '' }]);
    const [results, setResults] = useState<CalculationResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleAddRow = () => {
        setRows([...rows, { id: crypto.randomUUID(), length: '', width: '', weight: '' }]);
    };
    
    const handleRemoveRow = (id: string) => {
        setRows(rows.filter(row => row.id !== id));
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[id];
            return newErrors;
        })
    };

    const handleInputChange = (id: string, field: keyof Omit<MeasurementRow, 'id'>, value: string) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const validateRows = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        if (!batchNumber.trim()){
            newErrors.global = 'Batch Number is required.';
            isValid = false;
        }

        rows.forEach(row => {
            const lengthNum = parseFloat(row.length);
            const widthNum = parseFloat(row.width);
            const weightNum = parseFloat(row.weight);

            if (!row.length || !row.width || !row.weight) {
                newErrors[row.id] = 'All fields are required.';
                isValid = false;
            } else if (isNaN(lengthNum) || isNaN(widthNum) || isNaN(weightNum) || lengthNum <= 0 || widthNum <= 0 || weightNum <= 0) {
                newErrors[row.id] = 'Please enter valid, positive numbers.';
                isValid = false;
            } else if (widthNum >= lengthNum) {
                newErrors[row.id] = 'Length must be greater than width.';
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    }

    const handleCalculate = useCallback(async () => {
        if (!validateRows()) return;
        
        setLoading(true);
        setResults([]);

        const analysisPromises = rows.map(async (row) => {
            const lengthNum = parseFloat(row.length);
            const widthNum = parseFloat(row.width);
            const weightNum = parseFloat(row.weight);
            const shapeIndex = (widthNum / lengthNum) * 100;

            const analysisResult = await predictEggGenderFromMeasurements(lengthNum, widthNum, weightNum);
            return {
                ...analysisResult,
                id: row.id,
                inputs: { length: lengthNum, width: widthNum, weight: weightNum },
                shapeIndex
            };
        });
        
        const settledResults = await Promise.allSettled(analysisPromises);
        
        const successfulResults: CalculationResult[] = [];
        settledResults.forEach(res => {
            if (res.status === 'fulfilled') {
                const result = res.value;
                successfulResults.push(result);
                 if (result.predictedGender !== 'Uncertain') {
                    onAnalysisComplete({
                        timestamp: new Date().toISOString(),
                        batchNumber,
                        analysisType: 'Calculator',
                        gender: result.predictedGender,
                        confidence: result.confidence,
                        reasoning: `Shape Index: ${result.shapeIndex.toFixed(2)}. ${result.reasoning}`,
                    });
                }
            } else {
                 console.error("An analysis failed:", res.reason);
            }
        });
        
        setResults(successfulResults);
        setLoading(false);

    }, [batchNumber, rows, onAnalysisComplete]);
    
    const clearBatch = () => {
        setRows([{ id: crypto.randomUUID(), length: '', width: '', weight: '' }]);
        setResults([]);
        setErrors({});
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white tracking-tight">Batch Measurement Calculator</h2>
                <p className="mt-2 text-gray-400">Enter data for multiple eggs to predict gender for the batch.</p>
            </div>

            <div className="space-y-8">
                <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <div>
                        <label htmlFor="batch-number-calc" className="block text-sm font-medium text-gray-300 mb-2">Batch Number <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            id="batch-number-calc"
                            value={batchNumber}
                            onChange={(e) => setBatchNumber(e.target.value)}
                            placeholder="e.g., Batch-001A"
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        />
                         {errors.global && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {errors.global}</p>}
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence>
                            {rows.map((row, index) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    key={row.id} 
                                    className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <div className="sm:col-span-1 flex items-center h-full pt-3 sm:pt-0">
                                        <span className="font-mono text-sm text-gray-400">#{index + 1}</span>
                                    </div>
                                    <div className="sm:col-span-10 grid grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor={`length-${row.id}`} className="block text-xs font-medium text-gray-400 mb-1">Long Axis (mm)</label>
                                            <input type="number" id={`length-${row.id}`} value={row.length} onChange={e => handleInputChange(row.id, 'length', e.target.value)} placeholder="55.5" className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                                        </div>
                                        <div>
                                            <label htmlFor={`width-${row.id}`} className="block text-xs font-medium text-gray-400 mb-1">Short Axis (mm)</label>
                                            <input type="number" id={`width-${row.id}`} value={row.width} onChange={e => handleInputChange(row.id, 'width', e.target.value)} placeholder="42.0" className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                                        </div>
                                        <div>
                                            <label htmlFor={`weight-${row.id}`} className="block text-xs font-medium text-gray-400 mb-1">Weight (g)</label>
                                            <input type="number" id={`weight-${row.id}`} value={row.weight} onChange={e => handleInputChange(row.id, 'weight', e.target.value)} placeholder="60.2" className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-1 flex justify-end pt-6 sm:pt-1">
                                         {rows.length > 1 && (
                                            <button onClick={() => handleRemoveRow(row.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors" aria-label="Remove row">
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        )}
                                    </div>
                                    {errors[row.id] && <p className="text-xs text-red-400 col-span-full mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {errors[row.id]}</p>}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                     <button onClick={handleAddRow} className="flex items-center gap-2 text-sm text-indigo-400 font-medium hover:text-indigo-300 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-500/10 w-fit">
                        <Plus className="w-4 h-4"/> Add Another Egg
                     </button>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleCalculate}
                        disabled={loading || rows.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Predicting Batch...
                            </>
                        ) : (
                            <>
                                <Calculator className="w-5 h-5" />
                                Calculate Batch ({rows.length})
                            </>
                        )}
                    </button>
                    {rows.length > 0 && <button onClick={clearBatch} className="bg-white/10 text-gray-300 font-bold py-4 px-6 rounded-xl hover:bg-white/20 transition-colors">Clear</button>}
                </div>
            </div>
            
            <div className="mt-12">
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center p-8 glass-panel rounded-2xl"
                    >
                        <div className="inline-block w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p className="text-gray-300 font-medium">Calculating shape indices... AI is analyzing the data.</p>
                    </motion.div>
                )}

                {results.length > 0 && (
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel rounded-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/10">
                            <h3 className="text-xl font-semibold text-white">Batch Results</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-400">
                                <thead className="text-xs uppercase bg-white/5 text-gray-300">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Measurements (L/W/Wt)</th>
                                        <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Shape Index</th>
                                        <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Gender</th>
                                        <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Confidence</th>
                                        <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Reasoning</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {results.map(r => (
                                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-gray-300">{`${r.inputs.length}mm / ${r.inputs.width}mm / ${r.inputs.weight}g`}</td>
                                            <td className="px-6 py-4 font-medium text-white">{r.shapeIndex.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    r.predictedGender === 'Male' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                    r.predictedGender === 'Female' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' :
                                                    'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                                }`}>
                                                    {r.predictedGender}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-white font-medium">{r.confidence}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate" title={r.reasoning}>{r.reasoning}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ShapeIndexCalculator;
