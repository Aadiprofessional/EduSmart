import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist';

// Type definitions for PDF.js
interface PDFPageProxy {
  getViewport(params: { scale: number }): any;
  render(renderContext: any): { promise: Promise<void> };
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  try {
    const pdfVersion = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.mjs`;
  } catch (error) {
    console.error('Failed to load PDF worker:', error);
  }
}

export interface UploadPayload {
  uid?: string;
  type?: string;
  messages?: any[];
  uploadedFileType?: string;
  [key: string]: any;
}

export const uploadService = {
  async uploadFile(file: File | Blob, uid: string, folder: 'audioFile' | 'videoFile' | 'documents' | 'images', fileName?: string): Promise<string> {
    const timestamp = Date.now();
    // Sanitize filename
    const name = fileName || (file as File).name || 'unnamed_file';
    const sanitizedName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `users/${uid}/${folder}/${timestamp}_${sanitizedName}`;

    const { error } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async getAudioDuration(file: File | Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
      audio.src = URL.createObjectURL(file);
    });
  },

  async getVideoDuration(file: File | Blob): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  },

  // Get PDF page count without converting to images
  async getPdfPageCount(file: File): Promise<number> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Initialize PDF.js with proper worker setup
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      
      const pdf = await loadingTask.promise as unknown as PDFDocumentProxy;
      return pdf.numPages;
    } catch (error) {
      console.error('Error getting PDF page count:', error);
      return 0;
    }
  },

  // Convert PDF to images using PDF.js
  async convertPdfToImages(file: File): Promise<string[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Initialize PDF.js with proper worker setup
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      
      const pdf = await loadingTask.promise as unknown as PDFDocumentProxy;
      const images: string[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (!context) {
          throw new Error('Could not get canvas context');
        }
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to base64 image
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        images.push(imageDataUrl);
      }
      
      return images;
    } catch (error) {
      console.error('PDF URL conversion error:', error);
      throw error;
    }
  },

  // Helper to upload base64 images to Supabase
  async uploadBase64Images(base64Images: string[], uid: string): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < base64Images.length; i++) {
      const base64 = base64Images[i];
      const res = await fetch(base64);
      const blob = await res.blob();
      const fileName = `page_${i + 1}_${Date.now()}.jpg`;
      const url = await this.uploadFile(blob, uid, 'images', fileName);
      if (url) urls.push(url);
    }
    return urls;
  },

  async constructAudioPayload(file: File, uid: string): Promise<UploadPayload> {
    const duration = await this.getAudioDuration(file);
    const mainUrl = await this.uploadFile(file, uid, 'audioFile');
    const chunkUrls: string[] = [];

    // 2 hours in seconds
    const CHUNK_DURATION = 7200;

    if (duration > CHUNK_DURATION) {
      // Estimate byte rate
      const byteRate = file.size / duration;
      const chunkSize = Math.floor(byteRate * CHUNK_DURATION);
      const totalChunks = Math.ceil(file.size / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end, file.type);
        const chunkName = `${file.name.split('.').slice(0, -1).join('.')}_part${i + 1}${file.name.substring(file.name.lastIndexOf('.'))}`;
        
        const chunkUrl = await this.uploadFile(chunk, uid, 'audioFile', chunkName);
        chunkUrls.push(chunkUrl);
      }
    } else {
      chunkUrls.push(mainUrl);
    }
    
    return {
      uid,
      audioUrl: mainUrl,
      language: 'en',
      duration: Math.round(duration),
      audio_name: file.name,
      timestamp: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      chunkurls: chunkUrls
    };
  },

  async constructVideoPayload(file: File, uid: string): Promise<UploadPayload> {
    const videoUrl = await this.uploadFile(file, uid, 'videoFile');
    const duration = await this.getVideoDuration(file);
    const chunkUrls: string[] = [];

    // 2 hours in seconds
    const CHUNK_DURATION = 7200;

    if (duration > CHUNK_DURATION) {
        // Same logic as audio for splitting video files
        const byteRate = file.size / duration;
        const chunkSize = Math.floor(byteRate * CHUNK_DURATION);
        const totalChunks = Math.ceil(file.size / chunkSize);
  
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end, file.type);
          const chunkName = `${file.name.split('.').slice(0, -1).join('.')}_part${i + 1}${file.name.substring(file.name.lastIndexOf('.'))}`;
          
          const chunkUrl = await this.uploadFile(chunk, uid, 'videoFile', chunkName);
          chunkUrls.push(chunkUrl);
        }
    } else {
        chunkUrls.push(videoUrl);
    }
    
    return {
      uid,
      audioid: `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      audio_url: videoUrl, // Using video URL as proxy for audio
      video_url: videoUrl,
      audio_name: file.name,
      language: 'auto',
      duration: Math.round(duration),
      timestamp: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      chunkurls: chunkUrls
    };
  },

  async constructDocumentPayload(file: File, uid: string, pdfProcessType: 'document' | 'ocr' | 'pdf_vision' = 'document'): Promise<UploadPayload> {
    // Determine type based on mime type
    let type = 'document';
    let folder: 'documents' | 'images' = 'documents';
    let imageUrls: string[] = [];
    let pageCount = 0;
    
    if (file.type.startsWith('image/')) {
        type = 'image';
        folder = 'images';
    } else if (file.type === 'application/pdf') {
        if (pdfProcessType === 'pdf_vision') {
            type = 'pdf_vision';
            // For PDF vision, we need to convert pages to images
            const base64Images = await this.convertPdfToImages(file);
            imageUrls = await this.uploadBase64Images(base64Images, uid);
            pageCount = imageUrls.length;
        } else if (pdfProcessType === 'ocr') {
            type = 'ocr';
            pageCount = await this.getPdfPageCount(file);
        } else {
            type = 'document';
        }
    }

    const url = await this.uploadFile(file, uid, folder);
    
    // Base message object
    const message: any = {
      uid,
      type: type, // 'document', 'image', 'pdf_vision', or 'ocr'
      text: { body: `Uploaded ${type}: ${file.name}` },
      body: `Uploaded ${type}: ${file.name}`,
      content: `Uploaded ${type}: ${file.name}`,
      role: 'user',
      roleDescription: 'A versatile AI assistant for everyday tasks and questions',
      timestamp: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      chatid: uuidv4(),
      url: url,
      attachments: [
        {
          url: url,
          fileName: file.name,
          fileType: type,
          originalName: file.name
        }
      ]
    };

    // Add specific fields
    if (type === 'pdf_vision') {
        message.image_urls = imageUrls;
        message.page_count = pageCount;
    } else if (type === 'ocr') {
        message.page_count = pageCount;
    }

    return {
      messages: [message],
      uploadedFileType: type
    };
  },

  constructTextPayload(text: string, uid: string): UploadPayload {
    return {
      messages: [
        {
          uid,
          type: 'text',
          text: { body: text },
          body: text,
          content: text,
          role: 'user',
          roleDescription: 'A versatile AI assistant for everyday tasks and questions',
          timestamp: new Date().toISOString().replace('T', ' ').replace('Z', ''),
          chatid: uuidv4(),
          url: '', 
          attachments: []
        }
      ],
      uploadedFileType: 'text'
    };
  },

  constructUrlPayload(url: string, uid: string): UploadPayload {
    return {
      messages: [
        {
          uid,
          type: 'url',
          text: { body: url },
          body: url,
          content: url,
          role: 'user',
          roleDescription: 'A versatile AI assistant for everyday tasks and questions',
          timestamp: new Date().toISOString().replace('T', ' ').replace('Z', ''),
          chatid: uuidv4(),
          url: url,
          attachments: []
        }
      ],
      uploadedFileType: 'url'
    };
  }
};
