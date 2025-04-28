import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Trace from '../../utils/Trace';
import {
  BASE_URL,
  PRODUCTS_ENDPOINT,
  HTTP_METHODS,
  DEFAULT_IMAGE_URL,
  DEFAULT_CATEGORY,
  DEFAULT_PRICE,
  NO_TOKEN_ERROR,
  FETCH_PRODUCTS_ERROR,
  SUBMIT_PRODUCT_ERROR,
  DELETE_PRODUCT_ERROR,
  GENERIC_ERROR,
  FILTER_LIMIT,
  PRICE_RANGES,
  SORT_OPTIONS,
  USER_TOKEN_KEY,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
} from '../../constants/GlobalConstants';

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  'dashboard/fetchProducts',
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
          media:
            Array.isArray(product.media) && product.media.length > 0
              ? typeof product.media[0] === 'string'
                ? product.media[0]
                : product.media[0]?.url || DEFAULT_IMAGE_URL
              : DEFAULT_IMAGE_URL,
          price: product.price || DEFAULT_PRICE,
          category: product.category || DEFAULT_CATEGORY,
          createdAt: product.createdAt || new Date().toISOString(),
          views: product.views || 0,
        }));
        return normalizedProducts;
      } else {
        return rejectWithValue(data.message || FETCH_PRODUCTS_ERROR);
      }
    } catch (error) {
      Trace('Fetch products error:', error);
      return rejectWithValue(error.message || GENERIC_ERROR);
    }
  }
);

// Async thunk for submitting a product
export const submitProduct = createAsyncThunk(
  'dashboard/submitProduct',
  async ({ productData, userId, currentProduct }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (!token) {
        return rejectWithValue(NO_TOKEN_ERROR);
      }

      const productPayload = { ...productData, createdBy: userId };
      const endpoint = currentProduct
        ? `${BASE_URL}${PRODUCTS_ENDPOINT}/${currentProduct.id}`
        : `${BASE_URL}${PRODUCTS_ENDPOINT}`;
      const method = currentProduct ? HTTP_METHODS.PUT : HTTP_METHODS.POST;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || SUBMIT_PRODUCT_ERROR);
      }

      return data;
    } catch (error) {
      Trace('Submit product error:', error);
      return rejectWithValue(error.message || SUBMIT_PRODUCT_ERROR);
    }
  }
);

// Async thunk for deleting a product
export const deleteProduct = createAsyncThunk(
  'dashboard/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (!token) {
        return rejectWithValue(NO_TOKEN_ERROR);
      }

      const response = await fetch(`${BASE_URL}${PRODUCTS_ENDPOINT}/${productId}`, {
        method: HTTP_METHODS.DELETE,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || DELETE_PRODUCT_ERROR);
      }

      return productId;
    } catch (error) {
      Trace('Delete product error:', error);
      return rejectWithValue(error.message || DELETE_PRODUCT_ERROR);
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    search: '',
    products: [],
    filteredProducts: [],
    suggestions: [],
    isExpanded: false,
    currentIndex: 0,
    activeFilter: null,
    token: '',
    userId: '',
    modalVisible: false,
    currentProduct: null,
    loading: true,
    isActionLoading: false,
    refreshing: false,
    selectedCategory: '',
    selectedPrice: '',
    selectedSort: '',
    error: null,
  },
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
      if (action.payload.trim() === '') {
        state.suggestions = [];
        state.filteredProducts = state.products.slice(0, FILTER_LIMIT);
      } else {
        const results = state.products.filter((item) =>
          item.name?.toLowerCase().includes(action.payload.toLowerCase())
        );
        state.suggestions = results;
        state.filteredProducts = results.slice(0, FILTER_LIMIT);
      }
      state.isExpanded = false;
    },
    selectSuggestion: (state, action) => {
      state.search = action.payload;
      state.suggestions = [];
      state.filteredProducts = state.products
        .filter((item) => item.name?.toLowerCase().includes(action.payload.toLowerCase()))
        .slice(0, FILTER_LIMIT);
    },
    setIsExpanded: (state, action) => {
      state.isExpanded = action.payload;
    },
    setCurrentIndex: (state, action) => {
      state.currentIndex = action.payload;
    },
    setActiveFilter: (state, action) => {
      state.activeFilter = action.payload;
    },
    setModalVisible: (state, action) => {
      state.modalVisible = action.payload;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
      state.filteredProducts = state.products
        .filter((product) => !action.payload || product.category === action.payload)
        .slice(0, FILTER_LIMIT);
    },
    setSelectedPrice: (state, action) => {
      state.selectedPrice = action.payload;
      let result = [...state.products];
      if (action.payload) {
        switch (action.payload) {
          case PRICE_RANGES.UNDER_500:
            result = result.filter((product) => product.price < 500);
            break;
          case PRICE_RANGES.RANGE_500_1000:
            result = result.filter((product) => product.price >= 500 && product.price <= 1000);
            break;
          case PRICE_RANGES.RANGE_1000_2000:
            result = result.filter((product) => product.price > 1000 && product.price <= 2000);
            break;
          case PRICE_RANGES.OVER_2000:
            result = result.filter((product) => product.price > 2000);
            break;
          default:
            break;
        }
      }
      state.filteredProducts = result.slice(0, FILTER_LIMIT);
    },
    setSelectedSort: (state, action) => {
      state.selectedSort = action.payload;
      let result = [...state.products];
      if (action.payload) {
        switch (action.payload) {
          case SORT_OPTIONS.NEWEST:
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case SORT_OPTIONS.PRICE_LOW_HIGH:
            result.sort((a, b) => a.price - b.price);
            break;
          case SORT_OPTIONS.PRICE_HIGH_LOW:
            result.sort((a, b) => b.price - a.price);
            break;
          case SORT_OPTIONS.POPULAR:
            result.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
          default:
            break;
        }
      }
      state.filteredProducts = result.slice(0, FILTER_LIMIT);
    },
    clearFilters: (state) => {
      state.selectedCategory = '';
      state.selectedPrice = '';
      state.selectedSort = '';
      state.filteredProducts = state.products.slice(0, FILTER_LIMIT);
    },
    setUserData: (state, action) => {
      state.userId = action.payload.userId;
      state.token = action.payload.token;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.filteredProducts = action.payload.slice(0, FILTER_LIMIT);
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Submit Product
      .addCase(submitProduct.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(submitProduct.fulfilled, (state) => {
        state.isActionLoading = false;
        state.modalVisible = false;
      })
      .addCase(submitProduct.rejected, (state, action) => {
        state.isActionLoading = false;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(deleteProduct.fulfilled, (state) => {
        state.isActionLoading = false;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isActionLoading = false;
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

export const {
  setSearch,
  selectSuggestion,
  setIsExpanded,
  setCurrentIndex,
  setActiveFilter,
  setModalVisible,
  setCurrentProduct,
  setSelectedCategory,
  setSelectedPrice,
  setSelectedSort,
  clearFilters,
  setUserData,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;