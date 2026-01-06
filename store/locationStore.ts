import { create } from 'zustand';
import * as Location from 'expo-location';
import { addressAPI } from '../lib/api';

export interface Address {
  id: string;
  label: string;
  address: string;
  isDefault?: boolean;
  // Additional fields from backend
  type?: 'home' | 'work' | 'other';
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
}

export interface Store {
  _id: string;
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  serviceRadiusKm?: number;
  isActive?: boolean;
}

interface LocationState {
  addresses: Address[];
  selectedAddressId: string | null;
  selectedStore: Store | null;
  isLoading: boolean;
  isSyncing: boolean;
  addAddress: (address: Address) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  getSelectedAddress: () => Address | null;
  setSelectedStore: (store: Store | null) => void;
  // Backend sync methods
  loadAddresses: () => Promise<void>;
  createAddress: (addressData: {
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
  }) => Promise<Address>;
  updateAddressOnServer: (id: string, addressData: Partial<Address>) => Promise<void>;
  deleteAddressOnServer: (id: string) => Promise<void>;
  setDefaultAddressOnServer: (id: string) => Promise<void>;
  initializeLocation: () => Promise<void>;
}

// Helper function to check if user is logged in
async function checkIfLoggedIn(): Promise<boolean> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  } catch {
    return false;
  }
}

// Helper to convert backend address to store format
const convertBackendAddress = (backendAddr: any): Address => ({
  id: backendAddr.id || backendAddr._id,
  label: backendAddr.label || backendAddr.type || 'Home',
  address: backendAddr.address || `${backendAddr.street}, ${backendAddr.city}, ${backendAddr.state} ${backendAddr.pincode}`,
  isDefault: backendAddr.isDefault || false,
  type: backendAddr.type,
  street: backendAddr.street,
  apartment: backendAddr.apartment,
  landmark: backendAddr.landmark,
  city: backendAddr.city,
  state: backendAddr.state,
  pincode: backendAddr.pincode,
  country: backendAddr.country,
  contactName: backendAddr.contactName,
  contactPhone: backendAddr.contactPhone,
  coordinates: backendAddr.coordinates,
  deliveryInstructions: backendAddr.deliveryInstructions,
});

export const useLocationStore = create<LocationState>((set, get) => ({
  addresses: [],
  selectedAddressId: null,
  selectedStore: null,
  isLoading: false,
  isSyncing: false,
  
  addAddress: (address: Address) =>
    set((state) => ({
      addresses: [...state.addresses, address],
      selectedAddressId: address.isDefault ? address.id : state.selectedAddressId,
    })),
    
  updateAddress: (id: string, updates: Partial<Address>) =>
    set((state) => ({
      addresses: state.addresses.map((addr) =>
        addr.id === id ? { ...addr, ...updates } : addr
      ),
      selectedAddressId:
        updates.isDefault === true ? id : state.selectedAddressId,
    })),
    
  removeAddress: (id: string) =>
    set((state) => {
      const filtered = state.addresses.filter((addr) => addr.id !== id);
      const newSelectedId =
        state.selectedAddressId === id
          ? filtered.length > 0
            ? filtered[0].id
            : null
          : state.selectedAddressId;
      return {
        addresses: filtered,
        selectedAddressId: newSelectedId,
      };
    }),
    
  selectAddress: (id: string) => {
    const state = get();
    const address = state.addresses.find((addr) => addr.id === id);
    if (!address) return;

    // Update all addresses: set selected as default, unset others
    const updatedAddresses = state.addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }));

    set({
      addresses: updatedAddresses,
      selectedAddressId: id,
    });

    // If it's a backend address, also update on server
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (isValidObjectId) {
      state.setDefaultAddressOnServer(id).catch(console.error);
    }
  },
  
  getSelectedAddress: () => {
    const state = get();
    return (
      state.addresses.find((addr) => addr.id === state.selectedAddressId) || null
    );
  },

  setSelectedStore: (store: Store | null) => {
    set({ selectedStore: store });
  },

  // Load addresses from backend
  loadAddresses: async () => {
    const isLoggedIn = await checkIfLoggedIn();
    if (!isLoggedIn) {
      // Keep local addresses if not logged in
      return;
    }

    set({ isLoading: true });
    try {
      const response = await addressAPI.getAddresses();
      if (response.success && response.data?.addresses) {
        const addresses = response.data.addresses.map(convertBackendAddress);
        const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
        
        set({
          addresses: addresses.length > 0 ? addresses : [],
          selectedAddressId: defaultAddress?.id || null,
          isLoading: false,
        });
      } else {
        // No addresses found - explicitly set empty array
        set({ 
          addresses: [],
          selectedAddressId: null,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Failed to load addresses from API:', error);
      set({ isLoading: false });
      // Keep local addresses if API fails
    }
  },

  // Create address on server
  createAddress: async (addressData) => {
    set({ isSyncing: true });
    try {
      const response = await addressAPI.createAddress(addressData);
      if (response.success && response.data?.address) {
        const newAddress = convertBackendAddress(response.data.address);
        
        // Update local state
        set((state) => ({
          addresses: [...state.addresses, newAddress],
          selectedAddressId: newAddress.isDefault ? newAddress.id : state.selectedAddressId,
          isSyncing: false,
        }));
        
        return newAddress;
      } else {
        throw new Error(response.message || 'Failed to create address');
      }
    } catch (error) {
      console.error('Failed to create address on server:', error);
      set({ isSyncing: false });
      throw error;
    }
  },

  // Update address on server
  updateAddressOnServer: async (id: string, addressData: Partial<Address>) => {
    // Check if it's a valid ObjectId (backend address)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isValidObjectId) {
      // Local address - just update locally
      get().updateAddress(id, addressData);
      return;
    }

    set({ isSyncing: true });
    try {
      // Convert store address format to backend format
      const backendData: any = {};
      if (addressData.street) backendData.street = addressData.street;
      if (addressData.apartment !== undefined) backendData.apartment = addressData.apartment;
      if (addressData.landmark !== undefined) backendData.landmark = addressData.landmark;
      if (addressData.city) backendData.city = addressData.city;
      if (addressData.state) backendData.state = addressData.state;
      if (addressData.pincode) backendData.pincode = addressData.pincode;
      if (addressData.country) backendData.country = addressData.country;
      if (addressData.contactName) backendData.contactName = addressData.contactName;
      if (addressData.contactPhone) backendData.contactPhone = addressData.contactPhone;
      if (addressData.coordinates) backendData.coordinates = addressData.coordinates;
      if (addressData.deliveryInstructions !== undefined) backendData.deliveryInstructions = addressData.deliveryInstructions;
      if (addressData.type) backendData.type = addressData.type;
      if (addressData.label) backendData.label = addressData.label;
      if (addressData.isDefault !== undefined) backendData.isDefault = addressData.isDefault;

      const response = await addressAPI.updateAddress(id, backendData);
      if (response.success && response.data?.address) {
        const updatedAddress = convertBackendAddress(response.data.address);
        
        // Update local state
        get().updateAddress(id, updatedAddress);
        set({ isSyncing: false });
      } else {
        throw new Error(response.message || 'Failed to update address');
      }
    } catch (error) {
      console.error('Failed to update address on server:', error);
      set({ isSyncing: false });
      throw error;
    }
  },

  // Delete address on server
  deleteAddressOnServer: async (id: string) => {
    // Check if it's a valid ObjectId (backend address)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isValidObjectId) {
      // Local address - just remove locally
      get().removeAddress(id);
      return;
    }

    set({ isSyncing: true });
    try {
      await addressAPI.deleteAddress(id);
      
      // Update local state
      get().removeAddress(id);
      set({ isSyncing: false });
    } catch (error) {
      console.error('Failed to delete address on server:', error);
      set({ isSyncing: false });
      throw error;
    }
  },

  // Set default address on server
  setDefaultAddressOnServer: async (id: string) => {
    // Check if it's a valid ObjectId (backend address)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isValidObjectId) {
      // Local address - just update locally
      get().updateAddress(id, { isDefault: true });
      // Unset other defaults
      const state = get();
      state.addresses.forEach((addr) => {
        if (addr.id !== id && addr.isDefault) {
          state.updateAddress(addr.id, { isDefault: false });
        }
      });
      return;
    }

    set({ isSyncing: true });
    try {
      const response = await addressAPI.setDefaultAddress(id);
      if (response.success && response.data?.address) {
        const updatedAddress = convertBackendAddress(response.data.address);
        
        // Update local state - set this as default and unset others
        const state = get();
        state.addresses.forEach((addr) => {
          if (addr.id === id) {
            state.updateAddress(addr.id, { isDefault: true });
          } else if (addr.isDefault) {
            state.updateAddress(addr.id, { isDefault: false });
          }
        });
        
        set({ selectedAddressId: id, isSyncing: false });
      } else {
        throw new Error(response.message || 'Failed to set default address');
      }
    } catch (error) {
      console.error('Failed to set default address on server:', error);
      set({ isSyncing: false });
      throw error;
    }
  },

  // Initialize location from current GPS position
  initializeLocation: async () => {
    const state = get();
    
    // If addresses already exist and one is selected, don't initialize
    if (state.addresses.length > 0 && state.selectedAddressId) {
      // If there's a selected address, make sure it's default
      const selectedAddr = state.addresses.find(addr => addr.id === state.selectedAddressId);
      if (selectedAddr && !selectedAddr.isDefault) {
        state.selectAddress(state.selectedAddressId);
      }
      return;
    }

    // If addresses exist but none selected, select the default or first one
    if (state.addresses.length > 0 && !state.selectedAddressId) {
      const defaultAddr = state.addresses.find(addr => addr.isDefault) || state.addresses[0];
      if (defaultAddr) {
        state.selectAddress(defaultAddr.id);
      }
      return;
    }

    // Try to load addresses from backend first (only if user is logged in)
    await state.loadAddresses();
    
    // If addresses were loaded, use them
    const updatedState = get();
    if (updatedState.addresses.length > 0) {
      const defaultAddr = updatedState.addresses.find(addr => addr.isDefault) || updatedState.addresses[0];
      if (defaultAddr) {
        set({ selectedAddressId: defaultAddr.id });
      }
      return;
    }

    // No addresses exist, get current location
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocode.length > 0) {
        const addressData = geocode[0];
        const addressParts = [
          addressData.street,
          addressData.streetNumber,
          addressData.district,
          addressData.city,
          addressData.region,
          addressData.country,
        ].filter(Boolean);

        const addressString = addressParts.join(', ') || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        // Create a local address from current location
        const currentLocationAddress: Address = {
          id: `current_${Date.now()}`,
          label: 'Current Location',
          address: addressString,
          isDefault: true,
          coordinates: {
            latitude,
            longitude,
          },
          // Try to extract additional fields if available
          street: addressData.street || addressData.streetNumber || '',
          city: addressData.city || addressData.subregion || '',
          state: addressData.region || '',
          pincode: addressData.postalCode || '',
          country: addressData.country || 'India',
        };

        set({
          addresses: [currentLocationAddress],
          selectedAddressId: currentLocationAddress.id,
        });
      } else {
        // If geocoding fails, still create an address with coordinates
        const currentLocationAddress: Address = {
          id: `current_${Date.now()}`,
          label: 'Current Location',
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          isDefault: true,
          coordinates: {
            latitude,
            longitude,
          },
          country: 'India',
        };

        set({
          addresses: [currentLocationAddress],
          selectedAddressId: currentLocationAddress.id,
        });
      }
    } catch (error) {
      console.error('Failed to initialize location:', error);
      // Don't throw, just log - app can continue without location
    }
  },
}));

