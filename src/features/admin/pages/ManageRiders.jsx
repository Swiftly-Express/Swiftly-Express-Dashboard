import React, { useState, useEffect, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Search, Filter, MoreVertical, Mail, Phone, AlertCircle } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';
import ToyBikeIcon from '../../../icons/Toybikeicon';
import CheckCircleIcon from '../../../icons/Circlecheck';
import PauseIcon from '../../../icons/Pauseicon';
import ClockIcon from '../../../icons/Clockicon';
import BanIcon from '../../../icons/Banicon';
import { getDriverAnalytics } from '../../../utils/adminApi';

const ManageRiders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [kycFilter, setKycFilter] = useState('All KYC');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ridersData, setRidersData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch riders data
  useEffect(() => {
    const fetchRiders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDriverAnalytics();
        
        // Handle different response structures
        const drivers = response?.data?.drivers || response?.drivers || response?.data || [];
        setRidersData(Array.isArray(drivers) ? drivers : []);
      } catch (err) {
        console.error('Error fetching riders:', err);
        setError(err.message || 'Failed to fetch riders data');
        setRidersData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();
  }, []);

  // Helper function to get KYC status from verification data
  const getKycStatus = (rider) => {
    const verification = rider.verification || rider.kyc || {};
    const status = verification.status || verification.verificationStatus || 'pending';
    
    // Normalize status to match our UI expectations
    if (status === 'approved' || status === 'verified') return 'Approved';
    if (status === 'rejected' || status === 'declined') return 'Rejected';
    return 'Pending';
  };

  // Helper function to get rider status
  const getRiderStatus = (rider) => {
    if (rider.isSuspended || rider.suspended || rider.status === 'suspended') return 'Suspended';
    if (rider.isActive || rider.active || rider.status === 'active') return 'Active';
    return 'Inactive';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₦0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₦${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format number
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-US');
  };

  // Transform API data to UI format
  const transformedRiders = useMemo(() => {
    return ridersData.map(rider => {
      const kycStatus = getKycStatus(rider);
      const riderStatus = getRiderStatus(rider);
      
      // Get KYC status color
      const kycColor = kycStatus === 'Approved' 
        ? 'bg-green-100 text-green-800'
        : kycStatus === 'Rejected'
        ? 'bg-red-100 text-red-800'
        : 'bg-yellow-100 text-yellow-800';

      // Get status color
      const statusColor = riderStatus === 'Active'
        ? 'bg-green-100 text-green-800'
        : riderStatus === 'Suspended'
        ? 'bg-red-100 text-red-800'
        : 'bg-gray-100 text-gray-800';

      return {
        id: rider.riderId || rider.driverId || rider.id || 'N/A',
        name: rider.name || rider.fullName || `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || 'Unknown',
        joined: formatDate(rider.createdAt || rider.joinedDate || rider.registeredAt),
        email: rider.email || 'N/A',
        phone: rider.phone || rider.phoneNumber || rider.mobile || 'N/A',
        vehicle: rider.vehicleType || rider.vehicle?.type || 'Not specified',
        license: rider.licenseNumber || rider.driverLicense || rider.license || 'N/A',
        deliveries: formatNumber(rider.totalDeliveries || rider.deliveryCount || rider.completedTrips || 0),
        earnings: formatCurrency(rider.totalEarnings || rider.earnings || 0),
        kyc: kycStatus,
        kycColor: kycColor,
        status: riderStatus,
        statusColor: statusColor,
        rawData: rider // Keep raw data for debugging
      };
    });
  }, [ridersData]);

  // Filter riders based on search and filters
  const filteredRiders = useMemo(() => {
    return transformedRiders.filter(rider => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        rider.name.toLowerCase().includes(searchLower) ||
        rider.email.toLowerCase().includes(searchLower) ||
        rider.phone.toLowerCase().includes(searchLower) ||
        rider.id.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'All Status' || rider.status === statusFilter;

      // KYC filter
      const matchesKyc = kycFilter === 'All KYC' || rider.kyc === kycFilter;

      return matchesSearch && matchesStatus && matchesKyc;
    });
  }, [transformedRiders, searchQuery, statusFilter, kycFilter]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalRiders = transformedRiders.length;
    const activeCount = transformedRiders.filter(r => r.status === 'Active').length;
    const inactiveCount = transformedRiders.filter(r => r.status === 'Inactive').length;
    const pendingKycCount = transformedRiders.filter(r => r.kyc === 'Pending').length;
    const suspendedCount = transformedRiders.filter(r => r.status === 'Suspended').length;

    return [
      { 
        label: 'Total Riders', 
        value: formatNumber(totalRiders), 
        icon: <ToyBikeIcon className="w-5 h-5" stroke="#1E1E1E" />,
        bgColor: '#F3F4F6',
        valueColor: '#1E1E1E'
      },
      { 
        label: 'Active', 
        value: formatNumber(activeCount), 
        icon: <CheckCircleIcon size={18} color="#00A63E" />,
        bgColor: '#D1FAE5',
        valueColor: '#00A63E'
      },
      { 
        label: 'Inactive', 
        value: formatNumber(inactiveCount), 
        icon: <PauseIcon className="w-5 h-5" stroke="#6B7280" />,
        bgColor: '#F3F4F6',
        valueColor: '#6B7280'
      },
      { 
        label: 'Pending KYC', 
        value: formatNumber(pendingKycCount), 
        icon: <ClockIcon className="w-5 h-5" stroke="#F59E0B" />,
        bgColor: '#FEF3C7',
        valueColor: '#F59E0B'
      },
      { 
        label: 'Suspended', 
        value: formatNumber(suspendedCount), 
        icon: <BanIcon className="w-5 h-5" stroke="#EF4444" />,
        bgColor: '#FEE2E2',
        valueColor: '#EF4444'
      }
    ];
  }, [transformedRiders]);

  // Pagination
  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage);
  const paginatedRiders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRiders.slice(startIndex, endIndex);
  }, [filteredRiders, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-no-padding">
          {/* Header */}
          <div className="mb-8">
            <YummyText className="text-3xl font-medium text-[#1E1E1E] mb-2">Manage Riders</YummyText>
            <YummyText className="text-[#717182]">View and manage all rider accounts</YummyText>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
                <YummyText className="text-gray-600">Loading riders data...</YummyText>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <YummyText className="text-red-900 font-medium mb-1">Error Loading Data</YummyText>
                  <YummyText className="text-red-700 text-sm">{error}</YummyText>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
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

              {/* Riders Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Table Header */}
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <YummyText className="text-medium font-medium text-gray-900">All Riders</YummyText>
                      <YummyText className="text-xs text-gray-500">
                        Showing {paginatedRiders.length} of {filteredRiders.length} riders
                        {searchQuery || statusFilter !== 'All Status' || kycFilter !== 'All KYC' 
                          ? ` (filtered from ${transformedRiders.length} total)`
                          : ''}
                      </YummyText>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search riders..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                          }}
                          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                        />
                      </div>
                      {/* Status Filter */}
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1); // Reset to first page on filter
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All Status">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                      {/* KYC Filter */}
                      <select
                        value={kycFilter}
                        onChange={(e) => {
                          setKycFilter(e.target.value);
                          setCurrentPage(1); // Reset to first page on filter
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All KYC">All KYC</option>
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <YummyText>
                  <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed">
                        <thead className="border-b border-gray-100 sticky top-0 z-10 bg-white">
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
                          {paginatedRiders.length === 0 ? (
                            <tr>
                              <td colSpan="9" className="px-6 py-12 text-center">
                                <YummyText className="text-gray-500">
                                  {searchQuery || statusFilter !== 'All Status' || kycFilter !== 'All KYC'
                                    ? 'No riders match your search criteria'
                                    : 'No riders found'}
                                </YummyText>
                              </td>
                            </tr>
                          ) : (
                            paginatedRiders.map((rider, index) => (
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </YummyText>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <YummyText className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </YummyText>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default ManageRiders;