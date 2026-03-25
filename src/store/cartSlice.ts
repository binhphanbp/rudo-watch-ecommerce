import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { ICartItem } from '@/types';
import { cartApi } from '@/lib/api/services';

interface CartState {
  items: ICartItem[];
  isLoading: boolean;
  totalCount: number;
}

const initialState: CartState = {
  items: [],
  isLoading: false,
  totalCount: 0,
};

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchCart = createAsyncThunk('cart/fetchCart', async () => {
  const { data: res } = await cartApi.getCart();
  return res.data?.items || [];
});

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, variantId, quantity = 1 }: { productId: string; variantId: string; quantity?: number }, { dispatch }) => {
    await cartApi.addToCart({ product_id: productId, variant_id: variantId, quantity });
    dispatch(fetchCart());
  }
);

export const updateQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ itemId, quantity }: { itemId: string; quantity: number }, { dispatch }) => {
    await cartApi.updateCartItem(itemId, quantity);
    dispatch(fetchCart());
  }
);

export const removeItem = createAsyncThunk(
  'cart/removeItem',
  async (itemId: string, { dispatch }) => {
    await cartApi.removeCartItem(itemId);
    dispatch(fetchCart());
  }
);

export const clearCart = createAsyncThunk('cart/clearCart', async () => {
  await cartApi.clearCart();
});

// ============================================
// SLICE
// ============================================

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setItems(state, action: PayloadAction<ICartItem[]>) {
      state.items = action.payload;
      state.totalCount = action.payload.length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.totalCount = action.payload.length;
        state.isLoading = false;
      })
      .addCase(fetchCart.rejected, (state) => { state.isLoading = false; })
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.totalCount = 0;
      });
  },
});

export const { setItems } = cartSlice.actions;
export default cartSlice.reducer;
