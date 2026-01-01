import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';
import Loader from '../../../components/Loader';
import { getDeliveryByTracking } from '../../../utils/authApi';
import BlockIcon from '../../../icons/Blockicon';
import CheckIcon from '../../../icons/Checkicon';
import LocationIcon from '../../../icons/Locationicon';
import VanIcon from '../../../icons/Vanicon';

const sideBottomShadow = {
  boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const Track = () => {
  const [trackingId, setTrackingId] = useState('');
  const [deliveryData, setDeliveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Listen for delivery updates and refresh if the current delivery changes
  useEffect(() => {
    const handleDeliveryUpdated = (event) => {
      if (deliveryData && event.detail) {
        const updatedDeliveryId = event.detail.deliveryId || event.detail.id;
        const currentDeliveryId = deliveryData._id || deliveryData.id;

        if (updatedDeliveryId === currentDeliveryId) {
          console.log('[Track] Delivery status updated, refreshing:', updatedDeliveryId);
          // Update the status in current delivery data
          setDeliveryData(prev => ({
            ...prev,
            status: event.detail.status || prev.status,
            updatedAt: new Date().toISOString()
          }));

          // Show toast notification
          setToastMsg(`✅ Status updated to: ${event.detail.status}`);
          setShowToast(true);
        }
      }
    };

    window.addEventListener('delivery:updated', handleDeliveryUpdated);
    return () => window.removeEventListener('delivery:updated', handleDeliveryUpdated);
  }, [deliveryData]);

  const handleTrack = async (e) => {
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

    } catch (err) {
      console.error('[Track] Failed to fetch delivery:', err);
      setToastMsg(err?.message || 'Tracking number not found');
      setShowToast(true);
      setDeliveryData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'delivered') return 'bg-green-500';
    if (statusLower === 'in-transit' || statusLower === 'in transit') return 'bg-blue-500';
    if (statusLower === 'picked-up' || statusLower === 'picked up') return 'bg-orange-500';
    if (statusLower === 'assigned' || statusLower === 'pending') return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'delivered') return 'bg-green-100 text-green-700';
    if (statusLower === 'in-transit' || statusLower === 'in transit') return 'bg-[#00B75A] text-[#FFFFFF]';
    if (statusLower === 'picked-up' || statusLower === 'picked up') return 'bg-orange-100 text-orange-700';
    if (statusLower === 'assigned' || statusLower === 'pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
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

  const formatTime = (dateString) => {
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
              {/* Map Placeholder */}
              <div className="bg-white rounded-2xl overflow-hidden" style={sideBottomShadow}>
                <div className="h-64 bg-gradient-to-br from-[#E5F5E5] to-[#C8E6C9] relative flex items-center justify-center">
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
                          {deliveryData.packageDetails?.weight || 'N/A'} kg
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
                          {deliveryData.recipient?.name || 'N/A'}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">Phone</span>
                        <span className="text-sm font-medium text-[#0F172A]">
                          {deliveryData.recipient?.phone || 'N/A'}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#64748B]">Email</span>
                        <span className="text-sm font-medium text-[#0F172A]">
                          {deliveryData.recipient?.email || 'N/A'}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm text-[#64748B]">Address</span>
                        <span className="text-sm font-medium text-[#0F172A] text-right max-w-[60%]">
                          {deliveryData.deliveryAddress?.street}, {deliveryData.deliveryAddress?.city}, {deliveryData.deliveryAddress?.state}
                        </span>
                      </div>
                    </div>
                  </YummyText>
                </div>
              </div>

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
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default Track;