import { IonPage, IonContent, useIonRouter, IonIcon } from '@ionic/react';
import React, { useState } from 'react';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { YummyText } from '../../../components/YummyText';
import Button from '../../../components/Button';
import { registerRider } from '../../../utils/authApi';
import { setCookie, setJSONCookie } from '../../../utils/cookies';

const RiderSignup = () => {
  const router = useIonRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Ensure API base is absolute. If VITE_API_BASE_URL is set to a relative path
  // (e.g. '/') in dev, convert it to an absolute URL so window.location.href
  // doesn't navigate to the dev server's /api path (causing 404).
  const rawBase = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';
  const apiBase = (typeof window !== 'undefined' && rawBase.startsWith('/'))
    ? `${window.location.origin.replace(/\/$/, '')}${rawBase.replace(/\/$/, '')}`
    : rawBase.replace(/\/$/, '');
  const googleAuthUrl = `${apiBase}/api/auth/google?role=rider`;

  // Public site URL helper - production always uses NEXT_PUBLIC_BASE_URL (or default), dev uses NEXT_PUBLIC_SITE_URL
  const getPublicSiteUrl = () => {
    const prodEnv = import.meta.env.NEXT_PUBLIC_BASE_URL || import.meta.env.VITE_PUBLIC_BASE_URL || 'https://swiftlyxpress.com';
    const devEnv = import.meta.env.NEXT_PUBLIC_SITE_URL || import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:3000';
    const isDev = Boolean(import.meta.env.DEV);
    return (isDev ? devEnv.replace(/\/$/, '') : prodEnv.replace(/\/$/, ''));
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignup = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    if (el) {
      el.classList.add('scale-95', 'opacity-90');
    }
    console.log('[RiderSignUp] Redirecting to:', googleAuthUrl);
    setGoogleLoading(true);
    // show gradient ring briefly before leaving
    setTimeout(() => {
      window.location.href = googleAuthUrl;
    }, 600);
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');

    // Basic validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };

      const res = await registerRider(payload);

      // Store pending verification data in cookies (1 day expiration)
      setCookie('pendingVerificationEmail', formData.email, 1);
      setCookie('pendingVerificationType', 'rider', 1);
      setJSONCookie('pendingUserData', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        vehicleType: formData.vehicleType
      }, 1);

      // If backend returned a user id, store it for verify/resend endpoints
      try {
        const returnedId = res?.data?.userId || res?.data?.id || res?.data?._id || res?.user?.id || res?.userId || res?.id;
        if (returnedId) setCookie('pendingVerificationUserId', returnedId, 1);
      } catch (e) {
        // ignore
      }

      if (document && document.activeElement) document.activeElement.blur();
      router.push('/auth/verify-email', 'forward', 'push');
    } catch (err) {
      console.error('Rider registration failed', err);
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setError(''); // Clear error when user makes changes
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSignIn = () => {
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/rider/login', 'forward', 'push');
  };

  return (
    <IonPage>
      <IonContent className="ion-no-padding" scrollY={false}>
        <div className="bg-white grid grid-cols-1 lg:grid-cols-2 h-screen justify-between mx-auto py-6 lg:py-8 px-4 gap-4 overflow-hidden">
          {/* Left Side - Form */}
          <div className="flex items-center justify-center lg:pr-2 lg:pl-6">
            <div className="w-full max-w-xl">
              {/* Header */}
              <div className="mb-3">
                <YummyText className="text-[#00D68F] !text-sm font-medium mb-1">
                  Create Account
                </YummyText>
                <YummyText className="text-xl font-medium text-[#111827]">
                  Join Swiftly Express today
                </YummyText>
              </div>

              {/* Form */}
              <div className="space-y-2">
                {/* Full Name */}
                <YummyText>
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
                        onClick={(e) => {
                          e.preventDefault();
                          // Force full navigation to public site with correct port
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
                        onClick={(e) => {
                          e.preventDefault();
                          const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:3001';
                          window.location.href = `${publicSiteUrl}/privacy-policy`;
                        }}
                        className="text-[#00D68F] cursor-pointer hover:underline"
                        role="link"
                        tabIndex={0}
                        onKeyPress={(e) => { if (e.key === 'Enter') { window.location.href = '/privacy-policy'; } }}
                      >
                        Privacy Policy
                      </span>
                    </label>
                  </div>
                </YummyText>

                {/* Create Account Button */}
                {error && (
                  <div className="text-red-500 text-xs mb-2 text-center">
                    {error}
                  </div>
                )}
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  className={`!w-full !py-2 !bg-[#00B75A] text-xs !text-white rounded-full transition-all duration-300 ${formData.agreeToTerms ? 'hover:!bg-[#00D68F] opacity-100' : 'opacity-50 cursor-not-allowed'}`}
                  disabled={!formData.agreeToTerms}
                >
                  <YummyText>Create Account</YummyText>
                </Button>

                {/* Divider */}
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#00D68F]"></div>
                  </div>
                  <YummyText>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-white text-gray-500">Or sign up with email</span>
                    </div>
                  </YummyText>
                </div>

                {/* Google Button */}
                <div className={`border border-[#00D68F] rounded-full [&>button]:border-0 ${googleLoading ? 'pointer-events-none' : ''}`}>
                  <div className={googleLoading ? 'btn-gradient-ring' : ''}>
                    {googleLoading && <span className="gradient-ring" />}
                    {googleLoading && <span className="gradient-inner-cover" />}
                    <button type="button" className={`w-full flex items-center justify-center gap-2 py-2 transition-transform duration-150 ${googleLoading ? 'relative z-10' : ''}`} onClick={handleGoogleSignup} disabled={googleLoading}>
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

          {/* Right Side - Image */}
          <div className="hidden lg:flex bg-[#1E1E1E] rounded-[50px] relative ml-2 mr-6 overflow-hidden p-8 max-h-full">
            <div className="relative w-full h-full flex flex-col justify-end pb-4">
              {/* Rider Illustration */}
              <div className="absolute -top-2 left-72 transform -translate-x-1/2 w-[85%]">
                <img
                  src="/despatch-man.svg"
                  alt="Become a Rider"
                  className="w-full h-auto object-contain max-h-[60vh]"
                />
              </div>

              {/* Text Content at Bottom */}
              <div className="relative z-10 text-white">
                <YummyText className="text-4xl font-[300] leading-tight mb-3">
                  Become a<br />Swiftly <span className="text-[#00D68F] font-semibold">Rider</span>
                </YummyText>
                <YummyText className="text-medium opacity-90 leading-relaxed">
                  Earn more while delivering faster. Join Swiftly's<br />
                  growing network of professional riders and start<br />
                  receiving delivery requests instantly.
                </YummyText>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RiderSignup;