import React, { useEffect, useState } from 'react';
import { getRecordsByUser } from '../services/storageService';
import type { AnalysisRecord, GenderPredictionResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { History, Calendar, Tag, ChevronRight, Search, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const HistoryViewer: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      if (user) {
        setLoading(true);
        const userRecords = await getRecordsByUser(user.id);
        setRecords(userRecords);
        setLoading(false);
      }
    };
    fetchRecords();
  }, [user]);

  const filteredRecords = records.filter(r => 
    r.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.analysisType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.inputSummary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="text-center p-10 text-gray-400">
        Please log in to view your history.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white tracking-tight">Analysis History</h2>
        <p className="mt-2 text-gray-400">Review your past egg analyses.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by batch number, type, or details..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No records found.</p>
          </div>
        ) : (
          filteredRecords.map((record, index) => (
            <motion.div 
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-panel p-6 rounded-xl hover:bg-white/10 transition-colors group"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/20 text-purple-300">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-500 bg-black/30 px-2 py-0.5 rounded">{record.batchNumber}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(record.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-white">
                      {(record.result as GenderPredictionResult).predictedGender}
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">{record.inputSummary}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                   <div className="text-right flex-1 md:flex-none">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Result</p>
                      <p className="text-sm font-medium text-white">
                        {(record.result as GenderPredictionResult).confidence + ' Confidence'}
                      </p>
                   </div>
                   <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-sm text-gray-400 italic">
                  "{(record.result as any).reasoning}"
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryViewer;
