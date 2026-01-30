import React from 'react';
import { FaUpload, FaLink, FaMicrophone } from 'react-icons/fa';

interface ActionCardsProps {
    onUpload: () => void;
    onPaste: () => void;
    onRecord: () => void;
}

const ActionCards: React.FC<ActionCardsProps> = ({ onUpload, onPaste, onRecord }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        <ActionCard 
           icon={<FaUpload />} 
           title="Upload" 
           description="Image, file, audio, video" 
           onClick={onUpload}
        />
        <ActionCard 
           icon={<FaLink />} 
           title="Paste" 
           description="YouTube, website, text" 
           onClick={onPaste}
        />
        <ActionCard 
           icon={<FaMicrophone />} 
           title="Record" 
           description="Record live lecture" 
           onClick={onRecord}
        />
    </div>
  );
};

interface ActionCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, title, description, onClick }) => (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-[#151515] hover:border-gray-300 dark:hover:border-white/20 transition-all cursor-pointer group shadow-sm dark:shadow-none"
    >
        <div className="text-2xl mb-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{icon}</div>
        <h3 className="font-bold mb-1 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
    </div>
);

export default ActionCards;
