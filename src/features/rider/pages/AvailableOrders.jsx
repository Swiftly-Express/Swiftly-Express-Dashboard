import React, { useState, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import { IonPage, IonContent, IonToast, IonRefresher, IonRefresherContent, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import Toast, { useToast } from '../../../components/Toast';
import BanIcon from '../../../icons/Banicon';
import TrackingMap from '../../../components/TrackingMap';
import { getAvailableJobs, acceptDeliveryJob, rejectDeliveryJob, getRiderProfile, getRiderDeliveries, updateDriverLocation, getRiderEarnings } from '../../../utils/authApi';
import socketService from '../../../services/socket.service';
import { getCookie, getJSONCookie, isRiderVerified, setCookie, setJSONCookie } from '../../../utils/cookies';


const sideBottomShadow = {
  boxShadow: '0.5px 1.5px 2px rgba(0, 0, 0, 0.05), -0.5px 1.5px 2px rgba(0, 0, 0, 0.05), 0 1.5px 3px rgba(0, 0, 0, 0.07)'
};

const StatCard = ({ icon, title, value, subtitle, color }) => (
  <div className="bg-white rounded-xl p-5 py-3 leading-none" style={sideBottomShadow}>
    <YummyText>
      <div className={`text-2xl font-[300] ${color} mb-1`}>{value}</div>
      <div className="text-xs text-[#64748B] mb-2">{title}</div>
      <div className="text-[11px] text-[#64748B] leading-none">{subtitle}</div>
    </YummyText>
  </div>
);

const OrderCard = ({
  deliveryId,
  packageId,
  priority,
  size,
  smartRide,
  pickupName,
  pickupAddress,
  deliveryName,
  deliveryAddress,
  distance,
  time,
  packageSize,
  price,
  tips,
  onAccept,
  onViewDetails,
  onReject,
  accepting,
  rejecting,
  isRequestedForMe
}) => (
  <div id={`order-${deliveryId}`} className="bg-white rounded-2xl p-4 sm:p-6 mb-4" style={sideBottomShadow}>
    <YummyText>
      <div className="flex flex-col sm:flex-row items-start sm:justify-between mb-4">
        <div className="flex items-center gap-3 mb-3 sm:mb-0 flex-wrap">
          <div className="text-lg font-normal text-[#0F172A]">{packageId}</div>
          {isRequestedForMe && (
            <span className="px-3 py-1 rounded-lg text-xs font-normal bg-[#6366F1] text-white">
              Customer requested you
            </span>
          )}
          {priority && (
            <span className="px-3 py-1 rounded-lg text-xs font-normal bg-[#FF7A00] text-[#FFFFFF]">
              {priority}
            </span>
          )}
          {smartRide && (
            <span className="px-3 py-1 rounded-lg text-xs font-normal bg-[#00D68F] text-white">
              SmartRide
            </span>
          )}
          {size && (
            <span className="px-3 py-1 rounded-lg text-xs font-normal border border-gray-400 text-gray-700">
              {size}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-normal text-[#00D68F]">{price}</div>
          <div className="text-xs text-[#64748B]">+ {tips} tips</div>
        </div>
      </div>
    </YummyText>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <YummyText>
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-[#E8F8F0] rounded-full flex items-center justify-center flex-shrink-0 animate-zoom">
            <img width="16" height="16" src="/locationicon.svg" alt="Pickup Icon" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#64748B] mb-2">Pickup</div>
            <div className="text-sm font-medium text-[#0F172A] mb-1">{pickupName}</div>
            <div className="text-xs text-[#64748B]">{pickupAddress}</div>
          </div>
        </div>
      </YummyText>
      <YummyText>
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-[#FFF4E6] rounded-full flex items-center justify-center flex-shrink-0 animate-zoom">
            <img width="16" height="16" src="/location-orange.svg" alt="Delivery Icon" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#64748B] mb-2">Delivery</div>
            <div className="text-sm font-medium text-[#0F172A] mb-1">{deliveryName}</div>
            <div className="text-xs text-[#64748B]">{deliveryAddress}</div>
          </div>
        </div>
      </YummyText>
    </div>

    <div className="my-3 border-t border-gray-200"></div>

    <YummyText>
      <div className="flex items-center gap-4 mb-4 text-xs text-[#64748B]">
        <div className="flex items-center gap-1">
          <img width="16" height="16" src="/paperplane-icon.svg" alt="Distance Icon" />
          {distance}
        </div>
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor" />
          </svg>
          {time}
        </div>
        <div className="flex items-center gap-1">
          <img width="16" height="16" src="/dollar-icon.svg" alt="Package Size Icon" />
          {packageSize}
        </div>
      </div>
    </YummyText>

    <YummyText>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onAccept(deliveryId)}
          disabled={accepting}
          className={`w-full sm:flex-1 bg-[#00B75A] hover:bg-[#00B876] text-white py-2 rounded-lg transition-colors font-[400] ${accepting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {accepting ? 'Accepting...' : 'Accept Order'}
        </button>
        {isRequestedForMe && onReject && (
          <button
            onClick={() => onReject(deliveryId)}
            disabled={rejecting === deliveryId}
            className={`w-full sm:flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition-colors font-[400] py-2 ${rejecting === deliveryId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {rejecting === deliveryId ? 'Declining...' : 'Decline'}
          </button>
        )}
        <button onClick={() => onViewDetails && onViewDetails(deliveryId)} className="w-full sm:flex-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-[#0F172A] font-[400] py-2" style={{ border: "1px solid #0000001A" }}>
          View Details
        </button>
      </div>
    </YummyText>
  </div>
);

const AvailableOrders = () => {
  const { toast, showToast: showCustomToast, hideToast, ToastComponent } = useToast();
  const [shownReminders, setShownReminders] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [page, setPage] = useState(1);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(() => {
    try {
      const ud = getJSONCookie('user_data') || {};
      return ud.verificationStatus || getCookie('riderVerificationStatus') || null;
    } catch (e) {
      return getCookie('riderVerificationStatus') || null;
    }
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [completedDeliveriesCount, setCompletedDeliveriesCount] = useState(0);
  const [avgPerDeliveryRaw, setAvgPerDeliveryRaw] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentRiderId, setCurrentRiderId] = useState(() => {
    try {
      const ud = getJSONCookie('user_data') || {};
      return ud._id || ud.id || null;
    } catch (e) {
      return null;
    }
  });
  const [rejecting, setRejecting] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'updating' | 'updated' | 'error'
  const [locationError, setLocationError] = useState(null);
  const [locationAccuracyM, setLocationAccuracyM] = useState(null); // accuracy in meters (from coords.accuracy)
  // lock body scroll when drawer/modal is open
  useEffect(() => {
    if (selectedOrder) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    return undefined;
  }, [selectedOrder]);

  // Debug: Check tokens on mount
  useEffect(() => {
    const riderToken = getCookie('rider_token');
    const customerToken = getCookie('customer_token');
    const authToken = getCookie('auth_token');
    const userData = getJSONCookie('user_data');

    console.log('[AvailableOrders] Token check on mount:', {
      riderToken: riderToken ? riderToken.substring(0, 20) + '...' : 'missing',
      customerToken: customerToken ? customerToken.substring(0, 20) + '...' : 'missing',
      authToken: authToken ? authToken.substring(0, 20) + '...' : 'missing',
      userData: userData ? 'exists' : 'missing'
    });
  }, []);

  const router = useIonRouter();

  // Check verification status from backend
  const checkVerificationStatus = async () => {
    try {
      console.log('[AvailableOrders] 🔍 Fetching verification status from backend...');
      const response = await getRiderProfile();
      const profile = response?.data?.driver || response?.driver || response?.data || response;

      console.log('[AvailableOrders] 📦 Backend profile:', profile);


      // Fix: Also check nested verification object and boolean flags for status
      let backendStatus = profile?.verificationStatus || profile?.accountStatus || profile?.status;
      if (!backendStatus && profile?.verification && (profile.verification.verificationStatus || profile.verification.status)) {
        backendStatus = profile.verification.verificationStatus || profile.verification.status;
      }

      // Normalize and accept several server truthy values as approved
      const statusNormalized = backendStatus ? String(backendStatus).toLowerCase() : null;
      let isApproved = false;
      if (statusNormalized) {
        const approvedValues = ['approved', 'verified', 'active', 'complete', 'approved_by_admin'];
        if (approvedValues.includes(statusNormalized)) isApproved = true;
      }

      // Also accept boolean flags that some backends may set
      if (profile?.isVerified === true || profile?.verified === true || profile?.verification?.isApproved === true) {
        isApproved = true;
      }

      if (profile?._id || profile?.id) {
        setCurrentRiderId(profile._id || profile.id);
      }

      // Fallback: check cookies/user_data for a verification hint
      try {
        const userData = getJSONCookie('user_data') || {};
        const udStatus = userData?.verificationStatus || userData?.status || userData?.verified;
        if (!isApproved && udStatus) {
          const udNorm = String(udStatus).toLowerCase();
          if (['approved', 'verified', 'true'].includes(udNorm)) isApproved = true;
        }
      } catch (e) { /* ignore */ }

      console.log('[AvailableOrders] Backend verification status:', {
        backendStatus,
        isApproved,
        localCookies: {
          verificationCompleted: getCookie('verificationCompleted'),
          verificationSubmitted: getCookie('verificationSubmitted'),
          riderAccountVerified: getCookie('riderAccountVerified'),
          riderVerificationStatus: getCookie('riderVerificationStatus')
        }
      });

      // Determine final status label for local UI: 'approved' | 'submitted' | null
      const pendingValues = ['submitted', 'pending', 'under_review', 'submitted_for_review', 'in_review'];
      const statusLabel = isApproved ? 'approved' : (statusNormalized && pendingValues.includes(statusNormalized) ? 'submitted' : null);

      // Sync backend status to cookies (store raw backendStatus for server-side use)
      if (backendStatus) {
        setCookie('riderVerificationStatus', backendStatus, 7);
        setCookie('riderAccountVerified', backendStatus, 7);

        // If server explicitly rejected the application, clear the local "verificationSubmitted" flag
        // so the rider can re-submit a new application.
        try {
          if (String(backendStatus).toLowerCase().includes('reject')) {
            setCookie('verificationSubmitted', '', -1);
          }
        } catch (e) { /* ignore */ }

        // Update user_data with latest profile and normalized status
        const existingUserData = getJSONCookie('user_data') || {};
        setJSONCookie('user_data', { ...existingUserData, ...profile, verificationStatus: backendStatus }, 7);
        console.log('[AvailableOrders] ✓ Synced backend status to cookies:', backendStatus);
      }

      // Check availability (must be true to accept orders)
      const available = profile?.availability !== false && profile?.isActive !== false;
      setIsAvailable(available);

      setIsVerified(isApproved);
      setVerificationStatus(statusLabel);
      return isApproved;
    } catch (error) {
      console.error('[AvailableOrders] Failed to check verification status:', error);
      // Fallback to local cookie check
      setIsVerified(false);
      return false;
    }
  };

  useEffect(() => {
    // Initial verification check with backend
    checkVerificationStatus().then(verified => {
      console.log('[AvailableOrders] Initial verification check:', verified);
      if (verified) {
        fetchAvailableJobs();
      }
    });

    // Fetch count of completed deliveries to determine "new user" state
    const fetchCompleted = async () => {
      try {
        const resp = await getRiderDeliveries(1, 100);
        const deliveries = resp?.data?.deliveries || resp?.deliveries || resp?.data || [];
        const completed = deliveries.filter(d => (d.status || '').toLowerCase() === 'delivered').length;
        console.log('[AvailableOrders] Completed deliveries count:', completed);
        setCompletedDeliveriesCount(completed);
      } catch (e) {
        console.warn('[AvailableOrders] Failed to fetch deliveries for completed count', e);
        setCompletedDeliveriesCount(0);
      }
    };

    fetchCompleted();
    // Fetch rider earnings to get avgPerDelivery for potential earnings calculation
    const fetchAvg = async () => {
      try {
        const resp = await getRiderEarnings();
        const data = resp?.data?.earnings || resp?.earnings || resp?.data || resp || {};
        const avg = data?.averagePerDelivery || data?.avgPerDelivery || data?.average || 0;
        setAvgPerDeliveryRaw(Number(avg) || 0);
        console.log('[AvailableOrders] avgPerDelivery fetched:', avg);
      } catch (e) {
        console.warn('[AvailableOrders] Failed to fetch rider earnings for avgPerDelivery', e);
      }
    };
    fetchAvg();

    // Listen for verification completion
    const handleVerificationComplete = async (event) => {
      console.log('[AvailableOrders] Verification completed event received:', event.detail);
      // Re-check verification status from backend
      const verified = await checkVerificationStatus();
      console.log('[AvailableOrders] ✓ Verification status after event:', verified);

      if (verified) {
        setToastMsg('✅ Verification approved! You can now view available orders.');
        setShowToast(true);
        // Refresh jobs after verification
        fetchAvailableJobs();
      } else {
        setToastMsg('⏳ Verification submitted! Waiting for admin approval.');
        setShowToast(true);
      }
    };

    window.addEventListener('verification:completed', handleVerificationComplete);
    return () => {
      window.removeEventListener('verification:completed', handleVerificationComplete);
    };
  }, []);

  // Fetch available jobs on mount and when page changes
  useEffect(() => {
    if (isVerified) {
      fetchAvailableJobs();
    }
  }, [page, isVerified]);

  // Auto-refresh removed — use pull-to-refresh or manual refresh instead

  // Listen for new deliveries created by customers
  useEffect(() => {
    const handleDeliveryCreated = (event) => {
      console.log('[AvailableOrders] New delivery created, refreshing jobs:', event.detail);
      setToastMsg('New delivery available!');
      setShowToast(true);
      fetchAvailableJobs();
    };

    const handleDeliveriesRefresh = () => {
      console.log('[AvailableOrders] Deliveries refresh requested');
      fetchAvailableJobs();
    };

    window.addEventListener('delivery:created', handleDeliveryCreated);
    window.addEventListener('deliveries:refresh', handleDeliveriesRefresh);

    return () => {
      window.removeEventListener('delivery:created', handleDeliveryCreated);
      window.removeEventListener('deliveries:refresh', handleDeliveriesRefresh);
    };
  }, []);

  // Socket: real-time invitation when a customer requests this rider
  useEffect(() => {
    socketService.connect();
    const handleInvitation = (data) => {
      console.log('[AvailableOrders] delivery:invitation received:', data);
      setToastMsg('A customer requested you for a delivery');
      setShowToast(true);
      fetchAvailableJobs();
    };
    socketService.on('delivery:invitation', handleInvitation);
    return () => {
      try { socketService.off('delivery:invitation', handleInvitation); } catch (e) { }
    };
  }, []);

  // Send current location to backend so you show up in "nearby riders" (pickup within ~20 km)
  const sendLocationToBackend = React.useCallback((showToastOnSuccess = false) => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation not supported');
      return;
    }
    setLocationStatus('updating');
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy; // meters, may be undefined
        if (typeof acc === 'number') setLocationAccuracyM(Math.round(acc));
        else setLocationAccuracyM(null);
        updateDriverLocation(lat, lng)
          .then(() => {
            setLocationStatus('updated');
            setLocationError(null);
            if (showToastOnSuccess) {
              setToastMsg('Location updated. You\'ll appear for customers within ~20 km of their pickup.');
              setShowToast(true);
            }
          })
          .catch((err) => {
            setLocationStatus('error');
            const msg = err?.response?.data?.message || err?.message || 'Failed to update location';
            setLocationError(msg);
            if (showToastOnSuccess) {
              setToastMsg(msg);
              setShowToast(true);
            }
            console.error('[AvailableOrders] updateDriverLocation failed:', err);
          });
      },
      (err) => {
        setLocationStatus('error');
        const msg = err?.message === 'User denied the request for Geolocation.'
          ? 'Location permission denied. Allow location in your browser to appear in nearby riders.'
          : err?.message || 'Could not get your location';
        setLocationError(msg);
        if (showToastOnSuccess) {
          setToastMsg(msg);
          setShowToast(true);
        }
        console.error('[AvailableOrders] getCurrentPosition failed:', err);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, []);

  // Share location on mount and periodically so customers can find you
  useEffect(() => {
    if (!navigator.geolocation) return;
    sendLocationToBackend();
    const interval = setInterval(sendLocationToBackend, 20000);
    return () => clearInterval(interval);
  }, [sendLocationToBackend]);

  const fetchAvailableJobs = async () => {
    setLoading(true);
    try {
      console.log('[AvailableOrders] Fetching available jobs from API...');
      const response = await getAvailableJobs(page, 20);
      console.log('[AvailableOrders] API Response:', response);

      // Handle different response structures
      const jobs = response?.data?.jobs ||
        response?.data?.deliveries ||
        response?.jobs ||
        response?.deliveries ||
        response?.data ||
        [];

      console.log('[AvailableOrders] Extracted jobs:', jobs);
      console.log('[AvailableOrders] Total jobs found:', jobs.length);

      setOrders(jobs);
      setLastRefresh(Date.now());

      if (jobs.length === 0) {
        console.warn('[AvailableOrders] No jobs returned from API');
      }
    } catch (error) {
      console.error('[AvailableOrders] Failed to fetch jobs:', error);
      console.error('[AvailableOrders] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      setToastMsg(error.message || 'Failed to load available jobs');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Small helper to safely parse numbers from currency or string fields
  const parseAmount = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const s = String(val);
    // Remove any non-numeric, non-dot, non-minus characters (e.g., ₦, commas, spaces)
    const cleaned = s.replace(/[^0-9.-]+/g, '');
    const n = parseFloat(cleaned);
    return Number.isNaN(n) ? 0 : n;
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '₦0.00';
    const num = typeof val === 'string' ? parseFloat(val.replace(/[$,N\s]/g, '')) : Number(val);
    if (Number.isNaN(num)) return '₦0.00';
    return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleAcceptOrder = async (deliveryId) => {
    if (!isAvailable) {
      setToastMsg('You must be available/active to accept orders. Please update your status in your profile.');
      setShowToast(true);
      return;
    }

    setAccepting(deliveryId);
    try {
      const acceptedOrder = orders.find(o => (o._id || o.id) === deliveryId || o.id === deliveryId || o._id === deliveryId);
      const response = await acceptDeliveryJob(deliveryId);
      console.log('[AvailableOrders] Job accepted:', response);

      // Extract canonical delivery object/id from API response if available
      const respDelivery = response?.data?.delivery || response?.data || response;
      const acceptedId = respDelivery?._id || respDelivery?.id || respDelivery?.deliveryId || deliveryId;
      const data = response?.data || {};
      const earnings = data.potentialRiderEarnings;
      const etaMin = data.estimatedArrivalMinutes;
      let msg = 'Order accepted successfully!';
      if (earnings != null || etaMin != null) {
        const parts = [];
        if (earnings != null) parts.push(`Your earnings: ₦${Number(earnings).toLocaleString()}`);
        if (etaMin != null) parts.push(`~${etaMin} min to pickup`);
        if (parts.length) msg += ' ' + parts.join(' · ');
      }
      setToastMsg(msg);
      setShowToast(true);

      // Show payment reminder after accepting
      setTimeout(() => {
        const reminderKey = `accepted_${acceptedId}`;
        if (!shownReminders.has(reminderKey)) {
          const paymentMethod = acceptedOrder?.paymentMethod || acceptedOrder?.payment?.method;
          const reminderMsg = (
            <div>
              <div className="font-semibold mb-2">Reminder!</div>
              <div className="text-xs leading-relaxed">
                Before starting this delivery, make sure you contact the customer to:
                <br />• Verify package details
                <br />• Confirm the locations
                {paymentMethod?.toLowerCase() === 'cash' && (
                  <>
                    <br />• <strong>Kindly request payment before starting</strong>
                  </>
                )}
              </div>
            </div>
          );
          showCustomToast(reminderMsg, 'reminder', 8000, 'top');
          setShownReminders(prev => new Set([...prev, reminderKey]));
        }
      }, 3500);

      // Remove order from local list by matching on canonical id or the original id
      setOrders(prev => prev.filter(order => {
        const oid = order._id || order.id || order.deliveryId;
        return !(String(oid) === String(acceptedId) || String(oid) === String(deliveryId));
      }));

      // Dispatch accepted event including delivery type and order payload so other clients can react
      const acceptedDetail = { deliveryId: acceptedId, deliveryType: acceptedOrder?.deliveryType || acceptedOrder?.type || null, order: acceptedOrder || respDelivery || null };
      window.dispatchEvent(new CustomEvent('delivery:accepted', { detail: acceptedDetail }));

      // Also emit via socket so server can notify the customer room (fallback if server relies on socket events)
      try {
        socketService.connect();
        socketService.emit('delivery:accepted', acceptedDetail);
      } catch (e) {
        console.warn('[AvailableOrders] Failed to emit delivery:accepted via socketService', e);
      }

      // NOTE: Do not emit delivery:accepted from the rider client —
      // the backend must emit to the customer room after accepting the job.
      // Navigate rider to Active Deliveries and let ActiveDeliveries refresh on event
      try {
        router.push('/rider/active', 'forward', 'push');
      } catch (e) {
        // Fallback to direct location change
        window.location.href = '/rider/active';
      }
    } catch (error) {
      console.error('[AvailableOrders] Failed to accept job:', error);
      setToastMsg((error && (error.message || error.data?.message || error.data?.errorMessage)) || 'Failed to accept order');
      setShowToast(true);
    } finally {
      setAccepting(null);
    }
  };

  const handleRejectOrder = async (deliveryId) => {
    setRejecting(deliveryId);
    try {
      await rejectDeliveryJob(deliveryId);
      setToastMsg('Delivery request declined. It is now available to other riders.');
      setShowToast(true);
      setOrders(prev => prev.filter(o => (o._id || o.id) !== deliveryId));
      if (selectedOrder && (selectedOrder._id || selectedOrder.id) === deliveryId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('[AvailableOrders] Failed to reject job:', error);
      setToastMsg(error?.message || error?.response?.data?.message || 'Failed to decline');
      setShowToast(true);
    } finally {
      setRejecting(null);
    }
  };

  const handleViewDetails = (deliveryId) => {
    // Scroll the card into view so rider doesn't lose context
    const el = document.getElementById(`order-${deliveryId}`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const order = orders.find(o => (o._id || o.id) === deliveryId || o.id === deliveryId || o._id === deliveryId);
    if (order) setSelectedOrder(order);
  };

  // Express = normal ride (not Smart Ride); Nearby = within 2.5 km
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'express') return !order.smartRide && order.deliveryType !== 'smart_ride';
    if (activeTab === 'express') return !order.smartRide && order.deliveryType !== 'smart_ride';
    return true;
  });

  const expressCount = orders.filter(o => !o.smartRide && o.deliveryType !== 'smart_ride').length;
  const nearbyCount = orders.filter(o => parseFloat(o.distance) <= 2.5).length;

  const handleRefresh = async (event) => {
    await fetchAvailableJobs();
    event.detail.complete();
  };

  // Helper to extract coords from various payload shapes
  const extractCoords = (order, which) => {
    // which = 'pickup' or 'delivery'
    try {
      if (!order) return null;
      const pickup = order.pickup || order.pickupAddress || order.pickupCoords || order.pickup_location || order.pickupLocation;
      const delivery = order.dropoff || order.deliveryAddress || order.deliveryCoords || order.destination || order.destinationAddress;
      const candidate = which === 'pickup' ? pickup : delivery;
      if (!candidate) return null;
      // Candidate could be [lng, lat] or { lat, lng } or { coordinates: { lat, lng } }
      if (Array.isArray(candidate) && candidate.length >= 2) return [candidate[0], candidate[1]];
      if (candidate.coordinates && typeof candidate.coordinates.lat === 'number' && typeof candidate.coordinates.lng === 'number') return [candidate.coordinates.lng, candidate.coordinates.lat];
      if (typeof candidate.lat === 'number' && typeof candidate.lng === 'number') return [candidate.lng, candidate.lat];
      if (candidate.location && candidate.location.lat && candidate.location.lng) return [candidate.location.lng, candidate.location.lat];
      if (candidate.coordinates && Array.isArray(candidate.coordinates)) return candidate.coordinates;
      return null;
    } catch (e) {
      return null;
    }
  };

  // Haversine formula to calculate distance in kilometers between two [lng, lat] points
  const calculateHaversineKm = (a, b) => {
    try {
      if (!a || !b || a.length < 2 || b.length < 2) return null;
      const toRad = (deg) => deg * (Math.PI / 180);
      const [lng1, lat1] = a;
      const [lng2, lat2] = b;
      const R = 6371; // Earth radius km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lng2 - lng1);
      const radLat1 = toRad(lat1);
      const radLat2 = toRad(lat2);
      const sinDLat = Math.sin(dLat / 2) * Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const aCalc = sinDLat + Math.cos(radLat1) * Math.cos(radLat2) * sinDLon;
      const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
      return R * c;
    } catch (e) {
      return null;
    }
  };

  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-padding">
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent
              pullingText="Pull to refresh"
              refreshingText="Refreshing..."
            />
          </IonRefresher>
          <YummyText>
            <div className="mb-8 py-2">
              <div className="text-3xl font-medium text-[#0F172A] mb-2">
                Available Orders
              </div>
              <div className="text-[#4A5565] text-[15px] font-[400]">
                Accept orders in your area and start earning
              </div>
              <div className="text-[#64748B] text-[13px] mt-2">
                Your location is shared so customers can find you nearby (within ~20 km of their pickup). Keep this page open in the area you want to receive jobs. We use high-accuracy GPS when available—allow location and wait a few seconds for a better fix.
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`text-[13px] ${locationStatus === 'updated' ? 'text-[#00B75A]' : locationStatus === 'error' ? 'text-red-600' : 'text-[#64748B]'}`}>
                  {locationStatus === 'idle' && 'Location: waiting…'}
                  {locationStatus === 'updating' && 'Location: updating (high accuracy)…'}
                  {locationStatus === 'updated' && (locationAccuracyM != null ? `Location: shared ✓ (~${locationAccuracyM} m)` : 'Location: shared ✓')}
                  {locationStatus === 'error' && (locationError || 'Location: failed')}
                </span>
                <button
                  type="button"
                  onClick={() => sendLocationToBackend(true)}
                  disabled={locationStatus === 'updating'}
                  className="px-3 py-1.5 text-[13px] font-medium rounded-full border border-[#00B75A] text-[#00B75A] hover:bg-[#00B75A]/10 disabled:opacity-60"
                >
                  {locationStatus === 'updating' ? 'Updating…' : 'Update my location'}
                </button>
              </div>
            </div>
          </YummyText>

          {verificationStatus === 'submitted' ? (
            <div className="text-center py-20 rounded-2xl px-6" style={sideBottomShadow}>
              <BanIcon className="w-16 h-16 mx-auto mb-4 text-[#FF6B00]" />
              <div className="text-xl font-medium text-[#0F172A] mb-3">Verification Submitted</div>
              <div className="text-sm text-[#64748B] max-w-md mx-auto mb-6">Verification submitted, please wait.</div>
            </div>
          ) : verificationStatus !== 'approved' ? (
            <div className="text-center py-20 rounded-2xl px-6" style={sideBottomShadow}>
              <BanIcon className="w-16 h-16 mx-auto mb-4 text-[#FF6B00]" />
              <div className="text-xl font-medium text-[#0F172A] mb-3">Verification Required</div>
              <div className="text-sm text-[#64748B] max-w-md mx-auto mb-6">
                Please complete your driver verification <br className="sm:hidden md:block" /> to view and accept orders.
              </div>
              <button
                onClick={() => window.location.href = '/rider/dashboard'}
                className="bg-[#00B75A] hover:bg-[#00B876] text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          ) : !isAvailable ? (
            <div className="text-center py-20 rounded-2xl px-6" style={sideBottomShadow}>
              <BanIcon className="w-16 h-16 mx-auto mb-4 text-[#FF6B00]" />
              <div className="text-xl font-medium text-[#0F172A] mb-3">Set Availability</div>
              <div className="text-sm text-[#64748B] max-w-md mx-auto mb-6">
                You must be marked as available/active to accept orders. Please update your status in your profile.
              </div>
              <button
                onClick={() => window.location.href = '/rider/profile'}
                className="bg-[#00B75A] hover:bg-[#00B876] text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                Go to Profile
              </button>
            </div>
          ) : (<>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Available Now"
                value={orders.length}
                subtitle=""
                color="text-[#00A63E]"
              />
              <StatCard
                title="Potential Earnings"
                value={completedDeliveriesCount === 0 ? '₦0.00' : formatCurrency(Number(avgPerDeliveryRaw) || 0)}
                subtitle=""
                color="text-[#00A63E]"
              />
              <StatCard
                title="Avg. Distance"
                value={completedDeliveriesCount === 0 ? '0 km' : (orders.length > 0 ? `${(orders.reduce((sum, o) => sum + parseAmount(o.distance || 0), 0) / orders.length).toFixed(1)} km` : '0 km')}
                subtitle=""
                color="text-[#FF7A00]"
              />
              <StatCard
                title="Avg. Time"
                value={completedDeliveriesCount === 0 ? '0 min' : (orders.length > 0 && orders[0].estimatedTime ? orders[0].estimatedTime : 'N/A')}
                subtitle=""
                color="text-[#9810FA]"
              />
            </div>

            {/* Filter Tabs (single responsive row) */}
            <div className="mb-6">
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <div className="inline-flex items-center gap-2 bg-gray-50 p-1 rounded-full whitespace-nowrap">
                  <YummyText>
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`inline-block flex-shrink-0 min-w-[88px] sm:min-w-[120px] px-3 sm:px-5 py-1 rounded-full text-sm font-normal transition-colors ${activeTab === 'all'
                        ? 'text-[#00B75A] bg-white shadow-sm'
                        : 'text-[#64748B]'
                        }`}
                    >
                      All ({orders.length})
                    </button>

                    <button
                      onClick={() => setActiveTab('express')}
                      className={`inline-block flex-shrink-0 min-w-[88px] sm:min-w-[120px] px-3 sm:px-5 py-1 rounded-full text-sm font-normal transition-colors ${activeTab === 'express'
                        ? 'text-[#00B75A] bg-white shadow-sm'
                        : 'text-[#64748B]'
                        }`}
                    >
                      Express ({expressCount})
                    </button>
                    <button
                      onClick={() => setActiveTab('nearby')}
                      className={`inline-block flex-shrink-0 min-w-[88px] sm:min-w-[120px] px-3 sm:px-5 py-1 rounded-full text-sm font-normal transition-colors ${activeTab === 'nearby'
                        ? 'text-[#00B75A] bg-white shadow-sm'
                        : 'text-[#64748B]'
                        }`}
                    >
                      Nearby ({nearbyCount})
                    </button>
                  </YummyText>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="max-h-[800px] overflow-y-auto pr-2">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D68F] mx-auto mb-4"></div>
                    <p className="text-[#64748B]">Loading available orders...</p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-6">🔍</div>
                  <div className="text-xl font-medium text-[#0F172A] mb-3">No Available Orders</div>
                  <div className="text-sm text-[#64748B] max-w-md mx-auto">
                    There are no delivery orders available in your area right now. Check back soon for new opportunities!
                  </div>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const orderId = order._id || order.id;
                  const invitedDriverId = order.invitedDriver?._id ?? order.invitedDriver;
                  const isRequestedForMe = !!invitedDriverId && !!currentRiderId && (String(invitedDriverId) === String(currentRiderId));
                  return (
                    <OrderCard
                      key={orderId}
                      deliveryId={orderId}
                      packageId={order.trackingNumber || order.id}
                      priority={order.priority}
                      smartRide={(order.deliveryType === 'smart_ride') || order.smartRide === true}
                      size={order.size || order.packageDetails?.size}
                      pickupName={order.pickupName || order.pickupAddress?.name}
                      pickupAddress={order.pickupAddress?.street || order.pickupAddress}
                      deliveryName={order.deliveryName || order.deliveryAddress?.name}
                      deliveryAddress={order.deliveryAddress?.street || order.deliveryAddress}
                      distance={order.distance || 'N/A'}
                      time={order.estimatedTimeMinutes ? `${order.estimatedTimeMinutes} min` : order.time || 'N/A'}
                      packageSize={order.packageSize || order.packageDetails?.weight || 'N/A'}
                      price={order.price || 'N/A'}
                      tips={order.tips || '0.00'}
                      onAccept={handleAcceptOrder}
                      onViewDetails={handleViewDetails}
                      onReject={handleRejectOrder}
                      accepting={accepting === orderId}
                      rejecting={rejecting}
                      isRequestedForMe={isRequestedForMe}
                    />
                  );
                })
              )}
            </div>
          </>
          )}

          {/* Details drawer (simple bottom sheet) */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-end" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
              {/* Backdrop */}
              <div onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/40" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <div className="relative w-full" style={{ maxHeight: '75vh' }}>
                <YummyText>
                  <div className="max-h-[75vh] overflow-y-auto bg-white rounded-t-2xl p-4 shadow-lg" style={{ ...sideBottomShadow, maxHeight: '75vh' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-lg font-medium text-[#0F172A]">{selectedOrder.trackingNumber || selectedOrder.id || 'Order'}</div>
                        <div className="text-sm text-[#64748B]">{selectedOrder.status || selectedOrder.state || ''}</div>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="text-[#64748B] p-2 rounded-full hover:bg-gray-100">
                        <IonIcon icon={closeOutline} />
                      </button>
                    </div>

                    {/* Map preview */}
                    <div className="mb-3 h-40 rounded-lg overflow-hidden">
                      <TrackingMap
                        pickupLocation={extractCoords(selectedOrder, 'pickup') || [3.3792, 6.5244]}
                        dropoffLocation={extractCoords(selectedOrder, 'delivery') || [3.45, 6.52]}
                      />
                    </div>

                    <div className="mb-2">
                      <span className="text-sm text-[#0F172A] font-semibold">Pickup:</span>
                      <div className="text-sm text-[#64748B] font-sm">{selectedOrder.pickupAddress?.street || selectedOrder.pickupAddress || selectedOrder.pickupName}</div>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm text-[#0F172A] font-semibold">Delivery:</span>
                      <div className="text-sm text-[#64748B] font-sm">{selectedOrder.deliveryAddress?.street || selectedOrder.deliveryAddress || selectedOrder.deliveryName}</div>
                    </div>
                    <span className="text-sm text-[#64748B] mb-2 font-semibold">Distance: </span>
                    <div className="text-sm text-[#64748B] mb-4">{selectedOrder.distance ? `${selectedOrder.distance} km` : 'N/A'}</div>

                    {/* Package Image Preview */}
                    {(() => {
                      console.log('[AvailableOrders] Full order object:', JSON.stringify(selectedOrder, null, 2));

                      // Function to extract image URL from various possible formats
                      const extractImageUrl = (value) => {
                        if (!value) return null;

                        // If it's already a string URL
                        if (typeof value === 'string') {
                          const trimmed = value.trim();
                          // Check if it looks like a URL
                          if (trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.includes('uploads') || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(trimmed)) {
                            console.log('[AvailableOrders] Found string URL:', trimmed);
                            return trimmed;
                          }
                        }

                        // If it's an object with url/path/src properties
                        if (typeof value === 'object' && value !== null) {
                          const url = value.url || value.path || value.src || value.href || value.location || value.uri;
                          if (url) {
                            console.log('[AvailableOrders] Found URL in object:', url);
                            return extractImageUrl(url);
                          }
                        }

                        // If it's an array, get the first item
                        if (Array.isArray(value) && value.length > 0) {
                          console.log('[AvailableOrders] Found array, extracting first item');
                          return extractImageUrl(value[0]);
                        }

                        return null;
                      };

                      // List of all possible field names to check
                      const fieldCandidates = [
                        // Direct fields
                        'image', 'images', 'img', 'photo', 'picture',
                        'packageImage', 'package_image', 'packageImg',
                        'imageUrl', 'image_url', 'imgUrl', 'img_url',
                        // Nested in packageDetails
                        'packageDetails', 'package_details',
                        // Nested in package
                        'package', 'pkg',
                        // Nested in payload/data
                        'payload', 'data',
                        // Media fields
                        'media', 'file', 'attachment'
                      ];

                      let imageUrl = null;

                      // First pass: Check direct fields
                      for (const field of fieldCandidates) {
                        if (selectedOrder[field]) {
                          console.log(`[AvailableOrders] Checking field '${field}':`, selectedOrder[field]);
                          imageUrl = extractImageUrl(selectedOrder[field]);
                          if (imageUrl) break;

                          // If field is an object, check its nested image properties
                          if (typeof selectedOrder[field] === 'object' && selectedOrder[field] !== null) {
                            const nested = selectedOrder[field];
                            for (const nestedField of ['image', 'images', 'img', 'photo', 'picture', 'imageUrl', 'image_url']) {
                              if (nested[nestedField]) {
                                console.log(`[AvailableOrders] Checking nested '${field}.${nestedField}':`, nested[nestedField]);
                                imageUrl = extractImageUrl(nested[nestedField]);
                                if (imageUrl) break;
                              }
                            }
                            if (imageUrl) break;
                          }
                        }
                      }

                      // Second pass: Deep scan all properties for URLs
                      if (!imageUrl) {
                        console.log('[AvailableOrders] No direct image found, deep scanning...');
                        const urlPattern = /^(https?:\/\/|\/|\.\.\/|uploads\/|images\/).*\.(jpg|jpeg|png|gif|webp|svg)/i;
                        const partialPattern = /(uploads|images|media|cdn|s3|cloudinary|imgbb|imgur).*\.(jpg|jpeg|png|gif|webp|svg)/i;

                        const deepScan = (obj, path = '') => {
                          if (!obj || typeof obj !== 'object') return null;

                          for (const [key, value] of Object.entries(obj)) {
                            const currentPath = path ? `${path}.${key}` : key;

                            if (typeof value === 'string') {
                              const trimmed = value.trim();
                              if (urlPattern.test(trimmed) || partialPattern.test(trimmed)) {
                                console.log(`[AvailableOrders] Found URL in deep scan at '${currentPath}':`, trimmed);
                                return trimmed;
                              }
                            } else if (Array.isArray(value)) {
                              for (let i = 0; i < value.length; i++) {
                                const found = deepScan(value[i], `${currentPath}[${i}]`);
                                if (found) return found;
                              }
                            } else if (typeof value === 'object' && value !== null) {
                              const found = deepScan(value, currentPath);
                              if (found) return found;
                            }
                          }
                          return null;
                        };

                        imageUrl = deepScan(selectedOrder);
                      }

                      if (imageUrl) {
                        console.log('[AvailableOrders] ✅ Final image URL:', imageUrl);
                        return (
                          <div className="mb-4">
                            <div className="text-xs font-medium text-[#0F172A] mb-2">Package Image</div>
                            <div className="w-full h-56 rounded-xl overflow-hidden bg-gray-100 border-2 border-[#00B75A]">
                              <img
                                src={imageUrl}
                                alt="Package"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('[AvailableOrders] Image failed to load:', imageUrl);
                                  e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-red-500">Failed to load image</div>';
                                }}
                              />
                            </div>
                          </div>
                        );
                      }

                      console.log('[AvailableOrders] ❌ No image found in order');
                      return (
                        <div className="mb-4">
                          <div className="text-xs font-medium text-[#0F172A] mb-2">Package Image</div>
                          <div className="w-full h-56 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                            <div className="text-center px-4">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#CBD5E1" />
                              </svg>
                              <p className="text-xs text-[#94A3B8]">No package image uploaded</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Package Description */}
                    {(() => {
                      const description = selectedOrder.packageDescription ||
                        selectedOrder.description ||
                        selectedOrder.notes ||
                        selectedOrder.specialInstructions ||
                        selectedOrder.packageDetails?.description ||
                        selectedOrder.package?.description;

                      if (description && description.trim()) {
                        return (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="text-xs font-medium text-[#0F172A] mb-1">Package Description</div>
                            <div className="text-sm text-[#64748B] leading-relaxed">{description}</div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="mt-4 flex gap-3">
                      <button onClick={() => { handleAcceptOrder(selectedOrder._id || selectedOrder.id); setSelectedOrder(null); }} className="flex-1 bg-[#00B75A] hover:bg-[#00B876] text-white py-2 rounded-full transition-colors font-[400]">
                        Accept Order
                      </button>
                      <button onClick={() => setSelectedOrder(null)} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-full !border-2 !border-[#0F172A] transition-colors text-[#0F172A] font-[400] py-2">
                        Close
                      </button>
                    </div>
                  </div>
                </YummyText>
              </div>
            </div>
          )}

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
            color={toastMsg.includes('✅') ? 'success' : toastMsg.includes('Failed') ? 'danger' : 'primary'}
          />
          <ToastComponent />
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default AvailableOrders;