import React, { useEffect, useState, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { setCookie, setJSONCookie, getCookie, deleteCookie } from '../../../utils/cookies';
import { getCurrentUser } from '../../../utils/authApi';

const AuthCallback = () => {
    const history = useHistory();
    const location = useLocation();
    const [status, setStatus] = useState('Processing authentication...');
    const [debugLogs, setDebugLogs] = useState([]);
    const processingRef = useRef(false);
    const hasProcessedRef = useRef(false);

    const addLog = (message, data = null) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        console.log(logEntry, data || '');
        setDebugLogs(prev => [...prev, { timestamp, message, data }]);
    };

    // Helper function to decode JWT token
    const decodeJWT = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            addLog('❌ Failed to decode JWT', e.message);
            return null;
        }
    };

    // Helper to get and clean returnUrl from storage
    const getReturnUrl = (role) => {
        addLog('🔍 Checking for returnUrl in storage');

        let returnUrl = null;

        // Check localStorage first (set by SmartRideModal from public page)
        try {
            const storedUrl = localStorage.getItem('swiftly_auth_return_url');
            const timestamp = localStorage.getItem('swiftly_auth_return_timestamp');

            if (storedUrl && timestamp) {
                const age = Date.now() - parseInt(timestamp);
                const maxAge = 10 * 60 * 1000; // 10 minutes (increased from 5)

                if (age < maxAge) {
                    returnUrl = storedUrl;
                    addLog('✅ Found valid returnUrl in localStorage', { url: returnUrl, ageSeconds: Math.floor(age / 1000) });

                    // Clean up
                    localStorage.removeItem('swiftly_auth_return_url');
                    localStorage.removeItem('swiftly_auth_return_timestamp');
                    addLog('✅ Cleaned up localStorage returnUrl');
                } else {
                    addLog('⚠️ returnUrl in localStorage expired', { ageSeconds: Math.floor(age / 1000) });
                    localStorage.removeItem('swiftly_auth_return_url');
                    localStorage.removeItem('swiftly_auth_return_timestamp');
                }
            } else {
                addLog('ℹ️ No returnUrl found in localStorage');
            }
        } catch (e) {
            addLog('⚠️ Error reading returnUrl from localStorage', e.message);
        }

        // Check sessionStorage as backup
        if (!returnUrl) {
            try {
                returnUrl = sessionStorage.getItem('auth_return_url');
                if (returnUrl) {
                    addLog('✅ Found returnUrl in sessionStorage', returnUrl);
                    sessionStorage.removeItem('auth_return_url');
                    addLog('✅ Cleaned up sessionStorage returnUrl');
                } else {
                    addLog('ℹ️ No returnUrl found in sessionStorage');
                }
            } catch (e) {
                addLog('⚠️ Error reading returnUrl from sessionStorage', e.message);
            }
        }

        // Check auth_return_url from localStorage as additional fallback
        if (!returnUrl) {
            try {
                const fallbackUrl = localStorage.getItem('auth_return_url');
                if (fallbackUrl) {
                    returnUrl = fallbackUrl;
                    addLog('✅ Found returnUrl in localStorage fallback', returnUrl);
                    localStorage.removeItem('auth_return_url');
                    addLog('✅ Cleaned up localStorage fallback returnUrl');
                }
            } catch (e) {
                addLog('⚠️ Error reading fallback returnUrl', e.message);
            }
        }

        return returnUrl;
    };

    // Helper to get redirect path based on role and returnUrl
    const getRedirectPath = (role, returnUrl) => {
        addLog('🎯 Determining redirect path', { role, returnUrl });

        // If we have a returnUrl, validate it's appropriate for the role
        if (returnUrl) {
            addLog('🔍 Validating returnUrl for role', { role, returnUrl });

            // Check if returnUrl matches the user's role
            const isCustomerUrl = returnUrl.includes('/customer/');
            const isRiderUrl = returnUrl.includes('/rider/');
            const isAdminUrl = returnUrl.includes('/admin/');

            if (role === 'customer' && isCustomerUrl) {
                addLog('✅ returnUrl matches customer role, using it', returnUrl);
                return returnUrl;
            } else if ((role === 'rider' || role === 'driver') && isRiderUrl) {
                addLog('✅ returnUrl matches rider role, using it', returnUrl);
                return returnUrl;
            } else if (role === 'admin' && isAdminUrl) {
                addLog('✅ returnUrl matches admin role, using it', returnUrl);
                return returnUrl;
            } else {
                addLog('⚠️ returnUrl does not match user role, ignoring', {
                    role,
                    returnUrl,
                    isCustomerUrl,
                    isRiderUrl,
                    isAdminUrl
                });
            }
        }

        // Default to dashboard for the role
        const defaultPaths = {
            'customer': '/customer/dashboard',
            'rider': '/rider/dashboard',
            'driver': '/rider/dashboard',
            'admin': '/admin/dashboard'
        };

        const defaultPath = defaultPaths[role] || '/';
        addLog('ℹ️ Using default path for role', { role, path: defaultPath });
        return defaultPath;
    };

    // Helper to save Google profile data
    const saveGoogleProfileData = (userData, role) => {
        addLog('💾 Starting to save Google profile data', { role, hasUserData: !!userData });

        const googleName = userData.name || userData.displayName || userData.fullName || '';
        const googleEmail = userData.email || '';
        const googlePhoto = userData.profilePhoto || userData.picture || userData.avatar || userData.image || '';
        const googleId = userData.id || userData._id || userData.googleId || userData.sub || '';

        addLog('📝 Extracted Google fields', {
            name: googleName,
            email: googleEmail,
            hasPhoto: !!googlePhoto,
            id: googleId
        });

        const nameParts = googleName.split(' ');
        const firstName = userData.firstName || userData.given_name || nameParts[0] || '';
        const lastName = userData.lastName || userData.family_name || nameParts.slice(1).join(' ') || '';

        addLog('👤 Parsed name', { firstName, lastName });

        const completeUserData = {
            id: googleId,
            googleId: googleId,
            email: googleEmail,
            name: googleName,
            fullName: googleName,
            firstName: firstName,
            lastName: lastName,
            profilePhoto: googlePhoto,
            picture: googlePhoto,
            avatar: googlePhoto,
            role: role,
            ...userData,
            phone: userData.phone || userData.phoneNumber || '',
            riderId: userData.riderId || userData.driverId || (googleId ? `RD-${googleId}` : ''),
            driverId: userData.driverId || userData.riderId || (googleId ? `RD-${googleId}` : ''),
        };

        addLog('✅ Complete user data prepared', completeUserData);

        try {
            setJSONCookie('user_data', completeUserData, 7);
            addLog('✅ user_data cookie saved');
        } catch (e) {
            addLog('❌ Failed to save user_data cookie', e.message);
        }

        try {
            setCookie('userRole', role, 7);
            addLog('✅ userRole cookie saved', role);
        } catch (e) {
            addLog('❌ Failed to save userRole cookie', e.message);
        }

        if (googlePhoto) {
            try {
                setCookie('profile_image', googlePhoto, 7);
                setCookie(`profile_image_${googleId}`, googlePhoto, 7);
                setCookie(`profile_image_${googleEmail}`, googlePhoto, 7);
                localStorage.setItem('profile_image', googlePhoto);
                addLog('✅ Profile photo saved to all locations');
                try {
                    if (typeof window !== 'undefined' && window.dispatchEvent) {
                        window.dispatchEvent(new CustomEvent('profile:updated', { detail: { profilePhoto: googlePhoto, fullName: googleName, email: googleEmail } }));
                        addLog('🔔 profile:updated dispatched');
                    }
                } catch (e) {
                    addLog('❌ Failed to dispatch profile update event', e.message);
                }
            } catch (e) {
                addLog('❌ Failed to save profile photo', e.message);
            }
        }

        if (googleName) {
            try {
                setCookie('user_name', googleName, 7);
                localStorage.setItem('user_name', googleName);
                addLog('✅ User name saved', googleName);
            } catch (e) {
                addLog('❌ Failed to save user name', e.message);
            }
        }

        addLog('✅ Google profile data save complete');
        return completeUserData;
    };

    useEffect(() => {
        addLog('🚀 AuthCallback component mounted');
        addLog('📍 Current URL', window.location.href);
        addLog('📍 Location search', location.search);
        addLog('📍 Location pathname', location.pathname);

        if (processingRef.current) {
            addLog('⚠️ Already processing, exiting');
            return;
        }

        if (hasProcessedRef.current) {
            addLog('⚠️ Already processed, exiting');
            return;
        }

        processingRef.current = true;
        addLog('✅ Set processing flag to true');

        const processAuth = async () => {
            addLog('🔄 Starting processAuth function');

            const justAuthenticated = sessionStorage.getItem('auth_processing');
            addLog('🔍 Checking sessionStorage auth_processing', justAuthenticated);

            if (justAuthenticated) {
                addLog('⚠️ Auth already processed in session, cleaning up and redirecting');
                sessionStorage.removeItem('auth_processing');

                const role = getCookie('userRole');
                addLog('🔍 Retrieved role from cookie', role);

                if (role === 'customer') history.replace('/customer/dashboard');
                else if (role === 'rider' || role === 'driver') history.replace('/rider/dashboard');
                else if (role === 'admin') history.replace('/admin/dashboard');
                else history.replace('/');
                return;
            }

            sessionStorage.setItem('auth_processing', 'true');
            addLog('✅ Set auth_processing in sessionStorage');

            // CRITICAL: Clear ALL previous user data to ensure new users get fresh storage
            addLog('🧹 Clearing all previous user data for fresh start...');
            try {
                // Clear all role tokens
                deleteCookie('customer_token');
                deleteCookie('rider_token');
                deleteCookie('admin_token');
                deleteCookie('auth_token');
                deleteCookie('customer_refresh_token');
                deleteCookie('rider_refresh_token');
                deleteCookie('admin_refresh_token');
                deleteCookie('refresh_token');

                // Clear all user profile data
                deleteCookie('user_data');
                deleteCookie('userRole');
                deleteCookie('user_type');
                deleteCookie('user_name');

                // Clear all profile images
                deleteCookie('profile_image');
                const profileImageKeys = ['profile_image_customer', 'profile_image_rider', 'profile_image_admin'];
                profileImageKeys.forEach(key => deleteCookie(key));

                // Clear rider-specific data
                deleteCookie('riderPersonalInfo');
                deleteCookie('riderVehicleInfo');
                deleteCookie('riderDocuments');
                deleteCookie('riderVerificationData');
                deleteCookie('riderVerificationStatus');
                deleteCookie('riderAccountVerified');
                deleteCookie('riderEmailVerified');

                // Clear customer-specific data
                deleteCookie('customerPersonalInfo');

                // Clear verification/pending data
                deleteCookie('pendingVerificationUserId');
                deleteCookie('pendingVerificationEmail');
                deleteCookie('pendingVerificationType');
                deleteCookie('pending_user_data');
                deleteCookie('verificationCompleted');
                deleteCookie('verificationSubmitted');

                // Clear localStorage (but preserve returnUrl)
                if (typeof localStorage !== 'undefined') {
                    const returnUrl = localStorage.getItem('swiftly_auth_return_url');
                    const returnTimestamp = localStorage.getItem('swiftly_auth_return_timestamp');
                    const fallbackReturn = localStorage.getItem('auth_return_url');

                    localStorage.removeItem('profile_image');
                    localStorage.removeItem('user_name');
                    localStorage.removeItem('user_data');

                    // Restore returnUrl if it existed
                    if (returnUrl) localStorage.setItem('swiftly_auth_return_url', returnUrl);
                    if (returnTimestamp) localStorage.setItem('swiftly_auth_return_timestamp', returnTimestamp);
                    if (fallbackReturn) localStorage.setItem('auth_return_url', fallbackReturn);
                }

                addLog('✅ All previous user data cleared successfully');
            } catch (clearError) {
                addLog('⚠️ Error clearing some data (continuing)', clearError.message);
            }

            const params = new URLSearchParams(location.search);
            addLog('🔍 URL Search Params', location.search);

            const token = params.get('token') || params.get('accessToken');
            const refreshToken = params.get('refreshToken') || params.get('refresh_token');
            const code = params.get('code');
            const role = params.get('role');
            const userParam = params.get('user');
            const error = params.get('error');
            const message = params.get('message');

            // CRITICAL: If we have a code, immediately clear it from URL to prevent double exchange
            if (code) {
                addLog('🔒 CLEARING CODE FROM URL immediately to prevent reuse');
                const newParams = new URLSearchParams();
                if (role) newParams.set('role', role);
                newParams.set('processing', 'true');
                history.replace({
                    pathname: location.pathname,
                    search: `?${newParams.toString()}`
                });
                addLog('✅ Code cleared from URL, safe to proceed with exchange');
            }

            addLog('📦 Extracted URL parameters', {
                hasToken: !!token,
                tokenLength: token?.length,
                tokenPreview: token ? token.substring(0, 30) + '...' : null,
                hasCode: !!code,
                codeLength: code?.length,
                codePreview: code ? code.substring(0, 30) + '...' : null,
                role: role,
                hasUserParam: !!userParam,
                hasError: !!error,
                errorMessage: error,
                message: message,
                hasRefreshToken: !!refreshToken
            });

            if (error) {
                addLog('❌ Error found in URL params', { error, message });
                setStatus('Authentication failed: ' + (message || error));
                sessionStorage.removeItem('auth_processing');
                setTimeout(() => {
                    history.replace('/auth/role-select?error=' + encodeURIComponent(message || error));
                }, 2000);
                return;
            }

            // CODE EXCHANGE FLOW
            if (code && !token) {
                addLog('🔐 CODE EXCHANGE FLOW - Have authorization code, will exchange for tokens');
                setStatus('Connecting to server...');

                const rawBase = import.meta.env.VITE_API_BASE_URL || 'https://wise-grub-formally.ngrok-free.app';
                addLog('🌐 Raw API base URL from env', rawBase);

                const base = (typeof window !== 'undefined' && rawBase.startsWith('/'))
                    ? `${window.location.origin}${rawBase.replace(/\/$/, '')}`
                    : rawBase.replace(/\/$/, '');
                addLog('🌐 Computed API base URL', base);

                const exchangeUrl = `${base}/api/auth/google/exchange-code`;
                addLog('🌐 Exchange endpoint URL', exchangeUrl);

                const redirectUri = `${window.location.origin}/auth/callback`;
                addLog('🔗 Redirect URI', redirectUri);

                try {
                    setStatus('Exchanging authorization code...');

                    const requestBody = {
                        code,
                        redirectUri,
                        role
                    };

                    addLog('📤 Request body being sent', {
                        code: code.substring(0, 30) + '...',
                        redirectUri,
                        role
                    });

                    addLog('⏳ Sending POST request to backend...');
                    const startTime = Date.now();

                    const resp = await fetch(exchangeUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });

                    const endTime = Date.now();
                    addLog(`⏱️ Request completed in ${endTime - startTime}ms`);

                    addLog('📥 Response received', {
                        status: resp.status,
                        statusText: resp.statusText,
                        ok: resp.ok,
                        headers: {
                            contentType: resp.headers.get('content-type'),
                            contentLength: resp.headers.get('content-length')
                        }
                    });

                    let data;
                    const contentType = resp.headers.get('content-type');

                    if (contentType && contentType.includes('application/json')) {
                        addLog('📄 Response is JSON, parsing...');
                        data = await resp.json();
                        addLog('📄 Parsed JSON response', data);
                    } else {
                        addLog('⚠️ Response is NOT JSON!', { contentType });
                        const text = await resp.text();
                        addLog('📄 Raw response text', text);
                        throw new Error('Server returned invalid response format: ' + contentType);
                    }

                    if (!resp.ok) {
                        addLog('❌ Response not OK', {
                            status: resp.status,
                            statusText: resp.statusText,
                            data
                        });
                        throw new Error(data?.message || data?.error || `Exchange failed with status ${resp.status}`);
                    }

                    addLog('✅ Response OK, extracting data...');

                    const exToken = data?.token || data?.accessToken || data?.data?.token;
                    const exRefresh = data?.refreshToken || data?.refresh_token || data?.data?.refreshToken;
                    const exUser = data?.user || data?.data?.user || data?.data;
                    const exRole = data?.role || data?.data?.role || exUser?.role || role;

                    addLog('📦 Extracted exchange data', {
                        hasToken: !!exToken,
                        tokenPreview: exToken ? exToken.substring(0, 30) + '...' : null,
                        hasRefresh: !!exRefresh,
                        hasUser: !!exUser,
                        userKeys: exUser ? Object.keys(exUser) : [],
                        role: exRole,
                        userEmail: exUser?.email,
                        userName: exUser?.name || exUser?.fullName
                    });

                    if (!exToken) {
                        addLog('❌ No token in exchange response!');
                        throw new Error('No authentication token received from server');
                    }

                    addLog('💾 Starting to save tokens...');
                    setStatus('Saving authentication data...');

                    // CRITICAL: Clear other role tokens to prevent cross-role auth issues
                    addLog('🧹 Clearing tokens from other roles...');
                    deleteCookie('user_data');
                    deleteCookie('userRole');
                    deleteCookie('user_type');
                    if (exRole === 'rider' || exRole === 'driver') {
                        deleteCookie('customer_token');
                        deleteCookie('admin_token');
                        deleteCookie('customer_refresh_token');
                        deleteCookie('admin_refresh_token');
                        addLog('✅ Cleared customer and admin tokens');
                    } else if (exRole === 'customer') {
                        deleteCookie('rider_token');
                        deleteCookie('admin_token');
                        deleteCookie('rider_refresh_token');
                        deleteCookie('admin_refresh_token');
                        addLog('✅ Cleared rider and admin tokens');
                    } else if (exRole === 'admin') {
                        deleteCookie('rider_token');
                        deleteCookie('customer_token');
                        deleteCookie('rider_refresh_token');
                        deleteCookie('customer_refresh_token');
                        addLog('✅ Cleared rider and customer tokens');
                    }

                    try {
                        setCookie('auth_token', exToken, 7);
                        addLog('✅ Saved auth_token');
                    } catch (e) {
                        addLog('❌ Failed to save auth_token', e.message);
                    }

                    if (exRole === 'customer') {
                        setCookie('customer_token', exToken, 7);
                        addLog('✅ Saved customer_token');
                    } else if (exRole === 'rider' || exRole === 'driver') {
                        setCookie('rider_token', exToken, 7);
                        addLog('✅ Saved rider_token');
                    } else if (exRole === 'admin') {
                        setCookie('admin_token', exToken, 7);
                        addLog('✅ Saved admin_token');
                    }

                    if (exRefresh) {
                        try {
                            setCookie('refresh_token', exRefresh, 30);
                            addLog('✅ Saved refresh_token');
                        } catch (e) {
                            addLog('❌ Failed to save refresh_token', e.message);
                        }
                    }

                    if (exUser) {
                        addLog('💾 Saving Google profile data...');
                        saveGoogleProfileData(exUser, exRole);
                    } else {
                        addLog('⚠️ No user data to save');
                    }

                    hasProcessedRef.current = true;
                    sessionStorage.setItem('auth_just_completed', 'true');
                    addLog('✅ Set completion flags');

                    setStatus('Success! Redirecting...');

                    // Get returnUrl if it exists
                    const returnUrl = getReturnUrl(exRole);
                    const redirectPath = getRedirectPath(exRole, returnUrl);

                    addLog('🎯 Preparing to redirect', {
                        role: exRole,
                        returnUrl: returnUrl || 'none',
                        finalPath: redirectPath
                    });

                    setTimeout(() => {
                        sessionStorage.removeItem('auth_processing');
                        addLog('🚀 REDIRECTING NOW', { path: redirectPath });
                        history.replace(redirectPath);
                    }, 500);
                    return;
                } catch (err) {
                    addLog('❌ CODE EXCHANGE ERROR', {
                        name: err.name,
                        message: err.message,
                        stack: err.stack
                    });

                    setStatus('Authentication failed: ' + (err?.message || 'Unable to complete sign-in'));
                    sessionStorage.removeItem('auth_processing');

                    setTimeout(() => {
                        history.replace('/auth/role-select?error=' + encodeURIComponent(err?.message || 'OAuth exchange failed'));
                    }, 3000);
                    return;
                }
            }

            // DIRECT TOKEN FLOW
            if (token) {
                addLog('🔑 DIRECT TOKEN FLOW - Token provided in URL');
                setStatus('Saving authentication data...');

                try {
                    const decodedToken = decodeJWT(token);
                    addLog('🔓 Decoded JWT', decodedToken);

                    let parsedUser = null;
                    if (userParam) {
                        try {
                            const decoded = decodeURIComponent(userParam);
                            parsedUser = JSON.parse(decoded);
                            addLog('✅ Parsed user param', parsedUser);
                        } catch (e) {
                            addLog('⚠️ Failed to parse user param', e.message);
                        }
                    }

                    let fetchedUser = null;
                    try {
                        setStatus('Fetching your profile...');
                        addLog('🌐 Calling getCurrentUser...');
                        const me = await getCurrentUser(token);
                        addLog('📥 getCurrentUser response', me);
                        fetchedUser = me?.user || me?.data?.user || me?.data || me;
                        addLog('✅ Fetched user data', fetchedUser);
                    } catch (meErr) {
                        addLog('⚠️ getCurrentUser failed', meErr.message);
                    }

                    const bestUserData = fetchedUser || parsedUser || decodedToken || {};
                    addLog('🎯 Best user data selected', {
                        source: fetchedUser ? 'fetched' : parsedUser ? 'parsed' : 'decoded',
                        data: bestUserData
                    });

                    const finalRole = role || bestUserData.role || decodedToken?.role || 'rider';
                    addLog('🎭 Final role', {
                        role: finalRole,
                        sources: { urlParam: role, userData: bestUserData.role, jwt: decodedToken?.role }
                    });

                    // CRITICAL: Clear other role tokens to prevent cross-role auth issues
                    addLog('Clearing tokens from other roles...');
                    deleteCookie('user_data');
                    deleteCookie('userRole');
                    deleteCookie('user_type');
                    if (finalRole === 'rider' || finalRole === 'driver') {
                        deleteCookie('customer_token');
                        deleteCookie('admin_token');
                        deleteCookie('customer_refresh_token');
                        deleteCookie('admin_refresh_token');
                        addLog('✅ Cleared customer and admin tokens');
                    } else if (finalRole === 'customer') {
                        deleteCookie('rider_token');
                        deleteCookie('admin_token');
                        deleteCookie('rider_refresh_token');
                        deleteCookie('admin_refresh_token');
                        addLog('✅ Cleared rider and admin tokens');
                    } else if (finalRole === 'admin') {
                        deleteCookie('rider_token');
                        deleteCookie('customer_token');
                        deleteCookie('rider_refresh_token');
                        deleteCookie('customer_refresh_token');
                        addLog('✅ Cleared rider and customer tokens');
                    }

                    try {
                        setCookie('auth_token', token, 7);
                        addLog('✅ Saved auth_token');
                    } catch (e) {
                        addLog('❌ Failed to save auth_token', e.message);
                    }

                    if (finalRole === 'customer') {
                        setCookie('customer_token', token, 7);
                        addLog('✅ Saved customer_token');
                    } else if (finalRole === 'rider' || finalRole === 'driver') {
                        setCookie('rider_token', token, 7);
                        addLog('✅ Saved rider_token');
                    } else if (finalRole === 'admin') {
                        setCookie('admin_token', token, 7);
                        addLog('✅ Saved admin_token');
                    }

                    if (refreshToken) {
                        try {
                            setCookie('refresh_token', refreshToken, 30);
                            addLog('✅ Saved refresh_token');
                        } catch (e) {
                            addLog('❌ Failed to save refresh_token', e.message);
                        }
                    }

                    if (bestUserData && Object.keys(bestUserData).length > 0) {
                        bestUserData.role = finalRole;
                        addLog('💾 Saving Google profile data...');
                        saveGoogleProfileData(bestUserData, finalRole);
                    }

                    hasProcessedRef.current = true;
                    sessionStorage.setItem('auth_just_completed', 'true');
                    addLog('✅ Set completion flags');

                    setStatus('Success! Redirecting...');

                    // Get returnUrl if it exists
                    const returnUrl = getReturnUrl(finalRole);
                    const redirectPath = getRedirectPath(finalRole, returnUrl);

                    addLog('🎯 Preparing to redirect', {
                        role: finalRole,
                        returnUrl: returnUrl || 'none',
                        finalPath: redirectPath
                    });

                    setTimeout(() => {
                        sessionStorage.removeItem('auth_processing');
                        addLog('🚀 REDIRECTING NOW', { path: redirectPath });
                        history.replace(redirectPath);
                    }, 500);
                } catch (e) {
                    addLog('❌ DIRECT TOKEN ERROR', {
                        name: e.name,
                        message: e.message,
                        stack: e.stack
                    });
                    setStatus('Authentication processing failed');
                    sessionStorage.removeItem('auth_processing');

                    setTimeout(() => {
                        history.replace('/auth/role-select?error=' + encodeURIComponent('Failed to process authentication'));
                    }, 2000);
                }
            } else {
                addLog('❌ NO AUTH DATA - No token or code in URL');
                setStatus('No authentication data received');
                sessionStorage.removeItem('auth_processing');

                setTimeout(() => {
                    history.replace('/auth/role-select?error=' + encodeURIComponent('No authentication data received'));
                }, 2000);
            }
        };

        processAuth().finally(() => {
            processingRef.current = false;
            addLog('✅ Processing complete, cleared processing flag');
        });
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D68F] mx-auto mb-4"></div>
                <p className="text-lg text-gray-700 font-medium mb-2">{status}</p>
                <p className="text-sm text-gray-500">Please wait...</p>
            </div>
        </div>
    );
};

export default AuthCallback;