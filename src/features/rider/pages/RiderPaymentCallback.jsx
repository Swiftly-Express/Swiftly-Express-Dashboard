import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { getCookie, deleteCookie } from '../../../utils/cookies';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import { verifyDebtPayment } from '../../../utils/authApi';

const useQuery = (search) => new URLSearchParams(search);

const RiderPaymentCallback = () =>
{
  const location = useLocation();
  const history = useHistory();
  const q = useQuery(location.search);
  const [status, setStatus] = useState('Processing payment...');
  const [error, setError] = useState(null);

  useEffect(() =>
  {
    const processCallback = async () =>
    {
      console.log('[RiderPaymentCallback] Component mounted, processing callback');
      console.log('[RiderPaymentCallback] Full URL:', window.location.href);
      console.log('[RiderPaymentCallback] Search params:', location.search);

      try {
        // Extract payment reference from URL params
        const reference =
          q.get('reference') ||
          q.get('trxref') ||
          q.get('trx_ref') ||
          q.get('trx') ||
          q.get('paymentId');

        console.log('[RiderPaymentCallback] Extracted reference:', reference);

        if (!reference) {
          setStatus('No payment reference found. Redirecting...');
          setTimeout(() =>
          {
            history.replace('/rider/earnings');
          }, 2000);
          return;
        }

        setStatus('Payment received! Verifying...');

        // Verify payment with backend
        try {
          const response = await verifyDebtPayment(reference);
          console.log('[RiderPaymentCallback] Payment verified:', response);

          // Clean up cookies
          try {
            deleteCookie('pending_debt_payment_id');
            deleteCookie('pending_debt_payment_reference');
            deleteCookie('pending_debt_rider_id');
          } catch (e) {
            console.warn('[RiderPaymentCallback] Failed to clean up cookies:', e);
          }

          setStatus('Payment verified successfully! Redirecting...');

          // Redirect to earnings page with success state
          setTimeout(() =>
          {
            history.replace('/rider/earnings?payment=success');
          }, 1500);
        } catch (verifyError) {
          console.error('[RiderPaymentCallback] Payment verification failed:', verifyError);
          setError(verifyError?.response?.data?.message || verifyError?.message || 'Payment verification failed');
          setStatus('Payment verification failed. Redirecting...');

          // Still redirect but with error state
          setTimeout(() =>
          {
            history.replace('/rider/earnings?payment=error');
          }, 3000);
        }
      } catch (err) {
        console.error('[RiderPaymentCallback] Error processing callback:', err);
        setError(err?.message || 'Error processing payment');
        setStatus('Error processing payment. Redirecting...');
        setTimeout(() =>
        {
          history.replace('/rider/earnings');
        }, 2000);
      }
    };

    processCallback();
  }, [location.search, history, q]);

  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-padding">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <IonSpinner name="crescent" color="primary" />
            <YummyText className="text-lg text-[#0F172A] font-medium">
              {status}
            </YummyText>
            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}
            {!error && (
              <p className="text-sm text-[#64748B]">
                Please wait while we confirm your payment...
              </p>
            )}
          </div>
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default RiderPaymentCallback;
