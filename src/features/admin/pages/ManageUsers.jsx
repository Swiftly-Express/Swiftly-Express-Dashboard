import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Search, Filter, MoreVertical, Mail, Phone } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';
import LocationIcon from '../../../icons/Locationicon';
import PeopleIcon from '../../../icons/Peopleicon';
import CheckCircleIcon from '../../../icons/Circlecheck';
import PauseIcon from '../../../icons/Pauseicon';
import BanIcon from '../../../icons/Banicon';

const ManageUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Stats data
  const stats = [
    { 
      label: 'Total Users', 
      value: '2,847', 
      icon: <PeopleIcon className="w-5 h-5" stroke="#1E1E1E" />,
      bgColor: '#F3F4F6',
      valueColor: '#1E1E1E'
    },
    { 
      label: 'Active Users', 
      value: '2,634', 
      icon: <CheckCircleIcon size={18} color="#00A63E" />,
      bgColor: '#D1FAE5',
      valueColor: '#00A63E'
    },
    { 
      label: 'Inactive Users', 
      value: '189', 
      icon: <PauseIcon className="w-5 h-5" stroke="#6B7280" />,
      bgColor: '#F3F4F6',
      valueColor: '#6B7280'
    },
    { 
      label: 'Suspended', 
      value: '24', 
      icon: <BanIcon className="w-5 h-5" stroke="#EF4444" />,
      bgColor: '#FEE2E2',
      valueColor: '#EF4444'
    }
  ];

  // Users data
  const users = [
    {
      id: 'USR-001',
      name: 'John Smith',
      joined: 'Joined 2024-01-15',
      email: 'john.smith@email.com',
      phone: '+1 (555) 123-4567',
      location: 'Benin City, ED',
      orders: 45,
      totalSpent: '₦1,245.00',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'USR-002',
      name: 'Sarah Johnson',
      joined: 'Joined 2024-02-20',
      email: 'sarah.j@email.com',
      phone: '+1 (555) 234-5678',
      location: 'Enugu, EN',
      orders: 32,
      totalSpent: '₦8940.50',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'USR-003',
      name: 'Mike Brown',
      joined: 'Joined 2024-03-10',
      email: 'mike.brown@email.com',
      phone: '+1 (555) 345-6789',
      location: 'Kaduna, KD',
      orders: 18,
      totalSpent: '₦4546.75',
      status: 'Inactive',
      statusColor: 'bg-gray-100 text-gray-800'
    },
    {
      id: 'USR-004',
      name: 'Emma Davis',
      joined: 'Joined 2023-11-05',
      email: 'emma.davis@email.com',
      phone: '+1 (555) 456-7890',
      location: 'Ibadan, OY',
      orders: 67,
      totalSpent: '₦2,134.20',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'USR-005',
      name: 'James Wilson',
      joined: 'Joined 2024-04-12',
      email: 'james.w@email.com',
      phone: '+1 (555) 567-8901',
      location: 'Asaba, DT',
      orders: 23,
      totalSpent: '₦6728.90',
      status: 'Suspended',
      statusColor: 'bg-red-100 text-red-800'
    },
    {
      id: 'USR-006',
      name: 'Olivia Martinez',
      joined: 'Joined 2024-01-28',
      email: 'olivia.m@email.com',
      phone: '+1 (555) 678-9012',
      location: 'Owerri, IM',
      orders: 41,
      totalSpent: '₦1,023.45',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-800'
    }
  ];

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-no-padding">
          {/* Header */}
          <div className="mb-8">
            <YummyText className="text-3xl font-medium text-[#1E1E1E] mb-2">Manage Users</YummyText>
            <YummyText className="text-[#717182]">View and manage all customer accounts</YummyText>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col items-start">
                  <div
                    className="p-2 rounded-lg mb-3"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    {stat.icon}
                  </div>
                  <YummyText className="text-sm text-gray-500 mb-1">{stat.label}</YummyText>
                  <YummyText className="text-3xl font-medium" style={{ color: stat.valueColor }}>{stat.value}</YummyText>
                </div>
              </div>
            ))}
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Table Header */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <YummyText className="text-medium font-medium text-gray-900">All Users</YummyText>
                  <YummyText className="text-xs text-gray-500">Showing 6 of 6 users</YummyText>
                </div>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <YummyText>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="w-[15%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="w-[18%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                      Location
                    </th>
                    <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="w-[12%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <YummyText className="text-sm font-medium text-[#101828]">{user.id}</YummyText>
                      </td>
                      <td className="px-3 py-4">
                        <div>
                          <YummyText className="text-sm font-medium text-[#101828] truncate">{user.name}</YummyText>
                          <YummyText className="text-xs text-[#4A5565]">{user.joined}</YummyText>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-[#4A5565]">
                            <Mail className="w-3 h-3 mr-1 text-[#4A5565] flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center text-xs text-[#4A5565]">
                            <Phone className="w-3 h-3 mr-1 text-[#4A5565] flex-shrink-0" />
                            <span className="truncate">{user.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center text-xs gap-1 text-[#4A5565]">
                          <LocationIcon width={13} height={13} stroke="#4A5565" />
                          <span className="truncate">{user.location}</span>
                        </div>
                      </td>
                      <td className="px-7 py-4 whitespace-nowrap">
                        <YummyText className="text-sm text-[#101828]">{user.orders}</YummyText>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <YummyText className="text-sm font-medium text-[#101828]">{user.totalSpent}</YummyText>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.statusColor}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <button className="text-[#0A0A0A] hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </YummyText>
          </div>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default ManageUsers;