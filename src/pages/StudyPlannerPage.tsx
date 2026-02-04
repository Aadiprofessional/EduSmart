import React, { useState, useEffect } from 'react';
import SidebarLeft from '../components/dashboard/SidebarLeft';
import StudyPlannerComponent from '../components/ui/StudyPlannerComponent';

const StudyPlannerPage: React.FC = () => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsLeftSidebarOpen(false);
      } else {
        setIsLeftSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white flex font-sans overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {(isLeftSidebarOpen && isMobile) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <SidebarLeft 
        isOpen={isLeftSidebarOpen} 
        onClose={() => setIsLeftSidebarOpen(false)}
        className="fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 shadow-2xl lg:shadow-none h-full"
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
        
        {/* Mobile Sidebar Toggle */}
        <div className="absolute top-6 left-6 z-10">
            {(!isLeftSidebarOpen || !isMobile) && (
                <button 
                    onClick={() => setIsLeftSidebarOpen(true)} 
                    className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm lg:hidden"
                >
                    ME
                </button>
            )}
        </div>

        {/* Study Planner Content */}
        <div className="flex-1 overflow-y-auto w-full h-full">
            <StudyPlannerComponent className="w-full min-h-full p-4 lg:p-8 pb-24 lg:pb-8" />
        </div>
      </main>
    </div>
  );
};

export default StudyPlannerPage;
