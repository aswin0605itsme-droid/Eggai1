
import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Download, Calculator, Github, Egg } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageAnalyzer from './components/ImageAnalyzer';
import LiveAnalyzer from './components/LiveAnalyzer';
import ExpertChat from './components/ExpertChat';
import ShapeIndexCalculator from './components/ShapeIndexCalculator';
import AnalysisChart from './components/AnalysisChart';
import type { AnalysisRecord } from './types';

type Tab = 'image' | 'live' | 'calculator' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const [analysisRecords, setAnalysisRecords] = useState<AnalysisRecord[]>([]);

  const handleNewRecord = (record: AnalysisRecord) => {
    setAnalysisRecords(prev => [...prev, record]);
  };
  
  const downloadCSV = () => {
    if (analysisRecords.length === 0) return;

    const formatCsvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

    const headers = ['Timestamp', 'Batch Number', 'Analysis Type', 'Predicted Gender', 'Confidence', 'AI Reasoning'];
    const rows = analysisRecords.map(r => 
      [
        formatCsvCell(r.timestamp),
        formatCsvCell(r.batchNumber),
        formatCsvCell(r.analysisType),
        formatCsvCell(r.gender),
        formatCsvCell(r.confidence),
        formatCsvCell(r.reasoning)
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `egg_gender_prediction_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'image':
        return <ImageAnalyzer onAnalysisComplete={handleNewRecord} />;
      case 'live':
        return <LiveAnalyzer onAnalysisComplete={handleNewRecord} />;
      case 'calculator':
        return <ShapeIndexCalculator onAnalysisComplete={handleNewRecord} />;
      case 'chat':
        return <ExpertChat />;
      default:
        return <ImageAnalyzer onAnalysisComplete={handleNewRecord} />;
    }
  };

  const tabs = [
    { id: 'image', label: 'Analyze Image', icon: ImageIcon },
    { id: 'live', label: 'Live Camera', icon: Camera },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'chat', label: 'Ask Expert', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <Egg className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  EggGender<span className="text-indigo-400">AI</span>
                </h1>
                <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Next-Gen Poultry Analytics</p>
              </div>
            </div>
            
             {analysisRecords.length > 0 && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md transition-all text-sm font-medium shadow-lg shadow-black/20"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Export CSV</span>
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <nav className="space-y-2 sticky top-24">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                      isActive 
                        ? 'text-white shadow-lg shadow-indigo-500/25' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeGlow"
                        className="absolute right-4 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 min-h-[600px] relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="p-6 sm:p-8 relative z-10"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {analysisRecords.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <AnalysisChart records={analysisRecords} />
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-8 text-center">
        <p className="text-gray-500 text-sm mb-4">&copy; {new Date().getFullYear()} AI Egg Gender Predictor. Precision Analytics.</p>
        <a 
          href="https://github.com/example/ai-egg-predictor"
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-white transition-colors text-sm"
        >
          <Github className="w-4 h-4" />
          View Source
        </a>
      </footer>
    </div>
  );
};

export default App;
