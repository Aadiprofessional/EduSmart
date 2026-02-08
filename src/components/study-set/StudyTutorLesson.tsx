import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { FaMagic } from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';

const StudyTutorLesson: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [lessonContent, setLessonContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Preprocess LaTeX to convert various formats to react-markdown compatible format
    const preprocessLaTeX = (text: string) => {
        if (typeof text !== 'string') return '';
        return text
            // Standard LaTeX block \[ ... \] -> $$ ... $$
            .replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `$$${eq}$$`)
            // Standard LaTeX inline \( ... \) -> $ ... $
            .replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq}$`)
            // Heuristic: [ \command... ] -> $$ \command... $$
            .replace(/\[\s*(\\frac|\\boxed|\\begin|\\sum|\\int|\\partial|\\sqrt|\\mathbf|\\mathrm|\\mathcal|\\mathscr|\\mathfrak|\\mathbb|\\sin|\\cos|\\tan)([\s\S]*?)\]/g, (match, cmd, rest) => `$$${cmd}${rest}$$`);
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const fetchData = async () => {
            if (!id || !user) return;

            try {
                const { data, error } = await supabase
                    .from('tutor_lesson_documents')
                    .select('lesson_text')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.lesson_text) {
                        // Ensure newlines are handled correctly if they come as escaped string
                        const formattedContent = data.lesson_text.replace(/\\n/g, '\n');
                        setLessonContent(formattedContent);
                        setLoading(false);
                        setIsGenerating(false);
                        if (intervalId) clearInterval(intervalId);
                    } else {
                        // Data not ready yet, keep polling
                        setIsGenerating(true);
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            }
        };

        fetchData();
        intervalId = setInterval(fetchData, 10000); // Check every 10 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [id, user]);

    return (
        <div className="h-full relative overflow-hidden">
            {/* Scrollable Content */}
            <div className="h-full overflow-y-auto px-8 pb-8 pt-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto w-full min-h-full">
                    {loading || isGenerating ? (
                        <div className="space-y-6">
                            <Skeleton width="60%" height={48} className="mb-8" />
                            <div className="space-y-4">
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="90%" height={20} />
                                <Skeleton width="95%" height={20} />
                            </div>
                            <div className="space-y-4 mt-8">
                                <Skeleton width="40%" height={32} className="mb-4" />
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="85%" height={20} />
                            </div>
                             <div className="space-y-4 mt-8">
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="90%" height={20} />
                                <Skeleton width="95%" height={20} />
                            </div>
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none focus:outline-none pb-20">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[rehypeRaw, rehypeKatex]}
                                components={{
                                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 mt-6 border-b border-gray-200 dark:border-gray-700 pb-2" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3 mt-8 border-b border-gray-200 dark:border-gray-800 pb-2" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2 mt-6" {...props} />,
                                    p: ({node, ...props}) => <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-lg" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 my-4" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-3 text-gray-600 dark:text-gray-300 my-4" {...props} />,
                                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-600 dark:text-gray-400 my-6 bg-gray-50 dark:bg-white/5 p-4 rounded-r" {...props} />,
                                    hr: ({node, ...props}) => <hr className="border-gray-200 dark:border-gray-700 my-8" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                                    em: ({node, ...props}) => <em className="italic text-gray-700 dark:text-gray-200" {...props} />,
                                    table: ({node, ...props}) => <div className="overflow-x-auto my-8"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg" {...props} /></div>,
                                    thead: ({node, ...props}) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
                                    th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700" {...props} />,
                                    td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700" {...props} />,
                                    a: ({node, ...props}) => <a className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline" {...props} />,
                                    code: ({node, className, children, ...props}) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !match ? (
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm text-indigo-600 dark:text-indigo-300" {...props}>
                                                {children}
                                            </code>
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {preprocessLaTeX(lessonContent)}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudyTutorLesson;
