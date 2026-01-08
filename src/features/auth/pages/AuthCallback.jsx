import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { setCookie, setJSONCookie } from '../../../utils/cookies';

const AuthCallback = () => {
    const history = useHistory();
    const location = useLocation();
    const [status, setStatus] = useState('Processing authentication...');

    useEffect(() => {
        const processAuth = async () => {
            console.log('[AuthCallback] URL:', window.location.href);
            console.log('[AuthCallback] Query string:', location.search);
            
            // Parse query params manually (react-router v5)
            const params = new URLSearchParams(location.search);
            const token = params.get('token') || params.get('accessToken');
            const refreshToken = params.get('refreshToken') || params.get('refresh_token');
            const code = params.get('code');
            const role = params.get('role');
            const userParam = params.get('user');
            const error = params.get('error');
            const message = params.get('message');

            console.log('[AuthCallback] Parsed params:', { 
                hasToken: !!token, 
                hasCode: !!code, 
                role, 
                hasError: !!error 
            });

            if (error) {
                console.error('[AuthCallback] Error in callback:', error, message);
                setStatus('Authentication failed: ' + (message || error));
                setTimeout(() => {
                    history.push('/auth/role-select?error=' + encodeURIComponent(message || error));
                }, 2000);
                return;
            }

            // If we received an authorization code, exchange it with backend for tokens
            if (code) {
                console.log('[AuthCallback] Exchanging authorization code with backend...');
                setStatus('Exchanging authorization code...');
                
                const rawBase = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';
                const base = (typeof window !== 'undefined' && rawBase.startsWith('/'))
                    ? `${window.location.origin}${rawBase.replace(/\/$/, '')}`
                    : rawBase.replace(/\/$/, '');
                const exchangeUrl = `${base}/api/auth/google/exchange-code`;
                
                console.log('[AuthCallback] Exchange URL:', exchangeUrl);
                console.log('[AuthCallback] Payload:', { code: code.substring(0, 20) + '...', redirectUri: window.location.origin + '/auth/callback', role });
                
                try {
                    const resp = await fetch(exchangeUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, redirectUri: window.location.origin + '/auth/callback', role })
                    });
                    const data = await resp.json();
                    
                    console.log('[AuthCallback] Exchange response status:', resp.status);
                    console.log('[AuthCallback] Exchange response data:', data);
                    
                    if (!resp.ok) throw new Error(data?.message || 'OAuth exchange failed');

                    const { token: exToken, refreshToken: exRefresh, user: exUser, role: exRole } = data;
                    
                    console.log('[AuthCallback] Extracted:', { hasToken: !!exToken, hasRefresh: !!exRefresh, hasUser: !!exUser, role: exRole });
                    
                    if (exToken) {
                        setStatus('Saving authentication data...');
                        if (exRole === 'customer') setCookie('customer_token', exToken, 7);
                        else if (exRole === 'rider' || exRole === 'driver') setCookie('rider_token', exToken, 7);
                        else if (exRole === 'admin') setCookie('admin_token', exToken, 7);
                        setCookie('auth_token', exToken, 7);
                        console.log('[AuthCallback] ✓ Token saved for role:', exRole);
                    }
                    if (exRefresh) {
                        setCookie('refresh_token', exRefresh, 30);
                        console.log('[AuthCallback] ✓ Refresh token saved');
                    }
                    if (exUser) {
                        setJSONCookie('user_data', exUser, 7);
                        if (exUser.role) setCookie('userRole', exUser.role, 7);
                        console.log('[AuthCallback] ✓ User data saved');
                    }

                    setStatus('Redirecting to dashboard...');
                    console.log('[AuthCallback] Redirecting to dashboard for role:', exRole);
                    
                    setTimeout(() => {
                        if (exRole === 'customer') history.push('/customer/dashboard');
                        else if (exRole === 'rider' || exRole === 'driver') history.push('/rider/dashboard');
                        else if (exRole === 'admin') history.push('/admin/dashboard');
                        else history.push('/');
                    }, 500);
                    return;
                } catch (err) {
                    console.error('[AuthCallback] OAuth code exchange failed:', err);
                    setStatus('Authentication failed: ' + (err?.message || 'OAuth exchange failed'));
                    setTimeout(() => {
                        history.push('/auth/role-select?error=' + encodeURIComponent(err?.message || 'OAuth exchange failed'));
                    }, 2000);
                    return;
                }
            }

            if (token) {
                console.log('[AuthCallback] Direct token provided in callback');
                setStatus('Saving authentication data...');
                try {
                    if (role === 'customer') setCookie('customer_token', token, 7);
                    else if (role === 'rider' || role === 'driver') setCookie('rider_token', token, 7);
                    else if (role === 'admin') setCookie('admin_token', token, 7);

                    setCookie('auth_token', token, 7);

                    if (refreshToken) setCookie('refresh_token', refreshToken, 30);

                    if (userParam) {
                        try {
                            const decoded = decodeURIComponent(userParam);
                            const parsed = JSON.parse(decoded);
                            setJSONCookie('user_data', parsed, 7);
                            if (parsed.role) setCookie('userRole', parsed.role, 7);
                        } catch (e) {
                            console.warn('[AuthCallback] Failed to parse user param', e);
                        }
                    }

                    setStatus('Redirecting to dashboard...');
                    console.log('[AuthCallback] Redirecting to dashboard for role:', role);
                    
                    setTimeout(() => {
                        if (role === 'customer') history.push('/customer/dashboard');
                        else if (role === 'rider' || role === 'driver') history.push('/rider/dashboard');
                        else if (role === 'admin') history.push('/admin/dashboard');
                        else history.push('/');
                    }, 500);
                } catch (e) {
                    console.error('[AuthCallback] Auth callback handling failed', e);
                    setStatus('Authentication failed');
                    setTimeout(() => {
                        history.push('/auth/role-select');
                    }, 2000);
                }
            } else {
                console.log('[AuthCallback] No token or code found, redirecting to role select');
                setStatus('No authentication data received');
                setTimeout(() => {
                    history.push('/auth/role-select');
                }, 2000);
            }
        };

        processAuth();
    }, [location.search, history]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D68F] mx-auto mb-4"></div>
                <p className="text-lg text-gray-700">{status}</p>
                <p className="text-sm text-gray-500 mt-2">Please wait...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
