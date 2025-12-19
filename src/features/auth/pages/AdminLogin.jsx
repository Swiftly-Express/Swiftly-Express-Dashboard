import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { YummyText } from '../../../components/YummyText';
import { login } from '../../../utils/authApi';

const AdminLogin = () => {
  const history = useHistory();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        setError('Please enter email and password');
        setLoading(false);
        return;
      }

      console.log('Admin login attempt:', formData.email);

      const response = await login({
        email: formData.email,
        password: formData.password
      });

      console.log('Admin login response:', response);

      // Check if user is admin
      const user = response?.user || response?.data?.user || response?.data;
      if (user?.role !== 'admin') {
        setError('Unauthorized: Admin access only');
        setLoading(false);
        return;
      }

      // Redirect to admin dashboard
      history.push('/admin/dashboard');
    } catch (err) {
      console.error('Admin login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
            <YummyText>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#00D68F] mb-2">Admin Portal</h1>
                <p className="text-[#64748B]">Sign in to manage Swiftly Express</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00D68F]"
                    placeholder="admin@swiftlyxpress.com"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00D68F] pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00D68F] hover:bg-[#00B75A] text-white py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-[#64748B]">
                  Don't have an admin account?{' '}
                  <button
                    onClick={() => history.push('/auth/admin/signup')}
                    className="text-[#00D68F] hover:text-[#00B75A] font-medium"
                  >
                    Register
                  </button>
                </p>
              </div>
            </YummyText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminLogin;
