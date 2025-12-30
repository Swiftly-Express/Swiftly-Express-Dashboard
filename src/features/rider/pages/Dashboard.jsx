import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import BlockIcon from "../../../icons/Blockicon";
import NairaIcon from "../../../icons/Nairaicon";
import AnalyticsIcon from "../../../icons/Analyticsicon";
import VerificationPromptModal from '../components/VerificationPromptModal';
import { getRiderProfile, getRiderDeliveries, getAvailableJobs, getRiderEarnings, getRiderVerificationStatus } from '../../../utils/authApi';
import { getCookie, setCookie, getJSONCookie } from '../../../utils/cookies';

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

const DeliveryCard = ({ packageId, status, from, to, customer, price, distance, time, statusColor }) => (
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

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <button className="w-full md:flex-1 bg-[#00B75A] text-sm hover:bg-[#00B876] text-medium text-white py-2 rounded-xl transition-colors font-[400]">
          Navigate
        </button>
        <button className="w-full md:flex-1 py-2 bg-white text-sm hover:bg-[#FFFFFF] rounded-xl transition-colors text-[#0A0A0A] font-[400]" style={{ border: "1px solid #0000001A" }}>
          Contact Customer
        </button>
        <button className="w-full md:w-auto px-3 py-2 bg-white text-sm hover:bg-[#FFFFFF] rounded-xl transition-colors text-[#0A0A0A] font-[400]" style={{ border: "1px solid #0000001A" }}>
          Update Status
        </button>
      </div>
    </YummyText>
  </div>
);

const AvailableOrderCard = ({ packageId, location, distance, price }) => (
  <YummyText>
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl mb-3">
      <div className="mb-3 md:mb-0">
        <div className="text-base font-normal text-[#0F172A]">{packageId}</div>
        <div className="text-sm text-[#64748B] mb-0.5">{location}</div>
        <div className="text-xs text-[#94A3B8]">{distance}</div>
      </div>
      <div className="w-full md:w-auto flex items-center gap-3 md:gap-4">
        <div className="text-lg font-normal text-[#00A63E]">{price}</div>
        <button className="w-full md:w-auto bg-[#00B75A] hover:bg-[#00B876] text-white text-sm px-4 py-2.5 rounded-lg transition-colors font-nmedium">
          Accept
        </button>
      </div>
    </div>
  </YummyText>
);

const Dashboard = () => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
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

  useEffect(() => {
    fetchUserProfile();
    fetchDashboardData();


    // Always fetch latest verification status from backend and only show modal if NOT approved
    const checkVerificationStatus = async () => {
      try {
        const res = await getRiderVerificationStatus();
        const status = res?.data?.verificationStatus || res?.verificationStatus || res?.data || 'pending';
        setCookie('riderVerificationStatus', status, 7);
        if (status && status.toLowerCase() === 'approved') {
          setShowVerificationModal(false);
        } else {
          // Show modal after 2 seconds if not approved
          const timer = setTimeout(() => {
            setShowVerificationModal(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.error('[Dashboard] Failed to fetch verification status:', e);
      }
    };

    checkVerificationStatus();

    // Listen for verification completion to close modal
    const handleVerificationComplete = () => {
      setShowVerificationModal(false);
    };
    window.addEventListener('verification:completed', handleVerificationComplete);
    return () => {
      window.removeEventListener('verification:completed', handleVerificationComplete);
    };
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

      // Process available orders
      const orders = ordersRes?.data?.jobs || ordersRes?.jobs || ordersRes?.data || [];
      setAvailableOrders(orders.slice(0, 2));

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

  const handleCloseModal = (

  ) => {
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
                      packageId={delivery.trackingNumber || delivery.deliveryId || 'N/A'}
                      status={delivery.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                      statusColor={statusColors[delivery.status] || 'bg-gray-100 text-gray-600'}
                      from={formatAddress(delivery.pickupAddress || delivery.pickup?.address)}
                      to={formatAddress(delivery.deliveryAddress || delivery.dropoff?.address)}
                      customer={delivery.customerName || delivery.customer?.name || 'Customer'}
                      price={`₦${delivery.amount?.toFixed(2) || delivery.price?.toFixed(2) || '0.00'}`}
                      distance={delivery.distance ? `${delivery.distance} km` : 'N/A'}
                      time={delivery.estimatedTime || 'N/A'}
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
                <button className="text-[#007BFF] text-sm font-medium">
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
      />
    </IonPage>
  );
};

export default Dashboard;