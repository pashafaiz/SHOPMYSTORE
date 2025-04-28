import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import Trace from '../../utils/Trace';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASE_URL,
  USER_PROFILE_ENDPOINT,
  CART_ENDPOINT,
  WISHLIST_ENDPOINT,
  NETWORK_ERROR,
  MISSING_PRODUCT_ID_ERROR,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  HTTP_METHODS,
  API_TIMEOUT_SHORT,
} from '../../constants/GlobalConstants';

// Utility function for fetch with timeout
const fetchWithTimeout = async (url, options, timeout) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );
  return Promise.race([fetch(url, options), timeoutPromise]);
};

// Async thunk for fetching product details
export const fetchProductDetails = createAsyncThunk(
  'productDetail/fetchProductDetails',
  async ({ productId }, { rejectWithValue }) => {
    try {
      if (!productId || typeof productId !== 'string') {
        throw new Error(MISSING_PRODUCT_ID_ERROR);
      }

      const token = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('user');
      let userId = '';
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userId = parsedUser.id;
        } catch (error) {
          Trace('Error parsing stored user:', error);
        }
      }

      // Fetch product
      const productResponse = await fetchWithTimeout(
        `${BASE_URL}/api/products/${productId}`,
        {
          method: HTTP_METHODS.GET,
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );
      let productData;
      try {
        const text = await productResponse.text();
        productData = text ? JSON.parse(text) : {};
      } catch (error) {
        Trace('Product response parse error:', error, 'Raw response:', productResponse);
        throw new Error('Invalid response format: Expected JSON');
      }
      if (!productResponse.ok) {
        throw new Error(productData.msg || 'Product not found');
      }
      if (!productData.product) {
        throw new Error('Product data missing in response');
      }

      // Fetch user profile
      let userData = { user: { userName: 'unknown', avatar: null, _id: null } };
      try {
        const userResponse = await fetchWithTimeout(
          `${BASE_URL}${USER_PROFILE_ENDPOINT}/${productData.product.createdBy}`,
          {
            method: HTTP_METHODS.GET,
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            },
          },
          API_TIMEOUT_SHORT
        );
        const userText = await userResponse.text();
        if (userText) {
          userData = JSON.parse(userText);
        }
      } catch (error) {
        Trace('User profile fetch error:', error);
      }

      // Fetch related products
      let relatedData = { products: [] };
      try {
        const relatedResponse = await fetchWithTimeout(
          `${BASE_URL}/api/products/${productId}/related`,
          {
            method: HTTP_METHODS.GET,
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            },
          },
          API_TIMEOUT_SHORT
        );
        const relatedText = await relatedResponse.text();
        if (relatedText) {
          relatedData = JSON.parse(relatedText);
        }
      } catch (error) {
        Trace('Related products fetch error:', error);
      }

      // Fetch cart and wishlist
      let isInCart = false;
      let isLiked = false;
      if (token && userId) {
        try {
          const [cartResponse, wishlistResponse] = await Promise.all([
            fetchWithTimeout(`${BASE_URL}${CART_ENDPOINT}`, {
              method: HTTP_METHODS.GET,
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }, API_TIMEOUT_SHORT),
            fetchWithTimeout(`${BASE_URL}${WISHLIST_ENDPOINT}`, {
              method: HTTP_METHODS.GET,
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }, API_TIMEOUT_SHORT),
          ]);

          const cartText = await cartResponse.text();
          let cartData = cartText ? JSON.parse(cartText) : { cart: [] };
          if (cartResponse.ok) {
            isInCart = cartData.cart.some((item) => item._id === productId);
          }

          const wishlistText = await wishlistResponse.text();
          let wishlistData = wishlistText ? JSON.parse(wishlistText) : { wishlist: [] };
          if (wishlistResponse.ok) {
            isLiked = wishlistData.wishlist.some((item) => item._id === productId);
          }
        } catch (error) {
          Trace('Cart or wishlist fetch error:', error);
        }
      }

      // Normalize related products
      const normalizedRelatedProducts = (relatedData.products || []).map((product) => ({
        ...product,
        media: Array.isArray(product.media) && product.media.length > 0
          ? (typeof product.media[0] === 'string' ? product.media[0] : product.media[0]?.url || 'https://via.placeholder.com/100')
          : 'https://via.placeholder.com/100',
      }));

      return {
        product: productData.product,
        user: {
          userName: userData.user?.userName || 'unknown',
          profileImage: typeof userData.user?.avatar === 'string' ? userData.user.avatar : null,
          _id: userData.user?._id || null,
        },
        relatedProducts: normalizedRelatedProducts,
        userId,
        token,
        isInCart,
        isLiked,
      };
    } catch (error) {
      Trace('Fetch product details error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Async thunk for toggling like
export const toggleLike = createAsyncThunk(
  'productDetail/toggleLike',
  async ({ productId, token }, { rejectWithValue }) => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}${WISHLIST_ENDPOINT}/${productId}`,
        {
          method: HTTP_METHODS.POST,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        Trace('Toggle like response parse error:', error);
        throw new Error('Invalid response format: Expected JSON');
      }
      if (response.ok) {
        return { isWishlisted: data.isWishlisted };
      } else {
        throw new Error(data.msg || 'Failed to toggle like');
      }
    } catch (error) {
      Trace('Toggle like error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Async thunk for adding to cart
export const addToCart = createAsyncThunk(
  'productDetail/addToCart',
  async ({ productId, token }, { rejectWithValue }) => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}${CART_ENDPOINT}/${productId}`,
        {
          method: HTTP_METHODS.POST,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        Trace('Add to cart response parse error:', error);
        throw new Error('Invalid response format: Expected JSON');
      }
      if (response.ok) {
        return data;
      } else {
        throw new Error(data.msg || 'Failed to add to cart');
      }
    } catch (error) {
      Trace('Add to cart error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Async thunk for removing from cart
export const removeFromCart = createAsyncThunk(
  'productDetail/removeFromCart',
  async ({ productId, token }, { rejectWithValue }) => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}${CART_ENDPOINT}/${productId}`,
        {
          method: HTTP_METHODS.DELETE,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );
      if (response.status === 204 || response.ok) {
        return {};
      } else {
        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          Trace('Remove from cart response parse error:', error);
          throw new Error('Invalid response format: Expected JSON');
        }
        throw new Error(data.msg || 'Failed to remove from cart');
      }
    } catch (error) {
      Trace('Remove from cart error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Async thunk for loading recently viewed
export const loadRecentlyViewed = createAsyncThunk(
  'productDetail/loadRecentlyViewed',
  async (_, { rejectWithValue }) => {
    try {
      const stored = await AsyncStorage.getItem('recentlyViewed');
      if (stored) {
        let parsed;
        try {
          parsed = JSON.parse(stored);
        } catch (error) {
          Trace('Error parsing recently viewed:', error);
          return [];
        }
        const oneHourInMs = 60 * 60 * 1000;
        const now = Date.now();
        parsed = parsed.filter((item) => {
          const addedAt = item.timestamp || 0;
          const timeDiff = now - addedAt;
          return timeDiff <= oneHourInMs;
        });
        await AsyncStorage.setItem('recentlyViewed', JSON.stringify(parsed));
        return parsed;
      }
      return [];
    } catch (error) {
      Trace('Error loading recently viewed:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

const productDetailSlice = createSlice({
  name: 'productDetail',
  initialState: {
    product: null,
    user: null,
    relatedProducts: [],
    recentlyViewed: [],
    userId: '',
    token: '',
    loading: false,
    refreshing: false,
    isActionLoading: false,
    currentMediaIndex: 0,
    isLiked: false,
    isInCart: false,
    videoProgress: 0,
    videoDuration: 0,
    error: null,
  },
  reducers: {
    setCurrentMediaIndex: (state, action) => {
      state.currentMediaIndex = action.payload;
    },
    setVideoProgress: (state, action) => {
      state.videoProgress = action.payload;
    },
    setVideoDuration: (state, action) => {
      state.videoDuration = action.payload;
    },
    saveRecentlyViewed: (state, action) => {
      const { productId, product } = action.payload;
      let viewed = state.recentlyViewed.filter((item) => item.id !== productId);
      const mediaUrl = Array.isArray(product.media) && product.media.length > 0
        ? (typeof product.media[0] === 'string' ? product.media[0] : product.media[0]?.url || 'https://via.placeholder.com/100')
        : 'https://via.placeholder.com/100';
      viewed.unshift({
        id: productId,
        name: product.name,
        media: mediaUrl,
        price: product.price,
        category: product.category || 'Unknown',
        timestamp: Date.now(),
      });
      viewed = viewed.slice(0, 10);
      state.recentlyViewed = viewed;
      AsyncStorage.setItem('recentlyViewed', JSON.stringify(viewed)).catch((error) => {
        Trace('Error saving recently viewed:', error);
      });
    },
    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
      AsyncStorage.removeItem('recentlyViewed').catch((error) => {
        Trace('Error clearing recently viewed:', error);
      });
    },
    clearError: (state) => {
      state.error = null;
    },
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Product Details
      .addCase(fetchProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
        if (state.refreshing) state.refreshing = false;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload.product;
        state.user = action.payload.user;
        state.relatedProducts = action.payload.relatedProducts;
        state.userId = action.payload.userId;
        state.token = action.payload.token;
        state.isInCart = action.payload.isInCart;
        state.isLiked = action.payload.isLiked;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Toggle Like
      .addCase(toggleLike.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.isLiked = action.payload.isWishlisted;
        if (state.product) {
          state.product.likeCount = action.payload.isWishlisted
            ? state.product.likeCount + 1
            : state.product.likeCount - 1;
        }
        Toast.show({
          type: 'success',
          text1: action.payload.isWishlisted ? 'Product liked' : 'Product unliked',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.isActionLoading = false;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(addToCart.fulfilled, (state) => {
        state.isActionLoading = false;
        state.isInCart = true;
        Toast.show({
          type: 'success',
          text1: 'Product added to cart',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isActionLoading = false;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(removeFromCart.fulfilled, (state) => {
        state.isActionLoading = false;
        state.isInCart = false;
        Toast.show({
          type: 'success',
          text1: 'Product removed from cart',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isActionLoading = false;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Load Recently Viewed
      .addCase(loadRecentlyViewed.fulfilled, (state, action) => {
        state.recentlyViewed = action.payload;
      })
      .addCase(loadRecentlyViewed.rejected, (state, action) => {
        Trace('Error loading recently viewed:', action.payload);
      });
  },
});

export const {
  setCurrentMediaIndex,
  setVideoProgress,
  setVideoDuration,
  saveRecentlyViewed,
  clearRecentlyViewed,
  clearError,
  setRefreshing,
} = productDetailSlice.actions;

export default productDetailSlice.reducer;