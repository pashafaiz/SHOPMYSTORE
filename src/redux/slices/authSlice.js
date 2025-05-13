import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi, signupApi, verifyOtpApi, resendOtpApi } from '../../../apiClient';
import Trace from '../../utils/Trace';

// Async thunks for API calls
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { ok, data } = await loginApi(email, password);
      if (ok && data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        if (data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }
        return { token: data.token, user: data.user };
      } else {
        return rejectWithValue(data?.errors || { message: 'Login failed' });
      }
    } catch (error) {
      Trace('Login error:', error);
      return rejectWithValue({ message: 'Something went wrong' });
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async (formData, { rejectWithValue }) => {
    try {
      const { ok, data } = await signupApi(formData);
      if (ok) {
        return { email: formData.email };
      } else {
        return rejectWithValue(data?.errors || { message: 'Signup failed' });
      }
    } catch (error) {
      Trace('Signup error:', error);
      return rejectWithValue({ message: 'Something went wrong' });
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ otp, email }, { rejectWithValue }) => {
    try {
      const { ok, data } = await verifyOtpApi(otp, email);
      if (ok) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        return { token: data.token, user: data.user };
      } else {
        return rejectWithValue(data?.errors || { message: 'OTP verification failed' });
      }
    } catch (error) {
      Trace('Verify OTP error:', error);
      return rejectWithValue({ message: 'Something went wrong' });
    }
  }
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (email, { rejectWithValue }) => {
    try {
      const { ok, data } = await resendOtpApi(email);
      if (ok) {
        return { email };
      } else {
        return rejectWithValue(data?.errors || { message: 'Failed to resend OTP' });
      }
    } catch (error) {
      Trace('Resend OTP error:', error);
      return rejectWithValue({ message: 'Something went wrong' });
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const user = await AsyncStorage.getItem('user');
      if (token && user) {
        return { token, user: JSON.parse(user) };
      } else {
        return rejectWithValue({ message: 'No auth data found' });
      }
    } catch (error) {
      Trace('Check auth error:', error);
      return rejectWithValue({ message: 'Something went wrong' });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    user: null,
    email: null,
    loading: false,
    errors: {},
    otpTimer: 30,
    isAuthenticated: false,
  },
  reducers: {
    setOtp: (state, action) => {
      state.otp = action.payload;
    },
    setOtpTimer: (state, action) => {
      state.otpTimer = action.payload;
    },
    clearErrors: (state) => {
      state.errors = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.errors = {};
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.errors = action.payload;
      })
      // Signup
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.errors = {};
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.email = action.payload.email;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.errors = action.payload;
      })
      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.errors = {};
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.errors = action.payload;
      })
      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.loading = true;
        state.errors = {};
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpTimer = 30;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.loading = false;
        state.errors = action.payload;
      })
      // Check Auth
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isAuthenticated = false;
      })
      // Handle profile/logout from profileSlice
      .addCase('profile/logout/fulfilled', (state) => {
        state.token = null;
        state.user = null;
        state.email = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setOtp, setOtpTimer, clearErrors } = authSlice.actions;
export default authSlice.reducer;