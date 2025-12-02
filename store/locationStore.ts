import { create } from 'zustand';

export interface Address {
  id: string;
  label: string;
  address: string;
  isDefault?: boolean;
}

interface LocationState {
  addresses: Address[];
  selectedAddressId: string | null;
  addAddress: (address: Address) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  getSelectedAddress: () => Address | null;
}

const defaultAddress: Address = {
  id: '1',
  label: 'Home',
  address: '13-22B Nagercoil, Kanyakumari, Tamil Nadu',
  isDefault: true,
};

export const useLocationStore = create<LocationState>((set, get) => ({
  addresses: [defaultAddress],
  selectedAddressId: '1',
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
  selectAddress: (id: string) => set({ selectedAddressId: id }),
  getSelectedAddress: () => {
    const state = get();
    return (
      state.addresses.find((addr) => addr.id === state.selectedAddressId) || null
    );
  },
}));

