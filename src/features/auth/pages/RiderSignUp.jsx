import { IonPage, IonContent, useIonRouter, IonIcon } from '@ionic/react';
import React, { useState } from 'react';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { YummyText } from '../../../components/YummyText';
import Button from '../../../components/Button';
import { registerRider } from '../../../utils/authApi';

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

      // Store pending verification data
      localStorage.setItem('pendingVerificationEmail', formData.email);
      localStorage.setItem('pendingVerificationType', 'rider');
      localStorage.setItem('pendingUserData', JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        vehicleType: formData.vehicleType
      }));

      // If backend returned a user id, store it for verify/resend endpoints
      try {
        const returnedId = res?.data?.userId || res?.data?.id || res?.data?._id || res?.user?.id || res?.userId || res?.id;
        if (returnedId) localStorage.setItem('pendingVerificationUserId', returnedId);
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
      <IonContent className="ion-no-padding">
        <div className="bg-white grid grid-cols-1 lg:grid-cols-2 min-h-screen justify-between mx-auto py-8 lg:py-12 px-6 gap-6">
          {/* Left Side - Form */}
          <div className="flex items-center justify-center lg:pr-2 lg:pl-8">
            <div className="w-full max-w-xl">
              {/* Header */}
              <div className="mb-6">
                <YummyText className="text-[#00D68F] !text-xs font-medium mb-2">
                  Create Account
                </YummyText>
                <YummyText className="text-2xl font-medium text-[#111827]">
                  Join Swiftly Express today
                </YummyText>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Full Name */}
                <YummyText>
                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-[#F3F4F6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-[#717182]"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2 mt-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-[#F3F4F6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-[#717182]"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2 mt-3">
                    Password
                  </label>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-[#F3F4F6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-[#717182]"
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

                {/* Confirm Password */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2 mt-3">
                    Confirm Password
                  </label>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-[#F3F4F6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-[#717182]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-10 text-gray-500"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <IonIcon icon={showConfirmPassword ? eyeOffOutline : eyeOutline} className="w-6 h-6 text-[#1E1E1E]" />
                  </button>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-2 mt-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-white border-gray-300 !rounded-2xl focus:ring-1 focus:ring-green-500 focus:ring-offset-0 cursor-pointer accent-green-600"
                    style={{ accentColor: '#00D68F', outline: 'none' }}
                  />
                  <label className="text-sm text-gray-600">
                    I agree to the <span className="text-[#00D68F] cursor-pointer hover:underline">Terms of Service</span> and <span className="text-[#00D68F] cursor-pointer hover:underline">Privacy Policy</span>
                  </label>
                </div>
                </YummyText>

                {/* Create Account Button */}
                {error && (
                  <div className="text-red-500 text-sm mb-4 text-center">
                    {error}
                  </div>
                )}
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  className={`!w-full !py-3 !bg-[#00B75A] text-sm !text-white rounded-lg transition-all duration-300 ${formData.agreeToTerms ? 'hover:!bg-[#00D68F] opacity-100' : 'opacity-50 cursor-not-allowed'}`}
                  disabled={!formData.agreeToTerms}
                >
                  <YummyText>Create Account</YummyText>
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <YummyText>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or sign up with email</span>
                  </div>
                  </YummyText>
                </div>

                {/* Google Button */}
                <div className="border border-gray-300 rounded-lg [&>button]:border-0">
                  <button className="w-full flex items-center justify-center gap-3 py-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                        <YummyText className="text-sm font-medium text-gray-700">Sign up with Google</YummyText>
                  </button>
                </div>
                {/* Apple Button */}
                <div className="border border-gray-300 rounded-lg [&>button]:border-0">
                  <button className="w-full flex items-center justify-center gap-3 py-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <YummyText className="text-sm font-medium text-gray-700">Sign up with Apple</YummyText>
                  </button>
                </div>

                {/* Sign In Link */}
                <div className="text-center mt-6">
                  <YummyText className="text-sm text-gray-600">
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
          <div className="hidden lg:flex bg-[#1E1E1E] rounded-[50px] relative ml-2 mr-8 overflow-hidden items-end justify-center p-12">
            <div className="relative w-full h-full flex flex-col justify-end">
              {/* Rider Illustration */}
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-[90%]">
                <img
                  src="/despatch-man.svg"
                  alt="Become a Rider"
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Text Content at Bottom */}
              <div className="relative z-10 text-white">
                <YummyText className="text-4xl font-[300] leading-tight mb-4">
                  Become a<br />Swiftly <span className="text-[#00D68F] font-semibold">Rider</span>
                </YummyText>
                <YummyText className="text-base opacity-90 leading-relaxed">
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