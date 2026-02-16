import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonToast } from '@ionic/react';
import { arrowForward } from 'ionicons/icons';
import RiderLayout from '../components/RiderLayout';
import NairaIcon from '../../../icons/Nairaicon';
import AnalyzeIcon from '../../../icons/Analyzeicon';
import PeopleIcon from '../../../icons/Peopleicon';
import RevenueIcon from '../../../icons/Revenueicon';
import { YummyText } from '../../../components/YummyText';
import { getRiderEarnings, getRiderBalance, payDebt, notifyAdminEmailChange } from '../../../utils/authApi';
import { setCookie, deleteCookie, getCookie } from '../../../utils/cookies';

const sideBottomShadow = {
  boxShadow: '0.5px 1.5px 2px rgba(0, 0, 0, 0.05), -0.5px 1.5px 2px rgba(0, 0, 0, 0.05), 0 1.5px 3px rgba(0, 0, 0, 0.07)'
};

const StatCard = ({ icon, iconBg, title, value, subtitle, debtAmount }) => (
  <div className="bg-white rounded-xl p-5 relative" style={sideBottomShadow}>
    <YummyText>
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm text-[#64748B] mt-3">{title}</div>
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-normal text-[#0F172A] mb-1">{value}</div>
      <div className="text-xs text-[#64748B]">{subtitle}</div>
      {debtAmount && debtAmount > 0 && (
        <div className="absolute bottom-3 right-3 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold border border-red-200">
          (-{debtAmount})
        </div>
      )}
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
    // Initial fetch
    fetchEarnings();
    fetchBalance();

    // Refresh when window/tab becomes active or focused
    const onFocus = () => {
      console.log('[Earnings] window focused — refreshing earnings');
      fetchEarnings();
      fetchBalance();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Earnings] tab visible — refreshing earnings');
        fetchEarnings();
        fetchBalance();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Periodic refresh every 60 seconds
    const interval = setInterval(() => {
      console.log('[Earnings] periodic refresh');
      fetchEarnings();
      fetchBalance();
    }, 60000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handlePaymentCompleted = async (evt) => {
      console.log('[Earnings] Payment completed event received:', evt?.detail);

      try {
        const riderId = earnings?.riderId || earnings?.rider?._id || getCookie('pending_debt_rider_id');
        const previousBalance = earnings?.outstandingBalance || 0;

        // Clear all pending cookies
        deleteCookie('pending_debt_payment_id');
        deleteCookie('pending_debt_payment_reference');
        deleteCookie('pending_debt_rider_id');

        // Show success message
        setToastMsg(`Payment successful! Your debt of ${formatCurrency(previousBalance)} has been cleared.`);
        setShowToast(true);

        // Refresh balances to get updated data
        await fetchBalance();
        await fetchEarnings();

        // Notify admin that debt was paid
        if (previousBalance && Number(previousBalance) > 0) {
          try {
            console.log('[Earnings] Notifying admin: debt payment completed');
            const resp = await notifyAdminEmailChange({
              type: 'debt_paid',
              riderId,
              amount: previousBalance,
              message: `Rider successfully paid outstanding debt of ${formatCurrency(previousBalance)}`,
              timestamp: new Date().toISOString(),
              paymentDetails: evt?.detail || null
            });

            // Dispatch local event
            window.dispatchEvent(new CustomEvent('debt:updated', {
              detail: {
                riderId,
                amount: 0,
                paid: true,
                previousAmount: previousBalance,
                serverResponse: resp
              }
            }));

            console.log('[Earnings] Admin notification sent successfully');
          } catch (e) {
            console.warn('[Earnings] Failed to notify admin about debt payment:', e);
          }
        }
      } catch (e) {
        console.error('[Earnings] Error handling payment completion:', e);
        setToastMsg('Payment processed but there was an error updating your balance. Please refresh.');
        setShowToast(true);
      }
    };

    window.addEventListener('payment:completed', handlePaymentCompleted);
    return () => window.removeEventListener('payment:completed', handlePaymentCompleted);
  }, [earnings]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      console.log('[Earnings] 🔍 Fetching earnings from API...');
      const response = await getRiderEarnings();
      console.log('[Earnings] ✅ API Response:', response);
      const earningsData = response?.data?.earnings || response?.earnings || response?.data;
      console.log('[Earnings] 📊 Earnings data:', earningsData);
      // Use backend-provided earnings object directly (avoid frontend recalculation)
      setEarnings(earningsData || {});
    } catch (error) {
      console.error('[Earnings] ❌ Error fetching earnings:', error);
      setToastMsg(error.message || 'Failed to load earnings data');
      setShowToast(true);
      setEarnings(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const resp = await getRiderBalance();
      const b = resp?.data || resp;
      const outstanding = Number(b?.balance || b?.outstanding || b?.due || b?.amountDue || 0);

      console.log('[Earnings] Fetched balance:', { outstanding, rawResponse: b });

      // Store balance in state
      setEarnings(prev => ({ ...(prev || {}), outstandingBalance: outstanding }));

      const riderId = earnings?.riderId || earnings?.rider?._id || earnings?._id;

      // Always notify admin about debt status (whether owing or clear)
      if (outstanding > 0) {
        // Rider owes money
        console.log('[Earnings] Rider has outstanding debt:', outstanding);
        setToastMsg(''); // Clear any previous success messages

        try {
          await notifyAdminEmailChange({
            type: 'debt_due',
            riderId,
            amount: outstanding,
            message: `Rider has outstanding debt of ${formatCurrency(outstanding)}`,
            timestamp: new Date().toISOString()
          });

          // Dispatch local event for other components
          window.dispatchEvent(new CustomEvent('debt:updated', {
            detail: { riderId, amount: outstanding, status: 'owing' }
          }));
        } catch (notifyErr) {
          console.warn('[Earnings] Failed to notify admin about outstanding debt', notifyErr);
        }
      } else {
        // Rider's balance is clear
        console.log('[Earnings] Rider has no outstanding debt');

        // Notify admin that rider is clear (if they previously had debt)
        const previousBalance = earnings?.outstandingBalance || 0;
        if (Number(previousBalance) > 0) {
          try {
            await notifyAdminEmailChange({
              type: 'debt_cleared',
              riderId,
              amount: 0,
              previousAmount: previousBalance,
              message: `Rider's debt has been cleared (was ${formatCurrency(previousBalance)})`,
              timestamp: new Date().toISOString()
            });

            window.dispatchEvent(new CustomEvent('debt:updated', {
              detail: { riderId, amount: 0, status: 'clear', previousAmount: previousBalance }
            }));
          } catch (notifyErr) {
            console.warn('[Earnings] Failed to notify admin about cleared debt', notifyErr);
          }
        }
      }
    } catch (error) {
      console.error('[Earnings] Failed to fetch rider balance:', error);
    }
  };

  const handleSettleDebt = async () => {
    try {
      const outstanding = earnings?.outstandingBalance || 0;
      if (!outstanding || Number(outstanding) <= 0) {
        setToastMsg('No outstanding balance to settle');
        setShowToast(true);
        return;
      }

      const riderId = earnings?.riderId || earnings?.rider?._id || earnings?._id;

      // Notify admin that rider is attempting to pay debt
      try {
        console.log('[Earnings] Notifying admin: rider initiating debt payment');
        await notifyAdminEmailChange({
          type: 'debt_payment_initiated',
          riderId,
          amount: outstanding,
          message: `Rider is attempting to settle outstanding debt of ${formatCurrency(outstanding)}`
        });
      } catch (notifyErr) {
        console.warn('[Earnings] Failed to notify admin about debt payment initiation', notifyErr);
      }

      // Open payment popup synchronously
      let paymentWindow = null;
      try {
        paymentWindow = window.open('', '_blank');
        if (paymentWindow) paymentWindow.document.write('<p>Preparing payment...</p>');
      } catch (e) {
        paymentWindow = null;
      }

      // Initialize payment
      setToastMsg('Initializing payment...');
      setShowToast(true);

      const initJson = await payDebt({
        amount: outstanding,
        currency: 'NGN',
        callback_url: `${window.location.origin}/rider/payment/callback`,
        metadata: { riderId, type: 'debt_settlement' }
      });

      const initPayload = initJson?.data || initJson;
      const paymentObj = initPayload?.data?.payment || initPayload?.payment || initPayload?.data || initPayload;
      const paymentId = paymentObj?._id || paymentObj?.id || paymentObj?.paymentId;
      const paymentReference = paymentObj?.reference || paymentObj?.paystackReference;
      const authorizationUrl = paymentObj?.authorizationUrl || paymentObj?.authorization_url || paymentObj?.url || paymentObj?.payment_url;

      console.log('[Earnings] Payment initialized:', { paymentId, paymentReference, authorizationUrl });

      // Store payment identifiers
      if (paymentId) setCookie('pending_debt_payment_id', String(paymentId), 1);
      if (paymentReference) setCookie('pending_debt_payment_reference', String(paymentReference), 1);
      if (riderId) setCookie('pending_debt_rider_id', String(riderId), 1);

      const cleanupOnPaymentCancel = async () => {
        try {
          deleteCookie('pending_debt_payment_id');
          deleteCookie('pending_debt_payment_reference');
          deleteCookie('pending_debt_rider_id');
        } catch (e) { /* ignore */ }

        setToastMsg('Payment was not completed. Outstanding balance remains.');
        setShowToast(true);

        // Notify admin that payment was cancelled
        try {
          await notifyAdminEmailChange({
            type: 'debt_payment_cancelled',
            riderId,
            amount: outstanding,
            message: 'Rider cancelled debt payment'
          });
        } catch (notifyErr) {
          console.warn('[Earnings] Failed to notify admin about payment cancellation', notifyErr);
        }
      };

      // Try hosted payment URL first
      if (authorizationUrl && authorizationUrl.startsWith('http')) {
        try {
          if (paymentWindow) {
            paymentWindow.location.href = authorizationUrl;
          } else {
            window.open(authorizationUrl, '_blank');
          }

          // Monitor popup closure
          const popupInterval = setInterval(() => {
            try {
              if (!paymentWindow || paymentWindow.closed) {
                clearInterval(popupInterval);
                const pending = getCookie('pending_debt_payment_id');
                if (pending) {
                  cleanupOnPaymentCancel();
                }
              }
            } catch (e) {
              clearInterval(popupInterval);
            }
          }, 1000);

          return;
        } catch (navErr) {
          console.warn('[Earnings] Failed to open hosted payment URL', navErr);
          // Close popup and fallback
          try { if (paymentWindow) paymentWindow.close(); } catch (e) { /* ignore */ }
        }
      }

      // Fallback to inline Paystack or direct callback redirect
      if (paymentReference) {
        try {
          // Try to load Paystack inline
          const PaystackPop = (await import('@paystack/inline-js')).default;
          const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxx';

          const handler = PaystackPop.setup({
            key: paystackPublicKey,
            email: earnings?.email || 'rider@swiftlyxpress.com',
            amount: outstanding * 100, // Convert to kobo
            currency: 'NGN',
            ref: paymentReference,
            metadata: {
              riderId,
              type: 'debt_settlement',
              custom_fields: [
                {
                  display_name: 'Rider ID',
                  variable_name: 'rider_id',
                  value: riderId
                }
              ]
            },
            onClose: function () {
              cleanupOnPaymentCancel();
            },
            callback: function (response) {
              console.log('[Earnings] Payment successful:', response);
              setToastMsg('Payment successful! Verifying...');
              setShowToast(true);

              // Clean up cookies
              try {
                deleteCookie('pending_debt_payment_id');
                deleteCookie('pending_debt_payment_reference');
                deleteCookie('pending_debt_rider_id');
              } catch (e) { /* ignore */ }

              // Redirect to callback/success page
              setTimeout(() => {
                window.location.href = `/rider/payment/callback?reference=${paymentReference}`;
              }, 500);
            }
          });

          handler.openIframe();
        } catch (paystackErr) {
          console.error('[Earnings] Paystack inline failed:', paystackErr);
          // Final fallback: redirect to callback page
          window.location.href = `/rider/payment/callback?reference=${paymentReference}`;
        }
      }
    } catch (error) {
      console.error('[Earnings] Failed to initiate debt payment:', error);
      setToastMsg(error.message || 'Failed to initiate payment');
      setShowToast(true);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '₦0.00';
    const num = typeof val === 'string' ? parseFloat(val.replace(/[$,N\s]/g, '')) : Number(val);
    if (Number.isNaN(num)) return String(val);
    return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const todayDeliveries = earnings?.todayDeliveries || earnings?.deliveries || [];

  // Use ONLY real weekly data from API - no mock data
  const weekDeliveries = earnings?.weeklyTrend || earnings?.weeklyDeliveries || [];

  // Calculate totals from API data - using actual API response keys
  const todayEarningsRaw = earnings?.todayEarnings || earnings?.todayTotal || earnings?.today || 0;
  const weeklyEarningsRaw = earnings?.weeklyEarnings || earnings?.weeklyTotal || earnings?.weekly || 0;
  const monthlyEarningsRaw = earnings?.monthlyEarnings || earnings?.monthlyTotal || earnings?.monthly || 0;
  const totalEarningsRaw = earnings?.totalEarnings || 0;
  const totalDeliveries = earnings?.totalDeliveries || 0;
  const monthlyDeliveries = earnings?.monthlyDeliveries || 0;
  const avgPerDeliveryRaw = earnings?.averagePerDelivery || earnings?.avgPerDelivery || earnings?.average || 0;

  // Format currency values - no fallbacks, use actual values
  const todayEarnings = formatCurrency(todayEarningsRaw);
  const weeklyEarnings = formatCurrency(weeklyEarningsRaw);
  const monthlyEarnings = formatCurrency(monthlyEarningsRaw);
  const avgPerDelivery = formatCurrency(avgPerDeliveryRaw);

  // Derive payout / balance information from API when available
  const availableBalance = earnings?.availableBalance || earnings?.available_balance || earnings?.available || earnings?.balance || 0;
  const nextPayoutObj = earnings?.nextPayout || earnings?.upcomingPayout || earnings?.next_payout || earnings?.upcoming_payout || null;
  const nextPayoutAmount = nextPayoutObj?.amount || earnings?.upcomingAmount || earnings?.nextPayoutAmount || availableBalance;
  const nextPayoutDateRaw = nextPayoutObj?.date || nextPayoutObj?.scheduledAt || earnings?.nextPayoutDate || earnings?.upcomingDate || null;
  const nextPayoutDate = nextPayoutDateRaw ? new Date(nextPayoutDateRaw) : null;

  const totalToday = todayDeliveries.reduce((sum, delivery) => {
    const raw = typeof delivery.total === 'string' ? delivery.total : String(delivery.total || '0');
    const cleaned = raw.replace(/[$₦N,\s]/g, '');
    const parsed = parseFloat(cleaned) || 0;
    return sum + parsed;
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
          {/* Outstanding Debt Banner */}
          {earnings?.outstandingBalance > 0 && (
            <div className="mb-6 p-5 rounded-xl bg-red-50 border-2 border-red-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-700 mb-1">
                      Outstanding Debt: <span className="text-red-900">-{formatCurrency(earnings.outstandingBalance)}</span>
                    </div>
                    <div className="text-sm text-red-600">
                      Please settle this amount to resume full access to deliveries and earnings.
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSettleDebt}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  Settle Now
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <YummyText>
            <div className="flex items-center justify-between mb-8 py-2">
              <div>
                <div className="text-3xl font-medium text-[#0F172A] mb-2">
                  Earnings
                </div>
                <div className="text-[#4A5565] text-[13px] sm:text-[16px] md:text-[18px] font-[400]">
                  Track your income and performance
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="bg-[#00B75A] hover:bg-[#00B876] whitespace-nowrap text-sm text-white px-3 py-2 rounded-full transition-colors font-[400]">
                  Request Payout
                </button>
                <button
                  onClick={handleSettleDebt}
                  className="bg-red-600 hover:bg-red-700 whitespace-nowrap text-sm text-white px-3 py-2 rounded-full transition-colors font-[400]"
                >
                  Settle Debt
                </button>
                {earnings?.outstandingBalance > 0 && (
                  <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-full border border-red-200">
                    <span className="text-sm font-semibold text-red-700">Debt:</span>
                    <span className="text-base font-bold text-red-900">-{formatCurrency(earnings.outstandingBalance)}</span>
                  </div>
                )}
              </div>
            </div>
          </YummyText>

          {/* Stats Grid (2x2 layout to match dashboard) */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<NairaIcon size={24} color="#00D68F" />}
              iconBg="bg-green-50"
              title="Today's Earnings"
              value={todayEarnings}
              subtitle={earnings?.todayChange || `${todayDeliveries.length} deliveries today`}
              debtAmount={earnings?.outstandingBalance > 0 ? formatCurrency(earnings.outstandingBalance) : null}
            />
            <StatCard
              icon={<AnalyzeIcon width={24} height={24} stroke="#3B82F6" />}
              iconBg="bg-blue-50"
              title="This Week"
              value={weeklyEarnings}
              subtitle={earnings?.weeklyChange || `Last 7 days total`}
            />
            <StatCard
              icon={<PeopleIcon width={24} height={24} stroke="#F59E0B" />}
              iconBg="bg-orange-50"
              title="Total Deliveries"
              value={totalDeliveries}
              subtitle={earnings?.deliveriesSubtitle || "All completed deliveries"}
            />
            <StatCard
              icon={<RevenueIcon width={24} height={24} stroke="#8B5CF6" />}
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
            <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2 md:px-4">
              {weekDeliveries.length === 0 ? (
                <div className="w-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[#64748B] mb-2">No weekly trend data from API</p>
                    <p className="text-sm text-[#94A3B8]">Weekly breakdown will appear when the backend provides it. Current total: ₦{(earnings?.totalEarnings || 0).toLocaleString('en-NG')}</p>
                  </div>
                </div>
              ) : (
                weekDeliveries.map((day, index) => {
                  // Calculate max earnings from the week for proper scaling
                  const allEarnings = weekDeliveries.map(d => {
                    const val = typeof d.earnings === 'number' ? d.earnings : parseFloat(String(d.earnings).replace(/[$N,]/g, ''));
                    return isNaN(val) ? 0 : val;
                  });
                  const maxEarnings = Math.max(...allEarnings, 1);

                  const earningsValue = typeof day.earnings === 'number' ? day.earnings : parseFloat(String(day.earnings).replace(/[$N,]/g, ''));
                  const heightPercent = (earningsValue / maxEarnings) * 100;
                  // Ensure minimum 10% height for visibility
                  const height = Math.max(heightPercent, 10);

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                      <YummyText className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
                        <div
                          className="w-full bg-[#00D68F] rounded-t-lg transition-all hover:bg-[#00B876] cursor-pointer relative group"
                          style={{ height: `${height}%`, minHeight: '24px' }}
                          title={`${day.day}: ₦${earningsValue.toFixed(2)}`}
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            ₦{earningsValue.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </div>
                        </div>
                        <div className="text-xs text-[#64748B] mt-2 font-medium">{day.day.slice(0, 3)}</div>
                      </YummyText>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <YummyText>
            <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 rounded-full w-full md:w-fit">
              <button
                onClick={() => setActiveTab('today')}
                className={`flex-1 md:flex-none px-4 md:px-16 py-2 rounded-full text-sm font-normal text-center transition-colors ${activeTab === 'today'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
                  }`}
              >
                Today
              </button>
              <button
                onClick={() => setActiveTab('week')}
                className={`flex-1 md:flex-none px-4 md:px-16 py-2 rounded-full text-sm font-normal text-center transition-colors ${activeTab === 'week'
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
                        <p className="text-[#64748B] mb-2">No detailed delivery data available</p>
                        <p className="text-sm text-[#94A3B8]">The API doesn't provide today's delivery breakdown yet. Total deliveries: {totalDeliveries}</p>
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
                      <span className="text-xl font-medium text-[#00D68F]">{formatCurrency(totalToday)}</span>
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
                        <p className="text-[#64748B] mb-2">No weekly breakdown available</p>
                        <p className="text-sm text-[#94A3B8]">The API will provide day-by-day breakdown soon. Monthly deliveries: {monthlyDeliveries}</p>
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
                            const earningsValue = typeof day.earnings === 'number' ? day.earnings : parseFloat(String(day.earnings).replace(/[$N,]/g, ''));
                            const basePay = earningsValue * 0.85; // Assuming ~85% is base pay
                            const tips = earningsValue * 0.15; // Assuming ~15% is tips

                            return (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm text-[#0F172A]">{day.day}</td>
                                <td className="py-4 px-4 text-sm text-[#64748B]">{day.deliveries || 0}</td>
                                <td className="py-4 px-4 text-sm text-[#0F172A]">₦{basePay.toFixed(2)}</td>
                                <td className="py-4 px-4 text-sm text-[#00D68F] font-medium">+₦{tips.toFixed(2)}</td>
                                <td className="py-4 px-4 text-sm text-[#0F172A] font-medium text-right">₦{earningsValue.toFixed(2)}</td>
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
                  <div className="text-4xl font-normal text-[#00A63E]">{formatCurrency(nextPayoutAmount || availableBalance)}</div>
                  {earnings?.outstandingBalance > 0 && (
                    <div className="text-sm text-red-600 mt-1 font-semibold">Outstanding: -{formatCurrency(earnings.outstandingBalance)}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#64748B] mb-1">Next Payout Date</div>
                  <div className="text-base font-medium text-[#0F172A]">
                    {nextPayoutDate ? nextPayoutDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled automatically'}
                  </div>
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