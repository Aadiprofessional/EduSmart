import React from 'react';
import { useLocation } from 'react-router-dom';
import PDFViewer from './PDFViewer';

const StudyContent: React.FC = () => {
    const location = useLocation();
    const studySetData = location.state?.studySetData;
    
    // Determine content type and source
    const documentType = studySetData?.document_type;
    const documentUrl = studySetData?.document_url;
    const documentText = studySetData?.document_text;

    // Helper to determine file type from URL extension if documentType is generic 'url' or missing
    const getFileType = (url: string) => {
        const extension = url.split('.').pop()?.toLowerCase();
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) return 'audio';
        if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) return 'video';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
        if (['pdf'].includes(extension || '')) return 'pdf';
        return 'text';
    };

    const renderContent = () => {
        if (!documentUrl && documentText) {
             return (
                <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-lg shadow-sm max-w-4xl mx-auto w-full">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                        {documentText}
                    </pre>
                </div>
             );
        }

        if (documentUrl) {
            // Check explicit type or infer from URL
            const type = documentType || getFileType(documentUrl);

            // Audio
            if (type === 'audio' || type === 'audio_file' || getFileType(documentUrl) === 'audio') {
                return (
                    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-8 bg-gray-900 rounded-xl">
                         <h3 className="text-xl font-bold text-white mb-6">Audio Content</h3>
                         <audio controls className="w-full">
                             <source src={documentUrl} />
                             Your browser does not support the audio element.
                         </audio>
                    </div>
                );
            }

            // Video
            if (type === 'video' || type === 'video_file' || getFileType(documentUrl) === 'video') {
                return (
                    <div className="w-full max-w-4xl mx-auto aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                        <video controls className="w-full h-full">
                            <source src={documentUrl} />
                            Your browser does not support the video tag.
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
                            className="max-w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-lg"
                        />
                    </div>
                 );
            }

            // PDF / Document
            if (type === 'pdf' || type === 'pdf_file' || type === 'document' || getFileType(documentUrl) === 'pdf') {
                 return (
                    <div className="w-full h-full min-h-[80vh] rounded-lg shadow-lg overflow-hidden">
                        <PDFViewer url={documentUrl} />
                    </div>
                 );
            }
            
            // Fallback for generic URLs (websites)
            return (
                 <div className="w-full h-full min-h-[80vh] bg-white rounded-lg shadow-lg overflow-hidden">
                     <iframe 
                         src={documentUrl} 
                         className="w-full h-full border-none" 
                         title="Web Content"
                     />
                 </div>
            );
        }

        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No content available to display.
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6 overflow-y-auto">
             {renderContent()}
        </div>
    );
};

export default StudyContent;
