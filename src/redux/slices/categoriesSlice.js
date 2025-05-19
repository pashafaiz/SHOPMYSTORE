import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import Trace from '../../utils/Trace';
import {
  BASE_URL,
  PRODUCTS_ENDPOINT,
  PRODUCTS_BY_CATEGORY_ENDPOINT,
  HTTP_METHODS,
  DEFAULT_IMAGE_URL,
  FETCH_PRODUCTS_ERROR,
  NETWORK_ERROR,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
} from '../../constants/GlobalConstants';

// Async thunk for fetching all products
export const fetchAllProducts = createAsyncThunk(
  'categories/fetchAllProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}${PRODUCTS_ENDPOINT}`, {
        method: HTTP_METHODS.GET,
      });
      const data = await response.json();
      if (response.ok) {
        const normalizedProducts = data.products.map((product) => ({
          ...product,
          id: product._id || product.id,
          media: (() => {
            if (Array.isArray(product.media) && product.media.length > 0) {
              const firstMedia = product.media[0];
              if (typeof firstMedia === 'string') return [{ url: firstMedia }];
              if (firstMedia?.url) return [{ url: firstMedia.url }];
              if (firstMedia?.image) return [{ url: firstMedia.image }];
            }
            return [{ url: DEFAULT_IMAGE_URL }];
          })(),
          price: product.price || 0,
          name: product.name || 'Unnamed Product',
          stock: product.stock || 0, // Added stock
          brand: product.brand || 'Unknown Brand', // Added brand
          offer: product.offer || '', // Added offer
        }));
        return normalizedProducts;
      } else {
        return rejectWithValue(data.msg || FETCH_PRODUCTS_ERROR);
      }
    } catch (error) {
      Trace('Fetch all products error:', error);
      return rejectWithValue(NETWORK_ERROR);
    }
  }
);

// Async thunk for fetching products by category
export const fetchProductsByCategory = createAsyncThunk(
  'categories/fetchProductsByCategory',
  async (category, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}${PRODUCTS_BY_CATEGORY_ENDPOINT}/${category}`, {
        method: HTTP_METHODS.GET,
      });
      const data = await response.json();
      if (response.ok) {
        const normalizedProducts = data.products.map((product) => ({
          ...product,
          id: product._id || product.id,
          media: (() => {
            if (Array.isArray(product.media) && product.media.length > 0) {
              const firstMedia = product.media[0];
              if (typeof firstMedia === 'string') return [{ url: firstMedia }];
              if (firstMedia?.url) return [{ url: firstMedia.url }];
              if (firstMedia?.image) return [{ url: firstMedia.image }];
            }
            return [{ url: DEFAULT_IMAGE_URL }];
          })(),
          price: product.price || 0,
          name: product.name || 'Unnamed Product',
          stock: product.stock || 0, // Added stock
          brand: product.brand || 'Unknown Brand', // Added brand
          offer: product.offer || '', // Added offer
        }));
        return normalizedProducts;
      } else {
        return rejectWithValue(data.msg || FETCH_PRODUCTS_ERROR);
      }
    } catch (error) {
      Trace('Fetch products by category error:', error);
      return rejectWithValue(NETWORK_ERROR);
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    products: [],
    selectedCategory: 'all',
    loading: false,
    refreshing: false,
    error: null,
  },
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.products = action.payload;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload;
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

export const { setSelectedCategory, setRefreshing, clearError } = categoriesSlice.actions;

export default categoriesSlice.reducer;