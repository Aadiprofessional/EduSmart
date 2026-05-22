import React, { useState } from 'react';
import { FaTh, FaList, FaSearch, FaTimes, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import StudySetCard, { StudySet } from './StudySetCard';
import { StudySetCardSkeleton } from '../ui/Skeleton';
import { useLanguage } from '../../utils/LanguageContext';

interface StudySetListProps {
  studySets: StudySet[];
  loading?: boolean;
  totalCount?: number;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSetClick?: (set: StudySet) => void;
  onDragStart?: (e: React.DragEvent, set: StudySet) => void;
  onMove?: (set: StudySet) => void;
  onRename?: (set: StudySet, newName: string) => void;
  onDelete?: (set: StudySet) => void;
}

const StudySetList: React.FC<StudySetListProps> = ({ studySets, loading = false, totalCount, itemsPerPage = 10, currentPage = 0, onPageChange, searchQuery: searchQueryProp = '', onSearchChange, onSetClick, onDragStart, onMove, onRename, onDelete }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearch, setLocalSearch] = useState('');
  const { t } = useLanguage();

  // If parent manages search, use parent state; otherwise use local state
  const searchQuery = onSearchChange ? searchQueryProp : localSearch;
  const setSearchQuery = onSearchChange ?? setLocalSearch;
  const computedTotalCount = totalCount ?? studySets.length;
  const totalPages = Math.max(1, Math.ceil(computedTotalCount / itemsPerPage));

  const getVisiblePageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const current = currentPage + 1;
    const pages: (number | 'ellipsis')[] = [1];

    if (current <= 4) {
      pages.push(2, 3, 4, 5, 'ellipsis', totalPages);
      return pages;
    }

    if (current >= totalPages - 3) {
      pages.push('ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      return pages;
    }

    pages.push('ellipsis', current - 1, current, current + 1, 'ellipsis', totalPages);
    return pages;
  };

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
        <div className="flex items-center justify-between mb-3 gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-1 h-6 bg-indigo-600 dark:bg-white rounded-full"></div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{t('sidebar.allStudySets')}</h2>
                <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a1a] px-2.5 py-1 rounded-full font-medium border border-gray-200 dark:border-white/10 whitespace-nowrap">
                  {searchQuery.trim()
                    ? `${studySets.length} result${studySets.length === 1 ? '' : 's'}`
                    : `${computedTotalCount} ${computedTotalCount === 1 ? 'project' : 'projects'}`}
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

        {/* Mobile count */}
        <div className="sm:hidden mb-2">
          <span className="inline-flex text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a1a] px-2.5 py-1 rounded-full font-medium border border-gray-200 dark:border-white/10">
            {searchQuery.trim()
              ? `${studySets.length} result${studySets.length === 1 ? '' : 's'}`
              : `${computedTotalCount} ${computedTotalCount === 1 ? 'project' : 'projects'}`}
          </span>
        </div>

        {/* Mobile pagination */}
        {!searchQuery.trim() && computedTotalCount > 0 && onPageChange && (
          <div className="sm:hidden mb-4 p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] flex items-center justify-between gap-2">
            <button
              onClick={() => onPageChange(0)}
              disabled={currentPage === 0}
              className="w-8 h-8 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Go to first page"
            >
              <FaAngleDoubleLeft size={10} />
            </button>
            <button
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="w-8 h-8 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Go to previous page"
            >
              <FaChevronLeft size={10} />
            </button>

            <div className="flex items-center gap-1.5">
              <span className="min-w-8 h-8 px-2 rounded-md bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center">
                {currentPage + 1}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">/ {totalPages}</span>
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="w-8 h-8 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Go to next page"
            >
              <FaChevronRight size={10} />
            </button>
            <button
              onClick={() => onPageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="w-8 h-8 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Go to last page"
            >
              <FaAngleDoubleRight size={10} />
            </button>
          </div>
        )}

        {/* Desktop pagination */}
        {!searchQuery.trim() && computedTotalCount > 0 && onPageChange && (
          <div className="hidden sm:flex items-center gap-2 mb-4 max-w-full md:max-w-[72vw] lg:max-w-[62vw] xl:max-w-[52vw] overflow-x-auto pb-1">
            <button
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="w-8 h-8 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
              aria-label="Go to previous page"
            >
              <FaChevronLeft size={10} />
            </button>

            <div className="flex items-center gap-1">
              {getVisiblePageNumbers().map((entry, idx) => {
                if (entry === 'ellipsis') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-8 h-8 flex items-center justify-center text-xs text-gray-400"
                    >
                      ...
                    </span>
                  );
                }

                const pageIndex = entry - 1;
                const isActive = pageIndex === currentPage;

                return (
                  <button
                    key={entry}
                    onClick={() => onPageChange(pageIndex)}
                    className={`min-w-8 h-8 px-2.5 rounded-md text-xs font-semibold border transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                        : 'bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#222]'
                    }`}
                    aria-label={`Go to page ${entry}`}
                  >
                    {entry}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="w-8 h-8 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
              aria-label="Go to next page"
            >
              <FaChevronRight size={10} />
            </button>

            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-1">
              Page {currentPage + 1} of {totalPages}
            </span>
          </div>
        )}

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
