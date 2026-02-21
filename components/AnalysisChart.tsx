
import React, { useState, useMemo } from 'react';
import type { AnalysisRecord } from '../types';
import { BarChart3, User, UserCheck, Filter } from 'lucide-react';
import { motion } from 'motion/react';

interface AnalysisChartProps {
    records: AnalysisRecord[];
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ records }) => {
    const [selectedBatch, setSelectedBatch] = useState<string>('all');

    const uniqueBatches = useMemo(() => {
        return Array.from(new Set(records.map(r => r.batchNumber))).sort();
    }, [records]);

    const filteredRecords = useMemo(() => {
        return selectedBatch === 'all' 
            ? records 
            : records.filter(r => r.batchNumber === selectedBatch);
    }, [records, selectedBatch]);

    const genderCounts = filteredRecords.reduce((acc, record) => {
        if (record.gender === 'Male') {
            acc.Male++;
        } else if (record.gender === 'Female') {
            acc.Female++;
        }
        return acc;
    }, { Male: 0, Female: 0 });

    const total = genderCounts.Male + genderCounts.Female;
    
    // Calculate percentages based on the filtered total
    const malePercentage = total > 0 ? (genderCounts.Male / total) * 100 : 0;
    const femalePercentage = total > 0 ? (genderCounts.Female / total) * 100 : 0;

    const Bar = ({ label, count, percentage, color, icon }: { label: string; count: number; percentage: number; color: string; icon: React.ReactNode; }) => (
        <div className="flex flex-col items-center w-1/3 px-2">
            <div className="w-full flex items-end justify-center h-40 relative">
                <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`w-full max-w-[80px] rounded-t-xl ${color} relative group`}
                >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 px-2 py-1 rounded-lg text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {percentage.toFixed(1)}%
                    </div>
                </motion.div>
            </div>
            <div className="text-center mt-4">
                <div className="flex items-center justify-center gap-2 font-bold text-gray-200 mb-1">
                    {icon}
                    {label}
                </div>
                <p className="text-sm text-gray-500 font-mono">{count} Eggs</p>
            </div>
        </div>
    );

    if (records.length === 0) return null;

    return (
        <div className="glass-panel p-8 rounded-3xl" role="figure" aria-labelledby="chart-title">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h2 id="chart-title" className="text-xl font-semibold text-white flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    Analysis Summary
                </h2>
                
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 appearance-none cursor-pointer min-w-[160px]"
                    >
                        <option value="all">All Batches</option>
                        {uniqueBatches.map(batch => (
                            <option key={batch} value={batch}>{batch}</option>
                        ))}
                    </select>
                </div>
            </div>

            {total === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No records found for this batch.
                </div>
            ) : (
                <>
                    <div className="flex justify-around items-end border-b border-white/10 pb-8">
                        <Bar 
                            label="Male" 
                            count={genderCounts.Male} 
                            percentage={malePercentage} 
                            color="bg-gradient-to-t from-blue-600 to-cyan-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                            icon={<User className="w-4 h-4 text-blue-400"/>} 
                        />
                        <div className="h-32 w-px bg-white/10"></div>
                        <Bar 
                            label="Female" 
                            count={genderCounts.Female} 
                            percentage={femalePercentage} 
                            color="bg-gradient-to-t from-pink-600 to-rose-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]" 
                            icon={<UserCheck className="w-4 h-4 text-pink-400"/>} 
                        />
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400 font-medium">
                            Total Predictions: <span className="font-bold text-white text-lg ml-1">{total}</span>
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalysisChart;
