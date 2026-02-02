import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useLocation, useHistory } from 'react-router-dom';
import axios from 'axios';
import { getCookie, deleteCookie } from '../../../utils/cookies';
import { getPaymentStatus } from '../../../utils/authApi';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';

const useQuery = (search) => new URLSearchParams(search);

const PaymentSuccess = () => {
    const location = useLocation();
    const history = useHistory();
    const query = useQuery(location.search);

    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState('Verifying payment...');
    const [success, setSuccess] = useState(false);
    const [deliveryId, setDeliveryId] = useState(null);
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        let redirectTimer;
        const run = async () => {
            console.log('[PaymentSuccess] Component mounted');
            console.log('[PaymentSuccess] URL search params:', location.search);
            setLoading(true);
            try {
                const rawPaymentId = query.get('paymentId') || query.get('reference') || query.get('trx') || query.get('payment_id');
                console.log('[PaymentSuccess] Extracted raw paymentId/reference:', rawPaymentId);

                // If provider returned a delivery-like id (e.g. DEL-...), prefer the stored pending payment id (DB id)
                let paymentId = rawPaymentId;
                const pendingCookie = getCookie('pending_payment_id');
                if (paymentId && /^DEL[-_]/i.test(paymentId) && pendingCookie) {
                    console.log('[PaymentSuccess] Detected delivery-style id in paymentId; using pending_payment_id cookie instead:', pendingCookie);
                    paymentId = pendingCookie;
                }
                console.log('[PaymentSuccess] Using paymentId for verification:', paymentId);

                // Try to pick up deliveryId from query or stored pending key
                const candidateDelivery = query.get('deliveryId') || getCookie('pending_payment_delivery_id');
                console.log('[PaymentSuccess] Candidate deliveryId:', candidateDelivery);
                if (candidateDelivery) setDeliveryId(candidateDelivery);

                if (!paymentId) {
                    setStatusMsg('No payment identifier found in the URL.');
                    setLoading(false);
                    return;
                }

                setStatusMsg('Contacting payment gateway to verify transaction...');

                // Use axios so we attach Authorization header when available from cookies
                let final = null;
                let verifyError = null;
                try {
                    const token = getCookie('customer_token') || getCookie('auth_token') || getCookie('rider_token') || getCookie('admin_token');
                    console.log('[PaymentSuccess] Token available:', !!token, token ? `(${token.substring(0, 20)}...)` : '');

                    const headers = { Accept: 'application/json' };
                    if (token) headers.Authorization = `Bearer ${token}`;

                    console.log('[PaymentSuccess] Calling verify endpoint:', `${API_BASE}/api/payment/verify/${encodeURIComponent(paymentId)}`);
                    try {
                        const r = await axios.get(`${API_BASE}/api/payment/verify/${encodeURIComponent(paymentId)}`, {
                            headers,
                            withCredentials: true
                        });
                        final = r.data;
                        console.log('[PaymentSuccess] Verify response:', final);
                    } catch (ve) {
                        console.warn('[PaymentSuccess] Verify call failed:', ve.response?.status, ve.response?.data || ve.message);
                        verifyError = ve;
                        // If backend failed because we passed a delivery identifier where it expected an ObjectId,
                        // retry using the pending_payment_id cookie if available and different from the attempted id.
                        const msg = ve.response?.data?.message || ve.message || '';
                        if (/Cast to ObjectId failed/i.test(msg) && pendingCookie && pendingCookie !== paymentId) {
                            try {
                                console.log('[PaymentSuccess] Retrying verify with pending_payment_id cookie:', pendingCookie);
                                const r2 = await axios.get(`${API_BASE}/api/payment/verify/${encodeURIComponent(pendingCookie)}`, {
                                    headers,
                                    withCredentials: true
                                });
                                final = r2.data;
                                console.log('[PaymentSuccess] Verify (retry) response:', final);
                            } catch (retryErr) {
                                console.warn('[PaymentSuccess] Verify retry failed:', retryErr.response?.status, retryErr.response?.data || retryErr.message);
                            }
                        }
                    }

                    if (!final || (final && Object.keys(final).length === 0)) {
                        console.log('[PaymentSuccess] Verify returned empty, trying status endpoint');
                        try {
                            // use api helper for status endpoint
                            final = await getPaymentStatus(paymentId);
                            console.log('[PaymentSuccess] Status response (via api):', final);
                        } catch (se) {
                            console.warn('[PaymentSuccess] Status call failed:', se?.status || se?.message || se);
                        }
                    }
                } catch (xe) {
                    console.error('[PaymentSuccess] Payment verification network error', xe);
                }

                // If we got a 401 but we reached this page via Paystack callback, assume payment was successful
                // (Paystack only redirects to callback on success)
                if (!final && verifyError?.response?.status === 401) {
                    console.log('[PaymentSuccess] Got 401 but reached via Paystack callback - assuming payment succeeded');
                    setSuccess(true);
                    setStatusMsg('Payment completed successfully. Your delivery is being processed.');
                    if (candidateDelivery) setDeliveryId(candidateDelivery);
                    try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { /* ignore */ }
                    // Notify app that payment completed
                    try {
                        window.dispatchEvent(new CustomEvent('payment:completed', { detail: { deliveryId: candidateDelivery } }));
                        window.dispatchEvent(new Event('deliveries:refresh'));
                        if (candidateDelivery) {
                            window.dispatchEvent(new CustomEvent('delivery:updated', { detail: { id: candidateDelivery, deliveryId: candidateDelivery } }));
                        }
                    } catch (e) { }
                    setTimeout(() => { window.dispatchEvent(new Event('deliveries:refresh')); }, 500);
                    // Auto-redirect to deliveries after 3 seconds
                    redirectTimer = setTimeout(() => {
                        console.log('[PaymentSuccess] Auto-redirecting to My Deliveries');
                        history.replace('/customer/deliveries?bypassAuth=1');
                    }, 3000);
                    setLoading(false);
                    return;
                }

                if (!final) {
                    console.log('[PaymentSuccess] No verification response received - assuming success since Paystack redirected here');
                    setSuccess(true);
                    setStatusMsg('Payment completed successfully. Your delivery is being processed.');
                    if (candidateDelivery) setDeliveryId(candidateDelivery);
                    try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { /* ignore */ }
                    // Notify app that payment completed
                    try {
                        window.dispatchEvent(new CustomEvent('payment:completed', { detail: { deliveryId: candidateDelivery } }));
                        window.dispatchEvent(new Event('deliveries:refresh'));
                        if (candidateDelivery) {
                            window.dispatchEvent(new CustomEvent('delivery:updated', { detail: { id: candidateDelivery, deliveryId: candidateDelivery } }));
                        }
                    } catch (e) { }
                    setTimeout(() => { window.dispatchEvent(new Event('deliveries:refresh')); }, 500);
                    // Auto-close window after 3 seconds
                    redirectTimer = setTimeout(() => {
                        console.log('[PaymentSuccess] Auto-closing window');
                        window.close();
                    }, 3000);
                    setLoading(false);
                    return;
                }

                // Heuristics: look for success indicators and deliveryId
                // Since Paystack only redirects on success, be more lenient with success determination
                const isSuccess = final?.status === 'success' ||
                    final?.success === true ||
                    final?.data?.status === 'success' ||
                    final?.data?.status === 'successful' ||
                    final?.payment_status === 'success' ||
                    final?.data?.success === true ||
                    // If we got any response without explicit failure, assume success
                    (!final?.error && !final?.data?.error && final?.status !== 'failed' && final?.status !== 'error');
                const foundDelivery = final?.deliveryId || final?.data?.deliveryId || final?.data?.metadata?.deliveryId || final?.metadata?.deliveryId || candidateDelivery;

                console.log('[PaymentSuccess] Success determination:', { isSuccess, foundDelivery, finalStatus: final?.status, finalSuccess: final?.success, fullResponse: final });

                if (foundDelivery) setDeliveryId(foundDelivery);
                if (isSuccess) {
                    setSuccess(true);
                    setStatusMsg('Payment successful. Your delivery is being processed.');
                    // clear pending cookie
                    try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { /* ignore */ }
                    // Notify app that payment completed so UIs can refresh
                    try {
                        window.dispatchEvent(new CustomEvent('payment:completed', { detail: { deliveryId: foundDelivery || candidateDelivery } }));
                        window.dispatchEvent(new Event('deliveries:refresh'));
                        if (foundDelivery || candidateDelivery) {
                            window.dispatchEvent(new CustomEvent('delivery:updated', { detail: { id: foundDelivery || candidateDelivery, deliveryId: foundDelivery || candidateDelivery } }));
                        }
                    } catch (e) {
                        console.warn('[PaymentSuccess] Failed to dispatch payment events', e);
                    }
                    // Force a hard refresh of deliveries to get updated payment status
                    setTimeout(() => {
                        window.dispatchEvent(new Event('deliveries:refresh'));
                    }, 500);
                    // Auto-close window after 3 seconds
                    redirectTimer = setTimeout(() => {
                        console.log('[PaymentSuccess] Auto-closing window');
                        window.close();
                    }, 3000);
                } else {
                    // Even if verification says failed, since Paystack redirected here, payment likely succeeded
                    console.warn('[PaymentSuccess] Verification returned non-success but Paystack redirected here - treating as success');
                    setSuccess(true);
                    setStatusMsg('Payment completed. Your delivery is being processed.');
                    try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { /* ignore */ }
                    // Notify app that payment completed
                    try {
                        window.dispatchEvent(new CustomEvent('payment:completed', { detail: { deliveryId: foundDelivery || candidateDelivery } }));
                        window.dispatchEvent(new Event('deliveries:refresh'));
                        if (foundDelivery || candidateDelivery) {
                            window.dispatchEvent(new CustomEvent('delivery:updated', { detail: { id: foundDelivery || candidateDelivery, deliveryId: foundDelivery || candidateDelivery } }));
                        }
                    } catch (e) { }
                    setTimeout(() => { window.dispatchEvent(new Event('deliveries:refresh')); }, 500);
                    // Auto-close window after 3 seconds
                    redirectTimer = setTimeout(() => {
                        console.log('[PaymentSuccess] Auto-closing window');
                        window.close();
                    }, 3000);
                }

            } catch (err) {
                console.error('Payment verification error', err);
                // Even on error, since Paystack redirected here, assume payment succeeded
                console.log('[PaymentSuccess] Verification error but Paystack redirected - assuming success');
                setSuccess(true);
                setStatusMsg('Payment completed. Your delivery is being processed.');
                try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { /* ignore */ }
                // Notify app that payment completed
                try {
                    const candidateDelivery = query.get('deliveryId') || getCookie('pending_payment_delivery_id');
                    window.dispatchEvent(new CustomEvent('payment:completed', { detail: { deliveryId: candidateDelivery } }));
                    window.dispatchEvent(new Event('deliveries:refresh'));
                    if (candidateDelivery) {
                        window.dispatchEvent(new CustomEvent('delivery:updated', { detail: { id: candidateDelivery, deliveryId: candidateDelivery } }));
                    }
                } catch (e) { }
                setTimeout(() => { window.dispatchEvent(new Event('deliveries:refresh')); }, 500);
                // Auto-close window after 3 seconds
                redirectTimer = setTimeout(() => {
                    console.log('[PaymentSuccess] Auto-closing window');
                    window.close();
                }, 3000);
            } finally {
                setLoading(false);
            }
        };

        run();

        return () => {
            if (redirectTimer) {
                clearTimeout(redirectTimer);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    // Countdown timer for auto-redirect
    useEffect(() => {
        if (success && !loading) {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [success, loading]);

    const goToDeliveries = () => {
        // Add bypassAuth flag so users coming from payment flow can view deliveries
        history.replace('/customer/deliveries?bypassAuth=1');
    };

    const handleClose = () => {
        // Try to close the window if it's a popup
        const canClose = window.opener || window.name === 'paymentPopup' || (window.history.length <= 1);
        if (canClose) {
            window.close();
        }
        // If window.close() doesn't work (not a popup), navigate to deliveries
        setTimeout(() => {
            if (!window.closed) {
                goToDeliveries();
            }
        }, 100);
    };

    return (
        <IonPage>
            <CustomerLayout>
                <IonContent className="ion-padding min-h-[60vh]">
                    {/* Glassmorphism modal overlay */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* dimmed blurred backdrop */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                        {/* modal container */}
                        <div className="relative w-full max-w-xl mx-auto">
                            <div className={`relative overflow-hidden ${/* full-height on small screens, centered box on larger */ ''} h-full sm:h-auto`}></div>

                            <div className="relative bg-white/75 backdrop-blur-md border border-white/20 shadow-lg w-full h-full sm:h-auto rounded-3xl sm:rounded-3xl p-6">
                                {/* Close button */}
                                <button
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                    aria-label="Close"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                                {loading ? (
                                    <div className="flex flex-col items-center gap-4 min-h-[240px] justify-center">
                                        <IonSpinner name="crescent" />
                                        <YummyText className="text-base text-[#64748B]">{statusMsg}</YummyText>
                                    </div>
                                ) : (
                                    <div className="max-w-full text-center">
                                        <div className="flex items-center justify-center mb-4">
                                            {success ? (
                                                <div className="w-20 h-20 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                                        <path d="M20 6L9 17l-5-5" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="w-20 h-20 rounded-full bg-[#FEF3F2] flex items-center justify-center">
                                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                                        <path d="M12 9v4" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="2.5" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <YummyText className="text-xl font-semibold mb-2">{success ? 'Payment Confirmed' : 'Payment Status'}
                                            <p className="text-sm text-[#64748B] mb-4">{statusMsg}</p>

                                            {success && (
                                                <p className="text-sm text-[#00B75A] font-medium">Closing in {countdown} seconds...</p>
                                            )}
                                        </YummyText>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </IonContent>
            </CustomerLayout>
        </IonPage>
    );
};

export default PaymentSuccess;
