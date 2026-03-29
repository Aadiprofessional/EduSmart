import { mistakeCheckAPI } from './apiService';

// Get user ID from authentication context or localStorage - proper authentication
const getUserId = (user?: any, session?: any): string | null => {
  // First try to get user ID from the provided authentication context
  if (user?.id) {
    console.log('📱 Found user ID from auth context:', user.id);
    return user.id;
  }
  
  if (session?.user?.id) {
    console.log('📱 Found user ID from session:', session.user.id);
    return session.user.id;
  }
  
  // Try to get user ID from localStorage first (common auth pattern)
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  if (userId && userId !== 'undefined' && userId !== 'null') {
    console.log('📱 Found user ID in localStorage:', userId);
    return userId;
  }
  
  // Try to get from user object in localStorage
  const userStr = localStorage.getItem('user');
  if (userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      const user = JSON.parse(userStr);
      if (user && (user.id || user.user_id || user.uid)) {
        const foundUserId = user.id || user.user_id || user.uid;
        console.log('📱 Found user ID from user object:', foundUserId);
        return foundUserId;
      }
    } catch (e) {
      console.warn('Failed to parse user from localStorage');
    }
  }
  
  // Try Supabase auth patterns
  const supabaseAuthStr = localStorage.getItem('sb-cdqrmxmqsoxncnkxiqwu-auth-token');
  if (supabaseAuthStr && supabaseAuthStr !== 'undefined' && supabaseAuthStr !== 'null') {
    try {
      const authData = JSON.parse(supabaseAuthStr);
      if (authData.user?.id) {
        console.log('📱 Found user ID from Supabase auth:', authData.user.id);
        return authData.user.id;
      }
    } catch (e) {
      console.warn('Failed to parse Supabase auth from localStorage');
    }
  }
  
  // Check other possible Supabase auth keys
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.includes('supabase') || key.includes('auth')) {
      try {
        const data = localStorage.getItem(key);
        if (data && data !== 'undefined' && data !== 'null') {
          const parsed = JSON.parse(data);
          if (parsed?.user?.id) {
            console.log('📱 Found user ID from auth key:', key, parsed.user.id);
            return parsed.user.id;
          }
        }
      } catch (e) {
        // Continue to next key
      }
    }
  }
  
  // No authenticated user found
  console.warn('⚠️ No authenticated user found');
  return null;
};

export interface MistakeCheckSubmissionData {
  text: string;
  fileName: string;
  file?: File;
  fileType: string;
  documentPages?: string[];
  mistakes: any[];
  pageMistakes?: any[];
  extractedTexts?: any[];
  pageMarkings?: any[];
  markingSummary?: any;
  selectedMarkingStandard: string;
  currentPage: number;
  overallProcessingComplete: boolean;
}

export interface MistakeCheckHistoryItem {
  id: string;
  fileName: string;
  text: string;
  mistakes: any[];
  markingSummary: any;
  timestamp: Date;
  fileType: string;
  documentPages?: string[];
  pageMistakes?: any[];
  currentPage?: number;
  overallProcessingComplete?: boolean;
  extractedTexts?: any[];
  pageMarkings?: any[];
  selectedMarkingStandard?: string;
}

// Submit a new mistake check - Enhanced with user context and better error handling
export const submitMistakeCheck = async (data: MistakeCheckSubmissionData, user?: any, session?: any) => {
  try {
    const userId = getUserId(user, session);
    
    if (!userId) {
      return { 
        success: false, 
        error: 'User authentication required. Please log in to submit mistake check.'
      };
    }
    
    console.log('🔄 Submitting mistake check for user:', userId);
    console.log('📊 Submission data:', {
      fileName: data.fileName,
      fileType: data.fileType,
      textLength: data.text?.length || 0,
      mistakesCount: data.mistakes?.length || 0,
      pageMistakesCount: data.pageMistakes?.length || 0,
      extractedTextsCount: data.extractedTexts?.length || 0,
      pageMarkingsCount: data.pageMarkings?.length || 0,
      hasMarkingSummary: !!data.markingSummary,
      currentPage: data.currentPage,
      overallProcessingComplete: data.overallProcessingComplete,
      hasFile: !!data.file
    });
    
    const result = await mistakeCheckAPI.submit({
      uid: userId, // Use 'uid' as expected by the API
      text: data.text,
      fileName: data.fileName,
      file_type: data.fileType,
      document_pages: data.documentPages,
      mistakes: data.mistakes,
      page_mistakes: data.pageMistakes,
      extracted_texts: data.extractedTexts,
      page_markings: data.pageMarkings,
      marking_summary: data.markingSummary,
      selected_marking_standard: data.selectedMarkingStandard,
      current_page: data.currentPage,
      overall_processing_complete: data.overallProcessingComplete,
      file: data.file
    });
    
    if (result.success) {
      console.log('✅ Mistake check submitted successfully:', result.data);
      return { success: true, data: result.data };
    } else {
      console.error('❌ API returned error:', result.error);
      return { 
        success: false, 
        error: result.error || 'Failed to submit mistake check'
      };
    }
  } catch (error: any) {
    console.error('❌ Error submitting mistake check:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to submit mistake check'
    };
  }
};

// Sample mistake check history for fallback when API fails
const getSampleMistakeCheckHistory = (): any[] => [
  {
    id: 'sample-1',
    fileName: 'English_Essay_Sample.pdf',
    text: 'The climate change is a very impotant issue that effect everyone in the world. We must took action immediately to prevent further damages to our planet.',
    mistakes: [
      { id: 1, incorrect: 'impotant', correct: 'important', type: 'spelling', explanation: 'Spelling error' },
      { id: 2, incorrect: 'effect', correct: 'affects', type: 'grammar', explanation: 'Subject-verb agreement and word choice' },
      { id: 3, incorrect: 'took', correct: 'take', type: 'grammar', explanation: 'Modal verb "must" requires base form' },
      { id: 4, incorrect: 'damages', correct: 'damage', type: 'grammar', explanation: 'Uncountable noun' }
    ],
    markingSummary: {
      totalScore: 75,
      maxScore: 100,
      percentage: 75,
      grade: 'B',
      strengths: ['Clear argument', 'Good structure'],
      weaknesses: ['Grammar errors', 'Spelling mistakes'],
      recommendations: ['Review subject-verb agreement', 'Proofread for spelling'],
      studyPlan: []
    },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    fileType: 'application/pdf',
    overallProcessingComplete: true
  },
  {
    id: 'sample-2',
    fileName: 'Math_Proof_Sample.jpg',
    text: 'Let x be an integer. If x is even, then x^2 is even. Proof: Let x = 2k for some integer k. Then x^2 = (2k)^2 = 4k^2 = 2(2k^2). Since 2k^2 is an integer, x^2 is even.',
    mistakes: [],
    markingSummary: {
      totalScore: 100,
      maxScore: 100,
      percentage: 100,
      grade: 'A',
      strengths: ['Correct logic', 'Clear notation'],
      weaknesses: [],
      recommendations: ['Keep up the good work'],
      studyPlan: []
    },
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    fileType: 'image/jpeg',
    overallProcessingComplete: true
  }
];

// Get mistake check history - Enhanced with better error handling and data validation
export const getMistakeCheckHistory = async (user?: any, session?: any, limit = 20, offset = 0) => {
  try {
    const userId = getUserId(user, session);
    
    if (!userId) {
      console.warn('⚠️ No authenticated user - cannot load mistake check history');
      return { 
        success: false,
        history: [],
        error: 'User authentication required to load history'
      };
    }
    
    console.log('🔄 Fetching mistake check history for user:', userId);
    
    const result = await mistakeCheckAPI.getHistory(userId, limit, offset);
    console.log('📋 Raw API result:', result);
    
    if (result.success && result.data) {
      const historyData = result.data.history || result.data;
      console.log('📊 History data received:', {
        isArray: Array.isArray(historyData),
        length: Array.isArray(historyData) ? historyData.length : 0,
        sample: Array.isArray(historyData) && historyData.length > 0 ? {
          id: historyData[0].id,
          fileName: historyData[0].fileName,
          hasErrors: !!historyData[0].mistakes,
          hasPageMistakes: !!historyData[0].pageMistakes,
          hasExtractedTexts: !!historyData[0].extractedTexts
        } : 'No data'
      });
      
      const transformedHistory = Array.isArray(historyData) ? historyData.map((item: any) => ({
        id: item.id?.toString() || item.id,
        fileName: item.fileName || 'Untitled',
        text: item.text || '',
        mistakes: Array.isArray(item.mistakes) ? item.mistakes : [],
        markingSummary: item.markingSummary || null,
        timestamp: new Date(item.timestamp || item.created_at),
        fileType: item.fileType || item.file_type || 'text/plain',
        documentPages: item.documentPages || item.document_pages || undefined,
        pageMistakes: item.pageMistakes || item.page_mistakes || undefined,
        currentPage: item.currentPage ?? item.current_page ?? 0,
        overallProcessingComplete: item.overallProcessingComplete ?? item.overall_processing_complete ?? false,
        extractedTexts: item.extractedTexts || item.extracted_texts || undefined,
        pageMarkings: item.pageMarkings || item.page_markings || undefined,
        selectedMarkingStandard: item.selectedMarkingStandard || item.selected_marking_standard || 'hkdse'
      })) : [];
      
      console.log('✅ History transformed successfully:', transformedHistory.length, 'items');
      return { 
        success: true, 
        history: transformedHistory
      };
    } else {
      console.warn('⚠️ API call failed or returned no data:', result.error);
      return { 
        success: false,
        history: [],
        error: result.error || 'Failed to load history from API'
      };
    }
  } catch (error: any) {
    console.error('❌ Error fetching mistake check history:', error);
    return { 
      success: false,
      history: [],
      error: error.message || 'Network error while loading history'
    };
  }
};

// Update a mistake check - Enhanced with user context
export const updateMistakeCheck = async (id: string, data: Partial<MistakeCheckSubmissionData>, user?: any, session?: any) => {
  try {
    const userId = getUserId(user, session);
    console.log('🔄 Updating mistake check for user:', userId, 'ID:', id);
    
    const result = await mistakeCheckAPI.update(id, {
      text: data.text,
      mistakes: data.mistakes,
      page_mistakes: data.pageMistakes,
      extracted_texts: data.extractedTexts,
      page_markings: data.pageMarkings,
      marking_summary: data.markingSummary,
      selected_marking_standard: data.selectedMarkingStandard,
      current_page: data.currentPage,
      overall_processing_complete: data.overallProcessingComplete
    });
    
    if (result.success) {
      console.log('✅ Mistake check updated successfully');
      return { success: true, data: result.data };
    } else {
      console.error('❌ Update failed:', result.error);
      return { 
        success: false, 
        error: result.error || 'Failed to update mistake check'
      };
    }
  } catch (error: any) {
    console.error('❌ Error updating mistake check:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update mistake check'
    };
  }
};

// Delete a mistake check - Enhanced with user context
export const deleteMistakeCheck = async (id: string, user?: any, session?: any) => {
  try {
    const userId = getUserId(user, session);
    
    if (!userId) {
      return { 
        success: false, 
        error: 'User authentication required. Please log in to delete mistake check.'
      };
    }
    
    console.log('🔄 Deleting mistake check for user:', userId, 'ID:', id);
    
    const result = await mistakeCheckAPI.delete(id, userId);
    
    if (result.success) {
      console.log('✅ Mistake check deleted successfully');
      return { success: true };
    } else {
      console.error('❌ Delete failed:', result.error);
      return { 
        success: false, 
        error: result.error || 'Failed to delete mistake check'
      };
    }
  } catch (error: any) {
    console.error('❌ Error deleting mistake check:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to delete mistake check'
    };
  }
};

// Get a specific mistake check by ID - Enhanced with user context
export const getMistakeCheckById = async (id: string, user?: any, session?: any) => {
  try {
    const userId = getUserId(user, session);
    
    if (!userId) {
      return { 
        success: false, 
        error: 'User authentication required. Please log in to view mistake check.'
      };
    }
    
    console.log('🔄 Fetching mistake check by ID for user:', userId, 'ID:', id);
    
    const result = await mistakeCheckAPI.getById(id, userId);
    
    if (result.success && result.data) {
      const item = result.data.mistakeCheck || result.data;
      const transformedMistakeCheck: MistakeCheckHistoryItem = {
        id: item.id?.toString() || item.id,
        fileName: item.fileName || 'Untitled',
        text: item.text || '',
        mistakes: Array.isArray(item.mistakes) ? item.mistakes : [],
        markingSummary: item.markingSummary || null,
        timestamp: new Date(item.timestamp || item.created_at),
        fileType: item.fileType || item.file_type || 'text/plain',
        documentPages: item.documentPages || item.document_pages || undefined,
        pageMistakes: item.pageMistakes || item.page_mistakes || undefined,
        currentPage: item.currentPage ?? item.current_page ?? 0,
        overallProcessingComplete: item.overallProcessingComplete ?? item.overall_processing_complete ?? false,
        extractedTexts: item.extractedTexts || item.extracted_texts || undefined,
        pageMarkings: item.pageMarkings || item.page_markings || undefined,
        selectedMarkingStandard: item.selectedMarkingStandard || item.selected_marking_standard || 'hkdse'
      };
      
      console.log('✅ Mistake check fetched successfully');
      return { 
        success: true, 
        mistakeCheck: transformedMistakeCheck
      };
    } else {
      console.error('❌ Failed to fetch mistake check:', result.error);
      return { 
        success: false, 
        error: result.error || 'Failed to fetch mistake check'
      };
    }
  } catch (error: any) {
    console.error('❌ Error fetching mistake check:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch mistake check'
    };
  }
}; 
