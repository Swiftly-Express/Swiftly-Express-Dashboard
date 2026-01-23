/**
 * Haversine formula to calculate distance between two coordinates in kilometers
 * @param {Object} coord1 - First coordinate {lat, lng}
 * @param {Object} coord2 - Second coordinate {lat, lng}
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2 || !coord1.lat || !coord1.lng || !coord2.lat || !coord2.lng) {
    return 0;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.max(0, distance); // Ensure non-negative
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate delivery pricing based on new pricing model
 * @param {Object} params - Pricing parameters
 * @param {number} params.distance - Distance in km
 * @param {number} params.waitingMinutes - Waiting time in minutes (default 0)
 * @param {boolean} params.isPriority - Whether priority fee applies (default false)
 * @param {boolean} params.isSpecialErrand - Whether special errand fee applies (default false)
 * @param {number} params.batchDiscount - Batch delivery discount percentage 0-10 (default 0)
 * @param {number} params.declaredValue - Declared value for insurance (default 0)
 * @param {number} params.customBid - Custom bid amount (must be >= 800, optional)
 * @param {string} params.deliveryType - Delivery type: 'express' or 'smart_ride' (optional)
 * @returns {Object} Pricing breakdown
 * @deprecated Use getDeliveryEstimate from authApi.js instead. This function is no longer used and uses outdated pricing logic.
 */
export function calculateDeliveryPrice({
  distance = 0,
  waitingMinutes = 0,
  isPriority = false,
  isSpecialErrand = false,
  batchDiscount = 0,
  customBid = null,
  deliveryType = null
}) {
  // Pricing constants
  const BASE_FARE = 800; // Covers up to 2km
  const PER_KM_RATE = 200; // After 2km
  const WAITING_RATE_PER_5MIN = 70; // First 5 mins free
  const PRIORITY_FEE_MIN = 200;
  const PRIORITY_FEE_MAX = 500;
  const SPECIAL_ERRAND_FEE_MIN = 300;
  const SPECIAL_ERRAND_FEE_MAX = 500;
  const EXPRESS_DELIVERY_FEE = 400; // Added to base for express
  const SMART_RIDE_FEE = 600; // Added to base for smart ride
  const PLATFORM_COMMISSION_RATE = 0.15; // 15%
  const MIN_BID = 800;

  // 1. Calculate base delivery charge
  let deliveryCharge = BASE_FARE;
  let distanceCharge = 0;
  let deliveryTypeFee = 0;

  // Add delivery type fee
  if (deliveryType === 'express') {
    deliveryTypeFee = EXPRESS_DELIVERY_FEE;
    deliveryCharge += deliveryTypeFee;
  } else if (deliveryType === 'smart_ride') {
    deliveryTypeFee = SMART_RIDE_FEE;
    deliveryCharge += deliveryTypeFee;
  }

  if (distance > 2) {
    distanceCharge = Math.ceil((distance - 2) * PER_KM_RATE);
    deliveryCharge += distanceCharge;
  }

  // 2. Calculate waiting time charge (first 5 mins free)
  let waitingCharge = 0;
  if (waitingMinutes > 5) {
    const chargeableMinutes = waitingMinutes - 5;
    const fiveMinIntervals = Math.ceil(chargeableMinutes / 5);
    waitingCharge = fiveMinIntervals * WAITING_RATE_PER_5MIN;
  }

  // 3. Priority fee (use mid-range as default)
  const priorityFee = isPriority ? Math.round((PRIORITY_FEE_MIN + PRIORITY_FEE_MAX) / 2) : 0;

  // 4. Special errand fee (use mid-range as default)
  const specialErrandFee = isSpecialErrand ? Math.round((SPECIAL_ERRAND_FEE_MIN + SPECIAL_ERRAND_FEE_MAX) / 2) : 0;

  // 5. Subtotal before discounts
  let subtotal = deliveryCharge + waitingCharge + priorityFee + specialErrandFee;

  // 6. Apply batch discount (5-10%)
  const discountAmount = batchDiscount > 0
    ? Math.round(subtotal * (Math.min(batchDiscount, 10) / 100))
    : 0;

  // 7. Calculate total before custom bid (insurance removed)
  let total = subtotal - discountAmount;

  // 9. Handle custom bid (must be >= 800)
  let finalTotal = total;
  let bidAdjustment = 0;
  if (customBid !== null && customBid >= MIN_BID) {
    bidAdjustment = customBid - total;
    finalTotal = customBid;
  }

  // 10. Calculate platform commission and rider earnings
  const platformCommission = Math.round(finalTotal * PLATFORM_COMMISSION_RATE);
  const riderEarnings = finalTotal - platformCommission;

  return {
    // Breakdown
    baseFare: BASE_FARE,
    distance: Math.round(distance * 100) / 100, // Round to 2 decimals
    distanceCharge,
    deliveryCharge,
    deliveryType,
    deliveryTypeFee,
    waitingMinutes,
    waitingCharge,
    priorityFee,
    specialErrandFee,
    subtotal,
    discountAmount,
    discountPercentage: batchDiscount,
    bidAdjustment,
    customBid,

    // Totals
    total: finalTotal,
    platformCommission,
    riderEarnings,

    // Rates (for display)
    perKmRate: PER_KM_RATE,
    waitingRatePer5Min: WAITING_RATE_PER_5MIN,
    commissionRate: PLATFORM_COMMISSION_RATE * 100,
    minBid: MIN_BID,

    // Flags
    isPriority,
    isSpecialErrand,
    hasBatchDiscount: batchDiscount > 0,
    hasCustomBid: customBid !== null && customBid >= MIN_BID
  };
}
