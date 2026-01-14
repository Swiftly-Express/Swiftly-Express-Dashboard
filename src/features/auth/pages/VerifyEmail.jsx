import React, { useState, useRef, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { YummyText } from '../../../components/YummyText';
import { verifyEmail, resendVerification } from '../../../utils/authApi';
import { getCookie, setCookie, deleteCookie, getJSONCookie } from '../../../utils/cookies';

const VerifyEmail = () =>
{
  const router = useIonRouter();
  const location = useLocation(); // Gets the current location object
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const inputRefs = useRef([]);
  // Ref to track if we've already attempted auto-verification to prevent double calls
  const autoVerifyAttempted = useRef(false);

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const urlCode = queryParams.get('code');
  const urlUserId = queryParams.get('userId');

  // Get email and user type from navigation state or cookies
  const email = getCookie('pendingVerificationEmail') || getCookie('verifiedEmail') || 'user@email.com';
  const userType = getCookie('pendingVerificationType') || 'customer';
  // Prefer the URL userId if available, otherwise fall back to cookie
  const pendingVerificationUserId = urlUserId || getCookie('pendingVerificationUserId') || null;

  // Effect to handle URL parameters and Auto-Verification
  useEffect(() =>
  {
    // 1. Hydrate userId cookie for resilience (Resend OTP support)
    if (urlUserId) {
      setCookie('pendingVerificationUserId', urlUserId, 1);
      console.log('[VerifyEmail] Hydrated pendingVerificationUserId from URL:', urlUserId);
    }

    // 2. Auto-fill OTP if code is present
    if (urlCode && urlCode.length === 6) {
      const codeArray = urlCode.split('').slice(0, 6);
      setOtp(codeArray);

      // 3. Auto-trigger verification if both code and userId are present
      // Only verify if we haven't tried yet and aren't currently verifying
      if (urlUserId && !isVerifying && !showLoginPrompt && !autoVerifyAttempted.current) {
        console.log('[VerifyEmail] Auto-triggering verification from URL params');
        autoVerifyAttempted.current = true;
        handleVerify(urlCode, urlUserId);
      }
    }
  }, [urlCode, urlUserId]);

  // Countdown timer for resend button
  useEffect(() =>
  {
    if (countdown > 0 && !showLoginPrompt) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, showLoginPrompt]);

  // Handle OTP input change
  const handleChange = (index, value) =>
  {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) =>
  {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) =>
  {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (!pastedData) return;

    const newOtp = ['', '', '', '', '', ''];
    pastedData.split('').forEach((char, index) =>
    {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus the last filled input or the next empty one
    const nextIndex = Math.min(pastedData.length, 5);
    setTimeout(() =>
    {
      inputRefs.current[nextIndex]?.focus();
    }, 0);
  };

  // Handle verify - optionally accepts arguments for auto-verification
  const handleVerify = async (codeOverride = null, userIdOverride = null) =>
  {
    const otpCode = codeOverride || otp.join('');
    const userIdToUse = userIdOverride || pendingVerificationUserId;

    if (otpCode.length !== 6) {
      alert('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyEmail({
        code: otpCode,
        userId: userIdToUse
      });

      console.log('[VerifyEmail] ✓ Verification response:', response);

      // Check if we got tokens (authenticated) or need to login
      if (response.authenticated === false || response.requiresLogin === true) {
        console.log('[VerifyEmail] ⚠ Email verified but requires login');
        setShowLoginPrompt(true);
      } else {
        // Check if tokens were stored
        const storedToken = userType === 'rider' || userType === 'driver'
          ? getCookie('rider_token')
          : getCookie('customer_token');

        if (storedToken) {
          console.log('[VerifyEmail] ✓ Authenticated - redirecting to dashboard');

          // Clear pending data
          deleteCookie('pendingVerificationEmail');
          deleteCookie('pendingVerificationType');
          deleteCookie('pendingVerificationUserId');

          // Use a small timeout to ensure cookies are set before redirect
          setTimeout(() =>
          {
            alert('Email verified successfully!');
            // Redirect to dashboard
            if (userType === 'rider' || userType === 'driver') {
              router.push('/rider/dashboard', 'root', 'replace');
            } else {
              router.push('/customer/dashboard', 'root', 'replace');
            }
          }, 500);

        } else {
          console.warn('[VerifyEmail] ⚠ Verification succeeded but no token found');
          setShowLoginPrompt(true);
        }
      }

    } catch (err) {
      console.error('[VerifyEmail] ❌ Verification failed:', err);
      // Don't show alert for auto-verification failures, just log it and let user try manually?
      // Actually, better to show it so they know why it didn't work.
      alert(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () =>
  {
    if (countdown > 0) return;

    // Ensure we have a userId to resend to
    if (!pendingVerificationUserId) {
      alert("Cannot resend code: Missing User ID. Please try logging in again.");
      return;
    }

    setIsResending(true);
    try {
      await resendVerification({ email, userId: pendingVerificationUserId });
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      alert('A new verification code has been sent to your email');
    } catch (err) {
      console.error('Resend failed', err);
      alert(err?.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleProceedToLogin = () =>
  {
    // Use correct login routes
    const loginPath = userType === 'rider' || userType === 'driver'
      ? '/auth/rider/login'
      : '/auth/customer/login';

    router.push(loginPath, 'root', 'replace');
  };

  // KEEP YOUR ORIGINAL UI - Just add login prompt overlay when needed
  return (
    <IonPage>
      <IonContent className="ion-no-padding !fullscreen">
        <div className="!h-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          {/* Left Side - Verification Form */}
          <div className="bg-white flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 min-h-screen lg:min-h-0 overflow-y-auto">
            <div className="w-full max-w-md">
              {/* Back Button */}
              <button
                onClick={() => router.goBack()}
                className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] mb-8 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <YummyText>
                  <span className="text-sm font-medium">Back</span>
                </YummyText>
              </button>

              <YummyText>
                {/* Heading */}
                <div className="items-center justify-center mb-6">
                  <h1 className="text-xl sm:text-2xl font-medium text-[#00B75A] mb-2">
                    Email Verification
                  </h1>
                  <p className="text-xs sm:text-sm text-[#0A0A0A]">
                    We've sent a One-Time Password (OTP) to your email. Please enter the code to complete your account verification.
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex gap-1.5 sm:gap-2 mb-5 justify-center sm:justify-start">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-center text-lg sm:text-xl font-medium border-2 border-[#F3F4F6] rounded-lg sm:rounded-xl focus:border-[#00D68F] focus:outline-none transition-colors"
                      autoFocus={index === 0}
                      disabled={showLoginPrompt}
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button
                  onClick={() => handleVerify()}
                  disabled={isVerifying || otp.join('').length !== 6 || showLoginPrompt}
<<<<<<< HEAD
                  className={`w-full py-3 sm:py-4 rounded-xl font-medium transition-colors mb-4 text-sm sm:text-base ${isVerifying || otp.join('').length !== 6 || showLoginPrompt
                      ? 'bg-[#00B75A] text-[#FFFFFF] opacity-[50%] cursor-not-allowed'
                      : 'bg-[#00B75A] hover:bg-[#00B876] text-white'
                    }`}
=======
                  className={`py-3 rounded-xl font-medium transition-colors mb-4 ${isVerifying || otp.join('').length !== 6 || showLoginPrompt
                    ? 'bg-[#00B75A] text-[#FFFFFF] opacity-[50%] cursor-not-allowed'
                    : 'bg-[#00B75A] hover:bg-[#00B876] text-white'
                    }`}
                  style={{ width: `${otp.length * 80 + (otp.length - 1) * 8}px` }}
                  className={`w-full py-3 sm:py-4 rounded-xl font-medium transition-colors mb-4 text-sm sm:text-base ${isVerifying || otp.join('').length !== 6 || showLoginPrompt
                      ? 'bg-[#00B75A] text-[#FFFFFF] opacity-[50%] cursor-not-allowed'
                      : 'bg-[#00B75A] hover:bg-[#00B876] text-white'
                    }`} isResending || showLoginPrompt}
                      className={`font-medium transition-colors ${countdown > 0 || isResending || showLoginPrompt
<<<<<<< HEAD
                          ? 'text-[#00B75A] cursor-not-allowed'
                          : 'text-[#00D68F] hover:text-[#00B876]'
=======
                        ? 'text-[#00B75A] cursor-not-allowed'
                        : 'text-[#00D68F] hover:text-[#00B876]'
>>>>>>> a0dd79cbaa67c0f101149cc074731305ad3a0477
                        }`}
                          ? 'text-[#00B75A] cursor-not-allowed'
                          : 'text-[#00D68F] hover:text-[#00B876]'
                  </p>
                </div>

                {/* Help Text */}
                <div className="mt-6 p-3 sm:p-4 bg-blue-50 rounded-xl flex gap-2 sm:gap-3">
                  <IonIcon icon={alertCircleOutline} className="text-[#193CB8] text-base sm:text-lg flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-[#193CB8]">
                    Check your inbox (and spam folder) for your verification code. Enter it below to activate your account and start sending deliveries.
                  </p>
                </div>
              </YummyText>
            </div>
          </div>

          {/* Right Side - Image - ORIGINAL UI */}
          <div className="hidden lg:flex h-full bg-[#1E1E1E] relative overflow-hidden">
            {/* Zigzag decoration - top left */}
            <img
              src="/zig-zag.svg"
              alt=""
              className="absolute top-0 left-0 w-24 h-auto"
            />

            {/* Flower decoration - top right */}
            <img
              src="/flowers.svg"
              alt=""
              className="absolute top-20 left-80 ml-60 w-20 h-auto z-20"
            />

            {/* Main flying envelope - center */}
            <img
              src="/bigenvelope.svg"
              alt="Email Verification"
              className="absolute top-60 mt-20 left-80 mr-12 -translate-x-1/2 -translate-y-1/2 w-80 h-auto"
            />

            {/* Small flying envelope - bottom right */}
            <img
              src="/smallenvelope.svg"
              alt=""
              className="absolute top-80 mt-40 right-20 ml-80 w-44 h-auto"
            />
          </div>
        </div>

        {/* Login Prompt Overlay - Only shows when needed */}
        {showLoginPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center animate-scale-in">
              <YummyText>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <IonIcon icon={checkmarkCircleOutline} className="text-green-600 text-4xl sm:text-5xl" />
                </div>

<<<<<<< HEAD
                <h2 className="text-xl sm:text-2xl font-semibold text-[#0F172A] mb-2 sm:mb-3">
                  Email Verified Successfully! ✓
                </h2>

                <h2 className="text-xl sm:text-2xl font-semibold text-[#0F172A] mb-2 sm:mb-3">
                  Email Verified Successfully! ✓
                </h2>

                <p className="text-sm sm:text-base text-[#64748B] mb-4 sm:mb-6">E40AF] flex items-start gap-2">
                    <IonIcon icon={alertCircleOutline} className="text-lg flex-shrink-0 mt-0.5" />
                    <span>Use the same email and password you registered with to sign in.</span>
                  </p>
                </div>

                <button
                  onClick={handleProceedToLogin}
                  className="w-full py-3 sm:py-4 bg-[#00B75A] hover:bg-[#00B876] text-white rounded-xl font-semibold transition-colors text-base sm:text-lg"
                >
                  Continue to Login
                </button>
              </YummyText>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default VerifyEmail;