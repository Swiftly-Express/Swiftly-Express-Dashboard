// Reusable auth API helpers using Axios
import axios from 'axios';

const BASE_URL = 'https://api.swiftlyxpress.com';


const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  withCredentials: true // Send cookies with requests automatically
});

// Cookie helpers (client-side)
function setCookie(name, value, days = 7) {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
  try { document.cookie = cookie; } catch (e) { /* ignore */ }
}

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Expires=${new Date(0).toUTCString()}; Path=/;`;
}

// Request interceptor - no manual token attachment needed
// Browser automatically sends HttpOnly cookies when withCredentials:true
apiClient.interceptors.request.use(
  (config) => {
    // No manual Authorization header - server reads auth from HttpOnly cookie
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

// ============ Auth Helper Functions ============

/**
 * Check if user is authenticated (has a valid token)
 * @returns {boolean}
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  
  // Check if server-set auth cookie exists
  const cookieToken = getCookie('auth_token');
  if (cookieToken) return true;

  // Fallback: check if user_data exists (indicates logged-in state)
  const userData = localStorage.getItem('user_data');
  if (userData) return true;

  return false;
}

/**
 * Retrieve the stored authentication token
 * @returns {string|null}
 */
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  
  // Note: HttpOnly cookies cannot be read by JavaScript
  // This function returns null (token is in HttpOnly cookie, inaccessible to JS)
  // Backend reads the cookie from request headers automatically
  
  // Check if readable auth_token cookie exists (for diagnostic purposes)
  const cookieToken = getCookie('auth_token');
  if (cookieToken) return cookieToken;

  return null; // HttpOnly cookie exists but is not readable by JS
}

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
  // Backend sets HttpOnly cookie in response headers (Set-Cookie)
  // No client-side token storage needed
  const response = await apiClient.post('/api/auth/login', payload);

  // Optionally store user data (non-sensitive) in localStorage for UI display
  if (typeof window !== 'undefined' && response) {
    const user = response?.user || response?.data?.user || response?.data || null;
    if (user) {
      try {
        localStorage.setItem('user_data', JSON.stringify(user));
        localStorage.setItem('user_type', user?.role || 'customer');
      } catch (e) { /* ignore */ }
    }
  }

  return response;
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


export async function createDelivery(payload) {
  // Check if user appears to be authenticated (has user_data)
  // Actual auth is validated by backend reading HttpOnly cookie
  if (!isAuthenticated()) {
    const err = new Error('Authentication required. Please log in to book a delivery.');
    err.status = 401;
    throw err;
  }

  // Browser automatically sends HttpOnly cookie; backend validates
  return apiClient.post('/api/customer/deliveries', payload);
}


export async function getCustomerDeliveries(options = {}) {
  const { page = 1, limit = 10, ...filters } = options || {};
  return apiClient.get('/api/customer/deliveries', { params: { page, limit, ...filters } });
}


export async function getDeliveryById(deliveryId) {
  if (!deliveryId) throw new Error('deliveryId is required');
  return apiClient.get(`/api/customer/deliveries/${deliveryId}`);
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
  logout,
  createDelivery,
  getCustomerDeliveries,
  getDeliveryById
  ,
  isAuthenticated,
  getAuthToken
};
