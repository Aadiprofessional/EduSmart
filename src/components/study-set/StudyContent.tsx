import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import PDFViewer from './PDFViewer';
import { Skeleton } from '../ui/Skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { useLanguage } from '../../utils/LanguageContext';

const StudyContent: React.FC = () => {
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { t } = useLanguage();
    
    const [contentData, setContentData] = useState<any>(location.state?.studySetData || null);
    const [loading, setLoading] = useState(!location.state?.studySetData);
    const [viewMode, setViewMode] = useState<'file' | 'text'>('file');

    useEffect(() => {
        if (contentData) return;
        if (!id || !user) return;

        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('upload_document')
                    .select('document_text, document_url, document_type')
                    .eq('document_id', id)
                    .single();

                if (error) {
                    console.error('Error fetching content:', error);
                } else {
                    setContentData(data);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user, contentData]);

    const documentType = contentData?.document_type;
    const documentUrl = contentData?.document_url;
    const documentText = contentData?.document_text;

    const supportedTextTypes = ['pdf_vision', 'ocr', 'image', 'document'];
    const showToggle = documentUrl && documentText && supportedTextTypes.includes(documentType);

    useEffect(() => {
        if (!contentData?.document_url || !contentData?.document_text) return;
        const inferredType = contentData.document_type || getFileType(contentData.document_url);
        if (inferredType === 'office') {
            setViewMode('text');
        }
    }, [contentData]);

    // Preprocess LaTeX to convert OpenAI format to react-markdown format
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

    // Helper to determine file type from URL extension if documentType is generic 'url' or missing
    const getFileExtension = (url: string) => {
        try {
            const pathname = new URL(url).pathname;
            return pathname.split('.').pop()?.toLowerCase() || '';
        } catch {
            const pathname = url.split('?')[0];
            return pathname.split('.').pop()?.toLowerCase() || '';
        }
    };

    const getFileType = (url: string) => {
        const extension = getFileExtension(url);
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) return 'audio';
        if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) return 'video';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
        if (['pdf'].includes(extension || '')) return 'pdf';
        if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension || '')) return 'office';
        return 'text';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full p-6 overflow-hidden">
                <div className="w-full max-w-4xl mx-auto space-y-4">
                     <Skeleton width="100%" height={400} className="rounded-xl" />
                     <div className="space-y-2 mt-4">
                        <Skeleton width="80%" height={20} />
                        <Skeleton width="90%" height={20} />
                        <Skeleton width="60%" height={20} />
                     </div>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if ((!documentUrl && documentText) || (viewMode === 'text' && documentText)) {
             return (
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-lg shadow-sm max-w-4xl mx-auto w-full prose dark:prose-invert max-w-none text-gray-200">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                        components={{
                            h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mb-4 mt-6 border-b border-white/10 pb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-white mb-3 mt-5" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xl font-medium text-gray-200 mb-2 mt-4" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 text-gray-300" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 text-gray-300" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-400 my-4" {...props} />,
                            table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="min-w-full divide-y divide-white/10 border border-white/10 rounded-lg" {...props} /></div>,
                            thead: ({node, ...props}) => <thead className="bg-white/5" {...props} />,
                            th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-white/10" {...props} />,
                            td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-b border-white/10" {...props} />,
                            a: ({node, ...props}) => <a className="text-white hover:text-gray-300 underline decoration-white/30 hover:decoration-white" {...props} />,
                            code: ({node, className, children, ...props}) => {
                                const match = /language-(\w+)/.exec(className || '');
                                return !match ? (
                                    <code className="bg-white/10 px-1 py-0.5 rounded text-sm text-gray-200 border border-white/10" {...props}>
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
                        {preprocessLaTeX(documentText)}
                    </ReactMarkdown>
                </div>
             );
        }

        if (documentUrl) {
            // Check explicit type or infer from URL
            const type = documentType || getFileType(documentUrl);

            // Audio
            if (type === 'audio' || type === 'audio_file' || getFileType(documentUrl) === 'audio') {
                return (
                    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl">
                         <h3 className="text-xl font-bold text-white mb-6">{t('studyContent.audioContent')}</h3>
                         <audio controls className="w-full">
                             <source src={documentUrl} />
                             {t('studyContent.audioNotSupported')}
                         </audio>
                    </div>
                );
            }

            // Video
            if (type === 'video' || type === 'video_file' || getFileType(documentUrl) === 'video') {
                return (
                    <div className="w-full max-w-4xl mx-auto aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
                        <video controls className="w-full h-full">
                            <source src={documentUrl} />
                            {t('studyContent.videoNotSupported')}
                        </video>
                    </div>
                );
            }

            // Image
            if (type === 'image' || getFileType(documentUrl) === 'image') {
                 return (
                    <div className="flex justify-center p-4">
                        <img 
                            src={documentUrl} 
                            alt="Study Material" 
                            className="max-w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-lg border border-white/10 bg-black/20"
                        />
                    </div>
                 );
            }

            // PDF / Document
            if (type === 'pdf' || type === 'pdf_file' || getFileType(documentUrl) === 'pdf') {
                 return (
                    <div className="w-full min-h-[80vh] bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg overflow-hidden">
                        <PDFViewer url={documentUrl} />
                    </div>
                 );
            }

            if (type === 'document' || getFileType(documentUrl) === 'office') {
                const officePreviewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`;
                return (
                    <div className="w-full min-h-[80vh] bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg overflow-hidden relative">
                        <iframe
                            src={officePreviewUrl}
                            className="w-full h-[80vh] border-none"
                            title={t('studyContent.officePreviewTitle')}
                        />
                        <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-4 right-4 px-3 py-2 text-xs rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                            {t('studyContent.openOriginalFile')}
                        </a>
                    </div>
                );
            }
            
            // Fallback for generic URLs (websites)
            return (
                 <div className="w-full min-h-[80vh] bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg overflow-hidden">
                     <iframe 
                         src={documentUrl} 
                         className="w-full h-[80vh] border-none" 
                         title="Web Content"
                     />
                 </div>
            );
        }

        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                {t('studyContent.noContentAvailable')}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-start h-full w-full p-6 overflow-y-auto relative">
             {showToggle && (
                 <div className="fixed bottom-6 z-50 flex space-x-2 bg-black/60 backdrop-blur-xl p-1.5 rounded-full shadow-2xl border border-white/10">
                     <button
                         onClick={() => setViewMode('file')}
                         className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                             viewMode === 'file'
                                 ? 'bg-white/15 text-white shadow-sm backdrop-blur-sm'
                                 : 'text-white/60 hover:text-white hover:bg-white/5'
                         }`}
                     >
                        {t('studyContent.originalFile')}
                     </button>
                     <button
                         onClick={() => setViewMode('text')}
                         className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                             viewMode === 'text'
                                 ? 'bg-white/15 text-white shadow-sm backdrop-blur-sm'
                                 : 'text-white/60 hover:text-white hover:bg-white/5'
                         }`}
                     >
                        {t('studyContent.extractedText')}
                     </button>
                 </div>
             )}
             {renderContent()}
        </div>
    );
};

export default StudyContent;
