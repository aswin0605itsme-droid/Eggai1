import React from 'react';
import type { GenderPredictionResult } from '../types';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ResultCardProps {
  result: GenderPredictionResult;
  onFeedback: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onFeedback }) => {
  const { predictedGender, confidence, reasoning } = result;

  const getGenderColor = () => {
    switch (predictedGender) {
      case 'Male': return 'from-blue-500 to-cyan-500';
      case 'Female': return 'from-pink-500 to-rose-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'High': return 'text-emerald-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-8 rounded-3xl relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getGenderColor()} opacity-20 blur-[50px] rounded-full -mr-10 -mt-10`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Prediction Result</h3>
            <div className="flex items-center gap-3">
              <span className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${getGenderColor()}`}>
                {predictedGender}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                confidence === 'High' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                confidence === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' :
                'bg-red-500/10 border-red-500/20 text-red-300'
              }`}>
                {confidence} Confidence
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${getGenderColor()} shadow-lg`}>
            {predictedGender === 'Male' ? (
               <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="17" x2="12" y2="22"></line><line x1="9" y1="22" x2="15" y2="22"></line></svg>
            ) : predictedGender === 'Female' ? (
               <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M12 13v9"></path><path d="M9 19h6"></path></svg>
            ) : (
               <HelpCircle className="w-8 h-8 text-white" />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500" />
              AI Reasoning
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              {reasoning}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-sm text-gray-500 mb-4">Was this prediction accurate?</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={onFeedback} 
              className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-6 py-2.5 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4" /> Yes
            </button>
            <button 
              onClick={onFeedback} 
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-6 py-2.5 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <XCircle className="w-4 h-4" /> No
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;
