import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';
// const BASE_URL = 'https://api.swiftlyxpress.com';


const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  withCredentials: false 
});

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// Request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
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
 * Check if user is authenticated
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;

  // Consider the user authenticated only when there's a usable auth token
  const token = localStorage.getItem('auth_token');
  if (token) return true;

  const cookieToken = getCookie('auth_token');
  if (cookieToken) return true;

  return false;
}

/**
 * Get stored auth token
 */
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  // Prefer localStorage token, fallback to cookie token
  const local = localStorage.getItem('auth_token');
  if (local) return local;

  const cookieToken = getCookie('auth_token');
  if (cookieToken) return cookieToken;

  return null;
}

/**
 * Get pending user ID (for email verification)
 */
export function getPendingUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pending_user_id');
}

/**
 * Get pending user data (before email verification)
 */
export function getPendingUserData() {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem('pending_user_data');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('[authApi] Failed to parse pending user data:', e);
    return null;
  }
}

/**
 * Register a rider
 * @param {{fullName:string, email:string, password:string, role?:string}} payload
 */
export async function registerRider(payload) {
  console.log('[authApi] Attempting rider registration with:', { email: payload.email, fullName: payload.fullName });
  
  const response = await apiClient.post('/api/auth/register', {
    ...payload,
    role: payload.role || 'driver'
  });
  
  console.log('[authApi] Registration response:', response);
  
  // Store token and user data after successful registration (same as login)
  if (typeof window !== 'undefined' && response) {
    const token = response?.token || response?.data?.token || response?.accessToken || response?.data?.accessToken || response?.auth_token || response?.data?.auth_token;
    const refresh = response?.refreshToken || response?.refresh_token || response?.data?.refreshToken || response?.data?.refresh_token;
    const user = response?.user || response?.data?.user || response?.data || response?.user_data || response?.data?.user_data || null;
    
    console.log('[authApi] Extracted from registration:', { hasToken: !!token, hasUser: !!user });
    
    if (token) {
      try {
        localStorage.setItem('auth_token', token);
        console.log('[authApi] Token stored after registration');
      } catch (e) {
        console.error('[authApi] Failed to store token:', e);
      }
    }
    
    if (refresh) {
      try {
        localStorage.setItem('refresh_token', refresh);
        console.log('[authApi] Refresh token stored after registration');
      } catch (e) {
        console.error('[authApi] Failed to store refresh token:', e);
      }
    }
    
    if (user) {
      try {
        localStorage.setItem('user_data', JSON.stringify(user));
        localStorage.setItem('user_type', user?.role || 'driver');
        console.log('[authApi] User data stored after registration');
      } catch (e) {
        console.error('[authApi] Failed to store user data:', e);
      }
    }
    
    // If backend returned a token but no user object, try fetching current user
    if (!user && token) {
      try {
        const me = await getCurrentUser(token);
        if (me) {
          try {
            localStorage.setItem('user_data', JSON.stringify(me));
            localStorage.setItem('user_type', me?.role || 'driver');
            console.log('[authApi] Fetched and stored current user after registration');
          } catch (e) {
            console.error('[authApi] Failed to store fetched user data:', e);
          }
        }
      } catch (e) {
        console.warn('[authApi] Could not fetch current user after registration', e);
      }
    }
  }
  
  return response;
}

/**
 * Register a customer
 * @param {{fullName:string,email:string,phone:string,password:string,role?:string}} payload
 */
export async function registerCustomer(payload) {
  console.log('[authApi] Attempting customer registration with:', { email: payload.email, fullName: payload.fullName });
  
  const response = await apiClient.post('/api/auth/register', {
    ...payload,
    role: payload.role || 'customer'
  });
  
  console.log('[authApi] Registration response:', response);
  
  // Store user data temporarily for email verification flow
  // Token will be provided after email verification
  if (typeof window !== 'undefined' && response) {
    const token = response?.token || response?.data?.token || response?.accessToken || response?.data?.accessToken || response?.auth_token || response?.data?.auth_token;
    const refresh = response?.refreshToken || response?.refresh_token || response?.data?.refreshToken || response?.data?.refresh_token;
    const user = response?.user || response?.data?.user || response?.data;
    const userId = response?.data?.userId || response?.userId || user?.userId || user?.id || user?._id;
    
    console.log('[authApi] Extracted from registration:', { hasToken: !!token, hasUser: !!user, userId });
    
    // Store userId for verification flow
    if (userId) {
      try {
        localStorage.setItem('pending_user_id', userId);
        console.log('[authApi] UserId stored for verification:', userId);
      } catch (e) {
        console.error('[authApi] Failed to store userId:', e);
      }
    }
    
    // Store pending user data (before verification)
    if (user) {
      try {
        localStorage.setItem('pending_user_data', JSON.stringify(user));
        console.log('[authApi] Pending user data stored for verification');
      } catch (e) {
        console.error('[authApi] Failed to store pending user data:', e);
      }
    }
    
    // If token is provided immediately (no email verification required), store it
    if (token) {
      try {
        localStorage.setItem('auth_token', token);
        console.log('[authApi] Token stored after registration');
        
        if (user) {
          localStorage.setItem('user_data', JSON.stringify(user));
          localStorage.setItem('user_type', user?.role || 'customer');
          console.log('[authApi] User authenticated after registration');
        }
      } catch (e) {
        console.error('[authApi] Failed to store token:', e);
      }
    }
    
    if (refresh) {
      try {
        localStorage.setItem('refresh_token', refresh);
        console.log('[authApi] Refresh token stored after registration');
      } catch (e) {
        console.error('[authApi] Failed to store refresh token:', e);
      }
    }
  }
  
  return response;
}

/**
 * Verify email (expects { userId, code })
 */
export async function verifyEmail(payload) {
  const { userId, ...body } = payload;
  if (!userId) {
    throw new Error('userId is required for email verification');
  }
  
  console.log('[authApi] Attempting email verification for userId:', userId);
  
  const response = await apiClient.post(`/api/auth/verify-email/${userId}`, body);
  
  console.log('[authApi] Verification response:', response);
  
  // After successful verification, store token and user data
  if (typeof window !== 'undefined' && response) {
    const token = response?.token || response?.data?.token || response?.accessToken || response?.data?.accessToken || response?.auth_token || response?.data?.auth_token;
    const refresh = response?.refreshToken || response?.refresh_token || response?.data?.refreshToken || response?.data?.refresh_token;
    const user = response?.user || response?.data?.user || response?.data;
    
    console.log('[authApi] Extracted from verification:', { hasToken: !!token, hasUser: !!user });
    
    if (token) {
      try {
        localStorage.setItem('auth_token', token);
        console.log('[authApi] Token stored after verification');
      } catch (e) {
        console.error('[authApi] Failed to store token:', e);
      }
    }
    
    if (refresh) {
      try {
        localStorage.setItem('refresh_token', refresh);
        console.log('[authApi] Refresh token stored after verification');
      } catch (e) {
        console.error('[authApi] Failed to store refresh token:', e);
      }
    }
    
    // Use pending user data if server doesn't return user object
    let userData = user;
    if (!userData) {
      try {
        const pendingData = localStorage.getItem('pending_user_data');
        if (pendingData) {
          userData = JSON.parse(pendingData);
          console.log('[authApi] Using pending user data after verification');
        }
      } catch (e) {
        console.error('[authApi] Failed to parse pending user data:', e);
      }
    }
    
    if (userData) {
      try {
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('user_type', userData?.role || 'customer');
        console.log('[authApi] User data stored after verification');
        
        // Clean up pending data
        localStorage.removeItem('pending_user_data');
        localStorage.removeItem('pending_user_id');
      } catch (e) {
        console.error('[authApi] Failed to store user data:', e);
      }
    }
    
    // If we have token but no user data, fetch current user
    if (token && !userData) {
      try {
        const me = await getCurrentUser(token);
        if (me) {
          localStorage.setItem('user_data', JSON.stringify(me));
          localStorage.setItem('user_type', me?.role || 'customer');
          console.log('[authApi] Fetched and stored current user after verification');
        }
      } catch (e) {
        console.warn('[authApi] Could not fetch current user after verification', e);
      }
    }
  }
  
  return response;
}

/**
 * Resend verification code
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
  console.log('[authApi] Attempting login with:', { email: payload.email });
  
  const response = await apiClient.post('/api/auth/login', payload);
  
  console.log('[authApi] Login response:', response);
  
  if (typeof window !== 'undefined' && response) {
    const token = response?.token || response?.data?.token || response?.accessToken || response?.data?.accessToken || response?.auth_token || response?.data?.auth_token;
    const refresh = response?.refreshToken || response?.refresh_token || response?.data?.refreshToken || response?.data?.refresh_token;
    const user = response?.user || response?.data?.user || response?.data || response?.user_data || response?.data?.user_data || null;
    
    console.log('[authApi] Extracted from response:', { hasToken: !!token, hasUser: !!user });
    
    if (token) {
      try {
        localStorage.setItem('auth_token', token);
        console.log('[authApi] Token stored in localStorage');
      } catch (e) {
        console.error('[authApi] Failed to store token:', e);
      }
    }
    
    if (refresh) {
      try {
        localStorage.setItem('refresh_token', refresh);
        console.log('[authApi] Refresh token stored in localStorage');
      } catch (e) {
        console.error('[authApi] Failed to store refresh token:', e);
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
    
    // If backend returned a token but no user object, try fetching current user
    if (!user && token) {
      try {
        const me = await getCurrentUser(token);
        if (me) {
          try {
            localStorage.setItem('user_data', JSON.stringify(me));
            localStorage.setItem('user_type', me?.role || 'customer');
            console.log('[authApi] Fetched and stored current user after login');
          } catch (e) {
            console.error('[authApi] Failed to store fetched user data:', e);
          }
        }
      } catch (e) {
        console.warn('[authApi] Could not fetch current user after login', e);
      }
    }
  }

  return response;
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
export async function logout(payload = {}) {
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

/**
 * Create a customer delivery
 * Expects payload with delivery details
 */
export async function createDelivery(payload) {
  if (!isAuthenticated()) {
    const err = new Error('Authentication required. Please log in to book a delivery.');
    err.status = 401;
    throw err;
  }
  return apiClient.post('/api/customer/deliveries', payload);
}

/**
 * Get customer deliveries (paginated)
 * Accepts an options object: { page=1, limit=10, ...filters }
 */
export async function getCustomerDeliveries(options = {}) {
  const { page = 1, limit = 10, ...filters } = options || {};
  return apiClient.get('/api/customer/deliveries', { params: { page, limit, ...filters } });
}

/**
 * Get a delivery by id
 */
export async function getDeliveryById(deliveryId) {
  if (!deliveryId) throw new Error('deliveryId is required');
  return apiClient.get(`/api/customer/deliveries/${deliveryId}`);
}

/**
 * Rate a driver for a delivery
 * @param {string} deliveryId - The delivery ID
 * @param {object} payload - Rating details (e.g., { rating: 5, comment: "Great service!" })
 */
export async function rateDriver(deliveryId, payload) {
  if (!deliveryId) throw new Error('deliveryId is required');
  return apiClient.post(`/api/customer/deliveries/${deliveryId}/rate`, payload);
}

/**
 * Cancel a delivery
 * @param {string} deliveryId - The delivery ID
 * @param {object} payload - Optional cancellation reason (e.g., { reason: "Changed mind" })
 */
export async function cancelDelivery(deliveryId, payload = {}) {
  if (!deliveryId) throw new Error('deliveryId is required');
  return apiClient.post(`/api/customer/deliveries/${deliveryId}/cancel`, payload);
}

/**
 * Get customer profile
 */
export async function getCustomerProfile() {
  return apiClient.get('/api/customer/profile');
}

/**
 * Update customer profile
 * @param {object} payload - Profile fields to update (e.g., { fullName, phone, address })
 */
export async function updateCustomerProfile(payload) {
  return apiClient.put('/api/customer/profile', payload);
}

/**
 * Upload customer profile image
 * @param {File|FormData} file - The image file or FormData containing the image
 */
export async function uploadProfileImage(file) {
  const formData = file instanceof FormData ? file : new FormData();
  if (!(file instanceof FormData)) {
    formData.append('image', file);
  }
  
  return apiClient.post('/api/customer/profile/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * Track delivery by tracking number (public endpoint)
 * @param {string} trackingNumber - The tracking number
 */
export async function getDeliveryByTracking(trackingNumber) {
  if (!trackingNumber) throw new Error('trackingNumber is required');
  return apiClient.get(`/api/tracking/${trackingNumber}`);
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
  getDeliveryById,
  getDeliveryByTracking,
  rateDriver,
  cancelDelivery,
  getCustomerProfile,
  updateCustomerProfile,
  uploadProfileImage,
  isAuthenticated,
  getAuthToken,
  getPendingUserId,
  getPendingUserData
};