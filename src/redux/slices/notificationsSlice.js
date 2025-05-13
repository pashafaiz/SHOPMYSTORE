import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASE_URL,
  NOTIFICATIONS_ENDPOINT,
  NOTIFICATION_READ_ENDPOINT,
  NOTIFICATION_DELETE_ENDPOINT,
  HTTP_METHODS,
  FETCH_NOTIFICATIONS_ERROR,
  CREATE_NOTIFICATION_ERROR,
  MARK_NOTIFICATION_READ_ERROR,
  DELETE_NOTIFICATION_ERROR,
  CLEAR_NOTIFICATIONS_ERROR,
} from '../../constants/GlobalConstants';

const initialState = {
  notifications: [],
  status: 'idle',
  error: null,
};

// Helper function to get auth token
const getAuthToken = async () => {
  return await AsyncStorage.getItem('userToken');
};

// Create notification
export const createNotification = createAsyncThunk(
  'notifications/createNotification',
  async (notificationData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}${NOTIFICATIONS_ENDPOINT}`, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error(CREATE_NOTIFICATION_ERROR);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetch(`${BASE_URL}${NOTIFICATIONS_ENDPOINT}`, {
        method: HTTP_METHODS.GET,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(FETCH_NOTIFICATIONS_ERROR);
      }

      const data = await response.json();
      return data.notifications;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const endpoint = NOTIFICATION_READ_ENDPOINT.replace(':notificationId', notificationId);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: HTTP_METHODS.PUT,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(MARK_NOTIFICATION_READ_ERROR);
      }

      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const endpoint = NOTIFICATION_DELETE_ENDPOINT.replace(':notificationId', notificationId);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: HTTP_METHODS.DELETE,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(DELETE_NOTIFICATION_ERROR);
      }

      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Clear all notifications
export const clearAllNotifications = createAsyncThunk(
  'notifications/clearNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetch(`${BASE_URL}${NOTIFICATIONS_ENDPOINT}`, {
        method: HTTP_METHODS.DELETE,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(CLEAR_NOTIFICATIONS_ERROR);
      }

      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addLocalNotification: (state, action) => {
      const notification = {
        ...action.payload,
        id: action.payload.id || `${Date.now()}`,
        timestamp: action.payload.timestamp || new Date().toISOString(),
        read: action.payload.read || false,
      };
      // Prevent duplicates
      if (!state.notifications.some((item) => item.id === notification.id)) {
        state.notifications.unshift(notification);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Notification
      .addCase(createNotification.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const newNotification = {
          id: action.payload.notification.id,
          user: action.payload.notification.user,
          title: action.payload.notification.title,
          body: action.payload.notification.body,
          read: action.payload.notification.read,
          timestamp: action.payload.notification.timestamp,
        };
        // Prevent duplicates
        if (!state.notifications.some((item) => item.id === newNotification.id)) {
          state.notifications.unshift(newNotification);
        }
      })
      .addCase(createNotification.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch Notifications
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.notifications = action.payload.map(notification => ({
          id: notification._id,
          user: notification.user,
          title: notification.title,
          body: notification.body,
          read: notification.read,
          timestamp: notification.timestamp,
        }));
      })
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Mark As Read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const notification = state.notifications.find(
          (item) => item.id === action.payload
        );
        if (notification) {
          notification.read = true;
        }
      })
      .addCase(markNotificationAsRead.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.notifications = state.notifications.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.status = 'succeeded';
        state.notifications = [];
      })
      .addCase(clearAllNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { addLocalNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;