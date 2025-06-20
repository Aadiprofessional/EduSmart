import { Session } from '@supabase/supabase-js';
import { API_BASE_URL, getDefaultHeaders } from '../config/api';

// Helper function to make API calls (same as in apiService.ts)
const apiCall = async (method: string, endpoint: string, data: any = null, session?: Session | null) => {
  try {
    const headers = getDefaultHeaders(!!session, session);

    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers,
      ...(data && { data })
    };

    console.log(`Making ${method} request to ${API_BASE_URL}${endpoint}`);
    
    // Use dynamic import to avoid circular dependency
    const axios = (await import('axios')).default;
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('API Call Error:', {
      method,
      endpoint,
      url: `${API_BASE_URL}${endpoint}`,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
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
  date_of_birth: string;
  nationality: string;
  current_location: string;
  preferred_study_location: string;
  
  // Academic Information
  current_education_level: string;
  current_institution: string;
  current_gpa: string;
  gpa_scale: string;
  graduation_year: string;
  field_of_study: string;
  preferred_field: string;
  
  // Test Scores
  sat_score?: number;
  act_score?: number;
  gre_score?: number;
  gmat_score?: number;
  toefl_score?: number;
  ielts_score?: number;
  duolingo_score?: number;
  
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