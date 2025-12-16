import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { DollarSign, Package, Users, Bike, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { LineChart, AreaChart, Area, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';
import RevenueIcon from '../../../icons/Revenueicon';

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
          <YummyText className={`text-xl font-bold ${
            rider.trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>{rider.earnings}</YummyText>
          <div className={`flex items-center text-xs py-0.5 px-2 rounded-full ${
            rider.trend === 'up' 
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

  // Revenue & Orders Trend Data
  const revenueOrdersData = [
    { month: 'Jan', revenue: 45000, orders: 1200 },
    { month: 'Feb', revenue: 52000, orders: 1350 },
    { month: 'Mar', revenue: 48000, orders: 1280 },
    { month: 'Apr', revenue: 61000, orders: 1450 },
    { month: 'May', revenue: 73000, orders: 1750 },
    { month: 'Jun', revenue: 68000, orders: 1820 }
  ];

  // Order Status Data
  const orderStatusData = [
    { name: 'Delivered', value: 8456, color: '#10B981' },
    { name: 'In Transit', value: 2847, color: '#3B82F6' },
    { name: 'Pending', value: 1023, color: '#F59E0B' },
    { name: 'Cancelled', value: 130, color: '#EF4444' }
  ];

  // User Growth Data
  const userGrowthData = [
    { month: 'Jan', customers: 2250, riders: 420 },
    { month: 'Feb', customers: 2450, riders: 435 },
    { month: 'Mar', customers: 2580, riders: 448 },
    { month: 'Apr', customers: 2720, riders: 465 },
    { month: 'May', customers: 2850, riders: 478 },
    { month: 'Jun', customers: 2950, riders: 486 }
  ];

  // Peak Hours Data
  const peakHoursData = [
    { time: '00:00', orders: 45 },
    { time: '03:00', orders: 28 },
    { time: '06:00', orders: 85 },
    { time: '09:00', orders: 210 },
    { time: '12:00', orders: 456 },
    { time: '15:00', orders: 380 },
    { time: '18:00', orders: 520 },
    { time: '21:00', orders: 285 }
  ];

  const renderLegend = (props) => {
    const { payload } = props || {};

    const mapLabelToColor = (label = '', entry = {}) => {
      const l = String(label).toLowerCase();
      if (l.includes('revenue') || l.includes('customers')) return { colorClass: 'text-blue-600', hex: '#3B82F6' };
      if (l.includes('orders') || l.includes('riders')) return { colorClass: 'text-orange-500', hex: '#F59E0B' };
      return { colorClass: 'text-gray-600', hex: entry?.color || '#6B7280' };
    };

    return (
      <div className="flex items-center justify-center gap-6 mt-2">
        {payload && payload.map((entry, index) => {
          const label = entry.value || entry.payload?.name || entry.name;
          const { colorClass, hex } = mapLabelToColor(label, entry);
          const isIconSeries = typeof label === 'string' && (label.toLowerCase().includes('revenue') || label.toLowerCase().includes('orders') || label.toLowerCase().includes('customers') || label.toLowerCase().includes('riders'));

          return (
            <div key={index} className="flex items-center gap-2">
              {isIconSeries ? (
                <RevenueIcon className={`w-4 h-4 ${colorClass}`} />
              ) : (
                <span
                  className="w-3 h-3 rounded-full block"
                  style={{ backgroundColor: entry.color || hex }}
                />
              )}
              <YummyText className={`text-medium ${colorClass}`}>{label}</YummyText>
            </div>
          );
        })}
      </div>
    );
  };

  // Top Performing Riders
  const topRiders = [
    { rank: 1, name: 'David Lee', deliveries: 456, rating: 4.9, earnings: '₦18,920', roi: '+390%', trend: 'up', color: '#F59E0B', avatar: 'https://i.pravatar.cc/150?img=12' },
    { rank: 2, name: 'Mike Wilson', deliveries: 342, rating: 4.8, earnings: '₦12,450', roi: '+245%', trend: 'up', color: '#F59E0B', avatar: 'https://i.pravatar.cc/150?img=13' },
    { rank: 3, name: 'Chris Martin', deliveries: 267, rating: 4.7, earnings: '₦9,870', roi: '+180%', trend: 'up', color: '#F59E0B', avatar: 'https://i.pravatar.cc/150?img=14' },
    { rank: 4, name: 'Tom Anderson', deliveries: 198, rating: 4.6, earnings: '₦7,650', roi: '-12%', trend: 'down', color: '#F59E0B', avatar: 'https://i.pravatar.cc/150?img=15' },
    { rank: 5, name: 'Alex Turner', deliveries: 145, rating: 4.5, earnings: '₦5,230', roi: '+95%', trend: 'up', color: '#F59E0B', avatar: 'https://i.pravatar.cc/150?img=16' }
  ];

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <YummyText className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</YummyText>
              <YummyText className="text-gray-500">Comprehensive insights into platform performance</YummyText>
            </div>
            <select 
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option>Last 6 Months</option>
              <option>Last 3 Months</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Revenue */}
            <div className="bg-white rounded-xl p-6 px-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-8">
                <div className="bg-blue-50 p-2.5 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center text-xs mt-3 gap-2 py-0.5 px-2 bg-[#F0FDF4] border border-[#B9F8CF] rounded-full text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +18.2%
                </div>
              </div>
              <YummyText className="text-xs text-[#4A5565] mb-1">Total Revenue</YummyText>
              <YummyText className="text-2xl font-medium text-[#0A0A0A] mb-1">₦346K</YummyText>
              <YummyText className="text-xs text-[#4A5565]">vs last period: ₦293K</YummyText>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-xl p-6 px-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-8">
                <div className="bg-green-50 p-2.5 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center text-xs mt-3 gap-2 py-0.5 px-2 bg-[#F0FDF4] border border-[#B9F8CF] rounded-full text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +23.1%
                </div>
              </div>
              <YummyText className="text-xs text-[#4A5565] mb-1">Total Orders</YummyText>
              <YummyText className="text-2xl font-medium text-[#0A0A0A] mb-1">9,310</YummyText>
              <YummyText className="text-xs text-[#4A5565]">vs last period: 7,562</YummyText>
            </div>

            {/* Active Users */}
            <div className="bg-white rounded-xl p-6 px-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-8">
                <div className="bg-purple-50 p-2.5 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex items-center text-xs mt-3 gap-2 py-0.5 px-2 bg-[#F0FDF4] border border-[#B9F8CF] rounded-full text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12.5%
                </div>
              </div>
              <YummyText className="text-xs text-[#4A5565] mb-1">Active Users</YummyText>
              <YummyText className="text-2xl font-medium text-[#0A0A0A] mb-1">2,847</YummyText>
              <YummyText className="text-xs text-[#4A5565]">vs last period: 2,531</YummyText>
            </div>

            {/* Active Riders */}
            <div className="bg-white rounded-xl p-6 px-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-8">
                <div className="bg-orange-50 p-2.5 rounded-lg">
                  <Bike className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex items-center text-xs mt-3 gap-2 py-0.5 px-2 bg-[#F0FDF4] border border-[#B9F8CF] rounded-full text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +8.3%
                </div>
              </div>
              <YummyText className="text-xs text-[#4A5565] mb-1">Active Riders</YummyText>
              <YummyText className="text-2xl font-medium text-[#0A0A0A] mb-1">486</YummyText>
              <YummyText className="text-xs text-[#4A5565]">vs last period: 449</YummyText>
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

              <ResponsiveContainer width="103%" height={300}>
                <AreaChart
                  data={revenueOrdersData}
                  margin={{ top: 35, right: 0, left: 5, bottom: 0 }}
                >
                  {/* Gradients */}
                  <defs>
                    {/* Gray revenue background */}
                    <linearGradient id="revenueGray" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6c7179ff" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#6c7179ff" stopOpacity={0} />
                    </linearGradient>

                    {/* Orange orders background */}
                    <linearGradient id="ordersOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fd6b04ff" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#fd6b04ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  {/* Grid */}
                  <CartesianGrid
                    vertical={true}
                    horizontal={true}
                    stroke="#E5E7EB"
                    strokeDasharray="4 4"
                  />

                  {/* Axes */}
                  <XAxis
                    dataKey="month"
                    axisLine={true}
                    tickLine={true}
                    tick={{ fill: '#666666', fontSize: 12 }}
                  />

                  <YAxis
                    yAxisId="left"
                    axisLine={true}
                    tickLine={true}
                    tick={{ fill: '#666666', fontSize: 12 }}
                  />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={true}
                    tickLine={true}
                    tick={{ fill: '#666666', fontSize: 12 }}
                  />

                  {/* Tooltip */}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                    }}
                    labelStyle={{ fontWeight: 600 }}
                  />

                  {/* Legend (custom) */}
                  <Legend verticalAlign="bottom" content={renderLegend} />

                  {/* ORANGE AREA (Orders) */}
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#F97316"
                    strokeWidth={0.5}
                    fill="url(#ordersOrange)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />

                  {/* GRAY AREA (Revenue) */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue ($)"
                    stroke="#6B7280"
                    strokeWidth={0.5}
                    fill="url(#revenueGray)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>


            {/* Order Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-medium text-[#0A0A0A] mb-2">Order Status</YummyText>
              <YummyText className="text-sm text-[#717182] mb-6">Distribution by status</YummyText>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    stroke="#ffffff"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
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
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Growth */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-medium text-[#0A0A0A] mb-2">User Growth</YummyText>
              <YummyText className="text-sm text-[#717182] mb-6">Customers and riders over time</YummyText>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={userGrowthData} margin={{ left: -15, top: 25, right: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={true}
                    tickLine={true}
                    tick={{ fill: '#666666', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={true}
                    tickLine={true}
                    tick={{ fill: '#666666', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" content={renderLegend} />
                  <Line 
                    type="monotone" 
                    dataKey="customers" 
                    stroke="#3B82F6" 
                    strokeWidth={1.5}
                    name="Customers"
                    dot={{ fill: '#3B82F6', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="riders" 
                    stroke="#F59E0B" 
                    strokeWidth={1.5}
                    name="Riders"
                    dot={{ fill: '#F59E0B', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Peak Hours Analysis */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-medium text-[#0A0A0A] mb-2">Peak Hours Analysis</YummyText>
              <YummyText className="text-sm text-[#717182] mb-6">Orders by time of day</YummyText>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={peakHoursData} margin={{ left: -15, top: 25, right: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={true}
                    tickLine={true}
                    tick={{ fill: '#666666', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={true}
                    tickLine={true}
                    tick={{ fill: '#666666', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="orders" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performing Riders */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <YummyText> 
            <div className="text-lg font-semibold text-gray-900 -mb-0.5">Top Performing Riders</ div>
            <div className="text-sm text-gray-500 mb-6">Highest performing riders this period</div>
            </YummyText>
            
            <div className="space-y-4">
              {topRiders.map((rider, index) => (
                <RiderCard key={index} rider={rider} />
              ))}
            </div>
          </div>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default AnalyticsReports;