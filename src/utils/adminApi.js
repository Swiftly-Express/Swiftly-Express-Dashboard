/**
 * Get all approved riders (analytics/drivers)
 * @returns {Promise} List of approved riders
 */
export async function getApprovedRiders(page = 1, limit = 20) {
  return adminApiClient.get(`/api/admin/drivers?page=${page}&limit=${limit}`);
}
import axios from "axios";
import { getCookie } from "./cookies";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.swiftlyxpress.com";

const adminApiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Request interceptor - attach admin token
adminApiClient.interceptors.request.use(
  (config) => {
    if (typeof window === "undefined") return config;

    // Prioritize admin_token for admin requests
    const adminToken = getCookie("admin_token");
    const authToken = getCookie("auth_token");

    const token = adminToken || authToken;

    if (token) {
      // Validate token format before sending
      if (typeof token === "string" && token.split(".").length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          "[adminApi] ✓ Admin token attached →",
          config.url,
          "(first 20 chars:",
          token.substring(0, 20) + "...)",
        );
      } else {
        console.error("[adminApi] ❌ Invalid JWT token format:", token);
        console.error(
          "[adminApi] Token type:",
          typeof token,
          "Parts:",
          token?.split(".")?.length,
        );
      }
    } else {
      console.warn("[adminApi] ⚠ No admin token found for →", config.url);
      console.warn("[adminApi] Available cookies:", {
        admin: !!adminToken,
        auth: !!authToken,
      });
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
adminApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("[adminApi] ❌ Request failed:", {
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
  },
);

// ==================== USER MANAGEMENT ====================

/**
 * Get all users with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} Users list with pagination info
 */
export async function getAllUsers(page = 1, limit = 20) {
  console.log(`[adminApi] → Getting all users (page ${page}, limit ${limit})`);
  return adminApiClient.get(`/api/admin/users?page=${page}&limit=${limit}`);
}

/**
 * Cancel a delivery (admin)
 * @param {string} deliveryId - Delivery ID to cancel
 * @param {string} reason - Cancellation reason
 * @returns {Promise} Cancellation result
 */
export async function adminCancelDelivery(deliveryId, reason = 'Cancelled by admin') {
  console.log(`[adminApi] → Cancelling delivery ${deliveryId}`);
  return adminApiClient.put(`/api/admin/deliveries/${deliveryId}/cancel`, { reason });
}

/**
 * Delete a delivery completely (admin only)
 * @param {string} deliveryId - Delivery ID to delete
 * @returns {Promise} Deletion result
 */
export async function adminDeleteDelivery(deliveryId) {
  console.log(`[adminApi] → Deleting delivery ${deliveryId}`);
  return adminApiClient.delete(`/api/admin/deliveries/${deliveryId}`);
}

/**
 * Set driver debt limit (admin only)
 * @param {string} driverId - Driver ID
 * @param {number} debtLimit - Maximum debt limit amount
 * @returns {Promise} Updated driver with new debt limit
 */
export async function setDriverDebtLimit(driverId, debtLimit) {
  if (!driverId) throw new Error('driverId is required');
  console.log(`[adminApi] → Setting debt limit for driver ${driverId}:`, debtLimit);
  return adminApiClient.post(`/api/admin/drivers/${driverId}/debt-limit`, { debtLimit });
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise} Created user
 */
export async function createUser(userData) {
  console.log("[adminApi] → Creating user:", userData.email);
  return adminApiClient.post("/api/admin/users", userData);
}

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise} Updated user
 */
export async function updateUser(userId, userData) {
  if (!userId) throw new Error("userId is required");
  console.log("[adminApi] → Updating user:", userId);
  return adminApiClient.put(`/api/admin/users/${userId}`, userData);
}

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise} Deletion confirmation
 */
export async function deleteUser(userId) {
  if (!userId) throw new Error("userId is required");
  console.log("[adminApi] → Deleting user:", userId);
  return adminApiClient.delete(`/api/admin/users/${userId}`);
}

// ==================== DELIVERY MANAGEMENT ====================

/**
 * Get all deliveries with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} Deliveries list with pagination info
 */
export async function getAllDeliveries(page = 1, limit = 20) {
  console.log(
    `[adminApi] → Getting all deliveries (page ${page}, limit ${limit})`,
  );
  return adminApiClient.get(
    `/api/admin/deliveries?page=${page}&limit=${limit}`,
  );
}

/**
 * Assign driver to delivery
 * @param {string} deliveryId - Delivery ID
 * @param {Object} assignmentData - Assignment data (driverId, etc.)
 * @returns {Promise} Updated delivery
 */
export async function assignDriver(deliveryId, assignmentData) {
  if (!deliveryId) throw new Error("deliveryId is required");
  console.log("[adminApi] → Assigning driver to delivery:", deliveryId);
  return adminApiClient.post(
    `/api/admin/deliveries/${deliveryId}/assign`,
    assignmentData,
  );
}

/**
 * Adjust delivery pricing
 * @param {string} deliveryId - Delivery ID
 * @param {Object} pricingData - Pricing adjustment data
 * @returns {Promise} Updated delivery
 */
export async function adjustPricing(deliveryId, pricingData) {
  if (!deliveryId) throw new Error("deliveryId is required");
  console.log("[adminApi] → Adjusting pricing for delivery:", deliveryId);
  return adminApiClient.put(
    `/api/admin/deliveries/${deliveryId}/pricing`,
    pricingData,
  );
}

// ==================== ANALYTICS ====================

/**
 * Get analytics overview
 * @returns {Promise} Analytics overview data
 */
export async function getAnalyticsOverview() {
  console.log("[adminApi] → Getting analytics overview");
  return adminApiClient.get("/api/admin/analytics/overview");
}

/**
 * Get single user by ID
 * @param {string} userId
 */
export async function getUser(userId) {
  if (!userId) throw new Error("userId is required");
  console.log("[adminApi] → Getting user:", userId);
  return adminApiClient.get(`/api/admin/users/${userId}`);
}

/**
 * Search users by email or phone (returns list)
 * @param {Object} params - { email, phone }
 */
export async function searchUsers(params = {}) {
  const { email, phone } = params || {};
  console.log("[adminApi] → Searching users by", { email, phone });
  const qs = new URLSearchParams();
  if (email) qs.append("email", email);
  if (phone) qs.append("phone", phone);
  const query = qs.toString();
  return adminApiClient.get(`/api/admin/users${query ? `?${query}` : ""}`);
}

/**
 * Get revenue analytics
 * @param {Object} params - Query parameters (startDate, endDate, etc.)
 * @returns {Promise} Revenue analytics data
 */
export async function getRevenueAnalytics(params = {}) {
  console.log("[adminApi] → Getting revenue analytics");
  const queryString = new URLSearchParams(params).toString();
  return adminApiClient.get(
    `/api/admin/analytics/revenue${queryString ? "?" + queryString : ""}`,
  );
}

/**
 * Get driver analytics
 * @param {Object} params - Query parameters (startDate, endDate, etc.)
 * @returns {Promise} Driver analytics data
 */
export async function getDriverAnalytics(params = {}) {
  console.log("[adminApi] → Getting driver analytics");
  const queryString = new URLSearchParams(params).toString();
  return adminApiClient.get(
    `/api/admin/analytics/drivers${queryString ? "?" + queryString : ""}`,
  );
}

/**
 * Get commission rate settings from backend
 * Expected to return either a number (e.g. 0.15) or an object containing a commissionRate field.
 */
export async function getCommissionRate() {
  console.log("[adminApi] → Getting commission rate");
  return adminApiClient.get("/api/admin/settings/commission");
}

// ==================== KYC/VERIFICATION MANAGEMENT ====================

/**
 * Get pending verifications
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} Pending verifications list
 */
export async function getPendingVerifications(page = 1, limit = 20) {
  console.log(
    `[adminApi] → Getting pending verifications (page ${page}, limit ${limit})`,
  );
  return adminApiClient.get(
    `/api/admin/verifications/pending?page=${page}&limit=${limit}`,
  );
}

/**
 * Get verification for a specific driver (for rider detail / documents)
 * @param {string} driverId - Driver user ID
 * @returns {Promise} { verification } or { verification: null }
 */
export async function getVerificationByDriver(driverId) {
  if (!driverId) throw new Error("driverId is required");
  console.log("[adminApi] → Getting verification for driver:", driverId);
  return adminApiClient.get(`/api/admin/verifications/driver/${driverId}`);
}

/**
 * Approve driver verification
 * @param {string} verificationId - Verification ID
 * @param {Object} approvalData - Approval data (notes, etc.)
 * @returns {Promise} Verification result
 */
export async function approveVerification(verificationId, approvalData = {}) {
  if (!verificationId) throw new Error("verificationId is required");
  console.log("[adminApi] → Approving verification:", verificationId);
  const payload = { ...approvalData };
  // ensure we send verificationStatus (backend expects this) and avoid sending `status`
  if (!payload.verificationStatus) payload.verificationStatus = "approved";
  if ("status" in payload) delete payload.status;
  return adminApiClient.put(
    `/api/admin/verifications/${verificationId}`,
    payload,
  );
}

/**
 * Reject driver verification
 * @param {string} verificationId - Verification ID
 * @param {Object} rejectionData - Rejection data (reason, notes, etc.)
 * @returns {Promise} Verification result
 */
export async function rejectVerification(verificationId, rejectionData) {
  if (!verificationId) throw new Error("verificationId is required");
  console.log("[adminApi] → Rejecting verification:", verificationId);
  const payload = {
    verificationStatus: "rejected",
    adminNotes: rejectionData?.reason || rejectionData?.adminNotes || undefined,
  };
  return adminApiClient.put(
    `/api/admin/verifications/${verificationId}`,
    payload,
  );
}

// Export all functions
export default {
  // User management
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUser,

  // Delivery management
  getAllDeliveries,
  assignDriver,
  adjustPricing,

  // Analytics
  getAnalyticsOverview,
  getRevenueAnalytics,
  getDriverAnalytics,
  getCommissionRate,
  getApprovedRiders,

  // Verification management
  getPendingVerifications,
  getVerificationByDriver,
  approveVerification,
  rejectVerification,
};
