import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Trace from '../../utils/Trace';
import {
  BASE_URL,
  USER_PROFILE_ENDPOINT,
  PRODUCTS_ENDPOINT,
  REELS_ENDPOINT,
  HTTP_METHODS,
  DEFAULT_IMAGE_URL,
  FALLBACK_IMAGE_URL,
  USER_TOKEN_KEY,
  FETCH_USER_PROFILE_ERROR,
  USER_NOT_FOUND_ERROR,
  FETCH_PRODUCTS_ERROR,
  FETCH_REELS_ERROR,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  API_TIMEOUT_SHORT,
} from '../../constants/GlobalConstants';

// Utility function for fetch with timeout
const fetchWithTimeout = async (url, options, timeout) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );
  return Promise.race([fetch(url, options), timeoutPromise]);
};

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  'userProfile/fetchUserProfile',
  async ({ userId }, { rejectWithValue }) => {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Missing or invalid user ID');
      }

      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      Trace('Fetching user profile with token:', { userId, hasToken: !!token });
      const response = await fetchWithTimeout(
        `${BASE_URL}${USER_PROFILE_ENDPOINT}/${userId}`,
        {
          method: HTTP_METHODS.GET,
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );

      let data;
      try {
        const text = await response.text();
        Trace('User profile raw response:', { status: response.status, text });
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        Trace('User profile response parse error:', { error: error.message, text });
        throw new Error('Invalid response format: Expected JSON');
      }

      Trace('User profile API response:', { ok: response.ok, data });

      if (!response.ok) {
        throw new Error(data.msg || USER_NOT_FOUND_ERROR);
      }

      if (!data.user) {
        throw new Error(USER_NOT_FOUND_ERROR);
      }

      return {
        fullName: data.user.fullName || 'Unknown User',
        userName: data.user.userName || 'unknown',
        profileImage: data.user.avatar || null,
        followers: data.user.followers || 0,
        following: data.user.following || 0,
      };
    } catch (error) {
      Trace('Fetch user profile error:', { error: error.message });
      return rejectWithValue(error.message || FETCH_USER_PROFILE_ERROR);
    }
  }
);

// Async thunk for fetching user products
export const fetchUserProducts = createAsyncThunk(
  'userProfile/fetchUserProducts',
  async ({ userId }, { rejectWithValue }) => {
    try {
      Trace('Fetching user products:', { userId });
      const response = await fetchWithTimeout(
        `${BASE_URL}${PRODUCTS_ENDPOINT}`,
        {
          method: HTTP_METHODS.GET,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );

      let data;
      try {
        const text = await response.text();
        Trace('Products raw response:', { status: response.status, text });
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        Trace('Products response parse error:', { error: error.message, text });
        throw new Error('Invalid response format: Expected JSON');
      }

      Trace('Products API response:', { ok: response.ok, data });

      if (!response.ok) {
        throw new Error(data.msg || FETCH_PRODUCTS_ERROR);
      }

      const userProducts = data.products
      .filter((product) => {
        const createdById = typeof product.createdBy === 'object' && product.createdBy?._id
          ? product.createdBy._id
          : product.createdBy;
        return createdById === userId;
      }).map((product) => {
        let imageUrl = FALLBACK_IMAGE_URL;
        if (product.media) {
          if (typeof product.media === 'string') {
            imageUrl = product.media;
          } else if (Array.isArray(product.media) && product.media.length > 0) {
            const firstMedia = product.media[0];
            imageUrl = typeof firstMedia === 'string' ? firstMedia : firstMedia?.url || firstMedia?.path || FALLBACK_IMAGE_URL;
          }
        }
        Trace('Product image processing:', { productId: product._id, media: product.media, imageUrl });
        return {
          ...product,
          id: product._id || product.id,
          media: imageUrl,
        };
      });

      Trace('Filtered user products:', { count: userProducts.length, userProducts });
      return userProducts;
    } catch (error) {
      Trace('Fetch user products error:', { error: error.message });
      return rejectWithValue(error.message || FETCH_PRODUCTS_ERROR);
    }
  }
);

// Async thunk for fetching user reels
export const fetchUserReels = createAsyncThunk(
  'userProfile/fetchUserReels',
  async ({ userId }, { rejectWithValue }) => {
    try {
      Trace('Fetching user reels:', { userId });
      const response = await fetchWithTimeout(
        `${BASE_URL}${REELS_ENDPOINT}`,
        {
          method: HTTP_METHODS.GET,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );

      let data;
      try {
        const text = await response.text();
        Trace('Reels raw response:', { status: response.status, text });
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        Trace('Reels response parse error:', { error: error.message, text });
        throw new Error('Invalid response format: Expected JSON');
      }

      Trace('Reels API response:', { ok: response.ok, data });

      if (!response.ok) {
        throw new Error(data.msg || FETCH_REELS_ERROR);
      }

      const userReels = (data.reels || []).filter(
        (reel) => reel.user?._id === userId
      );

      Trace('Filtered user reels:', { count: userReels.length, userReels });
      return userReels;
    } catch (error) {
      Trace('Fetch user reels error:', { error: error.message });
      return rejectWithValue(error.message || FETCH_REELS_ERROR);
    }
  }
);

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState: {
    user: null,
    products: [],
    reels: [],
    activeTab: 'products',
    loading: true,
    errorMessage: null,
    refreshing: false,
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      Trace(`Switched to ${action.payload} tab`);
    },
    clearError: (state) => {
      state.errorMessage = null;
    },
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.errorMessage = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        Trace('User profile fetched:', action.payload);
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload;
        state.user = {
          fullName: 'Unknown User',
          userName: 'unknown',
          profileImage: null,
          followers: 0,
          following: 0,
        };
        Trace('User profile fetch failed:', { error: action.payload });
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Fetch User Products
      .addCase(fetchUserProducts.pending, (state) => {
        state.loading = true;
        state.errorMessage = null;
      })
      .addCase(fetchUserProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        Trace('User products fetched:', { count: action.payload.length });
      })
      .addCase(fetchUserProducts.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload;
        state.products = [];
        Trace('User products fetch failed:', { error: action.payload });
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Fetch User Reels
      .addCase(fetchUserReels.pending, (state) => {
        state.loading = true;
        state.errorMessage = null;
      })
      .addCase(fetchUserReels.fulfilled, (state, action) => {
        state.loading = false;
        state.reels = action.payload;
        Trace('User reels fetched:', { count: action.payload.length });
      })
      .addCase(fetchUserReels.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload;
        state.reels = [];
        Trace('User reels fetch failed:', { error: action.payload });
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      });
  },
});

// Memoized selector
const selectUserProfileState = (state) => state.userProfile;

export const selectUserProfile = createSelector(
  [selectUserProfileState],
  (userProfile) => ({
    user: userProfile?.user || {
      fullName: 'Unknown User',
      userName: 'unknown',
      profileImage: null,
      followers: 0,
      following: 0,
    },
    products: userProfile?.products || [],
    reels: userProfile?.reels || [],
    activeTab: userProfile?.activeTab || 'products',
    loading: userProfile?.loading ?? true,
    errorMessage: userProfile?.errorMessage || null,
    refreshing: userProfile?.refreshing ?? false,
  })
);

export const { setActiveTab, clearError, setRefreshing } = userProfileSlice.actions;

export default userProfileSlice.reducer;