import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUpload, FaLink, FaMicrophone, FaCheck, FaBook, FaListUl, FaLayerGroup, FaPodcast, FaChalkboardTeacher, FaPencilAlt, FaEdit, FaChevronDown, FaStop, FaPlay, FaPause } from 'react-icons/fa';
import { useAuth } from '../../utils/AuthContext';
import { uploadService, UploadPayload } from '../../services/uploadService';

// --- Base Modal Component ---
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, subtitle, children, width = "max-w-2xl" }) => {
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
            className={`relative bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full ${width} shadow-2xl overflow-hidden`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="pr-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors absolute top-6 right-6">
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
export const UploadModal: React.FC<{ isOpen: boolean; onClose: () => void; onNext: (payload: UploadPayload) => void }> = ({ isOpen, onClose, onNext }) => {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [payload, setPayload] = useState<UploadPayload | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setUploadState('idle');
      setProgress(0);
      setPayload(null);
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
        const file = e.target.files[0];
        setUploadState('uploading');
        setProgress(10); // Start progress

        try {
            let resultPayload: UploadPayload;
            const uid = user.id;

            if (file.type.startsWith('audio/')) {
                resultPayload = await uploadService.constructAudioPayload(file, uid);
                resultPayload.uploadedFileType = 'audio';
            } else if (file.type.startsWith('video/')) {
                resultPayload = await uploadService.constructVideoPayload(file, uid);
                resultPayload.uploadedFileType = 'video';
            } else {
                // Default to document for everything else (pdf, doc, image, etc.)
                resultPayload = await uploadService.constructDocumentPayload(file, uid);
                // uploadedFileType is already set inside constructDocumentPayload for documents/images
            }

            setPayload(resultPayload);
            setProgress(100);
            setUploadState('complete');
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadState('error');
        }
    } else if (!user) {
        alert("Please sign in to upload files.");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Please upload your file" 
        subtitle="We will turn your file into insane study material"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
      />
      {uploadState === 'idle' || uploadState === 'error' ? (
        <div 
            onClick={handleUploadClick}
            className={`border-2 border-dashed ${uploadState === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111]'} rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-gray-300 dark:hover:border-white/20 transition-colors cursor-pointer group`}
        >
            <div className={`w-16 h-16 ${uploadState === 'error' ? 'bg-red-100 dark:bg-red-900/40 text-red-500' : 'bg-indigo-50 dark:bg-[#2a1a10] text-indigo-500'} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
            {uploadState === 'error' ? <FaTimes className="text-2xl" /> : <FaUpload className="text-2xl" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{uploadState === 'error' ? 'Upload Failed. Try Again.' : 'Click to upload or drag and drop up to 5 files'}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Image, PDF, Word, PowerPoint, Audio, or Video files</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111] border border-dashed border-gray-200 dark:border-white/10 rounded-xl p-8">
            <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{uploadState === 'complete' ? 'Upload Complete' : 'Uploading...'} 1 file</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-[#c2410c] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
         <button 
            onClick={() => payload && onNext(payload)}
            disabled={uploadState !== 'complete' || !payload}
            className={`px-8 py-2.5 rounded-lg font-medium transition-colors ${uploadState === 'complete' ? 'bg-[#c2410c] hover:bg-[#9a3412] text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
         >
            Next
         </button>
      </div>
    </BaseModal>
  );
};

// --- Paste Modal ---
export const PasteModal: React.FC<{ isOpen: boolean; onClose: () => void; onNext: (payload: UploadPayload) => void }> = ({ isOpen, onClose, onNext }) => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  const handleNext = () => {
    if (!user) {
        alert("Please sign in.");
        return;
    }

    if (url) {
        const payload = uploadService.constructUrlPayload(url, user.id);
        onNext(payload);
    } else if (text) {
        const payload = uploadService.constructTextPayload(text, user.id);
        onNext(payload);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add Content" subtitle="Enter a URL or paste text to create your study set">
      <div className="space-y-6">
         <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter a YouTube/Website URL</label>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLink className="text-gray-400 dark:text-gray-500" />
               </div>
               <input 
                 type="text" 
                 value={url}
                 onChange={(e) => setUrl(e.target.value)}
                 disabled={!!text}
                 placeholder="https://youtu.be/..." 
                 className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
               />
            </div>
         </div>

         <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
         </div>

         <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Copy and paste text to add as content</label>
            <textarea 
               value={text}
               onChange={(e) => setText(e.target.value)}
               disabled={!!url}
               placeholder="Paste your notes here" 
               className="w-full h-40 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none disabled:opacity-50"
            ></textarea>
            <div className="flex justify-end mt-2">
               <span className="text-xs text-gray-500">{text.length}/50000</span>
            </div>
         </div>

         <div className="flex justify-end mt-2">
            <button 
                onClick={handleNext}
                disabled={(!url && !text) || !user}
                className={`px-8 py-2.5 rounded-lg font-medium transition-colors ${(!url && !text) || !user ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-[#c2410c] hover:bg-[#9a3412] text-white'}`}
            >
               Next
            </button>
         </div>
      </div>
    </BaseModal>
  );
};

// --- Record Modal ---
export const RecordModal: React.FC<{ isOpen: boolean; onClose: () => void; onNext: (payload: UploadPayload) => void }> = ({ isOpen, onClose, onNext }) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
        setAudioBlob(null);
        setIsRecording(false);
        setTimer(0);
        if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            setAudioBlob(blob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        
        timerRef.current = setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);

    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = async () => {
    if (!user || !audioBlob) return;
    
    setIsProcessing(true);
    try {
        const file = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
        const payload = await uploadService.constructAudioPayload(file, user.id);
        payload.uploadedFileType = 'audio';
        onNext(payload);
    } catch (error) {
        console.error("Error uploading recording:", error);
        alert("Failed to upload recording.");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Record Audio" subtitle="Record your lecture, notes, or study material">
       <div className="py-12 flex flex-col items-center justify-center">
          {!audioBlob ? (
              <>
                <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 mb-6 ${isRecording ? 'bg-red-500 shadow-red-900/20 animate-pulse' : 'bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-900/20'}`}
                >
                    {isRecording ? <FaStop className="text-4xl text-white" /> : <FaMicrophone className="text-4xl text-white" />}
                </button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{isRecording ? 'Recording...' : 'Ready to Record'}</h3>
                <p className="text-gray-500 dark:text-gray-400">{isRecording ? formatTime(timer) : 'Click the microphone to start recording'}</p>
              </>
          ) : (
              <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-900/20 mx-auto mb-6">
                      <FaCheck className="text-4xl text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Recording Complete</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{formatTime(timer)}</p>
                  <button onClick={() => setAudioBlob(null)} className="text-sm text-red-500 hover:underline">Discard and Record Again</button>
              </div>
          )}
       </div>
       <div className="flex justify-end mt-4">
            <button 
                onClick={handleNext}
                disabled={!audioBlob || isProcessing}
                className={`px-8 py-2.5 rounded-lg font-medium transition-colors ${!audioBlob || isProcessing ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-[#c2410c] hover:bg-[#9a3412] text-white'}`}
            >
               {isProcessing ? 'Processing...' : 'Next'}
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
                                ? 'bg-indigo-50 dark:bg-[#1a1a1a] border-indigo-200 dark:border-white/20' 
                                : 'bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-colors ${
                                isSelected ? 'bg-indigo-500/20 text-indigo-500' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500'
                            }`}>
                                {isSelected ? <FaCheck size={14} /> : method.icon}
                            </div>
                            <span className={`font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                {method.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 dark:border-white/10 pt-6">
                 {/* Language Selector */}
                 <div className="relative">
                    <button className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 px-4 py-2 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
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
               <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Folder Name</label>
               <input 
                 type="text" 
                 value={folderName}
                 onChange={(e) => setFolderName(e.target.value)}
                 placeholder="Enter folder name..." 
                 className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
               />
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Choose Color</label>
               <div className="grid grid-cols-6 gap-3">
                  {colors.map((color) => (
                     <button 
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full ${color} transition-transform hover:scale-110 flex items-center justify-center ${selectedColor === color ? 'ring-2 ring-white dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-[#0f0f0f]' : ''}`}
                     />
                  ))}
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
               <button onClick={onClose} className="px-6 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white font-medium transition-colors">
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
