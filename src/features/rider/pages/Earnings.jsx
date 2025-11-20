import React, { useState } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { arrowForward } from 'ionicons/icons';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';

const sideBottomShadow = {
  boxShadow: '0.5px 1.5px 2px rgba(0, 0, 0, 0.05), -0.5px 1.5px 2px rgba(0, 0, 0, 0.05), 0 1.5px 3px rgba(0, 0, 0, 0.07)'
};

const StatCard = ({ icon, iconBg, title, value, subtitle }) => (
  <div className="bg-white rounded-xl p-5" style={sideBottomShadow}>
    <YummyText>
    <div className="flex items-start justify-between mb-4">
      <div className="text-sm text-[#64748B] mt-3">{title}</div>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className="text-3xl font-normal text-[#0F172A] mb-1">{value}</div>
    <div className="text-xs text-[#64748B]">{subtitle}</div>
    </YummyText>
  </div>
);

const Earnings = () => {
  const [activeTab, setActiveTab] = useState('today');

  const todayDeliveries = [
    {
      orderId: 'PKG-2401',
      time: '08:30 AM',
      from: 'Downtown',
      to: 'Riverside',
      distance: '3.2 mi',
      basePay: '$24.50',
      tips: '+$3.50',
      total: '$28.00'
    },
    {
      orderId: 'PKG-2402',
      time: '09:15 AM',
      from: 'Mall',
      to: 'Suburbs',
      distance: '5.1 mi',
      basePay: '$28.00',
      tips: '+$5.00',
      total: '$33.00'
    },
    {
      orderId: 'PKG-2403',
      time: '10:45 AM',
      from: 'Market',
      to: 'Campus',
      distance: '2.3 mi',
      basePay: '$18.00',
      tips: '+$2.00',
      total: '$20.00'
    },
    {
      orderId: 'PKG-2404',
      time: '12:20 PM',
      from: 'Plaza',
      to: 'Heights',
      distance: '4.5 mi',
      basePay: '$26.00',
      tips: '+$4.00',
      total: '$30.00'
    },
    {
      orderId: 'PKG-2405',
      time: '02:00 PM',
      from: 'Station',
      to: 'Parkside',
      distance: '1.8 mi',
      basePay: '$16.00',
      tips: '+$2.00',
      total: '$18.00'
    },
    {
      orderId: 'PKG-2406',
      time: '03:30 PM',
      from: 'Center',
      to: 'Lakeside',
      distance: '2.9 mi',
      basePay: '$22.00',
      tips: '+$3.00',
      total: '$25.00'
    },
    {
      orderId: 'PKG-2406',
      time: '03:30 PM',
      from: 'Center',
      to: 'Lakeside',
      distance: '2.9 mi',
      basePay: '$22.00',
      tips: '+$3.00',
      total: '$25.00'
    }
  ];

  const weekDeliveries = [
    { day: 'Monday', deliveries: 8, earnings: '$124.50' },
    { day: 'Tuesday', deliveries: 12, earnings: '$189.75' },
    { day: 'Wednesday', deliveries: 10, earnings: '$156.25' },
    { day: 'Thursday', deliveries: 9, earnings: '$142.00' },
    { day: 'Friday', deliveries: 15, earnings: '$234.50' },
    { day: 'Saturday', deliveries: 6, earnings: '$98.25' },
    { day: 'Sunday', deliveries: 4, earnings: '$68.00' }
  ];

  const totalToday = todayDeliveries.reduce((sum, delivery) => {
    return sum + parseFloat(delivery.total.replace('$', ''));
  }, 0);

  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <YummyText>
          <div className="flex items-center justify-between mb-8 py-2">
            <div>
              <div className="text-3xl font-medium text-[#0F172A] mb-2">
                Earnings
              </div>
              <div className="text-[#4A5565] text-[15px] font-[400]">
                Track your income and performance
              </div>
            </div>
            <button className="bg-[#00B75A] hover:bg-[#00B876]  text-sm text-white px-3 py-2 rounded-xl transition-colors font-[400]">
              Request Payout
            </button>
          </div>
          </YummyText>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="#00D68F"/>
                </svg>
              }
              iconBg="bg-green-50"
              title="Today's Earnings"
              value="$124.50"
              subtitle="+$32.50 from yesterday"
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="#3B82F6"/>
                </svg>
              }
              iconBg="bg-blue-50"
              title="This Week"
              value="$687.25"
              subtitle="+15% from last week"
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="#F59E0B"/>
                </svg>
              }
              iconBg="bg-orange-50"
              title="Total Deliveries"
              value="42"
              subtitle="This week"
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#8B5CF6"/>
                </svg>
              }
              iconBg="bg-purple-50"
              title="Avg. per Delivery"
              value="$16.36"
              subtitle="+$2.15 improvement"
            />
          </div>

          {/* Weekly Earnings Trend Chart */}
          <div className="bg-white rounded-2xl p-6 mb-8" style={sideBottomShadow}>
            <YummyText>
            <div className="mb-6">
              <div className="text-xl font-normal text-[#0F172A] mb-1">
                Weekly Earnings Trend
              </div>
              <div className="text-sm text-[#64748B]">
                Your earnings over the past 7 days
              </div>
            </div>
            </YummyText>

            {/* Simple Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-4 px-4">
              {weekDeliveries.map((day, index) => {
                const maxEarnings = 250;
                const earnings = parseFloat(day.earnings.replace('$', ''));
                const height = (earnings / maxEarnings) * 100;
                
                return (
                  <YummyText>
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100%' }}>
                      <div 
                        className="w-full bg-[#00D68F] rounded-t-lg absolute bottom-0 transition-all hover:bg-[#00B876]"
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-[#64748B] mt-3">{day.day.slice(0, 3)}</div>
                  </div>
                  </YummyText>
                );
              })}
            </div>
          </div>

          {/* Tab Navigation */}
          <YummyText>
          <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 py-1 rounded-full w-fit">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-16 py-1 rounded-full text-sm font-normal transition-colors ${
                activeTab === 'today'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('week')}
              className={`px-16 py-1 rounded-full text-sm font-normal transition-colors ${
                activeTab === 'week'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              This Week
            </button>
          </div>
          </YummyText>

          {/* Today's Deliveries Table */}
          {activeTab === 'today' && (
            <YummyText> 
            <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-100" style={sideBottomShadow}>
              <div className="mb-6">
                <div className="text-xl font-normal text-[#0F172A] mb-1">
                  Today's Deliveries
                </div>
                <div className="text-sm text-[#64748B]">
                  Detailed breakdown of your earnings today
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Order ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Route</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Distance</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Base Pay</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Tips</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayDeliveries.map((delivery, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4 text-sm text-[#0F172A]">{delivery.orderId}</td>
                          <td className="py-4 px-4 text-sm text-[#64748B]">{delivery.time}</td>
                          <td className="py-4 px-4 text-sm text-[#0F172A]">
                            <div className="flex items-center gap-2">
                              <span>{delivery.from}</span>
                              <IonIcon icon={arrowForward} className="text-[#64748B]" style={{ fontSize: '14px' }} />
                              <span>{delivery.to}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-[#64748B]">{delivery.distance}</td>
                          <td className="py-4 px-4 text-sm text-[#0F172A]">{delivery.basePay}</td>
                          <td className="py-4 px-4 text-sm text-[#00D68F] font-medium">{delivery.tips}</td>
                          <td className="py-4 px-4 text-sm text-[#0F172A] font-medium text-right">{delivery.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0F172A]">Total Today</span>
                  <span className="text-xl font-medium text-[#00D68F]">${totalToday.toFixed(2)}</span>
                </div>
              </div>
            </div>
            </YummyText>
          )}

          {/* This Week's Summary */}
          {activeTab === 'week' && (
            <YummyText> 
            <div className="bg-white rounded-2xl p-6 mb-8" style={sideBottomShadow}>
              <div className="mb-6">
                <div className="text-xl font-normal text-[#0F172A] mb-1">
                  Weekly Summary
                </div>
                <div className="text-sm text-[#64748B]">
                  Your performance this week
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Day</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Deliveries</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Base Earnings</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Tips</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekDeliveries.map((day, index) => {
                        const totalEarnings = parseFloat(day.earnings.replace('$', ''));
                        const basePay = totalEarnings * 0.85; // Assuming ~85% is base pay
                        const tips = totalEarnings * 0.15; // Assuming ~15% is tips
                        
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4 text-sm text-[#0F172A]">{day.day}</td>
                            <td className="py-4 px-4 text-sm text-[#64748B]">{day.deliveries}</td>
                            <td className="py-4 px-4 text-sm text-[#0F172A]">${basePay.toFixed(2)}</td>
                            <td className="py-4 px-4 text-sm text-[#00D68F] font-medium">+${tips.toFixed(2)}</td>
                            <td className="py-4 px-4 text-sm text-[#0F172A] font-medium text-right">{day.earnings}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0F172A]">Total This Week</span>
                  <span className="text-xl font-medium text-[#00D68F]">$687.25</span>
                </div>
              </div>
            </div>
            </YummyText>
          )}

          {/* Next Payout Card */}
          <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] rounded-2xl p-6" style={sideBottomShadow}>
            <YummyText>
            <div className="mb-4">
              <div className="text-xl font-normal text-[#0F172A] mb-1">
                Next Payout
              </div>
              <div className="text-sm text-[#64748B]">
                Your earnings will be transferred automatically
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-[#64748B] mb-1">Available Balance</div>
                <div className="text-4xl font-normal text-[#00A63E]">$687.25</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#64748B] mb-1">Next Payout Date</div>
                <div className="text-base font-medium text-[#0F172A]">Friday, Oct 27, 2025</div>
              </div>
            </div>
            </YummyText>
          </div>
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default Earnings;