import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASE_URL,
  ORDER_ENDPOINT,
  NETWORK_ERROR,
  MISSING_PRODUCT_ID_ERROR,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  HTTP_METHODS,
  API_TIMEOUT_SHORT,
} from '../../constants/GlobalConstants';

const fetchWithTimeout = async (url, options, timeout) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );
  return Promise.race([fetch(url, options), timeoutPromise]);
};

// Create Razorpay order
export const createRazorpayOrder = createAsyncThunk(
  'checkout/createRazorpayOrder',
  async ({ amount }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}${ORDER_ENDPOINT}/create-razorpay-order`,
        {
          method: HTTP_METHODS.POST,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount }),
        },
        API_TIMEOUT_SHORT
      );

      const data = await response.json();
      console.log('createRazorpayOrder response:', data);
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to create Razorpay order');
      }

      return data.order;
    } catch (error) {
      console.error('Create Razorpay order error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Fetch product details for checkout
export const fetchCheckoutProductDetails = createAsyncThunk(
  'checkout/fetchCheckoutProductDetails',
  async ({ productId }, { rejectWithValue }) => {
    try {
      if (!productId || typeof productId !== 'string') {
        throw new Error(MISSING_PRODUCT_ID_ERROR);
      }

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetchWithTimeout(
        `${BASE_URL}${ORDER_ENDPOINT}/products/${productId}`,
        {
          method: HTTP_METHODS.GET,
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );

      const data = await response.json();
      console.log('fetchCheckoutProductDetails response:', data);
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to fetch product details');
      }

      return data.product;
    } catch (error) {
      console.error('Fetch checkout product details error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Fetch user addresses
export const fetchAddresses = createAsyncThunk(
  'checkout/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}${ORDER_ENDPOINT}/addresses`,
        {
          method: HTTP_METHODS.GET,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );

      const data = await response.json();
      console.log('fetchAddresses response:', data);
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to fetch addresses');
      }

      return data.addresses;
    } catch (error) {
      console.error('Fetch addresses error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Add new address
export const addAddress = createAsyncThunk(
  'checkout/addAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}${ORDER_ENDPOINT}/addresses`,
        {
          method: HTTP_METHODS.POST,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(addressData),
        },
        API_TIMEOUT_SHORT
      );

      const data = await response.json();
      console.log('addAddress response:', data);
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to add address');
      }

      return data.address;
    } catch (error) {
      console.error('Add address error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Delete address
export const deleteAddress = createAsyncThunk(
  'checkout/deleteAddress',
  async ({ addressId }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}${ORDER_ENDPOINT}/addresses/${addressId}`,
        {
          method: HTTP_METHODS.DELETE,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to delete address');
      }

      return addressId;
    } catch (error) {
      console.error('Delete address error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Validate promo code
export const validatePromoCode = createAsyncThunk(
  'checkout/validatePromoCode',
  async ({ code }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}${ORDER_ENDPOINT}/promo-codes/validate`,
        {
          method: HTTP_METHODS.POST,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        },
        API_TIMEOUT_SHORT
      );

      const data = await response.json();
      console.log('validatePromoCode response:', data);
      if (!response.ok) {
        throw new Error(data.errors?.code || 'Invalid promo code');
      }

      return data.discount;
    } catch (error) {
      console.error('Validate promo code error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Place order
export const placeOrder = createAsyncThunk(
  'checkout/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}${ORDER_ENDPOINT}`,
        {
          method: HTTP_METHODS.POST,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        },
        API_TIMEOUT_SHORT
      );

      const data = await response.json();
      console.log('placeOrder response:', data);
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to place order');
      }

      return data.order;
    } catch (error) {
      console.error('Place order error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Fetch order details
export const fetchOrderDetails = createAsyncThunk(
  'checkout/fetchOrderDetails',
  async ({ orderId }, {組みwithValue }) => {
    try {
      if (!orderId || typeof orderId !== 'string') {
        throw new Error('Invalid order ID');
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}${ORDER_ENDPOINT}/${orderId}`,
        {
          method: HTTP_METHODS.GET,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        API_TIMEOUT_SHORT
      );

      const data = await response.json();
      console.log('fetchOrderDetails response:', data);
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to fetch order details');
      }

      return data.order;
    } catch (error) {
      console.error('Fetch order details error:', error);
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: {
    product: null,
    addresses: [],
    selectedAddressId: null,
    discount: 0,
    promoCode: '',
    paymentMethod: 'credit_card',
    order: null,
    loading: false,
    isActionLoading: false,
    error: null,
  },
  reducers: {
    setSelectedAddressId: (state, action) => {
      state.selectedAddressId = action.payload;
    },
    setPromoCode: (state, action) => {
      state.promoCode = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    clearDiscount: (state) => {
      state.discount = 0;
      state.promoCode = '';
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Razorpay Order
      .addCase(createRazorpayOrder.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.isActionLoading = false;
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Fetch Checkout Product Details
      .addCase(fetchCheckoutProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCheckoutProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchCheckoutProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Fetch Addresses
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
        const defaultAddress = action.payload.find((addr) => addr.isDefault);
        state.selectedAddressId = defaultAddress ? defaultAddress._id : null
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Add Address
      .addCase(addAddress.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.addresses.push(action.payload);
        state.selectedAddressId = action.payload._id;
        Toast.show({
          type: 'success',
          text1: 'Address added successfully',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Delete Address
      .addCase(deleteAddress.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.addresses = state.addresses.filter((addr) => addr._id !== action.payload);
        if (state.selectedAddressId === action.payload) {
          state.selectedAddressId = state.addresses[0]?._id || null;
        }
        Toast.show({
          type: 'success',
          text1: 'Address deleted successfully',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Validate Promo Code
      .addCase(validatePromoCode.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(validatePromoCode.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.discount = action.payload;
        Toast.show({
          type: 'success',
          text1: `Promo code applied: ${action.payload}% off`,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(validatePromoCode.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Place Order
      .addCase(placeOrder.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.order = action.payload;
        state.discount = 0;
        state.promoCode = '';
        Toast.show({
          type: 'success',
          text1: 'Order placed successfully',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Fetch Order Details
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      });
  },
});

export const {
  setSelectedAddressId,
  setPromoCode,
  setPaymentMethod,
  clearDiscount,
  clearError,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;