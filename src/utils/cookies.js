/**
 * Cookie Utility Functions
 * Handles secure cookie operations for authentication tokens and user data
 */

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration in days (default: 7)
 * @param {object} options - Additional cookie options
 */
export function setCookie(name, value, days = 7, options = {}) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const sameSite = options.sameSite || 'Lax';
  const path = options.path || '/';
  
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=${path}; SameSite=${sameSite}${secure}`;
}

/**
 * Get a cookie value
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export function getCookie(name) {
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }
  return null;
}

/**
 * Check if rider verification is complete
 * @returns {boolean}
 */
export function isRiderVerified() {
  if (typeof window === 'undefined') return false;
  
  const verificationCompleted = getCookie('verificationCompleted') === 'true';
  const verificationSubmitted = getCookie('verificationSubmitted') === 'true';
  const riderAccountVerified = getCookie('riderAccountVerified');
  const riderVerificationStatus = getCookie('riderVerificationStatus');
  
  return verificationCompleted || 
         verificationSubmitted || 
         riderAccountVerified === 'true' || 
         riderAccountVerified === 'pending' ||
         riderVerificationStatus === 'pending' ||
         riderVerificationStatus === 'approved';
}

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 * @param {object} options - Cookie options (must match the options used when setting)
 */
export function deleteCookie(name, options = {}) {
  const path = options.path || '/';
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
}

/**
 * Check if a cookie exists
 * @param {string} name - Cookie name
 * @returns {boolean}
 */
export function hasCookie(name) {
  return getCookie(name) !== null;
}

/**
 * Get all cookies as an object
 * @returns {object} Object with cookie names as keys
 */
export function getAllCookies() {
  const cookies = {};
  const cookieArray = document.cookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    const cookie = cookieArray[i].trim();
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  }
  
  return cookies;
}

/**
 * Store JSON data in a cookie
 * @param {string} name - Cookie name
 * @param {object} data - Data to store
 * @param {number} days - Expiration in days
 * @param {object} options - Additional cookie options
 */
export function setJSONCookie(name, data, days = 7, options = {}) {
  const jsonString = JSON.stringify(data);
  setCookie(name, jsonString, days, options);
}

/**
 * Get JSON data from a cookie
 * @param {string} name - Cookie name
 * @returns {object|null} Parsed JSON object or null
 */
export function getJSONCookie(name) {
  const value = getCookie(name);
  if (!value) return null;
  
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error(`Failed to parse JSON cookie "${name}":`, e);
    return null;
  }
}
