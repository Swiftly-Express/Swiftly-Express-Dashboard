import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { getCookie } from '../../../utils/cookies';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';

const useQuery = (search) => new URLSearchParams(search);

const PaymentCallback = () =>
{
  const location = useLocation();
  const history = useHistory();
  const q = useQuery(location.search);
  const [status, setStatus] = useState('Processing payment...');

  useEffect(() =>
  {
    const processCallback = async () =>
    {
      console.log('[PaymentCallback] Component mounted, processing callback');
      console.log('[PaymentCallback] Full URL:', window.location.href);
      console.log('[PaymentCallback] Search params:', location.search);
      console.log('[PaymentCallback] Has opener:', !!window.opener, 'closed:', window.opener?.closed);

      try {
        // Extract payment reference from URL params
        const reference =
          q.get('reference') ||
          q.get('trxref') ||
          q.get('trx_ref') ||
          q.get('trx') ||
          q.get('paymentId');

        console.log('[PaymentCallback] Extracted reference:', reference);

        // Try to get deliveryId from cookie or URL
        const deliveryId =
          getCookie('pending_payment_delivery_id') ||
          q.get('deliveryId') ||
          q.get('delivery_id');

        console.log('[PaymentCallback] Extracted deliveryId:', deliveryId);

        // Check if this is a debt payment (rider)
        const pendingDebtRiderId = getCookie('pending_debt_rider_id');
        if (pendingDebtRiderId) {
          console.log('[PaymentCallback] Detected debt payment, redirecting to rider callback');
          // Redirect to rider-specific callback handler
          setTimeout(() =>
          {
            history.replace(`/rider/payment/callback?reference=${reference || ''}`);
          }, 100);
          return;
        }

        if (!reference) {
          setStatus('No payment reference found. Redirecting...');
          setTimeout(() =>
          {
            history.replace('/customer/deliveries');
          }, 2000);
          return;
        }

        // Build the success page URL (use full URL with origin for opener navigation)
        const relativeUrl = `/customer/payment/success?paymentId=${encodeURIComponent(reference)}${deliveryId ? `&deliveryId=${encodeURIComponent(deliveryId)}` : ''}`;
        const fullUrl = `${window.location.origin}${relativeUrl}`;

        console.log('[PaymentCallback] Target URL (relative):', relativeUrl);
        console.log('[PaymentCallback] Target URL (full):', fullUrl);
        setStatus('Payment received! Verifying...');

        // Navigate this window (the popup) to the success page
        // The success page will show confirmation and auto-close after 3 seconds
        console.log('[PaymentCallback] Navigating popup to success page');
        setTimeout(() =>
        {
          console.log('[PaymentCallback] Executing navigation');
          try {
            history.replace(relativeUrl);
          } catch (e) {
            console.warn('[PaymentCallback] history.replace failed, using window.location:', e);
            window.location.href = relativeUrl;
          }
        }, 500);

      } catch (err) {
        console.error('[PaymentCallback] Error processing callback:', err);
        setStatus('Error processing payment. Redirecting...');
        setTimeout(() =>
        {
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