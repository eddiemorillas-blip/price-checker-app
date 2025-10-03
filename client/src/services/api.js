import axios from 'axios';

// In production, use relative URL (same domain). In development, use localhost
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const productService = {
  searchByBarcode: async (barcode) => {
    const response = await api.get(`/products/search/${barcode}`);
    return response.data;
  },

  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  updateProduct: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
};

export const uploadService = {
  previewExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  uploadExcel: async (file, onProgress = () => {}) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      },
    });

    return response.data;
  },

  getUploadHistory: async () => {
    const response = await api.get('/upload/history');
    return response.data;
  },

  uploadExcelWithMapping: async (file, sheetName, columnMapping, onProgress = () => {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sheetName', sheetName);
    formData.append('columnMapping', JSON.stringify(columnMapping));

    const response = await api.post('/upload/excel-with-mapping', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      },
    });

    return response.data;
  },
};

export const brandingService = {
  getBranding: async () => {
    const response = await api.get('/branding');
    return response.data;
  },

  updateBranding: async (data) => {
    const response = await api.put('/branding', data);
    return response.data;
  },

  resetBranding: async () => {
    const response = await api.post('/branding/reset');
    return response.data;
  },

  getBrandingCSS: () => {
    return `${API_BASE_URL}/branding/css`;
  },
};

export const healthService = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;