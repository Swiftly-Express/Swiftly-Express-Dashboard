import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { YummyText } from '../../../components/YummyText';
import { setCookie, setJSONCookie } from '../../../utils/cookies';

const AdminLogin = () => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Replace with actual admin login API
      // For now, mock login for testing
      if (formData.email && formData.password) {
        // Set admin token and user data
        setCookie('admin_token', 'mock_admin_token_12345', 7);
        setCookie('auth_token', 'mock_admin_token_12345', 7);
        setJSONCookie('user_data', {
          id: 'admin_1',
          email: formData.email,
          role: 'admin',
          fullName: 'Admin User'
        }, 7);

        history.push('/admin/dashboard');
      } else {
        setError('Please enter email and password');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed');
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00D68F]"
                    placeholder="admin@swiftlyxpress.com"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00D68F]"
                    placeholder="••••••••"
                    required
                  />
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
                  For testing: Use any email/password combination
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
