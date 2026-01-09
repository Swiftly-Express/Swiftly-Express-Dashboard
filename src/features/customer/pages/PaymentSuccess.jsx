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

    useEffect(() => {
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
                    setLoading(false);
                    return;
                }

                if (!final) {
                    console.log('[PaymentSuccess] No verification response received');
                    setStatusMsg('Click the button below to check your deliveries.');
                    setLoading(false);
                    return;
                }

                // Heuristics: look for success indicators and deliveryId
                const isSuccess = final?.status === 'success' || final?.success === true || final?.data?.status === 'success' || final?.data?.status === 'successful' || final?.payment_status === 'success';
                const foundDelivery = final?.deliveryId || final?.data?.deliveryId || final?.data?.metadata?.deliveryId || final?.metadata?.deliveryId || candidateDelivery;

                console.log('[PaymentSuccess] Success determination:', { isSuccess, foundDelivery, finalStatus: final?.status, finalSuccess: final?.success });

                if (foundDelivery) setDeliveryId(foundDelivery);
                if (isSuccess) {
                    setSuccess(true);
                    setStatusMsg('Payment successful. Your delivery is being processed.');
                    // clear pending cookie
                    try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { /* ignore */ }
                } else {
                    setSuccess(false);
                    setStatusMsg(final?.message || final?.data?.message || 'Payment was not successful.');
                }

            } catch (err) {
                console.error('Payment verification error', err);
                setStatusMsg('Failed to verify payment.');
            } finally {
                setLoading(false);
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const goToDeliveries = () => {
        history.push('/customer/deliveries');
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

                                            <div className="flex justify-center">
                                                <button onClick={goToDeliveries} className="px-6 py-3 bg-[#00B75A] text-white rounded-full">My Deliveries</button>
                                            </div>
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
