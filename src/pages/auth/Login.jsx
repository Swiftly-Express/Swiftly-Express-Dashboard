import { IonPage, IonContent } from '@ionic/react';
import React, { useState } from 'react';
import { YummyText } from '../../components/YummyText';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'customer' // Default role
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle login logic here
    // Redirect to appropriate dashboard based on role
    // Example: if(role === 'rider') navigate('/rider/dashboard')
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <IonPage>
      <IonContent className="bg-[#f5f5f5] ion-no-padding">
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white rounded-2xl p-10 w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <YummyText className="text-3xl font-sm text-black">
                Swiftly
              </YummyText>
              <YummyText className="text-sm text-gray-600 mt-2">
                Welcome back! Please login to continue.
              </YummyText>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login As
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="customer">Customer</option>
                  <option value="rider">Rider</option>
                  <option value="admin">Admin</option>
                </select>
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
                  <Link to="/signup" className="text-[#00D68F] hover:underline">
                    Sign Up
                  </Link>
                </YummyText>
              </div>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;