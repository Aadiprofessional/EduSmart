import React, { useState } from 'react';
import { FaTh, FaList } from 'react-icons/fa';
import StudySetCard, { StudySet } from './StudySetCard';
import { StudySetCardSkeleton } from '../ui/Skeleton';

interface StudySetListProps {
  studySets: StudySet[];
  loading?: boolean;
  onSetClick?: (set: StudySet) => void;
  onDragStart?: (e: React.DragEvent, set: StudySet) => void;
  onMove?: (set: StudySet) => void;
  onRename?: (set: StudySet, newName: string) => void;
  onDelete?: (set: StudySet) => void;
}

const StudySetList: React.FC<StudySetListProps> = ({ studySets, loading = false, onSetClick, onDragStart, onMove, onRename, onDelete }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-indigo-600 dark:bg-white rounded-full"></div>
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
            <div className="flex bg-gray-100 dark:bg-[#1a1a1a] rounded-lg p-1 border border-gray-200 dark:border-white/10">
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
        </div>
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(6)].map((_, i) => (
                <StudySetCardSkeleton key={i} />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-indigo-600 dark:bg-white rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Study Sets</h2>
            </div>
            <div className="flex bg-gray-100 dark:bg-[#1a1a1a] rounded-lg p-1 border border-gray-200 dark:border-white/10">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow dark:bg-white/10 dark:shadow-none text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'}`}
                >
                    <FaTh size={14} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow dark:bg-white/10 dark:shadow-none text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'}`}
                >
                    <FaList size={14} />
                </button>
            </div>
        </div>

        {/* Study Set Cards */}
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {studySets.map(set => (
                <StudySetCard 
                    key={set.id} 
                    set={set} 
                    viewMode={viewMode} 
                    onClick={() => onSetClick?.(set)}
                    onDragStart={onDragStart}
                    onMove={onMove}
                    onRename={(newName) => onRename?.(set, newName)}
                    onDelete={() => onDelete?.(set)}
                />
            ))}
        </div>
    </div>
  );
};

export default StudySetList;
