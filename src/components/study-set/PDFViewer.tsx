import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaChevronLeft, FaChevronRight, FaSearchPlus, FaSearchMinus, FaExpand, FaCompress } from 'react-icons/fa';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Reset state when URL changes
    useEffect(() => {
        setPageNumber(1);
        setScale(1.0);
        setLoading(true);
        setError(null);
    }, [url]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
    }

    function onDocumentLoadError(err: Error) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document.');
        setLoading(false);
    }

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => {
            const newPage = prevPageNumber + offset;
            if (newPage >= 1 && (numPages ? newPage <= numPages : true)) {
                return newPage;
            }
            return prevPageNumber;
        });
    };

    const changeScale = (delta: number) => {
        setScale(prevScale => Math.max(0.5, Math.min(3.0, prevScale + delta)));
    };

    return (
        <div className="flex flex-col h-full w-full bg-transparent rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 bg-black/40 backdrop-blur-md border-b border-white/10 shadow-sm z-10">
                <div className="flex items-center space-x-4">
                    {/* Page Navigation */}
                    <div className="flex items-center space-x-2 bg-white/5 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => changePage(-1)}
                            disabled={pageNumber <= 1 || loading}
                            className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-200"
                            title="Previous Page"
                        >
                            <FaChevronLeft size={14} />
                        </button>
                        <span className="text-sm font-medium text-gray-200 min-w-[80px] text-center select-none">
                            {loading ? '...' : `${pageNumber} / ${numPages || '--'}`}
                        </span>
                        <button
                            onClick={() => changePage(1)}
                            disabled={pageNumber >= (numPages || 0) || loading}
                            className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-200"
                            title="Next Page"
                        >
                            <FaChevronRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Zoom Controls */}
                    <div className="flex items-center space-x-2 bg-white/5 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => changeScale(-0.1)}
                            disabled={scale <= 0.5 || loading}
                            className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-200"
                            title="Zoom Out"
                        >
                            <FaSearchMinus size={14} />
                        </button>
                        <span className="text-sm font-medium text-gray-200 min-w-[60px] text-center select-none">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={() => changeScale(0.1)}
                            disabled={scale >= 3.0 || loading}
                            className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-200"
                            title="Zoom In"
                        >
                            <FaSearchPlus size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 overflow-auto flex justify-center p-4 relative bg-black/20">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400">
                        <p className="font-medium">{error}</p>
                    </div>
                ) : (
                    <Document
                        file={url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        }
                        className="shadow-xl"
                    >
                        <Page 
                            pageNumber={pageNumber} 
                            scale={scale} 
                            className="bg-white"
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                        />
                    </Document>
                )}
            </div>
        </div>
    );
};

export default PDFViewer;
