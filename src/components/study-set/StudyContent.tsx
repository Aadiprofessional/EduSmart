import React from 'react';

const StudyContent: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="bg-white rounded-lg p-4 overflow-auto max-w-full max-h-full shadow-xl">
                 {/* Placeholder for the System Architecture Diagram */}
                 <div className="min-w-[800px] min-h-[600px] bg-white relative">
                    {/* Mocking the diagram structure with some CSS/SVG or just an image tag */}
                    <img 
                        src="https://placehold.co/1200x800/white/black?text=System+Architecture+Diagram+Image" 
                        alt="System Architecture Diagram" 
                        className="w-full h-auto object-contain"
                    />
                 </div>
            </div>
        </div>
    );
};

export default StudyContent;
