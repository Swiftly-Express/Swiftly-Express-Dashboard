import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await getAllOrders();
      // setOrders(response.data);
      setOrders([]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setToastMsg('Failed to load orders');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
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
                <p className="text-[#64748B]">Loading orders...</p>
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
              <h1 className="text-3xl font-medium text-[#0F172A] mb-2">Manage Orders</h1>
              <p className="text-[#64748B]">View and manage all delivery orders</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Search orders..."
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
                <option value="assigned">Assigned</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#64748B]">No orders found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Tracking #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Rider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td className="px-6 py-4">{order.trackingNumber}</td>
                        <td className="px-6 py-4">{order.customerName}</td>
                        <td className="px-6 py-4">{order.riderName || 'Unassigned'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">₦{order.amount}</td>
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

export default ManageOrders;
