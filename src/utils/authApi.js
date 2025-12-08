import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';

console.log('[authApi] Using API Base URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  // Temporarily disable withCredentials if backend doesn't support it yet
  withCredentials: false 
});

// Cookie helper to read cookies 
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

apiClient.interceptors.request.use(
  (config) => {
    // Read token from localStorage and attach to requests
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors uniformly
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[authApi] Request failed:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });

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
 * Check if user is authenticated (has a valid token)
 * @returns {boolean}
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage for token
  const token = localStorage.getItem('auth_token');
  if (token) return true;
  
  // Check for user_data as fallback
  const userData = localStorage.getItem('user_data');
  if (userData) return true;
  
  // Check cookie (for when backend sets HttpOnly cookie)
  const cookieToken = getCookie('auth_token');
  if (cookieToken) return true;

  return false;
}

/**
 * Retrieve the stored authentication token
 * @returns {string|null}
 */
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  
  // Prefer localStorage token
  const token = localStorage.getItem('auth_token');
  if (token) return token;
  
  // Fallback to cookie
  const cookieToken = getCookie('auth_token');
  if (cookieToken) return cookieToken;

  return null;
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
  console.log('[authApi] Attempting login with:', { email: payload.email });
  
  const response = await apiClient.post('/api/auth/login', payload);
  
  console.log('[authApi] Login response:', response);
  
  if (typeof window !== 'undefined' && response) {
    const token = response?.token || response?.data?.token || response?.accessToken || response?.data?.accessToken;
    const user = response?.user || response?.data?.user || response?.data || null;
    
    console.log('[authApi] Extracted from response:', { hasToken: !!token, hasUser: !!user });
    
    // Store token in localStorage as fallback (until backend sets HttpOnly cookie)
    if (token) {
      try {
        localStorage.setItem('auth_token', token);
        console.log('[authApi] Token stored in localStorage');
      } catch (e) {
        console.error('[authApi] Failed to store token:', e);
      }
    }
    
    if (user) {
      try {
        localStorage.setItem('user_data', JSON.stringify(user));
        localStorage.setItem('user_type', user?.role || 'customer');
        console.log('[authApi] User data stored');
      } catch (e) {
        console.error('[authApi] Failed to store user data:', e);
      }
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
  if (!isAuthenticated()) {
    const err = new Error('Authentication required. Please log in to book a delivery.');
    err.status = 401;
    throw err;
  }
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
