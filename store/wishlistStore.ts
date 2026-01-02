import { create } from 'zustand';

export interface Product {
  _id: string;
  name: string;
  originalPrice: number;
  sellingPrice: number;
  unit: string;
  size: number;
  category?: { _id: string; name: string };
  images?: string[];
  discount?: number;
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
}

interface WishlistState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  getTotalItems: () => number;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  addItem: (product: Product) =>
    set((state) => {
      const existingItem = state.items.find((item) => item._id === product._id);
      if (existingItem) {
        // Item already in wishlist, don't add again
        return state;
      } else {
        // Add new item to wishlist
        return {
          items: [...state.items, product],
        };
      }
    }),
  removeItem: (productId: string) =>
    set((state) => ({
      items: state.items.filter((item) => item._id !== productId),
    })),
  clearWishlist: () => set({ items: [] }),
  isInWishlist: (productId: string) => {
    const state = get();
    return state.items.some((item) => item._id === productId);
  },
  getTotalItems: () => {
    const state = get();
    return state.items.length;
  },
}));

