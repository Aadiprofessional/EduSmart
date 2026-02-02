import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { FaMagic } from 'react-icons/fa';

const StudyTutorLesson: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [lessonContent, setLessonContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

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
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <FaMagic className="relative text-5xl text-indigo-400 mb-6 animate-bounce" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Generating Lesson...</h2>
                            <p className="text-gray-400 max-w-md text-center">
                                We're crafting your personalized lesson. This usually takes just a moment!
                            </p>
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none focus:outline-none pb-20">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]} 
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mb-4 mt-6 border-b border-gray-700 pb-2" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-white mb-3 mt-8 border-b border-gray-800 pb-2" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-xl font-medium text-gray-200 mb-2 mt-6" {...props} />,
                                    p: ({node, ...props}) => <p className="text-gray-300 leading-relaxed mb-6 text-lg" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-3 text-gray-300 my-4" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-3 text-gray-300 my-4" {...props} />,
                                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-400 my-6 bg-white/5 p-4 rounded-r" {...props} />,
                                    hr: ({node, ...props}) => <hr className="border-gray-700 my-8" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                    em: ({node, ...props}) => <em className="italic text-gray-200" {...props} />,
                                    table: ({node, ...props}) => <div className="overflow-x-auto my-8"><table className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded-lg" {...props} /></div>,
                                    thead: ({node, ...props}) => <thead className="bg-gray-800" {...props} />,
                                    th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700" {...props} />,
                                    td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-b border-gray-700" {...props} />,
                                    a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
                                    code: ({node, className, children, ...props}) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !match ? (
                                            <code className="bg-gray-800 px-1 py-0.5 rounded text-sm text-indigo-300" {...props}>
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
                                {lessonContent}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudyTutorLesson;
