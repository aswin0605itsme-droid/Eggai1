
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { predictEggGender } from '../services/geminiService';
import type { GenderPredictionResult, AnalysisRecord } from '../types';
import { Camera, Zap, AlertTriangle, Info, StopCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ResultCard from './ResultCard';

interface LiveAnalyzerProps {
    onAnalysisComplete: (record: AnalysisRecord) => void;
}

const LiveAnalyzer: React.FC<LiveAnalyzerProps> = ({ onAnalysisComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [result, setResult] = useState<GenderPredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean>(false);
  const [batchNumber, setBatchNumber] = useState<string>('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
        setError(null);
        setResult(null);
        setCapturedImage(null);
        setFeedbackGiven(false);
      }
    } catch (err) {
      console.error(err);
      setError('Could not access camera. Please check permissions.');
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  const handleCaptureAndAnalyze = useCallback(async () => {
    if (videoRef.current && canvasRef.current && batchNumber.trim()) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageDataUrl);
      
      setLoading(true);
      setError(null);
      setResult(null);
      setFeedbackGiven(false);

      try {
        const analysisResult = await predictEggGender(imageDataUrl);
        setResult(analysisResult);
        onAnalysisComplete({
          timestamp: new Date().toISOString(),
          batchNumber,
          analysisType: 'Live Camera',
          gender: analysisResult.predictedGender,
          confidence: analysisResult.confidence,
          reasoning: analysisResult.reasoning,
        });
      } catch (err) {
        setError('Failed to analyze image. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }, [batchNumber, onAnalysisComplete]);
  
  const handleFeedback = () => {
    setFeedbackGiven(true);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white tracking-tight">Live Gender Prediction</h2>
        <p className="mt-2 text-gray-400">Use your camera for real-time gender prediction.</p>
      </div>
      
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl">
            <label htmlFor="batch-number-live" className="block text-sm font-medium text-gray-300 mb-2">Batch Number <span className="text-red-400">*</span></label>
            <input 
                type="text" 
                id="batch-number-live" 
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g., Batch-001A"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50"
                disabled={isCameraOn}
            />
        </div>

        <div className="relative w-full aspect-video bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${!isCameraOn && 'hidden'}`}></video>
          {!isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <div className="p-6 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-4">
                <Camera className="w-12 h-12 opacity-50" />
              </div>
              <p className="text-sm font-medium">Camera is inactive</p>
            </div>
          )}
          
          {/* Scanning Overlay */}
          {isCameraOn && !loading && !capturedImage && (
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-indigo-500/10 to-transparent animate-scan" />
                <div className="absolute inset-0 border-2 border-white/20 rounded-2xl" />
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-indigo-500 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-indigo-500 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-indigo-500 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-indigo-500 rounded-br-lg" />
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {!isCameraOn ? (
            <button 
                onClick={startCamera} 
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20"
            >
              <Camera className="w-5 h-5" /> Start Camera
            </button>
          ) : (
            <>
              <button 
                onClick={handleCaptureAndAnalyze} 
                disabled={loading || !batchNumber.trim()} 
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <Zap className="w-5 h-5" />
                )}
                Capture & Predict
              </button>
              <button 
                onClick={stopCamera} 
                className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 font-bold py-4 px-6 rounded-xl transition-all duration-300 backdrop-blur-md"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center p-8 glass-panel rounded-2xl"
                >
                    <div className="inline-block w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-gray-300 font-medium">Analyzing captured frame... AI is working its magic!</p>
                </motion.div>
            )}

            {!loading && error && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl"
                >
                    <AlertTriangle className="w-5 h-5" /> {error}
                </motion.div>
            )}
            
            {!loading && capturedImage && result && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="p-2 glass-panel rounded-2xl inline-block w-full">
                        <img src={capturedImage} alt="Captured egg" className="w-full max-h-80 object-contain rounded-xl" />
                    </div>

                    <ResultCard result={result} onFeedback={handleFeedback} />

                    {feedbackGiven && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 p-4 rounded-xl"
                        >
                            <CheckCircle2 className="w-5 h-5"/> Thank you! Your feedback helps us improve.
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveAnalyzer;