// Reusable auth API helpers using Axios
import axios from 'axios';

const BASE_URL = 'https://api.swiftlyxpress.com';


const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' && localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors uniformly
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      'Request failed';
    
    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    
    throw customError;
  }
);

/**
 * Register a rider
 * @param {{fullName:string, email:string, password:string, role?:string}} payload
 */
export async function registerRider(payload) {
  return apiClient.post('/api/auth/register', {
    ...payload,
    role: payload.role || 'driver'
  });
}

/**
 * Register a customer
 * @param {{fullName:string,email:string,phone:string,password:string,role?:string}} payload
 */
export async function registerCustomer(payload) {
  return apiClient.post('/api/auth/register', {
    ...payload,
    role: payload.role || 'customer'
  });
}


export async function verifyEmail(payload) {
  const { userId, ...body } = payload;
  if (!userId) {
    throw new Error('userId is required for email verification');
  }
  return apiClient.post(`/api/auth/verify-email/${userId}`, body);
}

export async function resendVerification(payload) {
  const { userId, ...body } = payload;
  if (!userId) {
    throw new Error('userId is required for resend verification');
  }
  return apiClient.post(`/api/auth/resend-verification/${userId}`, body);
}

export async function login(payload) {
  return apiClient.post('/api/auth/login', payload);
}

export async function refreshToken(payload) {
  return apiClient.post('/api/auth/refresh', payload);
}


export async function getCurrentUser(token) {
  const t = token || (typeof window !== 'undefined' && localStorage.getItem('auth_token'));
  
  return apiClient.get('/api/auth/me', {
    headers: t ? { Authorization: `Bearer ${t}` } : {}
  });
}

export async function logout(payload = {}) {
  return apiClient.post('/api/auth/logout', payload);
}

export async function forgotPassword(payload) {
  return apiClient.post('/api/auth/forgot-password', payload);
}


export async function resetPassword(payload) {
  return apiClient.post('/api/auth/reset-password', payload);
}

export default {
  registerRider,
  registerCustomer,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  logout
};