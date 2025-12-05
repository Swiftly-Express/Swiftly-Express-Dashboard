// Reusable auth API helpers

const BASE_URL = 'https://api.swiftlyxpress.com';
const DASHBOARD_REGISTER = 'https://api.swiftlyxpress.com/api/auth/register';

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message = (data && data.message) || data || res.statusText || 'Request failed';
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Register a rider
 * @param {{fullName:string, email:string, password:string, role?:string}} payload
 */
export async function registerRider(payload) {

  // Use the main register endpoint for both customers and riders/drivers
  const url = `${BASE_URL}/api/auth/register`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ ...payload, role: payload.role || 'driver' })
  });

  return handleResponse(res);
}

/**
 * Register a customer (dashboard subdomain endpoint)
 * @param {{fullName:string,email:string,phone:string,password:string,role?:string}} payload
 */
export async function registerCustomer(payload) {
  // Use the production API register endpoint. (Previously used localhost for testing.)
  const REGISTER_URL = `${BASE_URL}/api/auth/register`;

  const res = await fetch(REGISTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ ...payload, role: payload.role || 'customer' })
  });
  return handleResponse(res);
}

/**
 * Verify email (expects { email, code } or { token })
 */
export async function verifyEmail(payload) {
  // Backend expects POST to /api/auth/verify-email/ with body { code: '123456' }
  const url = `${BASE_URL}/api/auth/verify-email/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function resendVerification(payload) {
  const url = `${BASE_URL}/api/auth/resend-verification/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

/**
 * Login (customer or driver)
 * Expects payload: { email, password }
 * Returns whatever the backend returns (commonly a token + user data)
 */
export async function login(payload) {
  const url = `${BASE_URL}/api/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export default {
  registerRider,
  registerCustomer,
  verifyEmail,
  resendVerification
};
