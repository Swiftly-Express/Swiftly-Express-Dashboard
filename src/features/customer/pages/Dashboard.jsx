import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { arrowForward } from 'ionicons/icons';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';
import { getCustomerDeliveries } from '../../../utils/authApi';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const StatCard = ({ icon, iconBg, title, value, subtitle, subtitleColor }) => (
  <div className="bg-white rounded-xl p-5" style={sideBottomShadow}>
    <div className="flex items-start justify-between mb-6">
      <YummyText className="text-sm text-[#4A5565] mt-2">{title}</YummyText>
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <YummyText className="text-3xl font-normal text-[#0A0A0A] mb-1">{value}</YummyText>
    <YummyText className={`text-xs ${subtitleColor || 'text-[#6A7282]'}`}>{subtitle}</YummyText>
  </div>
);

const DeliveryItem = ({ packageId, status, statusColor, statusBg, from, to, eta, etaTime, progress }) => (
  <div className="mb-6 last:mb-0">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="text-base font-medium text-[#00B75A]">{packageId}</div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
          {status}
        </span>
      </div>
      <div className="text-right">
        <div className="text-xs text-[#64748B]">ETA</div>
        <div className="text-sm font-medium text-[#0F172A]">{etaTime}</div>
      </div>
    </div>
    
    <YummyText>
      <div className="text-medium font-[400] text-[#4A5565] mb-3 -mt-4 flex items-center gap-1">
        <span>{from}</span>
        <IonIcon icon={arrowForward} className="text-medium" />
        <span>{to}</span>
      </div>
    </YummyText>

    {/* Progress Bar */}
    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="absolute top-0 left-0 h-full bg-[#0F172A] rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

// Helper function to extract user's first name from various possible data structures
const getUserFirstName = () => {
  try {
    if (typeof window === 'undefined') return 'Customer';
    
    const userDataRaw = localStorage.getItem('user_data');
    if (!userDataRaw) return 'Customer';
    
    const userData = JSON.parse(userDataRaw);
    console.log('[Dashboard] User data:', userData);
    
    // Try multiple possible field names and structures
    const fullName = 
      userData?.fullName || 
      userData?.full_name || 
      userData?.name || 
      userData?.user?.fullName || 
      userData?.user?.full_name || 
      userData?.user?.name ||
      userData?.data?.fullName ||
      userData?.data?.full_name ||
      userData?.data?.name;
    
    const firstName = 
      userData?.firstName || 
      userData?.first_name || 
      userData?.user?.firstName || 
      userData?.user?.first_name ||
      userData?.data?.firstName ||
      userData?.data?.first_name;
    
    // If we have a first name field, use it
    if (firstName) {
      return firstName;
    }
    
    // If we have a full name, extract the first name
    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      return nameParts[0];
    }
    
    // Fallback to email username if available
    const email = 
      userData?.email || 
      userData?.user?.email ||
      userData?.data?.email;
    
    if (email) {
      const emailUsername = email.split('@')[0];
      return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }
    
    return 'Customer';
  } catch (error) {
    console.error('[Dashboard] Error extracting user name:', error);
    return 'Customer';
  }
};

const CustomerDashboard = () => {
  const [userName, setUserName] = useState('Customer');
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [stats, setStats] = useState({
    active: 0,
    inTransit: 0,
    completed: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get user name on component mount
    const name = getUserFirstName();
    setUserName(name);
    console.log('[Dashboard] Extracted user name:', name);
    
    // Fetch real deliveries data
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Listen for delivery events to refresh the dashboard
    const handleRefresh = () => {
      console.log('[Dashboard] Received refresh event');
      fetchDashboardData();
    };
    
    const handleDeliveryCreated = (event) => {
      console.log('[Dashboard] Delivery created:', event.detail);
      fetchDashboardData();
    };
    
    const handleDeliveryUpdated = (event) => {
      console.log('[Dashboard] Delivery updated:', event.detail);
      fetchDashboardData();
    };

    window.addEventListener('deliveries:refresh', handleRefresh);
    window.addEventListener('delivery:created', handleDeliveryCreated);
    window.addEventListener('delivery:updated', handleDeliveryUpdated);

    return () => {
      window.removeEventListener('deliveries:refresh', handleRefresh);
      window.removeEventListener('delivery:created', handleDeliveryCreated);
      window.removeEventListener('delivery:updated', handleDeliveryUpdated);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all deliveries to calculate accurate stats (not just limit to 3)
      const response = await getCustomerDeliveries({ page: 1, limit: 50 });
      
      // Handle different possible response structures (same as MyDeliveries)
      let deliveries = [];
      
      if (Array.isArray(response)) {
        deliveries = response;
      } else if (response?.data) {
        deliveries = Array.isArray(response.data) ? response.data : (response.data.deliveries || response.data.items || []);
      } else if (response?.deliveries) {
        deliveries = response.deliveries;
      } else if (response?.items) {
        deliveries = response.items;
      } else if (response?.results) {
        deliveries = response.results;
      }
      
      console.log('[Dashboard] Fetched deliveries:', deliveries);
      
      // Calculate stats from all deliveries
      const activeDeliveries = deliveries.filter(d => {
        const status = d?.status?.toLowerCase() || 'pending';
        return status !== 'delivered' && status !== 'completed' && status !== 'cancelled';
      });
      
      const inTransitDeliveries = deliveries.filter(d => {
        const status = d?.status?.toLowerCase() || '';
        return status === 'in-transit' || status === 'in_transit' || status === 'intransit';
      });
      
      const completedDeliveries = deliveries.filter(d => {
        const status = d?.status?.toLowerCase() || '';
        return status === 'delivered' || status === 'completed';
      });
      
      const total = response?.total || response?.meta?.total || deliveries.length;
      
      setStats({
        active: activeDeliveries.length,
        inTransit: inTransitDeliveries.length,
        completed: completedDeliveries.length,
        successRate: total > 0 ? Math.round((completedDeliveries.length / total) * 100) : 0
      });
      
      // Show only the 3 most recent for display
      const recentThree = activeDeliveries.slice(0, 3);
      
      // Map backend data to UI format
      const mappedDeliveries = recentThree.map((d) => ({
        id: d.id || d._id || d.trackingId || 'N/A',
        status: d.status || 'Unknown',
        statusColor: getStatusColor(d.status),
        statusBg: getStatusBg(d.status),
        from: d.pickupAddress?.city || d.pickupAddress?.street || 'Unknown',
        to: d.deliveryAddress?.city || d.deliveryAddress?.street || 'Unknown',
        eta: 'ETA',
        etaTime: d.estimatedDelivery || 'TBD',
        progress: getProgress(d.status)
      }));
      
      setRecentDeliveries(mappedDeliveries);
      
    } catch (err) {
      console.error('[Dashboard] Failed to fetch deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get status color
  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('transit')) return 'text-blue-700';
    if (s.includes('processing') || s.includes('pending')) return 'text-orange-700';
    if (s.includes('delivered')) return 'text-green-700';
    if (s.includes('delivery')) return 'text-[#008236]';
    return 'text-gray-700';
  };

  const getStatusBg = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('transit')) return 'bg-blue-100';
    if (s.includes('processing') || s.includes('pending')) return 'bg-orange-100';
    if (s.includes('delivered')) return 'bg-green-100';
    if (s.includes('delivery')) return 'bg-green-100';
    return 'bg-gray-100';
  };

  const getProgress = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 100;
    if (s.includes('delivery')) return 90;
    if (s.includes('transit')) return 65;
    if (s.includes('processing') || s.includes('pending')) return 25;
    return 10;
  };

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          {/* Welcome Section */}
          <div className="mb-8">
            <YummyText className="text-3xl font-medium text-[#0F172A] mb-2">
              Welcome back, {userName}
            </YummyText>
            <YummyText className="text-[#4A5565] text-[15px] font-[400]">
              Here's what's happening with your deliveries today.
            </YummyText>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={
                <img src="/blockicon.svg" alt="Active Deliveries" className="w-5 h-5" />
              }
              iconBg="bg-blue-50"
              title="Active Deliveries"
              value={loading ? '...' : stats.active}
              subtitle="Currently active"
              subtitleColor="text-[#64748B]"
            />
            <StatCard
              icon={
                <img src="/clockicon.svg" alt="In Transit" className="w-5 h-5" />
              }
              iconBg="bg-[#FFF7ED]"
              title="In Transit"
              value={loading ? '...' : stats.inTransit}
              subtitle="On the way"
              subtitleColor="text-[#64748B]"
            />
            <StatCard
              icon={
                <img src="/checkicon.svg" alt="Completed" className="w-5 h-5" />
              }
              iconBg="bg-green-50"
              title="Completed"
              value={loading ? '...' : stats.completed}
              subtitle="Successfully delivered"
              subtitleColor="text-[#64748B]"
            />
            <StatCard
              icon={
                <img src="/success-rate.svg" alt="Success Rate" className="w-5 h-5" />
              }
              iconBg="bg-purple-50"
              title="Success Rate"
              value={loading ? '...' : `${stats.successRate}%`}
              subtitle="Delivery success"
              subtitleColor="text-[#64748B]"
            />
          </div>

          {/* Recent Deliveries */}
          <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
            <div className="mb-6">
              <YummyText className="text-xl font-semibold text-[#0F172A] mb-1">
                Recent Deliveries
              </YummyText>
              <YummyText className="text-xl font-[400] text-[#717182]">
                Track your latest shipments
              </YummyText>
            </div>

            <div>
              {recentDeliveries.map((delivery, index) => (
                <DeliveryItem
                  key={index}
                  packageId={delivery.id}
                  status={delivery.status}
                  statusColor={delivery.statusColor}
                  statusBg={delivery.statusBg}
                  from={delivery.from}
                  to={delivery.to}
                  eta={delivery.eta}
                  etaTime={delivery.etaTime}
                  progress={delivery.progress}
                />
              ))}
            </div>
          </div>
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default CustomerDashboard;