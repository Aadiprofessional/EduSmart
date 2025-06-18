import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://edusmart-server.pages.dev/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FeaturedData {
  blogs: any[];
  courses: Course[];
  case_studies: CaseStudy[];
  scholarships: Scholarship[];
  universities: any[];
  resources: Resource[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_image: string;
  category: string;
  level: string;
  price: number;
  instructor_name: string;
  rating: number;
  featured: boolean;
  created_at: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  thumbnail: string;
  featured: boolean;
  created_at: string;
}

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  achievement: string;
  student_name: string;
  student_image?: string;
  university?: string;
  course?: string;
  rating?: number;
  featured: boolean;
  created_at: string;
}

interface Scholarship {
  id: string;
  title: string;
  description: string;
  amount: number;
  university: string;
  country: string;
  deadline: string;
  eligibility: string;
  featured: boolean;
  created_at: string;
}

export const featuredApiService = {
  async getFeaturedData(): Promise<ApiResponse<FeaturedData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/featured`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching featured data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

// Custom hook for featured data
export const useFeaturedData = () => {
  const [data, setData] = useState<FeaturedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await featuredApiService.getFeaturedData();
        
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.error || 'Failed to load data');
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching featured data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export type { FeaturedData, Course, Resource, CaseStudy, Scholarship }; 