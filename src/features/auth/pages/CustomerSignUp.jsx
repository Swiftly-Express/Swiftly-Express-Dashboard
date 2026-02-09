import { IonPage, IonContent, useIonRouter, IonToast } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { YummyText } from '../../../components/YummyText';
import Button from '../../../components/Button';
import { registerCustomer } from '../../../utils/authApi';
import { setCookie, setJSONCookie } from '../../../utils/cookies';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

const CustomerSignUp = () => {
  const router = useIonRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSwitchToRider = () => {
    router.push('/auth/rider/signup', 'forward', 'push');
  };

  // Handle returnUrl from authentication flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');

    if (returnUrl) {
      // Store returnUrl in sessionStorage so we can use it after signup
      sessionStorage.setItem('auth_return_url', returnUrl);
      try { localStorage.setItem('auth_return_url', returnUrl); } catch (e) { /* ignore */ }

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Public site URL helper - production always uses NEXT_PUBLIC_BASE_URL (or default), dev uses NEXT_PUBLIC_SITE_URL
  const getPublicSiteUrl = () => {
    const prodEnv = import.meta.env.NEXT_PUBLIC_BASE_URL || import.meta.env.VITE_PUBLIC_BASE_URL || 'https://swiftlyxpress.com';
    const devEnv = import.meta.env.NEXT_PUBLIC_SITE_URL || import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:3000';
    const isDev = Boolean(import.meta.env.DEV);
    return (isDev ? devEnv.replace(/\/$/, '') : prodEnv.replace(/\/$/, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Trim and normalize inputs
    const fullName = (formData.fullName || '').toString().trim();
    const emailVal = (formData.email || '').toString().trim();
    const passwordVal = (formData.password || '').toString();
    const confirmVal = (formData.confirmPassword || '').toString();

    if (!passwordVal) {
      setError('Please enter a password');
      return;
    }
    if (!confirmVal) {
      setError('Please confirm your password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      setError('Please enter a valid email address');
      return;
    }

    if (passwordVal.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (passwordVal !== confirmVal) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        fullName,
        email: emailVal,
        password: passwordVal,
        confirmPassword: confirmVal,
        role: 'customer'
      };

      const res = await registerCustomer(payload);

      // Store pending verification data using cookies
      setCookie('pendingVerificationEmail', emailVal, 1);
      setCookie('pendingVerificationType', 'customer', 1);
      setJSONCookie('pending_user_data', { fullName, email: emailVal }, 1);

      // Store user data for later display (cookies)
      setJSONCookie('user_data', { fullName, email: emailVal, name: fullName }, 1);

      // If backend returned a user id, store it for verify/resend endpoints
      try {
        const returnedId = res?.data?.userId || res?.data?.id || res?.data?._id || res?.user?.id || res?.userId || res?.id;
        if (returnedId) localStorage.setItem('pendingVerificationUserId', returnedId);
      } catch (e) {
        // ignore
      }

      // Check for returnUrl and redirect accordingly
      const returnUrl = sessionStorage.getItem('auth_return_url');

      if (document && document.activeElement) document.activeElement.blur();

      if (returnUrl) {
        // Store returnUrl so verify-email page can use it after verification
        sessionStorage.setItem('post_verification_url', returnUrl);
        console.log('[CustomerSignUp] Stored returnUrl for post-verification:', returnUrl);
      }

      router.push('/auth/verify-email', 'forward', 'push');
    } catch (err) {
      console.error('Customer registration failed', err);

      // Check if user already exists
      if (err?.status === 409 || err?.message?.toLowerCase().includes('already exists') || err?.message?.toLowerCase().includes('exist')) {
        setToastMsg('Account already exists! Redirecting to login...');
        setShowToast(true);

        // Redirect to login with returnUrl if it exists
        const returnUrl = sessionStorage.getItem('auth_return_url');

        setTimeout(() => {
          if (returnUrl) {
            router.push(`/auth/customer/login?returnUrl=${encodeURIComponent(returnUrl)}`, 'root', 'replace');
          } else {
            router.push('/auth/customer/login', 'root', 'replace');
          }
        }, 2000);
      } else {
        setError(err?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setError('');
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSignIn = () => {
    // Check if there's a returnUrl we should pass along
    const returnUrl = sessionStorage.getItem('auth_return_url');
    if (returnUrl) {
      router.push(`/auth/customer/login?returnUrl=${encodeURIComponent(returnUrl)}`, 'back', 'pop');
    } else {
      router.push('/auth/customer/login', 'back', 'pop');
    }
  };

  // Ensure API base is absolute. If VITE_API_BASE_URL is set to a relative path
  // (e.g. '/') in dev, convert it to an absolute URL so window.location.href
  // doesn't navigate to the dev server's /api path (causing 404).
  const rawBase = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';
  const apiBase = (typeof window !== 'undefined' && rawBase.startsWith('/'))
    ? `${window.location.origin.replace(/\/$/, '')}${rawBase.replace(/\/$/, '')}`
    : rawBase.replace(/\/$/, '');

  const handleGoogleSignup = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    if (el) {
      el.classList.add('scale-95', 'opacity-90');
    }

    setGoogleLoading(true);

    // Include returnUrl in Google OAuth ONLY if it exists in sessionStorage
    // (sessionStorage is cleared on tab close, preventing stale SmartRide returnUrls)
    const returnUrl = sessionStorage.getItem('auth_return_url');

    if (returnUrl) {
      // Persist for the OAuth callback
      try { setCookie('auth_return_url', returnUrl, 1); } catch (e) { /* ignore */ }
      try {
        localStorage.setItem('swiftly_auth_return_url', returnUrl);
        localStorage.setItem('swiftly_auth_return_timestamp', Date.now().toString());
      } catch (e) { /* ignore */ }
    } else {
      // IMPORTANT: Clear any old returnUrl from previous sessions to prevent unwanted redirects
      try {
        localStorage.removeItem('swiftly_auth_return_url');
        localStorage.removeItem('swiftly_auth_return_timestamp');
        localStorage.removeItem('auth_return_url');
      } catch (e) { /* ignore */ }
    }

    const googleAuthUrl = returnUrl
      ? `${apiBase}/api/auth/google?role=customer&returnUrl=${encodeURIComponent(returnUrl)}`
      : `${apiBase}/api/auth/google?role=customer`;

    console.log('[CustomerSignUp] Redirecting to Google OAuth:', { hasReturnUrl: !!returnUrl, url: googleAuthUrl });

    // let the gradient ring be visible briefly before leaving
    setTimeout(() => {
      window.location.href = googleAuthUrl;
    }, 600);
  };

  return (
    <IonPage>
      <IonContent className="ion-no-padding" scrollY={false}>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={3000}
          position="top"
        />
        <div className="bg-white h-screen justify-between grid grid-cols-1 lg:grid-cols-2 mx-auto py-6 lg:py-8 px-4 gap-4 overflow-hidden">
          {/* Top Right - Join as Rider Button */}
          <YummyText>
              <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleSwitchToRider}
                className="px-4 py-2 text-xs font-medium text-[#00D68F] hover:text-white border-solid hover:bg-[#00D68F] rounded-full transition-all duration-300"
                style={{ borderWidth: '1.5px', borderColor: '#00D68F', borderStyle: 'solid', boxSizing: 'border-box' }}
              >
                Join as Rider
              </button>
            </div>
          </YummyText>

          {/* Left Side - Form */}
          <div className="flex items-center justify-center lg:pr-2 lg:pl-6">
            <div className="w-full max-w-xl">
              {/* Header */}
              <div className="mb-3">
                <YummyText className="text-[#00D68F] !text-[10px] font-medium mb-1">
                  Create Account
                </YummyText>
                <YummyText className="text-lg font-medium text-[#111827]">
                  Join Swiftly Express today
                </YummyText>
              </div>

              {/* Form */}
              <div className="space-y-2">
                <YummyText>
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-[#0A0A0A] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 bg-white border border-[#00D68F] rounded-full text-xs focus:outline-none focus:border-[#00D68F] focus:ring-0 placeholder-[#717182]"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-medium text-[#0A0A0A] mb-1 mt-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 bg-white border border-[#00D68F] rounded-full text-xs focus:outline-none focus:border-[#00D68F] focus:ring-0 placeholder-[#717182]"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-[#0A0A0A] mb-1 mt-2">
                      Password
                    </label>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-[#00D68F] rounded-full text-xs focus:outline-none focus:border-[#00D68F] focus:ring-0 placeholder-[#717182]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-5 transform translate-y-[20%] text-gray-500"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} className="w-5 h-5 text-[#1E1E1E]" />
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-[#0A0A0A] mb-1 mt-2">
                      Confirm Password
                    </label>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-[#00D68F] rounded-full text-xs focus:outline-none focus:border-[#00D68F] focus:ring-0 placeholder-[#717182]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-5 transform translate-y-[20%] text-gray-500"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <IonIcon icon={showConfirmPassword ? eyeOffOutline : eyeOutline} className="w-5 h-5 text-[#1E1E1E]" />
                    </button>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-1.5 mt-2">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                      className="w-3.5 h-3.5 text-green-600 bg-white border-gray-300 !rounded-2xl focus:ring-1 focus:ring-green-500 focus:ring-offset-0 cursor-pointer accent-green-600 mt-0.5"
                      style={{ accentColor: '#00D68F', outline: 'none' }}
                    />
                    <label className="text-xs text-gray-600">
                      I agree to the{' '}
                      <span
                        onClick={() => {
                          const publicSiteUrl = getPublicSiteUrl();
                          window.location.href = `${publicSiteUrl}/terms-of-service`;
                        }}
                        className="text-[#00D68F] cursor-pointer hover:underline"
                        role="link"
                        tabIndex={0}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const publicSiteUrl = getPublicSiteUrl();
                            window.location.href = `${publicSiteUrl}/terms-of-service`;
                          }
                        }}
                      >
                        Terms of Service
                      </span>{' '}
                      and{' '}
                      <span
                        onClick={() => {
                          const publicSiteUrl = getPublicSiteUrl();
                          window.location.href = `${publicSiteUrl}/privacy-policy`;
                        }}
                        className="text-[#00D68F] cursor-pointer hover:underline"
                        role="link"
                        tabIndex={0}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const publicSiteUrl = getPublicSiteUrl();
                            window.location.href = `${publicSiteUrl}/privacy-policy`;
                          }
                        }}
                      >
                        Privacy Policy
                      </span>
                    </label>
                  </div>
                </YummyText>

                {/* Error Display */}
                {error && (
                  <div className="text-red-500 text-xs mb-2 text-center p-2 bg-red-50 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Create Account Button */}
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!formData.agreeToTerms || loading}
                  className={`!w-full !py-2 !bg-[#00B75A] text-xs !text-white rounded-full transition-all duration-300 ${formData.agreeToTerms && !loading ? 'hover:!bg-[#00D68F] opacity-100' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <YummyText>{loading ? 'Creating Account...' : 'Create Account'}</YummyText>
                </Button>

                {/* Divider */}
                <YummyText>
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#00D68F]"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-white text-gray-500">Or sign up with email</span>
                    </div>
                  </div>
                </YummyText>

                {/* Google Button */}
                <div className={`border border-[#00D68F] rounded-full [&>button]:border-0 ${googleLoading ? 'pointer-events-none' : ''}`}>
                  <div className={googleLoading ? 'btn-gradient-ring' : ''}>
                    {googleLoading && <span className="gradient-ring" />}
                    {googleLoading && <span className="gradient-inner-cover" />}
                    <button
                      type="button"
                      className={`w-full flex items-center justify-center gap-2 py-2 transition-transform duration-150 ${googleLoading ? 'relative z-10' : ''}`}
                      onClick={handleGoogleSignup}
                      disabled={googleLoading}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <YummyText className="text-xs font-medium text-gray-700">Sign up with Google</YummyText>
                    </button>
                  </div>
                </div>
                {/* Apple Button */}
                <div className="border border-[#00D68F] rounded-full [&>button]:border-0">
                  <button className="w-full flex items-center justify-center gap-2 py-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <YummyText className="text-xs font-medium text-gray-700">Sign up with Apple</YummyText>
                  </button>
                </div>

                {/* Sign In Link */}
                <div className="text-center mt-3">
                  <YummyText className="text-xs text-gray-600">
                    Already have an account?{' '}
                    <span onClick={handleSignIn} className="text-[#00D68F] font-medium cursor-pointer hover:underline">
                      Sign In
                    </span>
                  </YummyText>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Image (hidden on small screens) */}
          <div className="hidden lg:flex relative bg-[#00B75A] rounded-[32px] p-8 flex-col justify-start overflow-hidden max-h-full">
            {/* Text Content at Top */}
            <div className="relative z-10 mt-2">
              <YummyText className="text-sm text-white mb-3 opacity-90 leading-[1.3] font-[400]">
                Need fast delivery? Sign up on Swiftly to send parcels <br /> safely, reliably, and in minutes.
              </YummyText>
              <YummyText className="text-3xl font-[300] leading-none text-white mb-4">
                Send Packages<br />with <span className="text-[#1E1E1E] font-semibold">Ease</span>
              </YummyText>
            </div>

            {/* Illustration below text (centered) */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src="/lady-package.svg"
                alt="Customer with Packages"
                className="w-full h-auto object-contain object-right-bottom max-h-[65vh]"
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CustomerSignUp;