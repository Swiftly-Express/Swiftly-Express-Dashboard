# Payment Flow Documentation

## Overview
This document describes the complete payment flow for Swiftly Express Dashboard using Paystack integration.

## Flow Diagram

```
User clicks "Book Delivery" (Online Payment)
    ↓
Frontend creates delivery via API
    ↓
Frontend initializes payment via API
    ↓
Backend returns payment reference + authorizationUrl
    ↓
Frontend opens Paystack (inline modal OR hosted page in new tab)
    ↓
User completes payment on Paystack
    ↓
Paystack redirects to: https://dashboard.swiftlyxpress.com/payment/callback?trxref=XXX&reference=XXX
    ↓
PaymentCallback.jsx extracts reference and redirects to:
/customer/payment/success?paymentId=XXX&deliveryId=YYY
    ↓
PaymentSuccess.jsx verifies payment with backend API
    ↓
User sees success message and clicks "My Deliveries" button
    ↓
User is taken to /customer/deliveries to view all orders
```

## Frontend Implementation ✅

### 1. Book.jsx (Payment Initialization)
**Location:** `src/features/customer/pages/Book.jsx`

When user clicks "Book Delivery" with online payment:
- Creates delivery via `POST /api/customer/deliveries`
- Initializes payment via `POST /api/payment/initialize`
- Stores `deliveryId` and `paymentId` in localStorage
- Opens Paystack:
  - **Hosted Checkout**: Opens `authorizationUrl` in new tab/window
  - **Inline Checkout**: Opens Paystack modal iframe
- On inline success: Redirects to `/customer/payment/success`

### 2. PaymentCallback.jsx (Hosted Checkout Return)
**Location:** `src/features/customer/pages/PaymentCallback.jsx`
**Route:** `/payment/callback`

This page handles the redirect from Paystack hosted checkout:
- Extracts `reference` or `trxref` from URL query params
- Retrieves `deliveryId` from localStorage
- Shows loading spinner with status message
- Redirects to `/customer/payment/success?paymentId=XXX&deliveryId=YYY`

### 3. PaymentSuccess.jsx (Verification & Confirmation)
**Location:** `src/features/customer/pages/PaymentSuccess.jsx`
**Route:** `/customer/payment/success`

This page:
- Verifies payment with backend via `GET /api/payment/verify/{reference}`
- Shows success/failure status
- Provides "My Deliveries" button that routes to `/customer/deliveries`

### 4. App.jsx (Routes)
**Location:** `src/App.jsx`

Routes configured:
```jsx
<Route exact path="/payment/callback">
  <PaymentCallback />
</Route>
<Route exact path="/customer/payment/success">
  <PaymentSuccess />
</Route>
<Route exact path="/customer/deliveries">
  <CustomerRouteGuard>
    <MyDeliveries />
  </CustomerRouteGuard>
</Route>
```

## Backend Requirements ⚠️

### 1. Payment Initialization Endpoint
**Endpoint:** `POST /api/payment/initialize`

**Request Body:**
```json
{
  "deliveryId": "DEL-SX-20260108-XXX",
  "amount": 5000,
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_xxx",
      "reference": "DEL-SX-20260108-XXX",
      "authorizationUrl": "https://checkout.paystack.com/xxx",
      "amount": 5000,
      "currency": "NGN",
      "status": "pending"
    }
  }
}
```

**Critical Configuration:**
When initializing payment with Paystack, the backend MUST set:
```javascript
{
  callback_url: "https://dashboard.swiftlyxpress.com/payment/callback"
}
```

### 2. Payment Verification Endpoint
**Endpoint:** `GET /api/payment/verify/{reference}`

**Response:**
```json
{
  "success": true,
  "status": "success",
  "data": {
    "deliveryId": "DEL-SX-20260108-XXX",
    "status": "successful",
    "payment_status": "success"
  }
}
```

### 3. Environment Variables
Backend needs:
```env
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PUBLIC_KEY=pk_live_xxx
```

Frontend needs (in `.env`):
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxx
VITE_API_BASE_URL=https://api.swiftlyxpress.com
```

## Testing the Flow

### Local Testing
1. Start the dev server:
```bash
npm run dev
```

2. Navigate to `/customer/book`
3. Fill in delivery details
4. Select "Online Payment"
5. Click "Book Delivery"
6. Complete payment on Paystack test page
7. Verify redirect to `/payment/callback` → `/customer/payment/success`
8. Click "My Deliveries" to see the order

### Production Testing
Use Paystack test cards:
- **Success:** 4084084084084081
- **Insufficient Funds:** 5060666666666666666
- **CVV:** 408
- **Expiry:** Any future date
- **PIN:** 0000

## Troubleshooting

### Issue: Blank page on `/payment/callback`
**Cause:** React Router not hydrating or JS bundle not loading

**Solutions:**
1. Check browser console for JS errors
2. Verify all chunks are loading in Network tab
3. Check `PaymentCallback.jsx` console logs
4. Ensure route is registered in `App.jsx`

### Issue: Payment successful but shows as pending
**Cause:** Backend not configured callback URL properly

**Solution:** Backend must set `callback_url` when calling Paystack API:
```javascript
const response = await axios.post('https://api.paystack.co/transaction/initialize', {
  email: customerEmail,
  amount: amountInKobo,
  reference: uniqueReference,
  callback_url: 'https://dashboard.swiftlyxpress.com/payment/callback', // ✅ Critical
  metadata: {
    deliveryId: deliveryId
  }
}, {
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
  }
});
```

### Issue: Inline modal works but hosted checkout doesn't
**Cause:** Callback URL not configured

**Solution:** See above - backend must configure `callback_url`

## File Summary

| File | Purpose | Route |
|------|---------|-------|
| `Book.jsx` | Creates delivery and initializes payment | `/customer/book` |
| `PaymentCallback.jsx` | Handles Paystack redirect | `/payment/callback` |
| `PaymentSuccess.jsx` | Verifies payment and shows result | `/customer/payment/success` |
| `MyDeliveries.jsx` | Shows all user deliveries | `/customer/deliveries` |

## Next Steps

1. ✅ Frontend flow is complete
2. ⚠️ **Backend must configure `callback_url` in Paystack initialization**
3. 🧪 Test with Paystack test cards
4. 🚀 Deploy and verify in production

---

**Last Updated:** January 8, 2026
