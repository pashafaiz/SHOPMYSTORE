import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import {
  BASE_URL,
  COMMENTS_ENDPOINT,
  HTTP_METHODS,
  FETCH_COMMENTS_ERROR,
  POST_COMMENT_ERROR,
  GENERIC_ERROR,
  TOAST_POSITION,
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
    throw new Error(GENERIC_ERROR);
  }
};

// Async thunk for fetching comments
export const fetchComments = createAsyncThunk(
  'reel/fetchComments',
  async (reelId, { rejectWithValue }) => {
    try {
      const url = `${BASE_URL}${COMMENTS_ENDPOINT}/${reelId}`;
      const { ok, data } = await makeApiRequest(url, HTTP_METHODS.GET);
      if (ok) {
        return data.comments || [];
      } else {
        return rejectWithValue(data.msg || FETCH_COMMENTS_ERROR);
      }
    } catch (error) {
      return rejectWithValue(error.message || GENERIC_ERROR);
    }
  }
);

// Async thunk for posting a comment
export const postComment = createAsyncThunk(
  'reel/postComment',
  async ({ reelId, text }, { rejectWithValue }) => {
    try {
      const url = `${BASE_URL}${COMMENTS_ENDPOINT}/${reelId}`;
      const { ok, data } = await makeApiRequest(url, HTTP_METHODS.POST, { text });
      if (ok) {
        return { message: 'Comment posted successfully' };
      } else {
        return rejectWithValue(data.msg || POST_COMMENT_ERROR);
      }
    } catch (error) {
      return rejectWithValue(error.message || GENERIC_ERROR);
    }
  }
);

const reelSlice = createSlice({
  name: 'reel',
  initialState: {
    reelData: null,
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
    setReelData: (state, action) => {
      state.reelData = action.payload;
      state.liked = false;
      state.saved = false;
      state.likesCount = action.payload?.likes || 0;
      state.commentsCount = action.payload?.comments || 0;
      state.comments = [];
    },
    toggleLike: (state) => {
      state.liked = !state.liked;
      state.likesCount = state.liked
        ? state.likesCount + 1
        : Math.max(0, state.likesCount - 1);
    },
    toggleSave: (state) => {
      state.saved = !state.saved;
    },
    clearMessages: (state) => {
      state.successMessage = '';
      state.errorMessage = '';
    },
    resetReelState: (state) => {
      state.reelData = null;
      state.comments = [];
      state.liked = false;
      state.saved = false;
      state.likesCount = 0;
      state.commentsCount = 0;
      state.loadingComments = false;
      state.errorMessage = '';
      state.successMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
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
          visibilityTime: 3000,
        });
      })
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
          position: 'bottom',
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
          position: 'bottom',
          visibilityTime: 3000,
        });
      });
  },
});

export const { 
  setReelData, 
  toggleLike, 
  toggleSave, 
  clearMessages, 
  resetReelState 
} = reelSlice.actions;

export default reelSlice.reducer;