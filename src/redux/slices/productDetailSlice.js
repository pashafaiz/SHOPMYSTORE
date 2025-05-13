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
  DEFAULT_IMAGE_URL,
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
      let cartItems = [];
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
            cartItems = cartData.cart || [];
            isInCart = cartItems.some((item) => item.productId === productId || item._id === productId);
          } else {
            Trace('Cart fetch error:', cartData.msg || 'Unknown error');
          }

          const wishlistText = await wishlistResponse.text();
          let wishlistData = wishlistText ? JSON.parse(wishlistText) : { wishlist: [] };
          if (wishlistResponse.ok) {
            isLiked = wishlistData.wishlist.some((item) => item.productId === productId || item._id === productId);
          }
        } catch (error) {
          Trace('Cart or wishlist fetch error:', error);
        }
      }

      // Normalize related products
      const normalizedRelatedProducts = (relatedData.products || []).map((product) => ({
        ...product,
        media: Array.isArray(product.media) && product.media.length > 0
          ? (typeof product.media[0] === 'string' ? product.media[0] : product.media[0]?.url || DEFAULT_IMAGE_URL)
          : DEFAULT_IMAGE_URL,
      }));

      return {
        product: productData.product,
        user: {
          userName: userData.user?.userName || 'unknown',
          profileImage: typeof userData.user?.avatar === 'string' ? userData.user.avatar : null,
          _id: userData.user?._id || null,
          phone: userData.user?.phoneNumber || null,
        },
        relatedProducts: normalizedRelatedProducts,
        cartItems,
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
  async ({ productId, token }, { rejectWithValue, getState }) => {
    try {
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      if (!productId) {
        throw new Error('Product ID is missing');
      }

      const { productDetail } = getState();
      const isCurrentlyLiked = productDetail.isLiked;

      const response = await fetchWithTimeout(
        `${BASE_URL}${WISHLIST_ENDPOINT}/${productId}`,
        {
          method: isCurrentlyLiked ? HTTP_METHODS.DELETE : HTTP_METHODS.POST,
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
        return { isWishlisted: !isCurrentlyLiked };
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
  async ({ productId, token, quantity, size, color }, { rejectWithValue }) => {
    try {
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      if (!productId) {
        throw new Error('Product ID is missing');
      }

      const payload = {
        productId,
        quantity: quantity || 1,
        ...(size && { size }),
        ...(color && { color }),
      };

      const response = await fetchWithTimeout(
        `${BASE_URL}${CART_ENDPOINT}/${productId}`,
        {
          method: HTTP_METHODS.POST,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
        API_TIMEOUT_SHORT
      );

      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add to cart');
      }

      return data;
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
        return { cartItems: [] };
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
  async ({ userId }, { rejectWithValue }) => {
    try {
      if (!userId) {
        Trace('No userId provided for loadRecentlyViewed');
        return [];
      }

      const storageKey = `recentlyViewed_${userId}`;
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        let parsed;
        try {
          parsed = JSON.parse(stored);
        } catch (error) {
          Trace('Error parsing recently viewed:', error);
          return [];
        }

        // Filter out expired items (older than 24 hours)
        const oneDayInMs = 24 * 60 * 60 * 1000;
        const now = Date.now();

        const filtered = parsed.filter((item) => {
          const addedAt = item.timestamp || 0;
          const timeDiff = now - addedAt;
          return timeDiff <= oneDayInMs;
        });

        // If we filtered anything out, update storage
        if (filtered.length !== parsed.length) {
          await AsyncStorage.setItem(storageKey, JSON.stringify(filtered));
        }

        return filtered;
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
    cartItems: [],
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
      const { productId, product, userId } = action.payload;

      // Validate inputs
      if (!productId || !product || !userId) {
        Trace('Invalid saveRecentlyViewed payload:', { productId, product, userId });
        return;
      }

      // Check if product already exists in recently viewed
      const existingIndex = state.recentlyViewed.findIndex(
        (item) => item.id === productId || item._id === productId
      );

      if (existingIndex >= 0) {
        // If exists, move it to the beginning and update timestamp
        const [existingProduct] = state.recentlyViewed.splice(existingIndex, 1);
        state.recentlyViewed.unshift({
          ...existingProduct,
          timestamp: Date.now(),
        });
      } else {
        // Prepare the media URL
        const mediaUrl =
          Array.isArray(product.media) && product.media.length > 0
            ? typeof product.media[0] === 'string'
              ? product.media[0]
              : product.media[0]?.url || DEFAULT_IMAGE_URL
            : DEFAULT_IMAGE_URL;

        // Add new product to the beginning of the array
        state.recentlyViewed.unshift({
          id: productId,
          _id: productId,
          name: product.name || 'Unknown Product',
          media: mediaUrl,
          price: product.price || 0,
          originalPrice: product.originalPrice || null,
          discount: product.discount || null,
          category: product.category || 'Unknown',
          brand: product.brand || 'Unknown Brand',
          rating: product.rating || 4,
          reviewCount: product.reviewCount || 0,
          timestamp: Date.now(),
        });
      }

      // Limit to 10 items
      if (state.recentlyViewed.length > 10) {
        state.recentlyViewed = state.recentlyViewed.slice(0, 10);
      }

      // Save to AsyncStorage with user-specific key
      const storageKey = `recentlyViewed_${userId}`;
      AsyncStorage.setItem(storageKey, JSON.stringify(state.recentlyViewed)).catch((error) => {
        Trace('Error saving recently viewed:', error);
      });
    },
    clearRecentlyViewed: (state) => {
      if (state.userId) {
        const storageKey = `recentlyViewed_${state.userId}`;
        state.recentlyViewed = [];
        AsyncStorage.removeItem(storageKey).catch((error) => {
          Trace('Error clearing recently viewed:', error);
        });
      }
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
        state.cartItems = action.payload.cartItems;
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
            ? (state.product.likeCount || 0) + 1
            : Math.max((state.product.likeCount || 0) - 1, 0);
        }
        Toast.show({
          type: 'success',
          text1: action.payload.isWishlisted ? 'Added to wishlist' : 'Removed from wishlist',
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
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.isInCart = true;
        state.cartItems = action.payload.cartItems;
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
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.isInCart = false;
        state.cartItems = action.payload.cartItems;
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