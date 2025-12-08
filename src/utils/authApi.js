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
    let token;
    let tokenKey;
    if (typeof window !== 'undefined') {
      const possibleKeys = ['auth_token', 'authToken', 'token', 'access_token', 'accessToken'];
      for (const k of possibleKeys) {
        const v = localStorage.getItem(k);
        if (v) {
          token = v;
          tokenKey = k;
          break;
        }
      }

      // Try to extract token from user_data if available
      if (!token) {
        const ud = localStorage.getItem('user_data');
        if (ud) {
          try {
            const udObj = JSON.parse(ud);
            token = udObj?.token || udObj?.accessToken || udObj?.access_token || udObj?.auth_token;
            if (token) tokenKey = 'user_data';
          } catch (e) {
            // ignore parse error
          }
        }
      }

      // If token is a JSON string, try parsing it to find nested token fields
      if (token && typeof token === 'string' && token.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(token);
          token = parsed?.token || parsed?.accessToken || parsed?.access_token || parsed?.auth_token || token;
        } catch (e) {
          // ignore
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['x-access-token'] = token;
        if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
          try { console.debug('[apiClient] Using auth token from', tokenKey || 'unknown'); } catch(e) {}
        }
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

/**
 * Create a customer delivery
 * Expects payload with delivery details
 */
export async function createDelivery(payload) {
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
  ,
  createDelivery,
  getCustomerDeliveries,
  getDeliveryById
};
