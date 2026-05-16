import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const apiBaseUrl = process.env.NEXT_PUBLIC_NODE_API_URL ?? "http://localhost:5000";

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'STUDENT';
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  role: 'ADMIN' | 'STUDENT' | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  role: typeof window !== 'undefined' ? localStorage.getItem('role') as any : null,
  isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('token')),
  loading: false,
  error: null,
};

// If token exists in local storage, set it as default auth header
if (initialState.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initialState.token}`;
}

// Global Interceptor to handle 401 Unauthorized (Session Expiry)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      // Optional: window.location.href = '/auth/login'; // Force redirect
    }
    return Promise.reject(error);
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/login`, credentials);
      const { token, admin } = response.data.data; // Note: backend returns 'admin' key representing user
      
      // Save to local storage
      localStorage.setItem('token', token);
      localStorage.setItem('role', admin.ROLE);
      
      // Set default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return {
        token,
        user: {
          id: admin.STUDENT_ID || admin.ADMIN_ID,
          username: admin.USERNAME,
          name: admin.FULL_NAME,
          role: admin.ROLE,
          email: admin.EMAIL,
        }
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  delete axios.defaults.headers.common['Authorization'];
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
