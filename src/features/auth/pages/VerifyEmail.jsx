import React, { useState, useRef, useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import { YummyText } from '../../../components/YummyText';

const VerifyEmail = () => {
  const router = useIonRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);

  // Get email and user type from navigation state or localStorage
  const email = localStorage.getItem('pendingVerificationEmail') || 'user@email.com';
  const userType = localStorage.getItem('pendingVerificationType') || 'customer';

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle OTP input change
  const handleChange = (index, value) => {
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
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Handle verify
  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      alert('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);

    // Simulate API call
    setTimeout(() => {
      setIsVerifying(false);
      
      // Clear pending verification data
      localStorage.removeItem('pendingVerificationEmail');
      localStorage.removeItem('pendingVerificationType');

      // Redirect based on user type
      if (userType === 'rider') {
        router.push('/rider/dashboard', 'root', 'replace');
      } else {
        router.push('/customer/home', 'root', 'replace');
      }

      alert('Email verified successfully!');
    }, 2000);
  };

  // Handle resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);

    // Simulate API call
    setTimeout(() => {
      setIsResending(false);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      alert('A new verification code has been sent to your email');
    }, 1500);
  };

  return (
    <IonPage>
      <IonContent className="ion-no-padding">
        <div className="h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          {/* Left Side - Verification Form */}
          <div className="bg-white flex items-center justify-center p-12 lg:p-8 h-screen overflow-y-auto">
            <div className="w-full max-w-md">
              {/* Back Button */}
              <button
                onClick={() => router.goBack()}
                className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] mb-8 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <YummyText>
                  <span className="text-sm font-medium">Back</span>
                </YummyText>
              </button>

              <YummyText>
                {/* Icon */}
                <div className="w-12 h-12 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#00D68F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 6l-10 7L2 6" stroke="#00D68F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Heading */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-medium text-[#0F172A] mb-2">
                    Verify Your Email
                  </h1>
                  <p className="text-sm text-[#64748B]">
                    We've sent a 6-digit code to
                  </p>
                  <p className="text-sm font-medium text-[#0F172A] mt-1">
                    {email}
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex gap-2 justify-center mb-5">
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
                      className="w-11 h-12 text-center text-xl font-medium border-2 border-gray-200 rounded-xl focus:border-[#00D68F] focus:outline-none transition-colors"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || otp.join('').length !== 6}
                  className={`w-full py-3 rounded-xl font-medium transition-colors mb-4 ${
                    isVerifying || otp.join('').length !== 6
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#00B75A] hover:bg-[#00B876] text-white'
                  }`}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Email'}
                </button>

                {/* Resend Code */}
                <div className="text-center">
                  <p className="text-sm text-[#64748B] mb-2">
                    Didn't receive the code?
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={countdown > 0 || isResending}
                    className={`text-sm font-medium transition-colors ${
                      countdown > 0 || isResending
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#00D68F] hover:text-[#00B876]'
                    }`}
                  >
                    {isResending
                      ? 'Sending...'
                      : countdown > 0
                      ? `Resend Code (${countdown}s)`
                      : 'Resend Code'}
                  </button>
                </div>

                {/* Help Text */}
                <div className="mt-6 p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs text-[#64748B] text-center">
                    💡 Check your spam folder if you don't see the email in your inbox
                  </p>
                </div>
              </YummyText>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="hidden lg:flex h-screen bg-[#1E1E1E] relative overflow-hidden">
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
              className="absolute top-12 w-16 h-auto z-20"
            />
            
            {/* Main flying envelope - center */}
            <img 
              src="/bigenvelope.svg" 
              alt="Email Verification" 
              className="absolute top-60 mt-18 left-80 mr-12 -translate-x-1/2 -translate-y-1/2 w-80 h-auto"
            />
            
            {/* Small flying envelope - bottom right */}
            <img 
              src="/smallenvelope.svg" 
              alt="" 
              className="absolute top-80 mt-14 right-20  ml-80 w-44 h-auto"
            />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default VerifyEmail;
