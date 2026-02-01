import React, { useState, useEffect, useCallback } from 'react';
import { IonContent, IonPage, IonToast, IonIcon } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import TelephoneIcon from "../../../icons/Telephoneicon";
import ChatIcon from "../../../icons/Chaticon";
import TrackingMap from '../../../components/TrackingMap';
import ExpressDeliveryChat from '../../../components/DeliveryChat';
import SmartRideDeliveryChat from '../../smartride-booking/DeliveryChat';
import BanIcon from '../../../icons/Banicon';
import { copyOutline } from 'ionicons/icons';
import { useDelivery } from '../../../contexts/DeliveryContext';
import { getRiderDeliveries, updateDeliveryStatus, uploadDeliveryProof } from '../../../utils/authApi';
import socketService from '../../../services/socket.service';
import './ActiveDeliveries.css';

// Shadow only on left, right and bottom
const sideBottomShadow = {
  boxShadow: '0.5px 1.5px 2px rgba(0, 0, 0, 0.05), -0.5px 1.5px 2px rgba(0, 0, 0, 0.05), 0 1.5px 3px rgba(0, 0, 0, 0.07)'
};

// Helper: robustly extract a phone number from various delivery shapes,
// prioritizing booking form fields but falling back to scanning nested objects.
const extractPhone = (delivery, role = 'pickup') => {
  if (!delivery) {
    console.warn('[extractPhone] No delivery object provided');
    return null;
  }

  console.log('[extractPhone] Extracting phone for role:', role);

  // Helper to resolve dotted paths safely
  const getNestedValue = (obj, path) => {
    try {
      const parts = path.split('.');
      let cur = obj;
      for (const p of parts) {
        if (!cur) return null;
        cur = cur[p];
      }
      return cur;
    } catch (e) {
      return null;
    }
  };

  // Candidate paths that commonly store the form values or booking payload
  const candidatePaths = [
    'senderPhone', 'senderPhoneNumber', 'recipientPhone', 'recipientPhoneNumber',
    'pickupPhone', 'deliveryPhone', 'fromPhone', 'toPhone',
    // common containers
    'order.senderPhone', 'order.recipientPhone', 'booking.senderPhone', 'booking.recipientPhone',
    'data.senderPhone', 'data.recipientPhone', 'payload.senderPhone', 'payload.recipientPhone',
    'attributes.senderPhone', 'attributes.recipientPhone', 'meta.senderPhone', 'meta.recipientPhone',
    // nested sender/recipient objects
    'sender.phone', 'sender.phoneNumber', 'sender.contact', 'recipient.phone', 'recipient.phoneNumber', 'recipient.contact',
    'pickup.phone', 'pickup.phoneNumber', 'dropoff.phone', 'dropoff.phoneNumber', 'deliveryAddress.phone', 'pickupAddress.phone'
  ];

  // Strongly prioritized exact paths (prefer these — they match where the booking form writes values)
  const prioritizedPickup = [
    'senderPhone', 'data.senderPhone', 'payload.senderPhone', 'order.senderPhone', 'booking.senderPhone', 'attributes.senderPhone', 'meta.senderPhone',
    'sender.phone', 'sender.phoneNumber', 'pickup.phone', 'pickup.phoneNumber', 'pickupPhone'
  ];
  const prioritizedDelivery = [
    'recipientPhone', 'data.recipientPhone', 'payload.recipientPhone', 'order.recipientPhone', 'booking.recipientPhone', 'attributes.recipientPhone', 'meta.recipientPhone',
    'recipient.phone', 'recipient.phoneNumber', 'dropoff.phone', 'dropoff.phoneNumber', 'deliveryPhone'
  ];

  const tryPaths = (paths) => {
    for (const p of paths) {
      const v = getNestedValue(delivery, p);
      if (v) {
        const s = String(v).trim();
        if (/[0-9]/.test(s)) {
          console.log(`[extractPhone] Found phone at path '${p}':`, s);
          return s;
        }
      }
    }
    return null;
  };

  // Prefer prioritized lists first depending on role
  if (role === 'pickup') {
    const p = tryPaths(prioritizedPickup);
    if (p) return p;
  } else {
    const p = tryPaths(prioritizedDelivery);
    if (p) return p;
  }

  // Check other candidate paths if prioritized ones didn't yield a result
  for (const p of candidatePaths) {
    const v = getNestedValue(delivery, p);
    if (v) {
      const s = String(v).trim();
      if (/[0-9]/.test(s)) {
        console.log(`[extractPhone] Found phone at candidate path '${p}':`, s);
        return s;
      }
    }
  }

  // Prefer sender/recipient depending on role if still not found
  if (role === 'pickup') {
    const v = getNestedValue(delivery, 'senderPhone') || getNestedValue(delivery, 'sender.phone') || getNestedValue(delivery, 'pickup.phone') || getNestedValue(delivery, 'from.phone');
    if (v && /[0-9]/.test(String(v))) return String(v).trim();
  } else {
    const v = getNestedValue(delivery, 'recipientPhone') || getNestedValue(delivery, 'recipient.phone') || getNestedValue(delivery, 'dropoff.phone') || getNestedValue(delivery, 'to.phone');
    if (v && /[0-9]/.test(String(v))) return String(v).trim();
  }

  // Recursive scan: find first property whose key contains 'phone' or 'contact' and value contains digits
  const seen = new Set();
  const phoneRegex = /[0-9]/;
  const keyHint = /(phone|contact)/i;

  const search = (obj) => {
    if (!obj || typeof obj !== 'object' || seen.has(obj)) return null;
    seen.add(obj);
    for (const k of Object.keys(obj)) {
      try {
        const v = obj[k];
        if (!v) continue;
        if (typeof v === 'string' || typeof v === 'number') {
          const s = String(v).trim();
          if (keyHint.test(k) && phoneRegex.test(s)) return s;
        } else if (typeof v === 'object') {
          if (keyHint.test(k)) {
            // try to find phone-like value inside this nested object
            const candidate = search(v);
            if (candidate) return candidate;
          } else {
            const nested = search(v);
            if (nested) return nested;
          }
        }
      } catch (e) {
        // ignore property access errors
      }
    }
    return null;
  };

  const found = search(delivery);
  if (found) {
    console.log('[extractPhone] Found by scan:', found);
    return found;
  }

  // Final fallback: look at top-level properties for any string with digits
  for (const k of Object.keys(delivery)) {
    try {
      const v = delivery[k];
      if (v && (typeof v === 'string' || typeof v === 'number')) {
        const s = String(v).trim();
        if (phoneRegex.test(s)) {
          console.warn(`[extractPhone] Using top-level fallback key '${k}':`, s);
          return s;
        }
      }
    } catch (e) { }
  }

  console.warn(`[extractPhone] ❌ No phone number found for role: ${role}`);
  return null;
};


const ActiveDeliveries = () => {
  const { activeDeliveries, updateDeliveryStatus: contextUpdateStatus } = useDelivery();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('in-progress'); // in-progress, yet-to-start, completed
  const [stats, setStats] = useState({}); // { [deliveryId]: { distance, duration } }
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedDeliveryForChat, setSelectedDeliveryForChat] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({}); // { [deliveryId]: count }

  // Listen for new chat messages and update unread counts
  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log('[ActiveDeliveries] Received chat message:', data);

      // Extract delivery ID and message data
      const deliveryId = data?.deliveryId || data?.delivery;
      const messageData = data?.message || data;
      const senderRole = messageData?.senderRole || data?.senderRole || data?.role;

      console.log('[ActiveDeliveries] Message details:', { deliveryId, senderRole, showChatModal, selectedDeliveryForChat });

      // Only count messages from customer (not from driver/self)
      if (deliveryId && senderRole === 'customer') {
        // Don't increment if chat modal is open for this delivery
        if (showChatModal && selectedDeliveryForChat === deliveryId) {
          console.log('[ActiveDeliveries] Chat modal open for this delivery, not incrementing');
          return;
        }

        console.log('[ActiveDeliveries] Incrementing unread count for delivery:', deliveryId);
        setUnreadCounts(prev => ({
          ...prev,
          [deliveryId]: (prev[deliveryId] || 0) + 1
        }));
      }
    };

    try {
      socketService.connect();
      socketService.on('delivery:chat:message', handleNewMessage);
    } catch (e) {
      console.warn('[ActiveDeliveries] Failed to set up message listener:', e);
    }

    return () => {
      try {
        socketService.off('delivery:chat:message', handleNewMessage);
      } catch (e) { }
    };
  }, [showChatModal, selectedDeliveryForChat]);

  // Fetch rider's active deliveries on mount
  useEffect(() => {
    fetchActiveDeliveries();

    // Listen for delivery acceptance events and scroll to the accepted delivery
    const handleDeliveryAccepted = async (event) => {
      const detail = event && event.detail ? event.detail : {};
      const deliveryId = detail.deliveryId || detail.id || null;
      await fetchActiveDeliveries();

      // Try to scroll the accepted delivery into view
      if (deliveryId) {
        setTimeout(() => {
          const el = document.getElementById(`delivery-${deliveryId}`);
          if (el && el.scrollIntoView) {
            try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { el.scrollIntoView(); }
          }
        }, 250);
      }
    };

    // Listen for delivery status updates
    const handleDeliveryStatusChanged = () => {
      fetchActiveDeliveries();
    };

    window.addEventListener('delivery:accepted', handleDeliveryAccepted);
    window.addEventListener('delivery:statusChanged', handleDeliveryStatusChanged);
    // Refresh on payment completion
    const handlePaymentCompleted = () => fetchActiveDeliveries();
    window.addEventListener('payment:completed', handlePaymentCompleted);

    return () => {
      window.removeEventListener('delivery:accepted', handleDeliveryAccepted);
      window.removeEventListener('delivery:statusChanged', handleDeliveryStatusChanged);
      window.removeEventListener('payment:completed', handlePaymentCompleted);
    };
  }, []);

  // If navigated with a hash like #delivery-<id>, scroll that delivery into view after deliveries load
  useEffect(() => {
    if (!loading && deliveries && deliveries.length > 0) {
      try {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#delivery-')) {
          const id = hash.replace('#', '');
          setTimeout(() => {
            const el = document.getElementById(id);
            if (el && el.scrollIntoView) {
              try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { el.scrollIntoView(); }
            }
          }, 300);
        }
      } catch (e) { /* ignore */ }
    }
  }, [loading, deliveries]);

  // Live Location Tracking
  useEffect(() => {
    // Only track if there are deliveries 'in-transit'
    const inTransitDeliveries = deliveries.filter(d =>
      (d.status?.toLowerCase() === 'in-transit' || d.status?.toLowerCase() === 'in transit')
    );

    let watchId;

    if (inTransitDeliveries.length > 0) {
      console.log('[ActiveDeliveries] 🟢 Starting live tracking for', inTransitDeliveries.length, 'deliveries');

      socketService.connect();

      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const location = { lat: latitude, lng: longitude };

            inTransitDeliveries.forEach(delivery => {
              const deliveryId = delivery._id || delivery.id;
              socketService.emit('driver:location:update', {
                deliveryId,
                location
              });
            });
          },
          (error) => console.error('[ActiveDeliveries] Location tracking error:', error),
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000
          }
        );
      }
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [deliveries]);

  // detect mobile view (small screens) to render mobile-optimized layout
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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
        console.log('[ActiveDeliveries] 🔍 Requesting location...');
        console.log('[ActiveDeliveries] URL protocol:', window.location.protocol);
        console.log('[ActiveDeliveries] Secure context:', window.isSecureContext);

        let position = null;
        let lastError = null;

        // Attempt 1: High accuracy (GPS when available) for better position
        try {
          console.log('[ActiveDeliveries] Attempt 1: High-accuracy request...');
          position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
              }
            );
          });
          console.log('[ActiveDeliveries] ✅ Attempt 1 succeeded');
        } catch (err) {
          console.log('[ActiveDeliveries] ❌ Attempt 1 failed:', err);
          lastError = err;
        }

        // Attempt 2: Longer timeout, still prefer fresh position
        if (!position) {
          try {
            console.log('[ActiveDeliveries] Attempt 2: Longer timeout...');
            position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                  enableHighAccuracy: true,
                  timeout: 25000,
                  maximumAge: 5000
                }
              );
            });
            console.log('[ActiveDeliveries] ✅ Attempt 2 succeeded');
          } catch (err) {
            console.log('[ActiveDeliveries] ❌ Attempt 2 failed:', err);
            lastError = err;
          }
        }

        // Attempt 3: Minimal options
        if (!position) {
          try {
            console.log('[ActiveDeliveries] Attempt 3: Minimal options...');
            position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            console.log('[ActiveDeliveries] ✅ Attempt 3 succeeded');
          } catch (err) {
            console.log('[ActiveDeliveries] ❌ Attempt 3 failed:', err);
            lastError = err;
          }
        }

        if (!position) {
          console.error('[ActiveDeliveries] All location attempts failed:', lastError);

          // Detailed troubleshooting message
          if (lastError.code === 1) {
            setToastMsg('Location denied, please enable location and Turn off VPN if active');
          } else if (lastError.code === 2) {
            setToastMsg('Device location unavailable.');
          } else if (lastError.code === 3) {
            setToastMsg('Location timeout ');
          } else {
            setToastMsg('Location error. Try: page Refresh, or use different browser');
          }

          setShowToast(true);
          setUpdatingStatus(null);
          return;
        }

        statusUpdate.currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('[ActiveDeliveries] ✅ Location obtained:', statusUpdate.currentLocation);
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
    let newStatus = 'picked-up';

    // Determine next status based on current status
    // Backend expects: assigned → picked-up → in-transit → delivered
    if (status.includes('assigned') || status.includes('pending')) {
      newStatus = 'picked-up'; // Start Pickup button → picked-up
    } else if (status.includes('picked') || status.includes('picked-up')) {
      newStatus = 'in-transit'; // Start Delivery button → in-transit
    } else if (status.includes('transit') || status.includes('in-transit')) {
      newStatus = 'delivered'; // Complete Delivery button → delivered
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
  };


  const handleRouteStats = useCallback((deliveryId, { distance, duration }) => {
    setStats(prev => {
      // Prevent update if values haven't changed
      if (prev[deliveryId]?.distance === distance && prev[deliveryId]?.duration === duration) {
        return prev;
      }
      return {
        ...prev,
        [deliveryId]: { distance, duration }
      };
    });
  }, []);

  // Filter deliveries by tab
  const filterDeliveriesByTab = () => {
    if (activeTab === 'yet-to-start') {
      // Deliveries that are assigned but not yet picked up
      return deliveries.filter(d => {
        const status = (d.status || '').toLowerCase();
        return status.includes('assigned') || status.includes('pending');
      });
    } else if (activeTab === 'in-progress') {
      // Deliveries that are picked up or in transit
      return deliveries.filter(d => {
        const status = (d.status || '').toLowerCase();
        return status.includes('picked') || status.includes('transit');
      });
    } else if (activeTab === 'completed') {
      // Completed/delivered deliveries
      return deliveries.filter(d => {
        const status = (d.status || '').toLowerCase();
        return status.includes('delivered') || status.includes('completed');
      });
    }
    return deliveries;
  };

  const filteredDeliveries = filterDeliveriesByTab();

  // Debug: surface which phone values are used for this card
  try {
    console.log('[DeliveryCard] deliveryId:', deliveryId, 'pickupPhone:', pickupPhone, 'deliveryPhone:', deliveryPhone);
  } catch (e) { }

  return (
    <IonPage>
      <RiderLayout>
        <IonContent className={isMobile ? "" : "ion-padding"}>
          {/* Header */}
          <YummyText>
            <div className={isMobile ? "mb-4 px-1 pt-4" : "mb-4 py-2"}>
              <div className={isMobile ? "text-2xl font-medium text-[#0F172A] mb-1" : "text-3xl font-medium text-[#0F172A] mb-2"}>
                Active Deliveries
              </div>
              <div className="text-[#4A5565] text-[15px] font-[400]">
                Manage your ongoing deliveries
              </div>
            </div>
          </YummyText>

          {/* Tab Navigation */}
          <div className={isMobile ? "mb-4 px-1" : "mb-6"}>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full w-full">
              <button
                onClick={() => setActiveTab('yet-to-start')}
                className={`flex-1 px-4 py-2.5 whitespace-nowrap rounded-full text-sm font-normal transition-colors ${activeTab === 'yet-to-start'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
                  }`}
              >
                Yet to Start ({deliveries.filter(d => {
                  const status = (d.status || '').toLowerCase();
                  return status.includes('assigned') || status.includes('pending');
                }).length})
              </button>
              <button
                onClick={() => setActiveTab('in-progress')}
                className={`flex-1 px-4 py-2.5 whitespace-nowrap rounded-full text-sm font-normal transition-colors ${activeTab === 'in-progress'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
                  }`}
              >
                In Progress ({deliveries.filter(d => {
                  const status = (d.status || '').toLowerCase();
                  return status.includes('picked') || status.includes('transit');
                }).length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`flex-1 px-4 py-2.5 whitespace-nowrap rounded-full text-sm font-normal transition-colors ${activeTab === 'completed'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
                  }`}
              >
                Completed ({deliveries.filter(d => {
                  const status = (d.status || '').toLowerCase();
                  return status.includes('delivered') || status.includes('completed');
                }).length})
              </button>
            </div>
          </div>

          {/* Deliveries List */}
          <div className={isMobile ? "pb-4" : "max-h-[900px] overflow-y-auto pr-2"}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D68F] mx-auto mb-4"></div>
                  <p className="text-[#64748B]">Loading active deliveries...</p>
                </div>
              </div>
            ) : filteredDeliveries.length > 0 ? (
              filteredDeliveries.map((delivery) => {
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
                const pickupPhone = extractPhone(delivery, 'pickup');
                const deliveryPhone = extractPhone(delivery, 'delivery');

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
                    distance={stats[delivery._id || delivery.id]?.distance || (delivery.distance ? `${delivery.distance} km` : (delivery.distanceInKm ? `${delivery.distanceInKm} km` : 'N/A'))}
                    time={stats[delivery._id || delivery.id]?.duration ? `${stats[delivery._id || delivery.id]?.duration}` : (delivery.estimatedTime || delivery.estimatedDuration || (delivery.estimatedTimeMinutes ? `${delivery.estimatedTimeMinutes} min` : 'Est. N/A'))}
                    price={delivery.amount ? `₦${Number(delivery.amount).toFixed(2)}` : (delivery.price ? `₦${Number(delivery.price).toFixed(2)}` : '₦0.00')}
                    pickupName={delivery.pickup?.name || delivery.pickupName || delivery.senderName || 'Pickup Location'}
                    pickupAddress={pickupAddressText}
                    pickupPhone={pickupPhone}
                    pickupCoords={pickupCoords}
                    pickupBorder={(delivery.status?.toLowerCase() || '').includes('picked') ? 'border-[#E5E7EB]' : 'border-[#00D68F]'}
                    deliveryName={delivery.dropoff?.name || delivery.deliveryName || delivery.recipientName || delivery.receiverName || 'Delivery Location'}
                    deliveryAddress={deliveryAddressText}
                    deliveryPhone={deliveryPhone}
                    deliveryCoords={deliveryCoords}
                    vehicleCoords={vehicleCoords}
                    deliveryBorder={(delivery.status?.toLowerCase() || '').includes('picked') ? 'border-[#FF9500]' : 'border-gray-200'}
                    size={delivery.packageSize || delivery.size || delivery.packageDetails?.size || 'Standard'}
                    weight={delivery.packageWeight || delivery.weight || delivery.packageDetails?.weight || 'N/A'}
                    notes={delivery.specialInstructions || delivery.notes || delivery.description || delivery.packageDescription || delivery.packageDetails?.description || 'No special instructions'}
                    actionButtonText={getActionButtonText(delivery.status)}
                    onActionClick={() => handleActionClick(delivery)}
                    isUpdating={updatingStatus === (delivery._id || delivery.id)}
                    isMobile={isMobile}
                    deliveryId={delivery._id || delivery.id}
                    onRouteStats={handleRouteStats}
                    paymentStatus={((delivery.paymentStatus || delivery.payment?.status) || '').toLowerCase()}
                    deliveryRaw={delivery}
                    unreadCounts={unreadCounts}
                    setShowChatModal={setShowChatModal}
                    setSelectedDeliveryForChat={setSelectedDeliveryForChat}
                    setUnreadCounts={setUnreadCounts}
                  />
                );
              })
            ) : (
              <div className={isMobile ? "text-center py-12 px-6" : "text-center py-20 rounded-2xl px-6"} style={!isMobile ? sideBottomShadow : {}}>
                <BanIcon className="w-16 h-16 mx-auto mb-4 text-[#FF6B00]" />
                <div className={isMobile ? "text-lg font-medium text-[#0F172A] mb-2" : "text-xl font-medium text-[#0F172A] mb-3"}>
                  {activeTab === 'yet-to-start' && 'No Deliveries Yet to Start'}
                  {activeTab === 'in-progress' && 'No Deliveries In Progress'}
                  {activeTab === 'completed' && 'No Completed Deliveries Yet'}
                </div>
                <div className={isMobile ? "text-sm text-[#64748B] mb-4 max-w-md mx-auto" : "text-sm text-[#64748B] mb-6 max-w-md mx-auto"}>
                  {activeTab === 'yet-to-start' && "You don't have any assigned deliveries waiting to start. Check the Available Orders page for new requests."}
                  {activeTab === 'in-progress' && "You don't have any deliveries currently in progress. Start a delivery from the 'Yet to Start' tab."}
                  {activeTab === 'completed' && "You haven't completed any deliveries yet. Keep delivering to see your completed orders here."}
                </div>
                {activeTab !== 'completed' && (
                  <button
                    onClick={() => window.location.href = '/rider/available-orders'}
                    className={isMobile ? "bg-[#00B75A] hover:bg-[#00B876] text-white px-6 py-3 rounded-full transition-colors font-medium w-full" : "bg-[#00B75A] hover:bg-[#00B876] text-white px-6 py-3 rounded-full transition-colors font-medium"}
                  >
                    View Available Orders
                  </button>
                )}
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

      {/* Chat Modal */}
      {showChatModal && selectedDeliveryForChat && (() => {
        // Find the delivery to check service type
        const delivery = deliveries.find(d => (d._id || d.id) === selectedDeliveryForChat);
        const isSmartRide = delivery?.serviceType === 'smartride' || delivery?.service === 'smartride' || delivery?.type === 'smartride';
        const ChatComponent = isSmartRide ? SmartRideDeliveryChat : ExpressDeliveryChat;

        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => {
              setShowChatModal(false);
              setSelectedDeliveryForChat(null);
              setUnreadCounts(prev => ({
                ...prev,
                [selectedDeliveryForChat]: 0
              }));
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '600px',
                height: '80vh',
                maxHeight: '700px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => {
                  setShowChatModal(false);
                  setSelectedDeliveryForChat(null);
                  setUnreadCounts(prev => ({
                    ...prev,
                    [selectedDeliveryForChat]: 0
                  }));
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 10,
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px 8px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>

              <ChatComponent
                deliveryId={selectedDeliveryForChat}
                currentUserRole="driver"
                userRole="rider"
                onClose={() => {
                  setShowChatModal(false);
                  setSelectedDeliveryForChat(null);
                  setUnreadCounts(prev => ({
                    ...prev,
                    [selectedDeliveryForChat]: 0
                  }));
                }}
              />
            </div>
          </div>
        );
      })()}
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
  pickupPhone,
  pickupCoords,
  pickupBorder,
  deliveryName,
  deliveryAddress,
  deliveryPhone,
  deliveryCoords,
  vehicleCoords,
  deliveryBorder,
  size,
  weight,
  notes,
  actionButtonText,
  onActionClick,
  isUpdating,
  isMobile,
  deliveryId,
  onRouteStats,
  paymentStatus,
  deliveryRaw,
  unreadCounts = {},
  setShowChatModal,
  setSelectedDeliveryForChat,
  setUnreadCounts
}) => {
  const [showMapFull, setShowMapFull] = useState(false);

  const openMap = () => setShowMapFull(true);
  const closeMap = () => setShowMapFull(false);

  // swipe-to-close removed; map closes only via X button

  return (
    <div id={`delivery-${deliveryId}`} className={isMobile ? "bg-white rounded-2xl mb-4 overflow-hidden ml-0.5 -mr-1" : "bg-white rounded-2xl mb-6 overflow-hidden ml-0.5"} style={sideBottomShadow}>
      {/* Header Section with Background */}
      <YummyText>
        <div className={isMobile ? "bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] p-4" : "bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] p-6"}>
          {/* Package ID, Status, and Price */}
          <div className="flex items-start justify-between -mb-6">
            <div className="flex items-center gap-2 min-w-0">
              <div className={isMobile ? "text-base font-medium text-[#0F172A] truncate" : "text-lg font-normal text-[#0F172A] truncate"}>
                {isMobile ? packageId.substring(0, 12) + '...' : packageId}
              </div>
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(packageId);
                    alert('Package ID copied to clipboard');
                  } catch (e) {
                    alert(packageId);
                  }
                }}
                className="p-1 rounded hover:bg-gray-100"
                aria-label="Copy package id"
              >
                <IonIcon icon={copyOutline} style={{ fontSize: isMobile ? 16 : 18 }} />
              </button>
            </div>
            <div className="flex flex-col items-end">
              <div className={isMobile ? "text-xl font-semibold text-[#00D68F]" : "text-2xl font-normal text-[#00D68F]"}>
                {price}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-normal ${statusColor}`}>
                  {status}
                </span>
                {/* Payment tag: show Paid, Yet to pay (for online/bank unpaid), or Cash (for COD) */}
                {paymentStatus === 'paid' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-normal bg-green-100 text-green-700">Paid</span>
                )}
                {paymentStatus !== 'paid' && (() => {
                  const method = (deliveryRaw.payment?.method || deliveryRaw.paymentMethod || deliveryRaw.payment?.paymentMethod || deliveryRaw.method || '').toString().toLowerCase().trim();
                  if (method === 'cash' || method === 'cash_on_delivery' || method === 'cod') {
                    return <span className="px-2 py-0.5 rounded-full text-xs font-normal bg-white text-green-600 border border-green-300">Cash</span>;
                  }
                  return <span className="px-2 py-0.5 rounded-full text-xs font-normal bg-orange-100 text-orange-700">Yet to pay</span>;
                })()}
              </div>
            </div>
          </div>

          {/* Distance and Time */}
          <div className={isMobile ? "text-sm text-[#64748B]" : "text-base text-[#64748B] -mb-3"}>
            {distance} • Est. {time}
          </div>
          {deliveryRaw?.earningsBreakdown && (
            <div className="mt-2 pt-2 border-t border-[#00D68F]/20">
              <div className="text-xs text-[#64748B]">Earnings</div>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-[#0F172A]">Your earnings: <strong className="text-[#00D68F]">₦{Number(deliveryRaw.earningsBreakdown.driverEarnings || 0).toLocaleString()}</strong></span>
                <span className="text-[#64748B]">Total: ₦{Number(deliveryRaw.earningsBreakdown.deliveryTotal || 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </YummyText>

      {/* Main Content */}
      <div className={isMobile ? "p-4" : "p-6"}>
        {/* Mobile: show map first for quick glance/navigation */}
        {isMobile && (
          <div className="mb-4 -ml-1 -mr-0.5 rounded-xl overflow-hidden">
            <TrackingMap
              pickupLocation={pickupCoords}
              dropoffLocation={deliveryCoords}
              driverLocation={vehicleCoords}
              onRouteStats={(stats) => onRouteStats && onRouteStats(deliveryId, stats)}
            />
          </div>
        )}

        <YummyText>
          <div className={isMobile ? "space-y-3 mb-4" : "grid grid-cols-2 gap-4 mb-6"}>
            {/* Pickup Location */}
            <div className={`${isMobile ? "p-3" : "p-4"} rounded-xl border-2 ${pickupBorder} bg-[#F9FAFB]`}>
              <div className={isMobile ? "flex gap-2 mb-2" : "flex gap-3 mb-3"}>
                <div className={`location-icon-container location-icon-pickup ${isMobile ? "w-7 h-7" : "w-8 h-8"} bg-[#00D68F] rounded-full flex items-center justify-center flex-shrink-0`}>
                  <img src="/locationicon-white.svg" alt="Pickup" className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#64748B] mb-0.5">Pickup Location</div>
                  <div className={`${isMobile ? "text-sm" : "text-sm"} font-medium text-[#0A0A0A] mb-0.5 truncate`}>
                    {pickupName}
                  </div>
                  <div className={`text-xs text-[#64748B] ${isMobile ? "line-clamp-2" : ""}`}>
                    {pickupAddress}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('[Call Button] Pickup phone button clicked');
                    console.log('[Call Button] pickupPhone value:', pickupPhone);

                    if (!pickupPhone) {
                      alert('Pickup phone number not available. Please check the delivery details.');
                      return;
                    }

                    try {
                      const cleanPhone = pickupPhone.toString().replace(/[\s\-()]/g, '').replace(/[^0-9+]/g, '');
                      console.log('[Call Button] Cleaned phone:', cleanPhone);

                      if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 7) {
                        alert(`Invalid phone number format: ${pickupPhone}`);
                        return;
                      }

                      window.location.href = `tel:${cleanPhone}`;
                    } catch (e) {
                      console.error('[Call Button] Error initiating call:', e);
                      try {
                        navigator.clipboard.writeText(pickupPhone);
                        alert(`Could not initiate call. Phone number copied to clipboard: ${pickupPhone}`);
                      } catch (clipErr) {
                        alert(`Pickup phone: ${pickupPhone}`);
                      }
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 ${isMobile ? "py-2.5" : "py-2"} bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors`}
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  <TelephoneIcon size={isMobile ? 18 : 20} color="black" />
                  Call
                </button>
                <button
                  onClick={() => openMap()}
                  className={`flex-1 flex items-center justify-center gap-1 ${isMobile ? "py-2.5" : "py-2"} bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors`}
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  <img src="/paperplane-icon.svg" alt="Navigate" className="w-4 h-4" />
                  Navigate
                </button>
              </div>
            </div>

            {/* Delivery Location */}
            <div className={`${isMobile ? "p-3" : "p-4"} rounded-xl border-2 ${deliveryBorder} ${deliveryBorder === 'border-[#FF9500]' ? 'bg-[#FFF7ED]' : 'bg-gray-50'}`}>
              <div className={isMobile ? "flex gap-2 mb-2" : "flex gap-3 mb-3"}>
                <div className={`location-icon-container location-icon-delivery ${isMobile ? "w-7 h-7" : "w-8 h-8"} bg-[#FF9500] rounded-full flex items-center justify-center flex-shrink-0`}>
                  <img src="/location-orange.svg" alt="Delivery" className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} style={{ filter: 'brightness(0) invert(1)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#64748B] mb-0.5">Delivery Location</div>
                  <div className={`${isMobile ? "text-sm" : "text-sm"} font-medium text-[#0A0A0A] mb-0.5 truncate`}>
                    {deliveryName}
                  </div>
                  <div className={`text-xs text-[#64748B] ${isMobile ? "line-clamp-2" : ""}`}>
                    {deliveryAddress}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('[Call Button] Delivery phone button clicked');
                    console.log('[Call Button] deliveryPhone value:', deliveryPhone);

                    if (!deliveryPhone) {
                      alert('Delivery phone number not available. Please check the delivery details.');
                      return;
                    }

                    try {
                      const cleanPhone = deliveryPhone.toString().replace(/[\s\-()]/g, '').replace(/[^0-9+]/g, '');
                      console.log('[Call Button] Cleaned phone:', cleanPhone);

                      if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 7) {
                        alert(`Invalid phone number format: ${deliveryPhone}`);
                        return;
                      }

                      window.location.href = `tel:${cleanPhone}`;
                    } catch (e) {
                      console.error('[Call Button] Error initiating call:', e);
                      try {
                        navigator.clipboard.writeText(deliveryPhone);
                        alert(`Could not initiate call. Phone number copied to clipboard: ${deliveryPhone}`);
                      } catch (clipErr) {
                        alert(`Delivery phone: ${deliveryPhone}`);
                      }
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 ${isMobile ? "py-2.5" : "py-2"} bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors`}
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  <TelephoneIcon size={isMobile ? 18 : 20} color="black" />
                  Call
                </button>
                <button
                  onClick={() => {
                    if (setShowChatModal && setSelectedDeliveryForChat && setUnreadCounts) {
                      setSelectedDeliveryForChat(deliveryId);
                      setShowChatModal(true);
                      // Clear unread count when opening chat
                      setUnreadCounts(prev => ({
                        ...prev,
                        [deliveryId]: 0
                      }));
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 ${isMobile ? "py-2.5" : "py-2"} bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors relative`}
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  <ChatIcon size={isMobile ? 18 : 20} color="black" />
                  Message
                  {unreadCounts && unreadCounts[deliveryId] > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {unreadCounts[deliveryId] > 9 ? '9+' : unreadCounts[deliveryId]}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </YummyText>

        {/* Package Details with Background */}
        <YummyText>
          <div className={`bg-gray-50 rounded-xl ${isMobile ? "p-3 mb-3" : "p-4 mb-4"}`}>
            <div className={`${isMobile ? "text-sm" : "text-sm"} font-medium text-[#0F172A] mb-2`}>
              Package Details
            </div>
            <div className={isMobile ? "space-y-2" : "grid grid-cols-3 gap-6"}>
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
                <div className={`text-sm text-[#0F172A] font-medium ${isMobile ? "line-clamp-2" : ""}`}>
                  {notes}
                </div>
              </div>
            </div>
          </div>
        </YummyText>

        {/* Chat with customer */}
        <div className="mb-4">
          <div className="text-xs font-medium text-[#64748B] mb-2">Chat with customer</div>
          {(() => {
            const isSmartRide = deliveryRaw?.serviceType === 'smartride' || deliveryRaw?.service === 'smartride' || deliveryRaw?.type === 'smartride';
            const ChatComponent = isSmartRide ? SmartRideDeliveryChat : ExpressDeliveryChat;
            return (
              <ChatComponent
                deliveryId={deliveryId}
                currentUserRole="driver"
                className="rounded-xl border border-gray-200 overflow-hidden"
                maxHeight="220px"
              />
            );
          })()}
        </div>

        {/* Desktop: show map below details */}
        {!isMobile && (
          <div className="mb-4 w-full h-[300px] rounded-xl overflow-hidden">
            <TrackingMap
              pickupLocation={pickupCoords}
              dropoffLocation={deliveryCoords}
              driverLocation={vehicleCoords}
              onRouteStats={(stats) => onRouteStats && onRouteStats(deliveryId, stats)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <YummyText>
          <div className={isMobile ? "flex flex-col gap-2" : "flex gap-3"}>
            <button
              onClick={onActionClick}
              disabled={isUpdating}
              className={isMobile ?
                "w-full bg-[#00B75A] hover:bg-[#00B876] disabled:bg-gray-400 text-white py-3.5 rounded-xl text-base font-medium transition-colors" :
                "flex-1 bg-[#00B75A] hover:bg-[#00B876] disabled:bg-gray-400 text-white py-2 rounded-xl transition-colors font-[300]"
              }
            >
              {isUpdating ? 'Updating...' : actionButtonText}
            </button>
            <button
              className={isMobile ?
                "w-full px-6 py-3.5 bg-white rounded-xl text-[#0F172A] font-medium transition-colors" :
                "px-6 py-2 bg-white hover:bg-gray-50 rounded-xl transition-colors text-[#0F172A] font-[300]"
              }
              style={{ border: "1px solid #0000001A" }}
            >
              Report Issue
            </button>
          </div>
        </YummyText>

        {showMapFull && (
          <div className="fixed inset-0 bg-black/70 flex items-start justify-center" style={{ zIndex: 99999 }}>
            <div className="relative w-full h-full max-w-4xl bg-white">
              <button
                onClick={closeMap}
                aria-label="Close map"
                className="fixed top-4 right-4 z-[100000] bg-white rounded-full p-2 shadow-lg flex items-center justify-center"
                style={{ width: 44, height: 44, color: '#0A0A0A', fontSize: 20, lineHeight: '20px' }}
              >
                ×
              </button>
              <div className="w-full h-full">
                <TrackingMap
                  pickupLocation={pickupCoords}
                  dropoffLocation={deliveryCoords}
                  driverLocation={vehicleCoords}
                  fullScreen
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveDeliveries;

