import React, { useState } from 'react';
import { FaTh, FaList, FaSearch, FaTimes } from 'react-icons/fa';
import StudySetCard, { StudySet } from './StudySetCard';
import { StudySetCardSkeleton } from '../ui/Skeleton';
import { useLanguage } from '../../utils/LanguageContext';

interface StudySetListProps {
  studySets: StudySet[];
  loading?: boolean;
  totalCount?: number;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSetClick?: (set: StudySet) => void;
  onDragStart?: (e: React.DragEvent, set: StudySet) => void;
  onMove?: (set: StudySet) => void;
  onRename?: (set: StudySet, newName: string) => void;
  onDelete?: (set: StudySet) => void;
}

const StudySetList: React.FC<StudySetListProps> = ({ studySets, loading = false, totalCount, searchQuery: searchQueryProp = '', onSearchChange, onSetClick, onDragStart, onMove, onRename, onDelete }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearch, setLocalSearch] = useState('');
  const { t } = useLanguage();

  // If parent manages search, use parent state; otherwise use local state
  const searchQuery = onSearchChange ? searchQueryProp : localSearch;
  const setSearchQuery = onSearchChange ?? setLocalSearch;

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
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
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-indigo-600 dark:bg-white rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('sidebar.allStudySets')}</h2>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a1a] px-2.5 py-1 rounded-full font-medium border border-gray-200 dark:border-white/10">
                  {searchQuery.trim()
                    ? `${studySets.length} result${studySets.length === 1 ? '' : 's'}`
                    : `${totalCount ?? studySets.length} ${(totalCount ?? studySets.length) === 1 ? 'project' : 'projects'}`}
                </span>
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

        {/* Search Bar */}
        <div className="relative mb-5">
            <FaSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${t('common.search')} study sets…`}
              className="w-full pl-9 pr-9 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FaTimes size={12} />
              </button>
            )}
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
            {!loading && studySets.length === 0 && searchQuery.trim() && (
              <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
                <FaSearch size={24} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No study sets found for "<span className="font-semibold">{searchQuery}</span>"</p>
              </div>
            )}
        </div>
    </div>
  );
};

export default StudySetList;
