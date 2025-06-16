import axios from 'axios';

// Environment-aware base URL configuration
const BASE_URL = 'https://edusmart-server.pages.dev'; // Force production URL for now

// Helper function to make API calls
const apiCall = async (method: string, endpoint: string, data: any = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      },
      ...(data && { data })
    };

    console.log(`Making ${method} request to ${BASE_URL}${endpoint}`);
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('API Call Error:', {
      method,
      endpoint,
      url: `${BASE_URL}${endpoint}`,
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

// Blog API functions (public only for user website)
export const blogAPI = {
  // Get all blogs (public)
  getAll: async (page = 1, limit = 20, category?: string, tag?: string, search?: string) => {
    let endpoint = `/api/blogs?page=${page}&limit=${limit}`;
    if (category) endpoint += `&category=${category}`;
    if (tag) endpoint += `&tag=${tag}`;
    if (search) endpoint += `&search=${search}`;
    return apiCall('GET', endpoint);
  },

  // Get blog by ID (public)
  getById: async (id: string) => {
    return apiCall('GET', `/api/blogs/${id}`);
  },

  // Get blog categories (public)
  getCategories: async () => {
    return apiCall('GET', '/api/blog-categories');
  },

  // Get blog tags (public)
  getTags: async () => {
    return apiCall('GET', '/api/blog-tags');
  }
};

// Course API functions (public only for user website)
export const courseAPI = {
  // Get all courses (public)
  getAll: async (page = 1, limit = 20, category?: string, level?: string, search?: string, featured?: boolean) => {
    let endpoint = `/api/courses?page=${page}&limit=${limit}`;
    if (category) endpoint += `&category=${category}`;
    if (level) endpoint += `&level=${level}`;
    if (search) endpoint += `&search=${search}`;
    if (featured !== undefined) endpoint += `&featured=${featured}`;
    return apiCall('GET', endpoint);
  },

  // Get course by ID (public)
  getById: async (id: string) => {
    return apiCall('GET', `/api/courses/${id}`);
  },

  // Get course categories (public)
  getCategories: async () => {
    return apiCall('GET', '/api/course-categories');
  },

  // Get course levels (public)
  getLevels: async () => {
    return apiCall('GET', '/api/course-levels');
  }
};

// Scholarship API functions (public only for user website)
export const scholarshipAPI = {
  // Get all scholarships (public)
  getAll: async (page = 1, limit = 12, country?: string) => {
    let endpoint = `/api/scholarships?page=${page}&limit=${limit}`;
    if (country) endpoint += `&country=${country}`;
    return apiCall('GET', endpoint);
  },

  // Get scholarship by ID (public)
  getById: async (id: string) => {
    return apiCall('GET', `/api/scholarships/${id}`);
  },

  // Get scholarship countries (public)
  getCountries: async () => {
    return apiCall('GET', '/api/scholarship-countries');
  },

  // Get scholarship universities (public)
  getUniversities: async () => {
    return apiCall('GET', '/api/scholarship-universities');
  }
};

// University API functions (public only for user website)
export const universityAPI = {
  // Get all universities (public)
  getAll: async (page = 1, limit = 12, queryString?: string) => {
    let endpoint = `/api/universities?page=${page}&limit=${limit}`;
    if (queryString) {
      endpoint += `&${queryString}`;
    }
    return apiCall('GET', endpoint);
  },

  // Get university by ID (public)
  getById: async (id: string) => {
    return apiCall('GET', `/api/universities/${id}`);
  },

  // Get university countries (public)
  getCountries: async () => {
    return apiCall('GET', '/api/universities/countries');
  }
};

// Response API functions (public only for user website)
export const responseAPI = {
  // Get all responses (public)
  getAll: async (page = 1, limit = 20, category?: string, type?: string, search?: string, featured?: boolean) => {
    let endpoint = `/api/responses?page=${page}&limit=${limit}`;
    if (category) endpoint += `&category=${category}`;
    if (type) endpoint += `&type=${type}`;
    if (search) endpoint += `&search=${search}`;
    if (featured !== undefined) endpoint += `&featured=${featured}`;
    return apiCall('GET', endpoint);
  },

  // Get response by ID (public)
  getById: async (id: string) => {
    return apiCall('GET', `/api/responses/${id}`);
  },

  // Get response categories (public)
  getCategories: async () => {
    return apiCall('GET', '/api/response-categories');
  },

  // Get response types (public)
  getTypes: async () => {
    return apiCall('GET', '/api/response-types');
  }
};

// Case Study API functions (public only for user website)
export const caseStudyAPI = {
  // Get all case studies (public)
  getAll: async (page = 1, limit = 20, category?: string, outcome?: string, country?: string, field?: string, search?: string, featured?: boolean) => {
    let endpoint = `/api/case-studies?page=${page}&limit=${limit}`;
    if (category) endpoint += `&category=${category}`;
    if (outcome) endpoint += `&outcome=${outcome}`;
    if (country) endpoint += `&country=${country}`;
    if (field) endpoint += `&field=${field}`;
    if (search) endpoint += `&search=${search}`;
    if (featured !== undefined) endpoint += `&featured=${featured}`;
    return apiCall('GET', endpoint);
  },

  // Get case study by ID (public)
  getById: async (id: string) => {
    return apiCall('GET', `/api/case-studies/${id}`);
  },

  // Get case study categories (public)
  getCategories: async () => {
    return apiCall('GET', '/api/case-studies/categories');
  },

  // Get case study outcomes (public)
  getOutcomes: async () => {
    return apiCall('GET', '/api/case-studies/outcomes');
  },

  // Get case study countries (public)
  getCountries: async () => {
    return apiCall('GET', '/api/case-studies/countries');
  },

  // Get case study fields (public)
  getFields: async () => {
    return apiCall('GET', '/api/case-studies/fields');
  }
};

// Convenience functions for backward compatibility
export const fetchResponses = async (page = 1, limit = 20, category?: string, type?: string, search?: string, featured?: boolean) => {
  const result = await responseAPI.getAll(page, limit, category, type, search, featured);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
};

export const fetchResponseCategories = async () => {
  const result = await responseAPI.getCategories();
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
};

export const fetchResponseTypes = async () => {
  const result = await responseAPI.getTypes();
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
};

export default blogAPI; 