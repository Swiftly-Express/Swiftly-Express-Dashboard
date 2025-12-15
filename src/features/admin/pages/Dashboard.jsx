import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Users, Bike, Package, DollarSign, TrendingUp } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';

const AdminDashboard = () => {
  // Revenue data for line chart
  const revenueData = [
    { month: 'Jan', value: 45000 },
    { month: 'Feb', value: 52000 },
    { month: 'Mar', value: 48000 },
    { month: 'Apr', value: 61000 },
    { month: 'May', value: 73000 },
    { month: 'Jun', value: 71000 }
  ];

  // Order status data for pie chart
  const orderStatusData = [
    { name: 'Delivered', value: 8458, color: '#10B981' },
    { name: 'In Transit', value: 2847, color: '#3B82F6' },
    { name: 'Pending', value: 1023, color: '#F59E0B' },
    { name: 'Cancelled', value: 152, color: '#EF4444' }
  ];

  // Recent orders data
  const recentOrders = [
    { id: 'ORD-12436', customer: 'Micheal Mike', status: 'Delivered', amount: '₦4,500', time: '2 hrs ago', statusColor: 'bg-green-100 text-green-800' },
    { id: 'ORD-12435', customer: 'Sarah Johnson × David Lee', status: 'In Transit', amount: '₦2,250', time: '5 hrs ago', statusColor: 'bg-blue-100 text-blue-800' },
    { id: 'ORD-12434', customer: 'Tom Anderson', status: 'Pending', amount: '₦5,800', time: '12 hrs ago', statusColor: 'bg-yellow-100 text-yellow-800' },
    { id: 'ORD-12433', customer: 'Emma Davis × Chris Martin', status: 'Delivered', amount: '₦3,125', time: '19 hrs ago', statusColor: 'bg-green-100 text-green-800' },
    { id: 'ORD-12432', customer: 'James Wilson × Ann Turner', status: 'In Transit', amount: '₦6,780', time: '22 hrs ago', statusColor: 'bg-blue-100 text-blue-800' }
  ];

  // Pending KYC approvals
  const kycApprovals = [
    { name: 'Robert Chen', email: 'robert.chen@email.com', time: '5 days ago', status: 'Pending' },
    { name: 'Maria Garcia', email: 'maria.g@email.com', time: '5 hours ago', status: 'Pending' },
    { name: 'Ahmed Hassan', email: 'ahmed.h@email.com', time: '2 hours ago', status: 'Pending' }
  ];

  const StatCard = ({ icon: Icon, title, value, change, iconBg, iconColor }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} p-3 rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex items-center text-sm text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          {change}
        </div>
      </div>
      <div className="text-gray-500 text-sm mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8">
            <YummyText className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</YummyText>
            <YummyText className="text-gray-500">Welcome back! Here's what's happening with your platform today.</YummyText>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              icon={Users}
              title="Total Users"
              value="2,847"
              change="+12.5%"
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard 
              icon={Bike}
              title="Active Riders"
              value="486"
              change="+8.1%"
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
            />
            <StatCard 
              icon={Package}
              title="Total Orders"
              value="12,456"
              change="+23.1%"
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard 
              icon={DollarSign}
              title="Revenue"
              value="₦124,890"
              change="+18.2%"
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Overview */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-semibold text-gray-900 mb-2">Revenue Overview</YummyText>
              <YummyText className="text-sm text-gray-500 mb-6">Monthly revenue for the last 6 months</YummyText>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => `₦${value.toLocaleString()}`}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Order Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-semibold text-gray-900 mb-2">Order Status</YummyText>
              <YummyText className="text-sm text-gray-500 mb-6">Distribution of order statuses</YummyText>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-3">
                {orderStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                      <YummyText className="text-sm text-gray-600">{item.name}</YummyText>
                    </div>
                    <YummyText className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</YummyText>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-semibold text-gray-900 mb-2">Recent Orders</YummyText>
              <YummyText className="text-sm text-gray-500 mb-6">Latest orders from the platform</YummyText>
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <YummyText className="font-medium text-gray-900 text-sm mr-3">{order.id}</YummyText>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>
                          {order.status}
                        </span>
                      </div>
                      <YummyText className="text-sm text-gray-500">{order.customer}</YummyText>
                      <YummyText className="text-xs text-gray-400 mt-1">{order.time}</YummyText>
                    </div>
                    <div className="text-right">
                      <YummyText className="font-semibold text-gray-900">{order.amount}</YummyText>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending KYC Approvals */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <YummyText className="text-lg font-semibold text-gray-900 mb-2">Pending KYC Approvals</YummyText>
              <YummyText className="text-sm text-gray-500 mb-6">Users waiting for verification</YummyText>
              <div className="space-y-4">
                {kycApprovals.map((user, index) => (
                  <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <YummyText className="font-medium text-gray-900 text-sm mb-1">{user.name}</YummyText>
                        <YummyText className="text-sm text-gray-500">{user.email}</YummyText>
                        <YummyText className="text-xs text-gray-400 mt-1">{user.time}</YummyText>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⏱ {user.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                        ✓ Approve
                      </button>
                      <button className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
            
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default AdminDashboard;