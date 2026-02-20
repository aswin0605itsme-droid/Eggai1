
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white tracking-tight">Batch Image Analysis</h2>
        <p className="mt-2 text-gray-400">Upload multiple photos to predict gender for an entire batch.</p>
      </div>
      
      <div className="space-y-8">
        <div className="glass-panel p-6 rounded-2xl">
            <label htmlFor="batch-number-image" className="block text-sm font-medium text-gray-300 mb-2">Batch Number <span className="text-red-400">*</span></label>
            <input 
                type="text" 
                id="batch-number-image" 
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g., Batch-001A"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
        </div>

        <div className="relative group">
            <label htmlFor="egg-upload" className="relative block w-full cursor-pointer p-12 border-2 border-dashed border-white/10 rounded-2xl text-center hover:border-indigo-500/50 hover:bg-white/5 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Upload className="w-16 h-16 mx-auto text-gray-500 group-hover:text-indigo-400 transition-colors duration-300 mb-4" />
                <span className="block text-lg font-medium text-gray-300 group-hover:text-white transition-colors">
                    Drop images here or click to upload
                </span>
                <span className="mt-2 block text-sm text-gray-500">Supports PNG, JPG, WEBP</span>
            </label>
            <input id="egg-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} multiple />
        </div>
        
        <AnimatePresence>
            {files.length > 0 && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-panel p-6 rounded-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-indigo-400"/>
                        Selected Images ({files.length})
                    </h3>
                    <button onClick={clearBatch} className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Clear All
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {files.map(f => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            key={f.id} 
                            className="relative group aspect-square rounded-xl overflow-hidden border border-white/10"
                        >
                            <img src={f.preview} alt="Egg preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => removeFile(f.id)} className="bg-red-500/80 text-white p-2 rounded-full hover:bg-red-600 transition-colors">
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
            )}
        </AnimatePresence>

        <div className="flex gap-4">
          <button
            onClick={handleAnalyze}
            disabled={files.length === 0 || !batchNumber.trim() || loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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

      <div className="mt-12">
        {loading && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 glass-panel rounded-2xl"
            >
                <div className="inline-block w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
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
                className="glass-panel rounded-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-xl font-semibold text-white">Batch Results</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-400">
                        <thead className="text-xs uppercase bg-white/5 text-gray-300">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Preview</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Gender</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Confidence</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Reasoning</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {results.map(r => (
                                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                                            <img src={r.preview} alt="analyzed egg" className="w-full h-full object-cover"/>
                                        </div>
                                    </td>
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

export default ImageAnalyzer;
