import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonToast } from '@ionic/react';
import { eye, eyeOff, arrowForward, copy } from 'ionicons/icons';
import CustomerLayout from '../components/CustomerLayout';
import PaymentFailedModal from '../components/PaymentFailedModal';
import { YummyText } from '../../../components/YummyText';
import Loader from '../../../components/Loader';
import { getCustomerDeliveries, rateDriver, cancelDelivery, initializePayment } from '../../../utils/authApi';
import { getCookie, deleteCookie, setCookie, getJSONCookie } from '../../../utils/cookies';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

// Helper function to get status styling
const getStatusStyle = (status) => {
  const statusLower = status?.toLowerCase() || 'pending';

  const styles = {
    assigned: { color: 'text-yellow-700', bg: 'bg-yellow-100' },
    'picked-up': { color: 'text-orange-700', bg: 'bg-orange-100' },
    'in-transit': { color: 'text-blue-700', bg: 'bg-blue-100' },
    'in transit': { color: 'text-blue-700', bg: 'bg-blue-100' },
    delivered: { color: 'text-green-700', bg: 'bg-green-100' },
    cancelled: { color: 'text-red-700', bg: 'bg-red-100' },
    pending: { color: 'text-orange-700', bg: 'bg-orange-100' },
    processing: { color: 'text-yellow-700', bg: 'bg-yellow-100' },
    completed: { color: 'text-green-700', bg: 'bg-green-100' },
    failed: { color: 'text-red-700', bg: 'bg-red-100' }
  };

  return styles[statusLower] || { color: 'text-gray-700', bg: 'bg-gray-100' };
};

// Helper function to calculate progress
const getProgress = (status) => {
  const statusLower = status?.toLowerCase() || 'pending';

  const progressMap = {
    assigned: 25,
    'picked-up': 50,
    'in-transit': 75,
    'in transit': 75,
    delivered: 100,
    pending: 10,
    processing: 25,
    'out for delivery': 85,
    completed: 100
  };

  return progressMap[statusLower] || 0;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

const DeliveryCard = ({ delivery }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const statusStyle = getStatusStyle(delivery.status);
  const progress = getProgress(delivery.status);
  const paymentStatus = (delivery.paymentStatus || delivery.payment?.status || '').toLowerCase();

  const handleToggleDetails = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {
      const deliveryId = delivery._id || delivery.id || delivery.trackingNumber || delivery.trackingId;
      if (deliveryId) {
        window.dispatchEvent(new CustomEvent('delivery:read', {
          detail: {
            id: deliveryId,
            _id: delivery._id,
            deliveryId: deliveryId
          }
        }));
      }
    }
  };

  const handleCopyPackageId = async () => {
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    try {
      await navigator.clipboard.writeText(packageId);
      setShowCopyToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 mb-4 relative" style={sideBottomShadow}>
      {/* Mobile: Make Payment button at top-right */}
      {(paymentStatus === 'pending' || paymentStatus === 'unpaid' || paymentStatus === 'failed') && (
        <button
          onClick={() => {
            const deliveryId = delivery._id || delivery.id || delivery.trackingNumber;
            window.dispatchEvent(new CustomEvent('payment:init', { detail: { deliveryId } }));
          }}
          className="md:hidden absolute top-3 right-3 px-3 py-1 rounded-full border border-black bg-white text-black text-xs font-medium z-20"
          aria-label="Make Payment"
          style={{ borderStyle: 'solid' }}
        >
          <YummyText className="text-xs font-medium">Make Payment</YummyText>
        </button>
      )}
      {/* Mobile & Desktop Layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3 md:gap-4 flex-1">
          {/* Package Icon */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <img src="/blockicon.svg" alt="Package" className="w-5 h-5 md:w-6 md:h-6" />
          </div>

          {/* Package Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
              <YummyText className="text-base md:text-lg font-medium text-[#0F172A] truncate">
                {delivery.packageDetails?.description || 'Package'}
              </YummyText>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color} w-fit`}>
                  {delivery.status || 'Pending'}
                </span>

                {/* Payment tag */}
                {paymentStatus === 'paid' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Yet to pay</span>
                )}

                {/* Desktop/Tablet: show Make Payment tag when unpaid */}
                {(paymentStatus === 'pending' || paymentStatus === 'unpaid' || paymentStatus === 'failed') && (
                  <button
                    onClick={() => {
                      const deliveryId = delivery._id || delivery.id || delivery.trackingNumber;
                      window.dispatchEvent(new CustomEvent('payment:init', { detail: { deliveryId } }));
                    }}
                    className="hidden md:inline-flex px-3 py-1 rounded-full text-xs font-medium border-2 border-black bg-white text-black z-10"
                    style={{ borderStyle: 'solid' }}
                  >
                    <YummyText className="text-xs font-medium">Make Payment</YummyText>
                  </button>
                )}
              </div>
            </div>

            <div className="text-sm text-[#4A5565] mb-1 flex items-center gap-1 flex-wrap">
              <span className="truncate max-w-[120px] md:max-w-none">{delivery.pickupAddress?.city || 'Pickup'}</span>
              <IonIcon icon={arrowForward} className="text-sm flex-shrink-0" />
              <span className="truncate max-w-[120px] md:max-w-none">{delivery.deliveryAddress?.city || 'Delivery'}</span>
            </div>

            <div className="text-xs text-[#4A5565] mb-3">
              Booked: {formatDate(delivery.createdAt || delivery.bookedDate)}
            </div>

            {/* Progress Bar */}
            <div className="w-full md:max-w-[300px]">
              <div className="flex justify-between items-center mb-1">
                <YummyText className="text-xs text-[#4A5565]">Progress</YummyText>
                <YummyText className="text-xs font-medium text-[#4A5565]">{progress}%</YummyText>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-[#00D68F] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <button
          onClick={handleToggleDetails}
          className="flex items-center justify-center gap-2 text-sm text-[#64748B] shadow-sm px-4 py-2 rounded-xl hover:text-[#0F172A] hover:border-gray-800 transition-colors w-full md:w-auto"
          style={{ border: '1.5px solid #0000001A' }}
        >
          <IonIcon icon={isOpen ? eyeOff : eye} className="text-lg" />
          <YummyText>{isOpen ? 'Hide' : 'View'} Details</YummyText>
        </button>
      </div>

      {/* Expanded Details */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Package ID</div>
              <div className="text-sm text-[#0F172A] flex items-center gap-2">
                <span className="truncate">{delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id || 'N/A'}</span>
                <button
                  onClick={handleCopyPackageId}
                  className="text-[#64748B] hover:text-[#0F172A] transition-colors flex-shrink-0"
                  title="Copy Package ID"
                >
                  <IonIcon icon={copy} className="text-lg" />
                </button>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Package Details</div>
              <div className="text-sm text-[#0F172A]">
                Weight: {delivery.packageDetails?.weight || 'N/A'} kg<br />
                Dimensions: {delivery.packageDetails?.dimensions || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Pickup Address</div>
              <div className="text-sm text-[#0F172A] break-words">
                {delivery.pickupAddress?.street}, {delivery.pickupAddress?.city}, {delivery.pickupAddress?.state}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Delivery Address</div>
              <div className="text-sm text-[#0F172A] break-words">
                {delivery.deliveryAddress?.street}, {delivery.deliveryAddress?.city}, {delivery.deliveryAddress?.state}
              </div>
            </div>
          </div>
        </div>
      )}
      <IonToast
        isOpen={showCopyToast}
        onDidDismiss={() => setShowCopyToast(false)}
        message="Package ID copied to clipboard!"
        duration={2000}
        position="bottom"
      />
    </div>
  );
};

// Mobile Completed Delivery Card
const MobileCompletedCard = ({ delivery }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const paymentStatus = (delivery.paymentStatus || delivery.payment?.status || '').toLowerCase();

  const handleToggleDetails = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {
      const deliveryId = delivery._id || delivery.id || delivery.trackingNumber || delivery.trackingId;
      if (deliveryId) {
        window.dispatchEvent(new CustomEvent('delivery:read', {
          detail: {
            id: deliveryId,
            _id: delivery._id,
            deliveryId: deliveryId
          }
        }));
      }
    }
  };

  const handleCopyPackageId = async () => {
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    try {
      await navigator.clipboard.writeText(packageId);
      setShowCopyToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 relative">
      {(paymentStatus === 'pending' || paymentStatus === 'unpaid' || paymentStatus === 'failed') && (
        <button
          onClick={() => {
            const deliveryId = delivery._id || delivery.id || delivery.trackingNumber;
            window.dispatchEvent(new CustomEvent('payment:init', { detail: { deliveryId } }));
          }}
          className="md:hidden absolute top-3 right-3 px-3 py-1 rounded-full border-2 border-black bg-white text-black text-xs font-medium z-20"
          aria-label="Make Payment"
          style={{ borderStyle: 'solid' }}
        >
          <YummyText className="text-xs font-medium">Make Payment</YummyText>
        </button>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <YummyText className="text-base font-medium text-[#0F172A] mb-1">
            {delivery.packageDetails?.description || 'Package'}
          </YummyText>
          <div className="text-sm text-[#4A5565] mb-2 flex items-center gap-1">
            <span className="truncate max-w-[100px]">{delivery.pickupAddress?.city || 'Pickup'}</span>
            <IonIcon icon={arrowForward} className="text-sm flex-shrink-0" />
            <span className="truncate max-w-[100px]">{delivery.deliveryAddress?.city || 'Delivery'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
            <span>Booked: {formatDate(delivery.createdAt)}</span>
            <span>•</span>
            <span>Delivered: {formatDate(delivery.deliveredAt)}</span>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            {delivery.status || 'Delivered'}
          </span>
        </div>
        <div className="flex items-center gap-3 ml-2">
          <button
            onClick={handleToggleDetails}
            className="text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <IonIcon icon={isOpen ? eyeOff : eye} className="text-xl" />
          </button>
          <button className="text-[#64748B] hover:text-[#0F172A] transition-colors">
            <img src="/downloadicon.svg" alt="Download" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="pt-3 border-t border-gray-100">
          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Package ID</div>
              <div className="text-sm text-[#0F172A] flex items-center gap-2">
                <span className="truncate">{delivery.trackingNumber || delivery.trackingId || 'N/A'}</span>
                <button
                  onClick={handleCopyPackageId}
                  className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                  title="Copy Package ID"
                >
                  <IonIcon icon={copy} className="text-lg" />
                </button>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Package Details</div>
              <div className="text-sm text-[#0F172A]">
                Weight: {delivery.packageDetails?.weight || 'N/A'} kg<br />
                Dimensions: {delivery.packageDetails?.dimensions || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Pickup Address</div>
              <div className="text-sm text-[#0F172A] break-words">
                {delivery.pickupAddress?.street}, {delivery.pickupAddress?.city}, {delivery.pickupAddress?.state}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Delivery Address</div>
              <div className="text-sm text-[#0F172A] break-words">
                {delivery.deliveryAddress?.street}, {delivery.deliveryAddress?.city}, {delivery.deliveryAddress?.state}
              </div>
            </div>
          </div>
        </div>
      )}
      <IonToast
        isOpen={showCopyToast}
        onDidDismiss={() => setShowCopyToast(false)}
        message="Package ID copied!"
        duration={2000}
        position="bottom"
      />
    </div>
  );
};

// Desktop Table Row
const CompletedDeliveryRow = ({ delivery }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const hasRated = delivery.rating || delivery.customerRating || delivery.hasRated;

  const handleToggleDetails = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {
      const deliveryId = delivery._id || delivery.id || delivery.trackingNumber || delivery.trackingId;
      if (deliveryId) {
        window.dispatchEvent(new CustomEvent('delivery:read', {
          detail: {
            id: deliveryId,
            _id: delivery._id,
            deliveryId: deliveryId
          }
        }));
      }
    }
  };

  const handleCopyPackageId = async () => {
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    try {
      await navigator.clipboard.writeText(packageId);
      setShowCopyToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-4 px-4 text-sm font-medium text-[#0A0A0A]">
          {delivery.packageDetails?.description || 'Package'}
        </td>
        <td className="py-4 px-4 text-sm text-[#0A0A0A]">
          <div className="flex items-center gap-1">
            <span>{delivery.pickupAddress?.city || 'Pickup'}</span>
            <IonIcon icon={arrowForward} className="text-sm" />
            <span>{delivery.deliveryAddress?.city || 'Delivery'}</span>
          </div>
        </td>
        <td className="py-4 px-4 text-sm text-[#0A0A0A]">
          {formatDate(delivery.createdAt || delivery.bookedDate)}
        </td>
        <td className="py-4 px-4 text-sm text-[#0A0A0A]">
          {formatDate(delivery.deliveredAt || delivery.deliveredDate)}
        </td>
        <td className="py-4 px-4">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            {delivery.status || 'Delivered'}
          </span>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleToggleDetails}
              className="text-[#0A0A0A] hover:text-[#0F172A] transition-colors"
            >
              <IonIcon icon={isOpen ? eyeOff : eye} className="text-xl" />
            </button>
            {hasRated && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                ⭐ {delivery.rating || delivery.customerRating}
              </span>
            )}
            <button className="text-[#0A0A0A] hover:text-[#0F172A] transition-colors">
              <img src="/downloadicon.svg" alt="Download" className="w-5 h-5" />
            </button>
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-gray-50">
          <td colSpan="6" className="py-4 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-[#64748B] mb-1">Package ID</div>
                <div className="text-sm text-[#0F172A] flex items-center gap-2">
                  <span>{delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id || 'N/A'}</span>
                  <button
                    onClick={handleCopyPackageId}
                    className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                    title="Copy Package ID"
                  >
                    <IonIcon icon={copy} className="text-lg" />
                  </button>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#64748B] mb-1">Package Details</div>
                <div className="text-sm text-[#0F172A]">
                  Weight: {delivery.packageDetails?.weight || 'N/A'} kg<br />
                  Dimensions: {delivery.packageDetails?.dimensions || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#64748B] mb-1">Pickup Address</div>
                <div className="text-sm text-[#0F172A]">
                  {delivery.pickupAddress?.street}, {delivery.pickupAddress?.city}, {delivery.pickupAddress?.state}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#64748B] mb-1">Delivery Address</div>
                <div className="text-sm text-[#0F172A]">
                  {delivery.deliveryAddress?.street}, {delivery.deliveryAddress?.city}, {delivery.deliveryAddress?.state}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
      <IonToast
        isOpen={showCopyToast}
        onDidDismiss={() => setShowCopyToast(false)}
        message="Package ID copied to clipboard!"
        duration={2000}
        position="bottom"
      />
    </>
  );
};

const MyDeliveries = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedDeliveryForRating, setSelectedDeliveryForRating] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showPaymentFailedModal, setShowPaymentFailedModal] = useState(false);
  const [cancelledOrder, setCancelledOrder] = useState(null);

  useEffect(() => {
    fetchDeliveries();

    // Check for pending payment and cancel order if payment not completed
    const checkPendingPayment = async () => {
      const pendingDeliveryId = getCookie('pending_payment_delivery_id');

      if (pendingDeliveryId) {
        console.log('[MyDeliveries] Found pending payment delivery:', pendingDeliveryId);

        try {
          // Cancel the delivery since payment was not completed
          await cancelDelivery(pendingDeliveryId, {
            reason: 'payment_not_completed',
            autoCancel: true
          });

          console.log('[MyDeliveries] Cancelled unpaid delivery:', pendingDeliveryId);

          // Show modal
          setCancelledOrder({
            id: pendingDeliveryId,
            trackingNumber: pendingDeliveryId
          });
          setShowPaymentFailedModal(true);

        } catch (error) {
          console.error('[MyDeliveries] Failed to cancel unpaid delivery:', error);
        } finally {
          // Clean up cookies
          deleteCookie('pending_payment_delivery_id');
          deleteCookie('pending_payment_id');
        }
      }
    };

    checkPendingPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const handleRefresh = () => {
      console.log('[MyDeliveries] Received refresh event');
      fetchDeliveries();
    };

    const handleDeliveryCreated = (event) => {
      console.log('[MyDeliveries] Delivery created:', event.detail);
      fetchDeliveries();
    };

    const handleDeliveryUpdated = (event) => {
      console.log('[MyDeliveries] Delivery updated:', event.detail);
      fetchDeliveries();
    };

    window.addEventListener('deliveries:refresh', handleRefresh);
    window.addEventListener('delivery:created', handleDeliveryCreated);
    window.addEventListener('delivery:updated', handleDeliveryUpdated);
    // Listen for pay-later requests from delivery cards
    const handlePaymentInit = async (ev) => {
      try {
        const deliveryId = ev?.detail?.deliveryId;
        if (!deliveryId) return;
        console.log('[MyDeliveries] Initializing payment for', deliveryId);

        // Find delivery object from current lists
        const all = [...activeDeliveries, ...completedDeliveries];
        const delivery = all.find(d => (d._id || d.id || d.trackingNumber) === deliveryId) || null;

        const amountRaw = delivery?.total || delivery?.price || delivery?.amount || 0;
        const amount = typeof amountRaw === 'string' ? parseFloat(amountRaw.replace(/[^0-9.-]+/g, '')) : (amountRaw || 0);

        const email = delivery?.recipientEmail || delivery?.customerEmail || (getJSONCookie && getJSONCookie('user_data')?.email) || 'customer@swiftlyxpress.com';

        // try to open popup synchronously
        let paymentWindow = null;
        try { paymentWindow = window.open('', '_blank'); if (paymentWindow) paymentWindow.document.write('<p>Preparing payment...</p>'); } catch (e) { paymentWindow = null; }

        const initJson = await initializePayment(deliveryId, {
          amount: amount,
          currency: 'NGN',
          email,
          callback_url: `${window.location.origin}/customer/payment/callback`,
          metadata: { deliveryId }
        });

        const initPayload = initJson?.data || initJson;
        const paymentObj = initPayload?.data?.payment || initPayload?.payment || initPayload?.data;
        const paymentReference = paymentObj?.reference || paymentObj?.id || paymentObj?.paymentId;
        const authorizationUrl = paymentObj?.authorizationUrl || paymentObj?.authorization_url || paymentObj?.url || paymentObj?.payment_url;

        if (deliveryId) setCookie('pending_payment_delivery_id', String(deliveryId), 1);
        if (paymentReference) setCookie('pending_payment_id', String(paymentReference), 1);

        const cleanupOnPaymentCancel = async (did) => {
          try { if (did) await cancelDelivery(did, { reason: 'payment_cancelled' }); } catch (cleanupErr) { console.warn('[MyDeliveries] cleanup failed', cleanupErr); }
          try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { }
          setToastMessage('Payment was not completed. Your booking was cancelled.');
          setShowToast(true);
        };

        if (authorizationUrl) {
          try {
            if (paymentWindow) paymentWindow.location.href = authorizationUrl;
            else window.open(authorizationUrl, '_blank');

            // monitor popup close
            const popupInterval = setInterval(() => {
              try {
                if (!paymentWindow || paymentWindow.closed) {
                  clearInterval(popupInterval);
                  const pending = getCookie('pending_payment_id');
                  if (pending) cleanupOnPaymentCancel(deliveryId);
                }
              } catch (e) { clearInterval(popupInterval); }
            }, 1000);

            return;
          } catch (navErr) {
            console.warn('[MyDeliveries] Failed to open hosted payment URL', navErr);
          }
        }

        // Fallback to inline Paystack
        if (paymentReference) {
          try { if (paymentWindow) paymentWindow.close(); } catch (e) { }
          const PaystackPop = (await import('@paystack/inline-js')).default;
          const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxx';
          const handler = PaystackPop.setup({
            key: paystackPublicKey,
            email,
            amount: (amount || 0) * 100,
            ref: paymentReference,
            onClose: function () { cleanupOnPaymentCancel(deliveryId); },
            callback: function () {
              try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { };
              try { window.location.href = '/customer/payment/callback'; } catch (e) { window.location.href = '/customer/payment/callback'; }
            }
          });
          handler.openIframe();
        }
      } catch (err) {
        console.error('[MyDeliveries] payment init error', err);
        setToastMessage(err?.message || 'Failed to initialize payment');
        setShowToast(true);
      }
    };

    window.addEventListener('payment:init', handlePaymentInit);

    return () => {
      window.removeEventListener('deliveries:refresh', handleRefresh);
      window.removeEventListener('delivery:created', handleDeliveryCreated);
      window.removeEventListener('delivery:updated', handleDeliveryUpdated);
      window.removeEventListener('payment:init', handlePaymentInit);
    };
  }, []);

  async function fetchDeliveries() {
    setLoading(true);
    setError('');
    try {
      console.log('[MyDeliveries] Fetching deliveries...');
      const res = await getCustomerDeliveries({ page, limit });
      console.log('[MyDeliveries] API response:', res);

      let items = [];

      if (Array.isArray(res)) {
        items = res;
      } else if (res?.data) {
        items = Array.isArray(res.data) ? res.data : (res.data.deliveries || res.data.items || []);
      } else if (res?.deliveries) {
        items = res.deliveries;
      } else if (res?.items) {
        items = res.items;
      } else if (res?.results) {
        items = res.results;
      }

      console.log('[MyDeliveries] Parsed items:', items);

      // Filter out cancelled orders (keep unpaid/pending so users can pay later)
      const validDeliveries = items.filter(d => {
        const status = (d.status || '').toLowerCase();

        // Exclude cancelled orders
        if (status === 'cancelled' || status === 'canceled') {
          return false;
        }

        return true;
      });

      const active = validDeliveries.filter((d) => {
        const status = d?.status?.toLowerCase() || 'pending';
        return status !== 'delivered' && status !== 'completed' && status !== 'cancelled';
      });

      const completed = validDeliveries.filter((d) => {
        const status = d?.status?.toLowerCase() || '';
        return status === 'delivered' || status === 'completed';
      });

      console.log('[MyDeliveries] Active:', active.length, 'Completed:', completed.length);

      setActiveDeliveries(active);
      setCompletedDeliveries(completed);
    } catch (err) {
      console.error('[MyDeliveries] Failed to load deliveries:', err);
      setError(err?.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-6">
            <YummyText className="text-2xl md:text-3xl font-medium text-[#0F172A] mb-2">
              My Deliveries
            </YummyText>
            <YummyText className="text-sm md:text-base text-[#4A5565]">
              View and manage all your shipments
            </YummyText>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 rounded-full w-full md:w-fit">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 md:flex-none md:px-14 px-6 py-3 md:py-2 whitespace-nowrap rounded-full text-sm font-normal transition-colors ${activeTab === 'active'
                ? 'text-[#0F172A] bg-white shadow-sm'
                : 'text-[#64748B]'
                }`}
            >
              Active ({activeDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 md:flex-none md:px-14 px-6 py-3 md:py-2 whitespace-nowrap rounded-full text-sm font-normal transition-colors ${activeTab === 'completed'
                ? 'text-[#0F172A] bg-white shadow-sm'
                : 'text-[#64748B]'
                }`}
            >
              Completed ({completedDeliveries.length})
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-6">
              <Loader message="Loading deliveries..." />
            </div>
          )}

          {/* Active Deliveries */}
          {!loading && activeTab === 'active' && (
            <div>
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl" style={sideBottomShadow}>
                  <img src="/blockicon.svg" alt="No deliveries" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-[#64748B] text-base md:text-lg mb-2">No active deliveries</p>
                  <p className="text-[#94A3B8] text-sm">Your active shipments will appear here</p>
                </div>
              ) : (
                activeDeliveries.map((delivery, index) => (
                  <DeliveryCard key={delivery._id || delivery.id || index} delivery={delivery} />
                ))
              )}
            </div>
          )}

          {/* Completed Deliveries - Mobile Cards */}
          {!loading && activeTab === 'completed' && (
            <>
              {/* Mobile View */}
              <div className="block md:hidden">
                {completedDeliveries.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl" style={sideBottomShadow}>
                    <img src="/checkicon.svg" alt="No completed" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-[#64748B] text-base mb-2">No completed deliveries</p>
                    <p className="text-[#94A3B8] text-sm">Your completed shipments will appear here</p>
                  </div>
                ) : (
                  completedDeliveries.map((delivery, index) => (
                    <MobileCompletedCard key={delivery._id || delivery.id || index} delivery={delivery} />
                  ))
                )}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-2xl p-6" style={sideBottomShadow}>
                {completedDeliveries.length === 0 ? (
                  <div className="text-center py-12">
                    <img src="/checkicon.svg" alt="No completed" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-[#64748B] text-lg mb-2">No completed deliveries</p>
                    <p className="text-[#94A3B8] text-sm">Your completed shipments will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Tracking ID</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Route</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Booked Date</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Delivered Date</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Status</th>
                          <th className="text-center py-4 px-4 text-sm font-medium text-[#0F172A]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedDeliveries.map((delivery, index) => (
                          <CompletedDeliveryRow
                            key={delivery._id || delivery.id || index}
                            delivery={delivery}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Toast */}
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMessage}
            duration={3000}
            position="top"
          />

          {/* Rating handled by global RatingModal mounted in CustomerLayout. */}

          {/* Payment Failed Modal */}
          <PaymentFailedModal
            isOpen={showPaymentFailedModal}
            onClose={() => setShowPaymentFailedModal(false)}
            orderDetails={cancelledOrder}
          />
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );

  // Handle rating submission
  async function handleSubmitRating(ratingData) {
    try {
      console.log('[MyDeliveries] Submitting rating:', ratingData);
      // Only send rating field - backend doesn't accept comment or driverId
      const response = await rateDriver(ratingData.deliveryId, {
        rating: ratingData.rating
      });

      console.log('[MyDeliveries] Rating submitted successfully:', response);

      // Update the delivery in the list to reflect rating
      setCompletedDeliveries(prev => prev.map(d => {
        if ((d._id || d.id) === ratingData.deliveryId) {
          return {
            ...d,
            rating: ratingData.rating,
            customerRating: ratingData.rating,
            hasRated: true
          };
        }
        return d;
      }));

      // Show success toast
      setToastMessage('⭐ Thank you for your feedback!');
      setShowToast(true);

      // Dispatch event to notify rider and update UI
      window.dispatchEvent(new CustomEvent('rating:submitted', {
        detail: {
          deliveryId: ratingData.deliveryId,
          rating: ratingData.rating
        }
      }));
    } catch (error) {
      console.error('[MyDeliveries] Failed to submit rating:', error);
      setToastMessage(error.message || 'Failed to submit rating');
      setShowToast(true);
    }
  }
};

export default MyDeliveries;