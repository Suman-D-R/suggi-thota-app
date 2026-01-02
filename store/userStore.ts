import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { authAPI, userAPI } from '../lib/api';
import { useCartStore } from './cartStore';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  isVerified: boolean;
  authMethod?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  profileImage?: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface UserState {
  isLoggedIn: boolean;
  profile: UserProfile | null;
  tokens: Tokens | null;
  googleUser: { email: string; name: string } | null;
  // OTP methods
  sendOTP: (phoneNumber: string) => Promise<boolean>;
  verifyOTP: (phoneNumber: string, otp: string, name?: string, googleUser?: { email: string; name: string } | null) => Promise<boolean>;
  loginWithGoogle: (email: string, name: string) => void;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateUserName: (name: string) => Promise<boolean>;
  updateUserProfile: (profileData: {
    name?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    profileImage?: string;
  }) => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  initialize: () => Promise<void>;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
};

// Helper function to parse name into firstName and lastName
const parseName = (name: string) => {
  const nameParts = name.split(' ');
  return {
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
  };
};

// Helper function to convert backend user to profile
const convertUserToProfile = (user: any): UserProfile => {
  const nameParts = parseName(user.name || '');
  return {
    id: user.id || user._id,
    name: user.name || '',
    email: user.email,
    phone: user.phone,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    mobileNumber: user.phone || '',
    isVerified: user.isVerified || false,
    authMethod: user.authMethod,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    profileImage: user.profileImage,
  };
};

export const useUserStore = create<UserState>((set, get) => ({
  isLoggedIn: false,
  profile: null,
  tokens: null,
  googleUser: null,
  
  loginWithGoogle: (email: string, name: string) => {
    set({
      googleUser: { email, name },
    });
  },

  sendOTP: async (phoneNumber: string) => {
    try {
      // Format phone number (remove spaces and ensure proper format)
      // Phone should be in international format like +919876543210
      const cleanedPhone = phoneNumber.replace(/\s/g, '');
      
      console.log('UserStore: Sending OTP request for phone:', cleanedPhone);
      
      // Send phone number to backend - backend will generate and send OTP
      const response = await authAPI.sendOTP(cleanedPhone);
      
      console.log('UserStore: OTP response received:', response);
      
      if (response.success) {
        return true;
      } else {
        console.error('Send OTP error:', response.message || 'Failed to send OTP');
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Send OTP error in userStore:', error);
      // Re-throw with a more user-friendly message if it's a network error
      if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and API server.');
      }
      throw error;
    }
  },

  verifyOTP: async (phoneNumber: string, otp: string, name?: string, googleUser?: { email: string; name: string } | null) => {
    try {
      // Format phone number (remove spaces)
      // Phone should be in international format like +919876543210
      const cleanedPhone = phoneNumber.replace(/\s/g, '');
      
      console.log('UserStore: Verifying OTP with backend');
      
      // Use name from googleUser if available, otherwise use provided name
      const userName = googleUser?.name || name;
      
      // Send phone number, OTP, and name to backend - backend will verify and authenticate
      const response = await authAPI.verifyOTP(
        cleanedPhone,
        otp,
        googleUser?.email,
        userName
      );
      
      // Check if name is required (for new users)
      if (!response.success) {
        // Check if the error response indicates name is required
        if (response.requiresName || response.message?.includes('Name is required')) {
          throw new Error('NAME_REQUIRED');
        }
        // Otherwise throw the error message
        throw new Error(response.message || 'Invalid OTP');
      }
      
      if (response.success && response.data) {
        const { user, tokens } = response.data;
        
        // Convert backend user to profile
        let profile = convertUserToProfile(user);
        
        // If Google user exists, merge the information (but preserve authMethod from backend)
        if (googleUser) {
          const nameParts = parseName(googleUser.name);
          profile = {
            ...profile,
            email: googleUser.email,
            firstName: nameParts.firstName || profile.firstName,
            lastName: nameParts.lastName || profile.lastName,
            name: googleUser.name || profile.name,
            // Preserve authMethod from backend response
            authMethod: profile.authMethod,
          };
        }
        
        // Store tokens and profile
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        
        set({
          isLoggedIn: true,
          profile,
          tokens,
          googleUser: null, // Clear Google user after verification
        });
        
        // Load cart from API after successful login
        try {
          await useCartStore.getState().loadCart();
        } catch (error) {
          console.error('Failed to load cart after login:', error);
          // Don't fail login if cart loading fails
        }
        
        return true;
      } else {
        console.error('Verify OTP error:', response.message || 'Invalid OTP');
        throw new Error(response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  },

  updateUserName: async (name: string) => {
    try {
      const response = await authAPI.updateUserName(name);
      
      if (response.success && response.data) {
        const { user } = response.data;
        
        // Update profile with new name
        const updatedProfile = convertUserToProfile(user);
        
        // Update AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
        
        set({
          profile: updatedProfile,
        });
        
        return true;
      } else {
        console.error('Update user name error:', response.message || 'Failed to update name');
        throw new Error(response.message || 'Failed to update name');
      }
    } catch (error: any) {
      console.error('Update user name error:', error);
      throw error;
    }
  },

  logout: async () => {
    // Clear AsyncStorage
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_PROFILE,
    ]);
    
    set({
      isLoggedIn: false,
      profile: null,
      tokens: null,
      googleUser: null,
    });
  },

  updateProfile: (updates: Partial<UserProfile>) =>
    set((state) => {
      if (state.profile) {
        const updatedProfile = { ...state.profile, ...updates };
        // Update AsyncStorage
        AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
        return {
          profile: updatedProfile,
        };
      }
      return state;
    }),

  updateUserProfile: async (profileData: {
    name?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    profileImage?: string;
  }) => {
    try {
      const response = await userAPI.updateProfile(profileData);
      
      if (response.success && response.data) {
        const { user } = response.data;
        const updatedProfile = convertUserToProfile(user);
        
        // Update AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
        
        set({
          profile: updatedProfile,
        });
        
        return true;
      } else {
        console.error('Update profile error:', response.message || 'Failed to update profile');
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  fetchProfile: async () => {
    try {
      const response = await userAPI.getProfile();
      
      if (response.success && response.data) {
        const { user } = response.data;
        const profile = convertUserToProfile(user);
        
        // Update AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        
        set({
          profile,
        });
      }
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      throw error;
    }
  },

  initialize: async () => {
    try {
      // Load tokens and profile from AsyncStorage
      const [accessToken, refreshToken, profileJson] = await AsyncStorage.multiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_PROFILE,
      ]);
      
      const token = accessToken[1];
      const refresh = refreshToken[1];
      const profileData = profileJson[1];
      
      if (token && refresh && profileData) {
        const profile = JSON.parse(profileData);
        set({
          isLoggedIn: true,
          profile,
          tokens: {
            accessToken: token,
            refreshToken: refresh,
          },
        });
        
        // Load cart from API if user is logged in
        try {
          await useCartStore.getState().loadCart();
        } catch (error) {
          console.error('Failed to load cart during initialization:', error);
          // Don't fail initialization if cart loading fails
        }
      }
    } catch (error) {
      console.error('Initialize user store error:', error);
      // Clear corrupted data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_PROFILE,
      ]);
    }
  },
}));

