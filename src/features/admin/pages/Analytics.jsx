import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonRefresher, IonRefresherContent } from '@ionic/react';
import { DollarSign, Package, Users, Bike, TrendingUp, TrendingDown, Star, RefreshCw, AlertCircle } from 'lucide-react';
import StyledDropdown from '../../../components/StyledDropdown';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';
import RevenueIcon from '../../../icons/Revenueicon';
import { getAnalyticsOverview, getRevenueAnalytics, getDriverAnalytics } from '../../../utils/adminApi';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// Rider Card Component with Flip Animation
const RiderCard = ({ rider }) => {
  const [showRank, setShowRank] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowRank(prev => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center flex-1">
        <div className="relative w-12 h-12">
          <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
            <div
              className="relative w-full h-full transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: showRank ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front - Profile Picture */}
              <div
                className="absolute w-full h-full rounded-full overflow-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <img
                  src={rider.avatar}
                  alt={rider.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Back - Rank */}
              <div
                className="absolute w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{
                  backgroundColor: rider.color,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                #{rider.rank}
              </div>
            </div>
          </div>
        </div>
        <div className="ml-4">
          <YummyText className="text-base font-semibold text-gray-900">{rider.name}</YummyText>
          <div className="flex items-center mt-1">
            <YummyText className="text-sm text-gray-500 mr-4">{rider.deliveries} deliveries</YummyText>
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
              <YummyText className="text-sm font-medium text-gray-700">{rider.rating}</YummyText>
            </div>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-2 mb-1">
          <YummyText className={`text-xl font-bold ${rider.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>{rider.earnings}</YummyText>
          <div className={`flex items-center text-xs py-0.5 px-2 rounded-full ${rider.trend === 'up'
              ? 'bg-[#F0FDF4] border border-[#B9F8CF] text-green-600'
              : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
            {rider.trend === 'up' ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {rider.roi}
          </div>
        </div>
        <YummyText className="text-xs text-gray-500">Total Earnings</YummyText>
      </div>
    </div>
  );
};

const AnalyticsReports = () => {
  const [timePeriod, setTimePeriod] = useState('Last 6 Months');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // State for API data
  const [overviewData, setOverviewData] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [driverData, setDriverData] = useState([]);

  // Fetch all analytics data
  const fetchAnalyticsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Calculate date range based on time period
      const endDate = new Date();
      const startDate = new Date();

      switch (timePeriod) {
        case 'Last Month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'Last 3 Months':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'Last 6 Months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case 'This Year':
          startDate.setMonth(0);
          startDate.setDate(1);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 6);
      }

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      // Fetch all data in parallel
      const [overview, revenue, drivers] = await Promise.all([
        getAnalyticsOverview(),
        getRevenueAnalytics(params),
        getDriverAnalytics(params)
      ]);

      setOverviewData(overview);
      setRevenueData(revenue);
      setDriverData(drivers);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on mount, when time period changes, or after KYC approval/rejection
  useEffect(() => {
    fetchAnalyticsData();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // Listen for KYC approval/rejection events to refresh stats
    const handleKycUpdate = () => {
      fetchAnalyticsData(true);
    };
    window.addEventListener('kyc:updated', handleKycUpdate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('kyc:updated', handleKycUpdate);
    };
  }, [timePeriod]);

  // Using shared StyledDropdown component (imported above)

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₦0';
    return `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Format number with K/M suffix
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Calculate percentage change
  const calculatePercentChange = (current, previous) => {
    if (!previous || previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // Process revenue data for charts
  const processRevenueOrdersData = () => {
    if (!revenueData?.data || !Array.isArray(revenueData.data)) return [];

    return revenueData.data.map(item => ({
      month: item.month || item.period || item.date,
      revenue: item.revenue || item.totalRevenue || 0,
      orders: item.orders || item.orderCount || item.totalOrders || 0
    }));
  };

  // Process order status data
  const processOrderStatusData = () => {
    const statusData = overviewData?.ordersByStatus || {};
    return [
      { name: 'Delivered', value: statusData.delivered || statusData.completed || 0, color: '#10B981' },
      { name: 'In Transit', value: statusData.in_transit || statusData.inTransit || statusData.ongoing || 0, color: '#3B82F6' },
      { name: 'Pending', value: statusData.pending || 0, color: '#F59E0B' },
      { name: 'Cancelled', value: statusData.cancelled || statusData.canceled || 0, color: '#EF4444' }
    ].filter(item => item.value > 0);
  };

  // Process top riders data
  const processTopRiders = () => {
    if (!driverData?.topDrivers && !driverData?.data) return [];

    const drivers = driverData.topDrivers || driverData.data || [];
    if (!Array.isArray(drivers)) return [];

    return drivers.slice(0, 5).map((driver, index) => {
      const earnings = driver.totalEarnings || driver.earnings || 0;
      const deliveries = driver.deliveryCount || driver.deliveries || driver.totalDeliveries || 0;
      const rating = driver.rating || driver.averageRating || 4.5;
      const previousEarnings = driver.previousEarnings || earnings * 0.8;
      const roi = calculatePercentChange(earnings, previousEarnings);

      return {
        rank: index + 1,
        name: driver.fullName || driver.name || `Driver ${index + 1}`,
        deliveries,
        rating: Number(rating).toFixed(1),
        earnings: formatCurrency(earnings),
        roi: roi,
        trend: roi.startsWith('+') ? 'up' : 'down',
        color: '#F59E0B',
        avatar: driver.profilePicture || driver.avatar || `https://i.pravatar.cc/150?img=${12 + index}`
      };
    });
  };

  // Generate user growth data (mock for now - can be enhanced with API)
  const generateUserGrowthData = () => {
    if (!revenueData?.data || !Array.isArray(revenueData.data)) {
      return [];
    }

    return revenueData.data.map(item => ({
      month: item.month || item.period || item.date,
      customers: item.customerCount || item.customers || 0,
      riders: item.riderCount || item.drivers || item.riders || 0
    }));
  };

  // Generate peak hours data (mock for now - can be enhanced with API)
  const generatePeakHoursData = () => {
    const peakData = overviewData?.peakHours || [];
    if (Array.isArray(peakData) && peakData.length > 0) {
      return peakData;
    }

    // Default mock data if API doesn't provide it
    return [
      { time: '00:00', orders: 0 },
      { time: '03:00', orders: 0 },
      { time: '06:00', orders: 0 },
      { time: '09:00', orders: 0 },
      { time: '12:00', orders: 0 },
      { time: '15:00', orders: 0 },
      { time: '18:00', orders: 0 },
      { time: '21:00', orders: 0 }
    ];
  };

  // Prepare chart data
  const revenueOrdersData = processRevenueOrdersData();
  const orderStatusData = processOrderStatusData();
  const userGrowthData = generateUserGrowthData();
  const peakHoursData = generatePeakHoursData();
  const topRiders = processTopRiders();

  // Extract stats from overview data
  const stats = {
    totalRevenue: overviewData?.totalRevenue || 0,
    previousRevenue: overviewData?.previousRevenue || 0,
    totalOrders: overviewData?.totalOrders || overviewData?.orderCount || 0,
    previousOrders: overviewData?.previousOrders || 0,
    activeUsers: overviewData?.activeUsers || overviewData?.totalCustomers || 0,
    previousUsers: overviewData?.previousUsers || 0,
    activeRiders: overviewData?.activeDrivers || overviewData?.activeRiders || 0,
    previousRiders: overviewData?.previousDrivers || 0
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <IonPage>
        <AdminLayout>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <YummyText className="text-lg text-gray-600">Loading analytics...</YummyText>
              </div>
            </div>
          </IonContent>
        </AdminLayout>
      </IonPage>
    );
  }

  // Error state
  if (error) {
    return (
      <IonPage>
        <AdminLayout>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <YummyText className="text-xl font-semibold text-gray-900 mb-2">Failed to load analytics</YummyText>
                <YummyText className="text-gray-600 mb-6">{error}</YummyText>
                <button
                  onClick={() => fetchAnalyticsData()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </IonContent>
        </AdminLayout>
      </IonPage>
    );
  }

  // Top Performing Riders
  const topRidersOld = [
    { rank: 1, name: 'David Lee', deliveries: 456, rating: 4.9, earnings: '₦18,920', roi: '+390%', trend: 'up', color: '#F59E0B', avatar: 'https://i.pravatar.cc/150?img=12' },
    { rank: 2, name: 'Mike Wilson', deliveries: 342, rating: 4.8, earnings: '₦12,450', roi: '+245%', trend: 'up', color: '#F59E0B', avatar: 'https://i.pravatar.cc/150?img=13' },
    { rank: 3, name: 'Chris Martin', deliveries: 267, rating: 4.7, earnings: '₦9,870', roi: '+180%', trend: 'up', color: '#F59E0B', avatar: 'https://i.pravatar.cc/150?img=14' },
    { rank: 4, name: 'Tom Anderson', deliveries: 198, rating: 4.6, earnings: '₦7,650', roi: '-12%', trend: 'down', color: '#F59E0B', avatar: 'https://i.pravatar.cc/150?img=15' },
    { rank: 5, name: 'Alex Turner', deliveries: 145, rating: 4.5, earnings: '₦5,230', roi: '+95%', trend: 'up', color: '#F59E0B', avatar: 'https://i.pravatar.cc/150?img=16' }
  ];

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className={isMobile ? 'ion-padding' : 'ion-no-padding'}>
          <IonRefresher slot="fixed" onIonRefresh={(e) => { fetchAnalyticsData(true).finally(() => e.detail.complete()); }}>
            <IonRefresherContent />
          </IonRefresher>
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <YummyText className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</YummyText>
              <YummyText className="text-gray-500">Comprehensive insights into platform performance</YummyText>
            </div>
            <div className="flex items-center gap-3">
              <StyledDropdown
                value={timePeriod}
                onChange={(v) => setTimePeriod(v)}
                options={["Last 6 Months", "Last 3 Months", "Last Month", "This Year"]}
                className='w-full border-[2.5px] border-gray-200 rounded-full'
                width='w-full'
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Revenue */}
            <div className="bg-white rounded-xl p-6 px-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-8">
                <div className="bg-blue-50 p-2.5 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className={`flex items-center text-xs mt-3 gap-2 py-0.5 px-2 rounded-full ${stats.totalRevenue >= stats.previousRevenue
                    ? 'bg-[#F0FDF4] border border-[#B9F8CF] text-green-600'
                    : 'bg-red-50 border border-red-200 text-red-600'
                  }`}>
                  {stats.totalRevenue >= stats.previousRevenue ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {calculatePercentChange(stats.totalRevenue, stats.previousRevenue)}
                </div>
              </div>
              <YummyText className="text-xs text-[#4A5565] mb-1">Total Revenue</YummyText>
              <YummyText className="text-2xl font-medium text-[#0A0A0A] mb-1">{formatNumber(stats.totalRevenue)}</YummyText>
              <YummyText className="text-xs text-[#4A5565]">vs last period: {formatCurrency(stats.previousRevenue)}</YummyText>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-xl p-6 px-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-8">
                <div className="bg-green-50 p-2.5 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div className={`flex items-center text-xs mt-3 gap-2 py-0.5 px-2 rounded-full ${stats.totalOrders >= stats.previousOrders
                    ? 'bg-[#F0FDF4] border border-[#B9F8CF] text-green-600'
                    : 'bg-red-50 border border-red-200 text-red-600'
                  }`}>
                  {stats.totalOrders >= stats.previousOrders ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {calculatePercentChange(stats.totalOrders, stats.previousOrders)}
                </div>
              </div>
              <YummyText className="text-xs text-[#4A5565] mb-1">Total Orders</YummyText>
              <YummyText className="text-2xl font-medium text-[#0A0A0A] mb-1">{stats.totalOrders.toLocaleString()}</YummyText>
              <YummyText className="text-xs text-[#4A5565]">vs last period: {stats.previousOrders.toLocaleString()}</YummyText>
            </div>

            {/* Active Users */}
            <div className="bg-white rounded-xl p-6 px-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-8">
                <div className="bg-purple-50 p-2.5 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className={`flex items-center text-xs mt-3 gap-2 py-0.5 px-2 rounded-full ${stats.activeUsers >= stats.previousUsers
                    ? 'bg-[#F0FDF4] border border-[#B9F8CF] text-green-600'
                    : 'bg-red-50 border border-red-200 text-red-600'
                  }`}>
                  {stats.activeUsers >= stats.previousUsers ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {calculatePercentChange(stats.activeUsers, stats.previousUsers)}
                </div>
              </div>
              <YummyText className="text-xs text-[#4A5565] mb-1">Active Users</YummyText>
              <YummyText className="text-2xl font-medium text-[#0A0A0A] mb-1">{stats.activeUsers.toLocaleString()}</YummyText>
              <YummyText className="text-xs text-[#4A5565]">vs last period: {stats.previousUsers.toLocaleString()}</YummyText>
            </div>

            {/* Active Riders */}
            <div className="bg-white rounded-xl p-6 px-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-8">
                <div className="bg-orange-50 p-2.5 rounded-lg">
                  <Bike className="w-6 h-6 text-orange-600" />
                </div>
                <div className={`flex items-center text-xs mt-3 gap-2 py-0.5 px-2 rounded-full ${stats.activeRiders >= stats.previousRiders
                    ? 'bg-[#F0FDF4] border border-[#B9F8CF] text-green-600'
                    : 'bg-red-50 border border-red-200 text-red-600'
                  }`}>
                  {stats.activeRiders >= stats.previousRiders ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {calculatePercentChange(stats.activeRiders, stats.previousRiders)}
                </div>
              </div>
              <YummyText className="text-xs text-[#4A5565] mb-1">Active Riders</YummyText>
              <YummyText className="text-2xl font-medium text-[#0A0A0A] mb-1">{stats.activeRiders.toLocaleString()}</YummyText>
              <YummyText className="text-xs text-[#4A5565]">vs last period: {stats.previousRiders.toLocaleString()}</YummyText>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-medium text-[#0A0A0A] mb-1">
                Revenue & Orders Trend
              </YummyText>
              <YummyText className="text-sm text-[#717182] mb-6">
                Monthly performance metrics
              </YummyText>

              <div style={{ height: '300px' }}>
                <Line
                  data={{
                    labels: revenueOrdersData.map(d => d.month),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: revenueOrdersData.map(d => d.revenue),
                        borderColor: '#6B7280',
                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                        yAxisID: 'y',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2,
                      },
                      {
                        label: 'Orders',
                        data: revenueOrdersData.map(d => d.orders),
                        borderColor: '#F97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        yAxisID: 'y1',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { padding: 15, usePointStyle: true }
                      },
                      tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#1f2937',
                        bodyColor: '#1f2937',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                          label: (context) => {
                            const label = context.dataset.label || '';
                            const value = label === 'Revenue' ? formatCurrency(context.parsed.y) : context.parsed.y;
                            return `${label}: ${value}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: '#f0f0f0' },
                        ticks: { color: '#666666' }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#666666' }
                      },
                      x: {
                        grid: { display: false },
                        ticks: { color: '#666666' }
                      }
                    }
                  }}
                />
              </div>
            </div>


            {/* Order Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-medium text-[#0A0A0A] mb-2">Order Status</YummyText>
              <YummyText className="text-sm text-[#717182] mb-6">Distribution by status</YummyText>
              {orderStatusData.length > 0 ? (
                <>
                  <div style={{ height: '240px' }}>
                    <Doughnut
                      data={{
                        labels: orderStatusData.map(d => d.name),
                        datasets: [{
                          data: orderStatusData.map(d => d.value),
                          backgroundColor: orderStatusData.map(d => d.color),
                          borderColor: '#ffffff',
                          borderWidth: 2,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: '#fff',
                            titleColor: '#1f2937',
                            bodyColor: '#1f2937',
                            borderColor: '#e5e7eb',
                            borderWidth: 1,
                            padding: 12,
                          }
                        }
                      }}
                    />
                  </div>
                  {/* Legend */}
                  <div className="mt-6 space-y-1">
                    {orderStatusData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: item.color }}
                          />
                          <YummyText className="text-sm text-[#0A0A0A]">
                            {item.name}
                          </YummyText>
                        </div>
                        <YummyText className="text-sm font-medium text-[#0A0A0A]">
                          {item.value.toLocaleString()}
                        </YummyText>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <YummyText>No order data available</YummyText>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Growth */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-medium text-[#0A0A0A] mb-2">User Growth</YummyText>
              <YummyText className="text-sm text-[#717182] mb-6">Customers and riders over time</YummyText>
              {userGrowthData.length > 0 ? (
                <div style={{ height: '250px' }}>
                  <Line
                    data={{
                      labels: userGrowthData.map(d => d.month),
                      datasets: [
                        {
                          label: 'Customers',
                          data: userGrowthData.map(d => d.customers),
                          borderColor: '#3B82F6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.4,
                          borderWidth: 2,
                          pointRadius: 4,
                          pointBackgroundColor: '#3B82F6',
                        },
                        {
                          label: 'Riders',
                          data: userGrowthData.map(d => d.riders),
                          borderColor: '#F59E0B',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          tension: 0.4,
                          borderWidth: 2,
                          pointRadius: 4,
                          pointBackgroundColor: '#F59E0B',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { padding: 15, usePointStyle: true }
                        },
                        tooltip: {
                          backgroundColor: '#fff',
                          titleColor: '#1f2937',
                          bodyColor: '#1f2937',
                          borderColor: '#e5e7eb',
                          borderWidth: 1,
                          padding: 12,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: '#f0f0f0' },
                          ticks: { color: '#666666' }
                        },
                        x: {
                          grid: { display: false },
                          ticks: { color: '#666666' }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <YummyText>No user growth data available</YummyText>
                  </div>
                </div>
              )}
            </div>

            {/* Peak Hours Analysis */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-medium text-[#0A0A0A] mb-2">Peak Hours Analysis</YummyText>
              <YummyText className="text-sm text-[#717182] mb-6">Orders by time of day</YummyText>
              {peakHoursData.length > 0 && peakHoursData.some(d => d.orders > 0) ? (
                <div style={{ height: '250px' }}>
                  <Bar
                    data={{
                      labels: peakHoursData.map(d => d.time),
                      datasets: [{
                        label: 'Orders',
                        data: peakHoursData.map(d => d.orders),
                        backgroundColor: '#3B82F6',
                        borderRadius: 8,
                        barThickness: 24,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#fff',
                          titleColor: '#1f2937',
                          bodyColor: '#1f2937',
                          borderColor: '#e5e7eb',
                          borderWidth: 1,
                          padding: 12,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: '#f0f0f0' },
                          ticks: { color: '#666666' }
                        },
                        x: {
                          grid: { display: false },
                          ticks: { color: '#666666' }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <YummyText>No peak hours data available</YummyText>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Performing Riders */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <YummyText>
              <div className="text-lg font-semibold text-gray-900 -mb-0.5">Top Performing Riders</div>
              <div className="text-sm text-gray-500 mb-6">Highest performing riders this period</div>
            </YummyText>

            {topRiders.length > 0 ? (
              <div className="space-y-4">
                {topRiders.map((rider, index) => (
                  <RiderCard key={index} rider={rider} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <Bike className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <YummyText>No rider data available</YummyText>
                </div>
              </div>
            )}
          </div>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default AnalyticsReports;