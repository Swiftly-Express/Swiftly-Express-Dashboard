import React, { useState, useEffect, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Search, MoreVertical, Mail, Phone, AlertCircle, X, Eye, FileText } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';
import ToyBikeIcon from '../../../icons/Toybikeicon';
import CheckCircleIcon from '../../../icons/Circlecheck';
import PauseIcon from '../../../icons/Pauseicon';
import ClockIcon from '../../../icons/Clockicon';
import BanIcon from '../../../icons/Banicon';
import { getApprovedRiders, getVerificationByDriver, approveVerification, rejectVerification, setDriverDebtLimit } from '../../../utils/adminApi';
import StyledDropdown from '../../../components/StyledDropdown';
import { Check, XCircle } from 'lucide-react';

const ManageRiders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [kycFilter, setKycFilter] = useState('All KYC');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ridersData, setRidersData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const statusOptions = ['All Status', 'Active', 'Inactive', 'Suspended'];
  const kycOptions = ['All KYC', 'Approved', 'Pending', 'Rejected'];

  const [selectedRider, setSelectedRider] = useState(null);
  const [riderDetail, setRiderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('contact');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [showDebtLimitModal, setShowDebtLimitModal] = useState(false);
  const [debtLimitAmount, setDebtLimitAmount] = useState('');

  const fetchRiders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getApprovedRiders(1, 100);
      const drivers = response?.data?.drivers || [];
      setRidersData(Array.isArray(drivers) ? drivers : []);
    } catch (err) {
      console.error('Error fetching riders:', err);
      setError(err.message || 'Failed to fetch riders data');
      setRidersData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
    const handleDeliveryStatusChanged = () => {
      console.log('[ManageRiders] Delivery status changed, refreshing rider data...');
      fetchRiders();
    };
    const handleRiderStatusChanged = () => {
      console.log('[ManageRiders] Rider status/availability changed, refreshing rider data...');
      fetchRiders();
    };
    window.addEventListener('delivery:statusChanged', handleDeliveryStatusChanged);
    window.addEventListener('rider:statusChanged', handleRiderStatusChanged);
    window.addEventListener('rider:availabilityChanged', handleRiderStatusChanged);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('delivery:statusChanged', handleDeliveryStatusChanged);
      window.removeEventListener('rider:statusChanged', handleRiderStatusChanged);
      window.removeEventListener('rider:availabilityChanged', handleRiderStatusChanged);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Helper function to get KYC status from verificationStatus field
  const getKycStatus = (rider) => {
    const status = rider.verificationStatus || 'pending';
    if (status === 'approved' || status === 'verified') return 'Approved';
    if (status === 'rejected' || status === 'declined') return 'Rejected';
    return 'Pending';
  };

  // Helper function to get rider status
  // Use backend-provided active/inactive status directly if available
  const getRiderStatus = (rider) => {
    if (rider.isSuspended || rider.suspended || rider.status === 'suspended') return 'Suspended';
    // Prefer backend-provided toggle/flag for active state
    if (typeof rider.isActive === 'boolean') return rider.isActive ? 'Active' : 'Inactive';
    if (typeof rider.active === 'boolean') return rider.active ? 'Active' : 'Inactive';
    if (rider.status === 'active') return 'Active';
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
    console.log('[ManageRiders] Raw ridersData:', ridersData);
    return ridersData.map((rider, idx) => {
      // Prefer merged/profile data when available (some APIs return nested user/profile objects)
      const profile = rider._merged || rider.user || rider.driver || rider.profile || rider.account || rider;

      console.log(`[ManageRiders] Rider ${idx}:`, {
        rawRider: rider,
        profile: profile,
        vehicle: rider.vehicle,
        vehicleType: rider.vehicleType,
        phone: profile.phone,
        phoneNumber: profile.phoneNumber,
        totalDeliveries: rider.totalDeliveries,
        deliveryCount: rider.deliveryCount
      });

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

      // Full vehicle object from API (for modal and details)
      const vehicleObj = (rider.vehicle && typeof rider.vehicle === 'object')
        ? rider.vehicle
        : (profile.vehicle && typeof profile.vehicle === 'object')
          ? profile.vehicle
          : null;

      // Display string for vehicle type (table/card)
      let vehicleDisplay = 'Not specified';
      if (vehicleObj?.type) vehicleDisplay = vehicleObj.type;
      else if (vehicleObj?.vehicleType) vehicleDisplay = vehicleObj.vehicleType;
      else if (vehicleObj?.name) vehicleDisplay = vehicleObj.name;
      else if (vehicleObj?.model) vehicleDisplay = vehicleObj.model;
      else if (vehicleObj?.make) vehicleDisplay = vehicleObj.make;
      else if (rider.vehicleType) vehicleDisplay = rider.vehicleType;
      else if (typeof rider.vehicle === 'string' && rider.vehicle) vehicleDisplay = rider.vehicle;
      else if (profile.vehicleType) vehicleDisplay = profile.vehicleType;
      else if (typeof profile.vehicle === 'string' && profile.vehicle) vehicleDisplay = profile.vehicle;
      else if (rider.vehicleDetails?.type) vehicleDisplay = rider.vehicleDetails.type;
      else if (rider.bikeType) vehicleDisplay = rider.bikeType;
      else if (profile.bikeType) vehicleDisplay = profile.bikeType;

      let license = 'N/A';
      if (rider.licenseNumber) license = rider.licenseNumber;
      else if (rider.license) license = rider.license;
      else if (profile.licenseNumber) license = profile.licenseNumber;
      else if (profile.license) license = profile.license;
      else if (profile.driverLicense) license = profile.driverLicense;

      return {
        id: rider.riderId || rider.driverId || profile._id || profile.id || rider.id || 'N/A',
        name: profile.name || profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown',
        joined: formatDate(profile.createdAt || profile.joinedDate || profile.registeredAt || rider.createdAt),
        email: profile.email || profile.contactEmail || rider.email || 'N/A',
        phone: profile.phone || profile.phoneNumber || profile.mobile || profile.contact || profile.tel || profile.telephone || rider.phone || rider.phoneNumber || rider.mobile || 'N/A',
        vehicle: vehicleObj,
        vehicleType: vehicleDisplay,
        license,
        deliveries: formatNumber(
          rider.totalDeliveries ||
          rider.deliveryCount ||
          rider.completedDeliveries ||
          rider.completedTrips ||
          rider.deliveries ||
          rider.totalOrders ||
          rider.completedOrders ||
          profile.totalDeliveries ||
          profile.deliveryCount ||
          profile.completedDeliveries ||
          0
        ),
        earnings: formatCurrency(rider.totalEarnings || rider.earnings || profile.totalEarnings || 0),
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
  console.log('Rendering riders:', paginatedRiders)

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openRiderDetail = async (rider) => {
    setSelectedRider(rider);
    setRiderDetail(null);
    setDetailLoading(true);
    setDetailTab('contact');
    try {
      const verificationRes = await getVerificationByDriver(rider.id).catch(() => ({ data: { verification: null } }));
      const verification = verificationRes?.data?.verification ?? verificationRes?.verification ?? null;
      setRiderDetail({ verification });
    } catch (err) {
      console.error('[ManageRiders] Error loading rider detail:', err);
      setRiderDetail({ verification: null });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeRiderDetail = () => {
    setSelectedRider(null);
    setRiderDetail(null);
    setDetailTab('contact');
    setShowRejectModal(false);
    setRejectReason('');
    setActionMessage({ type: '', text: '' });
  };

  const verificationId = riderDetail?.verification?._id || riderDetail?.verification?.id;
  const isPendingKyc = riderDetail?.verification?.verificationStatus === 'pending';

  const handleApprove = async () => {
    if (!verificationId) return;
    setActionMessage({ type: '', text: '' });
    setActionLoading(true);
    try {
      await approveVerification(verificationId, { verificationStatus: 'approved' });
      setActionMessage({ type: 'success', text: 'Rider approved successfully.' });
      window.dispatchEvent(new CustomEvent('kyc:updated', { detail: { action: 'approved', verificationId } }));
      await fetchRiders();
      setRiderDetail(prev => prev?.verification ? { verification: { ...prev.verification, verificationStatus: 'approved' } } : null);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to approve.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!verificationId || !rejectReason.trim()) return;
    setActionMessage({ type: '', text: '' });
    setActionLoading(true);
    try {
      await rejectVerification(verificationId, { reason: rejectReason.trim() });
      setActionMessage({ type: 'success', text: 'Rider verification rejected.' });
      setShowRejectModal(false);
      setRejectReason('');
      window.dispatchEvent(new CustomEvent('kyc:updated', { detail: { action: 'rejected', verificationId } }));
      await fetchRiders();
      setRiderDetail(prev => prev?.verification ? { verification: { ...prev.verification, verificationStatus: 'rejected' } } : null);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to reject.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDebtLimit = async () => {
    if (!selectedRider || !debtLimitAmount.trim()) {
      setActionMessage({ type: 'error', text: 'Please enter a valid debt limit amount' });
      return;
    }

    const amount = parseFloat(debtLimitAmount);
    if (isNaN(amount) || amount < 0) {
      setActionMessage({ type: 'error', text: 'Please enter a valid positive number' });
      return;
    }

    try {
      setActionLoading(true);
      const driverId = selectedRider._id || selectedRider.id;
      await setDriverDebtLimit(driverId, amount);
      setActionMessage({ type: 'success', text: `Debt limit set to ₦${amount.toLocaleString()} successfully` });
      setShowDebtLimitModal(false);
      setDebtLimitAmount('');
      await fetchRiders();
    } catch (err) {
      console.error('Error setting debt limit:', err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to set debt limit' });
    } finally {
      setActionLoading(false);
    }
  };

  const openDocument = (url) => {
    if (url) window.open(url, '_blank');
  };

  const getDetailFullDetails = () => {
    if (!riderDetail || !selectedRider) return null;
    const { verification } = riderDetail;
    const contactInfo = verification?.contactInfo || {};
    const identity = verification?.identity || {};
    const vehicle = verification?.vehicle || {};
    return {
      email: contactInfo?.email || selectedRider?.email || 'Not provided',
      phone: contactInfo?.phone || selectedRider?.phone || 'Not provided',
      address: contactInfo?.streetAddress || 'Not provided',
      city: contactInfo?.city || '',
      state: contactInfo?.state || '',
      zipCode: contactInfo?.zipCode || '',
      emergencyContact: contactInfo?.emergencyContact || 'Not provided',
      emergencyPhone: contactInfo?.emergencyPhone || '',
      fullName: identity?.fullName || selectedRider?.name || 'Not provided',
      idType: identity?.idType || 'Not provided',
      idNumber: identity?.idNumber || 'Not provided',
      vehicleType: vehicle?.type || selectedRider?.vehicle || 'Not provided',
      makeModel: vehicle?.makeModel || 'Not provided',
      year: vehicle?.year || '',
      licensePlate: vehicle?.licensePlate || 'Not provided',
      documentUrls: {
        idFront: identity?.idDocumentUrl,
        idBack: null,
        selfie: identity?.profilePhotoUrl,
        vehicleRegistration: null,
        driversLicense: vehicle?.driversLicenseUrl,
        insurance: vehicle?.insuranceUrl
      }
    };
  };

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className={isMobile ? 'ion-padding' : 'ion-no-padding'}>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100">
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
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <YummyText className="text-medium font-medium text-gray-900">All Riders</YummyText>
                      <YummyText className="text-xs text-gray-500">
                        Showing {paginatedRiders.length} of {filteredRiders.length} riders
                        {searchQuery || statusFilter !== 'All Status' || kycFilter !== 'All KYC'
                          ? ` (filtered from ${transformedRiders.length} total)`
                          : ''}
                      </YummyText>
                    </div>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                      <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search riders..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="w-full md:w-auto">
                        <StyledDropdown
                          value={statusFilter}
                          onChange={(val) => {
                            setStatusFilter(val);
                            setCurrentPage(1);
                          }}
                          options={statusOptions}
                          className="w-full md:w-auto"
                          width="w-44"
                        />
                      </div>
                      <div className="w-full md:w-auto">
                        <StyledDropdown
                          value={kycFilter}
                          onChange={(val) => {
                            setKycFilter(val);
                            setCurrentPage(1);
                          }}
                          options={kycOptions}
                          className="w-full md:w-auto"
                          width="w-44"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <YummyText>
                  {isMobile ? (
                    <div className="space-y-4 p-4">
                      {paginatedRiders.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No riders found</p>
                        </div>
                      ) : (


                        paginatedRiders.map((rider, idx) => (
                          <div
                            key={rider.id || idx}
                            onClick={() => openRiderDetail(rider)}
                            className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm cursor-pointer hover:border-gray-200 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 pr-3">
                                <YummyText className="text-sm font-medium text-gray-900 truncate">{rider.name}</YummyText>
                                <div className="text-xs text-gray-600 truncate mt-1">{rider.email}</div>
                                <div className="text-xs text-gray-600 truncate mt-1">{rider.phone}</div>
                                <div className="text-xs text-gray-600 truncate mt-1">{rider.vehicle?.type ?? rider.vehicleType ?? 'Not specified'}</div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <YummyText className="text-sm text-gray-600">{rider.id}</YummyText>
                                <YummyText className="text-xs text-gray-400">{rider.joined}</YummyText>
                                <div className="mt-2">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${rider.statusColor}`}>{rider.status}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openRiderDetail(rider); }}
                                className="text-[#0A0A0A] hover:text-gray-600"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                          <thead className="border-b border-gray-100 sticky top-0 z-10 bg-white">
                            <tr>
                              <th className="w-[8%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                                Rider ID
                              </th>
                              <th className="w-[12%] px-2 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                                Name
                              </th>
                              <th className="w-[16%] px-8 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                                Contact
                              </th>
                              <th className="w-[20%] px-3 py-3 text-center text-[10.5px] font-medium text-[#0A0A0A] uppercase tracking-wider">
                                Vehicle
                              </th>
                              <th className="w-[10%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                                Deliveries
                              </th>
                              <th className="w-[10%] px-1 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                                Earnings
                              </th>
                              <th className="w-[8%] px-5 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
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
                              (console.log('[ManageRiders] paginatedRiders', paginatedRiders), paginatedRiders.map((rider, index) => (
                                <tr
                                  key={index}
                                  onClick={() => openRiderDetail(rider)}
                                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                  <td className="w-[8%] px-1 py-4 whitespace-nowrap">
                                    <span
                                      className="text-[12px] font-medium text-gray-900"
                                      style={{
                                        maxWidth: '68px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        display: 'inline-block',
                                        verticalAlign: 'bottom'
                                      }}
                                      title={rider.id}
                                    >
                                      {rider.id}
                                    </span>
                                  </td>
                                  <td className="w-[12%] px-2 py-4 whitespace-nowrap">
                                    <div>
                                      <span
                                        className="text-xs font-medium text-gray-900"
                                        style={{
                                          maxWidth: '110px',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          display: 'inline-block',
                                          verticalAlign: 'bottom'
                                        }}
                                        title={rider.name}
                                      >
                                        {rider.name}
                                      </span>
                                      <YummyText className="text-xs text-gray-500 truncate">{rider.joined}</YummyText>
                                    </div>
                                  </td>
                                  <td className="w-[18%] px-4 py-4 whitespace-nowrap">
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
                                  <td className="w-[20%] px-1 text-center py-4">
                                    <div>
                                      <div className="flex items-center justify-center text-xs text-gray-900 font-medium">
                                        <span className="truncate">{rider.vehicle?.type ?? rider.vehicleType ?? 'Not specified'}</span>
                                      </div>
                                      <YummyText className="text-xs text-gray-500 truncate">{rider.vehicle?.makeModel ?? rider.vehicleType ?? 'N/A'}</YummyText>
                                    </div>
                                  </td>
                                  <td className="w-[10%] px-5 py-4 whitespace-nowrap">
                                    <YummyText className="text-xs text-gray-900">{rider.deliveries}</YummyText>
                                  </td>
                                  <td className="w-[10%] px-2 py-4 whitespace-nowrap">
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
                                  <td className="w-[6%] px-1 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => openRiderDetail(rider)}
                                      className="text-[#0A0A0A] hover:text-gray-600"
                                    >
                                      <MoreVertical className="w-5 h-5" />
                                    </button>
                                  </td>
                                </tr>
                              )))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
                              className={`px-3 py-1 rounded-lg text-sm transition-colors ${currentPage === pageNum
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

          {/* Rider Detail Modal */}
          {selectedRider && (
            <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-md bg-black/40" style={{ zIndex: 9999 }} onClick={closeRiderDetail}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <YummyText className="text-xl font-medium text-[#1E1E1E] mb-1">Rider Details</YummyText>
                      <YummyText className="text-sm text-[#717182]">{selectedRider.name} · {selectedRider.email}</YummyText>
                    </div>
                    <button type="button" onClick={closeRiderDetail} className="text-[#717182] hover:text-gray-600 transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                  <div className="p-6">
                    {detailLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedRider.kycColor}`}>{selectedRider.kyc}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedRider.statusColor}`}>{selectedRider.status}</span>
                        </div>
                        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-full">
                          <button type="button" onClick={() => setDetailTab('contact')} className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${detailTab === 'contact' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#0A0A0A] hover:text-gray-900'}`}>
                            Contact
                          </button>
                          <button type="button" onClick={() => setDetailTab('identity')} className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${detailTab === 'identity' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#0A0A0A] hover:text-gray-900'}`}>
                            Identity & Documents
                          </button>
                          <button type="button" onClick={() => setDetailTab('vehicle')} className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${detailTab === 'vehicle' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#0A0A0A] hover:text-gray-900'}`}>
                            Vehicle & Documents
                          </button>
                        </div>
                        {(() => {
                          const fd = getDetailFullDetails();
                          if (!fd) return <YummyText className="text-sm text-gray-500">No additional details available.</YummyText>;
                          return (
                            <>
                              {detailTab === 'contact' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div><YummyText className="text-xs text-gray-500 mb-1">Email</YummyText><YummyText className="text-sm text-[#0A0A0A]">{fd.email}</YummyText></div>
                                  <div><YummyText className="text-xs text-gray-500 mb-1">Phone</YummyText><YummyText className="text-sm text-[#0A0A0A]">{fd.phone}</YummyText></div>
                                  <div className="col-span-2"><YummyText className="text-xs text-gray-500 mb-1">Address</YummyText><YummyText className="text-sm text-[#0A0A0A]">{fd.address}</YummyText></div>
                                  <div><YummyText className="text-xs text-gray-500 mb-1">Emergency Contact</YummyText><YummyText className="text-sm text-[#0A0A0A]">{fd.emergencyContact}</YummyText></div>
                                  <div><YummyText className="text-xs text-gray-500 mb-1">Emergency Phone</YummyText><YummyText className="text-sm text-[#0A0A0A]">{fd.emergencyPhone || 'Not provided'}</YummyText></div>
                                </div>
                              )}
                              {detailTab === 'identity' && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><YummyText className="text-xs text-gray-500 mb-1">Full Name</YummyText><YummyText className="text-sm text-gray-900">{fd.fullName}</YummyText></div>
                                    <div><YummyText className="text-xs text-gray-500 mb-1">ID Type</YummyText><YummyText className="text-sm text-gray-900">{fd.idType}</YummyText></div>
                                    <div><YummyText className="text-xs text-gray-500 mb-1">ID Number</YummyText><YummyText className="text-sm text-gray-900">{fd.idNumber}</YummyText></div>
                                  </div>
                                  <div className="mt-6 border-t border-gray-200 pt-4">
                                    <YummyText className="text-sm font-medium text-gray-900 mb-3">Identity Documents</YummyText>
                                    <div className="grid grid-cols-2 gap-4">
                                      {fd.documentUrls?.idFront && (
                                        <div className="border border-gray-200 rounded-lg p-4 text-center bg-white">
                                          <div className="relative h-20 rounded overflow-hidden bg-gray-100 mb-2 flex items-center justify-center">
                                            <img src={fd.documentUrls.idFront} alt="ID Document" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; const fb = e.target.nextElementSibling; if (fb) fb.classList.remove('hidden'); }} />
                                            <div className="hidden absolute inset-0 flex items-center justify-center"><FileText className="w-8 h-8 text-gray-400" /></div>
                                          </div>
                                          <div className="text-sm text-gray-900 mb-1">ID Document</div>
                                          <button type="button" onClick={() => openDocument(fd.documentUrls.idFront)} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100">
                                            <Eye className="w-3 h-3" /> View
                                          </button>
                                        </div>
                                      )}
                                      {fd.documentUrls?.selfie && (
                                        <div className="border border-gray-200 rounded-lg p-4 text-center bg-white">
                                          <div className="relative h-20 rounded overflow-hidden bg-gray-100 mb-2 flex items-center justify-center">
                                            <img src={fd.documentUrls.selfie} alt="Profile Photo" className="w-full h-full object-cover rounded-full" onError={(e) => { e.target.style.display = 'none'; const fb = e.target.nextElementSibling; if (fb) fb.classList.remove('hidden'); }} />
                                            <div className="hidden absolute inset-0 flex items-center justify-center"><FileText className="w-8 h-8 text-gray-400" /></div>
                                          </div>
                                          <div className="text-sm text-gray-900 mb-1">Profile Photo</div>
                                          <button type="button" onClick={() => openDocument(fd.documentUrls.selfie)} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100">
                                            <Eye className="w-3 h-3" /> View
                                          </button>
                                        </div>
                                      )}
                                      {!fd.documentUrls?.idFront && !fd.documentUrls?.selfie && <YummyText className="text-sm text-gray-500 col-span-2">No identity documents submitted yet.</YummyText>}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {detailTab === 'vehicle' && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><YummyText className="text-xs text-gray-500 mb-1">Vehicle Type</YummyText><YummyText className="text-sm text-gray-900">{fd.vehicleType}</YummyText></div>
                                    <div><YummyText className="text-xs text-gray-500 mb-1">Make & Model</YummyText><YummyText className="text-sm text-gray-900">{fd.makeModel}</YummyText></div>
                                    <div><YummyText className="text-xs text-gray-500 mb-1">Year</YummyText><YummyText className="text-sm text-gray-900">{fd.year || 'N/A'}</YummyText></div>
                                    <div><YummyText className="text-xs text-gray-500 mb-1">License Plate</YummyText><YummyText className="text-sm text-gray-900">{fd.licensePlate}</YummyText></div>
                                  </div>
                                  <div className="mt-6 border-t border-gray-200 pt-4">
                                    <YummyText className="text-sm font-medium text-gray-900 mb-3">Vehicle Documents</YummyText>
                                    <div className="grid grid-cols-2 gap-4">
                                      {fd.documentUrls?.driversLicense && (
                                        <div className="border border-gray-200 rounded-lg p-4 text-center bg-white">
                                          <div className="relative h-20 rounded overflow-hidden bg-gray-100 mb-2 flex items-center justify-center">
                                            <img src={fd.documentUrls.driversLicense} alt="Driver's License" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; const fb = e.target.nextElementSibling; if (fb) fb.classList.remove('hidden'); }} />
                                            <div className="hidden absolute inset-0 flex items-center justify-center"><FileText className="w-8 h-8 text-gray-400" /></div>
                                          </div>
                                          <div className="text-sm text-gray-900 mb-1">Driver&apos;s License</div>
                                          <button type="button" onClick={() => openDocument(fd.documentUrls.driversLicense)} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100">
                                            <Eye className="w-3 h-3" /> View
                                          </button>
                                        </div>
                                      )}
                                      {fd.documentUrls?.insurance && (
                                        <div className="border border-gray-200 rounded-lg p-4 text-center bg-white">
                                          <div className="relative h-20 rounded overflow-hidden bg-gray-100 mb-2 flex items-center justify-center">
                                            <img src={fd.documentUrls.insurance} alt="Insurance" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; const fb = e.target.nextElementSibling; if (fb) fb.classList.remove('hidden'); }} />
                                            <div className="hidden absolute inset-0 flex items-center justify-center"><FileText className="w-8 h-8 text-gray-400" /></div>
                                          </div>
                                          <div className="text-sm text-gray-900 mb-1">Insurance</div>
                                          <button type="button" onClick={() => openDocument(fd.documentUrls.insurance)} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100">
                                            <Eye className="w-3 h-3" /> View
                                          </button>
                                        </div>
                                      )}
                                      {!fd.documentUrls?.driversLicense && !fd.documentUrls?.insurance && <YummyText className="text-sm text-gray-500 col-span-2">No vehicle documents submitted yet.</YummyText>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
                {!detailLoading && riderDetail?.verification && isPendingKyc && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-3">
                    {actionMessage.text && (
                      <p className={`text-sm ${actionMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{actionMessage.text}</p>
                    )}
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                )}
                {!detailLoading && (!riderDetail?.verification || !isPendingKyc) && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDebtLimitModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Set Debt Limit
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedRider && showRejectModal && (
            <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50" style={{ zIndex: 10000 }} onClick={() => setShowRejectModal(false)}>
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <YummyText className="text-lg font-medium text-gray-900 mb-2">Reject verification</YummyText>
                <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejection (required):</p>
                <textarea
                  placeholder="Reason for rejection"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <div className="flex gap-3 justify-end mt-4">
                  <button type="button" onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectConfirm}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Debt Limit Modal */}
          {selectedRider && showDebtLimitModal && (
            <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50" style={{ zIndex: 10000 }} onClick={() => setShowDebtLimitModal(false)}>
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <YummyText className="text-lg font-medium text-gray-900 mb-2">Set Debt Limit</YummyText>
                <p className="text-sm text-gray-600 mb-1">Rider: <strong>{selectedRider.name}</strong></p>
                <p className="text-sm text-gray-600 mb-4">Set the maximum debt limit for this rider:</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Debt Limit (₦)</label>
                  <input
                    type="number"
                    placeholder="Enter amount (e.g., 5000)"
                    value={debtLimitAmount}
                    onChange={(e) => setDebtLimitAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    min="0"
                    step="100"
                  />
                </div>
                {actionMessage.text && (
                  <p className={`text-sm mb-3 ${actionMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{actionMessage.text}</p>
                )}
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => { setShowDebtLimitModal(false); setDebtLimitAmount(''); setActionMessage({ type: '', text: '' }); }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSetDebtLimit}
                    disabled={actionLoading || !debtLimitAmount.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Setting...' : 'Set Limit'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default ManageRiders;