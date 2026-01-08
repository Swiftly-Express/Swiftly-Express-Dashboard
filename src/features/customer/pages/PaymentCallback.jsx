import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';

const useQuery = (search) => new URLSearchParams(search);

const PaymentCallback = () => {
  const location = useLocation();
  const history = useHistory();
  const q = useQuery(location.search);
  const [status, setStatus] = useState('Processing payment...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract payment reference from URL params
        const reference =
          q.get('reference') ||
          q.get('trxref') ||
          q.get('trx_ref') ||
          q.get('trx') ||
          q.get('paymentId');

        // Try to get deliveryId from localStorage or URL
        const deliveryId =
          localStorage.getItem('pending_payment_delivery_id') ||
          q.get('deliveryId') ||
          q.get('delivery_id');

        if (!reference) {
          setStatus('No payment reference found. Redirecting...');
          setTimeout(() => {
            history.replace('/customer/deliveries');
          }, 2000);
          return;
        }

        // Build the success page URL
        const targetUrl = `/customer/payment/success?paymentId=${encodeURIComponent(reference)}${deliveryId ? `&deliveryId=${encodeURIComponent(deliveryId)}` : ''
          }`;

        console.log('[PaymentCallback] Redirecting to:', targetUrl);
        setStatus('Payment received! Verifying...');

        // Small delay to show the message, then navigate
        setTimeout(() => {
          history.replace(targetUrl);
        }, 500);

      } catch (err) {
        console.error('[PaymentCallback] Error processing callback:', err);
        setStatus('Error processing payment. Redirecting...');
        setTimeout(() => {
          history.replace('/customer/deliveries');
        }, 2000);
      }
    };

    processCallback();
  }, [location.search, history, q]);

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <IonSpinner name="crescent" color="primary" />
            <YummyText className="text-lg text-[#0F172A] font-medium">
              {status}
            </YummyText>
            <p className="text-sm text-[#64748B]">
              Please wait while we confirm your payment...
            </p>
          </div>
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default PaymentCallback;