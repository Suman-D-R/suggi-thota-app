import { create } from 'zustand';
import { cartAPI } from '../lib/api';
import { useLocationStore } from './locationStore';

export interface ProductVariant {
  sku?: string; // SKU from backend (e.g., "RICE-1KG" or "1_kg")
  size: number;
  unit: string;
  originalPrice?: number;
  sellingPrice?: number;
  discount?: number;
  stock?: number;
  isAvailable?: boolean;
  isOutOfStock?: boolean;
}

export interface Product {
  _id: string;
  name: string;
  originalPrice: number;
  sellingPrice: number;
  unit: string;
  size: number;
  variants?: ProductVariant[]; // New: array of size/unit combinations
  category?: { _id: string; name: string };
  images?: string[];
  discount?: number;
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
  stock?: number;
  isAvailable?: boolean;
  isOutOfStock?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: ProductVariant; // Selected variant for this cart item
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  isSyncing: boolean;
  addItem: (product: Product, variant?: ProductVariant) => Promise<void>;
  removeItem: (productId: string, variant?: ProductVariant) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variant?: ProductVariant) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  syncLocalCartToBackend: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemQuantity: (productId: string, variant?: ProductVariant) => number;
  getVariantKey: (productId: string, variant?: ProductVariant) => string;
}

// Helper function to convert API cart item to CartItem
// Backend now returns items with variants array, so we need to create separate CartItems for each variant
const convertApiCartItemToCartItems = (apiItem: any): CartItem[] => {
  const product = apiItem.product;
  const baseItem = {
    _id: product._id,
    name: product.name,
    originalPrice: product.originalPrice || 0,
    unit: product.unit || '',
    size: product.size || 0,
    variants: product.variants || [],
    category: product.category,
    images: product.images || [],
    discount: product.discount,
    description: product.description,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
  };

  // Convert each variant in the cart item to a separate CartItem
  return apiItem.variants.map((variant: any) => ({
    ...baseItem,
    sellingPrice: variant.price || product.sellingPrice || 0,
    size: variant.size,
    unit: variant.unit,
    quantity: variant.quantity,
    selectedVariant: {
      size: variant.size,
      unit: variant.unit,
      sellingPrice: variant.price,
    },
  }));
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  isSyncing: false,
  
  getVariantKey: (productId: string, variant?: ProductVariant) => {
    if (!variant) return productId;
    return `${productId}_${variant.size}_${variant.unit}`;
  },

  // Sync local cart items to backend (called after login)
  syncLocalCartToBackend: async () => {
    const isLoggedIn = await checkIfLoggedIn();
    if (!isLoggedIn) {
      // If not logged in, nothing to sync
      return;
    }

    const selectedStore = useLocationStore.getState().selectedStore;
    if (!selectedStore?._id) {
      // No store selected yet - cannot sync
      return;
    }

    const localItems = get().items;
    if (localItems.length === 0) {
      // No local items to sync
      return;
    }

    set({ isSyncing: true });
    try {
      // First, load the backend cart to see what's already there
      let backendCartItems: any[] = [];
      try {
        const response = await cartAPI.getCart(selectedStore._id);
        if (response.success && response.data?.cart?.items) {
          backendCartItems = response.data.cart.items;
        }
      } catch (error) {
        console.warn('Could not load backend cart, will add all items:', error);
      }

      // Sync each local cart item to backend
      for (const item of localItems) {
        if (!item.selectedVariant) {
          console.warn('Skipping item without variant:', item._id);
          continue;
        }

        const variant = item.selectedVariant;
        const size = Number(variant.size);
        const unit = String(variant.unit);
        const price = variant.sellingPrice ?? item.sellingPrice ?? 0;

        if (isNaN(size) || size <= 0) {
          console.warn('Invalid variant size for item:', item._id);
          continue;
        }

        try {
          // Use SKU from variant if available, otherwise construct from size and unit
          const variantSku = item.selectedVariant?.sku || `${size}_${unit}`;
          
          // Check if item already exists in backend cart
          const existingBackendItem = backendCartItems.find((backendItem: any) => {
            const backendProductId = backendItem.productId?._id || backendItem.productId;
            const backendVariantSku = backendItem.variantSku || backendItem.variant?.sku;
            return backendProductId === item._id && backendVariantSku === variantSku;
          });

          if (existingBackendItem) {
            // Item exists - use updateItem to set exact quantity
            const selectedStore = useLocationStore.getState().selectedStore;
            if (!selectedStore?._id) {
              throw new Error('Store not selected');
            }
            // Use SKU from variant if available
            const sku = item.selectedVariant?.sku;
            await cartAPI.updateItem(item._id, size, unit, item.quantity, selectedStore._id, sku);
          } else {
            // Item doesn't exist - use addItem with exact quantity
            // Note: addItem increments, so we add the full quantity
            const selectedStore = useLocationStore.getState().selectedStore;
            if (!selectedStore?._id) {
              throw new Error('Store not selected');
            }
            // Use SKU from variant if available
            const sku = item.selectedVariant?.sku;
            await cartAPI.addItem(item._id, size, unit, item.quantity, price, selectedStore._id, sku);
          }
        } catch (error) {
          console.error(`Failed to sync item ${item._id} to backend:`, error);
          // Continue with other items even if one fails
        }
      }
      set({ isSyncing: false });
    } catch (error) {
      console.error('Failed to sync local cart to backend:', error);
      set({ isSyncing: false });
    }
  },

  // Load cart from API
  loadCart: async (preserveLocalIfEmpty: boolean = false) => {
    const isLoggedIn = await checkIfLoggedIn();
    if (!isLoggedIn) {
      // If not logged in, keep local cart
      return;
    }

    const selectedStore = useLocationStore.getState().selectedStore;
    if (!selectedStore?._id) {
      // No store selected yet - this is a valid state, silently return
      // Cart will be loaded once a store is selected
      return;
    }

    // Preserve local items if preserveLocalIfEmpty is true
    const localItemsBeforeLoad = preserveLocalIfEmpty ? get().items : [];

    set({ isLoading: true });
    try {
      const response = await cartAPI.getCart(selectedStore._id);
      if (response.success && response.data?.cart) {
        // Convert each cart item (which may have multiple variants) to separate CartItems
        const cartItems = response.data.cart.items.flatMap(convertApiCartItemToCartItems);
        set({ items: cartItems, isLoading: false });
        
        // If backend cart is empty but we had local items and preserveLocalIfEmpty is true, keep local items
        if (preserveLocalIfEmpty && cartItems.length === 0 && localItemsBeforeLoad.length > 0) {
          console.warn('Backend cart is empty, preserving local cart items');
          set({ items: localItemsBeforeLoad, isLoading: false });
        }
      } else {
        // If no cart found and we should preserve local, keep local items
        if (preserveLocalIfEmpty && localItemsBeforeLoad.length > 0) {
          console.warn('No cart found on backend, preserving local cart items');
          set({ items: localItemsBeforeLoad, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      }
    } catch (error) {
      console.error('Failed to load cart from API:', error);
      // If error and we should preserve local, keep local items
      if (preserveLocalIfEmpty && localItemsBeforeLoad.length > 0) {
        console.warn('Failed to load cart, preserving local cart items');
        set({ items: localItemsBeforeLoad, isLoading: false });
      } else {
        set({ isLoading: false });
        // Keep local cart if API fails
      }
    }
  },

  addItem: async (product: Product, variant?: ProductVariant) => {
    // Determine the variant to use
    let selectedVariant: ProductVariant | undefined = variant;
    
    // If no variant provided, try to auto-select:
    // 1. If product has only one variant, use it
    // 2. Otherwise, use product's default size/unit (backward compatibility)
    if (!selectedVariant) {
      if (product.variants && product.variants.length === 1) {
        selectedVariant = product.variants[0];
      } else if (product.variants && product.variants.length > 1) {
        // Multiple variants - use the first one as default, but ideally should be selected
        selectedVariant = product.variants[0];
      } else if (product.size !== undefined && product.unit) {
        // Use product's default size/unit as a variant
        selectedVariant = {
          size: product.size,
          unit: product.unit,
          sellingPrice: product.sellingPrice,
          originalPrice: product.originalPrice,
          discount: product.discount,
        };
      } else {
        throw new Error('Variant selection required for this product');
      }
    }
    
    // Validate selected variant has required fields
    if (!selectedVariant || selectedVariant.size === undefined || !selectedVariant.unit) {
      throw new Error('Selected variant is missing required size or unit information');
    }

    // Update local state immediately for better UX
    const variantKey = get().getVariantKey(product._id, selectedVariant);
    const existingItem = get().items.find(
      (item) => get().getVariantKey(item._id, item.selectedVariant) === variantKey
    );

    let newItems: CartItem[];
    if (existingItem) {
      // If item exists, increase quantity
      newItems = get().items.map((item) =>
        get().getVariantKey(item._id, item.selectedVariant) === variantKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      // If item doesn't exist, add it with quantity 1
      const itemToAdd: CartItem = {
        ...product,
        quantity: 1,
        selectedVariant: selectedVariant,
      };
      // Update size/unit and pricing from variant
      itemToAdd.size = selectedVariant.size;
      itemToAdd.unit = selectedVariant.unit;
      if (selectedVariant.sellingPrice !== undefined) {
        itemToAdd.sellingPrice = selectedVariant.sellingPrice;
      }
      if (selectedVariant.originalPrice !== undefined) {
        itemToAdd.originalPrice = selectedVariant.originalPrice;
      }
      if (selectedVariant.discount !== undefined) {
        itemToAdd.discount = selectedVariant.discount;
      }
      newItems = [...get().items, itemToAdd];
    }

    set({ items: newItems });

    // Sync to API if logged in
    const isLoggedIn = await checkIfLoggedIn();
    if (isLoggedIn) {
      set({ isSyncing: true });
      try {
        // Validate variant has required fields
        if (!selectedVariant || selectedVariant.size === undefined || !selectedVariant.unit) {
          throw new Error('Invalid variant: size and unit are required');
        }

        const quantity = existingItem ? existingItem.quantity + 1 : 1;
        const price = selectedVariant.sellingPrice ?? product.sellingPrice ?? 0;
        
        // Ensure we have valid numeric values
        const size = Number(selectedVariant.size);
        const unit = String(selectedVariant.unit);
        
        if (isNaN(size) || size <= 0) {
          throw new Error(`Invalid variant size: ${selectedVariant.size}`);
        }
        
        // Use SKU from variant if available, otherwise it will be constructed in API
        const sku = selectedVariant.sku;
        
        const selectedStore = useLocationStore.getState().selectedStore;
        if (!selectedStore?._id) {
          throw new Error('Store not selected');
        }
        await cartAPI.addItem(product._id, size, unit, quantity, price, selectedStore._id, sku);
        set({ isSyncing: false });
      } catch (error) {
        console.error('Failed to sync cart to API:', error);
        set({ isSyncing: false });
        // Revert on error - reload from API
        await get().loadCart();
        throw error; // Re-throw to let caller know it failed
      }
    }
  },

  removeItem: async (productId: string, variant?: ProductVariant) => {
    // Get variant BEFORE removing item from state (important for last item removal)
    const variantKey = get().getVariantKey(productId, variant);
    
    // Try to get variant from existing item if not provided
    let variantToUse: ProductVariant | undefined = variant;
    if (!variantToUse) {
      const existingItem = get().items.find(
        (item) => get().getVariantKey(item._id, item.selectedVariant) === variantKey
      );
      if (existingItem?.selectedVariant) {
        variantToUse = existingItem.selectedVariant;
      }
    }
    
    // Validate variant has required fields before proceeding
    if (!variantToUse || variantToUse.size === undefined || !variantToUse.unit) {
      console.error('Cannot remove item: variant information is missing');
      // Still remove from local state even if we can't sync
    }

    // Update local state immediately
    const newItems = get().items.filter(
      (item) => get().getVariantKey(item._id, item.selectedVariant) !== variantKey
    );
    set({ items: newItems });

    // Sync to API if logged in and we have variant info
    const isLoggedIn = await checkIfLoggedIn();
    if (isLoggedIn && variantToUse && variantToUse.size !== undefined && variantToUse.unit) {
      set({ isSyncing: true });
      try {
        const size = Number(variantToUse.size);
        const unit = String(variantToUse.unit);
        const selectedStore = useLocationStore.getState().selectedStore;
        
        if (!selectedStore?._id) {
          throw new Error('Store not selected');
        }

        // Use SKU from variant if available
        const sku = variantToUse.sku;
        
        await cartAPI.removeItem(productId, size, unit, selectedStore._id, sku);
        set({ isSyncing: false });
      } catch (error) {
        console.error('Failed to sync cart to API:', error);
        set({ isSyncing: false });
        // Revert on error - reload from API
        await get().loadCart();
      }
    }
  },

  updateQuantity: async (productId: string, quantity: number, variant?: ProductVariant) => {
    // Update local state immediately
    const variantKey = get().getVariantKey(productId, variant);
    let newItems: CartItem[];
    
    if (quantity <= 0) {
      // If quantity is 0 or less, remove the item
      newItems = get().items.filter(
        (item) => get().getVariantKey(item._id, item.selectedVariant) !== variantKey
      );
    } else {
      newItems = get().items.map((item) =>
        get().getVariantKey(item._id, item.selectedVariant) === variantKey
          ? { ...item, quantity }
          : item
      );
    }

    set({ items: newItems });

    // Sync to API if logged in
    const isLoggedIn = await checkIfLoggedIn();
    if (isLoggedIn) {
      set({ isSyncing: true });
      try {
        // Get variant - required for both removal and update
        let variantToUse: ProductVariant | undefined = variant;
        
        // If variant not provided, get it from existing item
        if (!variantToUse) {
          const existingItem = get().items.find(
            (item) => get().getVariantKey(item._id, item.selectedVariant) === variantKey
          );
          if (existingItem?.selectedVariant) {
            variantToUse = existingItem.selectedVariant;
          } else {
            throw new Error('Variant information required');
          }
        }
        
        // Validate variant has required fields
        if (!variantToUse || variantToUse.size === undefined || !variantToUse.unit) {
          throw new Error('Invalid variant: size and unit are required');
        }
        
        const size = Number(variantToUse.size);
        const unit = String(variantToUse.unit);
        
        if (isNaN(size) || size <= 0) {
          throw new Error(`Invalid variant size: ${variantToUse.size}`);
        }
        
        // Use SKU from variant if available
        const sku = variantToUse.sku;
        
        const selectedStore = useLocationStore.getState().selectedStore;
        if (!selectedStore?._id) {
          throw new Error('Store not selected');
        }
        
        if (quantity <= 0) {
          // Remove variant if quantity is 0
          await cartAPI.removeItem(productId, size, unit, selectedStore._id, sku);
        } else {
          // Update variant quantity
          await cartAPI.updateItem(productId, size, unit, quantity, selectedStore._id, sku);
        }
        set({ isSyncing: false });
      } catch (error) {
        console.error('Failed to sync cart to API:', error);
        set({ isSyncing: false });
        // Revert on error - reload from API
        await get().loadCart();
      }
    }
  },

  clearCart: async () => {
    // Update local state immediately
    set({ items: [] });

    // Sync to API if logged in
    const isLoggedIn = await checkIfLoggedIn();
    if (isLoggedIn) {
      const selectedStore = useLocationStore.getState().selectedStore;
      if (!selectedStore?._id) {
        // No store selected - cannot clear cart on server, but local cart is already cleared
        return;
      }

      set({ isSyncing: true });
      try {
        await cartAPI.clearCart(selectedStore._id);
        set({ isSyncing: false });
      } catch (error) {
        console.error('Failed to sync cart to API:', error);
        set({ isSyncing: false });
        // Revert on error - reload from API
        await get().loadCart();
      }
    }
  },

  getTotalItems: () => {
    const state = get();
    return state.items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    const state = get();
    return state.items.reduce((total, item) => {
      const price = item.sellingPrice || 0;
      return total + price * item.quantity;
    }, 0);
  },

  getItemQuantity: (productId: string, variant?: ProductVariant) => {
    const state = get();
    const variantKey = get().getVariantKey(productId, variant);
    const item = state.items.find(
      (item) => get().getVariantKey(item._id, item.selectedVariant) === variantKey
    );
    return item ? item.quantity : 0;
  },
}));

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
