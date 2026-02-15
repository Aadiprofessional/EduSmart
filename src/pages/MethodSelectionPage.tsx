import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    FaArrowLeft, 
    FaBook, 
    FaListUl, 
    FaLayerGroup, 
    FaPodcast, 
    FaEdit, 
    FaPencilAlt, 
    FaChalkboardTeacher,
    FaSlidersH,
    FaChevronDown,
    FaMagic,
    FaLeaf,
    FaBullseye,
    FaFire,
    FaRandom,
    FaUser,
    FaSmile,
    FaMeh,
    FaFrown,
    FaAngry,
    FaMicrophone,
    FaProjectDiagram
} from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BaseModal } from '../components/dashboard/DashboardModals';
import { UploadPayload } from '../services/uploadService';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';
import coinIcon from '../assets/assets_coin.png';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
// Use unpkg for reliable worker loading matching the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// --- Configuration Components ---

const CustomizeNotes: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Custom Instructions (optional)</label>
                <textarea 
                    className="w-full h-32 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder="Focus on definitions, include more diagrams..."
                />
            </div>
            <div className="flex justify-between items-center pt-4">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors">Clear Selection</button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">Done</button>
            </div>
        </div>
    );
};

const CustomizeMultipleChoice: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [numQuestions, setNumQuestions] = useState('auto');
    const [difficulty, setDifficulty] = useState('auto');

    const OptionButton = ({ id, label, subLabel, icon, active, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                active 
                ? 'bg-[#c2410c]/10 border-[#c2410c] text-[#c2410c]' 
                : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]'
            }`}
        >
            {icon && <div className="mb-2 text-lg">{icon}</div>}
            <span className="font-bold text-sm">{label}</span>
            {subLabel && <span className="text-xs opacity-60 mt-1">{subLabel}</span>}
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Number of Questions</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={numQuestions === 'auto'} 
                        onClick={() => setNumQuestions('auto')}
                        label="Auto" 
                        subLabel="Smart"
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'few'} 
                        onClick={() => setNumQuestions('few')}
                        label="Few" 
                        subLabel="1-15"
                        icon={<FaListUl />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'standard'} 
                        onClick={() => setNumQuestions('standard')}
                        label="Standard" 
                        subLabel="20-40"
                        icon={<FaBook />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'many'} 
                        onClick={() => setNumQuestions('many')}
                        label="Many" 
                        subLabel="50+"
                        icon={<FaLayerGroup />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Difficulty Level</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={difficulty === 'auto'} 
                        onClick={() => setDifficulty('auto')}
                        label="Auto" 
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={difficulty === 'easy'} 
                        onClick={() => setDifficulty('easy')}
                        label="Easy" 
                        icon={<FaLeaf />} 
                    />
                    <OptionButton 
                        active={difficulty === 'medium'} 
                        onClick={() => setDifficulty('medium')}
                        label="Medium" 
                        icon={<FaBullseye />} 
                    />
                    <OptionButton 
                        active={difficulty === 'hard'} 
                        onClick={() => setDifficulty('hard')}
                        label="Hard" 
                        icon={<FaFire />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Custom Instructions (optional)</label>
                <textarea 
                    className="w-full h-24 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder="Focus on chapter 5, include more examples..."
                />
            </div>

            <div className="flex justify-between items-center pt-2">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors">Clear Selection</button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">Done</button>
            </div>
        </div>
    );
};

const CustomizeFlashcards: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // Reusing similar structure to Multiple Choice
    const [numCards, setNumCards] = useState('auto');
    const [difficulty, setDifficulty] = useState('auto');

    const OptionButton = ({ id, label, subLabel, icon, active, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                active 
                ? 'bg-[#c2410c]/10 border-[#c2410c] text-[#c2410c]' 
                : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]'
            }`}
        >
            {icon && <div className="mb-2 text-lg">{icon}</div>}
            <span className="font-bold text-sm">{label}</span>
            {subLabel && <span className="text-xs opacity-60 mt-1">{subLabel}</span>}
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Number of Cards</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={numCards === 'auto'} 
                        onClick={() => setNumCards('auto')}
                        label="Auto" 
                        subLabel="Smart"
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={numCards === 'few'} 
                        onClick={() => setNumCards('few')}
                        label="Few" 
                        subLabel="1-15"
                        icon={<FaListUl />} 
                    />
                    <OptionButton 
                        active={numCards === 'standard'} 
                        onClick={() => setNumCards('standard')}
                        label="Standard" 
                        subLabel="20-40"
                        icon={<FaBook />} 
                    />
                    <OptionButton 
                        active={numCards === 'many'} 
                        onClick={() => setNumCards('many')}
                        label="Many" 
                        subLabel="50+"
                        icon={<FaLayerGroup />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Difficulty Level</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={difficulty === 'auto'} 
                        onClick={() => setDifficulty('auto')}
                        label="Auto" 
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={difficulty === 'easy'} 
                        onClick={() => setDifficulty('easy')}
                        label="Easy" 
                        icon={<FaLeaf />} 
                    />
                    <OptionButton 
                        active={difficulty === 'medium'} 
                        onClick={() => setDifficulty('medium')}
                        label="Medium" 
                        icon={<FaBullseye />} 
                    />
                    <OptionButton 
                        active={difficulty === 'hard'} 
                        onClick={() => setDifficulty('hard')}
                        label="Hard" 
                        icon={<FaFire />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Custom Instructions (optional)</label>
                <textarea 
                    className="w-full h-24 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder="Focus on chapter 5, include more examples..."
                />
            </div>

            <div className="flex justify-between items-center pt-2">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors">Clear Selection</button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">Done</button>
            </div>
        </div>
    );
};

const CustomizePodcast: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [length, setLength] = useState('auto');
    const [personality, setPersonality] = useState('default');

    const OptionButton = ({ id, label, subLabel, icon, active, onClick, wide }: any) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                active 
                ? 'bg-[#c2410c]/10 border-[#c2410c] text-[#c2410c]' 
                : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]'
            } ${wide ? 'col-span-2' : ''}`}
        >
            {icon && <div className="mb-2 text-lg">{icon}</div>}
            <span className="font-bold text-sm">{label}</span>
            {subLabel && <span className="text-xs opacity-60 mt-1">{subLabel}</span>}
        </button>
    );

    const HostOption = ({ label, subLabel }: any) => (
        <div className="flex items-center p-4 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/5 rounded-xl">
             <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-4">
                <FaRandom className="text-gray-500 dark:text-gray-400" />
             </div>
             <div>
                 <div className="font-bold text-gray-900 dark:text-white text-sm">{label}</div>
                 <div className="text-xs text-gray-500">{subLabel}</div>
             </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Speakers</label>
                <div className="space-y-3">
                    <HostOption label="Random" subLabel="Speaker 1" />
                    <HostOption label="Random" subLabel="Speaker 2" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Podcast Length</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={length === 'auto'} 
                        onClick={() => setLength('auto')}
                        label="Auto" 
                        subLabel="Smart"
                    />
                    <OptionButton 
                        active={length === 'short'} 
                        onClick={() => setLength('short')}
                        label="Short" 
                        subLabel="5-8 min"
                    />
                    <OptionButton 
                        active={length === 'medium'} 
                        onClick={() => setLength('medium')}
                        label="Medium" 
                        subLabel="10-15 min"
                    />
                    <OptionButton 
                        active={length === 'long'} 
                        onClick={() => setLength('long')}
                        label="Long" 
                        subLabel="18-25 min"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Personality</label>
                <div className="grid grid-cols-3 gap-3">
                    <OptionButton 
                        active={personality === 'default'} 
                        onClick={() => setPersonality('default')}
                        label="Default" 
                        icon={<FaUser />}
                    />
                    <OptionButton 
                        active={personality === 'sassy'} 
                        onClick={() => setPersonality('sassy')}
                        label="Sassy" 
                        icon={<FaMagic />}
                    />
                    <OptionButton 
                        active={personality === 'annoyed'} 
                        onClick={() => setPersonality('annoyed')}
                        label="Annoyed" 
                        icon={<FaMeh />}
                    />
                     <OptionButton 
                        active={personality === 'angry'} 
                        onClick={() => setPersonality('angry')}
                        label="Angry" 
                        icon={<FaAngry />}
                    />
                    <OptionButton 
                        active={personality === 'gaslighter'} 
                        onClick={() => setPersonality('gaslighter')}
                        label="Gaslighter" 
                        icon={<FaFrown />}
                    />
                    <OptionButton 
                        active={personality === 'corny'} 
                        onClick={() => setPersonality('corny')}
                        label="Corny" 
                        icon={<FaSmile />}
                    />
                </div>
            </div>

            <div className="flex justify-between items-center pt-2">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors">Clear Selection</button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">Done</button>
            </div>
        </div>
    );
};


const CustomizeWrittenTests: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [numQuestions, setNumQuestions] = useState('auto');
    const [difficulty, setDifficulty] = useState('auto');

    const OptionButton = ({ id, label, subLabel, icon, active, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                active 
                ? 'bg-[#c2410c]/10 border-[#c2410c] text-[#c2410c]' 
                : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]'
            }`}
        >
            {icon && <div className="mb-2 text-lg">{icon}</div>}
            <span className="font-bold text-sm">{label}</span>
            {subLabel && <span className="text-xs opacity-60 mt-1">{subLabel}</span>}
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Number of Questions</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={numQuestions === 'auto'} 
                        onClick={() => setNumQuestions('auto')}
                        label="Auto" 
                        subLabel="Smart"
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'few'} 
                        onClick={() => setNumQuestions('few')}
                        label="Few" 
                        subLabel="1-15"
                        icon={<FaListUl />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'standard'} 
                        onClick={() => setNumQuestions('standard')}
                        label="Standard" 
                        subLabel="20-40"
                        icon={<FaBook />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'many'} 
                        onClick={() => setNumQuestions('many')}
                        label="Many" 
                        subLabel="50+"
                        icon={<FaLayerGroup />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Difficulty Level</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={difficulty === 'auto'} 
                        onClick={() => setDifficulty('auto')}
                        label="Auto" 
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={difficulty === 'easy'} 
                        onClick={() => setDifficulty('easy')}
                        label="Easy" 
                        icon={<FaLeaf />} 
                    />
                    <OptionButton 
                        active={difficulty === 'medium'} 
                        onClick={() => setDifficulty('medium')}
                        label="Medium" 
                        icon={<FaBullseye />} 
                    />
                    <OptionButton 
                        active={difficulty === 'hard'} 
                        onClick={() => setDifficulty('hard')}
                        label="Hard" 
                        icon={<FaFire />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Custom Instructions (optional)</label>
                <textarea 
                    className="w-full h-24 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder="Focus on chapter 5, include more examples..."
                />
            </div>

            <div className="flex justify-between items-center pt-2">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors">Clear Selection</button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">Done</button>
            </div>
        </div>
    );
};

const CustomizeFillBlanks: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // Reusing structure for Fill in the Blanks
    const [numQuestions, setNumQuestions] = useState('auto');
    const [difficulty, setDifficulty] = useState('auto');

    const OptionButton = ({ id, label, subLabel, icon, active, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                active 
                ? 'bg-[#c2410c]/10 border-[#c2410c] text-[#c2410c]' 
                : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]'
            }`}
        >
            {icon && <div className="mb-2 text-lg">{icon}</div>}
            <span className="font-bold text-sm">{label}</span>
            {subLabel && <span className="text-xs opacity-60 mt-1">{subLabel}</span>}
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Number of Questions</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={numQuestions === 'auto'} 
                        onClick={() => setNumQuestions('auto')}
                        label="Auto" 
                        subLabel="Smart"
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'few'} 
                        onClick={() => setNumQuestions('few')}
                        label="Few" 
                        subLabel="1-15"
                        icon={<FaListUl />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'standard'} 
                        onClick={() => setNumQuestions('standard')}
                        label="Standard" 
                        subLabel="20-40"
                        icon={<FaBook />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'many'} 
                        onClick={() => setNumQuestions('many')}
                        label="Many" 
                        subLabel="50+"
                        icon={<FaLayerGroup />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Difficulty Level</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={difficulty === 'auto'} 
                        onClick={() => setDifficulty('auto')}
                        label="Auto" 
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={difficulty === 'easy'} 
                        onClick={() => setDifficulty('easy')}
                        label="Easy" 
                        icon={<FaLeaf />} 
                    />
                    <OptionButton 
                        active={difficulty === 'medium'} 
                        onClick={() => setDifficulty('medium')}
                        label="Medium" 
                        icon={<FaBullseye />} 
                    />
                    <OptionButton 
                        active={difficulty === 'hard'} 
                        onClick={() => setDifficulty('hard')}
                        label="Hard" 
                        icon={<FaFire />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Custom Instructions (optional)</label>
                <textarea 
                    className="w-full h-24 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder="Focus on chapter 5, include more examples..."
                />
            </div>

            <div className="flex justify-between items-center pt-2">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors">Clear Selection</button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">Done</button>
            </div>
        </div>
    );
};


const CustomizeSpeechToText: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedText, setExtractedText] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setExtractedText(null);
        }
    };

    const handleProcess = () => {
        if (!file) return;
        setIsProcessing(true);
        // Simulate processing
        setTimeout(() => {
            setIsProcessing(false);
            setExtractedText("Extracted text preview: This is a simulation of the extracted text from " + file.name);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Upload Audio or Document</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 hover:border-[#c2410c] transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="audio/*,.pdf,.doc,.docx" 
                    />
                    <div className="text-center">
                        <FaMicrophone className="mx-auto text-4xl text-gray-400 mb-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {file ? file.name : "Click or Drag to Upload Audio/File"}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Supports MP3, WAV, PDF, DOCX</p>
                    </div>
                </div>
            </div>

            {file && !extractedText && (
                 <button 
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="w-full py-3 bg-[#c2410c] hover:bg-[#9a3412] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                 >
                    {isProcessing ? <AiOutlineLoading3Quarters className="animate-spin" /> : <FaMicrophone />}
                    {isProcessing ? 'Processing...' : 'Extract Text'}
                 </button>
            )}

            {extractedText && (
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                    {extractedText}
                </div>
            )}

            <div className="flex justify-between items-center pt-2">
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors">Clear</button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">Done</button>
            </div>
        </div>
    );
};

const CustomizeMindmap: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [depth, setDepth] = useState('medium');

    const OptionButton = ({ label, active, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`flex items-center justify-center p-3 rounded-xl border transition-all ${
                active 
                ? 'bg-[#c2410c]/10 border-[#c2410c] text-[#c2410c]' 
                : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]'
            }`}
        >
            <span className="font-bold text-sm">{label}</span>
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Mindmap Depth</label>
                <div className="grid grid-cols-3 gap-3">
                    <OptionButton 
                        active={depth === 'simple'} 
                        onClick={() => setDepth('simple')}
                        label="Simple" 
                    />
                    <OptionButton 
                        active={depth === 'medium'} 
                        onClick={() => setDepth('medium')}
                        label="Detailed" 
                    />
                    <OptionButton 
                        active={depth === 'complex'} 
                        onClick={() => setDepth('complex')}
                        label="Complex" 
                    />
                </div>
            </div>

            <div className="flex justify-between items-center pt-2">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors">Reset</button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">Done</button>
            </div>
        </div>
    );
};


// --- Main Page Component ---
const MethodSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { uploadPayload?: UploadPayload } | null;

    const [selectedMethods, setSelectedMethods] = useState<string[]>(() => {
        const type = state?.uploadPayload?.uploadedFileType;
        const hasDuration = state?.uploadPayload?.duration;
        if (type === 'audio' || type === 'video' || (type === 'url' && hasDuration)) {
            return ['speech-to-text', 'notes'];
        }
        return ['tutor-lesson'];
    }); 
    const [activeConfigMethod, setActiveConfigMethod] = useState<string | null>(null);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState({ code: 'US', name: 'English', flag: '🇺🇸' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [step, setStep] = useState<'selection' | 'summary'>('selection');
    const [metaData, setMetaData] = useState<{ duration?: number; pageCount?: number }>({});
    const [userCoins, setUserCoins] = useState<number>(0);
    const { user } = useAuth();

    // Progress Bar State
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('Initializing...');

    // Progress bar simulation
    React.useEffect(() => {
        let interval: any;
        
        if (isGenerating) {
            const startTime = Date.now();
            const duration = 180000; // 3 minutes in ms

            interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                
                // Calculate progress
                let newProgress = (elapsed / duration) * 99;
                if (newProgress > 99) newProgress = 99;
                
                setProgress(newProgress);

                // Update text based on progress
                if (newProgress < 5) setLoadingText('Initializing...');
                else if (newProgress < 15) setLoadingText('Analyzing your files...');
                else if (newProgress < 30) setLoadingText('Generating comprehensive notes...');
                else if (newProgress < 45) setLoadingText('Creating challenging questions...');
                else if (newProgress < 60) setLoadingText('Formulating flashcards...');
                else if (newProgress < 80) setLoadingText('Polishing your study set...');
                else if (newProgress < 99) setLoadingText('Almost there...');
                else {
                    // Stalled at 99%
                    const stallTime = elapsed - duration;
                    if (stallTime > 40000) {
                         setLoadingText('Sometimes taking longer due to high traffic, please don\'t leave the page.');
                    } else if (stallTime > 20000) {
                         setLoadingText('Taking longer than expected...');
                    } else {
                         setLoadingText('Please wait a little longer...');
                    }
                }
            }, 100);
        } else {
            setProgress(0);
            setLoadingText('Initializing...');
        }

        return () => clearInterval(interval);
    }, [isGenerating]);

    // Helper to extract file name from payload
    const getFileName = () => {
        if (!state?.uploadPayload) return "New Study Set";
        const { uploadPayload } = state;
        
        // Check for audio_name (from audio/video uploads)
        if (uploadPayload.audio_name) return uploadPayload.audio_name;
        
        // Check for messages (from document uploads)
        if (uploadPayload.messages && uploadPayload.messages.length > 0) {
            const msg = uploadPayload.messages[0];
            // Check attachments
            if (msg.attachments && msg.attachments.length > 0 && msg.attachments[0].fileName) {
                return msg.attachments[0].fileName;
            }
        }
        
        return "New Study Set";
    };

    // Fetch user coins
    React.useEffect(() => {
        if (!user) return;
        const fetchCoins = async () => {
            const { data } = await supabase.from('user_subscriptions').select('current_coins').eq('user_id', user.id).single();
            if (data) setUserCoins(data.current_coins || 0);
        };
        fetchCoins();
    }, [user]);

    // Metadata extraction
    React.useEffect(() => {
        const extractMetadata = async () => {
            if (!state?.uploadPayload) return;
            const { uploadedFileType, publicUrl, messages, duration } = state.uploadPayload;

            // Prioritize duration from payload if available (it's already calculated in uploadService or fetched via webhook)
            if (duration && (uploadedFileType === 'audio' || uploadedFileType === 'video' || uploadedFileType === 'url')) {
                 setMetaData(prev => ({ ...prev, duration: Number(duration) }));
                 return; 
            }

            if ((uploadedFileType === 'pdf_vision' || uploadedFileType === 'ocr') && messages && messages[0]?.page_count) {
                setMetaData(prev => ({ ...prev, pageCount: messages[0].page_count }));
            } else if (uploadedFileType === 'pdf') {
                try {
                    const loadingTask = pdfjsLib.getDocument(publicUrl); 
                    const pdf = await loadingTask.promise;
                    setMetaData(prev => ({ ...prev, pageCount: pdf.numPages }));
                } catch (e) {
                    console.error("Failed to count PDF pages", e);
                }
            } else if (uploadedFileType === 'audio' || uploadedFileType === 'video') {
                 // Fallback if duration is missing in payload
                 const src = publicUrl;
                 if (src) {
                     if (uploadedFileType === 'video') {
                         const video = document.createElement('video');
                         video.preload = 'metadata';
                         video.onloadedmetadata = () => {
                             setMetaData(prev => ({ ...prev, duration: video.duration }));
                         };
                         video.src = src;
                     } else {
                         const media = new Audio(src);
                         media.onloadedmetadata = () => {
                             setMetaData(prev => ({ ...prev, duration: media.duration }));
                         };
                     }
                 }
            }
        };
        extractMetadata();
    }, [state?.uploadPayload]);

    // Force Speech to Text for Audio/Video/YouTube
    React.useEffect(() => {
        const type = state?.uploadPayload?.uploadedFileType;
        const hasDuration = state?.uploadPayload?.duration;
        if (type === 'audio' || type === 'video' || type === 'url') {
             setSelectedMethods(prev => {
                 if (prev.includes('speech-to-text')) return prev;
                 return [...prev, 'speech-to-text'];
             });
        }
    }, [state?.uploadPayload?.uploadedFileType, state?.uploadPayload?.duration]);

    const calculateCosts = () => {
       let sourceCost = 0;
       const type = state?.uploadPayload?.uploadedFileType;

       if (type === 'image') sourceCost = 3;
       else if (type === 'pdf' || type === 'pdf_vision') sourceCost = (metaData.pageCount || 1) * 2;
       else if (type === 'ocr') sourceCost = (metaData.pageCount || 1) * 1;
       else if (type === 'document' || type === 'text' || type === 'url') sourceCost = 10;
       else if (type === 'audio' || type === 'video') sourceCost = Math.ceil((metaData.duration || 60) / 60) * 1;
       else if (!type) sourceCost = 0;

       let methodsCost = 0;
       selectedMethods.forEach(m => {
           if (m !== 'speech-to-text') methodsCost += 1;
       });

       return { sourceCost, methodsCost, total: sourceCost + methodsCost };
    };

    const languages = [
        { code: 'US', name: 'English', flag: '🇺🇸' },
        { code: 'ES', name: 'Spanish', flag: '🇪🇸' },
        { code: 'FR', name: 'French', flag: '🇫🇷' },
        { code: 'DE', name: 'German', flag: '🇩🇪' },
        { code: 'IT', name: 'Italian', flag: '🇮🇹' },
        { code: 'PT', name: 'Portuguese', flag: '🇵🇹' },
        { code: 'CN', name: 'Chinese', flag: '🇨🇳' },
        { code: 'JP', name: 'Japanese', flag: '🇯🇵' },
    ];

    const methods = [
        { id: 'notes', label: 'Notes', icon: <FaBook /> },
        { id: 'multiple-choice', label: 'Multiple Choice', icon: <FaListUl /> },
        { id: 'flashcards', label: 'Flashcards', icon: <FaLayerGroup /> },
        { id: 'podcast', label: 'Podcast', icon: <FaPodcast /> },
        { id: 'tutor-lesson', label: 'Tutor Lesson', icon: <FaChalkboardTeacher /> },
        { id: 'written-tests', label: 'Written Tests', icon: <FaPencilAlt /> },
        { id: 'fill-blanks', label: 'Fill in the Blanks', icon: <FaEdit /> },
        { id: 'speech-to-text', label: 'Speech to Text', icon: <FaMicrophone /> },
        { id: 'mindmap', label: 'Mindmap', icon: <FaProjectDiagram /> },
    ];

    const visibleMethods = methods.filter(m => {
        if (m.id === 'speech-to-text') {
             const type = state?.uploadPayload?.uploadedFileType;
             const hasDuration = state?.uploadPayload?.duration;
             return type === 'audio' || type === 'video' || type === 'url';
        }
        return true;
    });

    const toggleMethod = (id: string) => {
        const type = state?.uploadPayload?.uploadedFileType;
        const hasDuration = state?.uploadPayload?.duration;
        if (id === 'speech-to-text' && (type === 'audio' || type === 'video' || type === 'url')) {
            return; 
        }
        if (selectedMethods.includes(id)) {
            setSelectedMethods(selectedMethods.filter(m => m !== id));
        } else {
            setSelectedMethods([...selectedMethods, id]);
        }
    };

    const handleGenerate = async () => {
        const { total } = calculateCosts();
        if (userCoins < total) {
            alert("Insufficient balance");
            return;
        }

        if (state?.uploadPayload) {
            setIsGenerating(true);
            try {
                let currentPayload = { ...state.uploadPayload };

                // Process YouTube URL
                if (currentPayload.uploadedFileType === 'url') {
                     const ytUrl = currentPayload.messages?.[0]?.url || currentPayload.url;
                     if (ytUrl) {
                         // Directly set type to youtube as requested
                         currentPayload.uploadedFileType = 'youtube';
                         // Ensure URL is passed clearly (it's already in 'url' and messages[0].url)
                         currentPayload.youtube_url = ytUrl; // Adding explicit field just in case
                     }
                }

                const payload = {
                    ...currentPayload,
                    mindmap: selectedMethods.includes('mindmap'),
                    notes: selectedMethods.includes('notes'),
                    multiple_choice: selectedMethods.includes('multiple-choice'),
                    flashcards: selectedMethods.includes('flashcards'),
                    podcast: selectedMethods.includes('podcast'),
                    tutor_lesson: selectedMethods.includes('tutor-lesson'),
                    written_tests: selectedMethods.includes('written-tests'),
                    fill_in_the_blanks: selectedMethods.includes('fill-blanks'),
                    speech_to_text: selectedMethods.includes('speech-to-text')
                };

                // Send the payload to n8n webhook
                const response = await fetch('https://n8n.matrixaiserver.com/webhook/matrixEdu/uploadfile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`Webhook failed: ${response.statusText}`);
                }

                const data = await response.json();
                console.log("Webhook response:", data);
                
                let doc = null;
                if (Array.isArray(data) && data.length > 0) {
                    doc = data[0];
                } else if (data && typeof data === 'object') {
                    doc = data;
                }

                if (doc && (doc.document_id || doc.id)) {
                    const docId = doc.document_id || doc.id;
                    navigate(`/study-set/${docId}`, { state: { studySetData: doc } });
                } else {
                    console.warn("Unexpected webhook response format or missing document_id", data);
                    // Fallback to default ID if response is not as expected
                    navigate('/study-set/1');
                }
            } catch (error) {
                console.error("Failed to send webhook", error);
                alert("Failed to initiate generation. Please try again.");
                setIsGenerating(false);
            }
        } else {
            navigate('/study-set/1'); 
        }
    };

    const renderSummary = () => {
        const { sourceCost, methodsCost, total } = calculateCosts();
        const canGenerate = userCoins >= total;

        return (
            <div className="space-y-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Order Summary</h2>
                    <p className="text-gray-500 dark:text-gray-400">Review your selection and estimated cost.</p>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    {/* Source Material */}
                    <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">Source Material</h3>
                            <p className="text-sm text-gray-500">
                                {(state?.uploadPayload?.uploadedFileType === 'pdf' || state?.uploadPayload?.uploadedFileType === 'pdf_vision') ? `PDF (${metaData.pageCount || 1} pages)` :
                                 state?.uploadPayload?.uploadedFileType === 'ocr' ? `PDF (OCR) (${metaData.pageCount || 1} pages)` :
                                 state?.uploadPayload?.uploadedFileType === 'image' ? 'Image' :
                                 (state?.uploadPayload?.uploadedFileType === 'audio' || state?.uploadPayload?.uploadedFileType === 'video' || (state?.uploadPayload?.uploadedFileType === 'url' && metaData.duration)) ? `Audio/Video (${Math.ceil((metaData.duration || 60) / 60)} mins)` :
                                 'Text / URL'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-lg text-red-500">
                            <span>{sourceCost > 0 ? `-${sourceCost}` : sourceCost}</span>
                            <img src={coinIcon} className="w-5 h-5" alt="coins" />
                        </div>
                    </div>

                    {/* Methods */}
                    {selectedMethods.map(m => {
                        const isFree = m === 'speech-to-text';
                        if (isFree) return null; 
                        const methodLabel = methods.find(met => met.id === m)?.label;
                        return (
                            <div key={m} className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                                <span className="font-medium">{methodLabel}</span>
                                <div className="flex items-center gap-1 font-bold text-red-500">
                                    <span>-1</span>
                                    <img src={coinIcon} className="w-5 h-5" alt="coins" />
                                </div>
                            </div>
                        );
                    })}

                    {/* Total */}
                    <div className="p-6 bg-gray-50 dark:bg-[#111] flex justify-between items-center">
                        <span className="font-bold text-xl">Total Cost</span>
                        <div className="flex items-center gap-2 font-bold text-2xl text-[#c2410c]">
                            <span>{total}</span>
                            <img src={coinIcon} className="w-6 h-6" alt="coins" />
                        </div>
                    </div>
                </div>

                {/* Balance Warning */}
                {!canGenerate && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center font-medium">
                        Insufficient balance. You need {total - userCoins} more coins.
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <button 
                        onClick={() => setStep('selection')}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-medium px-6"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleGenerate}
                        disabled={!canGenerate || isGenerating}
                        className={`bg-[#c2410c] hover:bg-[#9a3412] text-white px-12 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 ${(isGenerating || !canGenerate) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isGenerating && <AiOutlineLoading3Quarters className="animate-spin" />}
                        {isGenerating ? 'Generating...' : `Pay & Generate`}
                    </button>
                </div>
            </div>
        );
    };

    const openConfig = (e: React.MouseEvent, methodId: string) => {
        e.stopPropagation();
        setActiveConfigMethod(methodId);
    };

    const renderModalContent = () => {
        switch(activeConfigMethod) {
            case 'notes':
                return <CustomizeNotes onClose={() => setActiveConfigMethod(null)} />;
            case 'multiple-choice':
                return <CustomizeMultipleChoice onClose={() => setActiveConfigMethod(null)} />;
            case 'flashcards':
                return <CustomizeFlashcards onClose={() => setActiveConfigMethod(null)} />;
            case 'podcast':
                return <CustomizePodcast onClose={() => setActiveConfigMethod(null)} />;
            case 'written-tests':
                return <CustomizeWrittenTests onClose={() => setActiveConfigMethod(null)} />;
            case 'fill-blanks':
                return <CustomizeFillBlanks onClose={() => setActiveConfigMethod(null)} />;
            case 'speech-to-text':
                return <CustomizeSpeechToText onClose={() => setActiveConfigMethod(null)} />;
            case 'mindmap':
                return <CustomizeMindmap onClose={() => setActiveConfigMethod(null)} />;
            default:
                return (
                    <div className="py-8 text-center text-gray-400">
                        Configuration for this method is coming soon.
                        <div className="mt-6 flex justify-center">
                            <button onClick={() => setActiveConfigMethod(null)} className="bg-[#c2410c] text-white px-6 py-2 rounded-lg">Close</button>
                        </div>
                    </div>
                );
        }
    };

    const getModalTitle = () => {
        switch(activeConfigMethod) {
            case 'notes': return 'Customize Notes';
            case 'multiple-choice': return 'Customize Multiple Choice';
            case 'flashcards': return 'Customize Flashcards';
            case 'podcast': return 'Choose Your Hosts';
            case 'speech-to-text': return 'Speech to Text';
            case 'mindmap': return 'Customize Mindmap';
            default: return `Customize ${methods.find(m => m.id === activeConfigMethod)?.label}`;
        }
    };

    const getModalSubtitle = () => {
        switch(activeConfigMethod) {
            case 'notes': return 'Add custom instructions for generation';
            case 'multiple-choice': return 'Adjust the number and difficulty of questions';
            case 'flashcards': return 'Adjust the number and difficulty of questions';
            case 'podcast': return 'Select speakers and podcast length';
            case 'speech-to-text': return 'Upload an audio file or document to extract text';
            case 'mindmap': return 'Adjust mindmap complexity and style';
            default: return '';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white flex font-sans overflow-hidden">
            {/* Sidebar removed as requested */}
            
            <main className="flex-1 flex flex-col relative h-screen">
                {/* Header */}
                <div className="h-16 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-white/10 flex items-center px-8 flex-shrink-0">
                     <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 dark:hover:text-white mr-4">
                        <FaArrowLeft size={12} />
                     </button>
                     <h1 className="font-bold text-lg text-gray-900 dark:text-white truncate max-w-2xl" title={getFileName()}>{getFileName()}</h1>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
                    {isGenerating ? (
                        <div className="max-w-md w-full text-center space-y-8">
                            <div className="relative w-48 h-48 mx-auto">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="text-gray-200 dark:text-gray-800"
                                    />
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="88"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={2 * Math.PI * 88}
                                        strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                                        className="text-[#c2410c] transition-all duration-300 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white animate-pulse min-h-[3rem]">
                                    {loadingText}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                                    We're crafting your personalized study materials. This process takes about 3 minutes to ensure high quality.
                                </p>
                            </div>
                        </div>
                    ) : (
                    <div className="max-w-4xl w-full">
                        {step === 'summary' ? renderSummary() : (
                            <>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">What would you like to include?</h2>
                            <p className="text-gray-500 dark:text-gray-400">Choose all the methods you want included in your study set:</p>
                        </div>

                        {/* First Row: 4 items in 2x2 grid on all screens */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                            {visibleMethods.slice(0, 4).map((method) => {
                                const isSelected = selectedMethods.includes(method.id);
                                return (
                                    <div 
                                        key={method.id}
                                        onClick={() => toggleMethod(method.id)}
                                        className={`relative flex flex-col md:flex-row items-center md:items-center justify-center md:justify-start p-3 md:p-6 rounded-xl border cursor-pointer transition-all h-auto md:h-24 group ${
                                            isSelected 
                                            ? 'bg-orange-50 dark:bg-[#1a1a1a] border-orange-200 dark:border-white/20' 
                                            : 'bg-white dark:bg-[#111] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        {/* Filter Button (Only when selected) */}
                                        {isSelected && (
                                            <button 
                                                onClick={(e) => openConfig(e, method.id)}
                                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-10"
                                            >
                                                <FaSlidersH size={14} />
                                            </button>
                                        )}

                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 md:mb-0 md:mr-4 transition-colors ${
                                            isSelected ? 'bg-[#c2410c]/20 text-[#c2410c]' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500'
                                        }`}>
                                            {method.icon}
                                        </div>
                                        <span className={`font-medium text-sm md:text-lg text-center md:text-left ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
                                            {method.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Second Row: 2 items on mobile, 3 on medium */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-12">
                            {visibleMethods.slice(4).map((method) => {
                                const isSelected = selectedMethods.includes(method.id);
                                return (
                                    <div 
                                        key={method.id}
                                        onClick={() => toggleMethod(method.id)}
                                        className={`relative flex flex-col md:flex-row items-center md:items-center justify-center md:justify-start p-3 md:p-6 rounded-xl border cursor-pointer transition-all h-auto md:h-24 group ${
                                            isSelected 
                                            ? 'bg-orange-50 dark:bg-[#1a1a1a] border-orange-200 dark:border-white/20' 
                                            : 'bg-white dark:bg-[#111] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        {/* Filter Button (Only when selected) */}
                                        {isSelected && (
                                            <button 
                                                onClick={(e) => openConfig(e, method.id)}
                                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-10"
                                            >
                                                <FaSlidersH size={14} />
                                            </button>
                                        )}

                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 md:mb-0 md:mr-4 transition-colors ${
                                            isSelected ? 'bg-[#c2410c]/20 text-[#c2410c]' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500'
                                        }`}>
                                            {method.icon}
                                        </div>
                                        <span className={`font-medium text-sm md:text-lg text-center md:text-left ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
                                            {method.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center pt-6">
                            {/* Language Selector */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                                    className="flex items-center gap-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors min-w-[140px] justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{selectedLanguage.flag}</span>
                                        <span>{selectedLanguage.name}</span>
                                    </div>
                                    <FaChevronDown size={10} className={`text-gray-500 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isLanguageDropdownOpen && (
                                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                                        <div className="max-h-64 overflow-y-auto">
                                            {languages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => {
                                                        setSelectedLanguage(lang);
                                                        setIsLanguageDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                                                        selectedLanguage.code === lang.code ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5' : 'text-gray-500 dark:text-gray-400'
                                                    }`}
                                                >
                                                    <span className="text-lg">{lang.flag}</span>
                                                    <span>{lang.name}</span>
                                                    {selectedLanguage.code === lang.code && (
                                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c2410c]" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setStep('summary')}
                                className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-12 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
                            >
                                Next
                            </button>
                        </div>
                        </>
                        )}
                    </div>
                    )}
                </div>

                {/* Modals */}
                <BaseModal 
                    isOpen={!!activeConfigMethod} 
                    onClose={() => setActiveConfigMethod(null)}
                    title={getModalTitle()}
                    subtitle={getModalSubtitle()}
                >
                    {renderModalContent()}
                </BaseModal>
            </main>
        </div>
    );
};

export default MethodSelectionPage;
