import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonToast, IonModal } from '@ionic/react';
import { eye, eyeOff, arrowForward, copy } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import CustomerLayout from '../components/CustomerLayout';
import PaymentFailedModal from '../components/PaymentFailedModal';
import { YummyText } from '../../../components/YummyText';
import Loader from '../../../components/Loader';
import DeliveryChat from '../../../components/DeliveryChat';
import { getCustomerDeliveries, rateDriver, cancelDelivery, initializePayment, getDeliveryReceiptPdf, verifyPaymentByReference } from '../../../utils/authApi';

import { getCookie, deleteCookie, setCookie, getJSONCookie } from '../../../utils/cookies';
import { playNotificationSound } from '../../../utils/notificationSound';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

// Helper function to get status styling
const getStatusStyle = (status) =>
{
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
const getProgress = (status) =>
{
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

// Helper function to format date with time
const formatDate = (dateString) =>
{
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr}, ${timeStr}`;
  } catch (e) {
    return dateString;
  }
};

const DeliveryCard = ({ delivery, onCancelDelivery }) =>
{
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const statusStyle = getStatusStyle(delivery.status);
  const progress = getProgress(delivery.status);
  const paymentStatus = (delivery.paymentStatus || delivery.payment?.status || '').toLowerCase();

  const handleToggleDetails = () =>
  {
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

  const handleTrack = (e) =>
  {
    e.stopPropagation();
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    if (packageId) {
      history.push(`/customer/track/${packageId}`);
    }
  };

  const handleCardClick = () =>
  {
    handleToggleDetails();
  };

  const handleCopyPackageId = async () =>
  {
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    try {
      await navigator.clipboard.writeText(packageId);
      setShowCopyToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl p-4 md:p-6 mb-4 relative cursor-pointer hover:shadow-lg transition-shadow"
      style={sideBottomShadow}
      onClick={handleCardClick}
    >
      {/* Mobile: Make Payment / Pay online instead (any unpaid, not cancelled) */}
      {(paymentStatus === 'pending' || paymentStatus === 'unpaid' || paymentStatus === 'failed') &&
        delivery.status?.toLowerCase() !== 'cancelled' &&
        delivery.status?.toLowerCase() !== 'canceled' && (() =>
        {
          const method = (delivery.payment?.method || delivery.paymentMethod || delivery.payment?.paymentMethod || delivery.method || '').toString().toLowerCase();
          const isCod = method === 'cash' || method === 'cash_on_delivery' || method === 'cod';
          return (
            <button
              onClick={(e) =>
              {
                e.stopPropagation();
                const deliveryId = delivery._id || delivery.id || delivery.trackingNumber;
                window.dispatchEvent(new CustomEvent('payment:init', { detail: { deliveryId } }));
              }}
              className="md:hidden absolute top-3 right-3 px-3 py-1 rounded-full border border-black bg-white text-black text-xs font-medium z-20"
              aria-label={isCod ? 'Pay online instead' : 'Make Payment'}
              style={{ borderStyle: 'solid' }}
            >
              <YummyText className="text-xs font-medium">{isCod ? 'Pay online instead' : 'Make Payment'}</YummyText>
            </button>
          );
        })()}
      {/* Mobile & Desktop Layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          {/* Package Details */}
          <div className="flex-1 min-w-0 pr-24 md:pr-0">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
              <YummyText className="text-base md:text-lg font-medium text-[#0F172A] truncate">
                {delivery.packageDetails?.description || 'Package'}
              </YummyText>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color} w-fit`}>
                  {delivery.status || 'Pending'}
                </span>

                {/* Ride type tag */}
                {(delivery.deliveryType === 'smart_ride' || delivery.smartRide === true) ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#00D68F] text-white">⚡ SmartRide</span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-normal bg-blue-100 text-blue-700">Express</span>
                )}

                {/* Payment tag on customer side: show Paid, Cash, or nothing (Make Payment button will show for unpaid online/bank) */}
                {paymentStatus === 'paid' && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Paid</span>
                )}
                {paymentStatus !== 'paid' && (() =>
                {
                  const method = (delivery.payment?.method || delivery.paymentMethod || delivery.payment?.paymentMethod || delivery.method || '').toString().toLowerCase().trim();
                  return (method === 'cash' || method === 'cash_on_delivery' || method === 'cod') ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white text-green-600 border border-gray-200">Cash</span>
                  ) : null;
                })()}

                {/* Desktop/Tablet: show Make Payment / Pay online instead when unpaid (any method, not cancelled) */}
                {(paymentStatus === 'pending' || paymentStatus === 'unpaid' || paymentStatus === 'failed') &&
                  delivery.status?.toLowerCase() !== 'cancelled' &&
                  delivery.status?.toLowerCase() !== 'canceled' && (() =>
                  {
                    const method = (delivery.payment?.method || delivery.paymentMethod || delivery.payment?.paymentMethod || delivery.method || '').toString().toLowerCase().trim();
                    const isCod = method === 'cash' || method === 'cash_on_delivery' || method === 'cod';
                    return (
                      <button
                        onClick={(e) =>
                        {
                          e.stopPropagation();
                          const deliveryId = delivery._id || delivery.id || delivery.trackingNumber;
                          window.dispatchEvent(new CustomEvent('payment:init', { detail: { deliveryId } }));
                        }}
                        className="hidden md:inline-flex px-3 py-1 rounded-full text-xs font-medium border-2 border-black bg-white text-black z-10"
                        style={{ borderStyle: 'solid' }}
                      >
                        <YummyText className="text-xs font-medium">{isCod ? 'Pay online instead' : 'Make Payment'}</YummyText>
                      </button>
                    );
                  })()}
              </div>
            </div>

            <YummyText>
              <div className="text-xs text-[#4A5565] mb-3">
                Booked: {formatDate(delivery.createdAt || delivery.bookedDate)}
              </div>
            </YummyText>

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

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Cancel Button - Show for pending, assigned, or in-transit orders */}
          {(delivery.status === 'pending' || delivery.status === 'assigned' || delivery.status === 'in-transit' || delivery.status === 'picked-up') && (
            <button
              onClick={(e) =>
              {
                e.stopPropagation();
                onCancelDelivery(delivery);
              }}
              className="flex items-center justify-center gap-2 text-sm text-red-600 shadow-sm px-4 py-2 rounded-xl hover:text-red-700 hover:border-red-700 transition-colors w-full md:w-auto"
              style={{ border: '1.5px solid #EF444480' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <YummyText>Cancel</YummyText>
            </button>
          )}

          {/* Track Button */}
          <button
            onClick={handleTrack}
            className="flex items-center justify-center gap-2 text-sm text-[#64748B] shadow-sm px-4 py-2 rounded-xl hover:text-[#0F172A] hover:border-gray-800 transition-colors w-full md:w-auto"
            style={{ border: '1.5px solid #0000001A' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <YummyText>Track</YummyText>
          </button>
        </div>
      </div>

      {/* Expanded Details - stopPropagation so clicking chat/inputs doesn't close the card */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
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
            {/* Package Images — show all */}
            {(() =>
            {
              const nonEmpty = (v) => Array.isArray(v) ? v.length > 0 : Boolean(v);
              const raw =
                (nonEmpty(delivery.packageDetails?.images) && delivery.packageDetails.images) ||
                (nonEmpty(delivery.packageDetails?.image) && delivery.packageDetails.image) ||
                (nonEmpty(delivery.images) && delivery.images) ||
                (nonEmpty(delivery.image) && delivery.image) ||
                (nonEmpty(delivery.packageImage) && delivery.packageImage) ||
                null;
              const imgs = !raw ? [] : (Array.isArray(raw) ? raw : [raw]).filter(Boolean);

              if (imgs.length === 0) return null;
              return (
                <div>
                  <div className="text-xs font-medium text-[#64748B] mb-2">
                    Package Images {imgs.length > 1 && <span className="text-[#00B75A]">({imgs.length})</span>}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {imgs.map((url, i) => (
                      <div key={i} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img
                          src={url}
                          alt={`Package ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

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
            <div className="md:col-span-2 mt-3">
              <div className="text-xs font-medium text-[#64748B] mb-2">Chat with rider</div>
              <DeliveryChat
                deliveryId={delivery._id || delivery.id}
                currentUserRole="customer"
                canSend={!!delivery.driver}
                className="rounded-xl border border-gray-200 overflow-hidden"
                maxHeight="240px"
              />
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
const MobileCompletedCard = ({ delivery }) =>
{
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const paymentStatus = (delivery.paymentStatus || delivery.payment?.status || '').toLowerCase();

  const handleToggleDetails = () =>
  {
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

  const handleTrack = (e) =>
  {
    e.stopPropagation();
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    if (packageId) {
      history.push(`/customer/track/${packageId}`);
    }
  };

  const handleDownload = (e) =>
  {
    e.stopPropagation();

    // Create receipt/invoice content
    const receiptContent = `
=======================================
       SWIFTLY EXPRESS RECEIPT
=======================================

Tracking ID: ${delivery.trackingNumber || delivery.id || 'N/A'}
Package: ${delivery.packageDetails?.description || 'Package'}

Pickup Address:
${delivery.pickupAddress?.street || ''}
${delivery.pickupAddress?.city || ''}, ${delivery.pickupAddress?.state || ''}

Delivery Address:
${delivery.deliveryAddress?.street || ''}
${delivery.deliveryAddress?.city || ''}, ${delivery.deliveryAddress?.state || ''}

Booked Date: ${formatDate(delivery.createdAt || delivery.bookedDate)}
Delivered Date: ${formatDate(delivery.deliveredAt || delivery.deliveredDate)}

Status: ${delivery.status || 'Delivered'}
Amount: ₦${delivery.amount || delivery.price || delivery.total || '0.00'}

=======================================
    Thank you for using Swiftly!
=======================================
    `;

    // Create blob and download
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swiftly-receipt-${delivery.trackingNumber || delivery.id || 'delivery'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async (e) =>
  {
    e.stopPropagation();
    const deliveryId = delivery._id || delivery.id;
    if (!deliveryId) return;
    setDownloadingPdf(true);
    try {
      const blob = await getDeliveryReceiptPdf(deliveryId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${delivery.trackingNumber || deliveryId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download receipt PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCardClick = () =>
  {
    handleToggleDetails();
  };

  const handleCopyPackageId = async () =>
  {
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    try {
      await navigator.clipboard.writeText(packageId);
      setShowCopyToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 relative cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleCardClick}
    >
      {(paymentStatus === 'pending' || paymentStatus === 'unpaid' || paymentStatus === 'failed') &&
        delivery.status?.toLowerCase() !== 'cancelled' &&
        delivery.status?.toLowerCase() !== 'canceled' && (() =>
        {
          const method = (delivery.payment?.method || delivery.paymentMethod || delivery.payment?.paymentMethod || delivery.method || '').toString().toLowerCase();
          const isCod = method === 'cash' || method === 'cash_on_delivery' || method === 'cod';
          return (
            <button
              onClick={(e) =>
              {
                e.stopPropagation();
                const deliveryId = delivery._id || delivery.id || delivery.trackingNumber;
                window.dispatchEvent(new CustomEvent('payment:init', { detail: { deliveryId } }));
              }}
              className="md:hidden absolute top-3 right-3 px-3 py-1 rounded-full border-2 border-black bg-white text-black text-xs font-medium z-20"
              aria-label={isCod ? 'Pay online instead' : 'Make Payment'}
              style={{ borderStyle: 'solid' }}
            >
              <YummyText className="text-xs font-medium">{isCod ? 'Pay online instead' : 'Make Payment'}</YummyText>
            </button>
          );
        })()}
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
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
            {delivery.status || 'Delivered'}
          </span>
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
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={handleTrack}
                className="flex items-center justify-center gap-2 text-sm text-[#64748B] shadow-sm px-4 py-2 rounded-xl hover:text-[#0F172A] hover:border-gray-800 transition-colors"
                style={{ border: '1.5px solid #0000001A' }}
              >
                <YummyText>Track</YummyText>
              </button>
              {paymentStatus === 'paid' && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center justify-center gap-2 text-sm text-[#64748B] shadow-sm px-4 py-2 rounded-xl hover:text-[#0F172A] hover:border-gray-800 transition-colors disabled:opacity-50"
                  style={{ border: '1.5px solid #0000001A' }}
                >
                  <YummyText>{downloadingPdf ? 'Downloading…' : 'Download receipt (PDF)'}</YummyText>
                </button>
              )}
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
const CompletedDeliveryRow = ({ delivery, isCancelled = false }) =>
{
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const paymentStatus = (delivery.paymentStatus || delivery.payment?.status || '').toLowerCase();
  const hasRated = delivery.rating || delivery.customerRating || delivery.hasRated;

  const handleTrack = (e) =>
  {
    e.stopPropagation();
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    if (packageId) {
      history.push(`/customer/track/${packageId}`);
    }
  };

  const handleDownload = (e) =>
  {
    e.stopPropagation();

    // Create receipt/invoice content
    const receiptContent = `
=======================================
       SWIFTLY EXPRESS RECEIPT
=======================================

Tracking ID: ${delivery.trackingNumber || delivery.id || 'N/A'}
Package: ${delivery.packageDetails?.description || 'Package'}

Pickup Address:
${delivery.pickupAddress?.street || ''}
${delivery.pickupAddress?.city || ''}, ${delivery.pickupAddress?.state || ''}

Delivery Address:
${delivery.deliveryAddress?.street || ''}
${delivery.deliveryAddress?.city || ''}, ${delivery.deliveryAddress?.state || ''}

Booked Date: ${formatDate(delivery.createdAt || delivery.bookedDate)}
${isCancelled ? `Cancelled Date: ${formatDate(delivery.cancelledAt || delivery.updatedAt)}` : `Delivered Date: ${formatDate(delivery.deliveredAt || delivery.deliveredDate)}`}

Status: ${delivery.status || (isCancelled ? 'Cancelled' : 'Delivered')}
Amount: ₦${delivery.amount || delivery.price || delivery.total || '0.00'}

=======================================
    Thank you for using Swiftly!
=======================================
    `;

    // Create blob and download
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swiftly-receipt-${delivery.trackingNumber || delivery.id || 'delivery'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleToggleDetails = () =>
  {
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

  const handleCopyPackageId = async () =>
  {
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
      <tr className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={handleToggleDetails}>
        <td className="py-4 px-4 text-sm font-medium text-[#0A0A0A]">
          {delivery.packageDetails?.description || 'Package'}
        </td>
        <td className="py-4 px-4 text-sm text-[#0A0A0A]">
          {formatDate(delivery.createdAt || delivery.bookedDate)}
        </td>
        <td className="py-4 px-4 text-sm text-[#0A0A0A]">
          {isCancelled
            ? formatDate(delivery.cancelledAt || delivery.updatedAt)
            : formatDate(delivery.deliveredAt || delivery.deliveredDate)
          }
        </td>
        <td className="py-4 px-4">
          <span className={`px-3 py-1 ${isCancelled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} rounded-full text-xs font-medium`}>
            {delivery.status || (isCancelled ? 'Cancelled' : 'Delivered')}
          </span>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center justify-center gap-3">
            {hasRated && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                ⭐ {delivery.rating || delivery.customerRating}
              </span>
            )}
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-gray-50">
          <td colSpan="5" className="py-4 px-4">
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
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={handleTrack}
                className="flex items-center justify-center gap-2 text-sm text-[#64748B] shadow-sm px-4 py-2 rounded-xl hover:text-[#0F172A] hover:border-gray-800 transition-colors"
                style={{ border: '1.5px solid #0000001A' }}
              >
                <YummyText>Track</YummyText>
              </button>
              {paymentStatus === 'paid' && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center justify-center gap-2 text-sm text-[#64748B] shadow-sm px-4 py-2 rounded-xl hover:text-[#0F172A] hover:border-gray-800 transition-colors disabled:opacity-50"
                  style={{ border: '1.5px solid #0000001A' }}
                >
                  <YummyText>{downloadingPdf ? 'Downloading…' : 'Download receipt (PDF)'}</YummyText>
                </button>
              )}
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

const MyDeliveries = () =>
{
  const [activeTab, setActiveTab] = useState('active');
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [cancelledDeliveries, setCancelledDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedDeliveryForRating, setSelectedDeliveryForRating] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showPaymentFailedModal, setShowPaymentFailedModal] = useState(false);
  const [cancelledOrder, setCancelledOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [deliveryToCancel, setDeliveryToCancel] = useState(null);

  useEffect(() =>
  {
    fetchDeliveries();

    // Check for pending payment and cancel order if payment not completed
    const checkPendingPayment = async () =>
    {
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

    // Refresh deliveries when user returns to the page (e.g., after payment)
    const handleVisibilityChange = () =>
    {
      if (!document.hidden) {
        console.log('[MyDeliveries] Page became visible, refreshing deliveries');
        fetchDeliveries();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () =>
    {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() =>
  {
    const handleRefresh = () =>
    {
      console.log('[MyDeliveries] Received refresh event');
      fetchDeliveries();
    };

    const handleDeliveryCreated = (event) =>
    {
      console.log('[MyDeliveries] Delivery created:', event.detail);
      fetchDeliveries();
    };

    const handleDeliveryUpdated = async (event) =>
    {
      console.log('[MyDeliveries] Delivery updated:', event.detail);

      // Extract status from event detail
      const eventDetail = event.detail || {};
      const status = (eventDetail.status || eventDetail.newStatus || '').toLowerCase();
      const deliveryId = eventDetail.deliveryId || eventDetail.id;

      if (status === 'delivered' || status === 'completed') {
        console.log('[MyDeliveries] 🔔 Delivery completed! Playing notification sound');
        // Play notification sound for delivery completion
        playNotificationSound();

        // Refresh deliveries first to get latest data
        const allDeliveries = await fetchDeliveries();

        // Find the delivery object to check if already rated and show modal
        setTimeout(() =>
        {
          const completedDelivery = allDeliveries.find(d =>
            (d._id === deliveryId || d.id === deliveryId)
          );

          if (completedDelivery) {
            const hasRated = completedDelivery.rating || completedDelivery.customerRating || completedDelivery.hasRated;

            if (!hasRated) {
              console.log('[MyDeliveries] ⭐ Showing rating modal for completed delivery:', completedDelivery._id || completedDelivery.id);
              console.log('[MyDeliveries] 🚀 Dispatching rating:show event!', completedDelivery);
              window.dispatchEvent(new CustomEvent('rating:show', {
                detail: completedDelivery
              }));
            } else {
              console.log('[MyDeliveries] Delivery already rated, skipping modal');
            }
          }
        }, 1500); // 1.5 second delay to let the user see the completion notification
      } else {
        // For non-completed status updates, just refresh
        fetchDeliveries();
      }
    };

    const handlePaymentCompleted = (event) =>
    {
      console.log('[MyDeliveries] Payment completed:', event.detail);
      // Refresh deliveries to show updated payment status
      fetchDeliveries();
    };

    window.addEventListener('deliveries:refresh', handleRefresh);
    window.addEventListener('delivery:created', handleDeliveryCreated);
    window.addEventListener('delivery:updated', handleDeliveryUpdated);
    window.addEventListener('payment:completed', handlePaymentCompleted);
    // Listen for pay-later requests from delivery cards
    const handlePaymentInit = async (ev) =>
    {
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

        const cleanupOnPaymentCancel = async (did) =>
        {
          try {
            // Don't cancel the booking - just clear payment cookies and notify user
            console.log('[MyDeliveries] Payment window closed without completion for delivery:', did);
          } catch (cleanupErr) { console.warn('[MyDeliveries] cleanup failed', cleanupErr); }
          try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { }
          setToastMessage('Payment completed.');
          setShowToast(true);
        };

        if (authorizationUrl) {
          try {
            if (paymentWindow) paymentWindow.location.href = authorizationUrl;
            else window.open(authorizationUrl, '_blank');

            // monitor popup close
            const popupInterval = setInterval(async () =>
            {
              try {
                if (!paymentWindow || paymentWindow.closed) {
                  clearInterval(popupInterval);

                  // Wait for PaymentSuccess page to finish cleanup before we check
                  await new Promise(r => setTimeout(r, 1800));

                  const pendingRef = getCookie('pending_payment_id');
                  const pendingDel = getCookie('pending_payment_delivery_id');
                  console.log('[MyDeliveries] Popup closed. pendingRef:', pendingRef, 'pendingDel:', pendingDel);

                  if (pendingRef) {
                    // Cookie still there means user may have abandoned — but verify anyway
                    try {
                      await verifyPaymentByReference(pendingRef);
                      deleteCookie('pending_payment_id');
                      deleteCookie('pending_payment_delivery_id');
                    } catch (ve) {
                      console.warn('[MyDeliveries] Post-popup verify failed:', ve?.response?.status, ve?.message);
                      deleteCookie('pending_payment_id');
                      deleteCookie('pending_payment_delivery_id');
                    }
                  }

                  // Always refresh the list regardless
                  await fetchDeliveries();
                  window.dispatchEvent(new CustomEvent('payment:completed', { detail: { deliveryId: pendingDel } }));
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
            callback: function ()
            {
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

    return () =>
    {
      window.removeEventListener('deliveries:refresh', handleRefresh);
      window.removeEventListener('delivery:created', handleDeliveryCreated);
      window.removeEventListener('delivery:updated', handleDeliveryUpdated);
      window.removeEventListener('payment:completed', handlePaymentCompleted);
      window.removeEventListener('payment:init', handlePaymentInit);
    };
  }, []);

  async function fetchDeliveries()
  {
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

      // Keep all deliveries (including cancelled) so users can see paid/cancelled orders
      const validDeliveries = Array.isArray(items) ? items : [];

      const active = validDeliveries.filter((d) =>
      {
        const status = d?.status?.toLowerCase() || 'pending';
        // Exclude delivered, completed, cancelled, and canceled from active
        return status !== 'delivered' && status !== 'completed' && status !== 'cancelled' && status !== 'canceled';
      });

      const completed = validDeliveries.filter((d) =>
      {
        const status = d?.status?.toLowerCase() || '';
        return status === 'delivered' || status === 'completed';
      });

      const cancelled = validDeliveries.filter((d) =>
      {
        const status = d?.status?.toLowerCase() || '';
        return status === 'cancelled' || status === 'canceled';
      });

      console.log('[MyDeliveries] Active:', active.length, 'Completed:', completed.length, 'Cancelled:', cancelled.length);

      setActiveDeliveries(active);
      setCompletedDeliveries(completed);
      setCancelledDeliveries(cancelled);

      return validDeliveries; // Return all deliveries
    } catch (err) {
      console.error('[MyDeliveries] Failed to load deliveries:', err);
      setError(err?.message || 'Failed to load deliveries');
      return []; // Return empty array on error
    } finally {
      setLoading(false);
    }
  }

  // Show cancel confirmation modal
  function handleCancelDelivery(delivery)
  {
    setDeliveryToCancel(delivery);
    setShowCancelModal(true);
  }

  // Confirm and execute cancellation
  async function confirmCancelDelivery()
  {
    if (!deliveryToCancel) return;

    const deliveryId = deliveryToCancel._id || deliveryToCancel.id;

    try {
      console.log('[MyDeliveries] Cancelling delivery:', deliveryId);

      // Close modal first
      setShowCancelModal(false);

      // Optimistically update UI
      setActiveDeliveries(prev =>
        prev.map(d => (d._id === deliveryId || d.id === deliveryId)
          ? { ...d, status: 'cancelled' }
          : d
        )
      );

      // Call cancel API
      await cancelDelivery(deliveryId, {
        reason: 'customer_request',
        cancelledBy: 'customer'
      });

      // Dispatch event to notify rider immediately
      window.dispatchEvent(new CustomEvent('delivery:cancelled', {
        detail: {
          deliveryId,
          status: 'cancelled',
          cancelledBy: 'customer',
          timestamp: new Date().toISOString()
        }
      }));

      // Show success message
      setToastMessage('✅ Order cancelled successfully');
      setShowToast(true);

      // Refresh deliveries from backend
      await fetchDeliveries();

      console.log('[MyDeliveries] ✅ Delivery cancelled and rider notified');
    } catch (err) {
      console.error('[MyDeliveries] Failed to cancel delivery:', err);
      setToastMessage(err?.message || 'Failed to cancel delivery');
      setShowToast(true);

      // Revert optimistic update on error
      await fetchDeliveries();
    } finally {
      setDeliveryToCancel(null);
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
              className={`flex-1 md:flex-none md:px-10 px-4 py-3 md:py-2 whitespace-nowrap rounded-full text-sm font-normal transition-colors ${activeTab === 'active'
                ? 'text-[#0F172A] bg-white shadow-sm'
                : 'text-[#64748B]'
                }`}
            >
              Active ({activeDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 md:flex-none md:px-10 px-4 py-3 md:py-2 whitespace-nowrap rounded-full text-sm font-normal transition-colors ${activeTab === 'completed'
                ? 'text-[#0F172A] bg-white shadow-sm'
                : 'text-[#64748B]'
                }`}
            >
              Completed ({completedDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`flex-1 md:flex-none md:px-10 px-4 py-3 md:py-2 whitespace-nowrap rounded-full text-sm font-normal transition-colors ${activeTab === 'cancelled'
                ? 'text-[#0F172A] bg-white shadow-sm'
                : 'text-[#64748B]'
                }`}
            >
              Cancelled ({cancelledDeliveries.length})
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
                  <DeliveryCard
                    key={delivery._id || delivery.id || index}
                    delivery={delivery}
                    onCancelDelivery={handleCancelDelivery}
                  />
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
              <YummyText>
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
                            <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Booked Date</th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Delivered Date</th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Status</th>
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
              </YummyText>
            </>
          )}

          {/* Cancelled Deliveries */}
          {!loading && activeTab === 'cancelled' && (
            <>
              {/* Mobile View */}
              <div className="block md:hidden">
                {cancelledDeliveries.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl" style={sideBottomShadow}>
                    <img src="/blockicon.svg" alt="No cancelled" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-[#64748B] text-base mb-2">No cancelled deliveries</p>
                    <p className="text-[#94A3B8] text-sm">Your cancelled orders will appear here</p>
                  </div>
                ) : (
                  cancelledDeliveries.map((delivery, index) => (
                    <DeliveryCard
                      key={delivery._id || delivery.id || index}
                      delivery={delivery}
                      onCancelDelivery={handleCancelDelivery}
                    />
                  ))
                )}
              </div>

              {/* Desktop Table */}
              <YummyText>
                <div className="hidden md:block bg-white rounded-2xl p-6" style={sideBottomShadow}>
                  {cancelledDeliveries.length === 0 ? (
                    <div className="text-center py-12">
                      <img src="/blockicon.svg" alt="No cancelled" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-[#64748B] text-lg mb-2">No cancelled deliveries</p>
                      <p className="text-[#94A3B8] text-sm">Your cancelled orders will appear here</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Tracking ID</th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Booked Date</th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Cancelled Date</th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cancelledDeliveries.map((delivery, index) => (
                            <CompletedDeliveryRow
                              key={delivery._id || delivery.id || index}
                              delivery={delivery}
                              isCancelled={true}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </YummyText>
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

          {/* Cancel Confirmation Modal */}
          <IonModal
            isOpen={showCancelModal}
            onDidDismiss={() =>
            {
              setShowCancelModal(false);
              setDeliveryToCancel(null);
            }}
            className="cancel-confirmation-modal"
            style={{
              '--background': 'rgba(0, 0, 0, 0.4)',
              '--backdrop-filter': 'blur(8px)'
            }}
          >
            <div
              className="rounded-2xl p-6 max-w-md mx-auto my-auto border"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(254, 226, 226, 0.8)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <YummyText className="text-xl font-semibold text-[#0F172A] text-center mb-2">
                Cancel Order?
              </YummyText>

              {/* Description */}
              <YummyText className="text-sm text-[#64748B] text-center mb-6">
                Are you sure you want to cancel this delivery?
                {deliveryToCancel?.packageDetails?.description && (
                  <span className="block mt-2 font-medium text-[#0F172A]">
                    {deliveryToCancel.packageDetails.description}
                  </span>
                )}
                <span className="block mt-2 text-xs">
                  {deliveryToCancel?.status === 'assigned' || deliveryToCancel?.status === 'picked-up' || deliveryToCancel?.status === 'in-transit'
                    ? 'Your rider will be notified immediately.'
                    : 'This action cannot be undone.'}
                </span>
              </YummyText>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() =>
                  {
                    setShowCancelModal(false);
                    setDeliveryToCancel(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-[#64748B] transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'}
                >
                  <YummyText>Keep Order</YummyText>
                </button>
                <button
                  onClick={confirmCancelDelivery}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all"
                  style={{
                    background: 'rgba(220, 38, 38, 0.9)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)'}
                >
                  <YummyText>Yes, Cancel</YummyText>
                </button>
              </div>
            </div>
          </IonModal>
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );

  // Handle rating submission
  async function handleSubmitRating(ratingData)
  {
    try {
      console.log('[MyDeliveries] Submitting rating:', ratingData);
      // Only send rating field - backend doesn't accept comment or driverId
      const response = await rateDriver(ratingData.deliveryId, {
        rating: ratingData.rating
      });

      console.log('[MyDeliveries] Rating submitted successfully:', response);

      // Update the delivery in the list to reflect rating
      setCompletedDeliveries(prev => prev.map(d =>
      {
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