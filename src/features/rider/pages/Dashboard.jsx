import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';

// Shadow only on left, right and bottom - no top shadow for seamless blend
const sideBottomShadow = {
  boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const StatCard = ({ icon, title, value, subtitle, iconBg }) => (
  <div className="bg-white rounded-xl p-7 border-none" style={sideBottomShadow}>
    <div className="flex items-start justify-between mb-10">
      <div className="text-xs text-[#4A5565]">{title}</div>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className="text-[29px] font-normal text-[#0F172A] mb-1">{value}</div>
    <div className="text-[11px] text-[#64748B] leading-none">{subtitle}</div>
  </div>
);

const DeliveryCard = ({ packageId, status, from, to, customer, price, distance, time, statusColor }) => (
  <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] rounded-2xl p-6 mb-4">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="text-base font-normal text-[#0F172A]">{packageId}</div>
        <span className={`px-3 py-1 rounded-full text-xs font-normal ${statusColor}`}>
          {status}
        </span>
      </div>
      <div className="text-right">
        <div className="text-xl font-normal text-[#00D68F]">{price}</div>
        <div className="text-xs text-[#64748B]">{distance} · {time}</div>
      </div>
    </div>
    
    <div className="space-y-1 mb-4">
      <div className="text-xs text-[#64748B]">From: <span className="text-[#0F172A]">{from}</span></div>
      <div className="text-xs text-[#64748B]">To: <span className="text-[#0F172A]">{to}</span></div>
      <div className="text-xs text-[#64748B]">Customer: <span className="text-[#0F172A]">{customer}</span></div>
    </div>

    <div className="flex gap-3">
      <button className="flex-1 bg-[#00B75A] hover:bg-[#00B876] text-white py-2.5 rounded-xl transition-colors font-[300]">
        Navigate
      </button>
      <button className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-[#0F172A] font-[300]">
        Contact Customer
      </button>
      <button className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-[#0F172A] font-[300]">
        Update Status
      </button>
    </div>
  </div>
);

const AvailableOrderCard = ({ packageId, location, distance, price }) => (
  <div className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl mb-3">
    <div>
      <div className="text-base font-normal text-[#0F172A] mb-1">{packageId}</div>
      <div className="text-sm text-[#64748B] mb-0.5">{location}</div>
      <div className="text-xs text-[#94A3B8]">{distance}</div>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-xl font-normal text-[#00D68F]">{price}</div>
      <button className="bg-[#00D68F] hover:bg-[#00B876] text-white px-6 py-2.5 rounded-xl transition-colors font-normal">
        Accept
      </button>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-no-padding">
          {/* Welcome Section */}
          <div className="mb-8 py-2">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Welcome back, Marcus!
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              You're doing great today. Keep up the excellent work!
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<img width="24" height="24" src="/blockicon.svg" alt="Deliveries Icon"/>}
              iconBg="bg-[#EFF6FF]"
              title="Today's Deliveries"
              value="8"
              subtitle="3 completed, 5 pending"
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="#00D68F"/>
                </svg>
              }
              iconBg="bg-green-50"
              title="Today's Earnings"
              value="N12400.50"
              subtitle="+N2500.50 from yesterday"
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#F59E0B"/>
                </svg>
              }
              iconBg="bg-orange-50"
              title="This Week"
              value="N75948.25"
              subtitle="42 deliveries completed"
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#8B5CF6"/>
                </svg>
              }
              iconBg="bg-purple-50"
              title="Avg. Delivery Time"
              value="28 min"
              subtitle="Faster than 85% of riders"
            />
          </div>

          {/* Active Deliveries */}
          <div className="mb-8 bg-white p-6 rounded-2xl" style={sideBottomShadow}>
            <div className="mb-4">
              <div className="text-xl font-normal text-[#0F172A] mb-1">
                Active Deliveries
              </div>
              <div className="text-sm text-[#64748B]">
                Deliveries currently in progress
              </div>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <DeliveryCard
                packageId="PKG-2401"
                status="Picked Up"
                statusColor="bg-blue-100 text-blue-600"
                from="Central Mall, 5th Ave"
                to="123 Oak Street"
                customer="Sarah Mitchell"
                price="N2300.50"
                distance="3.2 mi"
                time="15 min"
              />
              
              <DeliveryCard
                packageId="PKG-2403"
                status="En Route to Pickup"
                statusColor="bg-orange-100 text-orange-600"
                from="Tech Store, Main St"
                to="456 Elm Avenue"
                customer="Mike Johnson"
                price="N1300.50"
                distance="1.8 mi"
                time="8 min"
              />
              
              <DeliveryCard
                packageId="PKG-2404"
                status="Not Yet Moved"
                statusColor="bg-red-500 text-gray-600"
                from="Downtown Store, 2nd St"
                to="789 Pine Road"
                customer="John Doe"
                price="N1800.00"
                distance="2.5 mi"
                time="12 min"
              />
            </div>
          </div>

          {/* Available Orders Nearby */}
          <div className="mb-8 bg-white p-6 rounded-2xl" style={sideBottomShadow}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xl font-normal text-[#0F172A] mb-1">
                  Available Orders Nearby
                </div>
                <div className="text-sm text-[#64748B]">
                  Orders you can accept right now
                </div>
              </div>
              <button className="text-[#00D68F] hover:underline font-normal">
                View All
              </button>
            </div>

            {/* Make available orders list scrollable independently */}
            <div className="max-h-[360px] overflow-y-auto pr-2">
              <AvailableOrderCard
                packageId="PKG-2405"
                location="Downtown Market"
                distance="2.1 mi away"
                price="N2000.00"
              />
              <AvailableOrderCard
                packageId="PKG-2406"
                location="West Side Plaza"
                distance="4.5 mi away"
                price="N3000.50"
              />
            </div>
          </div>
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default Dashboard;
