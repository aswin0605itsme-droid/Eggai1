
import React, { useState, useCallback, useEffect } from 'react';
import { predictEggGender } from '../services/geminiService';
import type { GenderPredictionResult, AnalysisRecord } from '../types';
import { Upload, Sparkles, AlertTriangle, Trash2, X, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FilePreview {
    id: string;
    file: File;
    preview: string;
}

interface AnalysisResult extends GenderPredictionResult {
    id: string;
    preview: string;
}

interface ImageAnalyzerProps {
    onAnalysisComplete: (record: AnalysisRecord) => void;
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ onAnalysisComplete }) => {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [batchNumber, setBatchNumber] = useState<string>('');

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map((file: File) => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        preview: URL.createObjectURL(file)
      }));
      setFiles(prev => [...prev, ...newFiles]);
      setResults([]);
      setError(null);
    }
  };
  
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleAnalyze = useCallback(async () => {
    if (files.length === 0 || !batchNumber.trim()) {
      setError("Please upload at least one image and provide a batch number.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);

    const analysisPromises = files.map(async (filePreview) => {
        const reader = new FileReader();
        const readPromise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(filePreview.file);
        });
        const imageData = await readPromise;
        const analysisResult = await predictEggGender(imageData);
        return { ...analysisResult, id: filePreview.id, preview: filePreview.preview };
    });

    const settledResults = await Promise.allSettled(analysisPromises);
    
    const successfulResults: AnalysisResult[] = [];
    settledResults.forEach(res => {
        if (res.status === 'fulfilled') {
            const result = res.value;
            successfulResults.push(result);
            onAnalysisComplete({
                timestamp: new Date().toISOString(),
                batchNumber,
                analysisType: 'Image',
                gender: result.predictedGender,
                confidence: result.confidence,
                reasoning: result.reasoning,
            });
        } else {
            console.error("An analysis failed:", res.reason);
        }
    });

    setResults(successfulResults);
    setLoading(false);
  }, [files, batchNumber, onAnalysisComplete]);
  
  const clearBatch = () => {
      setFiles([]);
      setResults([]);
      setError(null);
  }

  // Cleanup object URLs
  useEffect(() => {
      return () => {
          files.forEach(file => URL.revokeObjectURL(file.preview));
      }
  }, [files]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
        <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight">Batch Image Analysis</h2>
                <p className="mt-2 text-gray-400 text-sm">Upload multiple photos to predict gender for an entire batch.</p>
            </div>
            
            <div className="space-y-6">
                <div>
                    <label htmlFor="batch-number-image" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Batch Number <span className="text-purple-500">*</span></label>
                    <input 
                        type="text" 
                        id="batch-number-image" 
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        placeholder="e.g., Batch-001A"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-inner"
                    />
                </div>

                <div className="relative group">
                    <label htmlFor="egg-upload" className="relative block w-full cursor-pointer p-12 border-2 border-dashed border-gray-600 rounded-2xl text-center hover:border-purple-500 hover:bg-gray-900/50 transition-all duration-300 group-hover:shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Upload className="w-12 h-12 mx-auto text-gray-500 group-hover:text-purple-400 transition-colors duration-300 mb-4" />
                        <span className="block text-lg font-medium text-gray-300 group-hover:text-white transition-colors">
                            Drop images here or click to upload
                        </span>
                        <span className="mt-2 block text-xs text-gray-500 font-medium uppercase tracking-wide">Supports PNG, JPG, WEBP</span>
                    </label>
                    <input id="egg-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} multiple />
                </div>
                
                <AnimatePresence>
                    {files.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700/50 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-200 flex items-center gap-2 text-sm">
                                <FileImage className="w-4 h-4 text-purple-400"/>
                                Selected Images ({files.length})
                            </h3>
                            <button onClick={clearBatch} className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 font-medium">
                                <Trash2 className="w-3 h-3" /> Clear All
                            </button>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {files.map(f => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    key={f.id} 
                                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-700 bg-gray-800"
                                >
                                    <img src={f.preview} alt="Egg preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => removeFile(f.id)} className="text-white hover:text-red-400 transition-colors">
                                            <X className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={handleAnalyze}
                    disabled={files.length === 0 || !batchNumber.trim() || loading}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] mt-4"
                >
                    {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Predicting Batch...
                    </>
                    ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        Predict for Batch ({files.length})
                    </>
                    )}
                </button>
            </div>
        </div>
      </div>

      <div className="mt-8">
        {loading && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 bg-gray-800 rounded-2xl border border-gray-700"
            >
                <div className="inline-block w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-300 font-medium">Analyzing batch... AI is processing your images.</p>
            </motion.div>
        )}
        
        {error && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl"
            >
            <AlertTriangle className="w-5 h-5" /> {error}
            </motion.div>
        )}

        {results.length > 0 && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-xl"
            >
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Batch Results</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-400">
                        <thead className="text-xs uppercase bg-gray-900/50 text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Preview</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Gender</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Confidence</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Reasoning</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {results.map(r => (
                                <tr key={r.id} className="hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-600 bg-gray-900">
                                            <img src={r.preview} alt="analyzed egg" className="w-full h-full object-cover"/>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                            r.predictedGender === 'Male' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            r.predictedGender === 'Female' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        }`}>
                                            {r.predictedGender}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-200 font-medium">{r.confidence}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={r.reasoning}>{r.reasoning}</td>
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

export default ImageAnalyzer;
