# Production Deployment Checklist

## ✅ Current Production Configuration Status

### API Configuration
- **Production API URL**: `https://api.swiftlyxpress.com`
- **Environment Variable**: `VITE_API_BASE_URL` (configured)
- **Cookie Authentication**: HttpOnly cookies with Secure flag on HTTPS ✓
- **CORS**: `withCredentials: true` enabled ✓

---

## 🔧 Before Deploying to Production

### 1. Backend Requirements (Critical)
Your backend **must** have these configurations:

#### A. Environment Variables
```bash
# Backend .env file
JWT_SECRET=<your-secure-random-32-char-secret>
NODE_ENV=production
FRONTEND_URL=https://swiftlyxpress.com
```

#### B. CORS Configuration
```javascript
// Backend server (Express example)
app.use(cors({
  origin: 'https://swiftlyxpress.com', // Your production frontend URL
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### C. Cookie Setup on Login
```javascript
// Backend login endpoint
res.cookie('auth_token', jwtToken, {
  httpOnly: true,      // XSS protection
  secure: true,        // HTTPS only (must be true in production)
  sameSite: 'Lax',     // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
  domain: '.swiftlyxpress.com' // Share across subdomains
});
```

#### D. Logout Endpoint
```javascript
// Backend logout endpoint
res.clearCookie('auth_token', { 
  path: '/',
  domain: '.swiftlyxpress.com'
});
```

---

### 2. Frontend Build & Deploy

#### A. Build for Production
```bash
# Build optimized production bundle
npm run build

# Output will be in dist/ folder
```

#### B. Environment Variables (Platform-specific)

**Vercel:**
```bash
# Add in Vercel dashboard → Settings → Environment Variables
VITE_API_BASE_URL=https://api.swiftlyxpress.com
```

**Netlify:**
```bash
# netlify.toml or dashboard
[build.environment]
  VITE_API_BASE_URL = "https://api.swiftlyxpress.com"
```

**Custom Server/VPS:**
```bash
# Create .env.production file (already done ✓)
VITE_API_BASE_URL=https://api.swiftlyxpress.com
```

#### C. Deploy Commands
```bash
# Test production build locally first
npm run build
npm run preview

# Then deploy
git push origin main  # If using auto-deploy (Vercel/Netlify)
# OR upload dist/ folder to your hosting
```

---

### 3. DNS & SSL Configuration

**Ensure these are set up:**
- ✓ `swiftlyxpress.com` → Frontend hosting
- ✓ `api.swiftlyxpress.com` → Backend server
- ✓ SSL certificates installed on both domains (HTTPS)
- ✓ Both domains use the same root domain for cookie sharing

---

### 4. Post-Deployment Testing

After deploying, test these flows:

#### Test 1: Registration
```
1. Go to https://swiftlyxpress.com/auth/customer/signup
2. Register new account
3. Verify email
4. Check: redirects to login
```

#### Test 2: Login & Cookie
```
1. Login with credentials
2. Open DevTools → Application → Cookies
3. Verify: auth_token cookie exists with:
   - HttpOnly: ✓
   - Secure: ✓
   - SameSite: Lax
   - Domain: .swiftlyxpress.com or swiftlyxpress.com
```

#### Test 3: Authenticated Request
```
1. After login, go to Book Delivery page
2. Fill form and submit
3. Open DevTools → Network → POST /api/customer/deliveries
4. Check Request Headers: should have "Cookie: auth_token=..."
5. Check Response: should be 200 OK (not 401)
```

#### Test 4: Logout
```
1. Logout
2. Check Cookies: auth_token should be deleted
3. Try accessing Book page: should redirect to login
```

---

## 🐛 Common Production Issues & Fixes

### Issue: "CORS error" in production
**Cause**: Backend CORS not configured for production domain  
**Fix**: Update backend CORS origin to `https://swiftlyxpress.com`

### Issue: Cookie not being set
**Cause**: `secure: true` requires HTTPS  
**Fix**: Ensure both frontend and backend use HTTPS in production

### Issue: Cookie not sent with requests
**Cause**: Domain mismatch or SameSite restrictions  
**Fix**: Set cookie `domain: '.swiftlyxpress.com'` to share across subdomains

### Issue: "secretOrPrivateKey must have a value"
**Cause**: Backend missing JWT_SECRET environment variable  
**Fix**: Add `JWT_SECRET` to backend .env file

### Issue: 401 Unauthorized on authenticated routes
**Cause**: Cookie not being sent or backend not reading it  
**Fix**: 
1. Check `withCredentials: true` in frontend (✓ already done)
2. Check backend reads cookie: `req.cookies.auth_token`
3. Verify CORS allows credentials

---

## 📋 Pre-Launch Checklist

- [ ] Backend has `JWT_SECRET` set
- [ ] Backend CORS configured for production domain
- [ ] Backend sets HttpOnly cookie on login
- [ ] Backend reads cookie on protected routes
- [ ] SSL certificates installed (HTTPS)
- [ ] Frontend build completed (`npm run build`)
- [ ] Environment variables set in hosting platform
- [ ] Test login flow in production
- [ ] Test authenticated requests work
- [ ] Test logout clears cookie
- [ ] Monitor error logs for first 24 hours

---

## 🔍 Current Status Summary

**Frontend**: ✅ Ready for production  
- Uses `VITE_API_BASE_URL` environment variable
- Defaults to `https://api.swiftlyxpress.com`
- Cookie authentication configured
- withCredentials enabled

**Backend**: ⚠️ Needs configuration  
- Must add JWT_SECRET
- Must configure CORS for production domain
- Must set HttpOnly cookies on login
- Must read cookies from requests

**Next Step**: Share this checklist with your backend developer and ensure all backend requirements are met before deploying.
