import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import Trace from '../../utils/Trace';
import {
  BASE_URL,
  REELS_ENDPOINT,
  COMMENTS_ENDPOINT,
  HTTP_METHODS,
  FETCH_REELS_ERROR,
  FETCH_COMMENTS_ERROR,
  POST_COMMENT_ERROR,
  NETWORK_ERROR,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
} from '../../constants/GlobalConstants';

// Async thunk for fetching all reels
export const fetchReels = createAsyncThunk(
  'reels/fetchReels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}${REELS_ENDPOINT}`, {
        method: HTTP_METHODS.GET,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const text = await response.text();
      console.log('Fetch Reels Raw Response:', {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        body: text.substring(0, 500),
      });

      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.error('JSON Parse Error:', error, 'Raw Body:', text.substring(0, 500));
        return rejectWithValue('Invalid response format: Expected JSON');
      }

      console.log('Fetch Reels Parsed Response:', data);

      if (response.ok) {
        const reels = Array.isArray(data.reels) ? data.reels : [];
        if (reels.length === 0) {
          console.warn('No reels found in response');
        }
        const normalizedReels = reels.map((reel) => ({
          ...reel,
          _id: reel._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
          videoUrl:
            reel.videoUrl && reel.videoUrl.startsWith('http')
              ? reel.videoUrl
              : `${BASE_URL.replace('/api', '')}/${(reel.videoUrl || '').replace(/^\/+/, '')}`,
          caption: reel.caption || 'No caption',
          user: {
            _id: reel.user?._id || 'unknown',
            userName: reel.user?.userName || 'unknown',
            avatar: reel.user?.avatar || 'https://via.placeholder.com/40',
          },
          likes: Number(reel.likes) || 0,
          comments: Number(reel.comments) || 0,
          createdAt: reel.createdAt || new Date().toISOString(),
        }));
        return normalizedReels;
      } else {
        const errorMsg = data.msg || `${FETCH_REELS_ERROR} (Status: ${response.status})`;
        console.warn('Fetch Reels Failed:', errorMsg);
        return rejectWithValue(errorMsg);
      }
    } catch (error) {
      Trace('Fetch reels error:', error);
      console.error('Fetch reels error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Async thunk for fetching comments for a reel
export const fetchComments = createAsyncThunk(
  'reels/fetchComments',
  async (reelId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}${COMMENTS_ENDPOINT}/${reelId}`, {
        method: HTTP_METHODS.GET,
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if required
        },
      });
      const text = await response.text();
      console.log('Fetch Comments Raw Response:', {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        body: text.substring(0, 500),
      });

      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.error('JSON Parse Error:', error, 'Raw Body:', text.substring(0, 500));
        return rejectWithValue('Invalid response format: Expected JSON');
      }

      if (response.ok) {
        const normalizedComments = (data.comments || []).map((comment) => ({
          _id: comment._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
          userName: comment.userName || 'unknown',
          text: comment.text || '',
        }));
        return { reelId, comments: normalizedComments };
      } else {
        const errorMsg = data.msg || FETCH_COMMENTS_ERROR;
        console.warn('Fetch Comments Failed:', errorMsg);
        return rejectWithValue(errorMsg);
      }
    } catch (error) {
      Trace('Fetch comments error:', error);
      console.error('Fetch comments error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

// Async thunk for posting a comment
export const postComment = createAsyncThunk(
  'reels/postComment',
  async ({ reelId, text }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}${COMMENTS_ENDPOINT}/${reelId}`, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if required
        },
        body: JSON.stringify({ text }),
      });
      const text = await response.text();
      console.log('Post Comment Raw Response:', {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        body: text.substring(0, 500),
      });

      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.error('JSON Parse Error:', error, 'Raw Body:', text.substring(0, 500));
        return rejectWithValue('Invalid response format: Expected JSON');
      }

      if (response.ok) {
        return {
          reelId,
          comment: {
            _id: data._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
            userName: data.userName || 'unknown',
            text,
          },
        };
      } else {
        const errorMsg = data.msg || POST_COMMENT_ERROR;
        console.warn('Post Comment Failed:', errorMsg);
        return rejectWithValue(errorMsg);
      }
    } catch (error) {
      Trace('Post comment error:', error);
      console.error('Post comment error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

const reelsSlice = createSlice({
  name: 'reels',
  initialState: {
    reels: [],
    comments: {},
    loading: false,
    refreshing: false,
    error: null,
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
      // Fetch Reels
      .addCase(fetchReels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReels.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.reels = action.payload;
      })
      .addCase(fetchReels.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error Fetching Reels',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Fetch Comments
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments[action.payload.reelId] = action.payload.comments;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error Fetching Comments',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      // Post Comment
      .addCase(postComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postComment.fulfilled, (state, action) => {
        state.loading = false;
        const { reelId, comment } = action.payload;
        state.comments[reelId] = [...(state.comments[reelId] || []), comment];
        const reel = state.reels.find((r) => r._id === reelId);
        if (reel) reel.comments = (reel.comments || 0) + 1;
      })
      .addCase(postComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error Posting Comment',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      });
  },
});

export const { setRefreshing, clearError } = reelsSlice.actions;

export default reelsSlice.reducer;