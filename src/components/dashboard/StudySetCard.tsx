import React, { useState, useRef, useEffect } from 'react';
import { 
  FaEllipsisH, 
  FaLayerGroup, 
  FaList, 
  FaTrash, 
  FaPen, 
  FaFileAlt, 
  FaHeadphones,
  FaBook,
  FaListUl,
  FaPodcast,
  FaMicrophone,
  FaProjectDiagram,
  FaEdit,
  FaPencilAlt,
  FaGraduationCap,
  FaFolderOpen
} from 'react-icons/fa';
import { RenameModal, DeleteModal } from './DashboardModals';
import { useLanguage } from '../../utils/LanguageContext';

export interface StudySet {
  id: number | string;
  title: string;
  stats: {
    unfamiliar: number;
    learning: number;
    mastered: number;
  };
  progress: number;
  totalCards: number;
  // Add optional boolean flags matching the database columns
  mindmap?: boolean;
  notes?: boolean;
  multiple_choice?: boolean;
  flashcards?: boolean;
  podcast?: boolean;
  tutor_lesson?: boolean;
  written_tests?: boolean;
  fill_in_the_blanks?: boolean;
  speech_to_text?: boolean;
  mindmap_col?: boolean;
  [key: string]: any;
}

interface StudySetCardProps {
  set: StudySet;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent, set: StudySet) => void;
  onMove?: (set: StudySet) => void;
  onRename?: (newName: string) => void;
  onDelete?: () => void;
}

const StudySetCard: React.FC<StudySetCardProps> = ({ set, viewMode = 'grid', onClick, onDragStart, onMove, onRename, onDelete }) => {
  const { t } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleRename = (newName: string) => {
    onRename?.(newName);
    setShowRenameModal(false);
  };

  const handleDelete = () => {
    onDelete?.();
    setShowDeleteModal(false);
  };

  const renderActionButtons = (size: number = 14) => {
      return (
          <>
            {set.notes && <ActionButton icon={<FaBook size={size} />} />}
            {set.multiple_choice && <ActionButton icon={<FaListUl size={size} />} />}
            {set.flashcards && <ActionButton icon={<FaLayerGroup size={size} />} />}
            {set.podcast && <ActionButton icon={<FaPodcast size={size} />} />}
            {set.speech_to_text && <ActionButton icon={<FaMicrophone size={size} />} />}
            {set.mindmap && <ActionButton icon={<FaProjectDiagram size={size} />} />}
            {set.fill_in_the_blanks && <ActionButton icon={<FaEdit size={size} />} />}
            {set.written_tests && <ActionButton icon={<FaPencilAlt size={size} />} />}
            {set.tutor_lesson && <ActionButton icon={<FaGraduationCap size={size} />} />}
            {/* Always show content icon as fallback or standard */}
            <ActionButton icon={<FaFileAlt size={size} />} />
          </>
      );
  };

  if (viewMode === 'list') {
      return (
        <div 
            draggable={!!onDragStart}
            onDragStart={(e) => onDragStart?.(e, set)}
            onClick={onClick}
            className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-white/20 transition-colors group flex flex-col md:flex-row items-center gap-6 shadow-sm dark:shadow-none cursor-pointer"
        >
            <div className="flex-1 min-w-0 w-full md:w-auto">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">{set.title}</h3>
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

            <div className="flex flex-col gap-3 w-full md:w-auto">
                <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                    <StatRow count={set.stats.unfamiliar} label={t('matrixDashboard.studySetCard.unfamiliar')} color="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20" compact />
                    <StatRow count={set.stats.learning} label={t('matrixDashboard.studySetCard.learning')} color="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20" compact />
                    <StatRow count={set.stats.mastered} label={t('matrixDashboard.studySetCard.mastered')} color="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20" compact />
                </div>

                <div className="flex gap-2 text-gray-400 dark:text-gray-500 w-full md:w-auto justify-center md:justify-end items-center overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {renderActionButtons(14)}
                    {onMove && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onMove(set); }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded hover:text-gray-900 dark:hover:text-white transition-colors ml-2 flex-shrink-0"
                        title={t('matrixDashboard.studySetCard.moveToFolder')}
                      >
                        <FaFolderOpen />
                      </button>
                    )}
                    <div className="relative" ref={dropdownRef}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded hover:text-gray-900 dark:hover:text-white transition-colors ml-2 flex-shrink-0"
                      >
                        <FaEllipsisH />
                      </button>
                      
                      {showDropdown && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 py-2 z-50">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setShowDropdown(false);
                              setShowRenameModal(true);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                          >
                            <FaPen size={12} />
                            {t('sidebar.rename')}
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setShowDropdown(false);
                              setShowDeleteModal(true);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <FaTrash size={12} />
                            {t('common.remove')}
                          </button>
                        </div>
                      )}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <>
      <div 
        draggable={!!onDragStart}
        onDragStart={(e) => onDragStart?.(e, set)}
        onClick={onClick}
        className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-white/20 transition-colors group shadow-sm dark:shadow-none cursor-pointer relative"
      >
        <div className="flex justify-between items-start mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate pr-2">{set.title}</h3>
            <div className="flex gap-2 flex-shrink-0 items-center">
              {onMove && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onMove(set); }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  title={t('matrixDashboard.studySetCard.moveToFolder')}
                >
                  <FaFolderOpen />
                </button>
              )}
              <div className="relative" ref={viewMode === 'grid' ? dropdownRef : undefined}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                >
                  <FaEllipsisH />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 py-2 z-50">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setShowDropdown(false);
                        setShowRenameModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                    >
                      <FaPen size={12} />
                      {t('sidebar.rename')}
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setShowDropdown(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <FaTrash size={12} />
                      {t('common.remove')}
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>

        <div className="space-y-2 mb-4 md:mb-6">
            <StatRow count={set.stats.unfamiliar} label={t('matrixDashboard.studySetCard.unfamiliar')} color="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20" />
            <StatRow count={set.stats.learning} label={t('matrixDashboard.studySetCard.learning')} color="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20" />
            <StatRow count={set.stats.mastered} label={t('matrixDashboard.studySetCard.mastered')} color="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20" />
        </div>

        <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between text-xs text-gray-500">
                <span>{t('matrixDashboard.studySetCard.pathToMastery')}</span>
            </div>
            {/* Progress Bar Row */}
            <div className="flex items-center gap-3 md:gap-4">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: `${set.progress}%` }}
                    ></div>
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white w-8 text-right">{set.progress}%</span>
            </div>
            
            {/* Action Buttons Row - Scrollable on mobile, wrapped on desktop if needed */}
            <div className="flex gap-2 text-gray-400 dark:text-gray-500 overflow-x-auto pb-1 no-scrollbar md:flex-wrap">
                {renderActionButtons(14)}
            </div>
        </div>
      </div>

      <RenameModal 
        isOpen={showRenameModal} 
        onClose={() => setShowRenameModal(false)} 
        onRename={handleRename} 
        currentName={set.title} 
        title={t('matrixDashboard.studySetCard.renameStudySet')}
      />

      <DeleteModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleDelete} 
        title={t('matrixDashboard.studySetCard.deleteStudySet')}
        message={t('matrixDashboard.studySetCard.deleteStudySetMessage', { values: { title: set.title } })}
      />
    </>
  );
};

const StatRow = ({ count, label, color, compact }: { count: number, label: string, color: string, compact?: boolean }) => (
    <div className={`flex items-center px-3 py-2 rounded-lg border ${color} ${compact ? 'py-1 px-2 text-xs' : ''}`}>
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
