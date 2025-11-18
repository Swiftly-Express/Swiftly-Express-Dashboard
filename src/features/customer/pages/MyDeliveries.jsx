import React, { useState } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { eye, eyeOff, arrowForward } from 'ionicons/icons';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const DeliveryCard = ({ packageId, status, statusColor, statusBg, from, to, bookedDate, progress }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-white rounded-2xl p-6 mb-4" style={sideBottomShadow}>
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4 flex-1">
        {/* Package Icon */}
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <img src="/blockicon.svg" alt="Package" className="w-6 h-6" />
        </div>

        {/* Package Details */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <YummyText className="text-lg font-medium text-[#0F172A]">{packageId}</YummyText>
            <YummyText>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
                {status}
              </span>
            </YummyText>
          </div>
          <YummyText>
            <div className="text-sm text-[#4A5565] mb-1 flex items-center gap-1">
              <span>{from}</span>
              <IonIcon icon={arrowForward} className="text-sm" />
              <span>{to}</span>
            </div>
            <div className="text-xs text-[#4A5565] mb-1">
              Booked: {bookedDate}
            </div>
          </YummyText>

          {/* Progress Bar */}
          <div className="flex-1 max-w-[30%]">
            <div className="flex justify-between items-center mb-1">
              <YummyText className="text-xs text-[#4A5565]">Progress</YummyText>
              <YummyText className="text-xs font-medium text-[#4A5565]">{progress}%</YummyText>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#00D68F] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* View Details Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-[#64748B] shadow-sm px-3 py-2 rounded-xl hover:text-[#0F172A] hover:border-gray-800 transition-colors"
        style={{ border: '1,5px solid #0000001A' }}
      >
        <IonIcon icon={isOpen ? eyeOff : eye} className="text-lg" />
        <YummyText>View Details</YummyText>
      </button>
    </div>
  </div>
  );
};

const CompletedDeliveryRow = ({ delivery }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-4 px-4 text-sm font-medium text-[#0A0A0A]">{delivery.id}</td>
      <td className="py-4 px-4 text-sm text-[#0A0A0A]">
        <div className="flex items-center gap-1">
          <span>{delivery.from}</span>
          <IonIcon icon={arrowForward} className="text-sm" />
          <span>{delivery.to}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-sm text-[#0A0A0A]">{delivery.bookedDate}</td>
      <td className="py-4 px-4 text-sm text-[#0A0A0A]">{delivery.deliveredDate}</td>
      <td className="py-4 px-4">
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          {delivery.status}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#0A0A0A] hover:text-[#0F172A] transition-colors"
          >
            <IonIcon icon={isOpen ? eyeOff : eye} className="text-xl" />
          </button>
          <button className="text-[#0A0A0A] -mt-2 hover:text-[#0F172A] transition-colors">
            <img src="/downloadicon.svg" alt="Download" className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

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
      from: 'San Francisco, CA',
      to: 'Portland, OR',
      bookedDate: 'Oct 18, 2025',
      deliveredDate: 'Oct 20, 2025',
      status: 'Delivered'
    },
    {
      id: 'PKG-2395',
      from: 'Austin, TX',
      to: 'Denver, CO',
      bookedDate: 'Oct 15, 2025',
      deliveredDate: 'Oct 17, 2025',
      status: 'Delivered'
    },
    {
      id: 'PKG-2390',
      from: 'Atlanta, GA',
      to: 'Nashville, TN',
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
          <div className="mb-8">
            <YummyText className="text-3xl font-medium text-[#0F172A] mb-2">
              My Deliveries
            </YummyText>
            <YummyText className="text-[#4A5565] text-[15px] font-[400]">
              View and manage all your shipments
            </YummyText>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-8 bg-gray-100 p-1 rounded-full w-fit">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-14 py-2 rounded-full text-sm font-normal transition-colors ${
                activeTab === 'active'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Active ({activeDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-14 py-2 rounded-full text-sm font-normal transition-colors ${
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
            <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
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
                      <CompletedDeliveryRow key={index} delivery={delivery} />
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