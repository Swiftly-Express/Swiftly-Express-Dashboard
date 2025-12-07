// Reusable auth API helpers using Axios
import axios from 'axios';

const BASE_URL = 'https://api.swiftlyxpress.com';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

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

/**
 * Verify email (expects { userId, code })
 */
export async function verifyEmail(payload) {
  const { userId, ...body } = payload;
  if (!userId) {
    throw new Error('userId is required for email verification');
  }
  return apiClient.post(`/api/auth/verify-email/${userId}`, body);
}

/**
 * Resend verification code (expects { userId })
 */
export async function resendVerification(payload) {
  const { userId, ...body } = payload;
  if (!userId) {
    throw new Error('userId is required for resend verification');
  }
  return apiClient.post(`/api/auth/resend-verification/${userId}`, body);
}

/**
 * Login (customer or driver)
 * Expects payload: { email, password }
 * Returns whatever the backend returns (commonly a token + user data)
 */
export async function login(payload) {
  return apiClient.post('/api/auth/login', payload);
}

/**
 * Refresh access token using a refresh token
 * Expects payload: { refreshToken: string }
 */
export async function refreshToken(payload) {
  return apiClient.post('/api/auth/refresh', payload);
}

/**
 * Get current authenticated user (requires Authorization header)
 * If `token` is omitted the helper will try to read `auth_token` from localStorage.
 */
export async function getCurrentUser(token) {
  const t = token || (typeof window !== 'undefined' && localStorage.getItem('auth_token'));
  
  return apiClient.get('/api/auth/me', {
    headers: t ? { Authorization: `Bearer ${t}` } : {}
  });
}

/**
 * Logout by revoking refresh token on the server
 * Expects payload: { refreshToken }
 */
export async function logout(payload) {
  return apiClient.post('/api/auth/logout', payload);
}

/**
 * Request a password reset code/email
 * Expects payload: { email }
 */
export async function forgotPassword(payload) {
  return apiClient.post('/api/auth/forgot-password', payload);
}

/**
 * Reset password using token from email
 * Expects payload: { token, password, confirmPassword }
 */
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