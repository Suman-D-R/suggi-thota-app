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

  getByLocation: async (params: { lat: number; lng: number; page?: number; limit?: number; search?: string; category?: string; isFeatured?: boolean; maxDistance?: number }) => {
    const queryParams = new URLSearchParams();

    queryParams.append('lat', params.lat.toString());
    queryParams.append('lng', params.lng.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.isFeatured !== undefined) queryParams.append('isFeatured', params.isFeatured.toString());
    if (params.maxDistance) queryParams.append('maxDistance', params.maxDistance.toString());

    const response = await fetch(`${API_BASE_URL}/products/location?${queryParams}`);
    return await response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    return await response.json();
  },

  // Search products by location
  searchByLocation: async (params: { 
    q: string; 
    lat: number; 
    lng: number; 
    limit?: number; 
    maxDistance?: number 
  }) => {
    const queryParams = new URLSearchParams();

    queryParams.append('q', params.q);
    queryParams.append('lat', params.lat.toString());
    queryParams.append('lng', params.lng.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.maxDistance) queryParams.append('maxDistance', params.maxDistance.toString());

    const response = await fetch(`${API_BASE_URL}/products/search?${queryParams}`);
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

  getWithProducts: async (storeId: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/with-products?storeId=${storeId}`);
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

  verifyOTP: async (phoneNumber: string, otp: string, email?: string, name?: string, cartData?: { storeId: string; items: Array<{ productId: string; size: number; unit: string; quantity: number }> }) => {
    const url = `${API_BASE_URL}/auth/verify-otp`;
    const body: any = { phoneNumber, otp };
    if (email) body.email = email;
    if (name) body.name = name;
    if (cartData && cartData.storeId && cartData.items && cartData.items.length > 0) {
      body.cartData = cartData;
    }
    
    console.log('Verifying OTP request:', { url, body: { ...body, otp: '***', cartData: cartData ? { ...cartData, items: cartData.items.length } : undefined } });
    
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

// Cart API
export const cartAPI = {
  getCart: async (storeId: string) => {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    queryParams.append('storeId', storeId);
    
    const response = await fetch(`${API_BASE_URL}/cart?${queryParams}`, {
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  addItem: async (productId: string, size: number, unit: string, quantity: number = 1, price: number, storeId?: string, variantSku?: string) => {
    const headers = await getAuthHeaders();
    
    // Get storeId from location store if not provided
    let finalStoreId = storeId;
    if (!finalStoreId) {
      const { useLocationStore } = require('../store/locationStore');
      finalStoreId = useLocationStore.getState().selectedStore?._id;
    }
    
    if (!finalStoreId) {
      throw new Error('Store ID is required. Please select a store first.');
    }
    
    // ⚠️ CRITICAL: variantSku MUST be provided from the product API response
    // Never construct variantSku - always use variantSku from StoreProduct
    if (!variantSku) {
      throw new Error('variantSku is required. Please use variantSku from the product API response.');
    }
    
    const body = { productId, size, unit, quantity, price, storeId: finalStoreId, variantSku };
    
    // Debug logging
    console.log('Cart API - addItem:', { productId, size, unit, quantity, price, storeId: finalStoreId, variantSku });
    
    const response = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || `HTTP error! status: ${response.status}`;
      // Check if it's a "not available" or "insufficient stock" error - these are handled gracefully
      const isNotAvailableError = 
        errorMessage.includes('not available') ||
        errorMessage.includes('not available for this product') ||
        errorMessage.includes('Variant with SKU') ||
        errorMessage.includes('out of stock') ||
        errorMessage.includes('Insufficient stock') ||
        errorMessage.includes('insufficient stock');
      
      if (isNotAvailableError) {
        // Log as warning instead of error since it's expected and handled
        console.warn('Cart API - addItem: Item not available or insufficient stock:', errorMessage);
      } else {
        console.error('Cart API - addItem error:', data);
      }
      throw new Error(errorMessage);
    }
    
    return data;
  },

  updateItem: async (productId: string, size: number, unit: string, quantity: number, storeId?: string, variantSku?: string) => {
    const headers = await getAuthHeaders();
    
    // Get storeId from location store if not provided
    let finalStoreId = storeId;
    if (!finalStoreId) {
      const { useLocationStore } = require('../store/locationStore');
      finalStoreId = useLocationStore.getState().selectedStore?._id;
    }
    
    if (!finalStoreId) {
      throw new Error('Store ID is required. Please select a store first.');
    }
    
    // ⚠️ CRITICAL: variantSku MUST be provided from the product API response
    // Never construct variantSku - always use variantSku from StoreProduct
    if (!variantSku) {
      throw new Error('variantSku is required. Please use variantSku from the product API response.');
    }
    
    const body = { productId, size, unit, quantity, storeId: finalStoreId, variantSku };
    
    // Debug logging
    console.log('Cart API - updateItem:', { productId, size, unit, quantity, storeId: finalStoreId, variantSku });
    console.log('Cart API - updateItem body:', body);
    
    const response = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || `HTTP error! status: ${response.status}`;
      // Check if it's a "not available" or "insufficient stock" error - these are handled gracefully
      const isNotAvailableError = 
        errorMessage.includes('not available') ||
        errorMessage.includes('not available for this product') ||
        errorMessage.includes('Variant with SKU') ||
        errorMessage.includes('out of stock') ||
        errorMessage.includes('Insufficient stock') ||
        errorMessage.includes('insufficient stock');
      
      if (isNotAvailableError) {
        // Log as warning instead of error since it's expected and handled
        console.warn('Cart API - updateItem: Item not available or insufficient stock:', errorMessage);
      } else {
        console.error('Cart API - updateItem error:', data);
      }
      throw new Error(errorMessage);
    }
    
    return data;
  },

  removeItem: async (productId: string, size?: number, unit?: string, storeId?: string, variantSku?: string) => {
    const headers = await getAuthHeaders();
    
    // Get storeId from location store if not provided
    let finalStoreId = storeId;
    if (!finalStoreId) {
      const { useLocationStore } = require('../store/locationStore');
      finalStoreId = useLocationStore.getState().selectedStore?._id;
    }
    
    if (!finalStoreId) {
      throw new Error('Store ID is required. Please select a store first.');
    }
    
    // ⚠️ CRITICAL: variantSku MUST be provided from the product API response
    // Never construct variantSku - always use variantSku from StoreProduct
    if (!variantSku) {
      throw new Error('variantSku is required. Please use variantSku from the product API response.');
    }
    
    const body = { productId, storeId: finalStoreId, variantSku };
    
    // Debug logging
    console.log('Cart API - removeItem:', { productId, size, unit, storeId: finalStoreId, variantSku });
    console.log('Cart API - removeItem body:', body);
    
    const response = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Cart API - removeItem error:', data);
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  clearCart: async (storeId: string) => {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    queryParams.append('storeId', storeId);
    
    const response = await fetch(`${API_BASE_URL}/cart?${queryParams}`, {
      method: 'DELETE',
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },
};

// Order API
export const orderAPI = {
  createOrder: async (orderData: {
    deliveryAddressId: string;
    paymentMethod: 'cod' | 'online' | 'wallet';
    couponCode?: string;
    deliveryFee?: number;
    tax?: number;
    discount?: number;
    deliveryInstructions?: string;
    orderNotes?: string;
  }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Create error with response data for better error handling
      const error: any = new Error(data.message || `HTTP error! status: ${response.status}`);
      error.response = response;
      error.data = data;
      throw error;
    }
    
    return data;
  },

  getUserOrders: async (page?: number, limit?: number) => {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/orders?${queryParams}`, {
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  getOrderById: async (orderId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  reorder: async (orderId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/reorder`, {
      method: 'POST',
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },
};

// Address API
export const addressAPI = {
  getAddresses: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  getAddressById: async (addressId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  createAddress: async (addressData: {
    type?: 'home' | 'work' | 'other';
    label?: string;
    street: string;
    apartment?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode?: string;
    country?: string;
    contactName: string;
    contactPhone: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    deliveryInstructions?: string;
    isDefault?: boolean;
  }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(addressData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  updateAddress: async (addressId: string, addressData: {
    type?: 'home' | 'work' | 'other';
    label?: string;
    street?: string;
    apartment?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    contactName?: string;
    contactPhone?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    deliveryInstructions?: string;
    isDefault?: boolean;
  }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(addressData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  deleteAddress: async (addressId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: 'DELETE',
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  setDefaultAddress: async (addressId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}/default`, {
      method: 'PATCH',
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },
};

// Store API
export const storeAPI = {
  findNearby: async (lat: number, lng: number, maxDistance?: number) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('lat', lat.toString());
      queryParams.append('lng', lng.toString());
      if (maxDistance) queryParams.append('maxDistance', maxDistance.toString());

      const url = `${API_BASE_URL}/stores/nearby/search?${queryParams}`;
      console.log('Store API - findNearby request:', { url, lat, lng, maxDistance });

      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Store API - findNearby response:', { 
        status: response.status, 
        ok: response.ok,
        success: data.success,
        hasStores: data.data?.stores?.length > 0 
      });
      
      if (!response.ok) {
        const errorMessage = data.message || `HTTP error! status: ${response.status}`;
        console.error('Store API - findNearby error:', { 
          status: response.status, 
          message: errorMessage,
          data 
        });
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error: any) {
      // Handle network errors separately
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Store API - Network error:', error);
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      }
      // Re-throw other errors
      throw error;
    }
  },
};
