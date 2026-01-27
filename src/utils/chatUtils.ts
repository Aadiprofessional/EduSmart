
export interface FileUploadResult {
  path: string;
  publicUrl: string;
  pdfVisionData?: {
    page_count: number;
    original_filename?: string;
    pdf_url?: string;
    image_urls?: string[];
  };
  fileType?: string;
  fileName?: string;
  originalName?: string;
  size?: number;
}

export const uploadFileToStorage = async (): Promise<FileUploadResult> => ({ publicUrl: '', path: '' });
export const validateFile = (file: File) => ({ isValid: true, error: null });
export const formatFileSize = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
export const getFileIcon = () => 'file';
export const extractPlainTextFromHTML = (html: string) => html?.replace(/<[^>]+>/g, '') || '';
export const extractTextForSharing = (html: string, isPlainText?: boolean) => html?.replace(/<[^>]+>/g, '') || '';
export const extractLinksFromText = (text: string) => ({ cleanContent: text, links: [] });
export const getCurrentLocalTimeFormatted = () => new Date().toLocaleString();
