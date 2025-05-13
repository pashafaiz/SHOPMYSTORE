import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASE_URL,
  REELS_ENDPOINT,
  HTTP_METHODS,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  USER_TOKEN_KEY,
} from '../../constants/GlobalConstants';
import Toast from 'react-native-toast-message';

// Helper function to handle API responses
const handleApiResponse = async (response) => {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('JSON Parse Error:', error, 'Raw Body:', text.substring(0, 500));
    throw new Error('Invalid response format: Expected JSON');
  }

  if (!response.ok) {
    throw new Error(data.msg || `Request failed with status ${response.status}`);
  }

  return data;
};

// Async thunk for fetching all reels
export const fetchReels = createAsyncThunk(
  'reels/fetchReels',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      let currentUserId = null;

      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          currentUserId = decoded.userId;
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }

      const response = await fetch(`${BASE_URL}${REELS_ENDPOINT}`, {
        method: HTTP_METHODS.GET,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await handleApiResponse(response);
      const reels = Array.isArray(data.reels) ? data.reels : [];

      return reels.map((reel) => ({
        ...reel,
        _id: reel._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
        videoUrl: reel.videoUrl?.startsWith('http')
          ? reel.videoUrl
          : `${BASE_URL.replace('/api', '')}/${(reel.videoUrl || '').replace(/^\/+/, '')}`,
        caption: reel.caption || 'No caption',
        user: {
          _id: reel.user?._id || 'unknown',
          userName: reel.user?.userName || 'unknown',
          avatar: reel.user?.avatar || 'https://via.placeholder.com/40',
        },
        likes: Array.isArray(reel.likes) ? reel.likes.length : 0,
        comments: Array.isArray(reel.comments) ? reel.comments.length : 0,
        isLiked: currentUserId && Array.isArray(reel.likes) ? reel.likes.includes(currentUserId) : false,
        createdAt: reel.createdAt || new Date().toISOString(),
      }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching comments for a reel
export const fetchComments = createAsyncThunk(
  'reels/fetchComments',
  async (reelId, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (!token) {
        return { reelId, comments: [] };
      }

      const response = await fetch(`${BASE_URL}/api/reels/${reelId}/comments`, {
        method: HTTP_METHODS.GET,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);

      return {
        reelId,
        comments: (data.comments || []).map((comment) => ({
          _id: comment._id,
          userName: comment.user?.userName || comment.userName || 'unknown',
          text: comment.text || '',
          userId: comment.user?._id || comment.userId || 'unknown',
          avatar: comment.user?.avatar || 'https://via.placeholder.com/40',
          createdAt: comment.createdAt || new Date().toISOString(),
        })).filter((comment) => comment._id),
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for posting a comment
export const postComment = createAsyncThunk(
  'reels/postComment',
  async ({ reelId, text }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${BASE_URL}/api/reels/${reelId}/comments`, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await handleApiResponse(response);

      if (!data._id) {
        throw new Error('Comment created but no valid ID returned');
      }

      // Get current user info from token
      const decoded = JSON.parse(atob(token.split('.')[1]));

      return {
        reelId,
        comment: {
          _id: data._id,
          userName: decoded.userName || 'unknown',
          text,
          userId: decoded.userId || 'unknown',
          avatar: decoded.avatar || 'https://via.placeholder.com/40',
          createdAt: data.createdAt || new Date().toISOString(),
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for liking a reel
export const likeReel = createAsyncThunk(
  'reels/likeReel',
  async (reelId, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${BASE_URL}/api/reels/${reelId}/like`, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      await handleApiResponse(response);

      return { reelId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for unliking a reel
export const unlikeReel = createAsyncThunk(
  'reels/unlikeReel',
  async (reelId, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${BASE_URL}/api/reels/${reelId}/unlike`, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      await handleApiResponse(response);

      return { reelId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting a comment
export const deleteComment = createAsyncThunk(
  'reels/deleteComment',
  async ({ reelId, commentId }, { rejectWithValue }) => {
    try {
      if (commentId.startsWith('temp_')) {
        throw new Error('Cannot delete comment with temporary ID');
      }

      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${BASE_URL}/api/reels/comments/${commentId}`, {
        method: HTTP_METHODS.DELETE,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      await handleApiResponse(response);

      return { reelId, commentId };
    } catch (error) {
      return rejectWithValue(error.message);
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
    commentsRefreshing: {},
    error: null,
    pendingComments: {},
    commentsLoading: {},
  },
  reducers: {
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    setCommentsRefreshing: (state, action) => {
      const { reelId, refreshing } = action.payload;
      state.commentsRefreshing[reelId] = refreshing;
    },
    clearError: (state) => {
      state.error = null;
    },
    addPendingComment: (state, action) => {
      const { reelId, comment } = action.payload;
      if (!state.pendingComments[reelId]) {
        state.pendingComments[reelId] = [];
      }
      state.pendingComments[reelId].push(comment);
    },
    removePendingComment: (state, action) => {
      const { reelId, commentId } = action.payload;
      if (state.pendingComments[reelId]) {
        state.pendingComments[reelId] = state.pendingComments[reelId].filter(
          (c) => c._id !== commentId
        );
      }
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
      })

      // Fetch Comments
      .addCase(fetchComments.pending, (state, action) => {
        const reelId = action.meta.arg;
        state.commentsLoading[reelId] = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { reelId, comments } = action.payload;
        state.comments[reelId] = comments;
        state.commentsLoading[reelId] = false;
        state.commentsRefreshing[reelId] = false;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        const reelId = action.meta.arg;
        state.commentsLoading[reelId] = false;
        state.commentsRefreshing[reelId] = false;
        state.error = action.payload;
      })

      // Post Comment
      .addCase(postComment.pending, (state, action) => {
        state.error = null;
        const { reelId, text } = action.meta.arg;
        const tempId = `temp_${Math.random().toString(36).substr(2, 9)}`;
        const token = AsyncStorage.getItem(USER_TOKEN_KEY);
        let decoded;
        try {
          decoded = token ? JSON.parse(atob(token.split('.')[1])) : {};
        } catch (e) {
          console.error('Token decode error:', e);
          decoded = {};
        }
        const pendingComment = {
          _id: tempId,
          userName: decoded?.userName || 'unknown',
          text,
          userId: decoded?.userId || 'unknown',
          avatar: decoded?.avatar || 'https://via.placeholder.com/40',
          isPending: true,
          createdAt: new Date().toISOString(),
        };
        state.pendingComments[reelId] = [...(state.pendingComments[reelId] || []), pendingComment];
        const reelIndex = state.reels.findIndex((r) => r._id === reelId);
        if (reelIndex !== -1) {
          state.reels[reelIndex].comments += 1;
        }
      })
      .addCase(postComment.fulfilled, (state, action) => {
        const { reelId, comment } = action.payload;
        state.comments[reelId] = [...(state.comments[reelId] || []), comment];
        state.pendingComments[reelId] = (state.pendingComments[reelId] || []).filter(
          (c) => c._id !== comment._id
        );
      })
      .addCase(postComment.rejected, (state, action) => {
        state.error = action.payload;
        const { reelId } = action.meta.arg;
        state.pendingComments[reelId] = (state.pendingComments[reelId] || []).filter(
          (c) => !c.isPending
        );
        const reelIndex = state.reels.findIndex((r) => r._id === reelId);
        if (reelIndex !== -1) {
          state.reels[reelIndex].comments = Math.max(0, state.reels[reelIndex].comments - 1);
        }
      })

      // Like Reel
      .addCase(likeReel.pending, (state, action) => {
        const reelId = action.meta.arg;
        const reelIndex = state.reels.findIndex((r) => r._id === reelId);
        if (reelIndex !== -1) {
          state.reels[reelIndex].likes += 1;
          state.reels[reelIndex].isLiked = true;
        }
      })
      .addCase(likeReel.fulfilled, (state, action) => {
        // No need to update likes count here since it's managed optimistically
      })
      .addCase(likeReel.rejected, (state, action) => {
        state.error = action.payload;
        const reelId = action.meta.arg;
        const reelIndex = state.reels.findIndex((r) => r._id === reelId);
        if (reelIndex !== -1) {
          state.reels[reelIndex].likes = Math.max(0, state.reels[reelIndex].likes - 1);
          state.reels[reelIndex].isLiked = false;
        }
      })

      // Unlike Reel
      .addCase(unlikeReel.pending, (state, action) => {
        const reelId = action.meta.arg;
        const reelIndex = state.reels.findIndex((r) => r._id === reelId);
        if (reelIndex !== -1) {
          state.reels[reelIndex].likes = Math.max(0, state.reels[reelIndex].likes - 1);
          state.reels[reelIndex].isLiked = false;
        }
      })
      .addCase(unlikeReel.fulfilled, (state, action) => {
        // No need to update likes count here since it's managed optimistically
      })
      .addCase(unlikeReel.rejected, (state, action) => {
        state.error = action.payload;
        const reelId = action.meta.arg;
        const reelIndex = state.reels.findIndex((r) => r._id === reelId);
        if (reelIndex !== -1) {
          state.reels[reelIndex].likes += 1;
          state.reels[reelIndex].isLiked = true;
        }
      })

      // Delete Comment
      .addCase(deleteComment.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { reelId, commentId } = action.payload;
        state.comments[reelId] = state.comments[reelId].filter(
          (comment) => comment._id !== commentId
        );
        const reelIndex = state.reels.findIndex((r) => r._id === reelId);
        if (reelIndex !== -1) {
          state.reels[reelIndex].comments = Math.max(0, state.reels[reelIndex].comments - 1);
        }
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setRefreshing, setCommentsRefreshing, clearError, addPendingComment, removePendingComment } = reelsSlice.actions;

export default reelsSlice.reducer;