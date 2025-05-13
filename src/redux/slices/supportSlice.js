import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Trace from '../../utils/Trace';
import {
  BASE_URL,
  SUPPORT_SUBMIT_TICKET_ENDPOINT,
  SUPPORT_FAQS_ENDPOINT,
  SUPPORT_CHAT_MESSAGES_ENDPOINT,
  FETCH_FAQS_ERROR,
  SUBMIT_TICKET_ERROR,
  FETCH_CHAT_MESSAGES_ERROR,
  SEND_CHAT_MESSAGE_ERROR,
} from '../../constants/GlobalConstants';

// Fetch FAQs
export const fetchFAQs = createAsyncThunk(
  'support/fetchFAQs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}${SUPPORT_FAQS_ENDPOINT}`);
      const data = await response.json();
      if (response.ok) {
        return data.faqs;
      } else {
        return rejectWithValue({ message: data.msg || FETCH_FAQS_ERROR });
      }
    } catch (error) {
      Trace('Fetch FAQs error:', error);
      return rejectWithValue({ message: FETCH_FAQS_ERROR });
    }
  }
);

// Submit Ticket
export const submitTicket = createAsyncThunk(
  'support/submitTicket',
  async ({ subject, description }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        return rejectWithValue({ message: 'Authentication token is missing' });
      }

      const response = await fetch(`${BASE_URL}${SUPPORT_SUBMIT_TICKET_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, description }),
      });
      const data = await response.json();
      if (response.ok) {
        return data.ticket;
      } else {
        return rejectWithValue({ message: data.msg || SUBMIT_TICKET_ERROR });
      }
    } catch (error) {
      Trace('Submit ticket error:', error);
      return rejectWithValue({ message: SUBMIT_TICKET_ERROR });
    }
  }
);

// Send Chat Message
export const sendChatMessage = createAsyncThunk(
  'support/sendChatMessage',
  async ({ text }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        return rejectWithValue({ message: 'Authentication token is missing' });
      }

      const response = await fetch(`${BASE_URL}${SUPPORT_CHAT_MESSAGES_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (response.ok) {
        return {
          userMessage: {
            id: data.message.id,
            text: data.message.text,
            isUser: data.message.isUser,
            timestamp: new Date(data.message.timestamp),
          },
          botMessage: {
            id: data.botMessage.id,
            text: data.botMessage.text,
            isUser: data.botMessage.isUser,
            timestamp: new Date(data.botMessage.timestamp),
          },
        };
      } else {
        return rejectWithValue({ message: data.msg || SEND_CHAT_MESSAGE_ERROR });
      }
    } catch (error) {
      Trace('Send chat message error:', error);
      return rejectWithValue({ message: SEND_CHAT_MESSAGE_ERROR });
    }
  }
);

// Fetch Chat Messages
export const fetchChatMessages = createAsyncThunk(
  'support/fetchChatMessages',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        return rejectWithValue({ message: 'Authentication token is missing' });
      }

      const response = await fetch(`${BASE_URL}${SUPPORT_CHAT_MESSAGES_ENDPOINT}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        return data.messages.map(msg => ({
          id: msg._id,
          text: msg.text,
          isUser: msg.isUser,
          timestamp: new Date(msg.createdAt),
        }));
      } else {
        return rejectWithValue({ message: data.msg || FETCH_CHAT_MESSAGES_ERROR });
      }
    } catch (error) {
      Trace('Fetch chat messages error:', error);
      return rejectWithValue({ message: FETCH_CHAT_MESSAGES_ERROR });
    }
  }
);

const supportSlice = createSlice({
  name: 'support',
  initialState: {
    faqs: [],
    tickets: [],
    chatMessages: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch FAQs
      .addCase(fetchFAQs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFAQs.fulfilled, (state, action) => {
        state.loading = false;
        state.faqs = action.payload;
      })
      .addCase(fetchFAQs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })
      // Submit Ticket
      .addCase(submitTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.push(action.payload);
      })
      .addCase(submitTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })
      // Send Chat Message
      .addCase(sendChatMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.chatMessages.push(action.payload.userMessage);
        state.chatMessages.push(action.payload.botMessage);
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })
      // Fetch Chat Messages
      .addCase(fetchChatMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.chatMessages = action.payload;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      });
  },
});

export const { clearError } = supportSlice.actions;
export default supportSlice.reducer;