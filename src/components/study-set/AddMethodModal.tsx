import React, { useState, useEffect } from 'react';
import { 
    FaBook, 
    FaListUl, 
    FaLayerGroup, 
    FaPodcast, 
    FaChalkboardTeacher, 
    FaPencilAlt, 
    FaEdit, 
    FaMicrophone, 
    FaProjectDiagram,
    FaMagic
} from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BaseModal } from '../dashboard/DashboardModals';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';

interface AddMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    studySetData: any; // Contains flags for existing methods (e.g., notes: true)
    documentId: string;
    onMethodAdded?: (methods: string[]) => void;
}

const allMethods = [
    { id: 'notes', label: 'Notes', icon: <FaBook />, key: 'notes' },
    { id: 'multiple-choice', label: 'Multiple Choice', icon: <FaListUl />, key: 'multiple_choice' },
    { id: 'flashcards', label: 'Flashcards', icon: <FaLayerGroup />, key: 'flashcards' },
    { id: 'podcast', label: 'Podcast', icon: <FaPodcast />, key: 'podcast' },
    { id: 'tutor-lesson', label: 'Tutor Lesson', icon: <FaChalkboardTeacher />, key: 'tutor_lesson' },
    { id: 'written-tests', label: 'Written Tests', icon: <FaPencilAlt />, key: 'written_tests' },
    { id: 'fill-blanks', label: 'Fill in the Blanks', icon: <FaEdit />, key: 'fill_in_the_blanks' },
    { id: 'speech-to-text', label: 'Speech to Text', icon: <FaMicrophone />, key: 'speech_to_text' },
    { id: 'mindmap', label: 'Mindmap', icon: <FaProjectDiagram />, key: 'mindmap' },
];

export const AddMethodModal: React.FC<AddMethodModalProps> = ({ isOpen, onClose, studySetData, documentId, onMethodAdded }) => {
    const { user } = useAuth();
    const [step, setStep] = useState<'selection' | 'summary'>('selection');
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
    const [userCoins, setUserCoins] = useState<number>(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [documentText, setDocumentText] = useState<string>('');

    // Fetch user coins and document text
    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchCoins = async () => {
            const { data } = await supabase.from('user_subscriptions').select('current_coins').eq('user_id', user.id).single();
            if (data) setUserCoins(data.current_coins || 0);
        };

        const fetchDocumentText = async () => {
            if (studySetData?.document_text) {
                setDocumentText(studySetData.document_text);
                return;
            }
            
            // If text is missing in studySetData, fetch it
            const { data } = await supabase
                .from('documents')
                .select('document_text')
                .eq('id', documentId)
                .single();
            
            if (data?.document_text) {
                setDocumentText(data.document_text);
            }
        };

        fetchCoins();
        fetchDocumentText();
        
        // Reset state on open
        setStep('selection');
        setSelectedMethods([]);
        setIsGenerating(false);

    }, [isOpen, user, studySetData, documentId]);

    const toggleMethod = (id: string) => {
        if (selectedMethods.includes(id)) {
            setSelectedMethods(selectedMethods.filter(m => m !== id));
        } else {
            setSelectedMethods([...selectedMethods, id]);
        }
    };

    const isMethodDisabled = (methodKey: string, methodId: string) => {
        // Disable if already exists in studySetData
        if (studySetData?.[methodKey]) return true;
        
        // Disable Speech to Text if not audio/video (based on logic in MethodSelectionPage, though here we might be looser or stricter)
        // For now, let's respect the existing data. If speech_to_text is false, it's available?
        // But usually speech_to_text is only for audio/video source.
        if (methodId === 'speech-to-text') {
             const type = studySetData?.document_type;
             if (type !== 'audio' && type !== 'video') return true;
        }
        
        return false;
    };

    const calculateCost = () => {
        // 1 coin per method based on MethodSelectionPage logic
        return selectedMethods.length * 1; 
    };

    const handleGenerate = async () => {
        const cost = calculateCost();
        if (userCoins < cost) {
            alert("Insufficient balance");
            return;
        }

        if (!user || !documentText) {
            alert("Missing user or document text");
            return;
        }

        setIsGenerating(true);
        try {
            // Construct payload array
            const payload = selectedMethods.map(methodId => {
                const method = allMethods.find(m => m.id === methodId);
                return {
                    uid: user.id,
                    document_id: documentId,
                    Text: documentText,
                    agent_type: method?.key // e.g., 'multiple_choice'
                };
            });

            // Send to webhook
            const response = await fetch('https://n8n.matrixaiserver.com/webhook/4b2e8de2-985c-475b-aba8-850ae7e76f8a', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.statusText}`);
            }

            // Success
            if (onMethodAdded) {
                onMethodAdded(selectedMethods);
            }
            onClose();
            // Optionally trigger a refresh or notify user
            // Since we don't have a global refresh mechanism easily accessible, 
            // we rely on the user navigating or the app's polling mechanisms (which exist in individual components)
            
        } catch (error) {
            console.error('Generation failed:', error);
            alert("Failed to generate methods. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 'selection' ? "Add Study Method" : "Summary"}
            subtitle={step === 'selection' ? "Select additional methods to generate for this study set" : "Review your selection"}
        >
            <div className="space-y-6">
                {step === 'selection' ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                            {allMethods.map((method) => {
                                const disabled = isMethodDisabled(method.key, method.id);
                                const selected = selectedMethods.includes(method.id);
                                
                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => !disabled && toggleMethod(method.id)}
                                        disabled={disabled}
                                        className={`
                                            flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden group
                                            ${disabled 
                                                ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-50 cursor-not-allowed' 
                                                : selected
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-lg scale-[1.02]'
                                                    : 'bg-white dark:bg-[#1a1a1a] border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md'
                                            }
                                        `}
                                    >
                                        <div className={`text-3xl mb-4 transition-transform duration-300 ${selected ? 'scale-110' : 'group-hover:scale-110'}`}>
                                            {method.icon}
                                        </div>
                                        <span className="font-bold text-sm text-center">{method.label}</span>
                                        {disabled && <span className="text-xs mt-2 text-gray-400">(Added)</span>}
                                        {selected && (
                                            <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                                                <FaMagic />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/5">
                            <button
                                onClick={() => setStep('summary')}
                                disabled={selectedMethods.length === 0}
                                className={`
                                    px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2
                                    ${selectedMethods.length === 0
                                        ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                                    }
                                `}
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Selected Methods</h3>
                            <div className="space-y-3">
                                {selectedMethods.map(id => {
                                    const m = allMethods.find(method => method.id === id);
                                    return (
                                        <div key={id} className="flex items-center justify-between p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-indigo-500">{m?.icon}</span>
                                                <span className="font-medium text-gray-700 dark:text-gray-200">{m?.label}</span>
                                            </div>
                                            <div className="font-bold text-orange-500">1 Coin</div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Total Cost</span>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {calculateCost()} <span className="text-sm font-normal text-gray-500">Coins</span>
                                </div>
                            </div>
                            
                            <div className="mt-2 flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Your Balance</span>
                                <div className={`font-bold ${userCoins < calculateCost() ? 'text-red-500' : 'text-green-500'}`}>
                                    {userCoins} Coins
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => setStep('selection')}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-white font-medium px-4"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || userCoins < calculateCost()}
                                className={`
                                    px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2
                                    ${isGenerating || userCoins < calculateCost()
                                        ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                                    }
                                `}
                            >
                                {isGenerating ? (
                                    <>
                                        <AiOutlineLoading3Quarters className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FaMagic />
                                        Generate
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </BaseModal>
    );
};
