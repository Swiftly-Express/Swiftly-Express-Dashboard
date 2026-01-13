# Password Reset Flow - API Requirements

## Overview
This document outlines the API contract needed for the forgot password and reset password flow.

## API Endpoints

### 1. Forgot Password - POST /api/auth/forgot-password

**Purpose**: Initiates the password reset process by sending a reset link to the user's email.

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Expected Behavior**:
1. Verify the email exists in the database
2. Generate a secure, time-limited reset token (e.g., JWT or random string)
3. Store the token with expiry (e.g., 1 hour) associated with the user
4. Send an email to the user containing a reset link:
   - Link format: `https://your-frontend.com/reset-password?token=<reset-token>`
   - Email should include:
     - Clear subject line: "Reset Your Swiftly Express Password"
     - Reset button/link
     - Token expiry time
     - Security note: "If you didn't request this, ignore this email"

**Response**:
- **200 OK** (success):
  ```json
  {
    "message": "Password reset email sent successfully",
    "email": "user@example.com"
  }
  ```
- **400 Bad Request** (validation error):
  ```json
  {
    "message": "Invalid email format"
  }
  ```
- **404 Not Found** (email not found):
  ```json
  {
    "message": "No account found with this email address"
  }
  ```
- **429 Too Many Requests** (rate limit):
  ```json
  {
    "message": "Too many requests. Please try again later."
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "message": "Failed to send reset email"
  }
  ```

**Security Recommendations**:
- Rate limit: Max 3 requests per email per hour
- Always return 200 even if email not found (to prevent email enumeration)
- Use cryptographically secure tokens
- Token should expire after 1 hour
- Log all reset attempts

---

### 2. Reset Password - POST /api/auth/reset-password

**Purpose**: Resets the user's password using the token from the email link.

**Request**:
```json
{
  "token": "<reset-token-from-email>",
  "newPassword": "newSecurePassword123"
}
```

**Expected Behavior**:
1. Verify the token is valid and not expired
2. Find the associated user
3. Validate the new password (min 8 chars, complexity rules if any)
4. Hash the new password
5. Update user's password in database
6. Invalidate/delete the reset token
7. Optionally: Send confirmation email that password was changed

**Response**:
- **200 OK** (success):
  ```json
  {
    "message": "Password reset successful"
  }
  ```
- **400 Bad Request** (validation error):
  ```json
  {
    "message": "Password must be at least 8 characters long"
  }
  ```
- **401 Unauthorized** (invalid/expired token):
  ```json
  {
    "message": "Invalid or expired reset token"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "message": "Failed to reset password"
  }
  ```

**Security Recommendations**:
- Token should be single-use only
- Expire tokens after 1 hour
- Require strong password (min 8 chars, consider complexity rules)
- Hash passwords with bcrypt/argon2
- Invalidate all existing sessions after password reset
- Send confirmation email to user
- Log all password reset completions

---

## Email Template Requirements

### Forgot Password Email

**Subject**: Reset Your Swiftly Express Password

**Body**:
```
Hi [User Name],

We received a request to reset your password for your Swiftly Express account.

Click the button below to reset your password:

[Reset Password Button] -> https://your-frontend.com/reset-password?token=<token>

Or copy and paste this link into your browser:
https://your-frontend.com/reset-password?token=<token>

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

For security reasons, we recommend:
- Using a strong, unique password
- Not sharing your password with anyone
- Enabling two-factor authentication (if available)

Best regards,
The Swiftly Express Team

Support: support@swiftlyxpress.com
Phone: +234 08089000013
```

### Password Reset Confirmation Email (Optional but Recommended)

**Subject**: Your Swiftly Express Password Was Changed

**Body**:
```
Hi [User Name],

This email confirms that your Swiftly Express account password was successfully changed.

If you made this change, you can safely ignore this email.

If you did NOT make this change, please contact our support team immediately:
- Email: support@swiftlyxpress.com
- Phone: +234 08089000013

Best regards,
The Swiftly Express Team
```

---

## Frontend Flow (Already Implemented)

1. **User clicks "Forgot Password?" on login page** → Navigates to `/forgot-password`
2. **User enters email** → Frontend calls `POST /api/auth/forgot-password`
3. **Success message displayed** → "Check your email for reset instructions"
4. **User receives email** → Clicks reset link
5. **Link opens** → `/reset-password?token=xyz`
6. **User enters new password** → Frontend calls `POST /api/auth/reset-password`
7. **Success** → Redirects to login page with success message
8. **User logs in** → With new password

---

## Database Schema Recommendations

### Option 1: Separate Reset Tokens Table
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_user_id_reset ON password_reset_tokens(user_id);
```

### Option 2: Add fields to Users Table
```sql
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;
```

---

## Testing Checklist

- [ ] Forgot password with valid email → Email sent
- [ ] Forgot password with invalid email → Appropriate error
- [ ] Forgot password with non-existent email → Success response (security)
- [ ] Rate limiting works → Max 3 requests per hour
- [ ] Reset with valid token → Password changed
- [ ] Reset with expired token → Error
- [ ] Reset with used token → Error
- [ ] Reset with invalid token → Error
- [ ] Password validation works → Min 8 chars
- [ ] User can login with new password
- [ ] Old password no longer works
- [ ] Confirmation email sent after reset
- [ ] Token expires after 1 hour
- [ ] Multiple reset requests invalidate previous tokens

---

## Environment Variables Required

```env
# Email Service (choose one)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@swiftlyxpress.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@swiftlyxpress.com

# OR use a service like SendGrid
SENDGRID_API_KEY=your-sendgrid-key

# Frontend URL for reset links
FRONTEND_URL=https://your-frontend.com

# Token settings
RESET_TOKEN_EXPIRY=3600  # 1 hour in seconds
```

---

## Error Handling Best Practices

1. **Don't leak information**: Always return generic messages for security
2. **Log everything**: Log all attempts, successes, and failures
3. **Rate limiting**: Prevent abuse
4. **Validate inputs**: Check email format, password strength
5. **Use HTTPS**: Never send tokens over HTTP
6. **Token security**: Use cryptographically secure random tokens
7. **Email deliverability**: Use proper SPF, DKIM, DMARC records

---

## Implementation Priority

1. ✅ **DONE**: Frontend forgot password page
2. ✅ **DONE**: Frontend reset password page
3. ✅ **DONE**: Frontend routing and navigation
4. ⏳ **TODO**: Backend - Implement POST /api/auth/forgot-password
5. ⏳ **TODO**: Backend - Implement POST /api/auth/reset-password
6. ⏳ **TODO**: Backend - Email service integration
7. ⏳ **TODO**: Backend - Token generation and validation
8. ⏳ **TODO**: Backend - Database schema updates
9. ⏳ **TODO**: End-to-end testing

---

## Quick Test Commands (for backend dev)

```bash
# Test forgot password
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test reset password
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"xyz123","newPassword":"newPassword123"}'
```
