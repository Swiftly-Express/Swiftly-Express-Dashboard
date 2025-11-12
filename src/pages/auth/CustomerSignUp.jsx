import { IonPage, IonContent, useIonRouter } from '@ionic/react';
import React, { useState } from 'react';
import { YummyText } from '../../components/YummyText';
import Button from '../../components/Button';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Phone validation
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(formData.phone.replace(/[^\d+]/g, ''))) {
      setError('Please enter a valid phone number');
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

    try {
      // Simulated API call
      // In a real app, you would make a POST request to your registration endpoint
      
      // Store auth data
      localStorage.setItem('auth_token', 'customer_token_123');
      localStorage.setItem('user_type', 'customer');
      localStorage.setItem('user_data', JSON.stringify({
        id: '123',
        email: formData.email,
        name: formData.fullName,
        phone: formData.phone,
        type: 'customer'
      }));

  // Redirect to customer dashboard
  if (document && document.activeElement) document.activeElement.blur();
  router.push('/customer/dashboard', 'forward', 'push');
    } catch (error) {
      setError('Registration failed. Please try again.');
    }
  };

  const handleChange = (e) => {
    setError('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <IonPage>
      <IonContent className="bg-[#f5f5f5] ion-no-padding">
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Form */}
          <div className="flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <YummyText className="text-3xl font-sm text-black">
                  Swiftly
                </YummyText>
                <YummyText className="text-sm text-gray-600 mt-2">
                  Create a customer account to start sending packages.
                </YummyText>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full px-3 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full px-3 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className="w-full px-3 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full px-3 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  className="!w-full !py-3 !bg-[#00D68F] hover:!bg-[#00B876] !text-white rounded-xl transition-all duration-300"
                >
                  <YummyText>Create Account</YummyText>
                </Button>

                {/* Login Link */}
                <div className="text-center mt-6">
                  <YummyText className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/customer/login" className="text-[#00D68F] hover:underline">
                      Login
                    </Link>
                  </YummyText>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="hidden lg:block bg-[#00D68F] relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/customer-illustration.svg"
                alt="Send Packages with Ease"
                className="w-3/4 h-auto"
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CustomerSignUp;