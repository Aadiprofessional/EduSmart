import React from 'react';
import { 
  FaEllipsisH, 
  FaLayerGroup, 
  FaList, 
  FaTrash, 
  FaPen, 
  FaFileAlt, 
  FaHeadphones 
} from 'react-icons/fa';

export interface StudySet {
  id: number | string;
  title: string;
  stats: {
    unfamiliar: number;
    learning: number;
    familiar: number;
    mastered: number;
  };
  progress: number;
  totalCards: number;
}

interface StudySetCardProps {
  set: StudySet;
  viewMode?: 'grid' | 'list';
}

const StudySetCard: React.FC<StudySetCardProps> = ({ set, viewMode = 'grid' }) => {
  if (viewMode === 'list') {
      return (
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-4 hover:border-gray-300 dark:hover:border-white/20 transition-colors group flex flex-col md:flex-row items-center gap-6 shadow-sm dark:shadow-none">
            <div className="flex-1 min-w-0 w-full md:w-auto">
                <div className="flex justify-between items-center mb-2 md:mb-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{set.title}</h3>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden max-w-xs">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${set.progress}%` }}
                        ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{set.progress}%</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
                <StatRow count={set.stats.unfamiliar} label="Unfamiliar" color="bg-red-900/30 text-red-400 border-red-500/20" compact />
                <StatRow count={set.stats.learning} label="Learning" color="bg-indigo-900/30 text-indigo-400 border-indigo-500/20" compact />
                <StatRow count={set.stats.familiar} label="Familiar" color="bg-blue-900/30 text-blue-400 border-blue-500/20" compact />
                <StatRow count={set.stats.mastered} label="Mastered" color="bg-green-900/30 text-green-400 border-green-500/20" compact />
            </div>

            <div className="flex gap-2 text-gray-400 dark:text-gray-500 ml-auto">
                <ActionButton icon={<FaLayerGroup size={14} />} />
                <ActionButton icon={<FaList size={14} />} />
                <ActionButton icon={<FaTrash size={14} />} />
                <ActionButton icon={<FaPen size={14} />} />
                <ActionButton icon={<FaFileAlt size={14} />} />
                <ActionButton icon={<FaHeadphones size={14} />} />
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded hover:text-gray-900 dark:hover:text-white transition-colors ml-2">
                    <FaEllipsisH />
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-white/20 transition-colors group shadow-sm dark:shadow-none">
        <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{set.title}</h3>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"><FaEllipsisH /></button>
        </div>

        <div className="space-y-2 mb-6">
            <StatRow count={set.stats.unfamiliar} label="Unfamiliar" color="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20" />
            <StatRow count={set.stats.learning} label="Learning" color="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20" />
            <StatRow count={set.stats.familiar} label="Familiar" color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20" />
            <StatRow count={set.stats.mastered} label="Mastered" color="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20" />
        </div>

        <div className="space-y-4">
            <div className="flex justify-between text-xs text-gray-500">
                <span>Your path to mastery</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: `${set.progress}%` }}
                    ></div>
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{set.progress}%</span>
                
                <div className="flex gap-2 text-gray-400 dark:text-gray-500">
                    <ActionButton icon={<FaLayerGroup size={12} />} />
                    <ActionButton icon={<FaList size={12} />} />
                    <ActionButton icon={<FaTrash size={12} />} />
                    <ActionButton icon={<FaPen size={12} />} />
                    <ActionButton icon={<FaFileAlt size={12} />} />
                    <ActionButton icon={<FaHeadphones size={12} />} />
                </div>
            </div>
        </div>
    </div>
  );
};

const StatRow = ({ count, label, color, compact }: { count: number, label: string, color: string, compact?: boolean }) => (
    <div className={`flex items-center px-3 py-2 rounded-lg border ${color} bg-opacity-10 ${compact ? 'py-1 px-2 text-xs' : ''}`}>
        <span className={`font-mono font-bold ${compact ? 'text-xs mr-2' : 'text-sm w-8'}`}>{count}</span>
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium opacity-90`}>{label}</span>
    </div>
);

const ActionButton = ({ icon }: { icon: React.ReactNode }) => (
    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded hover:text-gray-900 dark:hover:text-white transition-colors">
        {icon}
    </button>
);

export default StudySetCard;
