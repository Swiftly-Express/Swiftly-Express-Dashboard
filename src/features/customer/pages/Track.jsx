import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';
import Loader from '../../../components/Loader';
import TrackingMap from '../../../components/TrackingMap';
import DeliveryChat from '../../../components/DeliveryChat';
// RatingModal is mounted globally in CustomerLayout and triggered via window events
import { getDeliveryByTracking, rateDriver, initializePayment, verifyPaymentByReference } from '../../../utils/authApi';
import { getCookie, setCookie, deleteCookie, getJSONCookie } from '../../../utils/cookies';
import socketService from '../../../services/socket.service'; // NEW
import { playNotificationSound } from '../../../utils/notificationSound';
import BlockIcon from '../../../icons/Blockicon';
import CheckIcon from '../../../icons/Checkicon';
import LocationIcon from '../../../icons/Locationicon';
import VanIcon from '../../../icons/Vanicon';

const sideBottomShadow = {
  boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

// Gallery component for package images in customer track page
const PackageImageGallery = ({ images }) =>
{
  const [lightboxUrl, setLightboxUrl] = React.useState(null);
  const [errored, setErrored] = React.useState({});

  const validImages = images.filter((_, i) => !errored[i]);

  return (
    <>
      {/* Thumbnail row */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {images.map((url, i) => (
          !errored[i] && (
            <div
              key={i}
              onClick={() => setLightboxUrl(url)}
              className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
            >
              <img
                src={url}
                alt={`Package image ${i + 1}`}
                className="w-full h-full object-cover"
                onError={() => setErrored(prev => ({ ...prev, [i]: true }))}
              />
            </div>
          )
        ))}
        {validImages.length === 0 && (
          <div className="w-full h-40 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-2 opacity-40">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#CBD5E1" />
            </svg>
            <p className="text-xs text-[#94A3B8]">No package images available</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close image"
          >✕</button>
          <img
            src={lightboxUrl}
            alt="Package"
            style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};



// Format Nigerian phone for display; normalize for tel: link (0xxx → +234xxx)
const formatNigerianPhone = (phone) =>
{
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.replace(/[\s\-()]/g, '').replace(/[^0-9+]/g, '');
  if (cleaned.length < 7) return phone;
  if (cleaned.startsWith('0')) return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  if (cleaned.startsWith('+234')) return `+234 ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)} ${cleaned.slice(10)}`;
  if (cleaned.startsWith('234')) return `+234 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  return cleaned.length >= 10 ? `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}` : phone;
};
const normalizePhoneForTel = (phone) =>
{
  if (!phone || typeof phone !== 'string') return '';
  let cleaned = phone.replace(/[\s\-()]/g, '').replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+234')) return cleaned;
  if (cleaned.startsWith('234')) return `+${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length >= 10) return `+234${cleaned.slice(1)}`;
  if (cleaned.length >= 10 && !cleaned.startsWith('0')) return `+234${cleaned}`;
  return cleaned ? `+234${cleaned}` : '';
};

const Track = () =>
{
  const [trackingId, setTrackingId] = useState('');
  const [deliveryData, setDeliveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const params = useParams();

  // Auto-fetch when a trackingId is present in the URL (e.g. /customer/track/SX-... or /track/SX-...)
  useEffect(() =>
  {
    const paramId = params?.trackingId;
    if (!paramId) return;

    const fetchByParam = async () =>
    {
      setTrackingId(paramId);
      setLoading(true);
      try {
        console.log('[Track] Auto-fetching delivery for param:', paramId);
        const response = await getDeliveryByTracking(paramId);
        const data = response?.data?.delivery || response?.delivery || response?.data || response;
        setDeliveryData(data);
      } catch (err) {
        console.error('[Track] Auto-fetch failed:', err);
        setToastMsg(err?.message || 'Tracking number not found');
        setShowToast(true);
        setDeliveryData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchByParam();
  }, [params?.trackingId]);

  // Listen for delivery updates and refresh if the current delivery changes
  useEffect(() =>
  {
    const handleDeliveryUpdated = (event) =>
    {
      if (deliveryData && event.detail) {
        const updatedDeliveryId = event.detail.deliveryId || event.detail.id;
        const currentDeliveryId = deliveryData._id || deliveryData.id;

        if (updatedDeliveryId === currentDeliveryId) {
          console.log('[Track] Delivery status updated, refreshing:', updatedDeliveryId);
          const newStatus = event.detail.status || deliveryData.status;

          // Update the status in current delivery data
          setDeliveryData(prev => ({
            ...prev,
            status: newStatus,
            updatedAt: new Date().toISOString()
          }));

          // Show toast notification
          setToastMsg(`✅ Status updated to: ${newStatus}`);
          setShowToast(true);

          // Play notification sound if delivery is completed
          if ((newStatus?.toLowerCase() === 'delivered' || newStatus?.toLowerCase() === 'completed')) {
            console.log('[Track] 🔔 Delivery completed! Playing notification sound');
            playNotificationSound();
          }

          // Show rating modal if delivery is completed and not yet rated
          if ((newStatus?.toLowerCase() === 'delivered' || newStatus?.toLowerCase() === 'completed') &&
            !hasRated &&
            !deliveryData.rating &&
            !deliveryData.customerRating) {
            console.log('[Track] ⭐ Triggering rating modal in 1.5s for delivery:', deliveryData._id || deliveryData.id);
            setTimeout(() =>
            {
              console.log('[Track] 🚀 Dispatching rating:show event now!', deliveryData);
              window.dispatchEvent(new CustomEvent('rating:show', { detail: deliveryData }));
            }, 1500);
          }
        }
      }
    };

    window.addEventListener('delivery:updated', handleDeliveryUpdated);

    // Socket.io integration
    let socketCleanup = () => { };

    if (deliveryData) {
      const deliveryId = deliveryData._id || deliveryData.id;

      socketService.connect();
      socketService.joinRoom(deliveryId);

      const handleLocationUpdate = (data) =>
      {
        if (data && data.location) {
          console.log('[Track] Driver location updated:', data.location);
          setDriverLocation(data.location);
        }
      };

      const handleStatusUpdate = (data) =>
      {
        console.log('[Track] Socket status update received:', data);
        if (data) {
          const newStatus = data.status || data.newStatus;
          if (newStatus) {
            // Update the status in current delivery data
            setDeliveryData(prev => ({
              ...prev,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }));

            // Show toast notification
            setToastMsg(`✅ Status updated to: ${newStatus}`);
            setShowToast(true);

            // Play notification sound if delivery is completed
            if ((newStatus?.toLowerCase() === 'delivered' || newStatus?.toLowerCase() === 'completed')) {
              console.log('[Track] 🔔 Delivery completed (socket)! Playing notification sound');
              playNotificationSound();
            }

            // Show rating modal if delivery is completed and not yet rated
            if ((newStatus?.toLowerCase() === 'delivered' || newStatus?.toLowerCase() === 'completed') &&
              !hasRated &&
              !deliveryData.rating &&
              !deliveryData.customerRating) {
              console.log('[Track] ⭐ Triggering rating modal in 1.5s for delivery (socket):', deliveryData._id || deliveryData.id);
              setTimeout(() =>
              {
                console.log('[Track] 🚀 Dispatching rating:show event now (socket)!', deliveryData);
                window.dispatchEvent(new CustomEvent('rating:show', { detail: deliveryData }));
              }, 1500);
            }
          }
        }
      };

      const handlePaymentConfirmed = (data) =>
      {
        console.log('[Track] 💳 payment:confirmed socket event:', data);
        if (data && (data.deliveryId === deliveryId || data.trackingNumber === deliveryData?.trackingNumber)) {
          setDeliveryData(prev => (prev ? { ...prev, paymentStatus: 'paid' } : prev));
          setToastMsg('✅ Payment confirmed! Delivery is now in progress.');
          setShowToast(true);
        }
      };

      socketService.on('delivery:location:updated', handleLocationUpdate);
      socketService.on('delivery:statusChanged', handleStatusUpdate);
      socketService.on('delivery:updated', handleStatusUpdate);
      socketService.on('payment:confirmed', handlePaymentConfirmed);

      // Initialize driver location from deliveryData: prefer currentLocation, then estimatedRiderLocation
      if (deliveryData.currentLocation) {
        const loc = deliveryData.currentLocation;
        if (Array.isArray(loc)) {
          setDriverLocation({ lat: loc[1], lng: loc[0] });
        } else if (loc.lat && loc.lng) {
          setDriverLocation(loc);
        } else if (loc.coordinates) {
          setDriverLocation({ lat: loc.coordinates[1], lng: loc.coordinates[0] });
        }
      } else if (deliveryData.estimatedRiderLocation) {
        const loc = deliveryData.estimatedRiderLocation;
        if (loc.lat != null && loc.lng != null) {
          setDriverLocation({ lat: Number(loc.lat), lng: Number(loc.lng) });
        }
      }

      socketCleanup = () =>
      {
        socketService.leaveRoom(deliveryId);
        socketService.off('delivery:location:updated', handleLocationUpdate);
        socketService.off('delivery:statusChanged', handleStatusUpdate);
        socketService.off('delivery:updated', handleStatusUpdate);
        socketService.off('payment:confirmed', handlePaymentConfirmed);
      };
    }

    return () =>
    {
      window.removeEventListener('delivery:updated', handleDeliveryUpdated);
      socketCleanup();
    };
  }, [deliveryData]);

  const handleTrack = async (e) =>
  {
    e.preventDefault();

    if (!trackingId.trim()) {
      setToastMsg('Please enter a tracking number');
      setShowToast(true);
      return;
    }

    setLoading(true);

    try {
      console.log('[Track] Fetching delivery:', trackingId);
      const response = await getDeliveryByTracking(trackingId);
      console.log('[Track] Delivery data:', response);

      // Extract delivery from nested response structure
      const data = response?.data?.delivery || response?.delivery || response?.data || response;
      setDeliveryData(data);

      // Check if delivery is completed and not yet rated
      const statusLower = data.status?.toLowerCase();
      const isCompleted = statusLower === 'delivered' || statusLower === 'completed';
      const alreadyRated = data.rating || data.customerRating || data.hasRated;

      if (isCompleted && !alreadyRated && !hasRated) {
        console.log('[Track] ⭐ Delivery completed and not rated, triggering modal in 2s');
        // Play notification sound for completed delivery
        playNotificationSound();
        setTimeout(() =>
        {
          console.log('[Track] 🚀 Dispatching rating:show event for tracked delivery!', data);
          window.dispatchEvent(new CustomEvent('rating:show', { detail: data }));
        }, 2000);
      }

    } catch (err) {
      console.error('[Track] Failed to fetch delivery:', err);
      setToastMsg(err?.message || 'Tracking number not found');
      setShowToast(true);
      setDeliveryData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) =>
  {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'delivered') return 'bg-green-500';
    if (statusLower === 'in-transit' || statusLower === 'in transit') return 'bg-blue-500';
    if (statusLower === 'picked-up' || statusLower === 'picked up') return 'bg-orange-500';
    if (statusLower === 'assigned' || statusLower === 'pending') return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getStatusBadge = (status) =>
  {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'delivered') return 'bg-green-100 text-green-700';
    if (statusLower === 'in-transit' || statusLower === 'in transit') return 'bg-[#00B75A] text-[#FFFFFF]';
    if (statusLower === 'picked-up' || statusLower === 'picked up') return 'bg-orange-100 text-orange-700';
    if (statusLower === 'assigned' || statusLower === 'pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) =>
  {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString) =>
  {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  // Derive status flags to control timeline rendering
  // Order: assigned → picked-up → in-transit → delivered
  const statusLower = deliveryData?.status?.toLowerCase() || '';
  const pickedUpReached = statusLower === 'picked-up' || statusLower === 'picked up' || statusLower === 'in-transit' || statusLower === 'in transit' || statusLower === 'delivered';
  const inTransitReached = statusLower === 'in-transit' || statusLower === 'in transit' || statusLower === 'delivered';
  const deliveredReached = statusLower === 'delivered';

  // Prefer recipientInfo (canonical); fallback to legacy flat fields
  const ri = deliveryData?.recipientInfo;
  const recipientName = (ri?.name && String(ri.name).trim()) || deliveryData?.recipient?.name || deliveryData?.recipientName || deliveryData?.deliveryName || deliveryData?.receiverName || deliveryData?.recipient_full_name || deliveryData?.toName || deliveryData?.to?.name || 'N/A';
  const recipientPhoneRaw = ri?.phone || deliveryData?.recipient?.phone || deliveryData?.recipientPhone || deliveryData?.deliveryContactPhone || deliveryData?.receiverPhone || deliveryData?.toPhone || deliveryData?.to?.phone;
  const recipientPhone = recipientPhoneRaw && String(recipientPhoneRaw).trim() ? String(recipientPhoneRaw).trim() : 'N/A';
  const recipientEmailRaw = ri?.email || deliveryData?.recipient?.email || deliveryData?.recipientEmail || deliveryData?.toEmail || deliveryData?.to?.email;
  const recipientEmail = recipientEmailRaw && String(recipientEmailRaw).trim() ? String(recipientEmailRaw).trim() : 'N/A';
  const recipientAddressLine = deliveryData?.deliveryAddress?.street || deliveryData?.deliveryAddress?.address || deliveryData?.deliveryAddress || deliveryData?.deliveryAddressString || '';
  // Weight: avoid appending " kg" if value already contains "kg" (fixes "0-5 kg kg")
  const weightDisplay = (() =>
  {
    const w = deliveryData?.packageDetails?.weight;
    if (!w) return 'N/A';
    const s = String(w).trim();
    if (/kg$/i.test(s)) return s;
    return s ? `${s} kg` : 'N/A';
  })();

  const refetchDelivery = async () =>
  {
    const id = params?.trackingId || trackingId || deliveryData?.trackingNumber || deliveryData?.trackingId;
    if (!id) return;
    try {
      const response = await getDeliveryByTracking(id);
      const data = response?.data?.delivery || response?.delivery || response?.data || response;
      setDeliveryData(data);
    } catch (e) {
      console.warn('[Track] Refetch after payment failed', e);
    }
  };

  useEffect(() =>
  {
    const onPaymentCompleted = () =>
    {
      refetchDelivery();
      setToastMsg('Payment completed successfully.');
      setShowToast(true);
    };
    window.addEventListener('payment:completed', onPaymentCompleted);
    return () => window.removeEventListener('payment:completed', onPaymentCompleted);
  }, [params?.trackingId, trackingId, deliveryData?.trackingNumber]);

  // Refetch delivery when user returns to this tab (e.g. after completing payment in popup).
  // If we have a pending_payment_id cookie (user just came back from Paystack), verify once then refetch.
  useEffect(() =>
  {
    const onVisibilityChange = async () =>
    {
      if (document.visibilityState !== 'visible') return;
      const pendingRef = getCookie('pending_payment_id');
      if (pendingRef && deliveryData) {
        try {
          await verifyPaymentByReference(pendingRef);
          deleteCookie('pending_payment_id');
          deleteCookie('pending_payment_delivery_id');
        } catch (e) {
          console.warn('[Track] Verify by reference on visibility failed', e);
        }
      }
      if (deliveryData) refetchDelivery();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [params?.trackingId, trackingId, deliveryData?.trackingNumber]);

  const handlePayNow = async () =>
  {
    const deliveryId = deliveryData?._id || deliveryData?.id;
    if (!deliveryId) {
      setToastMsg('Unable to start payment.');
      setShowToast(true);
      return;
    }
    const amountRaw = deliveryData?.price ?? deliveryData?.total ?? deliveryData?.amount ?? 0;
    const amount = typeof amountRaw === 'string' ? parseFloat(amountRaw.replace(/[^0-9.-]+/g, '')) : Number(amountRaw) || 0;
    const email = deliveryData?.recipientInfo?.email || deliveryData?.recipientEmail || (getJSONCookie && getJSONCookie('user_data')?.email) || 'customer@swiftlyxpress.com';

    let paymentWindow = null;
    try {
      paymentWindow = window.open('', '_blank');
      if (paymentWindow) paymentWindow.document.write('<p>Preparing payment...</p>');
    } catch (e) {
      paymentWindow = null;
    }

    try {
      setIsPaymentProcessing(true);
      setToastMsg('Preparing payment...');
      setShowToast(true);

      const initJson = await initializePayment(deliveryId, {
        amount,
        currency: 'NGN',
        email,
        callback_url: `${window.location.origin}/customer/payment/callback`,
        metadata: { deliveryId },
      });

      const initPayload = initJson?.data || initJson;
      const paymentObj = initPayload?.data?.payment || initPayload?.payment || initPayload?.data;
      const paymentReference = paymentObj?.reference || paymentObj?.id || paymentObj?.paymentId;
      const authorizationUrl = paymentObj?.authorizationUrl || paymentObj?.authorization_url || paymentObj?.url || paymentObj?.payment_url;

      if (deliveryId) setCookie('pending_payment_delivery_id', String(deliveryId), 1);
      if (paymentReference) setCookie('pending_payment_id', String(paymentReference), 1);

      const cleanupOnCancel = () =>
      {
        try {
          deleteCookie('pending_payment_delivery_id');
          deleteCookie('pending_payment_id');
        } catch (e) { }
        setIsPaymentProcessing(false);
      };

      if (authorizationUrl) {
        try {
          if (paymentWindow) paymentWindow.location.href = authorizationUrl;
          else window.open(authorizationUrl, '_blank');

          const popupInterval = setInterval(async () =>
          {
            try {
              if (!paymentWindow || paymentWindow.closed) {
                clearInterval(popupInterval);

                // Wait briefly for the PaymentSuccess page to finish deleting cookies
                // and dispatching events, then always verify + refetch regardless.
                await new Promise(r => setTimeout(r, 1800));

                const pendingRef = getCookie('pending_payment_id');
                const pendingDelivery = getCookie('pending_payment_delivery_id');
                console.log('[Track] Popup closed. pendingRef:', pendingRef, 'pendingDelivery:', pendingDelivery);

                // If the cookies are still there the user may have abandoned payment,
                // but we still verify to be sure (Paystack may have succeeded anyway).
                if (pendingRef) {
                  try {
                    console.log('[Track] Verifying payment reference after popup close:', pendingRef);
                    await verifyPaymentByReference(pendingRef);
                    deleteCookie('pending_payment_id');
                    deleteCookie('pending_payment_delivery_id');
                  } catch (ve) {
                    console.warn('[Track] Post-popup verify failed:', ve?.response?.status, ve?.message);
                    // Clean up cookies either way
                    deleteCookie('pending_payment_id');
                    deleteCookie('pending_payment_delivery_id');
                  }
                }

                // Always re-fetch the delivery to reflect the latest payment status.
                setIsPaymentProcessing(false);
                await refetchDelivery();

                // Dispatch event so other listeners (e.g. MyDeliveries) can refresh too.
                window.dispatchEvent(new CustomEvent('payment:completed', { detail: { deliveryId: pendingDelivery } }));
                window.dispatchEvent(new Event('deliveries:refresh'));
              }
            } catch (e) {
              clearInterval(popupInterval);
              setIsPaymentProcessing(false);
            }
          }, 1000);
          return;
        } catch (navErr) {
          console.warn('[Track] Failed to open payment URL', navErr);
        }
      }


      if (paymentReference) {
        try {
          if (paymentWindow) paymentWindow.close();
        } catch (e) { }
        const PaystackPop = (await import('@paystack/inline-js')).default;
        const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxx';
        const handler = PaystackPop.setup({
          key: paystackPublicKey,
          email,
          amount: Math.round((amount || 0) * 100),
          ref: paymentReference,
          onClose: cleanupOnCancel,
          callback: () =>
          {
            try {
              deleteCookie('pending_payment_delivery_id');
              deleteCookie('pending_payment_id');
            } catch (e) { }
            window.location.href = '/customer/payment/callback';
          },
        });
        handler.openIframe();
      }
    } catch (err) {
      console.error('[Track] Payment init error', err);
      setToastMsg(err?.message || 'Failed to start payment');
      setShowToast(true);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  // Handle rating submission
  const handleSubmitRating = async (ratingData) =>
  {
    try {
      console.log('[Track] Submitting rating:', ratingData);
      // Only send rating field - backend doesn't accept comment or driverId
      const response = await rateDriver(ratingData.deliveryId, {
        rating: ratingData.rating
      });

      console.log('[Track] Rating submitted successfully:', response);
      setHasRated(true);

      // Update delivery data to reflect rating
      setDeliveryData(prev => ({
        ...prev,
        rating: ratingData.rating,
        customerRating: ratingData.rating,
        hasRated: true
      }));

      // Show success toast
      setToastMsg('⭐ Thank you for your feedback!');
      setShowToast(true);

      // Dispatch event to notify rider and update UI
      window.dispatchEvent(new CustomEvent('rating:submitted', {
        detail: {
          deliveryId: ratingData.deliveryId,
          driverId: ratingData.driverId,
          rating: ratingData.rating,
          comment: ratingData.comment
        }
      }));
    } catch (error) {
      console.error('[Track] Failed to submit rating:', error);
      setToastMsg(error.message || 'Failed to submit rating');
      setShowToast(true);
    }
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

          {/* Header */}
          <div className="mb-4">
            <YummyText>
              <div className="text-3xl font-medium text-[#0F172A] mb-2 mt-3 text-left md:text-left">
                Track Your Delivery
              </div>
              <div className="text-[#4A5565] text-[15px] font-[400] text-left sm:text-left md:text-left">
                Enter your tracking number to see <br className="sm:hidden md:hidden lg:block" /> real-time updates
              </div>
            </YummyText>
          </div>

          {/* Tracking Input */}
          <YummyText>
            <div className="bg-white p-2 rounded-full mb-8" style={sideBottomShadow}>
              <form onSubmit={handleTrack} className="flex gap-3">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter your package Id"
                  className="flex-1 px-5 py-3 rounded-full bg-[#F3F3F5] text-[#0F172A] font-medium placeholder:text-[#717182] placeholder:font-[400] focus:outline-none focus:ring-2 focus:ring-[#00B75A] border-none"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-3 md:px-8 sm:px-8 py-3 md:py-3 sm:py-3 bg-[#00B75A] ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00a352]'} text-white rounded-full transition-colors font-medium flex items-center gap-1`}
                >
                  <LocationIcon width={20} height={20} stroke="#FFFFFF" />
                  {loading ? 'Tracking' : 'Track'}
                </button>
              </form>
            </div>
          </YummyText>

          {/* Loading State */}
          {loading && (
            <div className="py-6">
              <Loader message="Tracking package..." />
            </div>
          )}

          {/* Tracking Result */}
          {!loading && deliveryData && (
            <div className="space-y-6">
              {/* Map and status card */}
              <div className="bg-white rounded-2xl overflow-hidden" style={sideBottomShadow}>
                {/* Status: rider ETA to pickup, ETA to delivery, or arrived */}
                {(deliveryData.estimatedArrivalMinutes != null && (statusLower === 'assigned' || statusLower === 'picked-up' || statusLower === 'picked up')) ||
                  (deliveryData.estimatedTimeMinutes != null && (statusLower === 'in-transit' || statusLower === 'in transit')) ||
                  (statusLower === 'delivered') ? (
                  <div className="px-4 py-3 border-b border-gray-100 bg-[#F8FAFC]">
                    <YummyText className="text-sm font-medium text-[#0F172A]">
                      {statusLower === 'delivered'
                        ? (deliveryData.deliveryTime || deliveryData.deliveredAt
                          ? `Driver has arrived at delivery location · ${formatDate(deliveryData.deliveryTime || deliveryData.deliveredAt)} ${formatTime(deliveryData.deliveryTime || deliveryData.deliveredAt)}`
                          : 'Driver has arrived at delivery location')
                        : (statusLower === 'in-transit' || statusLower === 'in transit') && deliveryData.estimatedTimeMinutes != null
                          ? `Estimated time to delivery: ~${deliveryData.estimatedTimeMinutes} min`
                          : deliveryData.estimatedArrivalMinutes != null
                            ? `Rider arriving at pickup in ~${deliveryData.estimatedArrivalMinutes} min`
                            : null}
                    </YummyText>
                  </div>
                ) : null}
                <div className="h-64 relative">
                  {deliveryData.pickupAddress?.coordinates && deliveryData.deliveryAddress?.coordinates ? (
                    <TrackingMap
                      pickupLocation={{
                        lat: deliveryData.pickupAddress.coordinates.lat || deliveryData.pickupAddress.coordinates[1],
                        lng: deliveryData.pickupAddress.coordinates.lng || deliveryData.pickupAddress.coordinates[0]
                      }}
                      dropoffLocation={{
                        lat: deliveryData.deliveryAddress.coordinates.lat || deliveryData.deliveryAddress.coordinates[1],
                        lng: deliveryData.deliveryAddress.coordinates.lng || deliveryData.deliveryAddress.coordinates[0]
                      }}
                      driverLocation={driverLocation}
                    />
                  ) : (
                    <div className="h-64 bg-gradient-to-br from-[#E5F5E5] to-[#C8E6C9] flex items-center justify-center">
                      <div className="text-center">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3 opacity-50">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#00B75A" />
                          <circle cx="12" cy="10" r="3" fill="white" />
                        </svg>
                        <YummyText className="text-[#64748B] text-sm">
                          Map view
                        </YummyText>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat with rider (when driver is assigned) */}
              {deliveryData.driver && (deliveryData._id || deliveryData.id) && (
                <div style={sideBottomShadow} className="rounded-2xl overflow-hidden">
                  <DeliveryChat
                    deliveryId={deliveryData._id || deliveryData.id}
                    currentUserRole="customer"
                    canSend={!!deliveryData.driver}
                    maxHeight="280px"
                  />
                </div>
              )}

              {/* Payment information and Pay now */}
              <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
                <YummyText>
                  <div className="text-sm font-medium text-[#0F172A] mb-4">Payment</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B]">Amount</span>
                      <span className="text-sm font-medium text-[#0F172A]">
                        ₦{(deliveryData.price != null ? Number(deliveryData.price) : 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 my-3" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B]">Method</span>
                      <span className="text-sm font-medium text-[#0F172A] capitalize">
                        {(deliveryData.paymentMethod || deliveryData.payment?.method || 'Cash').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 my-3" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B]">Status</span>
                      {(() =>
                      {
                        const ps = (deliveryData.paymentStatus || deliveryData.payment?.status || '').toLowerCase();
                        if (ps === 'paid') {
                          return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>;
                        }
                        const method = (deliveryData.paymentMethod || deliveryData.payment?.method || '').toString().toLowerCase();
                        if (method === 'cash' || method === 'cash_on_delivery' || method === 'cod') {
                          return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Pay on delivery</span>;
                        }
                        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Unpaid</span>;
                      })()}
                    </div>
                    {(() =>
                    {
                      const paymentStatus = (deliveryData.paymentStatus || deliveryData.payment?.status || '').toLowerCase();
                      const method = (deliveryData.paymentMethod || deliveryData.payment?.method || '').toString().toLowerCase().trim();
                      const isCod = method === 'cash' || method === 'cash_on_delivery' || method === 'cod';
                      const canPay = (paymentStatus === 'pending' || paymentStatus === 'unpaid' || paymentStatus === 'failed') &&
                        deliveryData.status?.toLowerCase() !== 'cancelled';
                      if (!canPay) return null;
                      return (
                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={handlePayNow}
                            disabled={isPaymentProcessing}
                            className="w-full py-3 bg-[#00B75A] hover:bg-[#00a352] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                          >
                            {isPaymentProcessing ? 'Preparing payment...' : (isCod ? 'Pay online instead' : 'Pay now')}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </YummyText>
              </div>

              {/* Package Details and Recipient Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Package Details */}
                <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
                  <YummyText>
                    <div className="text-sm font-medium text-[#0F172A] -mb-1">
                      Package Details
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-[#64748B]">Tracking ID: </span>
                        <span className="text-sm text-[#64748B] ">
                          {deliveryData.trackingNumber || deliveryData.trackingId || deliveryData.id || deliveryData._id}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(deliveryData.status)}`}>
                          {deliveryData.status || 'Pending'}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">From</span>
                        <span className="text-sm font-medium text-[#0F172A] text-right">
                          {deliveryData.pickupAddress?.city}, {deliveryData.pickupAddress?.state}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">To</span>
                        <span className="text-sm font-medium text-[#0F172A] text-right">
                          {deliveryData.deliveryAddress?.city}, {deliveryData.deliveryAddress?.state}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">Weight</span>
                        <span className="text-sm font-medium text-[#0F172A]">
                          {weightDisplay}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">Dimensions</span>
                        <span className="text-sm font-medium text-[#0F172A]">
                          {deliveryData.packageDetails?.dimensions || 'N/A'}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">Est. Delivery</span>
                        <span className="text-sm font-medium text-[#0F172A]">
                          {formatDate(deliveryData.estimatedDelivery || deliveryData.createdAt)}
                        </span>
                      </div>
                    </div>
                  </YummyText>
                </div>

                {/* Recipient Information */}
                <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
                  <YummyText>
                    <div className="text-sm font-medium text-[#0F172A] mb-4">
                      Recipient Information
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">Name</span>
                        <span className="text-sm font-medium text-[#0F172A]">
                          {recipientName}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">Phone</span>
                        <span className="text-sm font-medium text-[#0F172A]">
                          {recipientPhone !== 'N/A' && normalizePhoneForTel(recipientPhone) ? (
                            <a href={`tel:${normalizePhoneForTel(recipientPhone)}`} className="text-[#00B75A] hover:underline no-underline">
                              {formatNigerianPhone(recipientPhone)}
                            </a>
                          ) : (
                            recipientPhone
                          )}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">Email</span>
                        <span className="text-sm font-medium text-[#0F172A]">
                          {recipientEmail}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm text-[#64748B]">Address</span>
                        <span className="text-sm font-medium text-[#0F172A] text-right max-w-[60%]">
                          {recipientAddressLine}{recipientAddressLine ? ', ' : ''}{deliveryData.deliveryAddress?.city || ''}{deliveryData.deliveryAddress?.city ? ', ' : ''}{deliveryData.deliveryAddress?.state || ''}
                        </span>
                      </div>
                    </div>
                  </YummyText>
                </div>
              </div>

              {/* Package Images */}
              {(() =>
              {
                // Collect all image URLs — check packageDetails.images FIRST (canonical field).
                // Use a helper that skips empty arrays, so a top-level `images: []` default
                // doesn't short-circuit and hide real images in packageDetails.images.
                const nonEmpty = (v) => Array.isArray(v) ? v.length > 0 : Boolean(v);
                const rawImages =
                  (nonEmpty(deliveryData?.packageDetails?.images) && deliveryData.packageDetails.images) ||
                  (nonEmpty(deliveryData?.packageDetails?.image) && deliveryData.packageDetails.image) ||
                  (nonEmpty(deliveryData?.images) && deliveryData.images) ||
                  (nonEmpty(deliveryData?.image) && deliveryData.image) ||
                  (nonEmpty(deliveryData?.packageImage) && deliveryData.packageImage) ||
                  null;

                const imageList = (() =>
                {
                  if (!rawImages) return [];
                  const arr = Array.isArray(rawImages) ? rawImages : [rawImages];
                  return arr
                    .map(img =>
                    {
                      if (!img) return null;
                      if (typeof img === 'string') return img.trim();
                      if (typeof img === 'object') return img.url || img.src || img.path || null;
                      return null;
                    })
                    .filter(Boolean);
                })();

                // Don't render the card at all if there are no images
                if (imageList.length === 0) return null;

                return (
                  <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
                    <YummyText>
                      <div className="text-sm font-medium text-[#0F172A] mb-4">
                        Package Images {imageList.length > 1 && <span className="text-[#00B75A] font-normal">({imageList.length})</span>}
                      </div>
                    </YummyText>
                    <PackageImageGallery images={imageList} />
                  </div>
                );
              })()}


              {/* Tracking History */}
              <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
                <YummyText>
                  <div className="mb-2">
                    <div className="text-lg font-medium text-[#0F172A]">
                      Tracking History
                    </div>
                    <div className="text-sm text-[#64748B]">
                      Complete journey of your package
                    </div>
                  </div>
                </YummyText>

                <div className="mt-6 space-y-6">
                  {/** Always render the full 4-step timeline; highlight steps based on status */}
                  {/* Package Received */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 bg-[#00B75A] rounded-full flex items-center justify-center flex-shrink-0`}>
                        <BlockIcon width={24} height={24} stroke="#FFFFFF" />
                      </div>
                      <div className={`w-0.5 h-16 ${pickedUpReached ? 'bg-[#00B75A]' : 'bg-gray-300'}`}></div>
                    </div>
                    <div className="flex-1 pt-2">
                      <YummyText>
                        <div className="text-sm font-medium text-[#0F172A] mb-1">Package Received</div>
                        <div className="text-xs text-[#64748B] mb-1">{deliveryData.pickupAddress?.city} Distribution Center</div>
                        <div className="text-xs text-[#94A3B8]">{formatDate(deliveryData.createdAt)} {formatTime(deliveryData.createdAt)}</div>
                      </YummyText>
                    </div>
                    <div className="text-xs text-[#94A3B8] pt-2">{formatTime(deliveryData.createdAt)}</div>
                  </div>

                  {/* Picked Up / Out for Delivery */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 ${pickedUpReached ? 'bg-[#00B75A]' : 'bg-[#E5E7EB]'} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <LocationIcon width={24} height={24} stroke="#FFFFFF" />
                      </div>
                      <div className={`w-0.5 h-16 ${inTransitReached ? 'bg-[#00B75A]' : 'bg-gray-300'}`}></div>
                    </div>
                    <div className="flex-1 pt-2">
                      <YummyText>
                        <div className="text-sm font-medium text-[#0F172A] mb-1">Out for Delivery</div>
                        <div className="text-xs text-[#64748B] mb-1">Package picked up by rider</div>
                        <div className="text-xs text-[#94A3B8]">{formatDate(deliveryData.updatedAt)}</div>
                      </YummyText>
                    </div>
                    <div className="text-xs text-[#94A3B8] pt-2">{formatTime(deliveryData.updatedAt)}</div>
                  </div>

                  {/* In Transit */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 ${inTransitReached ? 'bg-[#00B75A]' : 'bg-[#E5E7EB]'} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <VanIcon width={24} height={24} stroke="#FFFFFF" />
                      </div>
                      <div className={`w-0.5 h-16 ${deliveredReached ? 'bg-[#00B75A]' : 'bg-gray-300'}`}></div>
                    </div>
                    <div className="flex-1 pt-2">
                      <YummyText>
                        <div className="text-sm font-medium text-[#0F172A] mb-1">In Transit</div>
                        <div className="text-xs text-[#64748B] mb-1">On the way to destination</div>
                        <div className="text-xs text-[#94A3B8]">{formatDate(deliveryData.updatedAt)}</div>
                      </YummyText>
                    </div>
                    <div className="text-xs text-[#94A3B8] pt-2">{formatTime(deliveryData.updatedAt)}</div>
                  </div>

                  {/* Delivered */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 ${deliveredReached ? 'bg-[#00B75A]' : 'bg-[#E5E7EB]'} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <CheckIcon width={24} height={24} stroke="#FFFFFF" />
                      </div>
                    </div>
                    <div className={`flex-1 pt-2 ${!deliveredReached ? 'opacity-50' : ''}`}>
                      <YummyText>
                        <div className="text-sm font-medium text-[#0F172A] mb-1">Delivered</div>
                        <div className="text-xs text-[#64748B] mb-1">{deliveredReached ? 'Package delivered successfully' : 'Estimated delivery'}</div>
                        <div className="text-xs text-[#94A3B8]">{deliveredReached ? formatDate(deliveryData.deliveredAt || deliveryData.updatedAt) : formatDate(deliveryData.estimatedDelivery)}</div>
                      </YummyText>
                    </div>
                    <div className="text-xs text-[#94A3B8] pt-2">{deliveredReached ? formatTime(deliveryData.deliveredAt || deliveryData.updatedAt) : 'By 6:00 PM'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rating handled by global RatingModal mounted in CustomerLayout. */}
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default Track;