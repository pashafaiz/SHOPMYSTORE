import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import Trace from '../../utils/Trace';
import {
  BASE_URL,
  COMMENTS_ENDPOINT,
  HTTP_METHODS,
  FETCH_COMMENTS_ERROR,
  POST_COMMENT_ERROR,
  GENERIC_ERROR,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
} from '../../constants/GlobalConstants';

// Helper function to make API requests
const makeApiRequest = async (url, method, body = null, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    };
    const response = await fetch(url, options);
    const data = await response.json();
    return { ok: response.ok, data, status: response.status };
  } catch (error) {
    Trace('API Request Error', { error: error.message });
    throw new Error(GENERIC_ERROR);
  }
};

// Async thunk for fetching comments
export const fetchComments = createAsyncThunk(
  'reel/fetchComments',
  async (reelId, { rejectWithValue }) => {
    try {
      Trace('Fetching Comments', { reelId });
      const url = `${BASE_URL}${COMMENTS_ENDPOINT}/${reelId}`;
      const { ok, data } = await makeApiRequest(url, HTTP_METHODS.GET);
      if (ok) {
        Trace('Comments Fetched', { count: data.comments?.length || 0 });
        return data.comments || [];
      } else {
        Trace('Failed to Fetch Comments', { message: data.msg });
        return rejectWithValue(data.msg || FETCH_COMMENTS_ERROR);
      }
    } catch (error) {
      Trace('Comments Fetch Error', { error: error.message });
      return rejectWithValue(error.message || GENERIC_ERROR);
    }
  }
);

// Async thunk for posting a comment
export const postComment = createAsyncThunk(
  'reel/postComment',
  async ({ reelId, text }, { rejectWithValue }) => {
    try {
      Trace('Posting Comment', { reelId, text });
      const url = `${BASE_URL}${COMMENTS_ENDPOINT}/${reelId}`;
      const { ok, data } = await makeApiRequest(url, HTTP_METHODS.POST, { text });
      if (ok) {
        Trace('Comment Posted Successfully');
        return { message: 'Comment posted successfully' };
      } else {
        Trace('Failed to Post Comment', { message: data.msg });
        return rejectWithValue(data.msg || POST_COMMENT_ERROR);
      }
    } catch (error) {
      Trace('Post Comment Error', { error: error.message });
      return rejectWithValue(error.message || GENERIC_ERROR);
    }
  }
);

const reelSlice = createSlice({
  name: 'reel',
  initialState: {
    comments: [],
    liked: false,
    saved: false,
    likesCount: 0,
    commentsCount: 0,
    loadingComments: false,
    errorMessage: '',
    successMessage: '',
  },
  reducers: {
    toggleLike: (state) => {
      state.liked = !state.liked;
      state.likesCount = state.liked
        ? state.likesCount + 1
        : state.likesCount - 1;
    },
    toggleSave: (state) => {
      state.saved = !state.saved;
    },
    setReelData: (state, action) => {
      state.liked = false; // Reset like state for new reel
      state.saved = false; // Reset save state for new reel
      state.likesCount = action.payload.likes || 0;
      state.commentsCount = action.payload.comments || 0;
      state.comments = []; // Reset comments
    },
    clearMessages: (state) => {
      state.successMessage = '';
      state.errorMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Comments
      .addCase(fetchComments.pending, (state) => {
        state.loadingComments = true;
        state.errorMessage = '';
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loadingComments = false;
        state.comments = action.payload;
        state.commentsCount = action.payload.length;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loadingComments = false;
        state.errorMessage = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
          visibilityTime: 3000,
        });
      })
      // Post Comment
      .addCase(postComment.pending, (state) => {
        state.loadingComments = true;
        state.errorMessage = '';
        state.successMessage = '';
      })
      .addCase(postComment.fulfilled, (state, action) => {
        state.loadingComments = false;
        state.successMessage = action.payload.message;
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: action.payload.message,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
          visibilityTime: 3000,
        });
      })
      .addCase(postComment.rejected, (state, action) => {
        state.loadingComments = false;
        state.errorMessage = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
          visibilityTime: 3000,
        });
      });
  },
});

export const { toggleLike, toggleSave, setReelData, clearMessages } =
  reelSlice.actions;
export default reelSlice.reducer;