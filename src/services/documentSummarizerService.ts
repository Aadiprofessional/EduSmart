import { API_BASE_URL } from '../config/api';

// Backend API data structures (as returned by the API)
export interface DocumentSummaryHistoryItem {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  mindmap_data: any;
  source_type: 'file' | 'text';
  file_name?: string;
  file_type?: string;
  file_size?: number;
  document_pages?: string[];
  page_summaries?: Array<{
    pageNumber: number;
    summary: string;
    isLoading: boolean;
    isComplete: boolean;
  }>;
  text_input?: string;
  processing_status: 'processing' | 'completed' | 'failed';
  metadata: any;
  created_at: string;
  updated_at: string;
}

// Frontend data structures (as used by the component)
export interface FrontendSummaryItem {
  id: string;
  title: string;
  summary: string;
  mindmapData: any;
  timestamp: Date;
  sourceType: 'file' | 'text';
  fileName?: string;
  documentPages?: string[];
  pageSummaries?: Array<{
    pageNumber: number;
    summary: string;
    isLoading: boolean;
    isComplete: boolean;
    error?: string;
  }>;
  file?: File;
}

// Request/Response types
export interface SaveDocumentSummaryRequest {
  uid: string;
  title: string;
  summary: string;
  sourceType: 'file' | 'text';
  textInput?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  documentPages?: string[];
  pageSummaries?: Array<{
    pageNumber: number;
    summary: string;
    isLoading: boolean;
    isComplete: boolean;
  }>;
  mindmapData?: any;
  metadata?: any;
}

export interface DocumentSummaryHistoryResponse {
  success: boolean;
  documentHistory: DocumentSummaryHistoryItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface SaveDocumentSummaryResponse {
  success: boolean;
  message: string;
  documentSummary: DocumentSummaryHistoryItem;
}

export interface DocumentSummaryStatsResponse {
  success: boolean;
  statistics: {
    totalSummaries: number;
    fileSummaries: number;
    textSummaries: number;
    recentActivity: number;
  };
}

export interface UpdateDocumentSummaryRequest {
  uid: string;
  title?: string;
  summary?: string;
  mindmapData?: any;
  metadata?: any;
}

export interface GetDocumentResponse {
  success: boolean;
  documentSummary: DocumentSummaryHistoryItem;
}

export class DocumentSummarizerService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/document-summarizer`;
  }

  // Save document summary (create new)
  async saveDocumentSummary(data: SaveDocumentSummaryRequest): Promise<SaveDocumentSummaryResponse> {
    const response = await fetch(`${this.baseURL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Update existing document summary
  async updateDocumentSummary(documentId: string, data: UpdateDocumentSummaryRequest): Promise<SaveDocumentSummaryResponse> {
    const response = await fetch(`${this.baseURL}/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get document summary history
  async getDocumentSummaryHistory(
    userId: string, 
    page: number = 1, 
    limit: number = 10,
    sourceType?: 'file' | 'text'
  ): Promise<DocumentSummaryHistoryResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (sourceType) {
      params.append('sourceType', sourceType);
    }

    const response = await fetch(`${this.baseURL}/history/${userId}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get specific document summary by ID
  async getDocumentSummary(documentId: string, userId: string): Promise<GetDocumentResponse> {
    const response = await fetch(`${this.baseURL}/${documentId}?uid=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Delete document summary
  async deleteDocumentSummary(documentId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseURL}/${documentId}?uid=${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get document summary statistics
  async getDocumentSummaryStats(userId: string): Promise<DocumentSummaryStatsResponse> {
    const response = await fetch(`${this.baseURL}/stats/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Helper method to convert backend data to frontend format
  convertToFrontendFormat(backendItem: DocumentSummaryHistoryItem): FrontendSummaryItem {
    return {
      id: backendItem.id,
      title: backendItem.title,
      summary: backendItem.summary,
      mindmapData: backendItem.mindmap_data,
      timestamp: new Date(backendItem.created_at),
      sourceType: backendItem.source_type,
      fileName: backendItem.file_name || undefined,
      documentPages: backendItem.document_pages || undefined,
      pageSummaries: backendItem.page_summaries?.map(ps => ({
        ...ps,
        error: undefined // Add error field that frontend expects
      })) || undefined,
      // Note: file object cannot be recreated from backend data
    };
  }

  // Helper method to convert frontend data to backend format
  convertToBackendFormat(
    frontendItem: FrontendSummaryItem, 
    userId: string, 
    textInput?: string,
    fileType?: string,
    fileSize?: number,
    metadata?: any
  ): SaveDocumentSummaryRequest {
    return {
      uid: userId,
      title: frontendItem.title,
      summary: frontendItem.summary,
      sourceType: frontendItem.sourceType,
      textInput: textInput,
      fileName: frontendItem.fileName,
      fileType: fileType,
      fileSize: fileSize,
      documentPages: frontendItem.documentPages,
      pageSummaries: frontendItem.pageSummaries?.map(ps => ({
        pageNumber: ps.pageNumber,
        summary: ps.summary,
        isLoading: ps.isLoading,
        isComplete: ps.isComplete,
      })),
      mindmapData: frontendItem.mindmapData,
      metadata: metadata,
    };
  }
}

// Export singleton instance
export const documentSummarizerService = new DocumentSummarizerService(); 