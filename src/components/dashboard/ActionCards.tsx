import React from 'react';
import { FaUpload, FaLink, FaMicrophone } from 'react-icons/fa';

interface ActionCardsProps {
    onUpload: () => void;
    onPaste: () => void;
    onRecord: () => void;
    isCompact?: boolean;
}

const ActionCards: React.FC<ActionCardsProps> = ({ onUpload, onPaste, onRecord, isCompact = false }) => {
  return (
    <div className={`grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4 transition-all duration-300 ${isCompact ? 'mb-4' : 'mb-8 md:mb-16'}`}>
        <ActionCard 
           icon={<FaUpload />} 
           title="Upload" 
           description="Image, file, audio, video" 
           onClick={onUpload}
           isCompact={isCompact}
        />
        <ActionCard 
           icon={<FaLink />} 
           title="Paste" 
           description="YouTube, website, text" 
           onClick={onPaste}
           isCompact={isCompact}
        />
        <ActionCard 
           icon={<FaMicrophone />} 
           title="Record" 
           description="Record live lecture" 
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
        ${isCompact ? 'p-3 flex flex-row items-center gap-3' : 'p-3 md:p-6 flex flex-col'} 
        hover:bg-gray-50 dark:hover:bg-[#151515] hover:border-gray-300 dark:hover:border-white/20 transition-all cursor-pointer group shadow-sm dark:shadow-none h-full`}
    >
        <div className={`${isCompact ? 'text-lg mb-0' : 'text-xl md:text-2xl mb-2 md:mb-4'} text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors`}>{icon}</div>
        <div className={isCompact ? 'text-left' : ''}>
            <h3 className={`${isCompact ? 'text-sm' : 'text-sm md:text-base'} font-bold mb-0 md:mb-1 text-gray-900 dark:text-white`}>{title}</h3>
            {!isCompact && <p className="text-[10px] md:text-xs text-gray-500 leading-tight block">{description}</p>}
        </div>
    </div>
);

export default ActionCards;
