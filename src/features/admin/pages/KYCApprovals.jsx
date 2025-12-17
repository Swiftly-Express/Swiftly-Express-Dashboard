import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { X, Eye, FileText, Bike, Car } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';
import ClockIcon from '../../../icons/Clockicon';
import CheckCircleIcon from '../../../icons/Circlecheck';
import CircleXIcon from '../../../icons/Circlexicon';
import DocumentIcon from '../../../icons/Documenticon';

const KYCApprovals = () => {
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [activeTab, setActiveTab] = useState('contact');

  // Stats data
  const stats = [
    { 
      label: 'Pending Review', 
      value: '18', 
      icon: <ClockIcon className="w-5 h-5" stroke="#D08700" />, 
      bgColor: '#FEF9C2',
      valueColor: '#000000'
    },
    { 
      label: 'Approved Today', 
      value: '7', 
      icon: <CheckCircleIcon size={18} color="#00A63E" />, 
      bgColor: '#D1FAE5',
      valueColor: '#00A63E'
    },
    { 
      label: 'Rejected Today', 
      value: '2', 
      icon: <CircleXIcon className="w-5 h-5" stroke="#EF4444" />, 
      bgColor: '#FFE2E2',
      valueColor: '#E7000B'
    },
    { 
      label: 'Total This Month', 
      value: '156', 
      icon: <DocumentIcon width={18} height={18} stroke="#3B82F6" />, 
      bgColor: '#DBEAFE',
      valueColor: '#000000'
    }
  ];

  // Applications data
  const applications = [
    {
      id: 'KYC-001',
      name: 'Robert Chen',
      riderId: 'RDR-006',
      email: 'robert.chen@email.com',
      phone: '+1 (555) 666-7777',
      submitted: '2024-12-02 10:30',
      identity: 'Driver\'s License',
      vehicle: 'BMW F 750 GS',
      documents: 'All Submitted',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800',
      fullDetails: {
        address: '123 Main Street, Apt 4B',
        city: 'New York, NY',
        zipCode: '10001',
        emergencyContact: 'Jane Chen',
        emergencyPhone: '+1 (555) 777-8888',
        fullName: 'Robert Chen',
        dob: '1990-05-15',
        nationality: 'USA',
        idType: 'Driver\'s License',
        idNumber: 'DL-654987321',
        idExpiry: '2027-05-15',
        vehicleType: 'Motorcycle',
        makeModel: 'BMW F 750 GS',
        year: '2023',
        licensePlate: 'ABC-1234',
        insurance: '2025-12-01',
        uploadedDocs: [
          { name: 'license-front.jpg', type: 'identity' },
          { name: 'selfie-verification.jpg', type: 'identity' },
          { name: 'registration.pdf', type: 'vehicle' },
          { name: 'insurance.pdf', type: 'vehicle' }
        ]
      }
    },
    {
      id: 'KYC-002',
      name: 'Maria Garcia',
      riderId: 'RDR-007',
      email: 'maria.g@email.com',
      phone: '+1 (555) 888-9999',
      submitted: '2024-12-02 08:15',
      identity: 'Passport',
      vehicle: 'Vespa Primavera 150',
      documents: 'All Submitted',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'KYC-003',
      name: 'Ahmed Hassan',
      riderId: 'RDR-008',
      email: 'ahmed.h@email.com',
      phone: '+1 (555) 000-1111',
      submitted: '2024-12-01 16:20',
      identity: 'Driver\'s License',
      vehicle: 'Honda CB500X',
      documents: 'All Submitted',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800'
    }
  ];

  const openModal = (application) => {
    setSelectedApplication(application);
    setActiveTab('contact');
  };

  const closeModal = () => {
    setSelectedApplication(null);
  };

  const handleApprove = () => {
    // Handle approve logic
    closeModal();
  };

  const handleReject = () => {
    // Handle reject logic
    closeModal();
  };

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8">
            <YummyText className="text-3xl font-bold text-gray-900 mb-2">KYC Approvals</YummyText>
            <YummyText className="text-gray-500">Review and approve rider verification applications</YummyText>
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
                  <YummyText className="text-sm text-gray-500 -mt-2 -mb-0.5">{stat.label}</YummyText>
                  <YummyText className="text-3xl font-medium" style={{ color: stat.valueColor }}>{stat.value}</YummyText>
                </div>
              </div>
            ))}
          </div>

          {/* Applications List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <YummyText className="text-lg font-semibold text-gray-900">Pending Applications</YummyText>
              <YummyText className="text-sm text-gray-500">Review and verify rider KYC submissions</YummyText>
            </div>

            <div className="space-y-4">
              {applications.map((app, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <YummyText className="text-lg font-semibold text-gray-900 mr-3">{app.name}</YummyText>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${app.statusColor}`}>
                          ⏱ {app.status}
                        </span>
                      </div>
                      <YummyText className="text-sm text-gray-600 mb-1">Application ID: {app.id}</YummyText>
                      <YummyText className="text-sm text-gray-600 mb-1">Rider ID: {app.riderId}</YummyText>
                      <YummyText className="text-sm text-gray-600 mb-1">Email: {app.email}</YummyText>
                      <YummyText className="text-sm text-gray-600">Phone: {app.phone}</YummyText>
                      <YummyText className="text-xs text-gray-400 mt-2">Submitted: {app.submitted}</YummyText>
                    </div>
                    <button
                      onClick={() => openModal(app)}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
                        <YummyText className="text-sm font-medium text-gray-900">{app.identity}</YummyText>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Bike className="w-4 h-4 text-orange-500 mr-2" />
                      <div>
                        <YummyText className="text-xs text-gray-500">Vehicle</YummyText>
                        <YummyText className="text-sm font-medium text-gray-900">{app.vehicle}</YummyText>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-green-500 mr-2" />
                      <div>
                        <YummyText className="text-xs text-gray-500">Documents</YummyText>
                        <YummyText className="text-sm font-medium text-gray-900">{app.documents}</YummyText>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                      <YummyText className="text-xl font-bold text-gray-900 mb-1">KYC Application Review</YummyText>
                      <YummyText className="text-sm text-gray-500">Review all submitted information and documents</YummyText>
                    </div>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                        <YummyText className="text-2xl font-bold text-gray-900 mb-1">{selectedApplication.name}</YummyText>
                        <YummyText className="text-sm text-gray-600">Application ID: {selectedApplication.id}</YummyText>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedApplication.statusColor}`}>
                        ⏱ Pending Review
                      </span>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setActiveTab('contact')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === 'contact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Contact Info
                      </button>
                      <button
                        onClick={() => setActiveTab('identity')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === 'identity' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Identity
                      </button>
                      <button
                        onClick={() => setActiveTab('vehicle')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === 'vehicle' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Vehicle
                      </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'contact' && selectedApplication.fullDetails && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <YummyText className="text-xs text-gray-500 mb-1">Email</YummyText>
                            <YummyText className="text-sm text-gray-900">{selectedApplication.email}</YummyText>
                          </div>
                          <div>
                            <YummyText className="text-xs text-gray-500 mb-1">Phone</YummyText>
                            <YummyText className="text-sm text-gray-900">{selectedApplication.phone}</YummyText>
                          </div>
                          <div>
                            <YummyText className="text-xs text-gray-500 mb-1">Address</YummyText>
                            <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.address}</YummyText>
                          </div>
                          <div>
                            <YummyText className="text-xs text-gray-500 mb-1">City, State</YummyText>
                            <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.city}</YummyText>
                          </div>
                          <div>
                            <YummyText className="text-xs text-gray-500 mb-1">ZIP Code</YummyText>
                            <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.zipCode}</YummyText>
                          </div>
                          <div>
                            <YummyText className="text-xs text-gray-500 mb-1">Emergency Contact</YummyText>
                            <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.emergencyContact}</YummyText>
                          </div>
                          <div className="col-span-2">
                            <YummyText className="text-xs text-gray-500 mb-1">Emergency Phone</YummyText>
                            <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.emergencyPhone}</YummyText>
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
                            <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.dob}</YummyText>
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
                            <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.idExpiry}</YummyText>
                          </div>
                        </div>

                        <div className="mt-6">
                          <YummyText className="text-sm font-medium text-gray-900 mb-3">Uploaded Documents</YummyText>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <YummyText className="text-sm text-gray-900 mb-1">license-front.jpg</YummyText>
                              <button className="text-xs text-blue-600 hover:text-blue-700">View Document</button>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <YummyText className="text-sm text-gray-900 mb-1">selfie-verification.jpg</YummyText>
                              <button className="text-xs text-blue-600 hover:text-blue-700">View Document</button>
                            </div>
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
                            <YummyText className="text-sm text-gray-900">{selectedApplication.fullDetails.insurance}</YummyText>
                          </div>
                        </div>

                        <div className="mt-6">
                          <YummyText className="text-sm font-medium text-gray-900 mb-3">Vehicle Documents</YummyText>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <YummyText className="text-sm text-gray-900 mb-1">registration.pdf</YummyText>
                              <button className="text-xs text-blue-600 hover:text-blue-700">View Document</button>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <YummyText className="text-sm text-gray-900 mb-1">insurance.pdf</YummyText>
                              <button className="text-xs text-blue-600 hover:text-blue-700">View Document</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>✓</span>
                      Approve Application
                    </button>
                    <button
                      onClick={handleReject}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>✗</span>
                      Reject Application
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
    </IonPage>
  );
};

export default KYCApprovals;