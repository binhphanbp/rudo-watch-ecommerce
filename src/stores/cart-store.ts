'use client';

import { create } from 'zustand';
import type { ICartItem } from '@/types';
import { cartApi } from '@/lib/api/services';

interface CartState {
  items: ICartItem[];
  isLoading: boolean;
  totalCount: number;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setItems: (items: ICartItem[]) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  totalCount: 0,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data: res } = await cartApi.getCart();
      const items = res.data?.items || [];
      set({ items, totalCount: items.length, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, variantId, quantity = 1) => {
    try {
      await cartApi.addToCart({ product_id: productId, variant_id: variantId, quantity });
      await get().fetchCart();
    } catch (error) {
      throw error;
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      await cartApi.updateCartItem(itemId, quantity);
      await get().fetchCart();
    } catch (error) {
      throw error;
    }
  },

  removeItem: async (itemId) => {
    try {
      await cartApi.removeCartItem(itemId);
      await get().fetchCart();
    } catch (error) {
      throw error;
    }
  },

  clearCart: async () => {
    try {
      await cartApi.clearCart();
      set({ items: [], totalCount: 0 });
    } catch (error) {
      throw error;
    }
  },

  setItems: (items) => {
    set({ items, totalCount: items.length });
  },
}));
