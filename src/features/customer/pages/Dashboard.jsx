import React from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { arrowForward } from 'ionicons/icons';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const StatCard = ({ icon, iconBg, title, value, subtitle, subtitleColor }) => (
  <div className="bg-white rounded-xl p-5" style={sideBottomShadow}>
    <div className="flex items-start justify-between mb-6">
      <YummyText className="text-sm text-[#4A5565] mt-2">{title}</YummyText>
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <YummyText className="text-3xl font-normal text-[#0A0A0A] mb-1">{value}</YummyText>
    <YummyText className={`text-xs ${subtitleColor || 'text-[#6A7282]'}`}>{subtitle}</YummyText>
  </div>
);

const DeliveryItem = ({ packageId, status, statusColor, statusBg, from, to, eta, etaTime, progress }) => (
  <div className="mb-6 last:mb-0">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="text-base font-medium text-[#00B75A]">{packageId}</div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
          {status}
        </span>
      </div>
      <div className="text-right">
        <div className="text-xs text-[#64748B]">ETA</div>
        <div className="text-sm font-medium text-[#0F172A]">{etaTime}</div>
      </div>
    </div>
    
    <YummyText>
      <div className="text-medium font-[400] text-[#4A5565] mb-3 -mt-4 flex items-center gap-1">
        <span>{from}</span>
        <IonIcon icon={arrowForward} className="text-medium" />
        <span>{to}</span>
      </div>
    </YummyText>

    {/* Progress Bar */}
    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="absolute top-0 left-0 h-full bg-[#0F172A] rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

const CustomerDashboard = () => {
  const recentDeliveries = [
    {
      id: 'PKG-2401',
      status: 'In Transit',
      statusColor: 'text-blue-700',
      statusBg: 'bg-blue-100',
      from: 'New York, NY',
      to: 'Los Angeles, CA',
      eta: 'ETA',
      etaTime: '2 days',
      progress: 65
    },
    {
      id: 'PKG-2402',
      status: 'Processing',
      statusColor: 'text-orange-700',
      statusBg: 'bg-orange-100',
      from: 'Chicago, IL',
      to: 'Miami, FL',
      eta: 'ETA',
      etaTime: '4 days',
      progress: 25
    },
    {
      id: 'PKG-2403',
      status: 'Out for Delivery',
      statusColor: 'text-[#008236]',
      statusBg: 'bg-green-100',
      from: 'Seattle, WA',
      to: 'Boston, MA',
      eta: 'ETA',
      etaTime: 'Today',
      progress: 90
    }
  ];

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          {/* Welcome Section */}
          <div className="mb-8">
            <YummyText className="text-3xl font-medium text-[#0F172A] mb-2">
              Welcome back, Uduak!
            </YummyText>
            <YummyText className="text-[#4A5565] text-[15px] font-[400]">
              Here's what's happening with your deliveries today.
            </YummyText>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={
                <img src="/blockicon.svg" alt="Active Deliveries" className="w-5 h-5" />
              }
              iconBg="bg-blue-50"
              title="Active Deliveries"
              value="12"
              subtitle="+3 from last week"
              subtitleColor="text-[#64748B]"
            />
            <StatCard
              icon={
                <img src="/clockicon.svg" alt="In Transit" className="w-5 h-5" />
              }
              iconBg="bg-[#FFF7ED]"
              title="In Transit"
              value="8"
              subtitle="2 arriving today"
              subtitleColor="text-[#64748B]"
            />
            <StatCard
              icon={
                <img src="/checkicon.svg" alt="Completed" className="w-5 h-5" />
              }
              iconBg="bg-green-50"
              title="Completed"
              value="142"
              subtitle="+12 this month"
              subtitleColor="text-[#64748B]"
            />
            <StatCard
              icon={
                <img src="/success-rate.svg" alt="Success Rate" className="w-5 h-5" />
              }
              iconBg="bg-purple-50"
              title="Success Rate"
              value="99%"
              subtitle="+2% improvement"
              subtitleColor="text-[#64748B]"
            />
          </div>

          {/* Recent Deliveries */}
          <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
            <div className="mb-6">
              <YummyText className="text-xl font-semibold text-[#0F172A] mb-1">
                Recent Deliveries
              </YummyText>
              <YummyText className="text-xl font-[400] text-[#717182]">
                Track your latest shipments
              </YummyText>
            </div>

            <div>
              {recentDeliveries.map((delivery, index) => (
                <DeliveryItem
                  key={index}
                  packageId={delivery.id}
                  status={delivery.status}
                  statusColor={delivery.statusColor}
                  statusBg={delivery.statusBg}
                  from={delivery.from}
                  to={delivery.to}
                  eta={delivery.eta}
                  etaTime={delivery.etaTime}
                  progress={delivery.progress}
                />
              ))}
            </div>
          </div>
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default CustomerDashboard;