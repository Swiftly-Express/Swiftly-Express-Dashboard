import axios from 'axios';
import { getCookie, setCookie, deleteCookie, getJSONCookie, setJSONCookie } from './cookies';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  withCredentials: true
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window === "undefined") return config;
    const riderToken = getCookie("rider_token");
    const customerToken = getCookie("customer_token");
    const adminToken = getCookie("admin_token");
    const authToken = getCookie("auth_token");

    // Prefer token based on explicit user role cookie, fallback to any available token
    const userRole = getCookie('userRole') || (getJSONCookie('user_data') || {}).role;
    let token = null;
    if (userRole) {
      const role = (userRole || '').toString().toLowerCase();
      if (role === 'admin') token = adminToken;
      else if (role === 'rider' || role === 'driver') token = riderToken;
      else token = customerToken;
    }

    if (!token) token = adminToken || riderToken || customerToken || authToken;

    if (token) {
      try {
        if (typeof token === 'string') {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('[authApi] ✓ Token attached →', config.url);
        } else {
          console.warn('[authApi] ⚠ Token present but not a string, skipping Authorization header');
        }
      } catch (e) {
        console.error('[authApi] ❌ Failed to attach token', e);
      }
    } else {
      console.warn("[authApi] ⚠ No token found for →", config.url);
      console.warn("[authApi] Available cookies:", {
        rider: !!riderToken,
        customer: !!customerToken,
        admin: !!adminToken,
        auth: !!authToken
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
 * CRITICAL: Store authentication data properly
 */
const saveAuthData = (response, role) => {
  if (!response) return false;

  console.log('[authApi] Raw response for token extraction:', JSON.stringify(response, null, 2));

  // Extract token from various possible locations
  const token = response?.token ||
    response?.data?.token ||
    response?.accessToken ||
    response?.data?.accessToken;

  const refresh = response?.refreshToken ||
    response?.refresh_token ||
    response?.data?.refreshToken;

  const user = response?.user ||
    response?.data?.user ||
    response?.data;

  if (!token) {
    console.warn('[authApi] ⚠ No token in response, auth data not stored');
    console.warn('[authApi] Response keys:', Object.keys(response || {}));
    return false;
  }

  // Validate token is a proper JWT (basic check)
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    console.error('[authApi] Invalid JWT token format:', token);
    return false;
  }

  console.log('[authApi] ✓ Storing auth data:', {
    role,
    hasToken: !!token,
    hasUser: !!user,
    tokenPreview: token.substring(0, 20) + '...',
    tokenParts: token.split('.').length
  });

  // Store role-specific token
  // Delete tokens for other roles to avoid confusion
  try {
    if (role === 'rider' || role === 'driver') {
      deleteCookie('customer_token');
      deleteCookie('admin_token');
      deleteCookie('customer_refresh_token');
      deleteCookie('admin_refresh_token');
      setCookie('rider_token', token, 7);
      if (refresh) setCookie('rider_refresh_token', refresh, 7);
    } else if (role === 'admin') {
      deleteCookie('rider_token');
      deleteCookie('customer_token');
      deleteCookie('rider_refresh_token');
      deleteCookie('customer_refresh_token');
      setCookie('admin_token', token, 7);
      if (refresh) setCookie('admin_refresh_token', refresh, 7);
    } else {
      // customer or default
      deleteCookie('rider_token');
      deleteCookie('admin_token');
      deleteCookie('rider_refresh_token');
      deleteCookie('admin_refresh_token');
      setCookie('customer_token', token, 7);
      if (refresh) setCookie('customer_refresh_token', refresh, 7);
    }

    // Store shared tokens (auth_token) as the current active token
    setCookie('auth_token', token, 7);
    if (refresh) setCookie('refresh_token', refresh, 7);
  } catch (e) {
    console.warn('[authApi] Failed to set role tokens cleanly:', e);
  }

  // Store user data
  if (user) {
    // Normalize role in user object (driver -> rider)
    const normalizedRole = role === 'driver' ? 'rider' : role;
    const userWithNormalizedRole = {
      ...user,
      role: normalizedRole
    };
    // Clear any stale profile-related cookies before storing new user data
    try {
      deleteCookie('user_data');
      deleteCookie('userRole');
      deleteCookie('user_type');
      deleteCookie('riderPersonalInfo');
      deleteCookie('riderVehicleInfo');
      deleteCookie('riderDocuments');
      deleteCookie('profile_image');
    } catch (e) {
      console.warn('[authApi] Failed to clear stale profile cookies:', e);
    }

    setJSONCookie('user_data', userWithNormalizedRole, 7);
    setCookie('userRole', normalizedRole, 7);
    setCookie('user_type', normalizedRole, 7);
  }

  return true;
};

/**
 * Register rider - DON'T store tokens yet
 */
export async function registerRider(payload) {
  console.log('[authApi] → Registering rider:', payload.email);

  const response = await apiClient.post('/api/auth/register', {
    ...payload,
    role: payload.role || 'driver'
  });

  console.log('[authApi] ← Registration response:', response);

  if (typeof window !== 'undefined' && response) {
    const userId = response?.userId ||
      response?.data?.userId ||
      response?.user?.userId ||
      response?.user?.id ||
      response?.user?._id;

    const user = response?.user || response?.data?.user || response?.data;

    // Store pending data only
    if (userId) {
      setCookie('pendingVerificationUserId', userId, 1);
      console.log('[authApi] ✓ Stored userId for verification:', userId);
    }

    if (user?.email || payload.email) {
      setCookie('pendingVerificationEmail', user?.email || payload.email, 1);
    }

    setCookie('pendingVerificationType', 'rider', 1);

    if (user) {
      setJSONCookie('pending_user_data', user, 1);
    }
  }

  return response;
}

/**
 * Register customer - DON'T store tokens yet
 */
export async function registerCustomer(payload) {
  console.log('[authApi] → Registering customer:', payload.email);

  const response = await apiClient.post('/api/auth/register', {
    ...payload,
    role: payload.role || 'customer'
  });

  console.log('[authApi] ← Registration response:', response);

  if (typeof window !== 'undefined' && response) {
    const userId = response?.userId ||
      response?.data?.userId ||
      response?.user?.userId ||
      response?.user?.id ||
      response?.user?._id;

    const user = response?.user || response?.data?.user || response?.data;

    if (userId) {
      setCookie('pendingVerificationUserId', userId, 1);
    }

    if (user?.email || payload.email) {
      setCookie('pendingVerificationEmail', user?.email || payload.email, 1);
    }

    setCookie('pendingVerificationType', 'customer', 1);

    if (user) {
      setJSONCookie('pending_user_data', user, 1);
    }
  }

  return response;
}

/**
 * Register admin - DON'T store tokens yet, requires email verification
 */
/**
 * Register admin - DON'T store tokens yet, requires email verification
 * Note: Backend doesn't support 'admin' role in registration, use customer registration
 * and manually assign admin role through backend
 */
export async function registerAdmin(payload) {
  console.log('[authApi] → Registering admin:', payload.email);
  console.warn('[authApi] ⚠ Admin registration should use registerCustomer - backend only accepts customer/driver roles');

  // Remove admin role and use customer registration
  const { role, ...cleanPayload } = payload;

  const response = await apiClient.post('/api/auth/register', {
    ...cleanPayload,
    role: 'customer' // Backend only accepts customer or driver
  });

  console.log('[authApi] ← Admin registration response:', response);

  if (typeof window !== 'undefined' && response) {
    const userId = response?.userId ||
      response?.data?.userId ||
      response?.user?.userId ||
      response?.user?.id ||
      response?.user?._id;

    const user = response?.user || response?.data?.user || response?.data;

    if (userId) {
      setCookie('pendingVerificationUserId', userId, 1);
    }

    if (user?.email || payload.email) {
      setCookie('pendingVerificationEmail', user?.email || payload.email, 1);
    }

    setCookie('pendingVerificationType', 'customer', 1); // Changed from 'admin' to 'customer'

    if (user) {
      setJSONCookie('pending_user_data', user, 1);
    }
  }

  return response;
}

/**
 * CRITICAL FIX: Verify email
 * If backend doesn't return token, user must login manually
 */
export async function verifyEmail(payload) {
  const { userId, ...body } = payload;

  const effectiveUserId = userId ||
    getCookie('pendingVerificationUserId') ||
    getCookie('pending_user_id');

  console.log('[authApi] → Verifying email with userId:', effectiveUserId);

  let response;

  if (!effectiveUserId) {
    const email = body.email || getCookie('pendingVerificationEmail');
    if (!email) {
      throw new Error('Either userId or email is required for verification');
    }
    response = await apiClient.post('/api/auth/verify-email', { ...body, email });
  } else {
    response = await apiClient.post(`/api/auth/verify-email/${effectiveUserId}`, body);
  }

  console.log('[authApi] ← Verification response:', response);
  console.log('[authApi] Response structure:', Object.keys(response || {}));

  if (typeof window !== 'undefined' && response) {
    const userType = getCookie('pendingVerificationType') || 'customer';

    // Try to store tokens if available
    const tokenStored = saveAuthData(response, userType);

    if (tokenStored) {
      console.log('[authApi] ✓ Tokens stored - user is authenticated');

      // Mark as verified and authenticated
      if (userType === 'rider' || userType === 'driver') {
        setCookie('riderEmailVerified', 'true', 7);
      }

      // Clean up pending data
      deleteCookie('pending_user_data');
      deleteCookie('pending_user_id');
      deleteCookie('pendingVerificationUserId');
      deleteCookie('pendingVerificationEmail');
      deleteCookie('pendingVerificationType');

      // Return success with authentication
      return { ...response, authenticated: true };
    } else {
      console.warn('[authApi] ⚠ No token in response - backend requires manual login');

      // Email is verified but user must login
      // Store verification success flag
      setCookie('emailVerifiedNeedsLogin', 'true', 1);

      // Keep pending email for login form
      const email = body.email || getCookie('pendingVerificationEmail');
      if (email) {
        setCookie('verifiedEmail', email, 1);
      }

      // Mark email as verified
      if (userType === 'rider' || userType === 'driver') {
        setCookie('riderEmailVerified', 'true', 7);
      }

      // Return success WITHOUT authentication
      return { ...response, authenticated: false, requiresLogin: true };
    }
  }

  return response;
}

/**
 * Login - FIXED: Don't send role in payload
 */
export async function login(payload) {
  console.log('[authApi] → Logging in:', payload.email);

  // Remove role from payload for backend call, but keep it for validation
  const { role: intendedRole, ...loginData } = payload;

  const response = await apiClient.post('/api/auth/login', loginData);

  console.log('[authApi] ← Login response:', response);

  if (typeof window !== 'undefined' && response) {
    // Extract user from various possible locations
    const user = response?.user ||
      response?.data?.user ||
      response?.data;

    // Get actual role from user object
    let userRole = user?.role || user?.userRole || response?.role;

    // Normalize role (driver -> rider)
    const normalizedUserRole = (userRole === 'driver') ? 'rider' : (userRole || 'customer');
    const normalizedIntendedRole = (intendedRole === 'driver') ? 'rider' : (intendedRole || 'customer');

    // Strict Role Enforcement
    if (intendedRole && normalizedUserRole !== normalizedIntendedRole) {
      if (normalizedIntendedRole !== 'admin') { // Allow admins to potentially login anywhere if needed, or restrict too
        console.warn(`[authApi] ⛔ ROLE MISMATCH: Intended ${normalizedIntendedRole} but user is ${normalizedUserRole}`);

        // Throw special error object that UI can catch
        const mismatchError = new Error(`Access Denied: You are a ${normalizedUserRole}, not a ${normalizedIntendedRole}.`);
        mismatchError.code = 'ROLE_MISMATCH';
        mismatchError.actualRole = normalizedUserRole;
        mismatchError.intendedRole = normalizedIntendedRole;
        throw mismatchError;
      }
    }

    // Clear any existing auth tokens to avoid role/token conflicts before storing new ones
    try {
      deleteCookie('auth_token');
      deleteCookie('customer_token');
      // ... (rest of clear logic is fine, calling logout() logic essentially)
      deleteCookie('rider_token');
      deleteCookie('admin_token');
      deleteCookie('refresh_token');
      deleteCookie('customer_refresh_token');
      deleteCookie('rider_refresh_token');
      deleteCookie('admin_refresh_token');
      deleteCookie('user_data');
      deleteCookie('userRole');
      deleteCookie('user_type');
    } catch (e) {
      console.warn('[authApi] Failed to clear tokens before login:', e);
    }

    // If still no role, default to customer
    if (!userRole) {
      userRole = 'customer';
    }

    console.log('[authApi] ✓ Login successful, Role validated');

    // Only save data if role validation passed
    const tokenStored = saveAuthData(response, userRole);

    if (tokenStored) {
      console.log('[authApi] ✓ Auth data stored with role:', userRole);
      // Clear any verification flags
      deleteCookie('emailVerifiedNeedsLogin');
      deleteCookie('verifiedEmail');
      deleteCookie('pendingVerificationEmail');
      deleteCookie('pendingVerificationType');
      deleteCookie('pendingVerificationUserId');
    } else {
      console.warn('[authApi] ⚠ Failed to store auth data');
    }
  }

  return response;
}

/**
 * Submit rider verification with proper auth check
 */
export async function submitRiderVerification(verificationData) {
  console.log('[authApi] → Submitting rider verification...');

  // Verify token exists
  const token = getCookie('rider_token') ||
    getCookie('auth_token') ||
    getCookie('customer_token');

  if (!token) {
    console.error('[authApi] ❌ NO TOKEN FOUND!');
    throw new Error('You must be logged in to submit verification. Please log in and try again.');
  }

  console.log('[authApi] ✓ Token found');

  if (verificationData instanceof FormData) {
    console.log('[authApi] FormData entries:');
    for (let [key, value] of verificationData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  }

  return apiClient.post('/api/driver/verification', verificationData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
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

// All other endpoints remain the same
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
    headers: { 'Content-Type': 'multipart/form-data' }
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

/**
 * Notify admin about rider changes (best-effort client-side notification)
 * Payload should include at least: type, riderId, oldEmail, newEmail
 */
export async function notifyAdminEmailChange(payload) {
  console.log('[authApi] → Notifying admin about email change', payload);
  // Best-effort endpoint - backend may accept different path; adjust if necessary
  return apiClient.post('/api/notify/admin', payload);
}

export async function uploadRiderProfileImage(file) {
  const formData = file instanceof FormData ? file : new FormData();
  if (!(file instanceof FormData)) {
    formData.append('image', file);
  }

  return apiClient.post('/api/driver/profile/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export async function createDelivery(payload) {
  if (payload instanceof FormData) {
    return apiClient.post('/api/customer/deliveries', payload);
  }
  return apiClient.post('/api/customer/deliveries', payload);
}

export async function getDeliveryEstimate(params) {
  const { pickupLat, pickupLng, deliveryLat, deliveryLng, smartRide, specialErrand } = params;
  if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng) {
    throw new Error('Missing coordinates for price estimation');
  }
  return apiClient.get('/api/customer/deliveries/estimate-price', {
    params: {
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      smartRide,
      specialErrand
    }
  });
}

// Payment-related client helpers
export async function getPaymentStatus(paymentId) {
  if (!paymentId) throw new Error('paymentId is required');
  return apiClient.get(`/api/payment/status/${paymentId}`);
}

export async function getCustomerPayments(page = 1, limit = 20, filters = {}) {
  return apiClient.get('/api/payment/customer', { params: { page, limit, ...filters } });
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
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export async function getDeliveryByTracking(trackingNumber) {
  if (!trackingNumber) throw new Error('trackingNumber is required');
  return apiClient.get(`/api/tracking/${trackingNumber}`);
}

// ========================================
// NOTIFICATION APIs
// ========================================

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount() {
  return apiClient.get('/api/notifications/unread/count');
}

/**
 * Get all notifications with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @param {boolean} isRead - Filter by read status (optional)
 */
export async function getNotifications(page = 1, limit = 20, isRead = null) {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (isRead !== null) {
    params.append('isRead', isRead.toString());
  }
  return apiClient.get(`/api/notifications?${params.toString()}`);
}

/**
 * Mark a specific notification as read
 * @param {string} notificationId - The notification ID
 */
export async function markNotificationAsRead(notificationId) {
  return apiClient.post('/api/notifications/read', { notificationId });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  return apiClient.post('/api/notifications/read/all');
}

export async function refreshToken(payload) {
  return apiClient.post('/api/auth/refresh', payload);
}

export async function getCurrentUser(token) {
  const t = token || (typeof window !== 'undefined' && getCookie('auth_token'));
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
      deleteCookie('auth_token');
      deleteCookie('customer_token');
      deleteCookie('rider_token');
      deleteCookie('admin_token');
      deleteCookie('refresh_token');
      deleteCookie('customer_refresh_token');
      deleteCookie('rider_refresh_token');
      deleteCookie('admin_refresh_token');
      deleteCookie('user_data');
      deleteCookie('userRole');
      deleteCookie('user_type');
      deleteCookie('riderEmailVerified');
      deleteCookie('riderAccountVerified');
      deleteCookie('emailVerifiedNeedsLogin');
      deleteCookie('verifiedEmail');
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

export async function changePassword(payload) {
  // Server-side endpoint to change password for authenticated users
  return apiClient.post('/api/auth/change-password', payload);
}

export function isAuthenticated(role = null) {
  if (typeof window === 'undefined') return false;

  if (role === 'customer') {
    return !!getCookie('customer_token');
  } else if (role === 'rider' || role === 'driver') {
    return !!getCookie('rider_token');
  } else if (role === 'admin') {
    return !!getCookie('admin_token');
  }

  const customerToken = getCookie('customer_token');
  const riderToken = getCookie('rider_token');
  const adminToken = getCookie('admin_token');
  const oldToken = getCookie('auth_token');

  return !!(customerToken || riderToken || adminToken || oldToken);
}

export function getAuthToken(role = null) {
  if (typeof window === 'undefined') return null;

  if (role === 'customer') {
    return getCookie('customer_token');
  } else if (role === 'rider' || role === 'driver') {
    return getCookie('rider_token');
  } else if (role === 'admin') {
    return getCookie('admin_token');
  }

  const userRole = getCookie('userRole');
  if (userRole === 'customer') {
    return getCookie('customer_token');
  } else if (userRole === 'rider' || userRole === 'driver') {
    return getCookie('rider_token');
  } else if (userRole === 'admin') {
    return getCookie('admin_token');
  }

  return getCookie('auth_token');
}

export function getPendingUserId() {
  if (typeof window === 'undefined') return null;
  return getCookie('pending_user_id') || getCookie('pendingVerificationUserId');
}

export function getPendingUserData() {
  if (typeof window === 'undefined') return null;
  return getJSONCookie('pending_user_data');
}

export default {
  registerRider,
  registerCustomer,
  registerAdmin,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
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
  getPendingUserData,
  getPaymentStatus,
  getCustomerPayments,
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};