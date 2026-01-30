import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUpload, FaLink, FaMicrophone, FaCheck, FaBook, FaListUl, FaLayerGroup, FaPodcast, FaChalkboardTeacher, FaPencilAlt, FaEdit, FaChevronDown } from 'react-icons/fa';

// --- Base Modal Component ---
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, subtitle, children, width = "max-w-2xl" }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 w-full ${width} shadow-2xl overflow-hidden`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="pr-8">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors absolute top-6 right-6">
                <FaTimes />
              </button>
            </div>
            <div className="mt-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Upload Modal ---
export const UploadModal: React.FC<{ isOpen: boolean; onClose: () => void; onNext: () => void }> = ({ isOpen, onClose, onNext }) => {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setUploadState('idle');
      setProgress(0);
    }
  }, [isOpen]);

  const handleUploadClick = () => {
    if (uploadState === 'idle') {
      setUploadState('uploading');
      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploadState('complete');
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    }
  };

  return (
    <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Please upload your file" 
        subtitle="We will turn your file into insane study material"
    >
      {uploadState === 'idle' ? (
        <div 
            onClick={handleUploadClick}
            className="border-2 border-dashed border-white/10 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-white/20 transition-colors bg-[#111] cursor-pointer group"
        >
            <div className="w-16 h-16 bg-[#2a1a10] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FaUpload className="text-2xl text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Click to upload or drag and drop up to 5 files</h3>
            <p className="text-sm text-gray-500">Image, PDF, Word, PowerPoint, Audio, or Video files</p>
        </div>
      ) : (
        <div className="bg-[#111] border border-dashed border-white/10 rounded-xl p-8">
            <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300 font-medium">{uploadState === 'complete' ? 'Upload Complete' : 'Uploading...'} 1 file</span>
                <span className="text-gray-400 text-sm">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-[#c2410c] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
         <button 
            onClick={onNext}
            disabled={uploadState !== 'complete'}
            className={`px-8 py-2.5 rounded-lg font-medium transition-colors ${uploadState === 'complete' ? 'bg-[#c2410c] hover:bg-[#9a3412] text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
         >
            Next
         </button>
      </div>
    </BaseModal>
  );
};

// --- Paste Modal ---
export const PasteModal: React.FC<{ isOpen: boolean; onClose: () => void; onNext: () => void }> = ({ isOpen, onClose, onNext }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add Content" subtitle="Enter a URL or paste text to create your study set">
      <div className="space-y-6">
         <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Enter a YouTube/Website URL</label>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLink className="text-gray-500" />
               </div>
               <input 
                 type="text" 
                 placeholder="https://youtu.be/..." 
                 className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
               />
            </div>
         </div>

         <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">or</span>
            <div className="flex-grow border-t border-white/10"></div>
         </div>

         <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Copy and paste text to add as content</label>
            <textarea 
               placeholder="Paste your notes here" 
               className="w-full h-40 bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            ></textarea>
            <div className="flex justify-end mt-2">
               <span className="text-xs text-gray-500">0/50000</span>
            </div>
         </div>

         <div className="flex justify-end mt-2">
            <button 
                onClick={onNext}
                className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-8 py-2.5 rounded-lg font-medium transition-colors"
            >
               Next
            </button>
         </div>
      </div>
    </BaseModal>
  );
};

// --- Record Modal ---
export const RecordModal: React.FC<{ isOpen: boolean; onClose: () => void; onNext: () => void }> = ({ isOpen, onClose, onNext }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Record Audio" subtitle="Record your lecture, notes, or study material">
       <div className="py-12 flex flex-col items-center justify-center">
          <button className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/20 hover:scale-105 transition-transform mb-6">
             <FaMicrophone className="text-4xl text-white" />
          </button>
          <h3 className="text-xl font-bold text-white mb-2">Ready to Record</h3>
          <p className="text-gray-500">Click the microphone to start recording</p>
       </div>
       <div className="flex justify-end mt-4">
            <button 
                onClick={onNext}
                className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-8 py-2.5 rounded-lg font-medium transition-colors"
            >
               Next
            </button>
       </div>
    </BaseModal>
  );
};

// --- Method Selection Modal ---
interface MethodOption {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export const MethodSelectionModal: React.FC<{ isOpen: boolean; onClose: () => void; onGenerate: (selectedMethods: string[]) => void }> = ({ isOpen, onClose, onGenerate }) => {
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
    
    const methods: MethodOption[] = [
        { id: 'notes', label: 'Notes', icon: <FaBook /> },
        { id: 'multiple-choice', label: 'Multiple Choice', icon: <FaListUl /> },
        { id: 'flashcards', label: 'Flashcards', icon: <FaLayerGroup /> },
        { id: 'podcast', label: 'Podcast', icon: <FaPodcast /> },
        { id: 'tutor-lesson', label: 'Tutor Lesson', icon: <FaChalkboardTeacher /> },
        { id: 'written-tests', label: 'Written Tests', icon: <FaPencilAlt /> },
        { id: 'fill-blanks', label: 'Fill in the Blanks', icon: <FaEdit /> },
    ];

    const toggleMethod = (id: string) => {
        if (selectedMethods.includes(id)) {
            setSelectedMethods(selectedMethods.filter(m => m !== id));
        } else {
            setSelectedMethods([...selectedMethods, id]);
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="What would you like to include?" subtitle="Choose all the methods you want included in your study set:" width="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {methods.map((method) => {
                    const isSelected = selectedMethods.includes(method.id);
                    return (
                        <div 
                            key={method.id}
                            onClick={() => toggleMethod(method.id)}
                            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                                isSelected 
                                ? 'bg-[#1a1a1a] border-white/20' 
                                : 'bg-[#0f0f0f] border-white/5 hover:border-white/10'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-colors ${
                                isSelected ? 'bg-indigo-500/20 text-indigo-500' : 'bg-gray-800/50 text-gray-500'
                            }`}>
                                {isSelected ? <FaCheck size={14} /> : method.icon}
                            </div>
                            <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                {method.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between items-center border-t border-white/10 pt-6">
                 {/* Language Selector */}
                 <div className="relative">
                    <button className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-4 py-2 rounded-lg text-sm text-white hover:bg-[#252525] transition-colors">
                        <span>🇺🇸</span>
                        <span>English</span>
                        <FaChevronDown size={10} className="text-gray-500 ml-2" />
                    </button>
                 </div>

                 <button 
                    onClick={() => onGenerate(selectedMethods)}
                    className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-10 py-3 rounded-lg font-bold transition-colors"
                 >
                    Generate
                 </button>
            </div>
        </BaseModal>
    );
};


// --- Create Folder Modal ---
interface CreateFolderModalProps {
   isOpen: boolean;
   onClose: () => void;
   onCreate: (name: string, color: string) => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onCreate }) => {
   const [folderName, setFolderName] = useState('');
   const [selectedColor, setSelectedColor] = useState('bg-gray-500');

   const colors = [
      'bg-gray-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500', 'bg-sky-500',
      'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500', 'bg-blue-500', 'bg-cyan-500'
   ];

   const handleSubmit = () => {
      if (folderName.trim()) {
         onCreate(folderName, selectedColor);
         setFolderName('');
         onClose();
      }
   };

   return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Create New Folder" width="max-w-md">
         <div className="space-y-6">
            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Folder Name</label>
               <input 
                 type="text" 
                 value={folderName}
                 onChange={(e) => setFolderName(e.target.value)}
                 placeholder="Enter folder name..." 
                 className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
               />
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Choose Color</label>
               <div className="grid grid-cols-6 gap-3">
                  {colors.map((color) => (
                     <button 
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full ${color} transition-transform hover:scale-110 flex items-center justify-center ${selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f0f]' : ''}`}
                     />
                  ))}
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
               <button onClick={onClose} className="px-6 py-2.5 text-gray-400 hover:text-white font-medium transition-colors">
                  Cancel
               </button>
               <button 
                 onClick={handleSubmit}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
               >
                  + Create Folder
               </button>
            </div>
         </div>
      </BaseModal>
   );
};
