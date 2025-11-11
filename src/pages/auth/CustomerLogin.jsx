import { IonPage, IonContent } from '@ionic/react';
import React, { useState } from 'react';
import { YummyText } from '../../components/YummyText';
import Button from '../../components/Button';
import { Link, useHistory } from 'react-router-dom';

const CustomerLogin = () => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
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
      // Simulated API call
      // In a real app, you would make a POST request to your auth endpoint
      
      // Store auth data
      localStorage.setItem('auth_token', 'customer_token_123');
      localStorage.setItem('user_type', 'customer');
      localStorage.setItem('user_data', JSON.stringify({
        id: '123',
        email: formData.email,
        type: 'customer'
      }));

  // Redirect to customer dashboard
  if (document && document.activeElement) document.activeElement.blur();
  history.push('/customer/dashboard');
    } catch (error) {
      setError('Login failed. Please try again.');
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
                  Welcome back! Login to your customer account.
                </YummyText>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Enter your password"
                    className="w-full px-3 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-[#00D68F] hover:underline">
                    Forgot Password?
                  </Link>
                </div>

                {/* Submit Button */}
                {error && (
                  <div className="text-red-500 text-sm mb-4 text-center">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  className="!w-full !py-3 !bg-[#00D68F] hover:!bg-[#00B876] !text-white rounded-xl transition-all duration-300"
                >
                  <YummyText>Login</YummyText>
                </Button>

                {/* Sign Up Link */}
                <div className="text-center mt-6">
                  <YummyText className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <span 
                      onClick={() => { if (document && document.activeElement) document.activeElement.blur(); history.push('/auth/customer/signup'); }}
                      className="text-[#00D68F] hover:underline cursor-pointer"
                    >
                      Sign Up
                    </span>
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

export default CustomerLogin;