# Swiftly Express Pricing Model

## Overview
The new pricing model is distance-based with optional service fees, designed to ensure fair rider earnings while providing flexible customer options.

## Pricing Structure

### 1. Base Fare: ₦700
- Covers deliveries up to 2 kilometers
- Ensures minimum earnings for riders
- Prevents underpricing

### 2. Per Kilometer Rate: ₦150/km
- Applied to distance beyond 2km
- Example: 5km delivery = ₦700 (base) + (3km × ₦150) = ₦1,150

### 3. Waiting Time: ₦50 per 5 minutes
- First 5 minutes are FREE
- Compensates riders for idle time
- Example: 12 minutes waiting = ₦50 (only 7 mins charged)

### 4. Priority Fee: ₦200-500
- Default: ₦350 (midpoint)
- **Enabled by default for Smart Ride bookings**
- Gets fastest available rider
- Critical for Smart Ride's "Bolt-like" instant matching

### 5. Special Errand Fee: ₦300-500
- Default: ₦400 (midpoint)
- For riders entering shops, waiting in queues, purchasing items
- Optional customer selection

### 6. Batch Delivery Discount: 5-10%
- Applied when rider takes multiple orders
- Customer saves money
- Rider earns more overall through multiple trips
- **Currently set to 0% - will be enabled for multi-order batching in future**

### 7. Custom Bidding
- System suggests price based on calculation
- Customer can bid higher or lower
- Minimum bid: ₦700 (base fare)
- Higher bids = faster rider acceptance

### 8. Insurance: 1% of Declared Value
- Minimum: ₦200
- Applied to declared package value
- Protects high-value items

### 9. Platform Commission: 15%
- Platform takes 15% per trip
- Riders keep 85% of total fare
- **Future Option:** Riders can pay ₦3,000/week for 0% commission

## Calculation Example

**Scenario:** 5km delivery, 10 mins waiting, priority service, ₦50,000 declared value

```
Base Fare (up to 2km):           ₦700
Distance (3km × ₦150):            ₦450
Waiting Time (5 mins × ₦50):     ₦50
Priority Fee:                     ₦350
Insurance (1% of ₦50,000):        ₦500
─────────────────────────────────
TOTAL:                            ₦2,050

Platform Commission (15%):        ₦308
Rider Earnings (85%):             ₦1,742
```

## Implementation Details

### Files Modified

1. **`src/utils/pricing.js`** - New utility file
   - `calculateDistance()` - Haversine formula for accurate distance
   - `calculateDeliveryPrice()` - Complete pricing calculation

2. **`src/features/customer/pages/Book.jsx`**
   - Added optional service checkboxes (Priority, Special Errand)
   - Waiting time input field
   - Custom bid input
   - Detailed cost breakdown display
   - Real-time distance calculation from coordinates
   - Rider earnings preview

3. **`src/features/smartride-booking/Smartride-Booking.jsx`**
   - **Priority fee enabled by default** (Smart Ride feature)
   - Same optional services as Book.jsx
   - Live price preview as addresses are entered
   - Distance-based pricing calculation
   - Detailed breakdown in summary step

### Key Features

✅ **Automatic Distance Calculation**
- Uses Google Maps geocoding coordinates
- Haversine formula for accuracy
- Updates in real-time as addresses change

✅ **Transparent Pricing**
- Shows complete breakdown to customer
- Displays rider earnings
- Platform commission visible

✅ **Smart Ride Priority**
- Priority fee ON by default
- Matches "Bolt-like" instant rider matching
- Customer can disable if willing to wait

✅ **Fair Rider Compensation**
- ₦700 minimum ensures no underpayment
- Distance-based scaling
- Waiting time compensation
- 85% earnings (15% platform fee)

## UI Components Added

### Book.jsx & Smartride-Booking.jsx
- ✅ Priority Delivery checkbox (+₦200-500 badge)
- ✅ Special Errand checkbox (+₦300-500 badge)  
- ✅ Waiting Time input (minutes)
- ✅ Custom Bid input (₦ with min ₦700)
- ✅ Live price preview (Smart Ride)
- ✅ Detailed cost breakdown
  - Distance (km)
  - Base fare
  - Distance charge
  - Waiting charge
  - Priority fee
  - Special errand fee
  - Insurance
  - Bid adjustment
  - **Total**
  - Platform commission
  - **Rider earnings**

## Future Enhancements

### Batch Delivery Implementation
When ready to enable multi-order batching:

```javascript
// In pricing calculation
batchDiscount: orderCount > 1 ? 5 : 0  // 5% for 2+ orders
```

Benefits:
- Customer: 5-10% discount
- Rider: Multiple trip earnings with proximity optimization
- Platform: More efficient delivery routes

### Zero Commission Subscription
Allow riders to pay ₦3,000/week for 0% commission:

```javascript
// Check rider subscription
const commissionRate = rider.hasWeeklySubscription ? 0 : 0.15;
```

### Dynamic Priority Pricing
Adjust priority fee based on:
- Time of day (peak hours = higher)
- Rider availability (scarce = higher)
- Weather conditions
- Demand surge

## Testing Recommendations

1. **Distance Accuracy**
   - Test with known distances
   - Verify Haversine calculation
   - Compare with Google Maps

2. **Edge Cases**
   - Distance < 2km (only base fare)
   - Waiting time < 5 mins (free)
   - Very long distances (10km+)
   - High declared values (₦1M+)

3. **Smart Ride Priority**
   - Verify priority is ON by default
   - Test disabling priority option
   - Confirm price difference

4. **Custom Bidding**
   - Minimum ₦700 validation
   - Bidding above suggested price
   - Bidding below suggested price
   - Invalid inputs

5. **UI Responsiveness**
   - Mobile view (all checkboxes/inputs)
   - Desktop view
   - Price updates in real-time
   - Distance calculation triggers

## API Integration Notes

The `createDelivery` API call now includes richer delivery data:
- Distance (calculated)
- Optional fees (priority, special errand)
- Waiting time estimate
- Custom bid amount
- Detailed pricing breakdown

Backend should:
- Validate pricing calculations
- Store pricing breakdown
- Track rider earnings accurately
- Apply commission correctly
- Handle custom bids (match with riders)

## Summary

✅ Distance-based pricing implemented  
✅ All 8 pricing features integrated  
✅ Smart Ride optimized (priority default)  
✅ Transparent cost breakdown  
✅ Rider earnings calculation  
✅ Custom bidding system  
✅ Real-time price preview  
✅ Mobile & desktop responsive  

The system now accurately calculates delivery costs based on distance, optional services, and custom bids while ensuring fair rider compensation and transparent pricing for customers.
