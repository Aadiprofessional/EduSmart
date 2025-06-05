import { Session } from '@supabase/supabase-js';

const API_BASE_URL = 'https://edusmart-server.vercel.app/api';

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
  private getAuthHeaders(session?: Session | null): HeadersInit {
    const token = session?.access_token || '';
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getUserProfile(session?: Session | null): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(session),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          profile: data.profile,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch profile',
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
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'POST',
        headers: this.getAuthHeaders(session),
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          profile: data.profile,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to create/update profile',
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
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(session),
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          profile: data.profile,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to update profile',
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
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(session),
        body: JSON.stringify(fields),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          profile: data.profile,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to update profile fields',
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
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(session),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to delete profile',
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
      const response = await fetch(`${API_BASE_URL}/user/profile/completion`, {
        method: 'GET',
        headers: this.getAuthHeaders(session),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          completion_percentage: data.completion_percentage,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch profile completion',
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