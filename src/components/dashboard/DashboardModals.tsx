import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUpload, FaLink, FaMicrophone, FaCheck, FaBook, FaListUl, FaLayerGroup, FaPodcast, FaChalkboardTeacher, FaPencilAlt, FaEdit, FaChevronDown, FaStop, FaPlay, FaPause } from 'react-icons/fa';
import { useAuth } from '../../utils/AuthContext';
import { jsPDF } from 'jspdf';
import { uploadService, UploadPayload } from '../../services/uploadService';
import { useLanguage } from '../../utils/LanguageContext';

// Helper for reading file
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

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

// --- Rename Modal ---
export interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
  title?: string;
}

export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, onRename, currentName, title }) => {
  const { t } = useLanguage();
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentName]);

  const handleSubmit = () => {
    if (name.trim()) {
      onRename(name);
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t('matrixDashboard.modals.rename.defaultTitle')}
      width="max-w-md"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('matrixDashboard.modals.rename.nameLabel')}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || name === currentName}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('matrixDashboard.modals.rename.saveChanges')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

// --- Delete Modal ---
export interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const { t } = useLanguage();
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="max-w-md"
    >
      <div className="space-y-6">
        <p className="text-gray-600 dark:text-gray-300">
          {message}
        </p>

        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-500/20"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

// --- Upload Modal ---
export const UploadModal: React.FC<{ isOpen: boolean; onClose: () => void; onNext: (payload: UploadPayload) => void }> = ({ isOpen, onClose, onNext }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [payload, setPayload] = useState<UploadPayload | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pdfProcessType, setPdfProcessType] = useState<'document' | 'ocr' | 'pdf_vision'>('document');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setUploadState('idle');
      setProgress(0);
      setPayload(null);
      setPendingFile(null);
      setPdfProcessType('document');
    }
  }, [isOpen]);

  const processFiles = async (files: File[], type: 'document' | 'ocr' | 'pdf_vision') => {
    if (!user) return;
    setUploadState('uploading');
    setProgress(10); 

    try {
        let resultPayload: UploadPayload;
        const uid = user.id;
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        if (files.length === 1) {
            const file = files[0];
            if (file.type.startsWith('audio/')) {
                resultPayload = await uploadService.constructAudioPayload(file, uid);
                resultPayload.uploadedFileType = 'audio';
            } else if (file.type.startsWith('video/')) {
                resultPayload = await uploadService.constructVideoPayload(file, uid);
                resultPayload.uploadedFileType = 'video';
            } else {
                // Default to document for everything else (pdf, doc, image, etc.)
                resultPayload = await uploadService.constructDocumentPayload(file, uid, type);
            }
        } else {
            // Multiple images -> PDF
            const doc = new jsPDF();
            
            for (let i = 0; i < imageFiles.length; i++) {
                if (i > 0) doc.addPage();
                const image = imageFiles[i];
                const imageDataUrl = await readFileAsDataURL(image);
                const imgProps = doc.getImageProperties(imageDataUrl);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                const imageType = image.type === 'image/png' ? 'PNG' : 'JPEG';
                doc.addImage(imageDataUrl, imageType, 0, 0, pdfWidth, pdfHeight);
            }
            
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], `combined_images_${Date.now()}.pdf`, { type: 'application/pdf' });
            
            resultPayload = await uploadService.constructDocumentPayload(pdfFile, uid, 'pdf_vision');
        }

        setPayload(resultPayload);
        setProgress(100);
        setUploadState('complete');
        setPendingFile(null);
    } catch (error) {
        console.error("Upload failed:", error);
        setUploadState('error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && user) {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        const nonImageFiles = files.filter(f => !f.type.startsWith('image/'));

        if (files.length > 5) {
             alert(t('matrixDashboard.modals.upload.maxFilesError'));
             return;
        }

        if (nonImageFiles.length > 1) {
             alert(t('matrixDashboard.modals.upload.singleNonImageError'));
             return;
        }
        
        if (nonImageFiles.length === 1 && imageFiles.length > 0) {
             alert(t('matrixDashboard.modals.upload.mixedFileTypeError'));
             return;
        }

        // Check for single PDF
        if (files.length === 1 && files[0].type === 'application/pdf') {
             setPendingFile(files[0]);
             setPdfProcessType('document');
             return;
        }

        processFiles(files, 'pdf_vision');
    } else if (!user) {
        alert(t('matrixDashboard.modals.upload.signInError'));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={t('matrixDashboard.modals.upload.title')} 
        subtitle={t('matrixDashboard.modals.upload.subtitle')}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
        multiple
      />
      
      {pendingFile ? (
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBook className="text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('matrixDashboard.modals.upload.pdfDetected')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{pendingFile.name}</p>
            
            <div className="grid grid-cols-1 gap-3 mb-8 w-full max-w-lg mx-auto">
                {/* PDF Vision Option */}
                <div 
                    onClick={() => setPdfProcessType('pdf_vision')}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${pdfProcessType === 'pdf_vision' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'}`}
                >
                    <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${pdfProcessType === 'pdf_vision' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-400'}`}>
                            {pdfProcessType === 'pdf_vision' && <FaCheck className="text-white text-xs" />}
                        </div>
                        <div className="text-left">
                            <span className="block text-gray-900 dark:text-white font-medium">{t('matrixDashboard.modals.upload.pdfOptions.includeImagesTitle')}</span>
                            <span className="block text-xs text-gray-500 mt-1">{t('matrixDashboard.modals.upload.pdfOptions.includeImagesDescription')}</span>
                        </div>
                    </div>
                </div>

                {/* OCR Option */}
                <div 
                    onClick={() => setPdfProcessType('ocr')}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${pdfProcessType === 'ocr' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'}`}
                >
                    <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${pdfProcessType === 'ocr' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-400'}`}>
                            {pdfProcessType === 'ocr' && <FaCheck className="text-white text-xs" />}
                        </div>
                        <div className="text-left">
                            <span className="block text-gray-900 dark:text-white font-medium">{t('matrixDashboard.modals.upload.pdfOptions.ocrTitle')}</span>
                            <span className="block text-xs text-gray-500 mt-1">{t('matrixDashboard.modals.upload.pdfOptions.ocrDescription')}</span>
                        </div>
                    </div>
                </div>

                {/* Extract Text Option */}
                <div 
                    onClick={() => setPdfProcessType('document')}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${pdfProcessType === 'document' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'}`}
                >
                    <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${pdfProcessType === 'document' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-400'}`}>
                            {pdfProcessType === 'document' && <FaCheck className="text-white text-xs" />}
                        </div>
                        <div className="text-left">
                            <span className="block text-gray-900 dark:text-white font-medium">{t('matrixDashboard.modals.upload.pdfOptions.extractTextTitle')}</span>
                            <span className="block text-xs text-gray-500 mt-1">{t('matrixDashboard.modals.upload.pdfOptions.extractTextDescription')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex space-x-3 justify-center">
                <button 
                    onClick={() => { setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    disabled={uploadState === 'uploading'}
                    className={`px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${uploadState === 'uploading' ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                    {t('common.cancel')}
                </button>
                <button 
                    onClick={() => processFiles([pendingFile], pdfProcessType)}
                    disabled={uploadState === 'uploading'}
                    className={`px-6 py-2 bg-[#c2410c] hover:bg-[#9a3412] text-white rounded-lg font-medium transition-colors ${uploadState === 'uploading' ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                    {uploadState === 'uploading' ? t('common.processing') : t('matrixDashboard.modals.upload.processPdf')}
                </button>
            </div>
        </div>
      ) : uploadState === 'idle' || uploadState === 'error' ? (
        <div 
            onClick={handleUploadClick}
            className={`border-2 border-dashed ${uploadState === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111]'} rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-gray-300 dark:hover:border-white/20 transition-colors cursor-pointer group`}
        >
            <div className={`w-16 h-16 ${uploadState === 'error' ? 'bg-red-100 dark:bg-red-900/40 text-red-500' : 'bg-indigo-50 dark:bg-[#2a1a10] text-indigo-500'} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
            {uploadState === 'error' ? <FaTimes className="text-2xl" /> : <FaUpload className="text-2xl" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{uploadState === 'error' ? t('matrixDashboard.modals.upload.uploadFailed') : t('matrixDashboard.modals.upload.clickOrDrag')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('matrixDashboard.modals.upload.supportedFileTypes')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111] border border-dashed border-gray-200 dark:border-white/10 rounded-xl p-8">
            <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{uploadState === 'complete' ? t('matrixDashboard.modals.upload.uploadComplete') : t('matrixDashboard.modals.upload.uploading')} 1 {t('matrixDashboard.modals.upload.file')}</span>
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

      {!pendingFile && (
      <div className="flex justify-end mt-6">
        <button 
            onClick={() => payload && onNext(payload)}
            disabled={uploadState !== 'complete'}
            className={`px-8 py-2.5 rounded-lg font-medium transition-colors ${uploadState === 'complete' ? 'bg-[#c2410c] hover:bg-[#9a3412] text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
        >
            {t('common.next')}
        </button>
      </div>
      )}
    </BaseModal>
  );
};

// --- Paste Modal ---
export const PasteModal: React.FC<{ isOpen: boolean; onClose: () => void; onNext: (payload: UploadPayload) => void }> = ({ isOpen, onClose, onNext }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (!user) {
        alert(t('matrixDashboard.modals.paste.signInError'));
        return;
    }

    if (url) {
        // Direct navigation for all URLs (including YouTube) - n8n processing happens at generation
        const payload = uploadService.constructUrlPayload(url, user.id);
        onNext(payload);
    } else if (text) {
        const payload = uploadService.constructTextPayload(text, user.id);
        onNext(payload);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('matrixDashboard.modals.paste.title')} subtitle={t('matrixDashboard.modals.paste.subtitle')}>
      <div className="space-y-6">
         <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('matrixDashboard.modals.paste.enterUrlLabel')}</label>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLink className="text-gray-400 dark:text-gray-500" />
               </div>
               <input 
                 type="text" 
                 value={url}
                 onChange={(e) => setUrl(e.target.value)}
                 disabled={!!text}
                 placeholder={t('matrixDashboard.modals.paste.urlPlaceholder')} 
                 className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
               />
            </div>
         </div>

         <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">{t('matrixDashboard.modals.paste.or')}</span>
            <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
         </div>

         <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('matrixDashboard.modals.paste.copyPasteLabel')}</label>
            <textarea 
               value={text}
               onChange={(e) => setText(e.target.value)}
               disabled={!!url}
               placeholder={t('matrixDashboard.modals.paste.notesPlaceholder')} 
               className="w-full h-40 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none disabled:opacity-50"
            ></textarea>
            <div className="flex justify-end mt-2">
               <span className="text-xs text-gray-500">{text.length}/50000</span>
            </div>
         </div>

         <div className="flex justify-end mt-2">
            <button 
                onClick={handleNext}
                disabled={(!url && !text) || !user || isLoading}
                className={`px-8 py-2.5 rounded-lg font-medium transition-colors ${(!url && !text) || !user || isLoading ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-[#c2410c] hover:bg-[#9a3412] text-white'}`}
            >
               {isLoading ? t('common.processing') : t('common.next')}
            </button>
         </div>
      </div>
    </BaseModal>
  );
};

// --- Record Modal ---
export const RecordModal: React.FC<{ isOpen: boolean; onClose: () => void; onNext: (payload: UploadPayload) => void }> = ({ isOpen, onClose, onNext }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
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
        alert(t('matrixDashboard.modals.record.microphoneAccessError'));
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
        alert(t('matrixDashboard.modals.record.uploadFailed'));
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('matrixDashboard.modals.record.title')} subtitle={t('matrixDashboard.modals.record.subtitle')}>
       <div className="py-12 flex flex-col items-center justify-center">
          {!audioBlob ? (
              <>
                <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 mb-6 ${isRecording ? 'bg-red-500 shadow-red-900/20 animate-pulse' : 'bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-900/20'}`}
                >
                    {isRecording ? <FaStop className="text-4xl text-white" /> : <FaMicrophone className="text-4xl text-white" />}
                </button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{isRecording ? t('matrixDashboard.modals.record.recording') : t('matrixDashboard.modals.record.readyToRecord')}</h3>
                <p className="text-gray-500 dark:text-gray-400">{isRecording ? formatTime(timer) : t('matrixDashboard.modals.record.clickMic')}</p>
              </>
          ) : (
              <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-900/20 mx-auto mb-6">
                      <FaCheck className="text-4xl text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('matrixDashboard.modals.record.recordingComplete')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{formatTime(timer)}</p>
                  <button onClick={() => setAudioBlob(null)} className="text-sm text-red-500 hover:underline">{t('matrixDashboard.modals.record.discardAndRecordAgain')}</button>
              </div>
          )}
       </div>
       <div className="flex justify-end mt-4">
            <button 
                onClick={handleNext}
                disabled={!audioBlob || isProcessing}
                className={`px-8 py-2.5 rounded-lg font-medium transition-colors ${!audioBlob || isProcessing ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-[#c2410c] hover:bg-[#9a3412] text-white'}`}
            >
               {isProcessing ? t('common.processing') : t('common.next')}
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
    const { t } = useLanguage();
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
    
    const methods: MethodOption[] = [
        { id: 'notes', label: t('addMethodModal.methods.notes'), icon: <FaBook /> },
        { id: 'multiple-choice', label: t('addMethodModal.methods.multipleChoice'), icon: <FaListUl /> },
        { id: 'flashcards', label: t('addMethodModal.methods.flashcards'), icon: <FaLayerGroup /> },
        { id: 'podcast', label: t('addMethodModal.methods.podcast'), icon: <FaPodcast /> },
        { id: 'tutor-lesson', label: t('addMethodModal.methods.tutorLesson'), icon: <FaChalkboardTeacher /> },
        { id: 'written-tests', label: t('addMethodModal.methods.writtenTests'), icon: <FaPencilAlt /> },
        { id: 'fill-blanks', label: t('addMethodModal.methods.fillBlanks'), icon: <FaEdit /> },
    ];

    const toggleMethod = (id: string) => {
        if (selectedMethods.includes(id)) {
            setSelectedMethods(selectedMethods.filter(m => m !== id));
        } else {
            setSelectedMethods([...selectedMethods, id]);
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={t('matrixDashboard.modals.methodSelection.title')} subtitle={t('matrixDashboard.modals.methodSelection.subtitle')} width="max-w-4xl">
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
                        <span>{t('matrixDashboard.modals.methodSelection.languageEnglish')}</span>
                        <FaChevronDown size={10} className="text-gray-500 ml-2" />
                    </button>
                 </div>

                 <button 
                    onClick={() => onGenerate(selectedMethods)}
                    className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-10 py-3 rounded-lg font-bold transition-colors"
                 >
                    {t('matrixDashboard.modals.methodSelection.generate')}
                 </button>
            </div>
        </BaseModal>
    );
};


// --- Create Folder Modal ---
export interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onCreate }) => {
  const { t } = useLanguage();
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const inputRef = useRef<HTMLInputElement>(null);

  const colors = [
    { id: 'blue', bg: 'bg-blue-500' },
    { id: 'green', bg: 'bg-green-500' },
    { id: 'purple', bg: 'bg-purple-500' },
    { id: 'orange', bg: 'bg-orange-500' },
    { id: 'red', bg: 'bg-red-500' },
    { id: 'pink', bg: 'bg-pink-500' },
    { id: 'indigo', bg: 'bg-indigo-500' },
    { id: 'teal', bg: 'bg-teal-500' },
  ];

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setSelectedColor('blue');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (folderName.trim()) {
      onCreate(folderName, selectedColor);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sidebar.createNewFolder')}
      width="max-w-md"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('matrixDashboard.modals.createFolder.folderName')}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={t('matrixDashboard.modals.createFolder.placeholder')}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('matrixDashboard.modals.createFolder.colorCode')}
          </label>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color.id)}
                className={`w-8 h-8 rounded-full ${color.bg} transition-transform hover:scale-110 ${selectedColor === color.id ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-black scale-110' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!folderName.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('matrixDashboard.modals.createFolder.createButton')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export interface MoveDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: { id: string; name: string; count: number; color?: string }[];
  onMove: (folderId: string | null) => void;
  documentTitle?: string;
}

export const MoveDocumentModal: React.FC<MoveDocumentModalProps> = ({ isOpen, onClose, folders, onMove, documentTitle }) => {
  const { t } = useLanguage();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(null);
    }
  }, [isOpen]);

  const handleMove = () => {
    onMove(selectedFolderId);
    onClose();
  };

  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('matrixDashboard.modals.moveDocument.title', { values: { documentTitle: documentTitle || t('matrixDashboard.modals.moveDocument.document') } })}
      subtitle={t('matrixDashboard.modals.moveDocument.subtitle')}
      width="max-w-md"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <button
          onClick={() => setSelectedFolderId(null)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
            selectedFolderId === null
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500">
            <FaLayerGroup />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">{t('sidebar.allStudySets')}</p>
            <p className="text-xs text-gray-500">{t('matrixDashboard.modals.moveDocument.defaultLocation')}</p>
          </div>
          {selectedFolderId === null && <FaCheck className="ml-auto text-indigo-500" />}
        </button>

        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => setSelectedFolderId(folder.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
              selectedFolderId === folder.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorStyles[folder.color || 'blue'] || colorStyles.blue}`}>
              <FaLayerGroup />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">{folder.name}</p>
              <p className="text-xs text-gray-500">{t('matrixDashboard.modals.moveDocument.itemsCount', { values: { count: folder.count } })}</p>
            </div>
            {selectedFolderId === folder.id && <FaCheck className="ml-auto text-indigo-500" />}
          </button>
        ))}
      </div>

      <div className="flex gap-3 justify-end mt-8 border-t border-gray-100 dark:border-white/5 pt-6">
        <button
          onClick={onClose}
          className="px-6 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleMove}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          {t('matrixDashboard.modals.moveDocument.moveButton')}
        </button>
      </div>
    </BaseModal>
  );
};
