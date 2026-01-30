import React, { useState } from 'react';
import { FaArrowUp, FaChevronRight, FaChevronLeft, FaRegEdit, FaHistory, FaImage } from 'react-icons/fa';
import SidebarLeft from '../components/dashboard/SidebarLeft';

const SolvePage: React.FC = () => {
  const subjects = ['Psychology', 'Physics', 'Biology', 'Math', 'General', 'Chemistry', 'Language', 'History'];
  const [scrollX, setScrollX] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
      // Logic for scrolling if needed in real implementation
      // For now we just mock the UI visual
      console.log('Scroll', direction);
  };

  return (
    <div className="h-screen bg-[#111111] text-white flex font-sans overflow-hidden">
      <SidebarLeft />
      
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
         {/* Top Icons - Absolute Positioned */}
         <button className="absolute top-8 left-8 p-2 text-gray-400 hover:text-white transition-colors">
            <FaRegEdit size={22} />
         </button>
         
         <button className="absolute top-8 right-8 p-2 text-gray-400 hover:text-white transition-colors">
            <FaHistory size={22} />
         </button>

         <div className="max-w-3xl w-full flex flex-col items-center">
             
             {/* Header Section */}
             <div className="w-full flex justify-center items-center mb-16 px-4">
                 <h1 className="text-4xl font-bold text-center mt-2 tracking-tight">What do you want to solve?</h1>
             </div>

             {/* Subject Pills */}
             <div className="flex items-center justify-center gap-4 mb-12">
                 <button onClick={() => scroll('left')} className="text-gray-500 hover:text-gray-300 transition-colors">
                     <FaChevronLeft size={12} />
                 </button>
                 
                 <div className="flex items-center gap-2">
                     {subjects.map(subject => (
                         <button 
                           key={subject}
                           className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                               subject === 'Biology' 
                               ? 'bg-[#27272a] text-white' 
                               : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                           }`}
                         >
                             {subject}
                         </button>
                     ))}
                 </div>
                 
                 <button onClick={() => scroll('right')} className="text-gray-500 hover:text-gray-300 transition-colors">
                     <FaChevronRight size={12} />
                 </button>
             </div>

             {/* Input Area */}
             <div className="w-full relative flex flex-col items-center">
                 
                 {/* Drag & Drop Zone - Positioned to peek out from behind */}
                 <div className="w-[98%] bg-[#111111] border border-dashed border-gray-800 rounded-t-3xl rounded-b-lg h-32 flex flex-col items-center justify-start pt-6 cursor-pointer hover:bg-white/5 hover:border-gray-600 transition-all group z-0 mb-[-45px]">
                     <div className="mb-2 relative">
                        <FaImage className="text-gray-500 group-hover:text-gray-400 transition-colors" size={20} />
                     </div>
                     <span className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">Drag & drop or click to add an image</span>
                 </div>
                 
                 {/* Input Box - Sits on top */}
                 <div className="w-full bg-[#171617] rounded-[32px] p-2 border border-white/5 shadow-2xl z-10 relative">
                     <div className="relative px-4 pb-2 flex items-end gap-2">
                         <textarea 
                           placeholder="Type your question here..." 
                           className="w-full bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none text-lg resize-none py-4 min-h-[64px]"
                           rows={1}
                         />
                         <button className="mb-2 bg-[#3f3f46] hover:bg-[#52525b] text-black p-2 rounded-full transition-colors flex-shrink-0 flex items-center justify-center w-8 h-8">
                             <FaArrowUp size={14} className="text-black" />
                         </button>
                     </div>
                 </div>
             </div>
             
         </div>
      </main>
    </div>
  );
};

export default SolvePage;
