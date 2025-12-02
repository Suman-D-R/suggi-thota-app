import { create } from 'zustand';

export interface Product {
  _id: string;
  name: string;
  price: number;
  unit: string;
  category?: { _id: string; name: string };
  images?: string[];
  discount?: number;
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product: Product) =>
    set((state) => {
      const existingItem = state.items.find((item) => item._id === product._id);
      if (existingItem) {
        // If item exists, increase quantity
        return {
          items: state.items.map((item) =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      } else {
        // If item doesn't exist, add it with quantity 1
        return {
          items: [...state.items, { ...product, quantity: 1 }],
        };
      }
    }),
  removeItem: (productId: string) =>
    set((state) => ({
      items: state.items.filter((item) => item._id !== productId),
    })),
  updateQuantity: (productId: string, quantity: number) =>
    set((state) => {
      if (quantity <= 0) {
        // If quantity is 0 or less, remove the item
        return {
          items: state.items.filter((item) => item._id !== productId),
        };
      }
      return {
        items: state.items.map((item) =>
          item._id === productId ? { ...item, quantity } : item
        ),
      };
    }),
  clearCart: () => set({ items: [] }),
  getTotalItems: () => {
    const state = get();
    return state.items.reduce((total, item) => total + item.quantity, 0);
  },
  getTotalPrice: () => {
    const state = get();
    return state.items.reduce((total, item) => {
      const discountedPrice = item.discount
        ? item.price - (item.price * item.discount) / 100
        : item.price;
      return total + discountedPrice * item.quantity;
    }, 0);
  },
  getItemQuantity: (productId: string) => {
    const state = get();
    const item = state.items.find((item) => item._id === productId);
    return item ? item.quantity : 0;
  },
}));

