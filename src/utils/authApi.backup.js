import axios from 'axios';
import { getCookie, setCookie, deleteCookie, getJSONCookie, setJSONCookie } from './cookies';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  withCredentials: false 
});

// Request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window === "undefined") return config;

    const riderToken = getCookie("rider_token");
    const customerToken = getCookie("customer_token");
    const authToken = getCookie("auth_token");
    
    const token = riderToken || customerToken || authToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[authApi] Authorization attached →", config.url, "Token:", token.substring(0, 20) + "...");
    } else {
      console.warn("[authApi] No token found for →", config.url, {
        hasRiderToken: !!riderToken,
        hasCustomerToken: !!customerToken,
        hasAuthToken: !!authToken
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("[authApi] Request failed:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.errorMessage ||
      error.message ||
      "Request failed";

    const err = new Error(message);
    err.status = error.response?.status;
    err.data = error.response?.data;
    throw err;
  }
);


/**
 * ============================
 * AUTH HELPERS
 * ============================
 */
const saveAuth = ({ token, refreshToken, user, role }) => {
  if (!token) return;

  // Store tokens in cookies (7 days expiration)
  if (role === "rider" || role === "driver") {
    setCookie("rider_token", token, 7);
  } else {
    setCookie("customer_token", token, 7);
  }

  setCookie("auth_token", token, 7);
  if (refreshToken) setCookie("refresh_token", refreshToken, 7);

  if (user) {
    setJSONCookie("user_data", user, 7);
    setCookie("userRole", role, 7);
    setCookie("user_type", role, 7);
  }
};

/**
 * Register a rider
 */
export async function registerRider(payload) {
  console.log('[authApi] Attempting rider registration with:', { email: payload.email, fullName: payload.fullName });
  
  const response = await apiClient.post('/api/auth/register', {
    ...payload,
    role: payload.role || 'driver'
  });
  
  console.log('[authApi] Registration response:', response);
  
  if (typeof window !== 'undefined' && response) {
    const token = response?.token || response?.data?.token || response?.accessToken || response?.data?.accessToken;
    const refresh = response?.refreshToken || response?.refresh_token || response?.data?.refreshToken;
    const user = response?.user || response?.data?.user || response?.data;
    const userId = response?.userId || response?.data?.userId || user?.userId || user?.id || user?._id;
    
    console.log('[authApi] Extracted:', { hasToken: !!token, hasUser: !!user, userId });
    
    // Store userId and type for verification
    if (userId) {
      localStorage.setItem('pending_user_id', userId);
      localStorage.setItem('pendingVerificationUserId', userId);
      console.log('[authApi] UserId stored for verification:', userId);
    }
    
    // Always set pendingVerificationType for riders
    localStorage.setItem('pendingVerificationType', 'rider');
    console.log('[authApi] pendingVerificationType set to rider');
    
    // Store token immediately if provided
    if (token) {
      localStorage.setItem('rider_token', token);
      localStorage.setItem('auth_token', token);
      console.log('[authApi] Rider token stored after registration');
      
      if (refresh) {
        localStorage.setItem('rider_refresh_token', refresh);
        localStorage.setItem('refresh_token', refresh);
      }
      
      if (user) {
        localStorage.setItem('user_data', JSON.stringify(user));
        localStorage.setItem('userRole', 'rider');
        localStorage.setItem('user_type', user?.role || 'driver');
        console.log('[authApi] Rider authenticated after registration');
      }
    } else {
      // No token yet - store pending data for after verification
      if (user) {
        localStorage.setItem('pending_user_data', JSON.stringify(user));
        localStorage.setItem('pendingVerificationEmail', user.email || payload.email);
        localStorage.setItem('pendingVerificationType', 'rider');
        console.log('[authApi] Pending rider data stored for verification');
      }
    }
  }
  
  return response;
}

/**
 * Register a customer
 */
export async function registerCustomer(payload) {
  console.log('[authApi] Attempting customer registration with:', { email: payload.email, fullName: payload.fullName });
  
  const response = await apiClient.post('/api/auth/register', {
    ...payload,
    role: payload.role || 'customer'
  });
  
  console.log('[authApi] Registration response:', response);
  
  if (typeof window !== 'undefined' && response) {
    const token = response?.token || response?.data?.token || response?.accessToken;
    const refresh = response?.refreshToken || response?.refresh_token || response?.data?.refreshToken;
    const user = response?.user || response?.data?.user || response?.data;
    const userId = response?.userId || response?.data?.userId || user?.userId || user?.id || user?._id;
    
    console.log('[authApi] Extracted:', { hasToken: !!token, hasUser: !!user, userId });
    
    if (userId) {
      localStorage.setItem('pending_user_id', userId);
      localStorage.setItem('pendingVerificationUserId', userId);
      console.log('[authApi] UserId stored for verification:', userId);
    }
    
    if (token) {
      localStorage.setItem('customer_token', token);
      localStorage.setItem('auth_token', token);
      console.log('[authApi] Customer token stored after registration');
      
      if (refresh) {
        localStorage.setItem('customer_refresh_token', refresh);
        localStorage.setItem('refresh_token', refresh);
      }
      
      if (user) {
        localStorage.setItem('user_data', JSON.stringify(user));
        localStorage.setItem('userRole', 'customer');
        localStorage.setItem('user_type', user?.role || 'customer');
      }
    } else {
      if (user) {
        localStorage.setItem('pending_user_data', JSON.stringify(user));
        localStorage.setItem('pendingVerificationEmail', user.email || payload.email);
        localStorage.setItem('pendingVerificationType', 'customer');
        console.log('[authApi] Pending customer data stored for verification');
      }
    }
  }
  
  return response;
}

/**
 * Verify email
 */
export async function verifyEmail(payload) {
  const { userId, ...body } = payload;
  
  // Try to get userId from multiple sources
  const effectiveUserId = userId || 
                          localStorage.getItem('pendingVerificationUserId') || 
                          localStorage.getItem('pending_user_id');
  
  if (!effectiveUserId) {
    // Fallback to email-based verification if no userId
    const email = body.email || localStorage.getItem('pendingVerificationEmail');
    if (!email) {
      throw new Error('Either userId or email is required for email verification');
    }
    console.log('[authApi] No userId available, attempting email-based verification:', email);
    const response = await apiClient.post('/api/auth/verify-email', { ...body, email });
    return response;
  }
  
  console.log('[authApi] Attempting email verification for userId:', effectiveUserId);
  
  const response = await apiClient.post(`/api/auth/verify-email/${effectiveUserId}`, body);
  
  console.log('[authApi] Verification response:', response);
  
  if (typeof window !== 'undefined' && response) {
    // Response interceptor already unwraps to response.data, so check various token locations
    const token = response?.token || response?.accessToken || response?.data?.token || response?.data?.accessToken;
    const refresh = response?.refreshToken || response?.refresh_token || response?.data?.refreshToken || response?.data?.refresh_token;
    const user = response?.user || response?.data?.user || response?.data;
    const userType = localStorage.getItem('pendingVerificationType') || 'customer';
    
    console.log('[authApi] Extracted from verification:', { 
      hasToken: !!token, 
      hasUser: !!user, 
      userType,
      tokenValue: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    if (token) {
      // Store role-specific token
      if (userType === 'rider' || userType === 'driver') {
        localStorage.setItem('rider_token', token);
        console.log('[authApi] Rider token stored after verification:', token.substring(0, 20) + '...');
      } else {
        localStorage.setItem('customer_token', token);
        console.log('[authApi] Customer token stored after verification:', token.substring(0, 20) + '...');
      }
      localStorage.setItem('auth_token', token);
      
      if (refresh) {
        if (userType === 'rider' || userType === 'driver') {
          localStorage.setItem('rider_refresh_token', refresh);
        } else {
          localStorage.setItem('customer_refresh_token', refresh);
        }
        localStorage.setItem('refresh_token', refresh);
      }
    } else {
      console.error('[authApi] No token found in verification response. Response structure:', Object.keys(response || {}));
    }
    
    let userData = user;
    if (!userData) {
      const pendingData = localStorage.getItem('pending_user_data');
      if (pendingData) {
        userData = JSON.parse(pendingData);
        console.log('[authApi] Using pending user data after verification');
      }
    }
    
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('userRole', userType === 'rider' || userType === 'driver' ? 'rider' : 'customer');
      localStorage.setItem('user_type', userData?.role || userType);
      console.log('[authApi] User data stored after verification');
      
      // Clean up
      localStorage.removeItem('pending_user_data');
      localStorage.removeItem('pending_user_id');
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
 * Login
 */
export async function login(payload) {
  console.log('[authApi] Attempting login with:', { email: payload.email });
  
  const response = await apiClient.post('/api/auth/login', payload);
  
  console.log('[authApi] Login response:', response);
  
  if (typeof window !== 'undefined' && response) {
    const token = response?.token || response?.data?.token || response?.accessToken;
    const refresh = response?.refreshToken || response?.refresh_token || response?.data?.refreshToken;
    const user = response?.user || response?.data?.user || response?.data;
    const userRole = user?.role || payload?.role || 'customer';
    
    console.log('[authApi] Extracted:', { hasToken: !!token, hasUser: !!user, userRole });
    
    if (token) {
      if (userRole === 'rider' || userRole === 'driver') {
        localStorage.setItem('rider_token', token);
        console.log('[authApi] Rider token stored');
      } else {
        localStorage.setItem('customer_token', token);
        console.log('[authApi] Customer token stored');
      }
      localStorage.setItem('auth_token', token);
      
      if (refresh) {
        if (userRole === 'rider' || userRole === 'driver') {
          localStorage.setItem('rider_refresh_token', refresh);
        } else {
          localStorage.setItem('customer_refresh_token', refresh);
        }
        localStorage.setItem('refresh_token', refresh);
      }
      
      if (user) {
        localStorage.setItem('user_data', JSON.stringify(user));
        localStorage.setItem('userRole', userRole === 'driver' ? 'rider' : userRole);
        localStorage.setItem('user_type', userRole);
        console.log('[authApi] User data stored with role:', userRole);
      }
    }
  }

  return response;
}

/**
 * Submit rider verification documents
 * CRITICAL: Must include Authorization header with rider token
 */
export async function submitRiderVerification(verificationData) {
  console.log('[authApi] Submitting rider verification...');
  
  // Verify we have a token
  const token = localStorage.getItem('rider_token') || localStorage.getItem('auth_token');
  if (!token) {
    console.error('[authApi] No rider token found! User must be authenticated.');
    throw new Error('Authentication required. Please log in to submit verification.');
  }
  
  console.log('[authApi] Token available for verification:', token.substring(0, 20) + '...');
  
  if (verificationData instanceof FormData) {
    console.log('[authApi] FormData entries:');
    for (let [key, value] of verificationData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  }
  
  // Don't override headers - let the interceptor add the Authorization header
  // Just ensure Content-Type is multipart/form-data for FormData
  return apiClient.post('/api/driver/verification', verificationData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export async function getRiderVerificationStatus() {
  return apiClient.get('/api/driver/verification');
}

export async function getAvailableJobs(page = 1, limit = 20) {
  return apiClient.get(`/api/driver/available-jobs?page=${page}&limit=${limit}`);
}

export async function acceptDeliveryJob(deliveryId) {
  if (!deliveryId) throw new Error('deliveryId is required');
  return apiClient.post(`/api/driver/deliveries/${deliveryId}/accept`);
}

export async function getRiderDeliveries(page = 1, limit = 10) {
  return apiClient.get(`/api/driver/my-deliveries?page=${page}&limit=${limit}`);
}

export async function updateDeliveryStatus(deliveryId, statusData) {
  if (!deliveryId) throw new Error('deliveryId is required');
  return apiClient.put(`/api/driver/deliveries/${deliveryId}/status`, statusData);
}

export async function uploadDeliveryProof(deliveryId, proofData) {
  if (!deliveryId) throw new Error('deliveryId is required');
  return apiClient.post(`/api/driver/deliveries/${deliveryId}/upload-proof`, proofData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export async function getRiderEarnings() {
  return apiClient.get('/api/driver/earnings');
}

export async function updateRiderAvailability(availabilityData) {
  return apiClient.put('/api/driver/availability', availabilityData);
}

export async function getRiderProfile() {
  return apiClient.get('/api/driver/profile');
}

export async function updateRiderProfile(profileData) {
  return apiClient.put('/api/driver/profile', profileData);
}

export async function uploadRiderProfileImage(file) {
  const formData = file instanceof FormData ? file : new FormData();
  if (!(file instanceof FormData)) {
    formData.append('image', file);
  }
  
  return apiClient.post('/api/driver/profile/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// Customer endpoints
export async function createDelivery(payload) {
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

export async function rateDriver(deliveryId, payload) {
  if (!deliveryId) throw new Error('deliveryId is required');
  return apiClient.post(`/api/customer/deliveries/${deliveryId}/rate`, payload);
}

export async function cancelDelivery(deliveryId, payload = {}) {
  if (!deliveryId) throw new Error('deliveryId is required');
  return apiClient.post(`/api/customer/deliveries/${deliveryId}/cancel`, payload);
}

export async function getCustomerProfile() {
  return apiClient.get('/api/customer/profile');
}

export async function updateCustomerProfile(payload) {
  return apiClient.put('/api/customer/profile', payload);
}

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

export async function getDeliveryByTracking(trackingNumber) {
  if (!trackingNumber) throw new Error('trackingNumber is required');
  return apiClient.get(`/api/tracking/${trackingNumber}`);
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
  try {
    await apiClient.post('/api/auth/logout', payload);
  } catch (error) {
    console.error('[authApi] Logout request failed:', error);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('customer_token');
      localStorage.removeItem('rider_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('customer_refresh_token');
      localStorage.removeItem('rider_refresh_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user_type');
      console.log('[authApi] All auth data cleared');
    }
  }
}

export async function forgotPassword(payload) {
  return apiClient.post('/api/auth/forgot-password', payload);
}

export async function resetPassword(payload) {
  return apiClient.post('/api/auth/reset-password', payload);
}

export function isAuthenticated(role = null) {
  if (typeof window === 'undefined') return false;

  if (role === 'customer') {
    return !!localStorage.getItem('customer_token');
  } else if (role === 'rider' || role === 'driver') {
    return !!localStorage.getItem('rider_token');
  }

  const customerToken = localStorage.getItem('customer_token');
  const riderToken = localStorage.getItem('rider_token');
  const oldToken = localStorage.getItem('auth_token');
  
  return !!(customerToken || riderToken || oldToken);
}

export function getAuthToken(role = null) {
  if (typeof window === 'undefined') return null;
  
  if (role === 'customer') {
    return localStorage.getItem('customer_token');
  } else if (role === 'rider' || role === 'driver') {
    return localStorage.getItem('rider_token');
  }
  
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'customer') {
    return localStorage.getItem('customer_token');
  } else if (userRole === 'rider' || userRole === 'driver') {
    return localStorage.getItem('rider_token');
  }
  
  return localStorage.getItem('auth_token');
}

export function getPendingUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pending_user_id') || localStorage.getItem('pendingVerificationUserId');
}

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
  submitRiderVerification,
  getRiderVerificationStatus,
  getAvailableJobs,
  acceptDeliveryJob,
  getRiderDeliveries,
  updateDeliveryStatus,
  uploadDeliveryProof,
  getRiderEarnings,
  updateRiderAvailability,
  getRiderProfile,
  updateRiderProfile,
  uploadRiderProfileImage,
  isAuthenticated,
  getAuthToken,
  getPendingUserId,
  getPendingUserData
};