import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import Trace from '../../utils/Trace';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASE_URL,
  UPLOAD_REEL_ENDPOINT,
  UPLOAD_REEL_ERROR,
  NETWORK_ERROR,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  HTTP_METHODS,
} from '../../constants/GlobalConstants';

// Async thunk for uploading a reel with progress tracking
export const uploadReel = createAsyncThunk(
  'uploadReel/uploadReel',
  async ({ video, caption }, { rejectWithValue, dispatch }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication required');

      const formData = new FormData();
      formData.append('video', {
        uri: video.uri,
        name: video.fileName,
        type: video.type,
      });
      formData.append('caption', caption.trim());

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(HTTP_METHODS.POST, `${BASE_URL}${UPLOAD_REEL_ENDPOINT}`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded * 100) / event.total);
            Trace('Upload Progress', { percent });
            dispatch(setUploadProgress(percent));
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log('Upload Reel Raw Response:', {
              status: xhr.status,
              responseText: xhr.responseText.substring(0, 500),
            });

            let data;
            try {
              data = JSON.parse(xhr.responseText);
            } catch (error) {
              console.error('JSON Parse Error:', error, 'Raw Body:', xhr.responseText.substring(0, 500));
              reject(rejectWithValue('Invalid response format: Expected JSON'));
              return;
            }

            console.log('Upload Reel Parsed Response:', data);

            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ reel: data });
            } else {
              const errorMsg = data.msg || `${UPLOAD_REEL_ERROR} (Status: ${xhr.status})`;
              console.warn('Upload Reel Failed:', errorMsg);
              reject(rejectWithValue(errorMsg));
            }
          }
        };

        xhr.onerror = () => {
          const errorMsg = NETWORK_ERROR;
          console.error('Upload Reel Network Error:', errorMsg);
          reject(rejectWithValue(errorMsg));
        };

        xhr.send(formData);
      });
    } catch (error) {
      Trace('Upload reel error:', error);
      console.error('Upload reel error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return rejectWithValue(error.message || NETWORK_ERROR);
    }
  }
);

const uploadReelSlice = createSlice({
  name: 'uploadReel',
  initialState: {
    video: null,
    caption: '',
    loading: false,
    uploadProgress: 0,
    error: null,
    paused: true,
    currentTime: 0,
    duration: 0,
    showProgress: true,
    success: false, // Added to track successful upload
  },
  reducers: {
    setVideo: (state, action) => {
      state.video = action.payload;
      state.duration = action.payload?.duration || 0;
      state.currentTime = 0;
      state.paused = true;
      state.showProgress = true;
    },
    removeVideo: (state) => {
      state.video = null;
      state.paused = true;
      state.currentTime = 0;
      state.duration = 0;
      state.showProgress = true;
    },
    setCaption: (state, action) => {
      state.caption = action.payload;
    },
    setPaused: (state, action) => {
      state.paused = action.payload;
    },
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action) => {
      state.duration = action.payload;
    },
    setShowProgress: (state, action) => {
      state.showProgress = action.payload;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetUploadState: (state) => {
      state.video = null;
      state.caption = '';
      state.loading = false;
      state.uploadProgress = 0;
      state.error = null;
      state.paused = true;
      state.currentTime = 0;
      state.duration = 0;
      state.showProgress = true;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadReel.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
        state.success = false;
      })
      .addCase(uploadReel.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadProgress = 100;
        state.success = true;
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: 'Your reel has been uploaded successfully!',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .addCase(uploadReel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.uploadProgress = 0;
        state.success = false;
        Toast.show({
          type: 'error',
          text1: 'Error Uploading Reel',
          text2: action.payload,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      });
  },
});

export const {
  setVideo,
  removeVideo,
  setCaption,
  setPaused,
  setCurrentTime,
  setDuration,
  setShowProgress,
  setUploadProgress,
  clearError,
  resetUploadState,
} = uploadReelSlice.actions;

export default uploadReelSlice.reducer;