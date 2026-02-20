
import React from 'react';
import type { AnalysisRecord } from '../types';
import { BarChart3, User, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface AnalysisChartProps {
    records: AnalysisRecord[];
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ records }) => {
    const genderCounts = records.reduce((acc, record) => {
        if (record.gender === 'Male') {
            acc.Male++;
        } else if (record.gender === 'Female') {
            acc.Female++;
        }
        return acc;
    }, { Male: 0, Female: 0 });

    const total = genderCounts.Male + genderCounts.Female;
    if (total === 0) return null;

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

    return (
        <div className="glass-panel p-8 rounded-3xl" role="figure" aria-labelledby="chart-title">
            <h2 id="chart-title" className="text-xl font-semibold text-white mb-8 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <BarChart3 className="w-5 h-5" />
                </div>
                Analysis Summary
            </h2>
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
        </div>
    );
};

export default AnalysisChart;
