import { IonPage, IonContent, useIonRouter, IonIcon, IonToast } from '@ionic/react';
import React, { useState } from 'react';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { YummyText } from '../../../components/YummyText';
import Button from '../../../components/Button';
import { login, getCurrentUser, logout } from '../../../utils/authApi';
import { setCookie, setJSONCookie } from '../../../utils/cookies';

const CustomerLogin = () =>
{
  const router = useIonRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Resend Verification State
  const [showResend, setShowResend] = useState(false);
  const [unverifiedUserId, setUnverifiedUserId] = useState(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e) =>
  {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setError('');
      // Call backend login with intended role
      const res = await login({
        email: formData.email.trim(),
        password: formData.password,
        role: 'customer' // Enforce intention
      });

      console.log('[CustomerLogin] Login successful, user_data stored');

      // Fetch user profile to ensure everything is synced (optional but good)
      try { await getCurrentUser(); } catch (e) { /* ignore */ }

      // Redirect to customer dashboard
      if (document && document.activeElement) document.activeElement.blur();
      router.push('/customer/dashboard', 'forward', 'push');
    } catch (err) {
      console.error('Login error:', err);

      // Handle Role Mismatch
      if (err.code === 'ROLE_MISMATCH') {
        console.warn('[CustomerLogin] ⚠️ Role Mismatch caught');
        const isRider = err.actualRole === 'rider' || err.actualRole === 'driver';

        const redirectPath = isRider ? '/auth/rider/login' : '/auth/login';
        const redirectLabel = isRider ? 'Rider Login' : 'Login';

        setError(
          <span>
            Access Denied. You are a {err.actualRole}.<br />
            Redirecting you to {redirectLabel} in 3 seconds...<br />
            <a href={redirectPath} className="text-[#00B75A] font-medium underline mt-1 block">
              Click here to go now
            </a>
          </span>
        );

        // Auto-redirect
        setTimeout(() =>
        {
          window.location.href = redirectPath;
        }, 3000);
        setGoogleLoading(false);
        return;
      }

      console.error('Error details:', {
        message: err?.message,
        status: err?.status,
        data: err?.data
      });

      let message = 'Login failed. Please try again.';

      if (err?.status === 401) {
        message = 'Invalid email or password';
      } else if (err?.status === 500 && err?.message?.includes('secretOrPrivateKey')) {
        message = 'Server configuration error. Please contact support or check backend JWT_SECRET is set.';
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
      setToastMsg(message);
      setShowToast(true);

      // Handle unverified email error
      if (err?.status === 403 && (message.toLowerCase().includes('verify') || message.toLowerCase().includes('email'))) {
        console.log('[CustomerLogin] User email not verified');

        // Store email/userId for resending
        // Check both nested data (standard) and direct property (fallback)
        const userId = err.data?.data?.userId || err.data?.userId;

        if (userId) {
          setUnverifiedUserId(userId);
          console.log('[CustomerLogin] Captured unverified userId:', userId);
        } else {
          console.warn('[CustomerLogin] Could not capture userId from error response:', err.data);
        }
        setUnverifiedEmail(formData.email);
        setShowResend(true); // Trigger UI to show button
      }
    } finally {
      setGoogleLoading(false); // Ensure loading state is cleared
    }
  };

  const handleResendVerification = async () =>
  {
    if (!unverifiedUserId) {
      // Fallback to simple redirect if we somehow don't have ID
      router.push('/auth/verify-email', 'forward', 'push');
      return;
    }

    try {
      setResendLoading(true);
      // We need to import resendVerification from utils/authApi
      const { resendVerification } = await import('../../../utils/authApi');
      await resendVerification({ userId: unverifiedUserId });

      setToastMsg('Verification code sent! Redirecting...');
      setShowToast(true);

      // Store cookie for the next page
      setCookie('pendingVerificationEmail', unverifiedEmail, 1);
      setCookie('pendingVerificationType', 'customer', 1);
      setCookie('pendingVerificationUserId', unverifiedUserId, 1);

      setTimeout(() =>
      {
        router.push('/auth/verify-email', 'forward', 'push');
      }, 1500);
    } catch (err) {
      console.error('Resend failed', err);
      setToastMsg('Failed to resend code. Please try again.');
      setShowToast(true);
      setResendLoading(false); // Only stop loading on error
    }
  };

  const handleForgotPassword = () =>
  {
    router.push('/forgot-password?role=customer');
  };

  const handleCreateAccount = () =>
  {
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/customer/signup');
  };

  // Google OAuth start (redirect to backend which begins OAuth handshake)
  const rawBase = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';
  const apiBase = (typeof window !== 'undefined' && rawBase.startsWith('/'))
    ? `${window.location.origin.replace(/\/$/, '')}${rawBase.replace(/\/$/, '')}`
    : rawBase.replace(/\/$/, '');

  const handleGoogleLogin = (e) =>
  {
    e.preventDefault();
    try {
      setGoogleLoading(true);
      const googleUrl = `${apiBase}/api/auth/google?role=customer`;
      console.log('[CustomerLogin] Redirecting to:', googleUrl);
      setTimeout(() =>
      {
        window.location.href = googleUrl;
      }, 200);
    } catch (err) {
      console.error('[CustomerLogin] failed to start Google OAuth', err);
      setGoogleLoading(false);
    }
  };

  const handleChange = (fieldOrEvent, value) =>
  {
    setError('');
    // support both (e) event handlers or (field, value) calls
    if (typeof fieldOrEvent === 'string') {
      setFormData({
        ...formData,
        [fieldOrEvent]: value
      });
    } else if (fieldOrEvent && fieldOrEvent.target) {
      const e = fieldOrEvent;
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-no-padding">
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={3000}
          position="top"
        />
        <div className="bg-white grid grid-cols-1 lg:grid-cols-2 min-h-screen justify-between mx-auto py-8 lg:py-12 px-6 gap-6">
          {/* Left Side - Form */}
          <div className="flex items-center justify-center lg:pr-2 lg:pl-8">
            <div className="w-full max-w-xl">
              {/* Header */}
              <div className="mb-8">
                <YummyText className="text-[#00D68F] text-sm font-medium mb-2">
                  Customer
                </YummyText>
                <YummyText className="text-3xl font-[400] text-[#111827] mb-3">
                  Sign In
                </YummyText>
                <YummyText className="text-sm text-[#6B7280] leading-relaxed">
                  Log in to view assigned deliveries, update your <br className="sm:hidden md:inline" /> status, and keep<br className="hidden lg:inline" />
                  customers moving — one delivery <br className="sm:hidden md:inline" /> at a time.
                </YummyText>
              </div>

              {/* Form */}
              <div className="space-y-2">
                {/* Email */}
                <div>
                  <YummyText className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </YummyText>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-[#F3F4F6] text-xs rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-[#9CA3AF]"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <YummyText className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </YummyText>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange(e)}
                    placeholder="***********"
                    className="w-full px-4 py-3 bg-[#F3F4F6] rounded-full focus:outline-none focus:ring focus:ring-green-500 placeholder-[#9CA3AF]"
                    style={{ fontFamily: 'inherit' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-10 text-gray-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} className="w-6 h-6 text-[#1E1E1E]" />
                  </button>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => handleChange('rememberMe', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-white border-gray-300 mb-4 !rounded-2xl focus:ring-1 focus:ring-green-500 focus:ring-offset-0 cursor-pointer accent-green-600"
                      style={{ accentColor: '#00D68F', outline: 'none' }}
                    />
                    <YummyText className="text-sm text-gray-700 mb-4">
                      Remember me
                    </YummyText>
                  </div>
                  <span
                    onClick={handleForgotPassword}
                    className="text-sm text-[#00D68F] cursor-pointer mb-4"
                  >
                    <YummyText>forgot password?</YummyText>
                  </span>
                </div>

                {/* Log In Button */}
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  className="!w-full !py-3 !bg-[#00B75A] hover:!bg-[#00B876] !mb-3 !text-white rounded-full transition-all duration-300"
                >
                  <YummyText className="font-[300] text-sm">Log In</YummyText>
                </Button>

                {/* Resend Verification Button - Only shown when needed */}
                {showResend && (
                  <Button
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="!w-full !py-3 !border-[#00B75A] !text-[#00B75A] hover:!bg-green-50 !mb-3 rounded-full transition-all duration-300"
                  >
                    <YummyText className="font-[300] text-sm">
                      {resendLoading ? 'Sending...' : 'Resend Verification Code'}
                    </YummyText>
                  </Button>
                )}

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center mb-2">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-400 mb-2">Or Continue with email</span>
                  </div>
                </div>

                {/* Google Button */}
                <div className={`border border-gray-300 rounded-full [&>button]:border-0 ${googleLoading ? 'pointer-events-none' : ''}`}>
                  <button onClick={handleGoogleLogin} disabled={googleLoading} className={`w-full flex items-center justify-center gap-3 py-3 ${googleLoading ? 'opacity-80' : ''}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <YummyText className="text-sm font-medium text-[#1E1E1E]">Continue with Google</YummyText>
                  </button>
                </div>

                {/* Apple Button */}
                <div className="border border-gray-300 !mb-4 rounded-full [&>button]:border-0">
                  <button className="w-full flex items-center justify-center gap-3 py-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <YummyText className="!text-sm !font-medium !text-[#1E1E1E]">Continue with Apple</YummyText>
                  </button>
                </div>

                {/* Create Account Link */}
                <div className="text-center mt-6">
                  <YummyText className="text-xs medium text-[#1E1E1E]">
                    Don't have an account?{' '}
                    <span onClick={handleCreateAccount} className="text-[#00D68F] font-medium cursor-pointer hover:text-[#1E1E1E]">
                      Create one now
                    </span>
                  </YummyText>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="hidden lg:flex bg-[#00B75A] rounded-[50px] relative ml-2 mr-8 overflow-hidden items-end justify-center">
            <div className="relative w-full h-full flex flex-col">
              {/* Delivery Illustration - centered and reduced size */}
              <div className="absolute top-5 left-0 right-0 w-full">
                <img
                  src="/signin-image.svg"
                  alt="Hero on Wheels"
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Text Content at Bottom */}
              <div className="relative z-10 text-white leading-none break ml-8 mb-8 mt-auto">
                <YummyText className="text-3xl font-[400]">
                  Welcome Back,<br />Manage all your others <br /> with <span className="text-[#1E1E1E] font-semibold">Ease</span>
                </YummyText>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CustomerLogin;