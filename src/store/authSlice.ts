import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { IUser } from '@/types';
import { authApi } from '@/lib/api/auth';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
};

// ============================================
// ASYNC THUNKS
// ============================================

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const { data: res } = await authApi.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: { full_name: string; email: string; password: string; password_confirmation: string }) => {
    const { data: res } = await authApi.register(data);
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { dispatch }) => {
    try {
      const { data: res } = await authApi.getProfile();
      return res.data;
    } catch {
      dispatch(logout());
      return null;
    }
  }
);

// ============================================
// SLICE
// ============================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
    },
    setUser(state, action: PayloadAction<IUser>) {
      const user = action.payload;
      localStorage.setItem('user', JSON.stringify(user));
      state.user = user;
      state.isAdmin = user.role === 'admin';
    },
    loadFromStorage(state) {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as IUser;
          state.user = user;
          state.token = token;
          state.isAuthenticated = true;
          state.isAdmin = user.role === 'admin';
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => { state.isLoading = true; })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.user.role === 'admin';
        state.isLoading = false;
      })
      .addCase(login.rejected, (state) => { state.isLoading = false; })
      // Register
      .addCase(register.pending, (state) => { state.isLoading = true; })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.user.role === 'admin';
        state.isLoading = false;
      })
      .addCase(register.rejected, (state) => { state.isLoading = false; })
      // Fetch profile
      .addCase(fetchProfile.fulfilled, (state, action) => {
        if (action.payload) {
          const user = action.payload;
          localStorage.setItem('user', JSON.stringify(user));
          state.user = user;
          state.isAdmin = user.role === 'admin';
        }
      });
  },
});

export const { logout, setUser, loadFromStorage } = authSlice.actions;
export default authSlice.reducer;
