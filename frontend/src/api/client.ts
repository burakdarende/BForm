import axios, { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const { response } = error;

    if (response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
    } else if (response?.status === 403) {
      toast.error('Bu işlem için yetkiniz bulunmuyor.');
    } else if (response?.status === 404) {
      toast.error('İstenen kaynak bulunamadı.');
    } else if (response?.status === 429) {
      toast.error('Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.');
    } else if (response?.status >= 500) {
      toast.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
    } else if (!response) {
      toast.error('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post('/auth/login', credentials),
    register: (data: { email: string; password: string; name: string }) =>
      apiClient.post('/auth/register', data),
    me: () => apiClient.get('/auth/me'),
    logout: () => apiClient.post('/auth/logout'),
  },

  // Forms
  forms: {
    getPublic: () => apiClient.get('/forms/public'),
    getBySlug: (slug: string) => apiClient.get(`/forms/public/${slug}`),
    getMy: () => apiClient.get('/forms/my'),
    create: (formData: any) => apiClient.post('/forms', formData),
    update: (id: string, formData: any) => apiClient.put(`/forms/${id}`, formData),
    delete: (id: string) => apiClient.delete(`/forms/${id}`),
    toggle: (id: string) => apiClient.patch(`/forms/${id}/toggle`),
  },

  // Responses
  responses: {
    submit: (slug: string, responses: any) =>
      apiClient.post(`/responses/submit/${slug}`, { responses }),
    getByForm: (formId: string, page = 1, limit = 10) =>
      apiClient.get(`/responses/form/${formId}?page=${page}&limit=${limit}`),
    get: (responseId: string) => apiClient.get(`/responses/${responseId}`),
    updateStatus: (responseId: string, status: string, notes?: string) =>
      apiClient.patch(`/responses/${responseId}/status`, { status, notes }),
  },

  // Themes
  themes: {
    getAll: () => apiClient.get('/themes'),
    get: (id: string) => apiClient.get(`/themes/${id}`),
    create: (themeData: any) => apiClient.post('/themes', themeData),
    update: (id: string, themeData: any) => apiClient.put(`/themes/${id}`, themeData),
    reset: (id: string) => apiClient.put(`/themes/${id}/reset`),
    delete: (id: string) => apiClient.delete(`/themes/${id}`),
  },

  // Admin
  admin: {
    getDashboard: () => apiClient.get('/admin/dashboard'),
    getUsers: () => apiClient.get('/admin/users'),
    updateUserStatus: (userId: string, isActive: boolean) =>
      apiClient.patch(`/admin/users/${userId}/status`, { isActive }),
    getFormAnalytics: (formId: string, period = 30) =>
      apiClient.get(`/admin/forms/${formId}/analytics?period=${period}`),
    exportResponses: (formId: string) =>
      apiClient.get(`/admin/forms/${formId}/export`, { responseType: 'blob' }),
  },
};

// Upload helper
export const uploadFile = async (file: File, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
};

// Health check
export const healthCheck = () => apiClient.get('/health');

export default apiClient;