import React, { useState, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import { IonPage, IonContent } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import BlockIcon from "../../../icons/Blockicon";
import NairaIcon from "../../../icons/Nairaicon";
import AnalyticsIcon from "../../../icons/Analyticsicon";
import VerificationPromptModal from '../components/VerificationPromptModal';
import { getRiderProfile, getRiderDeliveries, getAvailableJobs, getRiderEarnings, getRiderVerificationStatus, acceptDeliveryJob, updateDeliveryStatus, updateDriverLocation } from '../../../utils/authApi';
import socketService from '../../../services/socket.service';
import CheckCircleIcon from '../../../icons/Circlecheck';
import { getCookie, setCookie, getJSONCookie } from '../../../utils/cookies';
import { playNotificationSound } from '../../../utils/notificationSound';

// Shadow only on left, right and bottom - no top shadow for seamless blend
const sideBottomShadow = {
  boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

export const shouldShowVerificationModal = () => {
  const isVerified = getCookie('riderAccountVerified') === 'true';
  if (isVerified) return false;

  const lastShown = getCookie('lastVerificationModalShownAt');
  if (!lastShown) return true;

  const hoursSince =
    (Date.now() - Number(lastShown)) / (1000 * 60 * 60);

  // Show at most once every 24 hours
  return hoursSince >= 24;
};

export const markVerificationModalShown = () => {
  setCookie(
    'lastVerificationModalShownAt',
    Date.now().toString(),
    1
  );
};

const StatCard = ({ icon, title, value, subtitle, iconBg }) => (
  <div className="bg-white rounded-xl p-3 md:p-5" style={sideBottomShadow}>
    <div className="flex items-start justify-between mb-10">
      <div className="text-xs text-[#4A5565] mt-2.5">{title}</div>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className="text-[29px] font-normal text-[#0F172A] mb-1">{value}</div>
    <div className="text-[11px] text-[#64748B] leading-none">{subtitle}</div>
  </div>
);

const DeliveryCard = ({ packageId, status, from, to, customer, price, distance, time, statusColor, deliveryId, deliveryRaw, onStatusUpdated }) => {
  const [contactOpen, setContactOpen] = useState(false);
  const router = useIonRouter();

  // Robust phone extractor for dashboard card
  const findPhone = (obj) => {
    if (!obj) return null;
    const get = (o, path) => {
      try {
        return path.split('.').reduce((a, b) => (a && a[b] !== undefined) ? a[b] : null, o);
      } catch (e) { return null; }
    };

    const candidates = ['senderPhone', 'recipientPhone', 'customerPhone', 'phone', 'contact', 'fromPhone', 'toPhone', 'payload.senderPhone', 'payload.recipientPhone', 'order.senderPhone', 'order.recipientPhone'];
    for (const p of candidates) {
      const v = get(obj, p);
      if (v && /[0-9]/.test(String(v))) return String(v).trim();
    }

    // recursive scan for keys with 'phone' or 'contact'
    const seen = new Set();
    const keyHint = /(phone|contact)/i;
    const phoneRegex = /[0-9]/;
    const scan = (o) => {
      if (!o || typeof o !== 'object' || seen.has(o)) return null;
      seen.add(o);
      for (const k of Object.keys(o)) {
        try {
          const v = o[k];
          if (!v) continue;
          if (typeof v === 'string' || typeof v === 'number') {
            const s = String(v).trim();
            if (keyHint.test(k) && phoneRegex.test(s)) return s;
          } else if (typeof v === 'object') {
            const nested = scan(v);
            if (nested) return nested;
          }
        } catch (e) { }
      }
      return null;
    };
    return scan(obj) || null;
  };

  const handleNavigate = () => {
    try {
      // Navigate to Active Deliveries and include hash so ActiveDeliveries can scroll into view
      router.push(`/rider/active#delivery-${deliveryId}`, 'forward', 'push');
    } catch (e) {
      window.location.href = `/rider/active#delivery-${deliveryId}`;
    }
  };

  const cleanNumber = (v) => typeof v === 'string' ? v.replace(/[^0-9+]/g, '') : (v ? String(v).replace(/[^0-9+]/g, '') : '');

  const handleCall = () => {
    const raw = findPhone(deliveryRaw) || deliveryRaw?.phone || deliveryRaw?.contact || '';
    const num = cleanNumber(raw);
    if (!num) return alert('Phone number not available');
    try {
      window.location.href = `tel:${num}`;
    } catch (e) {
      try { navigator.clipboard.writeText(num); alert(`Phone copied: ${num}`); } catch (er) { alert(num); }
    }
  };

  const handleMessage = () => {
    const raw = findPhone(deliveryRaw) || deliveryRaw?.phone || deliveryRaw?.contact || '';
    const num = cleanNumber(raw);
    if (!num) return alert('Phone number not available');
    window.open(`https://wa.me/${num.replace(/^\+/, '')}`, '_blank');
  };

  const handleUpdate = async () => {
    try {
      const statusLower = (status || '').toLowerCase();
      let newStatus = 'picked-up';
      if (statusLower.includes('assigned') || statusLower.includes('pending')) newStatus = 'picked-up';
      else if (statusLower.includes('picked')) newStatus = 'in-transit';
      else if (statusLower.includes('transit') || statusLower.includes('in-transit')) newStatus = 'delivered';

      // Backend usually requires currentLocation; mirror ActiveDeliveries behavior to request geolocation
      let location = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
          });
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (err) {
          console.warn('[Dashboard] Geolocation failed for status update:', err);
        }
      }

      const payload = location ? { status: newStatus, currentLocation: location } : { status: newStatus };

      await updateDeliveryStatus(deliveryId, payload);
      if (onStatusUpdated) onStatusUpdated();
    } catch (e) {
      console.error('[Dashboard] Failed to update status:', e);
      alert('Failed to update status. Try again.');
    }
  };

  const isCompleted = (status || '').toLowerCase().includes('deliver') || (status || '').toLowerCase().includes('completed');

  return (
    <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] rounded-2xl p-3 md:p-5 mb-4">
      <YummyText>
        <div className="flex items-start justify-between -mb-4">
          <div className="flex items-center gap-3">
            <div className="text-base font-normal text-[#0F172A]">{packageId}</div>
            <span className={`px-3 py-1 rounded-full text-xs font-normal ${statusColor}`}>
              {status}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xl font-sm text-[#00A63E]">{price}</div>
            <div className="text-xs text-[#64748B]">{distance} · {time}</div>
          </div>
        </div>

        <div className="space-y-1 mb-4">
          <div className="text-xs text-[#0F172A]">From: <span className="text-[#0F172A]">{from}</span></div>
          <div className="text-xs text-[#0F172A]">To: <span className="text-[#0F172A]">{to}</span></div>
          <div className="text-xs text-[#0F172A]">Customer: <span className="text-[#0F172A]">{customer}</span></div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center relative">
          <button onClick={handleNavigate} className="w-full md:flex-1 bg-[#00B75A] text-sm hover:bg-[#00B876] text-medium text-white py-2 rounded-xl transition-colors font-[400]">
            Navigate
          </button>

          <div className="relative w-full md:w-auto">
            <button onClick={() => setContactOpen(v => !v)} className="w-full md:flex-1 py-2 bg-white text-sm hover:bg-[#FFFFFF] rounded-xl transition-colors text-[#0A0A0A] font-[400]" style={{ border: "1px solid #0000001A" }}>
              Contact Customer
            </button>
            {contactOpen && (
              <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-lg z-50 w-40" style={{ border: '1px solid #E5E7EB' }}>
                <button onClick={() => { setContactOpen(false); handleCall(); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Call</button>
                <button onClick={() => { setContactOpen(false); handleMessage(); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Message</button>
              </div>
            )}
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <button onClick={handleUpdate} className="w-full md:w-auto px-3 py-2 bg-white text-sm hover:bg-[#FFFFFF] rounded-xl transition-colors text-[#0A0A0A] font-[400]" style={{ border: "1px solid #0000001A" }}>
              Update Status
            </button>
            {isCompleted && (
              <div className="ml-2">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            )}
          </div>
        </div>
      </YummyText>
    </div>
  );
};

const AvailableOrderCard = ({ packageId, location, distance, price, onAccept }) => (
  <YummyText>
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl mb-3">
      <div className="mb-3 md:mb-0">
        <div className="text-base font-normal text-[#0F172A]">{packageId}</div>
        <div className="text-sm text-[#64748B] mb-0.5">{location}</div>
        <div className="text-xs text-[#94A3B8]">{distance}</div>
      </div>
      <div className="w-full md:w-auto flex items-center gap-3 md:gap-4">
        <div className="text-lg font-normal text-[#00A63E]">{price}</div>
        <button onClick={() => onAccept && onAccept()} className="w-full md:w-auto bg-[#00B75A] hover:bg-[#00B876] text-white text-sm px-4 py-2.5 rounded-lg transition-colors font-nmedium">
          Accept
        </button>
      </div>
    </div>
  </YummyText>
);

const Dashboard = () => {
  const router = useIonRouter();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [userName, setUserName] = useState(() => {
    // Initialize from cookies immediately
    const cachedUserData = getJSONCookie('user_data');
    if (cachedUserData) {
      try {
        const name = cachedUserData.fullName || `${cachedUserData.firstName || ''} ${cachedUserData.lastName || ''}`.trim();
        return name || 'Rider';
      } catch (e) {
        return 'Rider';
      }
    }
    return 'Rider';
  });
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayCompleted: 0,
    todayPending: 0,
    todayEarnings: '0.00',
    weeklyEarnings: '0.00',
    weeklyDeliveries: 0,
    avgDeliveryTime: '0'
  });
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // When rejected modal is shown, fetch verification details to display admin feedback
  useEffect(() => {
    if (!showRejectedModal) return;
    let cancelled = false;
    getRiderVerificationStatus()
      .then((res) => {
        if (cancelled) return;
        const verification = res?.data?.verification || res?.verification;
        const notes = verification?.adminNotes;
        setRejectionFeedback(notes && String(notes).trim() ? String(notes).trim() : '');
      })
      .catch(() => {
        if (!cancelled) setRejectionFeedback('');
      });
    return () => { cancelled = true; };
  }, [showRejectedModal]);

  // Check verification status - extracted outside useEffect so it can be called from event listeners
  const checkVerificationStatus = async () => {
    try {
      console.log('[Dashboard] 🔍 Starting verification check...');

      // Force a fresh fetch by bypassing cache
      const profileRes = await getRiderProfile();

      console.log('[Dashboard] 📦 Raw API Response:', JSON.stringify(profileRes, null, 2));

      // CRITICAL FIX: Verification is at profileRes.data.verification, NOT profile.verification
      const data = profileRes?.data || profileRes;
      const profile = data?.user || data;
      const verification = data?.verification || profile?.verification;

      // Get verification status from multiple possible locations
      const verificationStatus = verification?.verificationStatus || profile?.verificationStatus || '';

      console.log('[Dashboard] ✅ Extracted verification object:', verification);
      console.log('[Dashboard] 🎯 Extracted verification status:', verificationStatus);

      // Handle empty string case and normalize to lowercase
      const statusLower = verificationStatus ? verificationStatus.toString().toLowerCase().trim() : '';

      console.log('[Dashboard] 🔤 Normalized status (lowercase):', statusLower);

      // CASE 1: APPROVED status - Never show modal
      if (statusLower === 'approved' || statusLower === 'verified') {
        console.log('[Dashboard] ✅✅✅ RIDER IS APPROVED/VERIFIED ✅✅✅');
        console.log('[Dashboard] → Setting riderAccountVerified cookie to TRUE');
        console.log('[Dashboard] → HIDING modal permanently');

        setCookie('riderVerificationStatus', statusLower, 7);
        setCookie('riderAccountVerified', 'true', 7);
        setShowVerificationModal(false);
        return true; // Return true to indicate verified
      }

      // CASE 2: No verification object at all - Rider hasn't started verification
      if (!verification || verification === null) {
        console.log('[Dashboard] ❌ No verification object (null/undefined)');
        console.log('[Dashboard] → Rider has NOT started verification yet');
        console.log('[Dashboard] → Setting riderAccountVerified cookie to FALSE');
        console.log('[Dashboard] → SHOWING modal in 2 seconds');

        setCookie('riderVerificationStatus', '', 7);
        setCookie('riderAccountVerified', 'false', 7);
        setTimeout(() => {
          console.log('[Dashboard] ⏰ 2 seconds elapsed, showing modal now');
          setShowVerificationModal(true);
        }, 2000);
        return false;
      }

      // CASE 3: Verification object exists but status is pending/incomplete/rejected
      if (!statusLower || statusLower === 'pending' || statusLower === 'incomplete' || statusLower === 'rejected') {
        console.log('[Dashboard] ⚠️ Verification status is NOT approved:', statusLower || '(empty string)');
        console.log('[Dashboard] → Setting riderAccountVerified cookie to FALSE');
        console.log('[Dashboard] → SHOWING modal in 2 seconds');

        // If explicitly rejected by admin, clear the local submitted flag so the rider can re-submit
        try {
          if (statusLower === 'rejected') {
            setCookie('verificationSubmitted', '', -1);
            // Show a modal informing the rider of rejection unless they've dismissed it before
            const dismissed = getCookie('verificationRejectedDismissed');
            if (!dismissed) setShowRejectedModal(true);
          }
        } catch (e) { /* ignore */ }

        setCookie('riderVerificationStatus', statusLower, 7);
        setCookie('riderAccountVerified', 'false', 7);
        setTimeout(() => {
          console.log('[Dashboard] ⏰ 2 seconds elapsed, showing modal now');
          setShowVerificationModal(true);
        }, 2000);
        return false;
      }

      // CASE 4: Any other status → hide modal (defensive fallback)
      console.log('[Dashboard] ⚠️ Unknown verification status:', statusLower);
      console.log('[Dashboard] → HIDING modal (defensive fallback)');

      setCookie('riderVerificationStatus', statusLower, 7);
      setShowVerificationModal(false);
      return false;
    } catch (e) {
      console.error('[Dashboard] ❌ ERROR fetching verification status:', e);
      console.error('[Dashboard] Error details:', e.message, e.stack);

      // If error and user is new, show modal
      const hasEverSubmitted = getCookie('verificationSubmitted') === 'true';
      if (!hasEverSubmitted) {
        setTimeout(() => {
          setShowVerificationModal(true);
        }, 2000);
      } else {
        setShowVerificationModal(false);
      }
      return false;
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchDashboardData();

    // Check verification status on mount
    checkVerificationStatus();

    // Listen for verification completion to close modal and refresh status
    const handleVerificationComplete = async () => {
      // Close modal immediately
      setShowVerificationModal(false);

      // Clear any old cached verification status
      setCookie('riderAccountVerified', '', -1); // Delete the cookie
      setCookie('riderVerificationStatus', '', -1); // Delete the cookie

      console.log('[Dashboard] → Cleared verification cookies');

      // Wait a moment to ensure backend has updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh profile to get latest verification status
      console.log('[Dashboard] → Fetching fresh profile data...');
      const isVerified = await checkVerificationStatus();

      if (isVerified) {
        console.log('[Dashboard] ✅ Verification check confirms: USER IS NOW VERIFIED!');
      } else {
        console.log('[Dashboard] ⚠️ Verification check: User still not verified');
      }
    };

    window.addEventListener('verification:completed', handleVerificationComplete);

    // Also listen for kyc:updated event from admin
    const handleKYCUpdate = async (event) => {
      console.log('[Dashboard] 🔔 kyc:updated event received:', event?.detail);
      if (event?.detail?.action === 'approved') {
        console.log('[Dashboard] → KYC was APPROVED, refreshing verification status');
        await handleVerificationComplete();
      }
    };

    window.addEventListener('kyc:updated', handleKYCUpdate);

    // Refresh dashboard when deliveries change elsewhere in the app
    const handleDeliveryEvent = (event) => {
      fetchDashboardData();
    };

    window.addEventListener('delivery:accepted', handleDeliveryEvent);
    window.addEventListener('delivery:statusChanged', handleDeliveryEvent);
    window.addEventListener('delivery:updated', handleDeliveryEvent);
    window.addEventListener('delivery:completed', handleDeliveryEvent);

    // Socket: listen for new jobs and customer requests
    socketService.connect();

    const handleNewJob = (data) => {
      console.log('[Dashboard] 🔔 New job available (socket):', data);
      
      // Play notification sound IMMEDIATELY
      playNotificationSound().catch(e => console.warn('Sound play failed:', e));
      
      // Refresh dashboard to show new available job
      fetchDashboardData();
    };

    const handleInvitation = (data) => {
      console.log('[Dashboard] 🔔 Customer requested you (socket):', data);
      
      // Play notification sound IMMEDIATELY
      playNotificationSound().catch(e => console.warn('Sound play failed:', e));
      
      // Refresh dashboard to show invitation
      fetchDashboardData();
    };

    socketService.on('delivery:new', handleNewJob);
    socketService.on('job:available', handleNewJob);
    socketService.on('delivery:invitation', handleInvitation);

    return () => {
      window.removeEventListener('verification:completed', handleVerificationComplete);
      window.removeEventListener('kyc:updated', handleKYCUpdate);
      window.removeEventListener('delivery:accepted', handleDeliveryEvent);
      window.removeEventListener('delivery:statusChanged', handleDeliveryEvent);
      window.removeEventListener('delivery:updated', handleDeliveryEvent);
      window.removeEventListener('delivery:completed', handleDeliveryEvent);

      try {
        socketService.off('delivery:new', handleNewJob);
        socketService.off('job:available', handleNewJob);
        socketService.off('delivery:invitation', handleInvitation);
      } catch (e) { }
    };
  }, []);

  // Update driver location periodically so customers see nearby riders and ETA (every 25s when on dashboard)
  useEffect(() => {
    if (!navigator.geolocation) return;
    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          updateDriverLocation(lat, lng).catch(() => { });
        },
        () => { },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };
    sendLocation();
    const interval = setInterval(sendLocation, 25000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await getRiderProfile();
      const profile = response?.data?.driver || response?.driver || response?.data;

      if (profile) {
        const name = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        if (name) {
          setUserName(name);
        }
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch profile:', error);
      // Fallback to cookies
      const userData = getJSONCookie('user_data');
      if (userData) {
        try {
          const name = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          if (name) setUserName(name);
        } catch (e) {
          console.error('[Dashboard] Failed to parse user data:', e);
        }
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [deliveriesRes, ordersRes, earningsRes] = await Promise.all([
        getRiderDeliveries(1, 10).catch(err => ({ data: { deliveries: [] } })),
        getAvailableJobs(1, 5).catch(err => ({ data: { jobs: [] } })),
        getRiderEarnings().catch(err => ({ data: {} }))
      ]);

      // Process deliveries
      const deliveries = deliveriesRes?.data?.deliveries || deliveriesRes?.deliveries || [];
      const activeOnly = deliveries.filter(d =>
        d.status !== 'delivered' && d.status !== 'cancelled'
      );
      setActiveDeliveries(activeOnly.slice(0, 3));

      // Process available orders (use full real data from API)
      const orders = ordersRes?.data?.jobs || ordersRes?.jobs || ordersRes?.data || [];
      setAvailableOrders(orders);

      // Process earnings and stats
      const earnings = earningsRes?.data || earningsRes;
      const todayEarnings = earnings?.today?.total || earnings?.todayEarnings || 0;
      const weeklyEarnings = earnings?.weekly?.total || earnings?.weeklyEarnings || 0;
      const todayDeliveries = earnings?.today?.count || deliveries.filter(d => {
        const deliveryDate = new Date(d.createdAt);
        const today = new Date();
        return deliveryDate.toDateString() === today.toDateString();
      }).length || 0;

      const todayCompleted = deliveries.filter(d => {
        const deliveryDate = new Date(d.createdAt);
        const today = new Date();
        return deliveryDate.toDateString() === today.toDateString() && d.status === 'delivered';
      }).length || 0;

      const todayPending = todayDeliveries - todayCompleted;
      const weeklyDeliveries = earnings?.weekly?.count || 0;
      const avgTime = earnings?.averageDeliveryTime || '0';

      setStats({
        todayDeliveries,
        todayCompleted,
        todayPending,
        todayEarnings: todayEarnings.toFixed(2),
        weeklyEarnings: weeklyEarnings.toFixed(2),
        weeklyDeliveries,
        avgDeliveryTime: avgTime
      });

      console.log('[Dashboard] Fetched data:', { deliveries: deliveries.length, orders: orders.length, stats });
    } catch (error) {
      console.error('[Dashboard] Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.zipCode) parts.push(addr.zipCode);
    const joined = parts.filter(Boolean).join(', ');
    return joined || 'N/A';
  };

  const handleCloseModal = () => {
    setShowVerificationModal(false);
  };

  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-padding">
          {/* Welcome Section */}
          <YummyText>
            <div className="mb-6 py-2">
              <div className="text-2xl md:text-3xl font-medium text-[#0F172A] mb-2">
                Welcome back, {userName}!
              </div>
              <div className="text-[#4A5565] text-[14px] font-[400]">
                You're doing great today. Keep up the excellent work!
              </div>
            </div>
          </YummyText>

          {/* Verification rejected notice (glassmorphism modal) */}
          {showRejectedModal && (
            <YummyText>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40" style={{ backdropFilter: 'blur(6px)' }} />
                <div className="relative bg-white bg-opacity-80 rounded-3xl shadow-2xl max-w-md w-full p-6 z-60" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2">Verification Rejected</h3>
                    <p className="text-sm text-[#4A5565]">Your verification application was rejected by our team. Please review the feedback and resubmit your documents.</p>
                    {rejectionFeedback ? (
                      <p className="text-sm text-[#0F172A] mt-3 text-left bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <span className="font-medium text-[#64748B]">Feedback: </span>{rejectionFeedback}
                      </p>
                    ) : null}
                    {rejectionFeedback && (
                      <p className="text-xs text-[#64748B] mt-2">Use the feedback above to improve your application.</p>
                    )}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setShowRejectedModal(false);
                        setShowVerificationModal(true);
                      }}
                      className="flex-1 bg-[#00B75A] hover:bg-[#00A850] text-white py-2 rounded-full transition-colors"
                    >
                      Resubmit Documents
                    </button>
                    <button
                      onClick={() => {
                        try { setCookie('verificationRejectedDismissed', 'true', 30); } catch (e) { }
                        setShowRejectedModal(false);
                      }}
                      className="flex-1 bg-white border border-gray-200 py-2 rounded-full transition-colors"
                    >
                      Don't show again
                    </button>
                  </div>
                </div>
              </div>
            </YummyText>
          )}

          {/* Stats Grid */}
          <YummyText>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<BlockIcon width={24} height={24} stroke="#007BFF" />}
                iconBg="bg-[#EFF6FF]"
                title="Today's Deliveries"
                value={loading ? '...' : stats.todayDeliveries.toString()}
                subtitle={loading ? 'Loading...' : `${stats.todayCompleted} completed, ${stats.todayPending} pending`}
              />
              <StatCard
                icon={<NairaIcon size={24} color="#00C950" />}
                iconBg="bg-green-50"
                title="Today's Earnings"
                value={loading ? '...' : `₦${stats.todayEarnings}`}
                subtitle={loading ? 'Loading...' : 'Today\'s total'}
              />
              <StatCard
                icon={<AnalyticsIcon width={24} height={24} stroke="#FF8C00" />}
                iconBg="bg-orange-50"
                title="This Week"
                value={loading ? '...' : `₦${stats.weeklyEarnings}`}
                subtitle={loading ? 'Loading...' : `${stats.weeklyDeliveries} deliveries completed`}
              />
              <StatCard
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#8B5CF6" />
                  </svg>
                }
                iconBg="bg-purple-50"
                title="Avg. Delivery Time"
                value={loading ? '...' : `${stats.avgDeliveryTime} min`}
                subtitle="Average delivery time"
              />
            </div>
          </YummyText>

          {/* Active Deliveries */}
          <div className="mb-8 bg-white p-4 md:p-6 rounded-2xl" style={sideBottomShadow}>
            <YummyText>
              <div className="mb-4">
                <div className="text-xl font-normal text-[#0F172A] mb-0">
                  Active Deliveries
                </div>
                <div className="text-sm text-[#64748B]">
                  Deliveries currently in progress
                </div>
              </div>
            </YummyText>

            <div className="md:max-h-[600px] md:overflow-y-auto pr-0 md:pr-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading active deliveries...</div>
              ) : activeDeliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm md:text-medium sm:text-medium">No active deliveries at the moment</div>
              ) : (
                activeDeliveries.map((delivery) => {
                  const statusColors = {
                    'picked_up': 'bg-blue-100 text-blue-600',
                    'in_transit': 'bg-blue-100 text-blue-600',
                    'pending': 'bg-orange-100 text-orange-600',
                    'accepted': 'bg-green-100 text-green-600',
                    'assigned': 'bg-gray-100 text-gray-600'
                  };

                  return (
                    <DeliveryCard
                      key={delivery._id || delivery.id}
                      deliveryId={delivery._id || delivery.id}
                      deliveryRaw={delivery}
                      packageId={delivery.trackingNumber || delivery.deliveryId || 'N/A'}
                      status={delivery.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                      statusColor={statusColors[delivery.status] || 'bg-gray-100 text-gray-600'}
                      from={formatAddress(delivery.pickupAddress || delivery.pickup?.address)}
                      to={formatAddress(delivery.deliveryAddress || delivery.dropoff?.address)}
                      customer={delivery.customerName || delivery.customer?.name || 'Customer'}
                      price={`₦${delivery.amount?.toFixed(2) || delivery.price?.toFixed(2) || '0.00'}`}
                      distance={delivery.distance ? `${delivery.distance} km` : 'N/A'}
                      time={delivery.estimatedTime || 'N/A'}
                      onStatusUpdated={fetchDashboardData}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Available Orders Nearby */}
          <div className="mb-8 bg-white p-4 md:p-6 rounded-2xl" style={sideBottomShadow}>
            <YummyText>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-medium text-[#0F172A] -mb-1">
                    Available Orders Nearby
                  </div>
                  <div className="text-sm md:text-medium sm:text-medium text-gray-500 font-[400]">
                    Orders you can accept right now
                  </div>
                </div>
                <button onClick={() => { try { router.push('/rider/available', 'forward', 'push'); } catch (e) { window.location.href = '/rider/available'; } }} className="text-[#007BFF] text-sm font-medium">
                  View All
                </button>
              </div>
            </YummyText>

            {/* Make available orders list scrollable independently */}
            <div className="md:max-h-[360px] md:overflow-y-auto pr-0 md:pr-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading available orders...</div>
              ) : availableOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm md:text-medium sm:text-medium">No available orders nearby</div>
              ) : (
                availableOrders.map((order) => (
                  <AvailableOrderCard
                    key={order._id || order.id}
                    packageId={order.trackingNumber || order.deliveryId || 'N/A'}
                    location={formatAddress(order.pickupAddress || order.pickup?.address)}
                    distance={order.distance ? `${order.distance} km away` : 'N/A'}
                    price={`₦${order.amount?.toFixed(2) || order.price?.toFixed(2) || '0.00'}`}
                    onAccept={async () => {
                      try {
                        const acceptResp = await acceptDeliveryJob(order._id || order.id || order.deliveryId);
                        console.log('[Dashboard] Accepted order from dashboard:', acceptResp);

                        // Extract canonical delivery object from response
                        const respDelivery = acceptResp?.data?.delivery || acceptResp?.data || acceptResp;
                        const acceptedId = respDelivery?._id || respDelivery?.id || order._id || order.id || order.deliveryId;

                        // Remove accepted order from local availableOrders list
                        try {
                          setAvailableOrders(prev => prev.filter(o => (o._id || o.id || o.deliveryId) !== acceptedId));
                        } catch (e) { /* ignore */ }

                        // Dispatch a more detailed delivery:accepted event so other components (and local listeners) can act
                        const acceptedDetail = { deliveryId: acceptedId, deliveryType: respDelivery?.deliveryType || order?.deliveryType || null, order: respDelivery || order };
                        window.dispatchEvent(new CustomEvent('delivery:accepted', { detail: acceptedDetail }));

                        // Also emit the acceptance via socket so the server can notify the customer room
                        try {
                          socketService.connect();
                          socketService.emit('delivery:accepted', acceptedDetail);
                        } catch (e) {
                          console.warn('[Dashboard] Failed to emit delivery:accepted via socketService', e);
                        }

                        // Refresh dashboard data to sync counts
                        try { fetchDashboardData(); } catch (e) { /* ignore */ }

                        try { router.push('/rider/active', 'forward', 'push'); } catch (e) { window.location.href = '/rider/active'; }
                      } catch (err) {
                        console.error('[Dashboard] Failed to accept order from dashboard:', err);
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </IonContent>
      </RiderLayout>

      {/* Verification Prompt Modal */}
      <VerificationPromptModal
        isOpen={showVerificationModal}
        onClose={handleCloseModal}
        previousFeedback={rejectionFeedback}
      />
    </IonPage>
  );
};

export default Dashboard;