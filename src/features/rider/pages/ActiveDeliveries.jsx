import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import TelephoneIcon from "../../../icons/Telephoneicon";
import ChatIcon from "../../../icons/Chaticon";
import MapboxMap from '../../../components/MapboxMap';
import BanIcon from '../../../icons/Banicon';
import { useDelivery } from '../../../contexts/DeliveryContext';
import { getRiderDeliveries, updateDeliveryStatus, uploadDeliveryProof } from '../../../utils/authApi';
import './ActiveDeliveries.css';

// Shadow only on left, right and bottom
const sideBottomShadow = {
  boxShadow: '0.5px 1.5px 2px rgba(0, 0, 0, 0.05), -0.5px 1.5px 2px rgba(0, 0, 0, 0.05), 0 1.5px 3px rgba(0, 0, 0, 0.07)'
};


const ActiveDeliveries = () => {
  const { activeDeliveries, updateDeliveryStatus: contextUpdateStatus } = useDelivery();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Fetch rider's active deliveries on mount
  useEffect(() => {
    fetchActiveDeliveries();

    // Listen for delivery acceptance events
    const handleDeliveryAccepted = () => {
      fetchActiveDeliveries();
    };

    // Listen for delivery status updates
    const handleDeliveryStatusChanged = () => {
      fetchActiveDeliveries();
    };

    window.addEventListener('delivery:accepted', handleDeliveryAccepted);
    window.addEventListener('delivery:statusChanged', handleDeliveryStatusChanged);

    return () => {
      window.removeEventListener('delivery:accepted', handleDeliveryAccepted);
      window.removeEventListener('delivery:statusChanged', handleDeliveryStatusChanged);
    };
  }, []);

  const fetchActiveDeliveries = async () => {
    setLoading(true);
    try {
      const response = await getRiderDeliveries(1, 10);
      console.log('[ActiveDeliveries] Fetched deliveries:', response);

      // Extract deliveries from response
      const fetchedDeliveries = response?.data?.deliveries || response?.deliveries || response?.data || [];
      setDeliveries(fetchedDeliveries);
    } catch (error) {
      console.error('[ActiveDeliveries] Failed to fetch deliveries:', error);
      setToastMsg(error.message || 'Failed to load active deliveries');
      setShowToast(true);
      // Fallback to context data
      setDeliveries(activeDeliveries || []);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    setUpdatingStatus(deliveryId);
    try {
      // Backend requires: status and currentLocation (lat/lng)
      const statusUpdate = {
        status: newStatus
      };

      // Get rider's current location (REQUIRED by backend)
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          statusUpdate.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (geoError) {
          console.error('[ActiveDeliveries] Location required but unavailable:', geoError);
          setToastMsg('Location permission required to update status');
          setShowToast(true);
          setUpdatingStatus(null);
          return;
        }
      } else {
        setToastMsg('Geolocation not supported by your browser');
        setShowToast(true);
        setUpdatingStatus(null);
        return;
      }

      const response = await updateDeliveryStatus(deliveryId, statusUpdate);
      console.log('[ActiveDeliveries] Status updated:', response);

      setToastMsg('Status updated successfully!');
      setShowToast(true);

      // Dispatch event for admin/rider components
      window.dispatchEvent(new CustomEvent('delivery:statusChanged', {
        detail: { deliveryId, newStatus }
      }));

      // Dispatch event for customer tracking pages
      window.dispatchEvent(new CustomEvent('delivery:updated', {
        detail: { deliveryId, status: newStatus }
      }));

      // Refresh deliveries
      await fetchActiveDeliveries();

      // Update context if available
      if (contextUpdateStatus) {
        contextUpdateStatus(deliveryId, newStatus);
      }
    } catch (error) {
      console.error('[ActiveDeliveries] Failed to update status:', error);

      // Better error message handling
      let errorMessage = 'Failed to update status';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        // Handle validation errors array
        const errors = error.response.data.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          errorMessage = errors.map(e => e.message || e).join(', ');
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setToastMsg(errorMessage);
      setShowToast(true);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleActionClick = (delivery) => {
    const status = (delivery.status || '').toLowerCase();
    let newStatus = 'in-transit';

    // Determine next status based on current status
    // Backend expects: [assigned, picked-up, in-transit, delivered, cancelled]
    if (status.includes('assigned') || status.includes('pending')) {
      newStatus = 'in-transit';
    } else if (status.includes('picked') || status.includes('picked-up')) {
      newStatus = 'delivered';
    } else if (status.includes('transit') || status.includes('in-transit')) {
      newStatus = 'delivered';
    }

    console.log(`[ActiveDeliveries] Action clicked for ${delivery._id || delivery.id}: ${status} → ${newStatus}`);
    handleStatusUpdate(delivery._id || delivery.id, newStatus);
  };

  const handleProofUpload = async (deliveryId, file) => {
    try {
      const formData = new FormData();
      formData.append('proof', file);

      const response = await uploadDeliveryProof(deliveryId, formData);
      console.log('[ActiveDeliveries] Proof uploaded:', response);

      setToastMsg('✅ Delivery proof uploaded successfully!');
      setShowToast(true);

      // Refresh deliveries
      await fetchActiveDeliveries();
    } catch (error) {
      console.error('[ActiveDeliveries] Failed to upload proof:', error);
      setToastMsg((error.message || 'Failed to upload proof'));
      setShowToast(true);
    }
  }; return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <YummyText>
            <div className="mb-4 py-2">
              <div className="text-3xl font-medium text-[#0F172A] mb-2">
                Active Deliveries
              </div>
              <div className="text-[#4A5565] text-[15px] font-[400]">
                Manage your ongoing deliveries
              </div>
            </div>
          </YummyText>

          {/* Deliveries List */}
          <div className="max-h-[900px] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D68F] mx-auto mb-4"></div>
                  <p className="text-[#64748B]">Loading active deliveries...</p>
                </div>
              </div>
            ) : deliveries.length > 0 ? (
              deliveries.map((delivery) => {
                // Map status to color
                const getStatusColor = (status) => {
                  const statusLower = status?.toLowerCase() || '';
                  if (statusLower.includes('picked') || statusLower.includes('transit')) return 'bg-blue-100 text-blue-600';
                  if (statusLower.includes('delivered') || statusLower.includes('completed')) return 'bg-green-100 text-green-600';
                  if (statusLower.includes('pending') || statusLower.includes('assigned')) return 'bg-orange-100 text-orange-600';
                  if (statusLower.includes('cancelled')) return 'bg-red-100 text-red-600';
                  return 'bg-gray-100 text-gray-600';
                };

                // Format status text
                const formatStatus = (status) => {
                  if (!status) return 'Unknown';
                  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                };

                // Get coordinates
                const pickupCoords = delivery.pickup?.coordinates || delivery.pickupCoords ||
                  (delivery.pickupAddress?.coordinates ? [delivery.pickupAddress.coordinates.lng, delivery.pickupAddress.coordinates.lat] : null);

                const deliveryCoords = delivery.dropoff?.coordinates || delivery.deliveryCoords || delivery.destination?.coordinates ||
                  (delivery.deliveryAddress?.coordinates ? [delivery.deliveryAddress.coordinates.lng, delivery.deliveryAddress.coordinates.lat] : null);

                const vehicleCoords = (delivery.currentLocation && [delivery.currentLocation.lng, delivery.currentLocation.lat]) ||
                  (delivery.lastKnownLocation && [delivery.lastKnownLocation.lng, delivery.lastKnownLocation.lat]) || null;

                // Get action button text based on status
                const getActionButtonText = (status) => {
                  const statusLower = status?.toLowerCase() || '';
                  if (statusLower.includes('assigned') || statusLower.includes('pending')) return 'Start Pickup';
                  if (statusLower.includes('route') && statusLower.includes('pickup')) return 'Arrived at Pickup';
                  if (statusLower.includes('picked')) return 'Start Delivery';
                  if (statusLower.includes('transit') || statusLower.includes('delivery')) return 'Complete Delivery';
                  return 'Update Status';
                };

                // Normalize address objects to strings to avoid rendering raw objects
                const rawPickupAddr = delivery.pickup?.address || delivery.pickupAddress?.address || delivery.pickupAddress;
                const rawDeliveryAddr = delivery.dropoff?.address || delivery.deliveryAddress?.address || delivery.deliveryAddress || delivery.destinationAddress;

                const formatAddr = (addr) => {
                  if (!addr) return 'Address not available';
                  if (typeof addr === 'string') return addr;
                  // addr is likely an object with street, city, state, zipCode
                  const parts = [];
                  if (addr.street) parts.push(addr.street);
                  if (addr.city) parts.push(addr.city);
                  if (addr.state) parts.push(addr.state);
                  if (addr.zipCode) parts.push(addr.zipCode);
                  const joined = parts.filter(Boolean).join(', ');
                  return joined || 'Address not available';
                };

                const pickupAddressText = formatAddr(rawPickupAddr);
                const deliveryAddressText = formatAddr(rawDeliveryAddr);

                return (
                  <DeliveryCard
                    key={delivery._id || delivery.id}
                    packageId={delivery.trackingNumber || delivery.deliveryId || delivery.id || 'N/A'}
                    status={formatStatus(delivery.status)}
                    statusColor={getStatusColor(delivery.status)}
                    distance={delivery.distance ? `${delivery.distance} km` : (delivery.distanceInKm ? `${delivery.distanceInKm} km` : 'N/A')}
                    time={delivery.estimatedTime || delivery.estimatedDuration || (delivery.estimatedTimeMinutes ? `${delivery.estimatedTimeMinutes} min` : 'N/A')}
                    price={delivery.amount ? `₦${Number(delivery.amount).toFixed(2)}` : (delivery.price ? `₦${Number(delivery.price).toFixed(2)}` : '₦0.00')}
                    pickupName={delivery.pickup?.name || delivery.pickupName || delivery.senderName || 'Pickup Location'}
                    pickupAddress={pickupAddressText}
                    pickupCoords={pickupCoords}
                    pickupBorder={(delivery.status?.toLowerCase() || '').includes('picked') ? 'border-[#E5E7EB]' : 'border-[#00D68F]'}
                    deliveryName={delivery.dropoff?.name || delivery.deliveryName || delivery.recipientName || delivery.receiverName || 'Delivery Location'}
                    deliveryAddress={deliveryAddressText}
                    deliveryCoords={deliveryCoords}
                    vehicleCoords={vehicleCoords}
                    deliveryBorder={(delivery.status?.toLowerCase() || '').includes('picked') ? 'border-[#FF9500]' : 'border-gray-200'}
                    size={delivery.packageSize || delivery.size || delivery.packageDetails?.size || 'Standard'}
                    weight={delivery.packageWeight || delivery.weight || delivery.packageDetails?.weight || 'N/A'}
                    notes={delivery.specialInstructions || delivery.notes || delivery.description || delivery.packageDescription || delivery.packageDetails?.description || 'No special instructions'}
                    actionButtonText={getActionButtonText(delivery.status)}
                    onActionClick={() => handleActionClick(delivery)}
                    isUpdating={updatingStatus === (delivery._id || delivery.id)}
                  />
                );
              })
            ) : (
              <div className="text-center py-20 rounded-2xl px-6" style={sideBottomShadow}>
                <BanIcon className="w-16 h-16 mx-auto mb-4 text-[#FF6B00]" />
                <div className="text-xl font-medium text-[#0F172A] mb-3">No Active Deliveries Yet</div>
                <div className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
                  You don't have any active deliveries at the moment. Head over to the Available Orders page to accept new delivery requests.
                </div>
                <button
                  onClick={() => window.location.href = '/rider/available-orders'}
                  className="bg-[#00B75A] hover:bg-[#00B876] text-white px-6 py-3 rounded-full transition-colors font-medium"
                >
                  View Available Orders
                </button>
              </div>
            )}
          </div>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
          />
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

const DeliveryCard = ({
  packageId,
  status,
  statusColor,
  distance,
  time,
  price,
  pickupName,
  pickupAddress,
  pickupCoords,
  pickupBorder,
  deliveryName,
  deliveryAddress,
  deliveryCoords,
  vehicleCoords,
  deliveryBorder,
  size,
  weight,
  notes,
  actionButtonText,
  onActionClick,
  isUpdating
}) => (
  <div className="bg-white rounded-2xl mb-6 overflow-hidden ml-0.5" style={sideBottomShadow}>
    {/* Header Section with Background */}
    <YummyText>
      <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] p-6">
        {/* Package ID, Status, and Price */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="text-lg font-normal text-[#0F172A]">{packageId}</div>
            <span className={`px-3 py-1 rounded-full text-xs font-normal ${statusColor}`}>
              {status}
            </span>
          </div>
          <div className="text-2xl font-normal text-[#00D68F]">{price}</div>
        </div>

        {/* Distance and Time */}
        <div className="text-base text-[#64748B] -mb-3">{distance} • Est. {time}</div>
      </div>
    </YummyText>

    {/* Main Content */}
    <div className="p-6">
      <YummyText>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Pickup Location */}
          <div className={`p-4 rounded-xl border-2 ${pickupBorder} bg-[#F9FAFB]`}>
            <div className="flex gap-3 mb-3">
              <div className="location-icon-container location-icon-pickup w-8 h-8 bg-[#00D68F] rounded-full flex items-center justify-center flex-shrink-0">
                <img src="/locationicon-white.svg" alt="Pickup" className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-[#64748B] mb-1">Pickup Location</div>
                <div className="text-sm font-[500] text-[#0A0A0A] mb-1">{pickupName}</div>
                <div className="text-xs text-[#64748B]">{pickupAddress}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors"
                style={{ border: "1px solid #E5E7EB" }}
              >
                <TelephoneIcon size={20} color="black" />
                Call
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors"
                style={{ border: "2px solid #E5E7EB" }}
              >
                <img src="/paperplane-icon.svg" alt="Navigate" className="w-4 h-4" />
                Navigate
              </button>
            </div>
          </div>

          {/* Delivery Location */}
          <div className={`p-4 rounded-xl border-2 ${deliveryBorder} ${deliveryBorder === 'border-[#FF9500]' ? 'bg-[#FFF7ED]' : 'bg-gray-50'}`}>
            <div className="flex gap-3 mb-3">
              <div className="location-icon-container location-icon-delivery w-8 h-8 bg-[#FF9500] rounded-full flex items-center justify-center flex-shrink-0">
                <img src="/location-orange.svg" alt="Delivery" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div>
                <div className="text-xs text-[#64748B] mb-1">Delivery Location</div>
                <div className="text-sm font-[500] text-[#0A0A0A] mb-1">{deliveryName}</div>
                <div className="text-xs text-[#64748B]">{deliveryAddress}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors"
                style={{ border: "2px solid #E5E7EB" }}
              >
                <TelephoneIcon size={20} color="black" />
                Call
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors"
                style={{ border: "2px solid #E5E7EB" }}
              >
                <ChatIcon size={20} color="black" />
                Message
              </button>
            </div>
          </div>
        </div>
      </YummyText>

      {/* Package Details with Background */}
      <YummyText>
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="text-sm font-medium text-[#0F172A] mb-3">Package Details</div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-[#64748B] mb-1">Size</div>
              <div className="text-sm text-[#0F172A] font-medium">{size}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">Weight</div>
              <div className="text-sm text-[#0F172A] font-medium">{weight}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">Notes</div>
              <div className="text-sm text-[#0F172A] font-medium">{notes}</div>
            </div>
          </div>
        </div>
      </YummyText>

      {/* Map Section */}
      <div className="mb-4 w-full">
        <MapboxMap
          pickupCoords={pickupCoords}
          deliveryCoords={deliveryCoords}
          height="300px"
          showRoute={true}
          animateVehicle={true}
          packageId={packageId}
          vehicleCoords={vehicleCoords}
        />
      </div>

      {/* Action Buttons */}
      <YummyText>
        <div className="flex gap-3">
          <button
            onClick={onActionClick}
            disabled={isUpdating}
            className="flex-1 bg-[#00B75A] hover:bg-[#00B876] disabled:bg-gray-400 text-white py-2 rounded-xl transition-colors font-[300]"
          >
            {isUpdating ? 'Updating...' : actionButtonText}
          </button>
          <button className="px-6 py-2 bg-white hover:bg-gray-50 rounded-xl transition-colors text-[#0F172A] font-[300]"
            style={{ border: "1px solid #0000001A" }}
          >
            Report Issue
          </button>
        </div>
      </YummyText>
    </div>
  </div>
);



export default ActiveDeliveries;