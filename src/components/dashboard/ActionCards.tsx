import React from 'react';
import { FaUpload, FaLink, FaMicrophone, FaRegClipboard } from 'react-icons/fa';
import { useLanguage } from '../../utils/LanguageContext';

interface ActionCardsProps {
    onUpload: () => void;
    onUrl: () => void;
    onText: () => void;
    onRecord: () => void;
    isCompact?: boolean;
}

const ActionCards: React.FC<ActionCardsProps> = ({ onUpload, onUrl, onText, onRecord, isCompact = false }) => {
  const { t } = useLanguage();

  return (
    <div className={`grid grid-cols-4 gap-2 md:gap-4 transition-all duration-300 ${isCompact ? 'mb-4' : 'mb-8 md:mb-16'}`}>
        <ActionCard 
           icon={<FaUpload />} 
           title={t('matrixDashboard.actionCards.upload.title')} 
           description={t('matrixDashboard.actionCards.upload.description')} 
           onClick={onUpload}
           isCompact={isCompact}
        />
        <ActionCard 
           icon={<FaLink />} 
           title={t('matrixDashboard.actionCards.url.title')} 
           description={t('matrixDashboard.actionCards.url.description')} 
           onClick={onUrl}
           isCompact={isCompact}
        />
        <ActionCard 
           icon={<FaRegClipboard />} 
           title={t('matrixDashboard.actionCards.text.title')} 
           description={t('matrixDashboard.actionCards.text.description')} 
           onClick={onText}
           isCompact={isCompact}
        />
        <ActionCard 
           icon={<FaMicrophone />} 
           title={t('matrixDashboard.actionCards.record.title')} 
           description={t('matrixDashboard.actionCards.record.description')} 
           onClick={onRecord}
           isCompact={isCompact}
        />
    </div>
  );
};

interface ActionCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick?: () => void;
    isCompact?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, title, description, onClick, isCompact }) => (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl md:rounded-2xl 
        ${isCompact ? 'p-2 sm:p-3 flex flex-row items-center justify-center sm:gap-3' : 'p-3 md:p-6 flex flex-col'} 
        hover:bg-gray-50 dark:hover:bg-[#151515] hover:border-gray-300 dark:hover:border-white/20 transition-all cursor-pointer group shadow-sm dark:shadow-none h-full`}
    >
        <div className={`${isCompact ? 'text-lg mb-0' : 'text-xl md:text-2xl mb-2 md:mb-4'} text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex-shrink-0`}>{icon}</div>
        <div className={isCompact ? 'text-left hidden sm:block' : ''}>
            <h3 className={`${isCompact ? 'text-sm' : 'text-sm md:text-base'} font-bold mb-0 md:mb-1 text-gray-900 dark:text-white`}>{title}</h3>
            {!isCompact && <p className="text-[10px] md:text-xs text-gray-500 leading-tight block">{description}</p>}
        </div>
    </div>
);

export default ActionCards;
