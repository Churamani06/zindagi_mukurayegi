import axios from 'axios';

// Base API URL - configured for our Node.js backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

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
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if it's NOT a login request
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/';
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
