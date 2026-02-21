import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Calculator, Egg, Menu, X, Download, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageAnalyzer from './components/ImageAnalyzer';
import LiveAnalyzer from './components/LiveAnalyzer';
import ShapeIndexCalculator from './components/ShapeIndexCalculator';
import AnalysisChart from './components/AnalysisChart';
import type { AnalysisRecord } from './types';

type Tab = 'image' | 'live' | 'calculator';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const [analysisRecords, setAnalysisRecords] = useState<AnalysisRecord[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      default:
        return <ImageAnalyzer onAnalysisComplete={handleNewRecord} />;
    }
  };

  const tabs = [
    { id: 'image', label: 'Analyze Image', icon: ImageIcon },
    { id: 'live', label: 'Live Camera', icon: Camera },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 z-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-600">
            <Egg className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">EggGenderAI</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-400 hover:text-white">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-purple-600 shadow-lg shadow-purple-900/20">
              <Egg className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              EggGenderAI
            </h1>
          </div>
          <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase ml-11">Next-Gen Poultry Analytics</p>
        </div>

        <nav className="px-4 mt-6 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  {tab.label}
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
           <a 
            href="https://github.com/aswin0605itsme-droid/Eggai1"
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Github className="w-4 h-4" />
            View Source
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-900 p-4 md:p-8 relative">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none z-0">
             <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[120px]" />
             <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Header Actions */}
          {analysisRecords.length > 0 && (
            <div className="flex justify-end mb-6">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700 transition-all text-sm font-medium shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </motion.button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>

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
      </main>
    </div>
  );
};

export default App;
