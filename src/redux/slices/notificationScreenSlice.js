import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASE_URL,
  NOTIFICATIONS_ENDPOINT,
  NOTIFICATION_READ_ENDPOINT,
  NOTIFICATION_DELETE_ENDPOINT,
} from '../../constants/GlobalConstants';

const fetchWithTimeout = async (url, options, timeout) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );
  return Promise.race([fetch(url, options), timeoutPromise]);
};

// Fetch all notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetchWithTimeout(
        `${BASE_URL}${NOTIFICATIONS_ENDPOINT}`,
        {
          method: 'GET',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        },
        10000
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to fetch notifications');
      }

      return data.notifications.map((notification) => ({
        ...notification,
        timestamp: notification.timestamp
          ? new Date(notification.timestamp).toISOString()
          : new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Fetch notifications error:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetchWithTimeout(
        `${BASE_URL}${NOTIFICATION_READ_ENDPOINT.replace(':notificationId', notificationId)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        10000
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to mark notification as read');
      }

      return notificationId;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetchWithTimeout(
        `${BASE_URL}${NOTIFICATION_DELETE_ENDPOINT.replace(':notificationId', notificationId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        10000
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to delete notification');
      }

      return notificationId;
    } catch (error) {
      console.error('Delete notification error:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Clear all notifications
export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetchWithTimeout(
        `${BASE_URL}${NOTIFICATIONS_ENDPOINT}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
        10000
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to clear notifications');
      }

      return [];
    } catch (error) {
      console.error('Clear notifications error:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    loading: false,
    error: null,
    refreshing: false,
  },
  reducers: {
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.refreshing = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.refreshing = false;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: 'top',
          topOffset: 20,
        });
      })
      // Mark Notification as Read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = state.notifications.map((notification) =>
          notification._id === action.payload
            ? { ...notification, isRead: true }
            : notification
        );
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: 'top',
          topOffset: 20,
        });
      })
      // Delete Notification
      .addCase(deleteNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = state.notifications.filter(
          (notification) => notification._id !== action.payload
        );
        Toast.show({
          type: 'success',
          text1: 'Notification deleted',
          position: 'top',
          topOffset: 20,
        });
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: 'top',
          topOffset: 20,
        });
      })
      // Clear All Notifications
      .addCase(clearAllNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.loading = false;
        state.notifications = [];
        Toast.show({
          type: 'success',
          text1: 'All notifications cleared',
          position: 'top',
          topOffset: 20,
        });
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: action.payload,
          position: 'top',
          topOffset: 20,
        });
      });
  },
});

export const { setRefreshing, clearError } = notificationSlice.actions;

export default notificationSlice.reducer;