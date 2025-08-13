import axios from 'axios';

// Base API URL - configured for our Node.js backend
const BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Enable credentials for CORS
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔐 Adding token to ${config.method?.toUpperCase()} ${config.url}:`, token.substring(0, 20) + '...');
    } else {
      console.log(`📝 No token available for ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    
    console.error(`❌ ${method} ${url} - ${status}:`, error.response?.data);
    
    // Only redirect on 401 if it's NOT a login request
    if (status === 401 && !url?.includes('/auth/login')) {
      console.log('🔒 Token expired or invalid, clearing auth data');
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Only redirect if we're not already on login page
      if (window.location.pathname !== '/' && !window.location.pathname.includes('login')) {
        console.log('🚀 Redirecting to login page');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials, userType) => 
    api.post('/auth/login', { ...credentials, role: userType }),
  
  // JWT tokens are stateless, so logout is handled client-side only
  logout: () => Promise.resolve({ data: { success: true } }),
  
  getProfile: () => 
    api.get('/auth/profile'),
};

// Child Health Records API endpoints
export const childHealthAPI = {
  // Get all records (admin only)
  getAllRecords: (page = 1, limit = 10, filters = {}) => 
    api.get('/child-health-records', { 
      params: { page, limit, ...filters } 
    }),

  // Get records by submitted_by_user_id (for dashboard)
  getRecordsByUserId: (userId) =>
    api.get('/child/all', { params: { submitted_by_user_id: userId } }),

  // Create new record
  createRecord: (recordData) => 
    api.post('/child/add', recordData),

  // Update record
  updateRecord: (id, recordData) => 
    api.put(`/child-health-records/${id}`, recordData),

  // Update health status only
  updateHealthStatus: (id, health_status) =>
    api.put(`/child/update-status/${id}`, { health_status }),

  // Delete record
  deleteRecord: (id) => 
    api.delete(`/child-health-records/${id}`),

  // Get record by ID
  getRecordById: (id) => 
    api.get(`/child-health-records/${id}`),
};

// Dashboard API endpoints
export const dashboardAPI = {
  // Get dashboard statistics (admin only)
  getStats: () => 
    api.get('/dashboard/stats'),
  
  // Get all records for admin dashboard
  getAllRecords: (page = 1, limit = 50) => 
    api.get(`/child-health-records?page=${page}&limit=${limit}`),
  
  // Get records by status
  getRecordsByStatus: (status) => 
    api.get(`/dashboard/records-by-status/${status}`),
  
  // Get records by date range
  getRecordsByDateRange: (startDate, endDate) => 
    api.get('/dashboard/records-by-date', { 
      params: { startDate, endDate } 
    }),
};

export default api;
