import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const StatCard = ({ icon, iconBg, title, value, subtitle, subtitleColor }) => (
  <div className="bg-white rounded-xl p-6" style={sideBottomShadow}>
    <div className="flex items-start justify-between mb-4">
      <div className="text-sm text-[#64748B]">{title}</div>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className="text-3xl font-normal text-[#0F172A] mb-1">{value}</div>
    <div className={`text-xs ${subtitleColor || 'text-[#64748B]'}`}>{subtitle}</div>
  </div>
);

const DeliveryItem = ({ packageId, status, statusColor, statusBg, from, to, eta, etaTime, progress }) => (
  <div className="mb-6 last:mb-0">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-3">
        <div className="text-base font-medium text-[#00D68F]">{packageId}</div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
          {status}
        </span>
      </div>
      <div className="text-right">
        <div className="text-xs text-[#64748B]">ETA</div>
        <div className="text-sm font-medium text-[#0F172A]">{etaTime}</div>
      </div>
    </div>
    
    <div className="text-sm text-[#64748B] mb-3">
      {from} → {to}
    </div>

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
      statusColor: 'text-green-700',
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
          <div className="mb-8 py-2">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Welcome back, Uduak!
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              Here's what's happening with your deliveries today.
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="#3B82F6"/>
                </svg>
              }
              iconBg="bg-blue-50"
              title="Active Deliveries"
              value="12"
              subtitle="+3 from last week"
              subtitleColor="text-[#64748B]"
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#F59E0B"/>
                </svg>
              }
              iconBg="bg-orange-50"
              title="In Transit"
              value="8"
              subtitle="2 arriving today"
              subtitleColor="text-[#64748B]"
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#00D68F"/>
                </svg>
              }
              iconBg="bg-green-50"
              title="Completed"
              value="142"
              subtitle="+12 this month"
              subtitleColor="text-[#64748B]"
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="#8B5CF6"/>
                </svg>
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
              <div className="text-xl font-normal text-[#0F172A] mb-1">
                Recent Deliveries
              </div>
              <div className="text-sm text-[#64748B]">
                Track your latest shipments
              </div>
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