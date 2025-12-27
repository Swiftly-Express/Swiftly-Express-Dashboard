import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonRefresher, IonRefresherContent } from '@ionic/react';
import { X, Eye, FileText, Bike, Car, Check, Download, Loader } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';
import ClockIcon from '../../../icons/Clockicon';
import CheckIcon from '../../../icons/Checkicon';
import CircleXIcon from '../../../icons/Circlexicon';
import DocumentIcon from '../../../icons/Documenticon';
import { getPendingVerifications, approveVerification, rejectVerification } from '../../../utils/adminApi';

const KYCApprovals = () => {
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [activeTab, setActiveTab] = useState('contact');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalMonth: 0
  });
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Fetch verifications on mount and when page changes
  useEffect(() => {
    fetchVerifications();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPage]);

  // Listen for verification events from the rider app and refresh list
  useEffect(() => {
    const onVerificationCompleted = (e) => {
      console.log('[KYCApprovals] verification:completed event received', e?.detail);
      setCurrentPage(1);
      fetchVerifications();
    };

    window.addEventListener('verification:completed', onVerificationCompleted);
    return () => {
      window.removeEventListener('verification:completed', onVerificationCompleted);
    };
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPendingVerifications(currentPage, 20);

      console.log('[KYCApprovals] Full API response:', JSON.stringify(response, null, 2));

      // Handle response data structure
      const data = response.data || response;
      const verificationsData = data.verifications || data.data || [];
      const paginationData = data.pagination || {};

      console.log('[KYCApprovals] Extracted verifications:', verificationsData);
      console.log('[KYCApprovals] Sample verification object:', verificationsData[0]);

      setApplications(verificationsData);
      setTotalPages(paginationData.totalPages || 1);

      // Calculate stats from the data
      calculateStats(verificationsData);

    } catch (err) {
      console.error('[KYCApprovals] Error fetching verifications:', err);
      setError(err.message || 'Failed to load verifications');
      showToast('Failed to load verifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh handler
  const handleRefresh = async (event) => {
    console.log('[KYCApprovals] Pull-to-refresh triggered');
    await fetchVerifications();
    event?.detail?.complete();
  };

  const calculateStats = (verificationsData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = verificationsData.filter(v => v.status === 'pending' || v.verificationStatus === 'pending').length;
    const approvedToday = verificationsData.filter(v => {
      const status = v.status || v.verificationStatus;
      const updatedAt = new Date(v.updatedAt || v.updated_at);
      return status === 'approved' && updatedAt >= today;
    }).length;
    const rejectedToday = verificationsData.filter(v => {
      const status = v.status || v.verificationStatus;
      const updatedAt = new Date(v.updatedAt || v.updated_at);
      return status === 'rejected' && updatedAt >= today;
    }).length;

    setStats({
      pending,
      approvedToday,
      rejectedToday,
      totalMonth: verificationsData.length
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getApplicationStatus = (app) => {
    return app.status || app.verificationStatus || 'pending';
  };

  const getApplicationData = (app) => {
    console.log('[KYCApprovals] Mapping application data:', app);

    // Extract contact info from nested structures
    const contactInfo = app.contactInfo || {};
    const identity = app.identity || {};
    const vehicle = app.vehicle || {};
    const user = app.user || app.userId || {};

    // Normalize different API response structures
    const normalizedData = {
      id: app._id || app.id,
      name: app.fullName ||
        identity.fullName ||
        app.name ||
        user.name ||
        `${app.firstName || user.firstName || ''} ${app.lastName || user.lastName || ''}`.trim() ||
        'N/A',
      riderId: app.userId?._id || app.userId || app.riderId || app.user?._id || user._id,
      email: app.email ||
        user.email ||
        contactInfo.email ||
        app.user?.email ||
        'N/A',
      phone: app.phoneNumber ||
        contactInfo.phone ||
        app.phone ||
        user.phone ||
        app.user?.phone ||
        'N/A',
      submitted: app.createdAt || app.created_at || app.submittedAt,
      identity: identity.idType || app.idType || app.identificationType || 'Driver\'s License',
      vehicle: vehicle.makeModel ||
        app.vehicleModel ||
        app.makeModel ||
        `${vehicle.type || ''} ${vehicle.year || ''}`.trim() ||
        'N/A',
      documents: app.documents?.length > 0 ? 'All Submitted' : 'Pending',
      status: getApplicationStatus(app),
      fullDetails: {
        // Contact Information
        address: contactInfo.streetAddress || app.address || app.streetAddress || 'N/A',
        city: contactInfo.city || app.city || 'N/A',
        state: contactInfo.state || app.state || 'N/A',
        zipCode: contactInfo.zipCode || app.zipCode || app.postalCode || 'N/A',
        emergencyContact: app.emergencyContactName || app.emergencyContact || 'N/A',
        emergencyPhone: app.emergencyContactPhone || app.emergencyPhone || 'N/A',

        // Identity Information
        fullName: app.fullName || identity.fullName || app.name || user.name || 'N/A',
        dob: identity.dateOfBirth || app.dateOfBirth || app.dob || 'N/A',
        nationality: identity.nationality || app.nationality || 'N/A',
        idType: identity.idType || app.idType || app.identificationType || 'N/A',
        idNumber: identity.idNumber || app.idNumber || app.identificationNumber || 'N/A',
        idExpiry: identity.idExpiryDate || app.idExpiryDate || app.idExpiry || 'N/A',

        // Vehicle Information
        vehicleType: vehicle.type || app.vehicleType || 'N/A',
        makeModel: vehicle.makeModel || app.vehicleModel || app.makeModel || 'N/A',
        year: vehicle.year || app.vehicleYear || app.year || 'N/A',
        licensePlate: vehicle.licensePlate || app.licensePlate || app.vehiclePlate || 'N/A',
        insurance: vehicle.insurance || app.insuranceExpiry || app.insurance || 'N/A',

        // Documents
        documents: app.documents || [],
        documentUrls: {
          idFront: app.idFrontUrl || app.documents?.find(d => d.type === 'id_front' || d.type === 'idDocument')?.url,
          idBack: app.idBackUrl || app.documents?.find(d => d.type === 'id_back')?.url,
          selfie: app.selfieUrl || app.documents?.find(d => d.type === 'selfie' || d.type === 'profilePhoto')?.url,
          vehicleRegistration: app.vehicleRegUrl || app.documents?.find(d => d.type === 'vehicle_registration')?.url,
          driversLicense: app.driversLicenseUrl || app.documents?.find(d => d.type === 'driversLicense' || d.type === 'drivers_license')?.url,
          insurance: app.insuranceUrl || app.documents?.find(d => d.type === 'insurance')?.url,
        }
      }
    };

    console.log('[KYCApprovals] Normalized application data:', normalizedData);
    return normalizedData;
  };

  // Get status icon and styling
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
      case 'Pending':
        return {
          icon: <ClockIcon className="w-3.5 h-3.5" stroke="#D08700" />,
          bgColor: 'bg-[#FEF9C2]',
          textColor: 'text-[#D08700]',
          borderColor: 'border-[#F5E6B3]'
        };
      case 'approved':
      case 'Approved':
        return {
          icon: <CheckIcon size={14} color="#00A63E" />,
          bgColor: 'bg-[#D1FAE5]',
          textColor: 'text-[#00A63E]',
          borderColor: 'border-[#A7F3D0]'
        };
      case 'rejected':
      case 'Rejected':
        return {
          icon: <CircleXIcon className="w-3.5 h-3.5" stroke="#E7000B" />,
          bgColor: 'bg-[#FFE2E2]',
          textColor: 'text-[#E7000B]',
          borderColor: 'border-[#FFC9C9]'
        };
      default:
        return {
          icon: <ClockIcon className="w-3.5 h-3.5" stroke="#D08700" />,
          bgColor: 'bg-[#FEF9C2]',
          textColor: 'text-[#D08700]',
          borderColor: 'border-[#F5E6B3]'
        };
    }
  };

  const openModal = (application) => {
    const normalizedApp = getApplicationData(application);
    setSelectedApplication(normalizedApp);
    setActiveTab('contact');
    setApprovalNotes('');
    setRejectReason('');
  };

  const closeModal = () => {
    setSelectedApplication(null);
    setApprovalNotes('');
    setRejectReason('');
    setShowRejectModal(false);
    setShowApproveModal(false);
  };

  const handleApproveClick = () => {
    setShowApproveModal(true);
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    try {
      setActionLoading(true);
      const verificationId = selectedApplication.id;

      await approveVerification(verificationId, {
        notes: approvalNotes || 'Application approved by admin'
      });

      showToast('Application approved successfully!', 'success');
      closeModal();

      // Refresh the list
      await fetchVerifications();
    } catch (err) {
      console.error('[KYCApprovals] Error approving verification:', err);
      showToast(err.message || 'Failed to approve application', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    if (!rejectReason.trim()) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const verificationId = selectedApplication.id;

      await rejectVerification(verificationId, {
        reason: rejectReason
      });

      showToast('Application rejected', 'success');
      closeModal();

      // Refresh the list
      await fetchVerifications();
    } catch (err) {
      console.error('[KYCApprovals] Error rejecting verification:', err);
      showToast(err.message || 'Failed to reject application', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadDocument = (url, filename) => {
    if (!url) {
      showToast('Document URL not available', 'error');
      return;
    }

    // Open in new tab or download
    window.open(url, '_blank');
  };

  const statsData = [
    {
      label: 'Pending Review',
      value: stats.pending.toString(),
      icon: <ClockIcon className="w-5 h-5" stroke="#D08700" />,
      bgColor: '#FEF9C2',
      valueColor: '#000000'
    },
    {
      label: 'Approved Today',
      value: stats.approvedToday.toString(),
      icon: <CheckIcon size={18} color="#00A63E" />,
      bgColor: '#D1FAE5',
      valueColor: '#00A63E'
    },
    {
      label: 'Rejected Today',
      value: stats.rejectedToday.toString(),
      icon: <CircleXIcon className="w-5 h-5" stroke="#EF4444" />,
      bgColor: '#FFE2E2',
      valueColor: '#E7000B'
    },
    {
      label: 'Total This Month',
      value: stats.totalMonth.toString(),
      icon: <DocumentIcon width={18} height={18} stroke="#3B82F6" />,
      bgColor: '#DBEAFE',
      valueColor: '#000000'
    }
  ];

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className={isMobile ? 'ion-padding' : 'ion-no-padding'}>
          {/* Pull-to-Refresh */}
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          {/* Toast Notification */}
          {toast.show && (
            <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              } text-white`}>
              {toast.message}
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <YummyText>
              <div className="text-3xl font-medium text-[#1E1E1E] mb-0.5">KYC Approvals</div>
              <div className="text-[#717182]">Review and approve rider verification applications</div>
            </YummyText>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {statsData.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex flex-col items-start">
                  <div
                    className="p-2 rounded-lg mb-3"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    {stat.icon}
                  </div>
                  <YummyText className="text-sm text-gray-500 -mt-2 -mb-0.5">{stat.label}</YummyText>
                  <YummyText className="text-3xl font-medium" style={{ color: stat.valueColor }}>{stat.value}</YummyText>
                </div>
              </div>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 animate-spin text-[#00A63E]" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <CircleXIcon className="w-12 h-12 stroke-red-500 mx-auto mb-3" />
              <YummyText className="text-red-800 font-medium mb-2">Failed to load verifications</YummyText>
              <YummyText className="text-red-600 text-sm mb-4">{error}</YummyText>
              <button
                onClick={fetchVerifications}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Applications List */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <YummyText>
                  <div className="text-lg font-medium text-gray-900">Pending Applications </div>
                  <div className="text-sm text-[#717182]">Review and verify rider KYC submissions</div>
                </YummyText>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentIcon width={48} height={48} stroke="#D1D5DB" className="mx-auto mb-3" />
                  <YummyText className="text-gray-500">No pending applications</YummyText>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {applications.map((app, index) => {
                      const normalizedApp = getApplicationData(app);
                      return (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <YummyText className="text-lg font-medium text-[#0A0A0A] mr-3">{normalizedApp.name}</YummyText>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${getStatusDisplay(normalizedApp.status).bgColor} ${getStatusDisplay(normalizedApp.status).textColor} ${getStatusDisplay(normalizedApp.status).borderColor}`}>
                                  {getStatusDisplay(normalizedApp.status).icon}
                                  {normalizedApp.status.charAt(0).toUpperCase() + normalizedApp.status.slice(1)}
                                </span>
                              </div>
                              <YummyText className="text-sm text-gray-600 mb-1">Application ID: {normalizedApp.id}</YummyText>
                              {normalizedApp.riderId && <YummyText className="text-sm text-gray-600 mb-1">Rider ID: {normalizedApp.riderId}</YummyText>}
                              <YummyText className="text-sm text-gray-600 mb-1">Email: {normalizedApp.email || 'N/A'}</YummyText>
                              <YummyText className="text-sm text-gray-600">Phone: {normalizedApp.phone || 'N/A'}</YummyText>
                              <YummyText className="text-xs text-gray-400 mt-2">Submitted: {formatDate(normalizedApp.submitted)}</YummyText>
                            </div>
                            <button
                              onClick={() => openModal(app)}
                              className="bg-[#00A63E] hover:bg-[#007A29] text-white px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Review
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 text-blue-500 mr-2" />
                              <div>
                                <YummyText className="text-xs text-gray-500">Identity</YummyText>
                                <YummyText className="text-sm font-medium text-gray-900">{normalizedApp.identity}</YummyText>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Bike className="w-4 h-4 text-orange-500 mr-2" />
                              <div>
                                <YummyText className="text-xs text-gray-500">Vehicle</YummyText>
                                <YummyText className="text-sm font-medium text-gray-900">{normalizedApp.vehicle}</YummyText>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 text-green-500 mr-2" />
                              <div>
                                <YummyText className="text-xs text-gray-500">Documents</YummyText>
                                <YummyText className="text-sm font-medium text-gray-900">{normalizedApp.documents}</YummyText>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </IonContent>
      </AdminLayout>

      {/* Modal with Glassmorphism - Rendered outside AdminLayout */}
      {selectedApplication && (
        <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-md bg-black/40" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <YummyText className="text-xl font-medium text-[#1E1E1E] mb-1">KYC Application Review</YummyText>
                  <YummyText className="text-sm text-[#717182]">Review all submitted information and documents</YummyText>
                </div>
                <button onClick={closeModal} className="text-[#717182] hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              <div className="p-6">
                {/* Applicant Info */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <YummyText className="text-2xl font-medium text-[#1E1E1E] mb-1">{selectedApplication.name}</YummyText>
                    <YummyText className="text-sm text-[#717182]">Application ID: {selectedApplication.id}</YummyText>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${getStatusDisplay(selectedApplication.status).bgColor} ${getStatusDisplay(selectedApplication.status).textColor} ${getStatusDisplay(selectedApplication.status).borderColor}`}>
                    {getStatusDisplay(selectedApplication.status).icon}
                    {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                  </span>
                </div>

                {/* Tabs */}
                <YummyText>
                  <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-full">
                    <button
                      onClick={() => setActiveTab('contact')}
                      className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'contact' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#0A0A0A] hover:text-gray-900'
                        }`}
                    >
                      Contact Info
                    </button>
                    <button
                      onClick={() => setActiveTab('identity')}
                      className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'identity' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#0A0A0A] hover:text-gray-900'
                        }`}
                    >
                      Identity
                    </button>
                    <button
                      onClick={() => setActiveTab('vehicle')}
                      className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'vehicle' ? 'bg-white text-[#0A0A0A] shadow-sm' : 'text-[#0A0A0A] hover:text-gray-900'
                        }`}
                    >
                      Vehicle
                    </button>
                  </div>
                </YummyText>

                {/* Tab Content */}
                {activeTab === 'contact' && selectedApplication.fullDetails && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">Email</YummyText>
                        <YummyText className="text-sm text-[#0A0A0A]">{selectedApplication.email || 'N/A'}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">Phone</YummyText>
                        <YummyText className="text-sm text-[#0A0A0A]">{selectedApplication.phone || 'N/A'}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">Address</YummyText>
                        <YummyText className="text-sm text-[#0A0A0A]">{selectedApplication.fullDetails.address}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">City, State</YummyText>
                        <YummyText className="text-sm text-[#0A0A0A]">{selectedApplication.fullDetails.city}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">ZIP Code</YummyText>
                        <YummyText className="text-sm text-[#0A0A0A]">{selectedApplication.fullDetails.zipCode}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">Emergency Contact</YummyText>
                        <YummyText className="text-sm text-[#0A0A0A]">{selectedApplication.fullDetails.emergencyContact}</YummyText>
                      </div>
                      <div className="col-span-2">
                        <YummyText className="text-xs text-gray-500 mb-1">Emergency Phone</YummyText>
                        <YummyText className="text-sm text-[#0A0A0A]">{selectedApplication.fullDetails.emergencyPhone}</YummyText>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'identity' && selectedApplication.fullDetails && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">Full Legal Name</YummyText>
                        <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.fullName}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">Date of Birth</YummyText>
                        <YummyText className="text-sm text-gray-900">{formatDate(selectedApplication.fullDetails.dob)}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">Nationality</YummyText>
                        <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.nationality}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">ID Type</YummyText>
                        <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.idType}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">ID Number</YummyText>
                        <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.idNumber}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">ID Expiry Date</YummyText>
                        <YummyText className="text-sm text-gray-900">{formatDate(selectedApplication.fullDetails.idExpiry)}</YummyText>
                      </div>
                    </div>

                    <div className="mt-6 border border-gray-200"></div>

                    <div className="mt-6">
                      <YummyText>
                        <div className="text-sm font-medium text-gray-900 mb-3">Identity Documents</div>
                      </YummyText>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedApplication.fullDetails.documentUrls?.idFront && (
                          <div className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <YummyText>
                              <div className="text-sm text-gray-900 mb-1">ID Front</div>
                              <button
                                onClick={() => handleDownloadDocument(selectedApplication.fullDetails.documentUrls.idFront, 'id-front')}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                              >
                                <Eye className="w-3 h-3" />
                                View Document
                              </button>
                            </YummyText>
                          </div>
                        )}
                        {selectedApplication.fullDetails.documentUrls?.idBack && (
                          <div className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <YummyText>
                              <div className="text-sm text-gray-900 mb-1">ID Back</div>
                              <button
                                onClick={() => handleDownloadDocument(selectedApplication.fullDetails.documentUrls.idBack, 'id-back')}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                              >
                                <Eye className="w-3 h-3" />
                                View Document
                              </button>
                            </YummyText>
                          </div>
                        )}
                        {selectedApplication.fullDetails.documentUrls?.selfie && (
                          <div className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <YummyText>
                              <div className="text-sm text-gray-900 mb-1">Selfie Verification</div>
                              <button
                                onClick={() => handleDownloadDocument(selectedApplication.fullDetails.documentUrls.selfie, 'selfie')}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                              >
                                <Eye className="w-3 h-3" />
                                View Document
                              </button>
                            </YummyText>
                          </div>
                        )}
                        {selectedApplication.fullDetails.documents?.length > 0 && !selectedApplication.fullDetails.documentUrls?.idFront && (
                          selectedApplication.fullDetails.documents
                            .filter(doc => doc.type === 'identity' || doc.type?.includes('id') || doc.type?.includes('selfie'))
                            .map((doc, idx) => (
                              <div key={idx} className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <YummyText>
                                  <div className="text-sm text-gray-900 mb-1">{doc.name || doc.type || 'Document'}</div>
                                  <button
                                    onClick={() => handleDownloadDocument(doc.url, doc.name)}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Document
                                  </button>
                                </YummyText>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'vehicle' && selectedApplication.fullDetails && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">Vehicle Type</YummyText>
                        <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.vehicleType}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">Make & Model</YummyText>
                        <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.makeModel}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">Year</YummyText>
                        <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.year}</YummyText>
                      </div>
                      <div>
                        <YummyText className="text-xs text-gray-500 mb-1">License Plate</YummyText>
                        <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.licensePlate}</YummyText>
                      </div>
                      <div className="col-span-2">
                        <YummyText className="text-xs text-gray-500 mb-1">Insurance Expiry</YummyText>
                        <YummyText className="text-sm text-gray-900">{formatDate(selectedApplication.fullDetails.insurance)}</YummyText>
                      </div>
                    </div>

                    <div className="mt-6 border border-gray-200"></div>

                    <YummyText>
                      <div className="mt-6">
                        <div className="text-sm font-medium text-gray-900 mb-3">Vehicle Documents</div>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedApplication.fullDetails.documentUrls?.vehicleRegistration && (
                            <div className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <div className="text-sm text-gray-900 mb-1">Vehicle Registration</div>
                              <button
                                onClick={() => handleDownloadDocument(selectedApplication.fullDetails.documentUrls.vehicleRegistration, 'registration')}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                              >
                                <Eye className="w-3 h-3" />
                                View Document
                              </button>
                            </div>
                          )}
                          {selectedApplication.fullDetails.documentUrls?.insurance && (
                            <div className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <div className="text-sm text-gray-900 mb-1">Insurance</div>
                              <button
                                onClick={() => handleDownloadDocument(selectedApplication.fullDetails.documentUrls.insurance, 'insurance')}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                              >
                                <Eye className="w-3 h-3" />
                                View Document
                              </button>
                            </div>
                          )}
                          {selectedApplication.fullDetails.documents?.length > 0 && !selectedApplication.fullDetails.documentUrls?.vehicleRegistration && (
                            selectedApplication.fullDetails.documents
                              .filter(doc => doc.type === 'vehicle' || doc.type?.includes('vehicle') || doc.type?.includes('insurance') || doc.type?.includes('registration'))
                              .map((doc, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <div className="text-sm text-gray-900 mb-1">{doc.name || doc.type || 'Document'}</div>
                                  <button
                                    onClick={() => handleDownloadDocument(doc.url, doc.name)}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Document
                                  </button>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    </YummyText>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={handleApproveClick}
                    disabled={actionLoading}
                    className="flex-1 bg-[#00A63E] hover:bg-green-600 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckIcon size={16} color="#FFFFFF" />}
                    Approve Application
                  </button>
                  <button
                    onClick={handleRejectClick}
                    disabled={actionLoading}
                    className="flex-1 bg-[#D4183D] hover:bg-red-600 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CircleXIcon className="w-4 h-4" stroke="#FFFFFF" />}
                    Reject Application
                  </button>
                </div>
              )}
              {selectedApplication.status !== 'pending' && (
                <div className="text-center">
                  <YummyText className="text-gray-600 text-sm">
                    This application has already been {selectedApplication.status}
                  </YummyText>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-md bg-black/40" style={{ zIndex: 10000 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Approve Application</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to approve this application?</p>
            <textarea
              placeholder="Add optional notes..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 resize-none"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={actionLoading}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 bg-[#00A63E] text-white py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-md bg-black/40" style={{ zIndex: 10000 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
            <textarea
              placeholder="Reason for rejection (required)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 resize-none"
              rows="3"
              required
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 bg-[#D4183D] text-white py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </IonPage>
  );
};

export default KYCApprovals;