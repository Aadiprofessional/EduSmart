import React from 'react';
import { FaUpload, FaFileAlt, FaChevronRight } from 'react-icons/fa';
import SidebarLeft from '../components/dashboard/SidebarLeft';

const GradePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#111111] text-white flex font-sans overflow-hidden">
      <SidebarLeft />
      
      <main className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto">
         <div className="max-w-4xl mx-auto w-full pt-12">
             <div className="text-center mb-16">
                 <h1 className="text-4xl font-bold mb-3">What do you want to grade?</h1>
                 <p className="text-gray-400">Grade your paper based on your rubric</p>
             </div>

             {/* Action Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 max-w-2xl mx-auto">
                 <button className="bg-[#111] border border-white/10 rounded-2xl p-8 text-left hover:bg-[#151515] hover:border-white/20 transition-all group">
                     <div className="mb-4 text-gray-400 group-hover:text-white transition-colors">
                         <FaUpload size={24} />
                     </div>
                     <h3 className="text-lg font-bold mb-1">Upload</h3>
                     <p className="text-sm text-gray-500">PDF, Word documents</p>
                 </button>

                 <button className="bg-[#111] border border-white/10 rounded-2xl p-8 text-left hover:bg-[#151515] hover:border-white/20 transition-all group">
                     <div className="mb-4 text-gray-400 group-hover:text-white transition-colors">
                         <FaFileAlt size={24} />
                     </div>
                     <h3 className="text-lg font-bold mb-1">Paste</h3>
                     <p className="text-sm text-gray-500">Copy and paste text</p>
                 </button>
             </div>

             {/* Your Grades Section */}
             <div>
                 <h2 className="text-xl font-bold mb-6">Your grades</h2>
                 
                 <div className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors cursor-pointer">
                     <div className="flex items-start justify-between mb-4">
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xl">
                                 ✍️
                             </div>
                             <div>
                                 <h3 className="font-bold mb-1">Analysis of Cell Structure and Function</h3>
                                 {/* Ellipsis menu would go here if needed */}
                             </div>
                         </div>
                         <button className="text-gray-500 hover:text-white">•••</button>
                     </div>
                     
                     <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">
                         The paper effectively identifies eukaryotic and prokaryotic cells, achieving a perfect score in this category. However, while it outlines major organelles, it lacks depth in their functions and roles, leading to a score of...
                     </p>

                     <div className="flex items-center justify-between pt-4 border-t border-white/5">
                         <button className="flex items-center gap-2 text-sm text-white font-medium hover:text-gray-300 transition-colors">
                             View Details <FaChevronRight size={10} />
                         </button>
                         <span className="font-bold">76%</span>
                     </div>
                 </div>
             </div>
         </div>
      </main>
    </div>
  );
};

export default GradePage;
