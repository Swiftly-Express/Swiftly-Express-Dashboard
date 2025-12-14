import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';

const ManageRiders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await getRiders();
      // setRiders(response.data);
      setRiders([]);
    } catch (error) {
      console.error('Failed to fetch riders:', error);
      setToastMsg('Failed to load riders');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rider.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || rider.verificationStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <IonPage>
        <AdminLayout>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9333EA] mx-auto mb-4"></div>
                <p className="text-[#64748B]">Loading riders...</p>
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
              <h1 className="text-3xl font-medium text-[#0F172A] mb-2">Manage Riders</h1>
              <p className="text-[#64748B]">View and manage delivery riders</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Search riders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9333EA]"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9333EA]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Riders Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {filteredRiders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#64748B]">No riders found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Deliveries</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRiders.map(rider => (
                      <tr key={rider.id}>
                        <td className="px-6 py-4">{rider.name}</td>
                        <td className="px-6 py-4">{rider.email}</td>
                        <td className="px-6 py-4">{rider.phone}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            rider.verificationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                            rider.verificationStatus === 'pending' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {rider.verificationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">{rider.totalDeliveries || 0}</td>
                        <td className="px-6 py-4">
                          <button className="text-[#9333EA] hover:underline text-sm">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default ManageRiders;
