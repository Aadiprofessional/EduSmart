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
import { useLanguage } from '../utils/LanguageContext';

// Initialize PDF.js worker
// Use unpkg for reliable worker loading matching the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// --- Configuration Interfaces ---
interface MethodConfig {
    notes: { customInstructions: string };
    multipleChoice: { numQuestions: string; difficulty: string; customInstructions: string };
    flashcards: { numCards: string; difficulty: string; customInstructions: string };
    podcast: { length: string; personality: string; host1: string; host2: string; language: string };
    writtenTests: { numQuestions: string; difficulty: string; customInstructions: string };
    fillBlanks: { numQuestions: string; difficulty: string; customInstructions: string };
    speechToText: { audioLanguageCode: string; audioLanguageName: string };
    mindmap: { depth: string };
}

const defaultMethodConfig: MethodConfig = {
    notes: { customInstructions: '' },
    multipleChoice: { numQuestions: 'auto', difficulty: 'auto', customInstructions: '' },
    flashcards: { numCards: 'auto', difficulty: 'auto', customInstructions: '' },
    podcast: { length: 'auto', personality: 'default', host1: 'Random', host2: 'Random', language: 'english' },
    writtenTests: { numQuestions: 'auto', difficulty: 'auto', customInstructions: '' },
    fillBlanks: { numQuestions: 'auto', difficulty: 'auto', customInstructions: '' },
    speechToText: { audioLanguageCode: 'en', audioLanguageName: 'English' },
    mindmap: { depth: 'medium' }
};

// --- Configuration Components ---

const CustomizeNotes: React.FC<{ 
    config: MethodConfig['notes']; 
    onChange: (updates: Partial<MethodConfig['notes']>) => void;
    onClose: () => void;
}> = ({ config, onChange, onClose }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('methodSelection.customInstructionsOptional')}</label>
                <textarea 
                    className="w-full h-32 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder={t('methodSelection.customInstructionsPlaceholderDefinitions')}
                    value={config.customInstructions}
                    onChange={(e) => onChange({ customInstructions: e.target.value })}
                />
            </div>
            <div className="flex justify-between items-center pt-4">
                <button 
                    onClick={() => onChange({ customInstructions: '' })}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors"
                >
                    {t('methodSelection.clearSelection')}
                </button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">{t('methodSelection.done')}</button>
            </div>
        </div>
    );
};

const CustomizeMultipleChoice: React.FC<{ 
    config: MethodConfig['multipleChoice']; 
    onChange: (updates: Partial<MethodConfig['multipleChoice']>) => void;
    onClose: () => void;
}> = ({ config, onChange, onClose }) => {
    const { t } = useLanguage();
    const { numQuestions, difficulty, customInstructions } = config;

    const updateConfig = (updates: Partial<MethodConfig['multipleChoice']>) => {
        onChange(updates);
    };

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
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.numberOfQuestions')}</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={numQuestions === 'auto'} 
                        onClick={() => updateConfig({ numQuestions: 'auto' })}
                        label={t('methodSelection.auto')} 
                        subLabel={t('methodSelection.smart')}
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'few'} 
                        onClick={() => updateConfig({ numQuestions: 'few' })}
                        label={t('methodSelection.few')} 
                        subLabel="1-15"
                        icon={<FaListUl />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'standard'} 
                        onClick={() => updateConfig({ numQuestions: 'standard' })}
                        label={t('methodSelection.standard')} 
                        subLabel="20-40"
                        icon={<FaBook />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'many'} 
                        onClick={() => updateConfig({ numQuestions: 'many' })}
                        label={t('methodSelection.many')} 
                        subLabel="50+"
                        icon={<FaLayerGroup />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.difficultyLevel')}</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={difficulty === 'auto'} 
                        onClick={() => updateConfig({ difficulty: 'auto' })}
                        label={t('methodSelection.auto')} 
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={difficulty === 'easy'} 
                        onClick={() => updateConfig({ difficulty: 'easy' })}
                        label={t('methodSelection.easy')} 
                        icon={<FaLeaf />} 
                    />
                    <OptionButton 
                        active={difficulty === 'medium'} 
                        onClick={() => updateConfig({ difficulty: 'medium' })}
                        label={t('methodSelection.medium')} 
                        icon={<FaBullseye />} 
                    />
                    <OptionButton 
                        active={difficulty === 'hard'} 
                        onClick={() => updateConfig({ difficulty: 'hard' })}
                        label={t('methodSelection.hard')} 
                        icon={<FaFire />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('methodSelection.customInstructionsOptional')}</label>
                <textarea 
                    className="w-full h-24 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder={t('methodSelection.customInstructionsPlaceholderChapter')}
                    value={customInstructions}
                    onChange={(e) => updateConfig({ customInstructions: e.target.value })}
                />
            </div>

            <div className="flex justify-between items-center pt-2">
                <button 
                    onClick={() => updateConfig({ numQuestions: 'auto', difficulty: 'auto', customInstructions: '' })}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors"
                >
                    {t('methodSelection.clearSelection')}
                </button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">{t('methodSelection.done')}</button>
            </div>
        </div>
    );
};

const CustomizeFlashcards: React.FC<{ 
    config: MethodConfig['flashcards']; 
    onChange: (updates: Partial<MethodConfig['flashcards']>) => void;
    onClose: () => void;
}> = ({ config, onChange, onClose }) => {
    const { t } = useLanguage();
    const { numCards, difficulty, customInstructions } = config;

    const updateConfig = (updates: Partial<MethodConfig['flashcards']>) => {
        onChange(updates);
    };

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
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.numberOfCards')}</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={numCards === 'auto'} 
                        onClick={() => updateConfig({ numCards: 'auto' })}
                        label={t('methodSelection.auto')} 
                        subLabel={t('methodSelection.smart')}
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={numCards === 'few'} 
                        onClick={() => updateConfig({ numCards: 'few' })}
                        label={t('methodSelection.few')} 
                        subLabel="1-15"
                        icon={<FaListUl />} 
                    />
                    <OptionButton 
                        active={numCards === 'standard'} 
                        onClick={() => updateConfig({ numCards: 'standard' })}
                        label={t('methodSelection.standard')} 
                        subLabel="20-40"
                        icon={<FaBook />} 
                    />
                    <OptionButton 
                        active={numCards === 'many'} 
                        onClick={() => updateConfig({ numCards: 'many' })}
                        label={t('methodSelection.many')} 
                        subLabel="50+"
                        icon={<FaLayerGroup />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.difficultyLevel')}</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={difficulty === 'auto'} 
                        onClick={() => updateConfig({ difficulty: 'auto' })}
                        label={t('methodSelection.auto')} 
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={difficulty === 'easy'} 
                        onClick={() => updateConfig({ difficulty: 'easy' })}
                        label={t('methodSelection.easy')} 
                        icon={<FaLeaf />} 
                    />
                    <OptionButton 
                        active={difficulty === 'medium'} 
                        onClick={() => updateConfig({ difficulty: 'medium' })}
                        label={t('methodSelection.medium')} 
                        icon={<FaBullseye />} 
                    />
                    <OptionButton 
                        active={difficulty === 'hard'} 
                        onClick={() => updateConfig({ difficulty: 'hard' })}
                        label={t('methodSelection.hard')} 
                        icon={<FaFire />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('methodSelection.customInstructionsOptional')}</label>
                <textarea 
                    className="w-full h-24 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder={t('methodSelection.customInstructionsPlaceholderChapter')}
                    value={customInstructions}
                    onChange={(e) => updateConfig({ customInstructions: e.target.value })}
                />
            </div>

            <div className="flex justify-between items-center pt-2">
                <button 
                    onClick={() => updateConfig({ numCards: 'auto', difficulty: 'auto', customInstructions: '' })}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors"
                >
                    {t('methodSelection.clearSelection')}
                </button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">{t('methodSelection.done')}</button>
            </div>
        </div>
    );
};

const CustomizePodcast: React.FC<{ 
    config: MethodConfig['podcast']; 
    onChange: (updates: Partial<MethodConfig['podcast']>) => void;
    onClose: () => void;
}> = ({ config, onChange, onClose }) => {
    const { t } = useLanguage();
    const { length, personality, host1, host2, language } = config;

    const updateConfig = (updates: Partial<MethodConfig['podcast']>) => {
        onChange(updates);
    };

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

    const podcastLanguages = [
        { value: 'english', label: t('methodSelection.podcastLanguages.english') },
        { value: 'cantonese', label: t('methodSelection.podcastLanguages.cantonese') },
        { value: 'traditional_chinese', label: t('methodSelection.podcastLanguages.traditionalChinese') },
        { value: 'simplified_chinese', label: t('methodSelection.podcastLanguages.simplifiedChinese') },
        { value: 'hindi', label: t('methodSelection.podcastLanguages.hindi') },
        { value: 'japanese', label: t('methodSelection.podcastLanguages.japanese') }
    ];

    const renderHostInput = (value: string, subLabel: string, onValueChange: (nextValue: string) => void) => (
        <div className="flex items-center p-4 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/5 rounded-xl gap-3">
             <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                {value === 'Random' ? (
                    <FaRandom className="text-gray-500 dark:text-gray-400" />
                ) : (
                    <FaUser className="text-gray-500 dark:text-gray-400" />
                )}
             </div>
             <div className="w-full">
                 <div className="text-xs text-gray-500 mb-1">{subLabel}</div>
                 <input
                    type="text"
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                    placeholder={t('methodSelection.enterHostName')}
                    className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none"
                 />
             </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.speakers')}</label>
                <div className="space-y-3">
                    {renderHostInput(host1, t('methodSelection.speaker1'), (value: string) => updateConfig({ host1: value }))}
                    {renderHostInput(host2, t('methodSelection.speaker2'), (value: string) => updateConfig({ host2: value }))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.podcastLanguage')}</label>
                <select
                    value={language}
                    onChange={(e) => updateConfig({ language: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none"
                >
                    {podcastLanguages.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.podcastLength')}</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={length === 'auto'} 
                        onClick={() => updateConfig({ length: 'auto' })}
                        label={t('methodSelection.auto')} 
                        subLabel={t('methodSelection.smart')}
                    />
                    <OptionButton 
                        active={length === 'short'} 
                        onClick={() => updateConfig({ length: 'short' })}
                        label={t('methodSelection.short')} 
                        subLabel="5-8 min"
                    />
                    <OptionButton 
                        active={length === 'medium'} 
                        onClick={() => updateConfig({ length: 'medium' })}
                        label={t('methodSelection.medium')} 
                        subLabel="10-15 min"
                    />
                    <OptionButton 
                        active={length === 'long'} 
                        onClick={() => updateConfig({ length: 'long' })}
                        label={t('methodSelection.long')} 
                        subLabel="18-25 min"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.personality')}</label>
                <div className="grid grid-cols-3 gap-3">
                    <OptionButton 
                        active={personality === 'default'} 
                        onClick={() => updateConfig({ personality: 'default' })}
                        label={t('methodSelection.default')} 
                        icon={<FaUser />}
                    />
                    <OptionButton 
                        active={personality === 'sassy'} 
                        onClick={() => updateConfig({ personality: 'sassy' })}
                        label={t('methodSelection.sassy')} 
                        icon={<FaMagic />}
                    />
                    <OptionButton 
                        active={personality === 'annoyed'} 
                        onClick={() => updateConfig({ personality: 'annoyed' })}
                        label={t('methodSelection.annoyed')} 
                        icon={<FaMeh />}
                    />
                     <OptionButton 
                        active={personality === 'angry'} 
                        onClick={() => updateConfig({ personality: 'angry' })}
                        label={t('methodSelection.angry')} 
                        icon={<FaAngry />}
                    />
                    <OptionButton 
                        active={personality === 'gaslighter'} 
                        onClick={() => updateConfig({ personality: 'gaslighter' })}
                        label={t('methodSelection.gaslighter')} 
                        icon={<FaFrown />}
                    />
                    <OptionButton 
                        active={personality === 'corny'} 
                        onClick={() => updateConfig({ personality: 'corny' })}
                        label={t('methodSelection.corny')} 
                        icon={<FaSmile />}
                    />
                </div>
            </div>

            <div className="flex justify-between items-center pt-2">
                <button 
                    onClick={() => updateConfig({ length: 'auto', personality: 'default', host1: 'Random', host2: 'Random', language: 'english' })}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors"
                >
                    {t('methodSelection.clearSelection')}
                </button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">{t('methodSelection.done')}</button>
            </div>
        </div>
    );
};


const CustomizeWrittenTests: React.FC<{ 
    config: MethodConfig['writtenTests']; 
    onChange: (updates: Partial<MethodConfig['writtenTests']>) => void;
    onClose: () => void;
}> = ({ config, onChange, onClose }) => {
    const { t } = useLanguage();
    const { numQuestions, difficulty, customInstructions } = config;

    const updateConfig = (updates: Partial<MethodConfig['writtenTests']>) => {
        onChange(updates);
    };

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
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.numberOfQuestions')}</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={numQuestions === 'auto'} 
                        onClick={() => updateConfig({ numQuestions: 'auto' })}
                        label={t('methodSelection.auto')} 
                        subLabel={t('methodSelection.smart')}
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'few'} 
                        onClick={() => updateConfig({ numQuestions: 'few' })}
                        label={t('methodSelection.few')} 
                        subLabel="1-15"
                        icon={<FaListUl />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'standard'} 
                        onClick={() => updateConfig({ numQuestions: 'standard' })}
                        label={t('methodSelection.standard')} 
                        subLabel="20-40"
                        icon={<FaBook />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'many'} 
                        onClick={() => updateConfig({ numQuestions: 'many' })}
                        label={t('methodSelection.many')} 
                        subLabel="50+"
                        icon={<FaLayerGroup />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.difficultyLevel')}</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={difficulty === 'auto'} 
                        onClick={() => updateConfig({ difficulty: 'auto' })}
                        label={t('methodSelection.auto')} 
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={difficulty === 'easy'} 
                        onClick={() => updateConfig({ difficulty: 'easy' })}
                        label={t('methodSelection.easy')} 
                        icon={<FaLeaf />} 
                    />
                    <OptionButton 
                        active={difficulty === 'medium'} 
                        onClick={() => updateConfig({ difficulty: 'medium' })}
                        label={t('methodSelection.medium')} 
                        icon={<FaBullseye />} 
                    />
                    <OptionButton 
                        active={difficulty === 'hard'} 
                        onClick={() => updateConfig({ difficulty: 'hard' })}
                        label={t('methodSelection.hard')} 
                        icon={<FaFire />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('methodSelection.customInstructionsOptional')}</label>
                <textarea 
                    className="w-full h-24 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder={t('methodSelection.customInstructionsPlaceholderChapter')}
                    value={customInstructions}
                    onChange={(e) => updateConfig({ customInstructions: e.target.value })}
                />
            </div>

            <div className="flex justify-between items-center pt-2">
                <button 
                    onClick={() => updateConfig({ numQuestions: 'auto', difficulty: 'auto', customInstructions: '' })}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors"
                >
                    {t('methodSelection.clearSelection')}
                </button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">{t('methodSelection.done')}</button>
            </div>
        </div>
    );
};

const CustomizeFillBlanks: React.FC<{ 
    config: MethodConfig['fillBlanks']; 
    onChange: (updates: Partial<MethodConfig['fillBlanks']>) => void;
    onClose: () => void;
}> = ({ config, onChange, onClose }) => {
    const { t } = useLanguage();
    // Reusing structure for Fill in the Blanks
    const { numQuestions, difficulty, customInstructions } = config;

    const updateConfig = (updates: Partial<MethodConfig['fillBlanks']>) => {
        onChange(updates);
    };

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
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.numberOfQuestions')}</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={numQuestions === 'auto'} 
                        onClick={() => updateConfig({ numQuestions: 'auto' })}
                        label={t('methodSelection.auto')} 
                        subLabel={t('methodSelection.smart')}
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'few'} 
                        onClick={() => updateConfig({ numQuestions: 'few' })}
                        label={t('methodSelection.few')} 
                        subLabel="1-15"
                        icon={<FaListUl />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'standard'} 
                        onClick={() => updateConfig({ numQuestions: 'standard' })}
                        label={t('methodSelection.standard')} 
                        subLabel="20-40"
                        icon={<FaBook />} 
                    />
                    <OptionButton 
                        active={numQuestions === 'many'} 
                        onClick={() => updateConfig({ numQuestions: 'many' })}
                        label={t('methodSelection.many')} 
                        subLabel="50+"
                        icon={<FaLayerGroup />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.difficultyLevel')}</label>
                <div className="grid grid-cols-4 gap-3">
                    <OptionButton 
                        active={difficulty === 'auto'} 
                        onClick={() => updateConfig({ difficulty: 'auto' })}
                        label={t('methodSelection.auto')} 
                        icon={<FaMagic />} 
                    />
                    <OptionButton 
                        active={difficulty === 'easy'} 
                        onClick={() => updateConfig({ difficulty: 'easy' })}
                        label={t('methodSelection.easy')} 
                        icon={<FaLeaf />} 
                    />
                    <OptionButton 
                        active={difficulty === 'medium'} 
                        onClick={() => updateConfig({ difficulty: 'medium' })}
                        label={t('methodSelection.medium')} 
                        icon={<FaBullseye />} 
                    />
                    <OptionButton 
                        active={difficulty === 'hard'} 
                        onClick={() => updateConfig({ difficulty: 'hard' })}
                        label={t('methodSelection.hard')} 
                        icon={<FaFire />} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('methodSelection.customInstructionsOptional')}</label>
                <textarea 
                    className="w-full h-24 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#c2410c] focus:border-transparent outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder={t('methodSelection.customInstructionsPlaceholderChapter')}
                    value={customInstructions}
                    onChange={(e) => updateConfig({ customInstructions: e.target.value })}
                />
            </div>

            <div className="flex justify-between items-center pt-2">
                <button 
                    onClick={() => updateConfig({ numQuestions: 'auto', difficulty: 'auto', customInstructions: '' })}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors"
                >
                    {t('methodSelection.clearSelection')}
                </button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">{t('methodSelection.done')}</button>
            </div>
        </div>
    );
};


const CustomizeSpeechToText: React.FC<{ 
    config: MethodConfig['speechToText']; 
    languages: { code: string; name: string }[];
    onChange: (updates: Partial<MethodConfig['speechToText']>) => void;
    onClose: () => void;
}> = ({ config, languages, onChange, onClose }) => {
    const { t } = useLanguage();
    const { audioLanguageCode } = config;

    const updateConfig = (updates: Partial<MethodConfig['speechToText']>) => {
        onChange(updates);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.audioLanguage')}</label>
                <div className="grid grid-cols-2 gap-3">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => updateConfig({ audioLanguageCode: lang.code, audioLanguageName: lang.name })}
                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                audioLanguageCode === lang.code
                                ? 'bg-[#c2410c]/10 border-[#c2410c] text-[#c2410c]'
                                : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]'
                            }`}
                        >
                            <span className="font-medium text-sm">{lang.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center pt-2">
                <button
                    onClick={() => updateConfig({ audioLanguageCode: 'en', audioLanguageName: 'English' })}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors"
                >
                    {t('methodSelection.reset')}
                </button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">{t('methodSelection.done')}</button>
            </div>
        </div>
    );
};

const CustomizeMindmap: React.FC<{ 
    config: MethodConfig['mindmap']; 
    onChange: (updates: Partial<MethodConfig['mindmap']>) => void;
    onClose: () => void;
}> = ({ config, onChange, onClose }) => {
    const { t } = useLanguage();
    const { depth } = config;

    const updateConfig = (updates: Partial<MethodConfig['mindmap']>) => {
        onChange(updates);
    };

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
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('methodSelection.mindmapDepth')}</label>
                <div className="grid grid-cols-3 gap-3">
                    <OptionButton 
                        active={depth === 'simple'} 
                        onClick={() => updateConfig({ depth: 'simple' })}
                        label={t('methodSelection.simple')} 
                    />
                    <OptionButton 
                        active={depth === 'medium'} 
                        onClick={() => updateConfig({ depth: 'medium' })}
                        label={t('methodSelection.detailed')} 
                    />
                    <OptionButton 
                        active={depth === 'complex'} 
                        onClick={() => updateConfig({ depth: 'complex' })}
                        label={t('methodSelection.complex')} 
                    />
                </div>
            </div>

            <div className="flex justify-between items-center pt-2">
                <button 
                    onClick={() => updateConfig({ depth: 'medium' })}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm font-medium transition-colors"
                >
                    {t('methodSelection.reset')}
                </button>
                <button onClick={onClose} className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-6 py-2 rounded-lg font-bold transition-colors">{t('methodSelection.done')}</button>
            </div>
        </div>
    );
};


// --- Main Page Component ---
const MethodSelectionPage: React.FC = () => {
    const { t } = useLanguage();
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
    const [methodConfig, setMethodConfig] = useState<MethodConfig>(defaultMethodConfig);
    const [activeConfigMethod, setActiveConfigMethod] = useState<string | null>(null);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState({ code: 'en', name: 'English' });
    const [showSpeechToTextHint, setShowSpeechToTextHint] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [step, setStep] = useState<'selection' | 'summary'>('selection');
    const [metaData, setMetaData] = useState<{ duration?: number; pageCount?: number }>({});
    const [userCoins, setUserCoins] = useState<number>(0);
    const { user } = useAuth();

    // Progress Bar State
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState(t('methodSelection.loading.initializing'));

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
                if (newProgress < 5) setLoadingText(t('methodSelection.loading.initializing'));
                else if (newProgress < 15) setLoadingText(t('methodSelection.loading.analyzingFiles'));
                else if (newProgress < 30) setLoadingText(t('methodSelection.loading.generatingNotes'));
                else if (newProgress < 45) setLoadingText(t('methodSelection.loading.creatingQuestions'));
                else if (newProgress < 60) setLoadingText(t('methodSelection.loading.formulatingFlashcards'));
                else if (newProgress < 80) setLoadingText(t('methodSelection.loading.polishingStudySet'));
                else if (newProgress < 99) setLoadingText(t('methodSelection.loading.almostThere'));
                else {
                    // Stalled at 99%
                    const stallTime = elapsed - duration;
                    if (stallTime > 40000) {
                         setLoadingText(t('methodSelection.loading.highTraffic'));
                    } else if (stallTime > 20000) {
                         setLoadingText(t('methodSelection.loading.longerThanExpected'));
                    } else {
                         setLoadingText(t('methodSelection.loading.waitLonger'));
                    }
                }
            }, 100);
        } else {
            setProgress(0);
            setLoadingText(t('methodSelection.loading.initializing'));
        }

        return () => clearInterval(interval);
    }, [isGenerating, t]);

    // Helper to extract file name from payload
    const getFileName = () => {
        if (!state?.uploadPayload) return t('methodSelection.newStudySet');
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
        
        return t('methodSelection.newStudySet');
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

    React.useEffect(() => {
        if (!showSpeechToTextHint) return;
        const timer = setTimeout(() => setShowSpeechToTextHint(false), 3000);
        return () => clearTimeout(timer);
    }, [showSpeechToTextHint]);

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
        { code: 'en', name: 'English' },
        { code: 'yue', name: 'Chinese (Cantonese)' },
        { code: 'zh-Hant', name: 'Chinese Taiwan' },
        { code: 'zh-Hans', name: 'Chinese (Simplified)' },
    ];

    const methods = [
        { id: 'notes', label: t('studyMaterialPage.methodLabels.notes'), icon: <FaBook /> },
        { id: 'multiple-choice', label: t('studyMaterialPage.methodLabels.multipleChoice'), icon: <FaListUl /> },
        { id: 'flashcards', label: t('studyMaterialPage.methodLabels.flashcards'), icon: <FaLayerGroup /> },
        { id: 'podcast', label: t('methodSelection.methodLabels.podcast'), icon: <FaPodcast /> },
        { id: 'tutor-lesson', label: t('methodSelection.methodLabels.tutorLesson'), icon: <FaChalkboardTeacher /> },
        { id: 'written-tests', label: t('methodSelection.methodLabels.writtenTests'), icon: <FaPencilAlt /> },
        { id: 'fill-blanks', label: t('methodSelection.methodLabels.fillBlanks'), icon: <FaEdit /> },
        { id: 'speech-to-text', label: t('methodSelection.methodLabels.speechToText'), icon: <FaMicrophone /> },
        { id: 'mindmap', label: t('methodSelection.methodLabels.mindmap'), icon: <FaProjectDiagram /> },
    ];

    const isSpeechToTextVisible =
        state?.uploadPayload?.uploadedFileType === 'audio' ||
        state?.uploadPayload?.uploadedFileType === 'video' ||
        state?.uploadPayload?.uploadedFileType === 'url';

    const visibleMethods = methods.filter(m => {
        if (m.id === 'speech-to-text') {
             return isSpeechToTextVisible;
        }
        return true;
    });

    React.useEffect(() => {
        if (step === 'selection' && isSpeechToTextVisible && selectedMethods.includes('speech-to-text')) {
            setShowSpeechToTextHint(true);
        }
    }, [step, isSpeechToTextVisible, selectedMethods]);

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
            alert(t('methodSelection.insufficientBalance'));
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
                    file_name: getFileName(),
                    configuration: methodConfig,
                    selected_language: selectedLanguage.name,
                    selected_language_code: selectedLanguage.code,
                    speech_to_text_language: methodConfig.speechToText.audioLanguageName,
                    speech_to_text_language_code: methodConfig.speechToText.audioLanguageCode,
                    podcast_language: methodConfig.podcast.language,
                    podcast_hosts: [methodConfig.podcast.host1, methodConfig.podcast.host2],
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
                alert(t('methodSelection.failedToInitiateGeneration'));
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
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{t('methodSelection.orderSummary')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t('methodSelection.reviewSelection')}</p>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    {/* Source Material */}
                    <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{t('methodSelection.sourceMaterial')}</h3>
                            <p className="text-sm text-gray-500">
                                {(state?.uploadPayload?.uploadedFileType === 'pdf' || state?.uploadPayload?.uploadedFileType === 'pdf_vision') ? t('methodSelection.pdfPages', { count: metaData.pageCount || 1 }) :
                                 state?.uploadPayload?.uploadedFileType === 'ocr' ? t('methodSelection.pdfOcrPages', { count: metaData.pageCount || 1 }) :
                                 state?.uploadPayload?.uploadedFileType === 'image' ? t('methodSelection.image') :
                                 (state?.uploadPayload?.uploadedFileType === 'audio' || state?.uploadPayload?.uploadedFileType === 'video' || (state?.uploadPayload?.uploadedFileType === 'url' && metaData.duration)) ? t('methodSelection.audioVideoMins', { count: Math.ceil((metaData.duration || 60) / 60) }) :
                                 t('methodSelection.textOrUrl')}
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
                        <span className="font-bold text-xl">{t('methodSelection.totalCost')}</span>
                        <div className="flex items-center gap-2 font-bold text-2xl text-[#c2410c]">
                            <span>{total}</span>
                            <img src={coinIcon} className="w-6 h-6" alt="coins" />
                        </div>
                    </div>
                </div>

                {/* Balance Warning */}
                {!canGenerate && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center font-medium">
                        {t('methodSelection.insufficientBalanceNeedMore', { count: total - userCoins })}
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <button 
                        onClick={() => setStep('selection')}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-medium px-6"
                    >
                        {t('common.back')}
                    </button>
                    <button 
                        onClick={handleGenerate}
                        disabled={!canGenerate || isGenerating}
                        className={`bg-[#c2410c] hover:bg-[#9a3412] text-white px-12 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 ${(isGenerating || !canGenerate) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isGenerating && <AiOutlineLoading3Quarters className="animate-spin" />}
                        {isGenerating ? t('methodSelection.generating') : t('methodSelection.payAndGenerate')}
                    </button>
                </div>
            </div>
        );
    };

    const openConfig = (e: React.MouseEvent, methodId: string) => {
        e.stopPropagation();
        if (methodId === 'speech-to-text') {
            setShowSpeechToTextHint(false);
        }
        setActiveConfigMethod(methodId);
    };

    const updateMethodConfig = <K extends keyof MethodConfig>(method: K, updates: Partial<MethodConfig[K]>) => {
        setMethodConfig(prev => ({
            ...prev,
            [method]: { ...prev[method], ...updates }
        }));
    };

    const renderModalContent = () => {
        switch(activeConfigMethod) {
            case 'notes':
                return <CustomizeNotes 
                    config={methodConfig.notes} 
                    onChange={(updates) => updateMethodConfig('notes', updates)} 
                    onClose={() => setActiveConfigMethod(null)} 
                />;
            case 'multiple-choice':
                return <CustomizeMultipleChoice 
                    config={methodConfig.multipleChoice} 
                    onChange={(updates) => updateMethodConfig('multipleChoice', updates)} 
                    onClose={() => setActiveConfigMethod(null)} 
                />;
            case 'flashcards':
                return <CustomizeFlashcards 
                    config={methodConfig.flashcards} 
                    onChange={(updates) => updateMethodConfig('flashcards', updates)} 
                    onClose={() => setActiveConfigMethod(null)} 
                />;
            case 'podcast':
                return <CustomizePodcast 
                    config={methodConfig.podcast} 
                    onChange={(updates) => updateMethodConfig('podcast', updates)} 
                    onClose={() => setActiveConfigMethod(null)} 
                />;
            case 'written-tests':
                return <CustomizeWrittenTests 
                    config={methodConfig.writtenTests} 
                    onChange={(updates) => updateMethodConfig('writtenTests', updates)} 
                    onClose={() => setActiveConfigMethod(null)} 
                />;
            case 'fill-blanks':
                return <CustomizeFillBlanks 
                    config={methodConfig.fillBlanks} 
                    onChange={(updates) => updateMethodConfig('fillBlanks', updates)} 
                    onClose={() => setActiveConfigMethod(null)} 
                />;
            case 'speech-to-text':
                return <CustomizeSpeechToText 
                    config={methodConfig.speechToText} 
                    languages={languages}
                    onChange={(updates) => updateMethodConfig('speechToText', updates)} 
                    onClose={() => setActiveConfigMethod(null)} 
                />;
            case 'mindmap':
                return <CustomizeMindmap 
                    config={methodConfig.mindmap} 
                    onChange={(updates) => updateMethodConfig('mindmap', updates)} 
                    onClose={() => setActiveConfigMethod(null)} 
                />;
            default:
                return (
                    <div className="py-8 text-center text-gray-400">
                        {t('methodSelection.configurationComingSoon')}
                        <div className="mt-6 flex justify-center">
                            <button onClick={() => setActiveConfigMethod(null)} className="bg-[#c2410c] text-white px-6 py-2 rounded-lg">{t('common.close')}</button>
                        </div>
                    </div>
                );
        }
    };

    const getModalTitle = () => {
        switch(activeConfigMethod) {
            case 'notes': return t('methodSelection.modalTitles.customizeNotes');
            case 'multiple-choice': return t('methodSelection.modalTitles.customizeMultipleChoice');
            case 'flashcards': return t('methodSelection.modalTitles.customizeFlashcards');
            case 'podcast': return t('methodSelection.modalTitles.chooseHosts');
            case 'speech-to-text': return t('methodSelection.modalTitles.speechToText');
            case 'mindmap': return t('methodSelection.modalTitles.customizeMindmap');
            default: return `${t('methodSelection.modalTitles.customize')} ${methods.find(m => m.id === activeConfigMethod)?.label || ''}`;
        }
    };

    const getModalSubtitle = () => {
        switch(activeConfigMethod) {
            case 'notes': return t('methodSelection.modalSubtitles.notes');
            case 'multiple-choice': return t('methodSelection.modalSubtitles.multipleChoice');
            case 'flashcards': return t('methodSelection.modalSubtitles.flashcards');
            case 'podcast': return t('methodSelection.modalSubtitles.podcast');
            case 'speech-to-text': return t('methodSelection.modalSubtitles.speechToText');
            case 'mindmap': return t('methodSelection.modalSubtitles.mindmap');
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
                                    {t('methodSelection.generatingDescription')}
                                </p>
                            </div>
                        </div>
                    ) : (
                    <div className="max-w-4xl w-full">
                        {step === 'summary' ? renderSummary() : (
                            <>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{t('methodSelection.whatToInclude')}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{t('methodSelection.chooseMethods')}</p>
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
                                                className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors z-10 ${
                                                    method.id === 'speech-to-text'
                                                        ? 'text-[#c2410c] bg-[#c2410c]/10 hover:bg-[#c2410c]/20'
                                                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <FaSlidersH size={14} />
                                            </button>
                                        )}
                                        {isSelected && method.id === 'speech-to-text' && showSpeechToTextHint && (
                                            <div className="absolute right-12 -top-11 z-20 pointer-events-none animate-pulse">
                                                <div className="relative bg-[#c2410c] text-white text-[10px] md:text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                                                    {t('methodSelection.speechToTextFilterHint')}
                                                    <div className="absolute right-3 -bottom-1 w-2 h-2 bg-[#c2410c] rotate-45" />
                                                </div>
                                            </div>
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
                                                className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors z-10 ${
                                                    method.id === 'speech-to-text'
                                                        ? 'text-[#c2410c] bg-[#c2410c]/10 hover:bg-[#c2410c]/20'
                                                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <FaSlidersH size={14} />
                                            </button>
                                        )}
                                        {isSelected && method.id === 'speech-to-text' && showSpeechToTextHint && (
                                            <div className="absolute right-12 -top-11 z-20 pointer-events-none animate-pulse">
                                                <div className="relative bg-[#c2410c] text-white text-[10px] md:text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                                                    {t('methodSelection.speechToTextFilterHint')}
                                                    <div className="absolute right-3 -bottom-1 w-2 h-2 bg-[#c2410c] rotate-45" />
                                                </div>
                                            </div>
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
                                                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                                                        selectedLanguage.code === lang.code ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5' : 'text-gray-500 dark:text-gray-400'
                                                    }`}
                                                >
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
                                {t('common.next')}
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
