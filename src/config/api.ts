// API Configuration
// This file centralizes all API configuration and handles environment-aware URL selection

// Function to get the API base URL based on environment
export const getApiBaseUrl = (): string => {
  // Check if we have an environment variable set
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // Development vs Production detection
  if (process.env.NODE_ENV === 'development') {
    // For local development
    return 'http://localhost:8000';
  }

  // For production - you should set REACT_APP_API_BASE_URL in your deployment environment
  // This is a fallback that might need CORS configuration
  return 'https://edusmart-server.pages.dev';
};

// Export the base URL
export const API_BASE_URL = getApiBaseUrl();

export const API_BASE = `${getApiBaseUrl()}/api`;
export const API_V2_BASE = `${getApiBaseUrl()}/api/v2`;

// API endpoints
export const API_ENDPOINTS = {
  // Subscription endpoints
  SUBSCRIPTIONS: {
    PLANS: '/api/subscriptions/plans',
    ADDONS: '/api/subscriptions/addons',
    STATUS: '/api/subscriptions/status',
    BUY: '/api/subscriptions/buy',
    BUY_ADDON: '/api/subscriptions/buy-addon',
    USE_RESPONSE: '/api/subscriptions/use-response',
    RESPONSE_HISTORY: '/api/subscriptions/responses',
    TRANSACTION_HISTORY: '/api/subscriptions/transactions',
    USAGE_LOGS: '/api/subscriptions/usage-logs',
  },
  
  // Course endpoints
  COURSES: {
    GET_ALL: '/api/courses',
    GET_BY_ID: '/api/courses',
    CATEGORIES: '/api/course-categories',
    LEVELS: '/api/course-levels',
    ENROLL: '/api/courses/enroll',
    PROGRESS: '/api/courses/progress',
  },
  
  // Other endpoints
  SCHOLARSHIPS: '/api/scholarships',
  UNIVERSITIES: '/api/universities',
  CASE_STUDIES: '/api/case-studies',
  RESOURCES: '/api/resources',
  BLOG: '/api/blog',
  PROFILE: '/api/profile',

  // V1 endpoints
  courses: '/courses',
  courseDetails: (id: string) => `/courses/${id}`,
  courseCategories: '/course-categories',
  
  // V2 endpoints (for enhanced functionality)
  v2: {
    enrollCourse: (courseId: string) => `/courses/${courseId}/enroll`,
    checkEnrollment: (courseId: string, userId: string) => `/courses/${courseId}/enrollment/${userId}`,
    userEnrollments: (userId: string) => `/users/${userId}/enrollments`,
    courseProgress: (courseId: string, userId: string) => `/courses/${courseId}/progress/${userId}`,
    updateProgress: (courseId: string) => `/courses/${courseId}/progress`,
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Default headers for API requests
export const getDefaultHeaders = (includeAuth: boolean = false, session?: any) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth && session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
};

console.log('API Configuration:', {
  baseUrl: API_BASE_URL,
  environment: process.env.NODE_ENV,
  hasCustomUrl: !!process.env.REACT_APP_API_BASE_URL,
}); 