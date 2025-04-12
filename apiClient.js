const BASE_URL = 'https://shopmystore-backend-1.onrender.com/api';

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

export const loginApi = (email, password) =>
  request('/auth/login', 'POST', { email, password });

export const signupApi = (formData) =>
  request('/auth/signup', 'POST', formData);

export const verifyOtpApi = (otp, email) =>
  request('/auth/verify-otp', 'POST', { otp, email });

export const resendOtpApi = (email) =>
    request('/auth/resend-otp', 'POST', { email });
  
export default request;
