import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';
import Loader from '../../../components/Loader';
import { getCustomerPayments, getDeliveryReceiptPdf } from '../../../utils/authApi';

const sideBottomShadow = {
  boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)',
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return dateString;
  }
};

const Transactions = () => {
  const history = useHistory();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await getCustomerPayments(1, 50);
        console.log("transactions response", res);
        const list = res?.data?.data?.payments || res?.data?.payments || res?.payments || [];
        if (!cancelled) setPayments(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('[Transactions] Failed to fetch payments', e);
        if (!cancelled) {
          setToastMsg(e?.message || 'Failed to load transactions');
          setShowToast(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPayments();
    return () => { cancelled = true; };
  }, []);

  const handleDownloadReceipt = async (payment) => {
    const delivery = payment.delivery;
    const deliveryId = delivery?._id || delivery?.id || payment.delivery;
    if (!deliveryId) {
      setToastMsg('Delivery not found for this transaction.');
      setShowToast(true);
      return;
    }
    setDownloadingId(payment._id || payment.id);
    try {
      const blob = await getDeliveryReceiptPdf(deliveryId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${delivery?.trackingNumber || deliveryId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setToastMsg('Receipt downloaded.');
      setShowToast(true);
    } catch (err) {
      console.error('[Transactions] Receipt download failed', err);
      setToastMsg(err?.message || 'Failed to download receipt');
      setShowToast(true);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleTrack = (trackingNumber) => {
    if (trackingNumber) history.push(`/customer/track/${trackingNumber}`);
  };

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
          />

          <div className="mb-4">
            <YummyText>
              <div className="text-3xl font-medium text-[#0F172A] mb-2 mt-3">Transactions</div>
              <div className="text-[#4A5565] text-[15px]">
                View your payment history and download Swiftly Express receipts.
              </div>
            </YummyText>
          </div>

          {loading ? (
            <div className="py-8">
              <Loader message="Loading transactions..." />
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center" style={sideBottomShadow}>
              <YummyText className="text-[#64748B]">No transactions yet.</YummyText>
              <YummyText className="text-sm text-[#64748B] mt-2">
                Payments for your deliveries will appear here.
              </YummyText>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const delivery = payment.delivery;
                const trackingNumber = delivery?.trackingNumber || delivery?.trackingId || '—';
                const isSuccess = (payment.status || '').toLowerCase() === 'success';
                const deliveryId = delivery?._id || delivery?.id;

                return (
                  <div
                    key={payment._id || payment.id}
                    className="bg-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    style={sideBottomShadow}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <YummyText className="font-medium text-[#0F172A]">
                          {trackingNumber !== '—' ? (
                            <button
                              type="button"
                              onClick={() => handleTrack(trackingNumber)}
                              className="text-[#00B75A] hover:underline"
                            >
                              {trackingNumber}
                            </button>
                          ) : (
                            'Delivery'
                          )}
                        </YummyText>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isSuccess ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {payment.status || '—'}
                        </span>
                      </div>
                      <YummyText className="text-sm text-[#64748B]">
                        ₦{(payment.amount != null ? Number(payment.amount) : 0).toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        · {formatDate(payment.paidAt || payment.createdAt)}
                      </YummyText>
                      {delivery && (
                        <YummyText className="text-xs text-[#94A3B8] mt-1">
                          Delivery status: {delivery.status || '—'}
                        </YummyText>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSuccess && deliveryId && (
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(payment)}
                          disabled={!!downloadingId}
                          className="px-4 py-2 bg-[#00B75A] hover:bg-[#00a352] disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          {downloadingId === (payment._id || payment.id) ? 'Downloading…' : 'Download receipt (PDF)'}
                        </button>
                      )}
                      {isSuccess && trackingNumber !== '—' && (
                        <button
                          type="button"
                          onClick={() => handleTrack(trackingNumber)}
                          className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-[#0F172A] hover:bg-gray-50 transition-colors"
                        >
                          Track
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default Transactions;
