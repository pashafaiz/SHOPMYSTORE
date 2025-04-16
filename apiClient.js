export const BASE_URL = 'https://shopmystore-backend-1.onrender.com/api';
import axios from 'axios';
import { Platform } from 'react-native';
const request = async (endpoint, method = 'GET', body = null, headers = {}) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error('API Error:', error);
    return { ok: false, data: { msg: 'Something went wrong' } };
  }
};

// Auth APIs
export const loginApi = (email, password) =>
  request('/auth/login', 'POST', { email, password });

export const signupApi = (formData) =>
  request('/auth/signup', 'POST', formData);

export const verifyOtpApi = (otp, email) =>
  request('/auth/verify-otp', 'POST', { otp, email });

export const resendOtpApi = (email) =>
  request('/auth/resend-otp', 'POST', { email });

export const editProfileApi = (token, fullName, userName) =>
  request('/auth/edit-profile', 'PUT', { fullName, userName }, {
    Authorization: `Bearer ${token}`,
  });

// Reels APIs
export const getReelsApi = () => request('/auth/reels', 'GET');

export const uploadReelApi = async (token, videoFile, caption = '', onProgress = null) => {
  const formData = new FormData();

  formData.append('video', {
    uri: Platform.OS === 'android' ? videoFile.uri : videoFile.uri.replace('file://', ''),
    name: videoFile.fileName || `reel_${Date.now()}.mp4`,
    type: videoFile.type || 'video/mp4',
  });

  formData.append('caption', caption);

  try {
    const response = await axios.post(`${BASE_URL}/auth/upload-reel`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return { ok: true, data: response.data };
  } catch (error) {
    console.error('Axios Upload Error:', error?.response?.data || error.message);
    return {
      ok: false,
      data: error?.response?.data || { msg: 'Upload failed via axios ❌' },
    };
  }
};

export default request;


// export const BASE_URL = 'https://shopmystore-backend-1.onrender.com/api';
// // For local testing: export const BASE_URL = 'http://192.168.1.x:3000/api';

// import axios from 'axios';
// import { Platform } from 'react-native';

// export const uploadReelApi = async (token, videoFile, caption = '', onProgress = null) => {
//   if (!token) {
//     console.error('No token provided');
//     return { ok: false, data: { msg: 'Authentication token is missing' } };
//   }

//   if (!videoFile || !videoFile.uri) {
//     console.error('No video file provided');
//     return { ok: false, data: { msg: 'Video file is required' } };
//   }

//   if (videoFile.duration && videoFile.duration > 60) {
//     console.error('Video duration exceeds limit');
//     return { ok: false, data: { msg: 'Video must be 1 minute or less' } };
//   }

//   console.log('Video File Details:', {
//     uri: videoFile.uri,
//     type: videoFile.type,
//     fileName: videoFile.fileName,
//     size: videoFile.fileSize,
//     duration: videoFile.duration,
//     originalPath: videoFile.originalPath,
//     timestamp: videoFile.timestamp,
//   });

//   const formData = new FormData();
//   let uri = videoFile.uri; // Prefer uri over originalPath to avoid sandbox issues

//   // Normalize URI to match Postman behavior
//   if (Platform.OS === 'android' && !uri.startsWith('file://')) {
//     uri = `file://${uri}`;
//   } else if (Platform.OS === 'ios') {
//     uri = uri.replace('file://', '');
//   }

//   const videoData = {
//     uri,
//     name: videoFile.fileName || `reel_${Date.now()}.mp4`,
//     type: videoFile.type || 'video/mp4',
//   };

//   console.log('FormData Video:', videoData);
//   formData.append('video', videoData);
//   formData.append('caption', caption || '');

//   console.log('FormData Prepared:', {
//     video: { uri: videoData.uri, name: videoData.name, type: videoData.type },
//     caption,
//   });

//   try {
//     const response = await axios.post(
//       `${BASE_URL}/auth/upload-reel`,
//       formData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           // Let axios handle Content-Type to match Postman
//         },
//         timeout: 900000, // 15 minutes to handle slow networks
//         onUploadProgress: (progressEvent) => {
//           if (onProgress && progressEvent.total) {
//             const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//             console.log('Upload Progress:', percent);
//             onProgress(percent);
//           }
//         },
//         maxContentLength: Infinity,
//         maxBodyLength: Infinity,
//         responseType: 'json',
//         // Add retry for network errors
//         validateStatus: (status) => status >= 200 && status < 300,
//       }
//     );

//     console.log('Upload Response:', response.data);
//     return { ok: true, data: response.data };
//   } catch (error) {
//     const errorData = error?.response?.data || { msg: error.message };
//     console.error('Axios Upload Error:', {
//       status: error?.response?.status,
//       data: errorData,
//       message: error.message,
//       code: error.code,
//       config: error.config?.url,
//       timestamp: new Date().toISOString(),
//     });

//     // Retry once for network errors
//     if (error.code === 'ERR_NETWORK') {
//       console.log('Retrying upload due to network error...');
//       try {
//         const retryResponse = await axios.post(
//           `${BASE_URL}/auth/upload-reel`,
//           formData,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//             timeout: 900000,
//             onUploadProgress: (progressEvent) => {
//               if (onProgress && progressEvent.total) {
//                 const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//                 console.log('Retry Upload Progress:', percent);
//                 onProgress(percent);
//               }
//             },
//             maxContentLength: Infinity,
//             maxBodyLength: Infinity,
//             responseType: 'json',
//           }
//         );
//         console.log('Retry Upload Response:', retryResponse.data);
//         return { ok: true, data: retryResponse.data };
//       } catch (retryError) {
//         const retryErrorData = retryError?.response?.data || { msg: retryError.message };
//         console.error('Retry Axios Upload Error:', {
//           status: retryError?.response?.status,
//           data: retryErrorData,
//           message: retryError.message,
//           code: retryError.code,
//           config: retryError.config?.url,
//           timestamp: new Date().toISOString(),
//         });
//         return { ok: false, data: { msg: retryErrorData.msg || 'Upload failed after retry' } };
//       }
//     }

//     return { ok: false, data: { msg: errorData.msg || 'Upload failed, please try again' } };
//   }
// };

// export const pingApi = async () => {
//   try {
//     const response = await axios.get(`${BASE_URL}/ping`, {
//       timeout: 10000,
//     });
//     console.log('Ping Response:', response.data);
//     return { ok: true, data: response.data };
//   } catch (error) {
//     console.error('Ping Error:', {
//       message: error.message,
//       status: error.response?.status,
//       code: error.code,
//       timestamp: new Date().toISOString(),
//     });
//     return { ok: false, data: { msg: error.message } };
//   }
// };
// // Auth APIs
// export const loginApi = async (email, password) => {
//   try {
//     const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
//     console.log('Login Response:', response.data);
//     return { ok: true, data: response.data };
//   } catch (error) {
//     console.error('Login Error:', error?.response?.data || error.message);
//     return { ok: false, data: error?.response?.data || { msg: 'Login failed' } };
//   }
// };

// export const signupApi = async (formData) => {
//   try {
//     const response = await axios.post(`${BASE_URL}/auth/signup`, formData);
//     return { ok: true, data: response.data };
//   } catch (error) {
//     console.error('Signup Error:', error?.response?.data || error.message);
//     return { ok: false, data: error?.response?.data || { msg: 'Signup failed' } };
//   }
// };

// export const verifyOtpApi = async (otp, email) => {
//   try {
//     const response = await axios.post(`${BASE_URL}/auth/verify-otp`, { otp, email });
//     return { ok: true, data: response.data };
//   } catch (error) {
//     console.error('Verify OTP Error:', error?.response?.data || error.message);
//     return { ok: false, data: error?.response?.data || { msg: 'OTP verification failed' } };
//   }
// };

// export const resendOtpApi = async (email) => {
//   try {
//     const response = await axios.post(`${BASE_URL}/auth/resend-otp`, { email });
//     return { ok: true, data: response.data };
//   } catch (error) {
//     console.error('Resend OTP Error:', error?.response?.data || error.message);
//     return { ok: false, data: error?.response?.data || { msg: 'Resend OTP failed' } };
//   }
// };

// export const editProfileApi = async (token, fullName, userName) => {
//   try {
//     const response = await axios.put(
//       `${BASE_URL}/auth/edit-profile`,
//       { fullName, userName },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     return { ok: true, data: response.data };
//   } catch (error) {
//     console.error('Edit Profile Error:', error?.response?.data || error.message);
//     return { ok: false, data: error?.response?.data || { msg: 'Edit profile failed' } };
//   }
// };

// // Reels APIs
// export const getReelsApi = async () => {
//   try {
//     const response = await axios.get(`${BASE_URL}/auth/reels`);
//     return { ok: true, data: response.data };
//   } catch (error) {
//     console.error('Get Reels Error:', error?.response?.data || error.message);
//     return { ok: false, data: error?.response?.data || { msg: 'Failed to fetch reels' } };
//   }
// };