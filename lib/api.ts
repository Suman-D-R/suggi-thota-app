// API utility functions for the customer app
// @ts-ignore - expo-env.js is a CommonJS module
const { API_URL } = require('../expo-env');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || API_URL;

// Log API base URL on module load (for debugging)
console.log('API Base URL:', API_BASE_URL);

// Helper function to get auth headers
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const token = await AsyncStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Product API
export const productAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; category?: string; isActive?: boolean; isFeatured?: boolean }) => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.isFeatured !== undefined) queryParams.append('isFeatured', params.isFeatured.toString());

    const response = await fetch(`${API_BASE_URL}/products?${queryParams}`);
    return await response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    return await response.json();
  },
};

// Category API
export const categoryAPI = {
  getAll: async (includeInactive?: boolean) => {
    const response = await fetch(`${API_BASE_URL}/categories?includeInactive=${includeInactive || false}`);
    return await response.json();
  },

  getMain: async () => {
    const response = await fetch(`${API_BASE_URL}/categories/main`);
    return await response.json();
  },

  getSubcategories: async (parentId: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/${parentId}/subcategories`);
    return await response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`);
    return await response.json();
  },
};

// Hero Banner API
export const heroBannerAPI = {
  getActive: async () => {
    const response = await fetch(`${API_BASE_URL}/hero-banners/active`);
    return await response.json();
  },
};

// Auth API
export const authAPI = {
  sendOTP: async (phoneNumber: string) => {
    const url = `${API_BASE_URL}/auth/send-otp`;
    const body = { phoneNumber };
    
    console.log('Sending OTP request:', { url, body: { ...body, phoneNumber: phoneNumber.replace(/(\+\d{2})(\d+)/, '$1****$2') } });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      console.log('OTP Response status:', response.status);
      
      const data = await response.json();
      console.log('OTP Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('OTP API Error:', error);
      throw error;
    }
  },

  verifyOTP: async (phoneNumber: string, otp: string, email?: string, name?: string) => {
    const url = `${API_BASE_URL}/auth/verify-otp`;
    const body: any = { phoneNumber, otp };
    if (email) body.email = email;
    if (name) body.name = name;
    
    console.log('Verifying OTP request:', { url, body: { ...body, otp: '***' } });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      console.log('Verify OTP Response status:', response.status);
      
      const data = await response.json();
      console.log('Verify OTP Response data:', { ...data, data: data.data ? { ...data.data, tokens: '***' } : data.data });
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('Verify OTP API Error:', error);
      throw error;
    }
  },

  updateUserName: async (name: string) => {
    const url = `${API_BASE_URL}/auth/update-name`;
    const headers = await getAuthHeaders();
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('Update user name API Error:', error);
      throw error;
    }
  },

  refreshToken: async (refreshToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    return await response.json();
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers,
    });
    return await response.json();
  },

  updateProfile: async (profileData: {
    name?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    profileImage?: string;
  }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(profileData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },
};
