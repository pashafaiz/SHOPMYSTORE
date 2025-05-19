import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Trace from '../../utils/Trace';
import {
  editProfileApi,
  createProductApi,
  getAllProductsApi,
  updateProductApi,
  deleteProductApi,
  getReelsApi,
  getCartApi,
  removeFromCartApi,
  getWishlistApi,
  removeFromWishlistApi,
} from '../../../apiClient';
import { DEFAULT_IMAGE_URL } from '../../constants/GlobalConstants';

// Async thunk for fetching user data
export const fetchUser = createAsyncThunk(
  'profile/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      Trace('Fetching User Data');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        Trace('User Data Fetched', { user: parsedUser });
        return parsedUser;
      } else {
        return rejectWithValue('No user data found');
      }
    } catch (err) {
      Trace('Get User Error', { error: err.message });
      return rejectWithValue('Failed to load user data');
    }
  }
);

// Async thunk for fetching user products
export const fetchUserProducts = createAsyncThunk(
  'profile/fetchUserProducts',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { user } = getState().profile;
      if (user?.userType !== 'seller') return [];
      Trace('Fetching User Products', { userId });

      const { ok, data } = await getAllProductsApi();
      Trace('Products API Response', { ok, data });

      if (ok && Array.isArray(data.products)) {
        const userProducts = data.products
          .filter((product) => {
            const createdById = typeof product.createdBy === 'object' && product.createdBy?._id
              ? product.createdBy._id
              : product.createdBy;
            return createdById === userId;
          })
          .map((product) => ({
            id: product._id || product.id || '',
            _id: product._id || product.id || '',
            name: product.name || 'Unknown Product',
            price: product.price || 0,
            originalPrice: product.originalPrice || null,
            discount: product.discount || null,
            brand: product.brand || 'Unknown Brand', // Added brand
            rating: product.rating || 0,
            reviewCount: product.reviewCount || 0,
            media: Array.isArray(product.media) && product.media.length > 0
              ? product.media.map(item => typeof item === 'string' ? item : item.url || DEFAULT_IMAGE_URL).slice(0, 10) // Support up to 10 media
              : [DEFAULT_IMAGE_URL],
            mediaType: product.mediaType || (/\.(mp4|mov|avi)$/i.test(product.media?.[0]) ? 'video' : 'image'),
            isNew: product.isNew || false,
            category: product.category || 'Unknown',
            createdBy: product.createdBy || userId,
            sizes: product.sizes || [],
            colors: product.colors || [],
            highlights: product.highlights || [],
            specifications: product.specifications || [],
            tags: product.tags || [],
            stock: product.stock || 0, // Added stock
            offer: product.offer || '', // Added offer
          }));

        Trace('Filtered and Normalized User Products', { count: userProducts.length });
        return userProducts;
      } else {
        Trace('Invalid Products Response', { data });
        return rejectWithValue(data.msg || 'Failed to fetch products');
      }
    } catch (err) {
      Trace('Fetch Products Error', { error: err.message, stack: err.stack });
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Async thunk for fetching user reels
export const fetchUserReels = createAsyncThunk(
  'profile/fetchUserReels',
  async (userId, { rejectWithValue }) => {
    try {
      Trace('Fetching User Reels', { userId });
      const { ok, data } = await getReelsApi();
      Trace('Reels API Response', { ok, data });

      if (ok && Array.isArray(data.reels)) {
        const userReels = data.reels.filter((reel) => reel.user?._id === userId);
        Trace('Filtered User Reels', { count: userReels.length });
        return userReels;
      } else {
        Trace('Invalid Reels Response', { data });
        return rejectWithValue(data.msg || 'Failed to fetch reels');
      }
    } catch (err) {
      Trace('Fetch Reels Error', { error: err.message });
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Async thunk for fetching cart
export const fetchCart = createAsyncThunk(
  'profile/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      Trace('Fetching Cart');
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Trace('No Token Found');
        return rejectWithValue('Authentication required. Please log in.');
      }
      const { ok, data, status } = await getCartApi();
      Trace('Cart Response', { ok, data, status });
      if (ok && Array.isArray(data.cart)) {
        Trace('Cart Items Set', { count: data.cart.length });
        return data.cart;
      } else {
        Trace('Invalid Cart Response', { data });
        return rejectWithValue(data.msg || 'Failed to fetch cart');
      }
    } catch (err) {
      Trace('Fetch Cart Error', { error: err.message, status: err.status });
      return rejectWithValue(
        err.status === 401
          ? 'Session expired. Please log in again.'
          : 'Failed to load cart'
      );
    }
  }
);

// Async thunk for fetching wishlist
export const fetchWishlist = createAsyncThunk(
  'profile/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      Trace('Fetching Wishlist');
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Trace('No Token Found');
        return rejectWithValue('Authentication required. Please log in.');
      }
      const { ok, data, status } = await getWishlistApi();
      Trace('Wishlist Response', { ok, data, status });
      if (ok && Array.isArray(data.wishlist)) {
        Trace('Wishlist Items Set', { count: data.wishlist.length });
        return data.wishlist;
      } else {
        Trace('Invalid Wishlist Response', { data });
        return rejectWithValue(data.msg || 'Failed to fetch wishlist');
      }
    } catch (err) {
      Trace('Fetch Wishlist Error', { error: err.message, status: err.status });
      return rejectWithValue(
        err.status === 401
          ? 'Session expired. Please log in again.'
          : 'Failed to load wishlist'
      );
    }
  }
);

// Async thunk for updating profile
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ fullName, userName }, { getState, rejectWithValue }) => {
    try {
      Trace('Updating Profile', { fullName, userName });
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Trace('No Token Found');
        return rejectWithValue('No token found');
      }
      const { ok, data } = await editProfileApi(token, fullName, userName);
      Trace('Edit Profile Response', { ok, data });
      if (ok) {
        const { user } = getState().profile;
        const updatedUser = { ...user, fullName, userName };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        return { user: updatedUser, message: data?.msg || 'Profile updated successfully' };
      } else {
        return rejectWithValue(data?.msg || data?.errors?.userName || 'Update failed');
      }
    } catch (err) {
      Trace('Update Profile Error', { error: err.message });
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Async thunk for submitting a product
export const submitProduct = createAsyncThunk(
  'profile/submitProduct',
  async ({ productData, currentProduct }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = currentProduct
        ? await updateProductApi(token, currentProduct.id, {
            ...productData,
            stock: productData.stock || 0, // Ensure stock
            brand: productData.brand || 'Unknown Brand', // Ensure brand
            offer: productData.offer || '', // Ensure offer
            media: productData.media.slice(0, 10), // Limit to 10 media
          })
        : await createProductApi(token, {
            ...productData,
            stock: productData.stock || 0, // Ensure stock
            brand: productData.brand || 'Unknown Brand', // Ensure brand
            offer: productData.offer || '', // Ensure offer
            media: productData.media.slice(0, 10), // Limit to 10 media
          });

      if (response.ok) {
        const normalizedProduct = {
          id: response.data.product._id || response.data.product.id,
          _id: response.data.product._id || response.data.product.id,
          name: response.data.product.name || 'Unknown Product',
          price: response.data.product.price || 0,
          brand: response.data.product.brand || 'Unknown Brand',
          stock: response.data.product.stock || 0,
          offer: response.data.product.offer || '',
          category: response.data.product.category || 'Unknown',
          media: Array.isArray(response.data.product.media) && response.data.product.media.length > 0
            ? response.data.product.media.map(item => typeof item === 'string' ? item : item.url || DEFAULT_IMAGE_URL).slice(0, 10)
            : [DEFAULT_IMAGE_URL],
        };
        return {
          product: normalizedProduct,
          message: response.data?.msg || 
            (currentProduct ? 'Product updated successfully' : 'Product added successfully')
        };
      } else {
        return rejectWithValue(response.data?.msg || 'Failed to manage product');
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Async thunk for deleting a product
export const deleteProduct = createAsyncThunk(
  'profile/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      Trace('Deleting Product', { productId });
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Trace('No Token Found');
        return rejectWithValue('No token found');
      }
      const { ok, data } = await deleteProductApi(token, productId);
      Trace('Delete Product Response', { ok, data });
      if (ok) {
        return { message: data?.msg || 'Product deleted successfully', productId };
      } else {
        return rejectWithValue(data?.msg || 'Failed to delete product');
      }
    } catch (err) {
      Trace('Delete Product Error', { error: err.message });
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Async thunk for removing from cart
export const removeFromCart = createAsyncThunk(
  'profile/removeFromCart',
  async (productId, { rejectWithValue }) => {
    try {
      Trace('Removing from Cart', { productId });
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Trace('No Token Found');
        return rejectWithValue('No token found');
      }
      const { ok, data } = await removeFromCartApi(token, productId);
      Trace('Remove from Cart Response', { ok, data });
      if (ok) {
        return { cart: data.cart, message: 'Product removed from cart' };
      } else {
        return rejectWithValue(data.msg || 'Failed to remove from cart');
      }
    } catch (err) {
      Trace('Remove from Cart Error', { error: err.message });
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Async thunk for removing from wishlist
export const removeFromWishlist = createAsyncThunk(
  'profile/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      Trace('Removing from Wishlist', { productId });
      const { ok, data } = await removeFromWishlistApi(productId);
      Trace('Remove from Wishlist Response', { ok, data });
      if (ok) {
        return { wishlist: data.wishlist, message: 'Product removed from wishlist' };
      } else {
        return rejectWithValue(data.msg || 'Failed to remove from wishlist');
      }
    } catch (err) {
      Trace('Remove from Wishlist Error', { error: err.message });
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Async thunk for logging out
export const logout = createAsyncThunk(
  'profile/logout',
  async (_, { rejectWithValue }) => {
    try {
      Trace('Logging Out');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      return { message: 'Logged out successfully' };
    } catch (err) {
      Trace('Logout Error', { error: err.message });
      return rejectWithValue('Failed to logout');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    user: null,
    userId: '',
    products: [],
    reels: [],
    cart: [],
    wishlist: [],
    loadingProducts: false,
    successMessage: '',
    errorMessage: '',
    refreshing: false,
  },
  reducers: {
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    clearMessages: (state) => {
      state.successMessage = '';
      state.errorMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loadingProducts = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.user = action.payload;
        state.userId = action.payload?.id || '';
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(fetchUserProducts.pending, (state) => {
        state.loadingProducts = true;
        state.errorMessage = '';
      })
      .addCase(fetchUserProducts.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.products = action.payload;
      })
      .addCase(fetchUserProducts.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        state.products = [];
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(fetchUserReels.pending, (state) => {
        state.loadingProducts = true;
      })
      .addCase(fetchUserReels.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.reels = action.payload;
      })
      .addCase(fetchUserReels.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(fetchCart.pending, (state) => {
        state.loadingProducts = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        state.cart = [];
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(fetchWishlist.pending, (state) => {
        state.loadingProducts = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.wishlist = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        state.wishlist = [];
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(updateProfile.pending, (state) => {
        state.loadingProducts = true;
        state.successMessage = '';
        state.errorMessage = '';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.user = action.payload.user;
        state.successMessage = action.payload.message;
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: action.payload.message,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(submitProduct.pending, (state) => {
        state.loadingProducts = true;
        state.successMessage = '';
        state.errorMessage = '';
      })
      .addCase(submitProduct.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.successMessage = action.payload.message;
        if (action.payload.product) {
          const existingIndex = state.products.findIndex(p => p.id === action.payload.product.id);
          if (existingIndex >= 0) {
            state.products[existingIndex] = action.payload.product;
          } else {
            state.products.push(action.payload.product);
          }
        }
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: action.payload.message,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(submitProduct.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(deleteProduct.pending, (state) => {
        state.loadingProducts = true;
        state.successMessage = '';
        state.errorMessage = '';
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.successMessage = action.payload.message;
        state.products = state.products.filter(p => p.id !== action.payload.productId);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: action.payload.message,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(removeFromCart.pending, (state) => {
        state.loadingProducts = true;
        state.successMessage = '';
        state.errorMessage = '';
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.cart = action.payload.cart;
        state.successMessage = action.payload.message;
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: action.payload.message,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(removeFromWishlist.pending, (state) => {
        state.loadingProducts = true;
        state.successMessage = '';
        state.errorMessage = '';
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.wishlist = action.payload.wishlist;
        state.successMessage = action.payload.message;
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: action.payload.message,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(logout.pending, (state) => {
        state.loadingProducts = true;
        state.successMessage = '';
        state.errorMessage = '';
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.loadingProducts = false;
        state.user = null;
        state.userId = '';
        state.products = [];
        state.reels = [];
        state.cart = [];
        state.wishlist = [];
        state.successMessage = action.payload.message;
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: action.payload.message,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      })
      .addCase(logout.rejected, (state, action) => {
        state.loadingProducts = false;
        state.errorMessage = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: 'top',
          topOffset: 20,
          visibilityTime: 3000,
        });
      });
  },
});

export const { setRefreshing, clearMessages } = profileSlice.actions;

export default profileSlice.reducer;