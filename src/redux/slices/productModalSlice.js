import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Trace from '../../utils/Trace';
import {
  BASE_URL,
  PRODUCTS_ENDPOINT,
  HTTP_METHODS,
  USER_TOKEN_KEY,
  API_TIMEOUT_SHORT,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
} from '../../constants/GlobalConstants';

// Utility function for fetch with timeout
const fetchWithTimeout = async (url, options, timeout) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );
  return Promise.race([fetch(url, options), timeoutPromise]);
};

// Async thunk for creating a product
export const createProduct = createAsyncThunk(
  'productModal/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const { name, description, price, category, media, createdBy, stock, brand, offer } = productData;
      if (!name || !description || !price || !category || !media.length || !createdBy || !brand || stock < 0) {
        throw new Error('Name, description, price, category, brand, stock (>= 0), and at least one media file are required');
      }

      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      Trace('Creating product:', { productData, hasToken: !!token });

      // Prepare form data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category.toLowerCase());
      formData.append('createdBy', createdBy);
      formData.append('stock', stock); // Added stock
      formData.append('brand', brand); // Added brand
      if (offer) formData.append('offer', offer); // Added offer (optional)

      media.forEach((item, index) => {
        formData.append('media', {
          uri: item.uri,
          type: item.type,
          name: item.fileName,
        });
        Trace('Appending media to FormData:', { index, uri: item.uri, type: item.type, fileName: item.fileName });
      });

      const response = await fetchWithTimeout(
        `${BASE_URL}${PRODUCTS_ENDPOINT}`,
        {
          method: HTTP_METHODS.POST, // Corrected to POST
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: formData,
        },
        API_TIMEOUT_SHORT
      );

      let data;
      try {
        const text = await response.text();
        Trace('Create product raw response:', { status: response.status, text });
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        Trace('Create product response parse error:', { error: error.message, text });
        throw new Error('Invalid response format: Expected JSON');
      }

      Trace('Create product API response:', { ok: response.ok, data });

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to create product');
      }

      return data.product;
    } catch (error) {
      Trace('Create product error:', { error: error.message });
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating a product
export const updateProduct = createAsyncThunk(
  'productModal/updateProduct',
  async ({ productId, productData }, { rejectWithValue }) => {
    try {
      if (!productId || typeof productId !== 'string') {
        throw new Error('Invalid or missing product ID');
      }

      const { name, description, price, category, media, createdBy, stock, brand, offer } = productData;
      if (!name || !description || !price || !category || !media.length || !createdBy || !brand || stock < 0) {
        throw new Error('Name, description, price, category, brand, stock (>= 0), and at least one media file are required');
      }

      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      Trace('Updating product:', { productId, productData, hasToken: !!token });

      // Prepare form data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category.toLowerCase());
      formData.append('createdBy', createdBy);
      formData.append('stock', stock); // Added stock
      formData.append('brand', brand); // Added brand
      if (offer) formData.append('offer', offer); // Added offer (optional)

      media.forEach((item, index) => {
        formData.append('media', {
          uri: item.uri,
          type: item.type,
          name: item.fileName,
        });
        Trace('Appending media to FormData:', { index, uri: item.uri, type: item.type, fileName: item.fileName });
      });

      const response = await fetchWithTimeout(
        `${BASE_URL}${PRODUCTS_ENDPOINT}/${productId}`,
        {
          method: HTTP_METHODS.PUT,
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: formData,
        },
        API_TIMEOUT_SHORT
      );

      let data;
      try {
        const text = await response.text();
        Trace('Update product raw response:', { productId, status: response.status, text });
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        Trace('Update product response parse error:', { productId, error: error.message, text });
        throw new Error('Invalid response format: Expected JSON');
      }

      Trace('Update product API response:', { productId, ok: response.ok, data });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found. It may have been deleted or does not exist.');
        }
        throw new Error(data.msg || 'Failed to update product');
      }

      return data.product;
    } catch (error) {
      Trace('Update product error:', { productId, error: error.message });
      return rejectWithValue(error.message);
    }
  }
);

const productModalSlice = createSlice({
  name: 'productModal',
  initialState: {
    name: '',
    description: '',
    price: '',
    media: [],
    category: '',
    stock: '0', // Added stock
    brand: '', // Added brand
    offer: '', // Added offer
    userId: '',
    isLoading: false,
    errorMessage: null,
    dropdownVisible: false,
  },
  reducers: {
    setName: (state, action) => {
      state.name = action.payload;
    },
    setDescription: (state, action) => {
      state.description = action.payload;
    },
    setPrice: (state, action) => {
      state.price = action.payload;
    },
    setCategory: (state, action) => {
      state.category = action.payload;
      state.dropdownVisible = false;
    },
    setMedia: (state, action) => {
      state.media = action.payload;
    },
    addMedia: (state, action) => {
      state.media = [...state.media, ...action.payload].slice(0, 10); // Increased to 10
    },
    removeMedia: (state, action) => {
      state.media = state.media.filter((_, index) => index !== action.payload);
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    setDropdownVisible: (state, action) => {
      state.dropdownVisible = action.payload;
    },
    setStock: (state, action) => { // Added setStock
      state.stock = action.payload;
    },
    setBrand: (state, action) => { // Added setBrand
      state.brand = action.payload;
    },
    setOffer: (state, action) => { // Added setOffer
      state.offer = action.payload;
    },
    resetForm: (state) => {
      state.name = '';
      state.description = '';
      state.price = '';
      state.media = [];
      state.category = '';
      state.stock = '0'; // Reset stock
      state.brand = ''; // Reset brand
      state.offer = ''; // Reset offer
      state.errorMessage = null;
    },
    setProductData: (state, action) => {
      const product = action.payload;
      state.name = product.name || '';
      state.description = product.description || '';
      state.price = product.price?.toString() || '';
      state.media = product.media?.map((item) => ({
        uri: item.url || item,
        mediaType: item.mediaType || 'image',
        type: item.type || 'image/jpeg',
        fileName: item.fileName || `media_${Date.now()}.jpg`,
      })) || [];
      state.category = product.category
        ? product.category.charAt(0).toUpperCase() + product.category.slice(1).toLowerCase()
        : '';
      state.stock = product.stock?.toString() || '0'; // Set stock
      state.brand = product.brand || ''; // Set brand
      state.offer = product.offer || ''; // Set offer
    },
    clearError: (state) => {
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = null;
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.isLoading = false;
        Trace('Product created successfully');
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product created successfully',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state_macroMessage = action.payload || 'Failed to create product';
        Trace('Create product failed:', { error: action.payload });
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = null;
      })
      .addCase(updateProduct.fulfilled, (state) => {
        state.isLoading = false;
        Trace('Product updated successfully');
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product updated successfully',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload || 'Failed to update product';
        Trace('Update product failed:', { error: action.payload });
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
const selectProductModalState = (state) => state.productModal;

export const selectProductModal = createSelector(
  [selectProductModalState],
  (productModal) => ({
    name: productModal.name,
    description: productModal.description,
    price: productModal.price,
    media: productModal.media,
    category: productModal.category,
    stock: productModal.stock, // Added stock
    brand: productModal.brand, // Added brand
    offer: productModal.offer, // Added offer
    userId: productModal.userId,
    isLoading: productModal.isLoading,
    errorMessage: productModal.errorMessage,
    dropdownVisible: productModal.dropdownVisible,
  })
);

export const {
  setName,
  setDescription,
  setPrice,
  setCategory,
  setMedia,
  addMedia,
  removeMedia,
  setUserId,
  setDropdownVisible,
  setStock, // Added
  setBrand, // Added
  setOffer, // Added
  resetForm,
  setProductData,
  clearError,
} = productModalSlice.actions;

export default productModalSlice.reducer;