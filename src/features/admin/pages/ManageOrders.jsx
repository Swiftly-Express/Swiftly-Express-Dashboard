import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Search, Filter, MoreVertical, User, Bike } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';

const ManageOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Stats data
  const stats = [
    { label: 'Total Orders', value: '12,456', color: 'text-gray-900' },
    { label: 'Delivered', value: '8,456', color: 'text-green-600' },
    { label: 'In Transit', value: '2,847', color: 'text-blue-600' },
    { label: 'Pending', value: '1,023', color: 'text-orange-600' }
  ];

  // Orders data
  const orders = [
    {
      id: 'ORD-12456',
      customer: 'John Smith',
      customerId: 'USR-001',
      rider: 'Mike Wilson',
      riderId: 'RDR-001',
      from: '23 Palm View Lane, ...',
      to: '78 Pine Crest Road, Osongama',
      distance: '3.2 km',
      amount: '₦4050',
      status: 'Delivered',
      statusColor: 'bg-green-100 text-green-800',
      dateTime: '2024-12-02 14:30'
    },
    {
      id: 'ORD-12455',
      customer: 'Sarah Johnson',
      customerId: 'USR-002',
      rider: 'David Lee',
      riderId: 'RDR-002',
      from: '789 Oak Rd, Los Angeles, CA',
      to: '321 Elm St, Los Angeles,',
      distance: '5.8 km',
      amount: '₦3250',
      status: 'In Transit',
      statusColor: 'bg-blue-100 text-blue-800',
      dateTime: '2024-12-02 14:25'
    },
    {
      id: 'ORD-12454',
      customer: 'Mike Brown',
      customerId: 'USR-003',
      rider: 'Tom Anderson',
      riderId: 'RDR-003',
      from: '555 Maple Ave, Chicago, IL',
      to: '888 Pine Blvd, Chicago, IL',
      distance: '7.1 km',
      amount: '₦5800',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800',
      dateTime: '2024-12-02 14:18'
    },
    {
      id: 'ORD-12453',
      customer: 'Emma Davis',
      customerId: 'USR-004',
      rider: 'Chris Martin',
      riderId: 'RDR-004',
      from: '222 Cedar Ln, Houston, TX',
      to: '777 Birch Way, Houston, TX',
      distance: '4.5 km',
      amount: '₦4135',
      status: 'Delivered',
      statusColor: 'bg-green-100 text-green-800',
      dateTime: '2024-12-02 14:12'
    },
    {
      id: 'ORD-12452',
      customer: 'James Wilson',
      customerId: 'USR-005',
      rider: 'Alex Turner',
      riderId: 'RDR-005',
      from: '999 Spruce Dr, Phoenix, AZ',
      to: '111 Walnut St, Phoenix, AZ',
      distance: '9.3 km',
      amount: '₦6780',
      status: 'In Transit',
      statusColor: 'bg-blue-100 text-blue-800',
      dateTime: '2024-12-02 13:55'
    },
    {
      id: 'ORD-12451',
      customer: 'Olivia Martinez',
      customerId: 'USR-006',
      rider: 'Mike Wilson',
      riderId: 'RDR-001',
      from: '444 Ash Ct, Philadelphia, PA',
      to: '666 Poplar Rd, Philadelphia, PA',
      distance: '2.7 km',
      amount: '₦2850',
      status: 'Cancelled',
      statusColor: 'bg-red-100 text-red-800',
      dateTime: '2024-12-02 13:40'
    }
  ];

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-no-padding">
          {/* Header */}
          <div className="mb-8">
            <YummyText className="text-3xl font-bold text-gray-900 mb-2">Manage Orders</YummyText>
            <YummyText className="text-gray-500">View and manage all delivery orders</YummyText>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <YummyText className="text-sm text-gray-500 mb-2">{stat.label}</YummyText>
                <YummyText className={`text-3xl font-bold ${stat.color}`}>{stat.value}</YummyText>
              </div>
            ))}
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Table Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <YummyText className="text-lg font-semibold text-gray-900">All Orders</YummyText>
                  <YummyText className="text-sm text-gray-500">Showing 6 of 6 orders</YummyText>
                </div>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                  {/* Filter */}
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    {statusFilter}
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="w-[12%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="w-[12%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rider
                      </th>
                      <th className="w-[25%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distance
                      </th>
                      <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-[12%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="w-[3%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div className="overflow-y-auto max-h-[500px]">
                <table className="w-full table-fixed">
                  <tbody className="bg-white divide-y divide-gray-100">
                    {orders.map((order, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="w-[10%] px-3 py-4 whitespace-nowrap">
                          <YummyText className="text-sm font-medium text-gray-900">{order.id}</YummyText>
                        </td>
                        <td className="w-[12%] px-3 py-4">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <div>
                              <YummyText className="text-sm font-medium text-gray-900">{order.customer}</YummyText>
                              <YummyText className="text-xs text-gray-500">{order.customerId}</YummyText>
                            </div>
                          </div>
                        </td>
                        <td className="w-[12%] px-3 py-4">
                          <div className="flex items-center">
                            <Bike className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <div>
                              <YummyText className="text-sm font-medium text-gray-900">{order.rider}</YummyText>
                              <YummyText className="text-xs text-gray-500">{order.riderId}</YummyText>
                            </div>
                          </div>
                        </td>
                        <td className="w-[25%] px-3 py-4">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-900">
                              <span className="font-medium">From:</span> <span className="truncate">{order.from}</span>
                            </div>
                            <div className="text-xs text-gray-900">
                              <span className="font-medium">To:</span> <span className="truncate">{order.to}</span>
                            </div>
                          </div>
                        </td>
                        <td className="w-[8%] px-3 py-4 whitespace-nowrap">
                          <YummyText className="text-sm text-gray-900">{order.distance}</YummyText>
                        </td>
                        <td className="w-[8%] px-3 py-4 whitespace-nowrap">
                          <YummyText className="text-sm font-medium text-gray-900">{order.amount}</YummyText>
                        </td>
                        <td className="w-[10%] px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="w-[12%] px-3 py-4 whitespace-nowrap">
                          <YummyText className="text-xs text-gray-900">{order.dateTime}</YummyText>
                        </td>
                        <td className="w-[3%] px-3 py-4 whitespace-nowrap text-center">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default ManageOrders;