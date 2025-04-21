import axios from 'axios';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://shopmystore-backend-1.onrender.com/api';

const log = (message, data = {}) => {
  console.log(
    JSON.stringify(
      {timestamp: new Date().toISOString(), message, ...data},
      null,
      2,
    ),
  );
};

const request = async (config, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log('API Request', {attempt, config});
      const response = await axios(config);
      log('API Response', {status: response.status, data: response.data});
      return {ok: true, data: response.data};
    } catch (error) {
      const errorData = error?.response?.data || {msg: error.message};
      log('API Error', {
        attempt,
        status: error?.response?.status,
        error: errorData,
      });
      if (attempt === retries) {
        return {ok: false, data: errorData};
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Interceptor to add token to all requests
axios.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// apiClient.js (partial update)
export const createProductApi = async (token, productData) => {
  if (
    !productData?.name ||
    !productData?.price ||
    !productData?.createdBy ||
    !productData?.category ||
    !productData?.media?.length
  ) {
    log('Invalid Product Data', {productData});
    return {ok: false, data: {msg: 'Missing required fields or media'}};
  }

  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('description', productData.description || '');
  formData.append('price', productData.price.toString());
  formData.append('category', productData.category); // Add category
  formData.append('createdBy', productData.createdBy);
  productData.media.forEach((media, index) => {
    if (media.uri && !media.uri.startsWith('http')) {
      formData.append('media', {
        uri:
          Platform.OS === 'android'
            ? media.uri
            : media.uri.replace('file://', ''),
        name:
          media.fileName ||
          `media_${Date.now()}_${index}.${
            media.mediaType === 'video' ? 'mp4' : 'jpg'
          }`,
        type:
          media.type ||
          (media.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
      });
    } else if (media.uri && media.uri.startsWith('http')) {
      formData.append('media', media.uri); // Existing Cloudinary URL
    }
  });

  return request({
    method: 'POST',
    url: `${BASE_URL}/products`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
    timeout: 60000, // Increased for multiple files
  });
};

export const updateProductApi = async (token, id, productData) => {
  if (
    !id ||
    !productData?.name ||
    !productData?.price ||
    !productData?.createdBy ||
    !productData?.category
  ) {
    log('Invalid Update Product Data', {id, productData});
    return {ok: false, data: {msg: 'Missing required fields or ID'}};
  }

  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('description', productData.description || '');
  formData.append('price', productData.price.toString());
  formData.append('category', productData.category); // Add category
  formData.append('createdBy', productData.createdBy);

  if (productData.media && productData.media.length > 0) {
    productData.media.forEach((media, index) => {
      if (media.uri && !media.uri.startsWith('http')) {
        formData.append('media', {
          uri:
            Platform.OS === 'android'
              ? media.uri
              : media.uri.replace('file://', ''),
          name:
            media.fileName ||
            `media_${Date.now()}_${index}.${
              media.mediaType === 'video' ? 'mp4' : 'jpg'
            }`,
          type:
            media.type ||
            (media.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        });
      } else if (media.uri && media.uri.startsWith('http')) {
        formData.append('media', media.uri);
      }
    });
  }

  return request({
    method: 'PUT',
    url: `${BASE_URL}/products/${id}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
    timeout: 60000,
  });
};

export const getAllProductsApi = async () => {
  return request({
    method: 'GET',
    url: `${BASE_URL}/products`,
    timeout: 15000,
  });
};

export const getProductApi = async productId => {
  return request({
    method: 'GET',
    url: `${BASE_URL}/products/${productId}`,
    timeout: 15000,
  });
};

export const deleteProductApi = async (token, id) => {
  if (!id) {
    log('Invalid Product ID', {id});
    return {ok: false, data: {msg: 'Missing product ID'}};
  }

  return request({
    method: 'DELETE',
    url: `${BASE_URL}/products/${id}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 15000,
  });
};

export const getRelatedProductsApi = async productId => {
  return request({
    method: 'GET',
    url: `${BASE_URL}/products/${productId}/related`,
    timeout: 15000,
  });
};

export const getProductsByCategoryApi = async category => {
  if (!category) {
    log('Missing category parameter');
    return {ok: false, data: {msg: 'Category is required'}};
  }

  return request({
    method: 'GET',
    url: `${BASE_URL}/products/category/${category}`,
    timeout: 15000,
  });
};

export const editProfileApi = async (token, fullName, userName) => {
  if (!fullName || !userName) {
    log('Invalid Profile Data', {fullName, userName});
    return {ok: false, data: {msg: 'Missing fullName or userName'}};
  }

  const formData = new FormData();
  formData.append('fullName', fullName);
  formData.append('userName', userName);

  return request({
    method: 'PUT',
    url: `${BASE_URL}/auth/edit-profile`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      fullName,
      userName,
    },
    timeout: 30000,
  });
};
// Reels API
export const uploadReelApi = async (token, formData, onProgress = null) => {
  if (!formData) {
    log('Invalid FormData', {formData});
    return {ok: false, data: {msg: 'No form data provided'}};
  }

  return request({
    method: 'POST',
    url: `${BASE_URL}/reels/upload-reel`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
    timeout: 60000,
    onUploadProgress: progressEvent => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        log('Upload Progress', {percent});
        onProgress(percent);
      }
    },
  });
};

export const getReelsApi = async () => {
  return request({
    method: 'GET',
    url: `${BASE_URL}/reels/reels`,
    timeout: 15000,
  });
};

export const postCommentApi = async (reelId, commentData) => {
  return request({
    method: 'POST',
    url: `${BASE_URL}/reels/${reelId}/comments`,
    data: commentData,
    timeout: 15000,
  });
};

export const getCommentsApi = async reelId => {
  return request({
    method: 'GET',
    url: `${BASE_URL}/reels/${reelId}/comments`,
    timeout: 15000,
  });
};

// Authentication APIs
export const loginApi = (email, password) =>
  request({
    method: 'POST',
    url: `${BASE_URL}/auth/login`,
    data: {email, password},
    timeout: 15000,
  });

export const signupApi = formData =>
  request({
    method: 'POST',
    url: `${BASE_URL}/auth/signup`,
    data: formData,
    timeout: 15000,
  });

export const verifyOtpApi = (otp, email) =>
  request({
    method: 'POST',
    url: `${BASE_URL}/auth/verify-otp`,
    data: {otp, email},
    timeout: 15000,
  });

export const resendOtpApi = email =>
  request({
    method: 'POST',
    url: `${BASE_URL}/auth/resend-otp`,
    data: {email},
    timeout: 15000,
  });
