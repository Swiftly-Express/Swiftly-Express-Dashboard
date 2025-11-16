import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const DeliveryCard = ({ packageId, status, statusColor, statusBg, from, to, bookedDate, progress }) => (
  <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-100" style={sideBottomShadow}>
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4 flex-1">
        {/* Package Icon */}
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="#3B82F6"/>
          </svg>
        </div>

        {/* Package Details */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-lg font-medium text-[#0F172A]">{packageId}</div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
              {status}
            </span>
          </div>
          <div className="text-sm text-[#64748B] mb-2">
            {from} → {to}
          </div>
          <div className="text-xs text-[#64748B] mb-3">
            Booked: {bookedDate}
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#64748B]">Progress</div>
            <div className="flex-1 relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#00D68F] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs font-medium text-[#0F172A]">{progress}%</div>
          </div>
        </div>
      </div>

      {/* View Details Button */}
      <button className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
        </svg>
        View Details
      </button>
    </div>
  </div>
);

const MyDeliveries = () => {
  const [activeTab, setActiveTab] = useState('active');

  const activeDeliveries = [
    {
      id: 'PKG-2401',
      status: 'In Transit',
      statusColor: 'text-blue-700',
      statusBg: 'bg-blue-100',
      from: 'New York, NY',
      to: 'Los Angeles, CA',
      bookedDate: 'Oct 22, 2025',
      progress: 65
    },
    {
      id: 'PKG-2402',
      status: 'Processing',
      statusColor: 'text-orange-700',
      statusBg: 'bg-orange-100',
      from: 'Chicago, IL',
      to: 'Miami, FL',
      bookedDate: 'Oct 23, 2025',
      progress: 25
    },
    {
      id: 'PKG-2403',
      status: 'Out for Delivery',
      statusColor: 'text-green-700',
      statusBg: 'bg-green-100',
      from: 'Seattle, WA',
      to: 'Boston, MA',
      bookedDate: 'Oct 24, 2025',
      progress: 90
    }
  ];

  const completedDeliveries = [
    {
      id: 'PKG-2398',
      route: 'San Francisco, CA → Portland, OR',
      bookedDate: 'Oct 18, 2025',
      deliveredDate: 'Oct 20, 2025',
      status: 'Delivered'
    },
    {
      id: 'PKG-2395',
      route: 'Austin, TX → Denver, CO',
      bookedDate: 'Oct 15, 2025',
      deliveredDate: 'Oct 17, 2025',
      status: 'Delivered'
    },
    {
      id: 'PKG-2390',
      route: 'Atlanta, GA → Nashville, TN',
      bookedDate: 'Oct 12, 2025',
      deliveredDate: 'Oct 13, 2025',
      status: 'Delivered'
    }
  ];

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8 py-2">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              My Deliveries
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              View and manage all your shipments
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 rounded-lg text-sm font-normal transition-colors ${
                activeTab === 'active'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Active ({activeDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-2 rounded-lg text-sm font-normal transition-colors ${
                activeTab === 'completed'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Completed ({completedDeliveries.length})
            </button>
          </div>

          {/* Active Deliveries */}
          {activeTab === 'active' && (
            <div>
              {activeDeliveries.map((delivery, index) => (
                <DeliveryCard
                  key={index}
                  packageId={delivery.id}
                  status={delivery.status}
                  statusColor={delivery.statusColor}
                  statusBg={delivery.statusBg}
                  from={delivery.from}
                  to={delivery.to}
                  bookedDate={delivery.bookedDate}
                  progress={delivery.progress}
                />
              ))}
            </div>
          )}

          {/* Completed Deliveries Table */}
          {activeTab === 'completed' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100" style={sideBottomShadow}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Tracking ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Route</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Booked Date</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Delivered Date</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Status</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-[#0F172A]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedDeliveries.map((delivery, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm font-medium text-[#0F172A]">{delivery.id}</td>
                        <td className="py-4 px-4 text-sm text-[#64748B]">{delivery.route}</td>
                        <td className="py-4 px-4 text-sm text-[#64748B]">{delivery.bookedDate}</td>
                        <td className="py-4 px-4 text-sm text-[#64748B]">{delivery.deliveredDate}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {delivery.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-3">
                            <button className="text-[#64748B] hover:text-[#0F172A] transition-colors">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                              </svg>
                            </button>
                            <button className="text-[#64748B] hover:text-[#0F172A] transition-colors">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default MyDeliveries;