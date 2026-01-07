import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { setCookie, setJSONCookie } from '../../../utils/cookies';

const AuthCallback = () => {
    const history = useHistory();
    const location = useLocation();

    useEffect(() => {
        // Parse query params manually (react-router v5)
        const params = new URLSearchParams(location.search);
        const token = params.get('token') || params.get('accessToken');
        const refreshToken = params.get('refreshToken') || params.get('refresh_token');
        const role = params.get('role');
        const userParam = params.get('user');
        const error = params.get('error');
        const message = params.get('message');

        if (error) {
            history.push('/auth/role-select?error=' + encodeURIComponent(message || error));
            return;
        }

        if (token) {
            try {
                // Store role-specific token if provided
                if (role === 'customer') setCookie('customer_token', token, 7);
                else if (role === 'rider' || role === 'driver') setCookie('rider_token', token, 7);
                else if (role === 'admin') setCookie('admin_token', token, 7);

                // Also set the generic auth token for convenience
                setCookie('auth_token', token, 7);

                if (refreshToken) setCookie('refresh_token', refreshToken, 30);

                if (userParam) {
                    try {
                        const decoded = decodeURIComponent(userParam);
                        const parsed = JSON.parse(decoded);
                        setJSONCookie('user_data', parsed, 7);
                        if (parsed.role) setCookie('userRole', parsed.role, 7);
                    } catch (e) {
                        console.warn('Failed to parse user param', e);
                    }
                }

                // Redirect based on role if available
                if (role === 'customer') history.push('/customer/dashboard');
                else if (role === 'rider' || role === 'driver') history.push('/rider/dashboard');
                else if (role === 'admin') history.push('/admin/dashboard');
                else history.push('/');
            } catch (e) {
                console.error('Auth callback handling failed', e);
                history.push('/auth/role-select');
            }
        } else {
            // No token - send back to login
            history.push('/auth/role-select');
        }
    }, [location.search, history]);

    return <div className="p-6">Processing authentication...</div>;
};

export default AuthCallback;
