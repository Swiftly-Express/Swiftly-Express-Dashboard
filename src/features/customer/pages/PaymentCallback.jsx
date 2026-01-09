import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { getCookie } from '../../../utils/cookies';
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

        if (!reference) {
          setStatus('No payment reference found. Redirecting...');
          setTimeout(() => {
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

        // If this page was opened as a popup by the app, navigate the opener to the success page and close this popup.
        // Otherwise, navigate within the SPA.
        try {
          const opener = window.opener;
          console.log('[PaymentCallback] Checking opener:', { hasOpener: !!opener, closed: opener?.closed });

          if (opener && !opener.closed) {
            console.log('[PaymentCallback] Opener found, attempting navigation');
            try {
              opener.location.href = fullUrl;
              console.log('[PaymentCallback] Opener navigation triggered, closing popup in 300ms');
              // Give the opener a moment to navigate then close this window
              setTimeout(() => {
                try {
                  console.log('[PaymentCallback] Closing popup window');
                  window.close();
                } catch (e) {
                  console.warn('[PaymentCallback] Could not close window:', e);
                }
              }, 300);
              return;
            } catch (e) {
              console.warn('[PaymentCallback] Direct opener navigation failed:', e);
              // Fallback to postMessage if direct navigation is blocked
              try {
                console.log('[PaymentCallback] Trying postMessage fallback');
                opener.postMessage({ type: 'PAYMENT_REDIRECT', url: relativeUrl, fullUrl: fullUrl }, '*');
                console.log('[PaymentCallback] postMessage sent, closing popup in 300ms');
                setTimeout(() => {
                  try {
                    console.log('[PaymentCallback] Closing popup after postMessage');
                    window.close();
                  } catch (err) {
                    console.warn('[PaymentCallback] Could not close after postMessage:', err);
                  }
                }, 300);
                return;
              } catch (postErr) {
                console.warn('[PaymentCallback] postMessage failed:', postErr);
              }
            }
          } else {
            console.log('[PaymentCallback] No opener found or opener closed, navigating in current window');
          }
        } catch (e) {
          console.warn('[PaymentCallback] opener check failed', e);
        }

        // Small delay to show the message, then navigate in this window
        console.log('[PaymentCallback] Navigating in current window to:', relativeUrl);
        setTimeout(() => {
          console.log('[PaymentCallback] Executing history.replace');
          history.replace(relativeUrl);
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