import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {
  BASE_URL,
  CHAT_SEND_MESSAGE_ENDPOINT,
  CHAT_MESSAGES_ENDPOINT,
  CHAT_UPDATE_MESSAGE_ENDPOINT,
  CHAT_DELETE_MESSAGE_ENDPOINT,
  CHAT_LIST_ENDPOINT,
  SAVE_FCM_TOKEN_ENDPOINT,
  FETCH_CHAT_LIST_ERROR,
} from '../../constants/GlobalConstants';

// Helper to get user token
const getUserToken = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    return token;
  } catch (error) {
    console.error('Error fetching user token:', error);
    throw error;
  }
};

// Fetch chat list
export const fetchChatList = createAsyncThunk(
  'chat/fetchChatList',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const token = await getUserToken();
      if (!token) {
        throw new Error('No user token found');
      }

      const response = await fetch(
        `${BASE_URL}${CHAT_LIST_ENDPOINT}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || FETCH_CHAT_LIST_ERROR);
      }

      const chats = data.chats.map((chat) => ({
        ...chat,
        latestMessage: chat.latestMessage
          ? new Date(chat.latestMessage).toISOString()
          : new Date().toISOString(),
      }));

      return { chats, pagination: data.pagination };
    } catch (error) {
      console.error('Fetch chat list error:', error);
      return rejectWithValue(error.message || FETCH_CHAT_LIST_ERROR);
    }
  }
);

// Fetch messages
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ recipientId, page, limit }, { rejectWithValue }) => {
    try {
      const token = await getUserToken();
      if (!token) {
        throw new Error('No user token found');
      }

      const response = await fetch(
        `${BASE_URL}${CHAT_MESSAGES_ENDPOINT}?recipientId=${recipientId}&page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to fetch messages');
      }

      const messages = data.messages.map((msg) => ({
        ...msg,
        id: msg.id || msg._id,
        createdAt: msg.createdAt ? new Date(msg.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: msg.updatedAt ? new Date(msg.updatedAt).toISOString() : null,
      }));

      return { messages, pagination: data.pagination };
    } catch (error) {
      console.error('Fetch messages error:', error);
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

// Send message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ recipientId, content }, { rejectWithValue }) => {
    try {
      const token = await getUserToken();
      if (!token) {
        throw new Error('No user token found');
      }

      const response = await fetch(`${BASE_URL}${CHAT_SEND_MESSAGE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId, content }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to send message');
      }

      const message = {
        ...data.message,
        id: data.message.id || data.message._id,
        createdAt: data.message.createdAt
          ? new Date(data.message.createdAt).toISOString()
          : new Date().toISOString(),
        updatedAt: data.message.updatedAt ? new Date(data.message.updatedAt).toISOString() : null,
      };

      return message;
    } catch (error) {
      console.error('Send message error:', error);
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

// Save FCM token
export const saveFcmToken = createAsyncThunk(
  'chat/saveFcmToken',
  async ({ userId, fcmToken }, { rejectWithValue }) => {
    try {
      const token = await getUserToken();
      if (!token) {
        throw new Error('No user token found');
      }

      const response = await fetch(`${BASE_URL}${SAVE_FCM_TOKEN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, fcmToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to save FCM token');
      }

      return data;
    } catch (error) {
      console.error('Save FCM token error:', error);
      return rejectWithValue(error.message || 'Failed to save FCM token');
    }
  }
);

// Update message
export const updateMessage = createAsyncThunk(
  'chat/updateMessage',
  async ({ messageId, content }, { rejectWithValue }) => {
    try {
      const token = await getUserToken();
      if (!token) {
        throw new Error('No user token found');
      }

      const response = await fetch(
        `${BASE_URL}${CHAT_UPDATE_MESSAGE_ENDPOINT.replace(':messageId', messageId)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to update message');
      }

      return {
        ...data.message,
        id: data.message.id || data.message._id,
        createdAt: data.message.createdAt
          ? new Date(data.message.createdAt).toISOString()
          : new Date().toISOString(),
        updatedAt: data.message.updatedAt ? new Date(data.message.updatedAt).toISOString() : null,
      };
    } catch (error) {
      console.error('Update message error:', error);
      return rejectWithValue(error.message || 'Failed to update message');
    }
  }
);

// Delete message
export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      const token = await getUserToken();
      if (!token) {
        throw new Error('No user token found');
      }

      const response = await fetch(
        `${BASE_URL}${CHAT_DELETE_MESSAGE_ENDPOINT.replace(':messageId', messageId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to delete message');
      }

      return messageId;
    } catch (error) {
      console.error('Delete message error:', error);
      return rejectWithValue(error.message || 'Failed to delete message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: [],
    messages: [],
    pagination: { page: 1, limit: 20, total: 0 },
    notifications: [],
    loading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Chat List
      .addCase(fetchChatList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatList.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload.chats;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchChatList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || FETCH_CHAT_LIST_ERROR;
      })
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
        state.pagination = action.payload.pagination;
        const newMessages = action.payload.messages.filter(
          (msg) => !state.messages.some((existing) => existing.id === msg.id)
        );
        newMessages.forEach((msg) => {
          if (msg.sender?._id !== 'current-user') {
            state.notifications.push({
              id: msg.id,
              type: 'new_message',
              message: msg.content || 'New message received',
              senderId: msg.sender?._id || 'unknown',
              senderName: msg.sender?.fullName || 'Support',
              timestamp: msg.createdAt,
              read: false,
            });
          }
        });
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch messages';
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
        state.notifications.push({
          id: action.payload.id,
          type: 'message_sent',
          message: 'Message sent successfully',
          senderId: action.payload.sender?._id || 'current-user',
          senderName: action.payload.sender?.fullName || 'You',
          timestamp: action.payload.createdAt,
          read: false,
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send message';
      })
      // Save FCM Token
      .addCase(saveFcmToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveFcmToken.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(saveFcmToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to save FCM token';
      })
      // Update Message
      .addCase(updateMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMessage.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.messages.findIndex((msg) => msg.id === action.payload.id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      .addCase(updateMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update message';
      })
      // Delete Message
      .addCase(deleteMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = state.messages.filter((msg) => msg.id !== action.payload);
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete message';
      });
  },
});

export const { addNotification, clearNotifications } = chatSlice.actions;
export default chatSlice.reducer;