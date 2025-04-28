import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Trace from './src/utils/Trace';

export const BASE_URL = 'https://shopmystore-backend-1.onrender.com/api';

const apiClient = axios.create();

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const request = async (config, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      Trace('API Request', { attempt, config });
      const response = await apiClient(config);
      Trace('API Response', { status: response.status, data: response.data });
      return { ok: true, data: response.data };
    } catch (error) {
      const errorData = error?.response?.data || { msg: error.message };
      Trace('API Error', {
        attempt,
        status: error?.response?.status,
        error: errorData,
      });
      if (attempt === retries) {
        return { ok: false, data: errorData };
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const createProductApi = async (token, productData) => {
  if (
    !productData?.name ||
    !productData?.price ||
    !productData?.createdBy ||
    !productData?.category ||
    !productData?.media?.length
  ) {
    Trace('Invalid Product Data', { productData });
    return { ok: false, data: { msg: 'Missing required fields or media' } };
  }

  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('description', productData.description || '');
  formData.append('price', productData.price.toString());
  formData.append('category', productData.category);
  formData.append('createdBy', productData.createdBy);

  productData.media.forEach((media, index) => {
    if (media.uri && !media.uri.startsWith('http')) {
      const file = {
        uri: Platform.OS === 'android' ? media.uri : media.uri.replace('file://', ''),
        name: media.fileName || `media_${Date.now()}_${index}.${media.mediaType === 'video' ? 'mp4' : 'jpg'}`,
        type: media.type || (media.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
      };
      formData.append('media', file);
    } else if (media.uri && media.uri.startsWith('http')) {
      formData.append('existingMedia', media.uri);
    }
  });

  return request({
    method: 'POST',
    url: `${BASE_URL}/products`,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
    timeout: 60000,
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
    Trace('Invalid Update Product Data', { id, productData });
    return { ok: false, data: { msg: 'Missing required fields or ID' } };
  }

  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('description', productData.description || '');
  formData.append('price', productData.price.toString());
  formData.append('category', productData.category);
  formData.append('createdBy', productData.createdBy);

  if (productData.media && productData.media.length > 0) {
    productData.media.forEach((media, index) => {
      if (media.uri && !media.uri.startsWith('http')) {
        const file = {
          uri: Platform.OS === 'android' ? media.uri : media.uri.replace('file://', ''),
          name: media.fileName || `media_${Date.now()}_${index}.${media.mediaType === 'video' ? 'mp4' : 'jpg'}`,
          type: media.type || (media.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        };
        formData.append('media', file);
      } else if (media.url || (media.uri && media.uri.startsWith('http'))) {
        formData.append('existingMedia', media.url || media.uri);
      }
    });
  }

  return request({
    method: 'PUT',
    url: `${BASE_URL}/products/${id}`,
    headers: {
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
    timeout: 15150,
  });
};

export const getProductApi = async (productId) => {
  if (!productId) {
    Trace('Invalid Product ID', { productId });
    return { ok: false, data: { msg: 'Missing product ID' } };
  }

  return request({
    method: 'GET',
    url: `${BASE_URL}/products/${productId}`,
    timeout: 15000,
  });
};

export const deleteProductApi = async (token, id) => {
  if (!id) {
    Trace('Invalid Product ID', { id });
    return { ok: false, data: { msg: 'Missing product ID' } };
  }

  return request({
    method: 'DELETE',
    url: `${BASE_URL}/products/${id}`,
    timeout: 15000,
  });
};

export const getRelatedProductsApi = async (productId) => {
  if (!productId) {
    Trace('Invalid Product ID', { productId });
    return { ok: false, data: { msg: 'Missing product ID' } };
  }

  return request({
    method: 'GET',
    url: `${BASE_URL}/products/${productId}/related`,
    timeout: 15000,
  });
};

export const getProductsByCategoryApi = async (category) => {
  if (!category) {
    Trace('Missing category parameter');
    return { ok: false, data: { msg: 'Category is required' } };
  }

  return request({
    method: 'GET',
    url: `${BASE_URL}/products/category/${category}`,
    timeout: 15000,
  });
};

export const editProfileApi = async (token, fullName, userName) => {
  if (!fullName || !userName) {
    Trace('Invalid Profile Data', { fullName, userName });
    return { ok: false, data: { msg: 'Missing fullName or userName' } };
  }

  return request({
    method: 'PUT',
    url: `${BASE_URL}/auth/edit-profile`,
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      fullName,
      userName,
    },
    timeout: 30000,
  });
};

export const uploadReelApi = async (token, formData, onProgress = null) => {
  if (!formData) {
    Trace('Invalid FormData', { formData });
    return { ok: false, data: { msg: 'No form data provided' } };
  }

  return request({
    method: 'POST',
    url: `${BASE_URL}/reels/upload-reel`,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
    timeout: 60000,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        Trace('Upload Progress', { percent });
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
  if (!reelId || !commentData) {
    Trace('Invalid Comment Data', { reelId, commentData });
    return { ok: false, data: { msg: 'Missing reel ID or comment data' } };
  }

  return request({
    method: 'POST',
    url: `${BASE_URL}/reels/${reelId}/comments`,
    data: commentData,
    timeout: 15000,
  });
};

export const getCommentsApi = async (reelId) => {
  if (!reelId) {
    Trace('Invalid Reel ID', { reelId });
    return { ok: false, data: { msg: 'Missing reel ID' } };
  }

  return request({
    method: 'GET',
    url: `${BASE_URL}/reels/${reelId}/comments`,
    timeout: 15000,
  });
};

export const loginApi = (email, password) => {
  if (!email || !password) {
    Trace('Invalid Login Data', { email });
    return { ok: false, data: { msg: 'Missing email or password' } };
  }

  return request({
    method: 'POST',
    url: `${BASE_URL}/auth/login`,
    data: { email, password },
    timeout: 15000,
  });
};

export const signupApi = (formData) => {
  if (!formData?.email || !formData?.password || !formData?.fullName) {
    Trace('Invalid Signup Data', { formData });
    return { ok: false, data: { msg: 'Missing required fields' } };
  }

  return request({
    method: 'POST',
    url: `${BASE_URL}/auth/signup`,
    data: formData,
    timeout: 15000,
  });
};

export const verifyOtpApi = (otp, email) => {
  if (!otp || !email) {
    Trace('Invalid OTP Data', { otp, email });
    return { ok: false, data: { msg: 'Missing OTP or email' } };
  }

  return request({
    method: 'POST',
    url: `${BASE_URL}/auth/verify-otp`,
    data: { otp, email },
    timeout: 15000,
  });
};

export const resendOtpApi = (email) => {
  if (!email) {
    Trace('Invalid Email', { email });
    return { ok: false, data: { msg: 'Missing email' } };
  }

  return request({
    method: 'POST',
    url: `${BASE_URL}/auth/resend-otp`,
    data: { email },
    timeout: 15000,
  });
};

export const getUserProfileApi = async (userId) => {
  if (!userId) {
    Trace('Invalid User ID', { userId });
    return { ok: false, data: { msg: 'Missing user ID' } };
  }

  return request({
    method: 'GET',
    url: `${BASE_URL}/auth/user/${userId}`,
    timeout: 15000,
  });
};

export const addToCartApi = async (token, productId) => {
  if (!productId) {
    console.error('Invalid Product ID', { productId });
    return { ok: false, data: { msg: 'Missing product ID' } };
  }

  try {
    const response = await request({
      method: 'POST',
      url: `${BASE_URL}/products/cart/${productId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000,
    });
    return { ok: true, data: response.data };
  } catch (error) {
    console.error('Add to cart error:', error.response?.data || error.message);
    return { 
      ok: false, 
      data: error.response?.data || { msg: 'Failed to add to cart' } 
    };
  }
};

export const removeFromCartApi = async (token, productId) => {
  if (!productId) {
    console.error('Invalid Product ID', { productId });
    return { ok: false, data: { msg: 'Missing product ID' } };
  }

  if (!token) {
    console.error('Missing token');
    return { ok: false, data: { msg: 'Authentication token is missing' } };
  }

  try {
    const response = await request({
      method: 'DELETE',
      url: `${BASE_URL}/products/cart/${productId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    });
    if (response.status === 204) {
      return { ok: true, data: {} };
    }
    return { ok: true, data: response.data };
  } catch (error) {
    console.error('Remove from cart error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    return {
      ok: false,
      data: error.response?.data || { msg: 'Failed to remove from cart' },
    };
  }
};

export const getCartApi = async () => {
  return request({
    method: 'GET',
    url: `${BASE_URL}/products/cart`,
    timeout: 15000,
  });
};

export const toggleLikeApi = async (token, productId) => {
  if (!productId) {
    Trace('Invalid Product ID', { productId });
    return { ok: false, data: { msg: 'Missing product ID' } };
  }

  return request({
    method: 'POST',
    url: `${BASE_URL}/products/wishlist/${productId}`,
    timeout: 15000,
  });
};

export const getWishlistApi = async () => {
  return request({
    method: 'GET',
    url: `${BASE_URL}/products/wishlist`,
    timeout: 15000,
  });
};

export const removeFromWishlistApi = async (productId) => {
  if (!productId) {
    Trace('Invalid Product ID', { productId });
    return { ok: false, data: { msg: 'Missing product ID' } };
  }

  return request({
    method: 'DELETE',
    url: `${BASE_URL}/products/wishlist/${productId}`,
    timeout: 15000,
  });
};