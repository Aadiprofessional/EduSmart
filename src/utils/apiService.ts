import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Helper function to make API calls
const apiCall = async (method: string, endpoint: string, data: any = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      },
      ...(data && { data })
    };

    console.log(`Making ${method} request to ${API_BASE_URL}${endpoint}`);
    
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

// Homework API functions
export const homeworkAPI = {
  // Submit homework with file upload
  submit: async (data: {
    uid: string;
    question?: string;
    solution?: string;
    file_type?: string;
    page_solutions?: any;
    current_page?: number;
    processing_complete?: boolean;
    file?: File;
  }) => {
    try {
      const formData = new FormData();
      
      // Add all fields to form data
      formData.append('uid', data.uid);
      if (data.question) formData.append('question', data.question);
      if (data.solution) formData.append('solution', data.solution);
      if (data.file_type) formData.append('file_type', data.file_type);
      if (data.page_solutions) formData.append('page_solutions', JSON.stringify(data.page_solutions));
      if (data.current_page !== undefined) formData.append('current_page', data.current_page.toString());
      if (data.processing_complete !== undefined) formData.append('processing_complete', data.processing_complete.toString());
      if (data.file) formData.append('file', data.file);

      console.log('Submitting homework to API...');
      
      const response = await axios.post(`${API_BASE_URL}/api/homework/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Homework submit error:', error);
      return { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status 
      };
    }
  },

  // Get homework history for a user
  getHistory: async (uid: string, limit = 20, offset = 0) => {
    return apiCall('GET', `/api/homework/history/${uid}?limit=${limit}&offset=${offset}`);
  },

  // Update homework solution
  update: async (id: string, data: {
    solution?: string;
    page_solutions?: any;
    current_page?: number;
    processing_complete?: boolean;
  }) => {
    return apiCall('PUT', `/api/homework/update/${id}`, data);
  },

  // Delete homework entry
  delete: async (id: string, uid: string) => {
    return apiCall('DELETE', `/api/homework/${id}?uid=${uid}`);
  },

  // Get specific homework by ID
  getById: async (id: string, uid: string) => {
    return apiCall('GET', `/api/homework/${id}?uid=${uid}`);
  }
};

// Mistake Check API functions
export const mistakeCheckAPI = {
  // Submit mistake check with file upload
  submit: async (data: {
    uid: string;
    text?: string;
    fileName?: string;
    file_type?: string;
    document_pages?: any;
    mistakes?: any[];
    page_mistakes?: any;
    extracted_texts?: any;
    page_markings?: any;
    marking_summary?: any;
    selected_marking_standard?: string;
    current_page?: number;
    overall_processing_complete?: boolean;
    file?: File;
  }) => {
    try {
      const formData = new FormData();
      
      // Add all fields to form data using the exact field names the backend expects
      formData.append('uid', data.uid);
      if (data.text) formData.append('text', data.text);
      if (data.fileName) formData.append('fileName', data.fileName);
      if (data.file_type) formData.append('fileType', data.file_type);
      if (data.document_pages) formData.append('documentPages', JSON.stringify(data.document_pages));
      if (data.mistakes) formData.append('mistakes', JSON.stringify(data.mistakes));
      if (data.page_mistakes) formData.append('pageMistakes', JSON.stringify(data.page_mistakes));
      if (data.extracted_texts) formData.append('extractedTexts', JSON.stringify(data.extracted_texts));
      if (data.page_markings) formData.append('pageMarkings', JSON.stringify(data.page_markings));
      if (data.marking_summary) formData.append('markingSummary', JSON.stringify(data.marking_summary));
      if (data.selected_marking_standard) formData.append('selectedMarkingStandard', data.selected_marking_standard);
      if (data.current_page !== undefined) formData.append('currentPage', data.current_page.toString());
      if (data.overall_processing_complete !== undefined) formData.append('overallProcessingComplete', data.overall_processing_complete.toString());
      if (data.file) formData.append('file', data.file);

      console.log('Submitting mistake check to API...');
      
      const response = await axios.post(`${API_BASE_URL}/api/mistake-checks/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Mistake check submit error:', error);
      return { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status 
      };
    }
  },

  // Get mistake check history for a user
  getHistory: async (uid: string, limit = 20, offset = 0) => {
    return apiCall('GET', `/api/mistake-checks/history/${uid}?limit=${limit}&offset=${offset}`);
  },

  // Update mistake check data
  update: async (id: string, data: {
    text?: string;
    mistakes?: any[];
    page_mistakes?: any;
    extracted_texts?: any;
    page_markings?: any;
    marking_summary?: any;
    selected_marking_standard?: string;
    current_page?: number;
    overall_processing_complete?: boolean;
  }) => {
    return apiCall('PUT', `/api/mistake-checks/update/${id}`, {
      text: data.text,
      mistakes: data.mistakes,
      pageMistakes: data.page_mistakes,
      extractedTexts: data.extracted_texts,
      pageMarkings: data.page_markings,
      markingSummary: data.marking_summary,
      selectedMarkingStandard: data.selected_marking_standard,
      currentPage: data.current_page,
      overallProcessingComplete: data.overall_processing_complete
    });
  },

  // Delete mistake check entry
  delete: async (id: string, uid: string) => {
    return apiCall('DELETE', `/api/mistake-checks/${id}?uid=${uid}`);
  },

  // Get specific mistake check by ID
  getById: async (id: string, uid: string) => {
    return apiCall('GET', `/api/mistake-checks/${id}?uid=${uid}`);
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