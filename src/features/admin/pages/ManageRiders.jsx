import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Search, Filter, MoreVertical, Mail, Phone } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';

const ManageRiders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [kycFilter, setKycFilter] = useState('All KYC');

  // Stats data
  const stats = [
    { label: 'Total Riders', value: '486', color: 'text-gray-900' },
    { label: 'Active', value: '398', color: 'text-green-600' },
    { label: 'Inactive', value: '67', color: 'text-gray-600' },
    { label: 'Pending KYC', value: '18', color: 'text-orange-600' },
    { label: 'Suspended', value: '3', color: 'text-red-600' }
  ];

  // Riders data
  const riders = [
    {
      id: 'RDR-001',
      name: 'Mike Wilson',
      joined: '2023-10-15',
      email: 'mike.w@email.com',
      phone: '+1 (555) 111-2222',
      vehicle: 'Motorcycle - Honda CB500',
      license: 'DL-123456789',
      deliveries: 342,
      earnings: '₦12,450.00',
      kyc: 'Approved',
      kycColor: 'bg-green-100 text-green-800',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'RDR-002',
      name: 'David Lee',
      joined: '2023-09-05',
      email: 'david.lee@email.com',
      phone: '+1 (555) 222-3333',
      vehicle: 'Motorcycle - Yamaha MT-07',
      license: 'DL-987654321',
      deliveries: 456,
      earnings: '₦18,920.00',
      kyc: 'Approved',
      kycColor: 'bg-green-100 text-green-800',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'RDR-003',
      name: 'Tom Anderson',
      joined: 'Joined 2024-01-20',
      email: 'tom.a@email.com',
      phone: '+1 (555) 333-4444',
      vehicle: 'Scooter - Vespa GTS',
      license: 'DL-456789123',
      deliveries: 198,
      earnings: '₦7,650.00',
      kyc: 'Approved',
      kycColor: 'bg-green-100 text-green-800',
      status: 'Inactive',
      statusColor: 'bg-gray-100 text-gray-800'
    },
    {
      id: 'RDR-004',
      name: 'Chris Martin',
      joined: '2023-11-12',
      email: 'chris.m@email.com',
      phone: '+1 (555) 444-5555',
      vehicle: 'Motorcycle - Kawasaki Ninja',
      license: 'DL-789123456',
      deliveries: 267,
      earnings: '₦9,870.00',
      kyc: 'Approved',
      kycColor: 'bg-green-100 text-green-800',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'RDR-005',
      name: 'Alex Turner',
      joined: '2024-02-08',
      email: 'alex.t@email.com',
      phone: '+1 (555) 555-6666',
      vehicle: 'Motorcycle - Suzuki GSX',
      license: 'DL-321654987',
      deliveries: 145,
      earnings: '₦5,230.00',
      kyc: 'Approved',
      kycColor: 'bg-green-100 text-green-800',
      status: 'Suspended',
      statusColor: 'bg-red-100 text-red-800'
    },
    {
      id: 'RDR-006',
      name: 'Robert Chen',
      joined: '2024-11-28',
      email: 'robert.chen@email.com',
      phone: '+1 (555) 666-7777',
      vehicle: 'Motorcycle - BMW F 750',
      license: 'DL-654987321',
      deliveries: 0,
      earnings: '₦0.00',
      kyc: 'Pending',
      kycColor: 'bg-yellow-100 text-yellow-800',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'RDR-007',
      name: 'Robert Chen',
      joined: '2024-11-28',
      email: 'robert.chen@email.com',
      phone: '+1 (555) 666-7777',
      vehicle: 'Motorcycle - BMW F 750',
      license: 'DL-654987321',
      deliveries: 0,
      earnings: '₦0.00',
      kyc: 'Pending',
      kycColor: 'bg-yellow-100 text-yellow-800',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800'
    }
  ];

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-no-padding">
          {/* Header */}
          <div className="mb-8">
            <YummyText className="text-3xl font-bold text-gray-900 mb-2">Manage Riders</YummyText>
            <YummyText className="text-gray-500">View and manage all rider accounts</YummyText>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <YummyText className="text-sm text-gray-500 mb-2">{stat.label}</YummyText>
                <YummyText className={`text-3xl font-bold ${stat.color}`}>{stat.value}</YummyText>
              </div>
            ))}
          </div>

          {/* Riders Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Table Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <YummyText className="text-medium font-medium text-gray-900">All Riders</YummyText>
                  <YummyText className="text-xs text-gray-500">Showing 6 of 6 riders</YummyText>
                </div>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search riders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                  {/* Status Filter */}
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    {statusFilter}
                  </button>
                  {/* KYC Filter */}
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    {kycFilter}
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <YummyText>
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="w-[8%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                        Rider ID
                      </th>
                      <th className="w-[12%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                        Name
                      </th>
                      <th className="w-[18%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="w-[20%] px-1 py-3 text-left text-[10.5px] font-medium text-[#0A0A0A] uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="w-[10%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                        Deliveries
                      </th>
                      <th className="w-[10%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                        Earnings
                      </th>
                      <th className="w-[8%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                        KYC
                      </th>
                      <th className="w-[8%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-[6%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div className="overflow-y-auto max-h-[500px]">
                <table className="w-full table-fixed">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {riders.map((rider, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="w-[8%] px-1 py-4 whitespace-nowrap">
                          <YummyText className="text-[12px] font-medium text-gray-900">{rider.id}</YummyText>
                        </td>
                        <td className="w-[12%] px-1 py-4 whitespace-nowrap">
                          <div>
                            <YummyText className="text-xs font-medium text-gray-900 truncate">{rider.name}</YummyText>
                            <YummyText className="text-xs text-gray-500 truncate">{rider.joined}</YummyText>
                          </div>
                        </td>
                        <td className="w-[18%] px-1 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-600">
                              <Mail className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{rider.email}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <Phone className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{rider.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="w-[20%] px-1 py-4">
                          <div>
                            <div className="flex items-center text-xs text-gray-900 font-medium">
                              <span className="truncate">{rider.vehicle}</span>
                            </div>
                            <YummyText className="text-xs text-gray-500 truncate">{rider.license}</YummyText>
                          </div>
                        </td>
                        <td className="w-[10%] px-5 py-4 whitespace-nowrap">
                          <YummyText className="text-xs text-gray-900">{rider.deliveries}</YummyText>
                        </td>
                        <td className="w-[10%] px-1 py-4 whitespace-nowrap">
                          <YummyText className="text-xs font-medium text-gray-900">{rider.earnings}</YummyText>
                        </td>
                        <td className="w-[8%] px-1 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${rider.kycColor}`}>
                            {rider.kyc}
                          </span>
                        </td>
                        <td className="w-[8%] px-1 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${rider.statusColor}`}>
                            {rider.status}
                          </span>
                        </td>
                        <td className="w-[6%] px-1 py-4 whitespace-nowrap text-center">
                          <button className="text-[#0A0A0A] hover:text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </YummyText>
          </div>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default ManageRiders;