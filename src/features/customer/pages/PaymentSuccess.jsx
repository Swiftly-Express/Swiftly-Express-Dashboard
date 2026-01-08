import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useLocation, useHistory } from 'react-router-dom';
import axios from 'axios';
import { getCookie } from '../../../utils/cookies';
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
            setLoading(true);
            try {
                const paymentId = query.get('paymentId') || query.get('reference') || query.get('trx') || query.get('payment_id');
                // Try to pick up deliveryId from query or stored pending key
                const candidateDelivery = query.get('deliveryId') || localStorage.getItem('pending_payment_delivery_id');
                if (candidateDelivery) setDeliveryId(candidateDelivery);

                if (!paymentId) {
                    setStatusMsg('No payment identifier found in the URL.');
                    setLoading(false);
                    return;
                }

                setStatusMsg('Contacting payment gateway to verify transaction...');

                // prefer verify endpoint
                const client = axios.create({ baseURL: API_BASE, withCredentials: true });
                client.interceptors.request.use((config) => {
                    const customerToken = getCookie('customer_token');
                    const riderToken = getCookie('rider_token');
                    const adminToken = getCookie('admin_token');
                    const authToken = getCookie('auth_token');
                    const token = customerToken || riderToken || adminToken || authToken;
                    if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
                    return config;
                });

                let verifyResp = null;
                try {
                    const r = await client.get(`/api/payment/verify/${encodeURIComponent(paymentId)}`);
                    verifyResp = r.data || r;
                } catch (ve) {
                    console.warn('Verify call failed, will try status endpoint', ve);
                }

                // If verify didn't return useful data, try status endpoint
                let statusResp = null;
                if (!verifyResp || (verifyResp && Object.keys(verifyResp).length === 0)) {
                    try {
                        const r2 = await client.get(`/api/payment/status/${encodeURIComponent(paymentId)}`);
                        statusResp = r2.data || r2;
                    } catch (se) {
                        console.warn('Status call failed', se);
                    }
                }

                const final = verifyResp && Object.keys(verifyResp).length ? verifyResp : statusResp;

                if (!final) {
                    setStatusMsg('Unable to verify payment at the moment.');
                    setLoading(false);
                    return;
                }

                // Heuristics: look for success indicators and deliveryId
                const isSuccess = final?.status === 'success' || final?.success === true || final?.data?.status === 'success' || final?.data?.status === 'successful' || final?.payment_status === 'success';
                const foundDelivery = final?.deliveryId || final?.data?.deliveryId || final?.data?.metadata?.deliveryId || final?.metadata?.deliveryId || candidateDelivery;

                if (foundDelivery) setDeliveryId(foundDelivery);
                if (isSuccess) {
                    setSuccess(true);
                    setStatusMsg('Payment successful. Your delivery is being processed.');
                    // clear pending locally
                    try { localStorage.removeItem('pending_payment_delivery_id'); } catch (e) { /* ignore */ }
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
        if (deliveryId) {
            history.push(`/customer/deliveries/${deliveryId}`);
        } else {
            history.push('/customer/deliveries');
        }
    };

    return (
        <IonPage>
            <CustomerLayout>
                <IonContent className="ion-padding flex flex-col items-center justify-center min-h-[60vh]">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4">
                            <IonSpinner name="crescent" />
                            <YummyText className="text-base text-[#64748B]">{statusMsg}</YummyText>
                        </div>
                    ) : (
                        <div className="max-w-xl text-center p-6 bg-white rounded-2xl shadow-md">
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
                            <YummyText className="text-xl font-semibold mb-2">{success ? 'Payment Confirmed' : 'Payment Status'}</YummyText>
                            <p className="text-sm text-[#64748B] mb-4">{statusMsg}</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={goToDeliveries} className="px-6 py-3 bg-[#00B75A] text-white rounded-xl">My Deliveries</button>
                            </div>
                        </div>
                    )}
                </IonContent>
            </CustomerLayout>
        </IonPage>
    );
};

export default PaymentSuccess;
