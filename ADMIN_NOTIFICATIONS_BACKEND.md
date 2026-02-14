# Admin Push Notifications - Backend Integration Guide

## Overview
The frontend now supports real-time push notifications for admins when new users register or KYC verifications are submitted. The backend needs to emit socket events to complete the integration.

## Frontend Implementation (✅ Complete)

### 1. Push Notification Service
- Location: `src/utils/pushNotifications.js`
- Functions added:
  - `notifyNewUserRegistration(role, name)` - Shows notification for new customer/rider registration
  - `notifyNewKYCSubmission(riderName)` - Shows notification for new KYC submission

### 2. Admin Layout Integration
- Location: `src/features/admin/components/AdminLayout.jsx`
- Features:
  - Requests notification permission on mount
  - Joins 'admins' socket room on component mount
  - Listens for `user:registered` socket event
  - Listens for `kyc:submitted` socket event
  - Triggers push notifications when events are received
  - Refreshes notification count after receiving events

## Backend Requirements (⏳ Pending)

### 1. User Registration Endpoint
**When**: New user (customer or rider) completes registration
**Action**: Emit socket event to admin room

```javascript
// Example implementation in registration endpoint
io.to('admins').emit('user:registered', {
  role: user.role, // 'customer' or 'rider'
  name: user.fullName || `${user.firstName} ${user.lastName}`,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  userId: user._id
});
```

**Endpoints to update**:
- `/api/auth/customer/signup` or `/api/customer/register`
- `/api/auth/rider/signup` or `/api/rider/register`

### 2. KYC Submission Endpoint
**When**: Rider submits verification documents
**Action**: Emit socket event to admin room

```javascript
// Example implementation in KYC submission endpoint
io.to('admins').emit('kyc:submitted', {
  riderName: rider.fullName || `${rider.firstName} ${rider.lastName}`,
  firstName: rider.firstName,
  lastName: rider.lastName,
  riderId: rider._id,
  submittedAt: new Date()
});
```

**Endpoints to update**:
- `/api/rider/verification/submit` or similar KYC submission endpoint
- `/api/rider/kyc/submit` or similar endpoint

## Testing Checklist

### Frontend Testing
- ✅ Notification permission requested on admin login
- ✅ Socket connection established and 'admins' room joined
- ✅ Event listeners registered for user:registered and kyc:submitted
- ✅ Push notifications display correctly with proper titles and messages

### Backend Testing (Pending)
- ⏳ Socket event emitted on customer registration
- ⏳ Socket event emitted on rider registration  
- ⏳ Socket event emitted on KYC submission
- ⏳ Events received by all connected admin clients
- ⏳ Event payload includes all required fields (role, name, etc.)

## Socket Event Payloads

### user:registered
```javascript
{
  role: string,        // 'customer' or 'rider'
  name: string,        // Full name or firstName + lastName
  firstName: string,   // Optional
  lastName: string,    // Optional
  email: string,       // Optional
  userId: string       // User ID
}
```

### kyc:submitted
```javascript
{
  riderName: string,   // Full name or firstName + lastName
  firstName: string,   // Optional
  lastName: string,    // Optional
  riderId: string,     // Rider ID
  submittedAt: Date    // Submission timestamp
}
```

## Notes

1. **Room-based targeting**: Events are emitted to the 'admins' room, so all connected admin users receive the notifications
2. **Permission handling**: Admins need to grant notification permission the first time they login
3. **Fallback**: If socket events aren't received, admins can still see notifications through the periodic polling (30s interval)
4. **Browser notifications**: Work best when the tab is in the background or minimized
5. **Interaction required**: Notifications are set with `requireInteraction: true`, meaning they stay visible until clicked

## Implementation Priority

1. **HIGH**: Emit user:registered event on customer/rider signup
2. **HIGH**: Emit kyc:submitted event on verification submission
3. **MEDIUM**: Add proper error handling and logging for socket emissions
4. **LOW**: Add notification preferences in admin settings to allow disabling push notifications
