import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonToast } from '@ionic/react';
import { arrowForward } from 'ionicons/icons';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import { getRiderEarnings } from '../../../utils/authApi';

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
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Fetch earnings data on mount
  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      console.log('[Earnings] 🔍 Fetching earnings from API...');
      const response = await getRiderEarnings();
      console.log('[Earnings] ✅ API Response:', response);
      const earningsData = response?.data?.earnings || response?.earnings || response?.data;
      console.log('[Earnings] 📊 Earnings data:', earningsData);
      setEarnings(earningsData);
    } catch (error) {
      console.error('[Earnings] ❌ Error fetching earnings:', error);
      setToastMsg(error.message || 'Failed to load earnings data');
      setShowToast(true);
      setEarnings(null);
    } finally {
      setLoading(false);
    }
  };

  const todayDeliveries = earnings?.todayDeliveries || earnings?.deliveries || [];

  const weekDeliveries = earnings?.weeklyTrend || earnings?.weeklyDeliveries || [];

  // Calculate totals from API data only
  const todayEarnings = earnings?.todayTotal || earnings?.today || 'N0.00';
  const weeklyEarnings = earnings?.weeklyTotal || earnings?.weekly || 'N0.00';
  const monthlyEarnings = earnings?.monthlyTotal || earnings?.monthly || 'N0.00';
  const totalDeliveries = earnings?.totalDeliveries || 0;
  const avgPerDelivery = earnings?.avgPerDelivery || earnings?.average || 'N0.00';

  const totalToday = todayDeliveries.reduce((sum, delivery) => {
    const total = typeof delivery.total === 'string' 
      ? parseFloat(delivery.total.replace('$', ''))
      : delivery.total;
    return sum + total;
  }, 0);

  // Show loading state
  if (loading) {
    return (
      <IonPage>
        <RiderLayout>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D68F] mx-auto mb-4"></div>
                <p className="text-[#64748B]">Loading earnings...</p>
              </div>
            </div>
          </IonContent>
        </RiderLayout>
      </IonPage>
    );
  }

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
              value={todayEarnings}
              subtitle={earnings?.todayChange || "No change from yesterday"}
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="#3B82F6"/>
                </svg>
              }
              iconBg="bg-blue-50"
              title="This Week"
              value={weeklyEarnings}
              subtitle={earnings?.weeklyChange || "Weekly total"}
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="#F59E0B"/>
                </svg>
              }
              iconBg="bg-orange-50"
              title="Total Deliveries"
              value={totalDeliveries}
              subtitle={earnings?.deliveriesSubtitle || "Completed"}
            />
            <StatCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#8B5CF6"/>
                </svg>
              }
              iconBg="bg-purple-50"
              title="Avg. per Delivery"
              value={avgPerDelivery}
              subtitle={earnings?.avgChange || "Average earnings"}
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
              {weekDeliveries.length === 0 ? (
                <div className="w-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[#64748B] mb-2">No weekly data available</p>
                    <p className="text-sm text-[#94A3B8]">Complete deliveries to see your trend</p>
                  </div>
                </div>
              ) : (
                weekDeliveries.map((day, index) => {
                  const maxEarnings = 250;
                  const earningsStr = typeof day.earnings === 'string' ? day.earnings : `$${day.earnings}`;
                  const earningsValue = parseFloat(earningsStr.replace(/[$N,]/g, ''));
                  const height = (earningsValue / maxEarnings) * 100;
                  
                  return (
                    <YummyText key={index}>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100%' }}>
                        <div 
                          className="w-full bg-[#00D68F] rounded-t-lg absolute bottom-0 transition-all hover:bg-[#00B876]"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-[#64748B] mt-3">{day.day.slice(0, 3)}</div>
                    </div>
                    </YummyText>
                  );
                })
              )}
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
                  {todayDeliveries.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[#64748B] mb-2">No deliveries completed today</p>
                      <p className="text-sm text-[#94A3B8]">Start accepting orders to earn!</p>
                    </div>
                  ) : (
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
                  )}
                </div>
                {todayDeliveries.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0F172A]">Total Today</span>
                  <span className="text-xl font-medium text-[#00D68F]">${totalToday.toFixed(2)}</span>
                </div>
                )}
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
                  {weekDeliveries.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[#64748B] mb-2">No deliveries this week</p>
                      <p className="text-sm text-[#94A3B8]">Your weekly summary will appear here</p>
                    </div>
                  ) : (
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
                        const earningsStr = typeof day.earnings === 'string' ? day.earnings : `$${day.earnings}`;
                        const totalEarnings = parseFloat(earningsStr.replace(/[$N,]/g, ''));
                        const basePay = totalEarnings * 0.85; // Assuming ~85% is base pay
                        const tips = totalEarnings * 0.15; // Assuming ~15% is tips
                        
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4 text-sm text-[#0F172A]">{day.day}</td>
                            <td className="py-4 px-4 text-sm text-[#64748B]">{day.deliveries}</td>
                            <td className="py-4 px-4 text-sm text-[#0F172A]">${basePay.toFixed(2)}</td>
                            <td className="py-4 px-4 text-sm text-[#00D68F] font-medium">+${tips.toFixed(2)}</td>
                            <td className="py-4 px-4 text-sm text-[#0F172A] font-medium text-right">{earningsStr}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  )}
                </div>
                {weekDeliveries.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0F172A]">Total This Week</span>
                  <span className="text-xl font-medium text-[#00D68F]">{weeklyEarnings}</span>
                </div>
                )}
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

          {/* Toast Notification */}
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
            color={toastMsg.includes('Failed') || toastMsg.includes('Error') ? 'danger' : 'success'}
          />
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default Earnings;