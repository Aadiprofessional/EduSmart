import React, { useState } from 'react';
import SidebarLeft from '../components/dashboard/SidebarLeft';
import StudyPlannerComponent from '../components/ui/StudyPlannerComponent';
import { FaBars } from 'react-icons/fa';

const StudyPlannerPage: React.FC = () => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white flex font-sans overflow-hidden">
      {/* Left Sidebar */}
      <SidebarLeft isOpen={isLeftSidebarOpen} onClose={() => setIsLeftSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
        
        {/* Mobile Sidebar Toggle */}
        <div className="absolute top-6 left-6 z-10">
            {!isLeftSidebarOpen && (
                <button 
                    onClick={() => setIsLeftSidebarOpen(true)} 
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors"
                >
                    <FaBars size={20} />
                </button>
            )}
        </div>

        {/* Study Planner Content */}
        <div className="flex-1 overflow-y-auto w-full h-full">
            <StudyPlannerComponent className="w-full h-full p-4 lg:p-8" />
        </div>
      </main>
    </div>
  );
};

export default StudyPlannerPage;
