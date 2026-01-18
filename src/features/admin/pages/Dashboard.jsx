import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner, IonRefresher, IonRefresherContent } from '@ionic/react';
import { Users, Bike, Package, DollarSign, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import AdminLayout from '../components/AdminLayout';

const sideBottomShadow = {
  boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);
import { YummyText } from '../../../components/YummyText';
import ClockIcon from '../../../icons/Clockicon';
import CheckIcon from '../../../icons/Checkicon';
import CircleXIcon from '../../../icons/Circlexicon';

import {
  getAnalyticsOverview,
  getRevenueAnalytics,
  getAllDeliveries,
  getPendingVerifications,
  approveVerification,
  rejectVerification
} from '../../../utils/adminApi';
import { getRiderStatsFromRiders } from '../../../utils/riderStats';
import { getUserStatsFromUsers } from '../../../utils/userStats';
import { getOrderStatsFromOrders } from '../../../utils/orderStats';

const AdminDashboard = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [overview, setOverview] = useState(null);
  const [riderStats, setRiderStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [revenueChartData, setRevenueChartData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [kycApprovals, setKycApprovals] = useState([]);
  const [processingKyc, setProcessingKyc] = useState({});

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₦0';
    return `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // Format relative time
  const formatRelativeTime = (date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  // Get status styling
  const getStatusStyle = (status) => {
    const statusMap = {
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      'in-transit': 'bg-blue-100 text-blue-800',
      'in transit': 'bg-blue-100 text-blue-800',
      ongoing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      canceled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      // Fetch all data in parallel
      const [overviewRes, revenueRes, deliveriesRes, verificationsRes, riderStatsRes, userStatsRes, orderStatsRes] = await Promise.all([
        getAnalyticsOverview().catch(err => ({ error: err.message })),
        getRevenueAnalytics({ period: '6months' }).catch(err => ({ error: err.message })),
        getAllDeliveries(1, 100).catch(err => ({ error: err.message })),
        getPendingVerifications(1, 5).catch(err => ({ error: err.message })),
        getRiderStatsFromRiders().catch(() => null),
        getUserStatsFromUsers().catch(() => null),
        getOrderStatsFromOrders().catch(() => null)
      ]);

      console.log('[Dashboard] Overview response:', overviewRes);
      console.log('[Dashboard] Revenue response:', revenueRes);
      console.log('[Dashboard] Deliveries response:', deliveriesRes);

      // Set revenue data FIRST before overview
      if (!revenueRes.error) {
        console.log('[Dashboard] Processing revenue data...');
        const revenueDataRaw = revenueRes.data || revenueRes;
        console.log('[Dashboard] Raw revenue data structure:', revenueDataRaw);

        // Try different response structures
        let chartData = [];
        if (revenueDataRaw?.data?.monthlyBreakdown && Array.isArray(revenueDataRaw.data.monthlyBreakdown)) {
          chartData = revenueDataRaw.data.monthlyBreakdown;
        } else if (revenueDataRaw?.monthlyBreakdown && Array.isArray(revenueDataRaw.monthlyBreakdown)) {
          chartData = revenueDataRaw.monthlyBreakdown;
        } else if (revenueDataRaw?.data && Array.isArray(revenueDataRaw.data)) {
          chartData = revenueDataRaw.data;
        } else if (revenueDataRaw?.monthlyRevenue && Array.isArray(revenueDataRaw.monthlyRevenue)) {
          chartData = revenueDataRaw.monthlyRevenue;
        } else if (Array.isArray(revenueDataRaw)) {
          chartData = revenueDataRaw;
        } else if (revenueDataRaw?.revenue && Array.isArray(revenueDataRaw.revenue)) {
          chartData = revenueDataRaw.revenue;
        }

        console.log('[Dashboard] Extracted chart data:', chartData);

        // Normalize data structure - ensure each item has month and value
        const normalizedData = chartData
          .map((item, index) => {
            // Handle different possible structures
            let month = item.month || item.period || item.date || item.label || item.name || item._id || `Month ${index + 1}`;
            
            // Format month to be more readable (e.g., "2026-01" -> "Jan 2026")
            if (typeof month === 'string' && month.match(/^\d{4}-\d{2}$/)) {
              const [year, monthNum] = month.split('-');
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              month = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
            }
            
            const value = Number(item.revenue || item.value || item.amount || item.total || item.totalRevenue || 0);

            return { month: String(month), value: value };
          })
          .filter(item => item.month && !isNaN(item.value) && item.value !== undefined);

        console.log('[Dashboard] Final normalized revenue data:', normalizedData);
        console.log('[Dashboard] Total data points:', normalizedData.length);
        setRevenueData(normalizedData);
      }

      // Set overview data
      if (!overviewRes.error) {
        const overviewData = overviewRes.data || overviewRes;
        console.log('[Dashboard] Overview data:', overviewData);
        setOverview(overviewData);
      }
      
      // Set real-time stats
      if (riderStatsRes) setRiderStats(riderStatsRes);
      if (userStatsRes) setUserStats(userStatsRes);
      if (orderStatsRes) setOrderStats(orderStatsRes);

      // Set recent orders
      if (!deliveriesRes.error) {
        const deliveries = deliveriesRes.data?.deliveries || deliveriesRes.deliveries || deliveriesRes.data || [];
        console.log('[Dashboard] Deliveries fetched:', deliveries.length);
        setRecentOrders(deliveries.slice(0, 10));
      }

      // Set KYC approvals
      if (!verificationsRes.error) {
        const verifications = verificationsRes.data?.verifications || verificationsRes.verifications || verificationsRes.data || [];
        setKycApprovals(verifications.slice(0, 5));
      }

    } catch (err) {
      console.error('[Dashboard] Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle KYC approval
  const handleApproveKyc = async (verificationId) => {
    try {
      setProcessingKyc(prev => ({ ...prev, [verificationId]: 'approving' }));
      await approveVerification(verificationId);
      setKycApprovals(prev => prev.filter(k => k._id !== verificationId && k.id !== verificationId));
      setProcessingKyc(prev => ({ ...prev, [verificationId]: null }));
      window.dispatchEvent(new CustomEvent('kyc:updated'));
    } catch (err) {
      console.error('Error approving KYC:', err);
      alert(err.message || 'Failed to approve verification');
      setProcessingKyc(prev => ({ ...prev, [verificationId]: null }));
    }
  };

  // Handle KYC rejection
  const handleRejectKyc = async (verificationId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setProcessingKyc(prev => ({ ...prev, [verificationId]: 'rejecting' }));
      await rejectVerification(verificationId, { reason });
      setKycApprovals(prev => prev.filter(k => k._id !== verificationId && k.id !== verificationId));
      setProcessingKyc(prev => ({ ...prev, [verificationId]: null }));
      window.dispatchEvent(new CustomEvent('kyc:updated'));
    } catch (err) {
      console.error('Error rejecting KYC:', err);
      alert(err.message || 'Failed to reject verification');
      setProcessingKyc(prev => ({ ...prev, [verificationId]: null }));
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Handle ion-refresher
  const handleIonRefresh = (event) => {
    fetchDashboardData().finally(() => {
      event.detail.complete();
    });
  };

  // Fetch data on mount and after KYC update
  useEffect(() => {
    fetchDashboardData();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    const handleKycUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener('kyc:updated', handleKycUpdate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('kyc:updated', handleKycUpdate);
    };
  }, []);

  // Calculate order status data for pie chart
  const orderStatusData = React.useMemo(() => {
    console.log('[Dashboard] Calculating order status from overview:', overview);

    if (!overview?.deliveries) {
      console.log('[Dashboard] No deliveries in overview');
      return [];
    }

    const data = [
      { name: 'Completed', value: overview.deliveries.completed || 0, color: '#10B981' },
      { name: 'Active', value: overview.deliveries.active || 0, color: '#3B82F6' },
      { name: 'Pending', value: overview.deliveries.pending || 0, color: '#F59E0B' },
      { name: 'Cancelled', value: overview.deliveries.cancelled || 0, color: '#EF4444' }
    ].filter(item => item.value > 0);

    console.log('[Dashboard] Order status data:', data);
    return data;
  }, [overview]);

  // Rebuild chart payload whenever revenueData changes
  useEffect(() => {
    console.log('[Dashboard] Building revenue chart from revenueData:', revenueData);
    
    if (!revenueData || revenueData.length === 0) {
      console.log('[Dashboard] No revenue data, setting chart to null');
      setRevenueChartData(null);
      return;
    }

    const payload = {
      labels: revenueData.map(d => d.month || 'N/A'),
      datasets: [
        {
          label: 'Revenue',
          data: revenueData.map(d => Number(d.value) || 0),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#ffffff',
          fill: true
        }
      ]
    };

    console.log('[Dashboard] Built revenue chart payload:', payload);
    console.log('[Dashboard] Chart labels:', payload.labels);
    console.log('[Dashboard] Chart data:', payload.datasets[0].data);
    setRevenueChartData(payload);
  }, [revenueData]);

  const StatCard = ({ icon: Icon, title, value, change, iconBg, iconColor, loading }) => (
    <div className="bg-white rounded-xl p-3 md:p-5" style={sideBottomShadow}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} p-3 rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {change && (
          <div className="flex items-center text-xs gap-1 py-0.5 px-2 bg-[#F0FDF4] border border-[#B9F8CF] rounded-full text-green-600">
            <TrendingUp className="w-4 h-4" />
            {change}
          </div>
        )}
      </div>
      <div className="text-gray-500 text-sm mb-1">{title}</div>
      {loading ? (
        <div className="h-9 flex items-center">
          <IonSpinner name="dots" />
        </div>
      ) : (
        <div className="text-3xl font-bold text-gray-900">{value}</div>
      )}
    </div>
  );

  // Loading state
  if (loading && !overview) {
    return (
      <IonPage>
        <AdminLayout>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <IonSpinner name="crescent" className="w-12 h-12" />
                <YummyText className="mt-4 text-gray-600">Loading dashboard...</YummyText>
              </div>
            </div>
          </IonContent>
        </AdminLayout>
      </IonPage>
    );
  }

  // Error state
  if (error && !overview) {
    return (
      <IonPage>
        <AdminLayout>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <YummyText className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</YummyText>
                <YummyText className="text-gray-600 mb-4">{error}</YummyText>
                <button
                  onClick={handleRefresh}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          </IonContent>
        </AdminLayout>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className={isMobile ? 'ion-padding' : 'ion-no-padding'}>
          <IonRefresher slot="fixed" onIonRefresh={handleIonRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <YummyText className="text-3xl font-medium text-[#1E1E1E] mb-2">Admin Dashboard</YummyText>
              <YummyText className="text-[#717182]">Welcome back! Here's what's happening with your platform today.</YummyText>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 px-0 md:px-1 sm:px-1">
            <StatCard
              icon={Users}
              title="Total Users"
              value={(overview?.users?.total || userStats?.total || 0).toLocaleString()}
              change={overview?.users?.newToday?.total ? `+${overview.users.newToday.total} today` : null}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              loading={refreshing}
            />
            <StatCard
              icon={Bike}
              title="Active Riders"
              value={(overview?.users?.drivers || riderStats?.active || 0).toLocaleString()}
              change={overview?.users?.verifiedDrivers ? `${overview.users.verifiedDrivers} verified` : null}
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
              loading={refreshing}
            />
            <StatCard
              icon={Package}
              title="Total Orders"
              value={(overview?.deliveries?.total || orderStats?.total || 0).toLocaleString()}
              change={overview?.deliveries?.today?.completed ? `${overview.deliveries.today.completed} today` : null}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              loading={refreshing}
            />
            <StatCard
              icon={DollarSign}
              title="Total Revenue"
              value={formatCurrency(overview?.revenue?.total || 0)}
              change={overview?.revenue?.today ? `${formatCurrency(overview.revenue.today)} today` : null}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              loading={refreshing}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Overview */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-semibold text-gray-900 mb-2">Revenue Overview</YummyText>
              <YummyText className="text-sm text-gray-500 mb-6">Monthly revenue trend</YummyText>
              {revenueChartData && revenueChartData.labels && revenueChartData.labels.length > 0 && revenueChartData.datasets[0].data.length > 0 ? (
                <div style={{ height: '300px' }}>
                  <Line
                    key={`revenue-chart-${revenueChartData.labels.length}`}
                    data={revenueChartData}
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
                          displayColors: false,
                          callbacks: {
                            label: (context) => formatCurrency(context.parsed.y)
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: '#f0f0f0' },
                          ticks: {
                            color: '#94a3b8',
                            callback: function (value) {
                              return formatCurrency(value);
                            }
                          }
                        },
                        x: {
                          grid: { display: false },
                          ticks: { color: '#94a3b8' }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No revenue data available</p>
                    {refreshing && <p className="text-xs mt-2">Loading...</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Order Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-semibold text-gray-900 mb-2">Order Status</YummyText>
              <YummyText className="text-sm text-gray-500 mb-6">Distribution of order statuses</YummyText>
              {orderStatusData.length > 0 ? (
                <>
                  <div style={{ height: '240px' }}>
                    <Pie
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
                          <YummyText className="text-sm text-gray-600">{item.name}</YummyText>
                        </div>
                        <YummyText className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</YummyText>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No order data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-semibold text-gray-900 mb-2">Recent Orders</YummyText>
              <YummyText className="text-sm text-gray-500 mb-6">Latest orders from the platform</YummyText>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order, index) => {
                    const orderId = order._id || order.id || `ORD-${index}`;
                    const orderNumber = order.orderNumber || order.trackingNumber || orderId;
                    const status = order.status || 'pending';
                    const amount = order.totalCost || order.price || order.amount || 0;
                    const customerName = order.customer?.name || order.senderName || order.sender?.name || 'N/A';
                    const receiverName = order.receiver?.name || order.receiverName || null;
                    const displayName = receiverName ? `${customerName} × ${receiverName}` : customerName;
                    const createdAt = order.createdAt || order.dateCreated;

                    return (
                      <div key={orderId} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <YummyText className="font-medium text-gray-900 text-sm mr-3">{orderNumber}</YummyText>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(status)}`}>
                              {status}
                            </span>
                          </div>
                          <YummyText className="text-sm text-gray-500">{displayName}</YummyText>
                          <YummyText className="text-xs text-gray-400 mt-1">{formatRelativeTime(createdAt)}</YummyText>
                        </div>
                        <div className="text-right">
                          <YummyText className="font-semibold text-gray-900">{formatCurrency(amount)}</YummyText>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recent orders</p>
                </div>
              )}
            </div>

            {/* Pending KYC Approvals */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-semibold text-gray-900 mb-2">Pending KYC Approvals</YummyText>
              <YummyText className="text-sm text-gray-500 mb-6">Users waiting for verification</YummyText>
              {kycApprovals.length > 0 ? (
                <div className="space-y-4">
                  {kycApprovals.map((user, index) => {
                    const verificationId = user._id || user.id;
                    const userName = user.driver?.name || user.user?.name || user.name || 'N/A';
                    const userEmail = user.driver?.email || user.user?.email || user.email || 'N/A';
                    const submittedAt = user.submittedAt || user.createdAt;
                    const isProcessing = processingKyc[verificationId];

                    return (
                      <div key={verificationId || index} className="pb-4 border-b border-gray-100 last:border-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <YummyText className="font-medium text-gray-900 text-sm mb-1">{userName}</YummyText>
                            <YummyText className="text-sm text-gray-500">{userEmail}</YummyText>
                            <YummyText className="text-xs text-gray-400 mt-1">{formatRelativeTime(submittedAt)}</YummyText>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border bg-[#FEF9C2] text-[#D08700] border-[#F5E6B3]">
                            <ClockIcon className="w-3.5 h-3.5" stroke="#D08700" />
                            Pending
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveKyc(verificationId)}
                            disabled={!!isProcessing}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing === 'approving' ? (
                              <IonSpinner name="dots" className="w-4 h-4" />
                            ) : (
                              <CheckIcon className="w-4 h-4" stroke="#FFFFFF" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectKyc(verificationId)}
                            disabled={!!isProcessing}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing === 'rejecting' ? (
                              <IonSpinner name="dots" className="w-4 h-4" />
                            ) : (
                              <CircleXIcon className="w-4 h-4" stroke="#FFFFFF" />
                            )}
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No pending KYC approvals</p>
                </div>
              )}
            </div>
          </div>

        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default AdminDashboard;