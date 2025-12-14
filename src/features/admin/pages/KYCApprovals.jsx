import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';

const KYCApprovals = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchKYCRequests();
  }, []);

  const fetchKYCRequests = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await getKYCRequests();
      // setKycRequests(response.data);
      setKycRequests([]);
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error);
      setToastMsg('Failed to load KYC requests');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      // TODO: Replace with actual API call
      // await approveKYC(requestId);
      setToastMsg('KYC approved successfully');
      setShowToast(true);
      fetchKYCRequests();
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      setToastMsg('Failed to approve KYC');
      setShowToast(true);
    }
  };

  const handleReject = async (requestId) => {
    try {
      // TODO: Replace with actual API call
      // await rejectKYC(requestId);
      setToastMsg('KYC rejected');
      setShowToast(true);
      fetchKYCRequests();
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      setToastMsg('Failed to reject KYC');
      setShowToast(true);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <AdminLayout>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9333EA] mx-auto mb-4"></div>
                <p className="text-[#64748B]">Loading KYC requests...</p>
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
        <IonContent className="ion-padding">
          <YummyText>
            <div className="mb-6">
              <h1 className="text-3xl font-medium text-[#0F172A] mb-2">KYC Approvals</h1>
              <p className="text-[#64748B]">Review and approve rider verification requests</p>
            </div>

            {/* KYC Requests */}
            <div className="grid grid-cols-1 gap-4">
              {kycRequests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-xl font-medium text-[#0F172A] mb-2">All Caught Up!</p>
                  <p className="text-[#64748B]">No pending KYC requests at the moment</p>
                </div>
              ) : (
                kycRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-[#0F172A]">{request.riderName}</h3>
                        <p className="text-sm text-[#64748B]">{request.email}</p>
                        <p className="text-sm text-[#64748B]">{request.phone}</p>
                      </div>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                        Pending Review
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Vehicle Type</p>
                        <p className="text-sm font-medium">{request.vehicleType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">License Plate</p>
                        <p className="text-sm font-medium">{request.licensePlate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">ID Type</p>
                        <p className="text-sm font-medium">{request.idType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">ID Number</p>
                        <p className="text-sm font-medium">{request.idNumber}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
                      >
                        View Documents
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </YummyText>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
          />
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default KYCApprovals;
