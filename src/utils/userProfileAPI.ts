import { Session } from '@supabase/supabase-js';
import { API_BASE_URL, getDefaultHeaders } from '../config/api';

// Helper function to make API calls (same as in apiService.ts)
const apiCall = async (method: string, endpoint: string, data: any = null, session?: Session | null) => {
  try {
    const headers = getDefaultHeaders(!!session, session);
    const fullUrl = `${API_BASE_URL}${endpoint}`;

    const config = {
      method,
      url: fullUrl,
      headers,
      ...(data && { data })
    };

    console.log(`Making ${method} request to ${fullUrl}`);
    console.log('Headers:', headers);
    console.log('Session info:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      tokenStart: session?.access_token?.substring(0, 20) + '...'
    });
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Custom API URL:', process.env.REACT_APP_API_BASE_URL);
    
    // Use dynamic import to avoid circular dependency
    const axios = (await import('axios')).default;
    const response = await axios(config);
    console.log(`✅ ${method} ${fullUrl} - Success:`, response.status);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error(`❌ ${method} ${endpoint} - API Call Error:`, {
      method,
      endpoint,
      fullUrl: `${API_BASE_URL}${endpoint}`,
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token
    });
    
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

export interface UserProfile {
  id?: string;
  user_id: string;
  
  // Basic Information
  full_name: string;
  email: string;
  phone: string;
  
  // Personal Information
  date_of_birth?: string;
  nationality: string;
  current_location: string;
  preferred_study_location: string;
  
  // Academic Information
  current_education_level: string;
  current_institution: string;
  current_gpa: string | number;  // Handle both string and number types
  gpa_scale: string;
  graduation_year: string;
  field_of_study: string;
  preferred_field: string;
  
  // Test Scores - make them all optional and handle number/string types
  sat_score?: number | null;
  act_score?: number | null;
  gre_score?: number | null;
  gmat_score?: number | null;
  toefl_score?: number | null;
  ielts_score?: number | null;
  duolingo_score?: number | null;
  
  // Preferences
  preferred_degree_level: string;
  budget_range: string;
  preferred_university_size: string;
  preferred_campus_type: string;
  preferred_program_type: string;
  
  // Experience and Goals
  career_goals: string;
  work_experience: string;
  research_experience?: string;
  publications?: string;
  awards?: string;
  
  // Activities and Skills
  extracurricular_activities?: string[];
  languages?: string[];
  
  // Additional Information
  financial_aid_needed?: boolean;
  scholarship_interests?: string;
  
  // Profile Management
  profile_completion_percentage?: number;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

class UserProfileAPI {
  async getUserProfile(session?: Session | null): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const response = await apiCall('GET', '/api/user/profile', null, session);
      
      if (response.success) {
        return {
          success: true,
          profile: response.data.data || response.data.profile || response.data,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to fetch profile',
        };
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: 'Network error while fetching profile',
      };
    }
  }

  async createOrUpdateProfile(profileData: Partial<UserProfile>, session?: Session | null): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const response = await apiCall('POST', '/api/user/profile', profileData, session);
      
      if (response.success) {
        return {
          success: true,
          profile: response.data.profile || response.data,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to create/update profile',
        };
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      return {
        success: false,
        error: 'Network error while saving profile',
      };
    }
  }

  async updateProfile(profileData: Partial<UserProfile>, session?: Session | null): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const response = await apiCall('PUT', '/api/user/profile', profileData, session);
      
      if (response.success) {
        return {
          success: true,
          profile: response.data.profile || response.data,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to update profile',
        };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        error: 'Network error while updating profile',
      };
    }
  }

  async updateProfileFields(fields: Partial<UserProfile>, session?: Session | null): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const response = await apiCall('PATCH', '/api/user/profile', fields, session);
      
      if (response.success) {
        return {
          success: true,
          profile: response.data.profile || response.data,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to update profile fields',
        };
      }
    } catch (error) {
      console.error('Error updating profile fields:', error);
      return {
        success: false,
        error: 'Network error while updating profile fields',
      };
    }
  }

  async deleteProfile(session?: Session | null): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiCall('DELETE', '/api/user/profile', null, session);
      
      if (response.success) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to delete profile',
        };
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      return {
        success: false,
        error: 'Network error while deleting profile',
      };
    }
  }

  async getProfileCompletion(session?: Session | null): Promise<{ success: boolean; completion_percentage?: number; error?: string }> {
    try {
      const response = await apiCall('GET', '/api/user/profile/completion', null, session);
      
      if (response.success) {
        return {
          success: true,
          completion_percentage: response.data.completion_percentage,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to fetch profile completion',
        };
      }
    } catch (error) {
      console.error('Error fetching profile completion:', error);
      return {
        success: false,
        error: 'Network error while fetching profile completion',
      };
    }
  }
}

export const userProfileAPI = new UserProfileAPI(); 