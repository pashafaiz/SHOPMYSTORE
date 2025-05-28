import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variable for BASE_URL (configure this in your environment setup)
const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://shopmystore-backend-1.onrender.com/api/seller';

// Configure Axios with default timeout
const axiosInstance = axios.create({
  timeout: 10000, // 10 seconds timeout
});

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error fetching auth token:', error);
    return null;
  }
};

// Helper function to handle errors
const handleError = (error) => {
  if (error.response) {
    return error.response.data || { message: 'Unknown server error' };
  }
  return { message: error.message || 'Network error' };
};

// Normalize order data to prevent unexpected fields
const normalizeOrder = (order) => {
  // If the order is not an object or is null, return a default order structure
  if (!order || typeof order !== 'object') {
    return {
      _id: '',
      status: 'pending',
      items: [],
      total: 0,
      createdAt: new Date().toISOString(),
      user: { userName: 'Unknown' },
    };
  }

  // Ensure only expected fields are included
  return {
    _id: order._id || '',
    status: order.status || 'pending',
    items: Array.isArray(order.items) ? order.items : [],
    total: order.total || 0,
    createdAt: order.createdAt || new Date().toISOString(),
    user: order.user && typeof order.user === 'object' ? order.user : { userName: 'Unknown' },
  };
};

// Fetch seller profile
export const fetchSellerProfile = createAsyncThunk(
  'seller/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.get(`${BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.profile;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Update seller profile
export const updateSellerProfile = createAsyncThunk(
  'seller/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.post(`${BASE_URL}/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.profile;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch seller products
export const fetchSellerProducts = createAsyncThunk(
  'seller/fetchProducts',
  async ({ page = 1, limit = 10, status }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.get(`${BASE_URL}/products`, {
        params: { page, limit, status },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch product analytics
export const fetchProductAnalytics = createAsyncThunk(
  'seller/fetchProductAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.get(`${BASE_URL}/products/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch seller orders
export const fetchSellerOrders = createAsyncThunk(
  'seller/fetchOrders',
  async ({ page = 1, limit = 10, status }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.get(`${BASE_URL}/orders`, {
        params: { page, limit, status },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const orders = Array.isArray(response.data.orders) ? response.data.orders : [];
      return { orders: orders.map(normalizeOrder), status, page };
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk(
  'seller/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.put(
        `${BASE_URL}/orders/${orderId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('updateOrderStatus API Response:', response.data); // Log the response
      // Check if response.data.order exists, otherwise assume response.data is the order
      const updatedOrder = response.data.order || response.data;
      return normalizeOrder(updatedOrder); // Normalize the order data
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch sales analytics
export const fetchSalesAnalytics = createAsyncThunk(
  'seller/fetchSalesAnalytics',
  async ({ period = 'monthly', limit = 12 }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.get(`${BASE_URL}/analytics/sales`, {
        params: { period, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.analytics;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch dashboard summary
export const fetchDashboardSummary = createAsyncThunk(
  'seller/fetchDashboardSummary',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.get(`${BASE_URL}/analytics/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch seller chats
export const fetchSellerChats = createAsyncThunk(
  'seller/fetchChats',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.get(`${BASE_URL}/chats`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch chat messages
export const fetchChatMessages = createAsyncThunk(
  'seller/fetchChatMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.get(`${BASE_URL}/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.chat;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Send message (with optimistic update)
export const sendMessage = createAsyncThunk(
  'seller/sendMessage',
  async ({ chatId, content }, { rejectWithValue, dispatch }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      
      // Optimistic update
      dispatch(addLocalMessage({
        sender: 'seller', // Adjust based on your auth context
        content,
        timestamp: new Date().toISOString(),
        read: false,
      }));

      const response = await axiosInstance.post(
        `${BASE_URL}/chats/${chatId}/messages`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.message;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch seller notifications
export const fetchSellerNotifications = createAsyncThunk(
  'seller/fetchNotifications',
  async ({ page = 1, limit = 10, markAsRead = false }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.get(`${BASE_URL}/notifications`, {
        params: { page, limit, markAsRead },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return {
        notifications: response.data.notifications,
        page,
        total: response.data.total || 0,
        unreadCount: response.data.unreadCount || 0,
      };
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'seller/markNotificationAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.put(
        `${BASE_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.notification;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'seller/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token found');
      const response = await axiosInstance.put(
        `${BASE_URL}/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

const initialState = {
  profile: null,
  products: [],
  productAnalytics: null,
  orders: {
    all: [],
    pending: [],
    processing: [],
    shipped: [],
    delivered: [],
    cancelled: [],
  },
  salesAnalytics: [],
  dashboardSummary: null,
  chats: [],
  currentChat: null,
  notifications: {
    list: [],
    unreadCount: 0,
    total: 0,
    loading: false,
    error: null,
  },
  loading: false,
  error: null,
};

const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {
    clearSellerState: (state) => {
      return initialState; // Reset to initial state
    },
    addLocalMessage: (state, action) => {
      if (!state.currentChat) {
        state.currentChat = { messages: [] };
      }
      state.currentChat.messages.push({
        sender: action.payload.sender,
        content: action.payload.content,
        timestamp: action.payload.timestamp || new Date().toISOString(),
        read: false,
      });
    },
    resetOrdersForTab: (state, action) => {
      const tab = action.payload;
      if (state.orders[tab]) {
        state.orders[tab] = [];
      }
    },
    addNewNotification: (state, action) => {
      // Avoid duplicates by checking notification ID
      if (!state.notifications.list.some(n => n._id === action.payload._id)) {
        state.notifications.list.unshift(action.payload);
        state.notifications.unreadCount += 1;
        state.notifications.total += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Seller Profile
      .addCase(fetchSellerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchSellerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Seller Profile
      .addCase(updateSellerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSellerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateSellerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Seller Products
      .addCase(fetchSellerProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Product Analytics
      .addCase(fetchProductAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.productAnalytics = action.payload;
      })
      .addCase(fetchProductAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Seller Orders
      .addCase(fetchSellerOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.loading = false;
        const { orders, status, page } = action.payload;
        const tab = status || 'all';
        if (page === 1) {
          state.orders[tab] = orders || [];
        } else {
          state.orders[tab] = [...(state.orders[tab] || []), ...(orders || [])];
        }
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload; // Already normalized in the thunk
        const tabsToUpdate = ['all', updatedOrder.status];
        
        // Update order in relevant tabs
        tabsToUpdate.forEach((tab) => {
          state.orders[tab] = state.orders[tab].map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          );
        });

        // Remove order from other status tabs
        const prevStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].filter(
          (s) => s !== updatedOrder.status && s !== 'all'
        );
        prevStatuses.forEach((tab) => {
          state.orders[tab] = state.orders[tab].filter(
            (order) => order._id !== updatedOrder._id
          );
        });
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Sales Analytics
      .addCase(fetchSalesAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.salesAnalytics = action.payload || [];
      })
      .addCase(fetchSalesAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Dashboard Summary
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardSummary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Seller Chats
      .addCase(fetchSellerChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload.chats || [];
      })
      .addCase(fetchSellerChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Chat Messages
      .addCase(fetchChatMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.currentChat = action.payload || { messages: [] };
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.currentChat) {
          state.currentChat = { messages: [] };
        }
        // Replace optimistic message with server response
        const optimisticMessageIndex = state.currentChat.messages.findIndex(
          (msg) => msg.content === action.meta.arg.content && !msg._id
        );
        if (optimisticMessageIndex !== -1) {
          state.currentChat.messages[optimisticMessageIndex] = action.payload;
        } else {
          state.currentChat.messages.push(action.payload);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Optionally, remove optimistic message on failure
        if (state.currentChat) {
          state.currentChat.messages = state.currentChat.messages.filter(
            (msg) => msg._id
          );
        }
      })
      // Fetch Seller Notifications
      .addCase(fetchSellerNotifications.pending, (state) => {
        state.notifications.loading = true;
        state.notifications.error = null;
      })
      .addCase(fetchSellerNotifications.fulfilled, (state, action) => {
        state.notifications.loading = false;
        const { notifications, page, total, unreadCount } = action.payload;
        
        // Use Set for efficient duplicate checking
        const existingIds = new Set(state.notifications.list.map(n => n._id));
        const newNotifications = notifications.filter(
          (notif) => !existingIds.has(notif._id)
        );

        if (page === 1) {
          state.notifications.list = newNotifications;
        } else {
          state.notifications.list = [...state.notifications.list, ...newNotifications];
        }
        
        state.notifications.total = total;
        state.notifications.unreadCount = unreadCount;
      })
      .addCase(fetchSellerNotifications.rejected, (state, action) => {
        state.notifications.loading = false;
        state.notifications.error = action.payload;
      })
      // Mark Notification As Read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.notifications.loading = true;
        state.notifications.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.notifications.loading = false;
        const updatedNotification = action.payload;
        
        // Update the notification in the list
        state.notifications.list = state.notifications.list.map((n) =>
          n._id === updatedNotification._id ? updatedNotification : n
        );
        
        // Decrement unread count if the notification was previously unread
        if (!updatedNotification.read) {
          state.notifications.unreadCount = Math.max(0, state.notifications.unreadCount - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.notifications.loading = false;
        state.notifications.error = action.payload;
      })
      // Mark All Notifications As Read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.notifications.loading = true;
        state.notifications.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.loading = false;
        state.notifications.list = state.notifications.list.map((notification) => ({
          ...notification,
          read: true,
        }));
        state.notifications.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.notifications.loading = false;
        state.notifications.error = action.payload;
      });
  },
});

export const {
  clearSellerState,
  addLocalMessage,
  resetOrdersForTab,
  addNewNotification,
} = sellerSlice.actions;
export default sellerSlice.reducer;