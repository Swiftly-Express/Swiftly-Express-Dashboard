import React, { useState, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import { IonPage, IonContent, IonToast, IonRefresher, IonRefresherContent, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import BanIcon from '../../../icons/Banicon';
import TrackingMap from '../../../components/TrackingMap';
import { getAvailableJobs, acceptDeliveryJob, getRiderProfile, getRiderDeliveries } from '../../../utils/authApi';
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
  accepting
}) => (
  <div id={`order-${deliveryId}`} className="bg-white rounded-2xl p-4 sm:p-6 mb-4" style={sideBottomShadow}>
    <YummyText>
      <div className="flex flex-col sm:flex-row items-start sm:justify-between mb-4">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="text-lg font-normal text-[#0F172A]">{packageId}</div>
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
        <button onClick={() => onViewDetails && onViewDetails(deliveryId)} className="w-full sm:flex-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-[#0F172A] font-[400] py-2" style={{ border: "1px solid #0000001A" }}>
          View Details
        </button>
      </div>
    </YummyText>
  </div>
);

const AvailableOrders = () => {
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
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [selectedOrder, setSelectedOrder] = useState(null);
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

      setToastMsg('Order accepted successfully!');
      setShowToast(true);

      // Remove order from local list by matching on canonical id or the original id
      setOrders(prev => prev.filter(order => {
        const oid = order._id || order.id || order.deliveryId;
        return !(String(oid) === String(acceptedId) || String(oid) === String(deliveryId));
      }));

      // Dispatch accepted event including delivery type and order payload so other clients can react
      const acceptedDetail = { deliveryId: acceptedId, deliveryType: acceptedOrder?.deliveryType || acceptedOrder?.type || null, order: acceptedOrder || respDelivery || null };
      window.dispatchEvent(new CustomEvent('delivery:accepted', { detail: acceptedDetail }));

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

  const handleViewDetails = (deliveryId) => {
    // Scroll the card into view so rider doesn't lose context
    const el = document.getElementById(`order-${deliveryId}`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const order = orders.find(o => (o._id || o.id) === deliveryId || o.id === deliveryId || o._id === deliveryId);
    if (order) setSelectedOrder(order);
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'express') return order.priority === 'Express';
    if (activeTab === 'nearby') return parseFloat(order.distance) <= 2.5;
    return true;
  });

  const expressCount = orders.filter(o => o.priority === 'Express').length;
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
                value={completedDeliveriesCount === 0 ? '₦0.00' : `₦${(orders.reduce((sum, order) => sum + parseAmount(order.amount || order.price || 0), 0)).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                      All Orders ({orders.length})
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
                      className={`inline-block flex-shrink-0 min-w-[8px] sm:min-w-[120px] px-3 sm:px-5 py-1 rounded-full text-sm font-normal transition-colors ${activeTab === 'nearby'
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
                filteredOrders.map((order) => (
                  <OrderCard
                    key={order._id || order.id}
                    deliveryId={order._id || order.id}
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
                    accepting={accepting === (order._id || order.id)}
                  />
                ))
              )}
            </div>
          </>
          )}

          {/* Details drawer (simple bottom sheet) */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-end">
              {/* Backdrop */}
              <div onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/40" />
              <div className="relative w-full">
                <div className="max-h-[75vh] overflow-y-auto bg-white rounded-t-2xl p-4 shadow-lg" style={sideBottomShadow}>
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

                  <div className="text-sm text-[#0F172A] mb-2">Pickup: {selectedOrder.pickupAddress?.street || selectedOrder.pickupAddress || selectedOrder.pickupName}</div>
                  <div className="text-sm text-[#0F172A] mb-2">Delivery: {selectedOrder.deliveryAddress?.street || selectedOrder.deliveryAddress || selectedOrder.deliveryName}</div>
                  <div className="text-sm text-[#64748B] mb-2">Distance: {selectedOrder.distance || 'N/A'}</div>

                  {/* Calculated route distance + Potential earnings breakdown */}
                  {(() => {
                    const pickupCoords = extractCoords(selectedOrder, 'pickup');
                    const deliveryCoords = extractCoords(selectedOrder, 'delivery');
                    const calculatedKm = calculateHaversineKm(pickupCoords, deliveryCoords);

                    const base = parseFloat(selectedOrder.price || selectedOrder.amount || 0) || 0;
                    const tips = parseFloat(selectedOrder.tips || selectedOrder.tip || 0) || 0;
                    const total = base + tips;

                    return (
                      <div className="mb-2">
                        {calculatedKm ? (
                          <div className="text-sm text-[#64748B] mb-1">Calculated route distance: {calculatedKm.toFixed(1)} km</div>
                        ) : null}

                        <div className="text-xs text-[#64748B]">Potential earnings</div>
                        <div className="text-lg font-medium text-[#00D68F]">₦{total.toFixed(2)}</div>
                        <div className="text-xs text-[#94A3B8]">Breakdown: ₦{base.toFixed(2)} base {tips > 0 ? `+ ₦${tips.toFixed(2)} tips` : ''}</div>
                        {completedDeliveriesCount === 0 && (
                          <div className="text-xs text-[#64748B] mt-1">Note: Potential Earnings remains 0 until you complete your delivery.</div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="text-sm text-[#64748B] mb-2">Price: {selectedOrder.price || selectedOrder.amount || 'N/A'}</div>
                  <div className="mt-3 text-xs text-[#64748B]">{selectedOrder.specialInstructions || selectedOrder.notes || selectedOrder.packageDescription || ''}</div>

                  <div className="mt-4 flex gap-3">
                    <button onClick={() => { handleAcceptOrder(selectedOrder._id || selectedOrder.id); setSelectedOrder(null); }} className="flex-1 bg-[#00B75A] hover:bg-[#00B876] text-white py-2 rounded-lg transition-colors font-[400]">
                      Accept Order
                    </button>
                    <button onClick={() => setSelectedOrder(null)} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-[#0F172A] font-[400] py-2">
                      Close
                    </button>
                  </div>
                </div>
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
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default AvailableOrders;