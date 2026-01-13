import { IonPage, IonContent } from '@ionic/react';
import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { YummyText } from '../../../components/YummyText';
import { forgotPassword } from '../../../utils/authApi';

const ForgotPassword = () => {
  const history = useHistory();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <YummyText>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Didn't receive the email? Check your spam folder or try again in a few minutes.
                </p>
              </YummyText>
              <button
                onClick={() => {
                  const params = new URLSearchParams(location.search);
                  const role = params.get('role');
                  if (role === 'customer' || role === 'rider') history.push(`/auth/${role}/login`);
                  else history.push('/auth/role-select');
                }}
                className="w-full bg-[#00D68F] text-white py-3 rounded-xl font-medium hover:bg-[#00B876] transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
            <YummyText>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">Forgot Password?</h1>
                <p className="text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
            </YummyText>

            <form onSubmit={handleSubmit} className="space-y-6">
              <YummyText>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00D68F] focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#00D68F] text-white py-3 rounded-xl font-medium hover:bg-[#00B876] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(location.search);
                      const role = params.get('role');
                      if (role === 'customer' || role === 'rider') history.push(`/auth/${role}/login`);
                      else history.push('/auth/login');
                    }}
                    className="text-[#00D68F] hover:text-[#00B876] font-medium text-sm"
                  >
                    ← Back to Login
                  </button>
                </div>
              </YummyText>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;