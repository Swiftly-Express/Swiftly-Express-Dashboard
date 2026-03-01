import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { IonContent, IonPage, IonIcon, IonToast } from '@ionic/react';
import { arrowForward } from 'ionicons/icons';
import { X } from 'lucide-react';
import RiderLayout from '../components/RiderLayout';
import NairaIcon from '../../../icons/Nairaicon';
import AnalyzeIcon from '../../../icons/Analyzeicon';
import PeopleIcon from '../../../icons/Peopleicon';
import RevenueIcon from '../../../icons/Revenueicon';
import { YummyText } from '../../../components/YummyText';
import { getRiderEarnings, getRiderBalance, initializeDebtPayment, requestPayout, getPayoutHistory, notifyAdminEmailChange, getRiderProfile, updateBankDetails, setWithdrawalPin, resolveBankAccount } from '../../../utils/authApi';
import { setCookie, deleteCookie, getCookie } from '../../../utils/cookies';

const sideBottomShadow = {
  boxShadow: '0.5px 1.5px 2px rgba(0, 0, 0, 0.05), -0.5px 1.5px 2px rgba(0, 0, 0, 0.05), 0 1.5px 3px rgba(0, 0, 0, 0.07)'
};

// Nigerian banks: name and CBN/NIP or NIBSS code (used for transfers). Alphabetical.
const NIGERIAN_BANKS = [
  { name: 'Select your bank', code: '' },
  { name: 'Access Bank', code: '044' },
  { name: 'Alternative Bank Limited', code: '000028' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Coronation Merchant Bank', code: '060001' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'FBNQuest Merchant Bank', code: '060002' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'FSDH Merchant Bank', code: '400001' },
  { name: 'Globus Bank', code: '103' },
  { name: 'Greenwich Merchant Bank', code: '060004' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Microfinance Bank', code: '50211' },
  { name: 'Lotus Bank', code: '303' },
  { name: 'Moniepoint Microfinance Bank', code: '090405' },
  { name: 'Nova Merchant Bank', code: '060003' },
  { name: 'Optimus Bank', code: '559' },
  { name: 'Opay', code: '999992' },
  { name: 'Palmpay', code: '999991' },
  { name: 'Parallex Bank', code: '526' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Premium Trust Bank', code: '105' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Rand Merchant Bank', code: '000024' },
  { name: 'Signature Bank', code: '566' },
  { name: 'Sparkle Microfinance Bank', code: '090325' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Summit Bank', code: '309' },
  { name: 'SunTrust Bank Nigeria', code: '100' },
  { name: 'TAJ Bank', code: '302' },
  { name: 'Titan Trust Bank', code: '565' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'VFD Microfinance Bank', code: '090110' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
  // Additional commercial, mortgage & microfinance banks
  { name: '9PSB (9 Payment Service Bank)', code: '120001' },
  { name: 'Abbey Mortgage Bank', code: '070010' },
  { name: 'Accion Microfinance Bank', code: '090134' },
  { name: 'Alpha Morgan Bank', code: '000028' },
  { name: 'Carbon', code: '100026' },
  { name: 'Development Bank of Nigeria', code: '050001' },
  { name: 'FairMoney Microfinance Bank', code: '090551' },
  { name: 'FCMB Microfinance Bank', code: '090409' },
  { name: 'Gateway Mortgage Bank', code: '070009' },
  { name: 'GOMoney', code: '100022' },
  { name: 'Hope PSB', code: '120002' },
  { name: 'Infinity Trust Mortgage Bank', code: '070016' },
  { name: 'LAPO Microfinance Bank', code: '090177' },
  { name: 'LivingTrust Mortgage Bank', code: '070007' },
  { name: 'Mainstreet Microfinance Bank', code: '090171' },
  { name: 'MoMo PSB', code: '120003' },
  { name: 'Money Master PSB', code: '120005' },
  { name: 'Pecan Trust Microfinance Bank', code: '090137' },
  { name: 'Renmoney Microfinance Bank', code: '090198' },
  { name: 'SafeTrust Microfinance Bank', code: '090006' },
  { name: 'SmartCash PSB', code: '120004' },
  { name: 'Tangerine', code: '100023' },
  { name: 'Other (enter code below)', code: '__other__' }
];

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
      {debtAmount !== undefined && (
        debtAmount ? (
          <div className="absolute bottom-3 right-3 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold border border-red-200">
            -{debtAmount}
          </div>
        ) : (
          <div className="absolute bottom-4 right-3 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
            settled
          </div>
        )
      )}
    </YummyText>
  </div>
);

const Earnings = () =>
{
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('today');
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [payoutHistoryLoading, setPayoutHistoryLoading] = useState(false);
  const [declineLimitInfo, setDeclineLimitInfo] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [hasWithdrawalPin, setHasWithdrawalPin] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [payoutWithdrawalPin, setPayoutWithdrawalPin] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankCodeOther, setBankCodeOther] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankUpdatePin, setBankUpdatePin] = useState('');
  const [bankUpdatePinConfirm, setBankUpdatePinConfirm] = useState('');
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [pinCurrentPassword, setPinCurrentPassword] = useState('');
  const [pinCurrentPin, setPinCurrentPin] = useState('');
  const [pinNewPin, setPinNewPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [savingBank, setSavingBank] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  // Fetch decline limit info and bank/PIN status
  const fetchDeclineLimitInfo = async () =>
  {
    try {
      const response = await getRiderProfile();
      const data = response?.data?.data ?? response?.data ?? response;
      const declineInfo = data?.declineLimitInfo;
      if (declineInfo) {
        setDeclineLimitInfo(declineInfo);
      }
      if (data?.bankDetails) setBankDetails(data.bankDetails);
      setHasWithdrawalPin(!!data?.hasWithdrawalPin);
    } catch (error) {
      console.error('[Earnings] Failed to fetch decline limit info:', error);
    }
  };

  // Fetch earnings data on mount
  useEffect(() =>
  {
    // Initial fetch
    fetchEarnings();
    fetchBalance();
    fetchDeclineLimitInfo();

    // Refresh when window/tab becomes active or focused
    const onFocus = () =>
    {
      console.log('[Earnings] window focused — refreshing earnings');
      fetchEarnings();
      fetchBalance();
      fetchDeclineLimitInfo();
    };

    const onVisibilityChange = () =>
    {
      if (document.visibilityState === 'visible') {
        console.log('[Earnings] tab visible — refreshing earnings');
        fetchEarnings();
        fetchBalance();
        fetchDeclineLimitInfo();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Periodic refresh every 60 seconds
    const interval = setInterval(() =>
    {
      console.log('[Earnings] periodic refresh');
      fetchEarnings();
      fetchBalance();
      fetchDeclineLimitInfo();
    }, 60000);

    return () =>
    {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  // Handle payment success/error query params
  useEffect(() =>
  {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      setToastMsg('Debt payment successful! Your balance has been updated.');
      setShowToast(true);
      // Refresh earnings to show updated balance
      fetchEarnings();
      fetchBalance();
      // Clean up URL
      window.history.replaceState({}, '', '/rider/earnings');
    } else if (paymentStatus === 'error') {
      setToastMsg('Payment verification failed. Please contact support if the payment was deducted.');
      setShowToast(true);
      // Clean up URL
      window.history.replaceState({}, '', '/rider/earnings');
    }
  }, [location.search]);

  useEffect(() =>
  {
    const handlePaymentCompleted = async (evt) =>
    {
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

  const fetchEarnings = async () =>
  {
    try {
      setLoading(true);
      console.log('[Earnings] 🔍 Fetching earnings from API...');
      const response = await getRiderEarnings();
      console.log('[Earnings] ✅ API Response:', response);
      const earningsData = response?.data?.earnings || response?.earnings || response?.data;
      console.log('[Earnings] 📊 Earnings data:', earningsData);
      // Merge so we never wipe outstandingBalance set by fetchBalance (fixes race)
      setEarnings(prev => ({
        ...(earningsData || {}),
        outstandingBalance: prev?.outstandingBalance !== undefined ? prev.outstandingBalance : (earningsData?.outstandingBalance),
      }));
    } catch (error) {
      console.error('[Earnings] ❌ Error fetching earnings:', error);
      setToastMsg(error.message || 'Failed to load earnings data');
      setShowToast(true);
      setEarnings(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () =>
  {
    try {
      const resp = await getRiderBalance();
      const b = resp?.data || resp;
      const balance = Number(b?.balance || b?.outstanding || b?.due || b?.amountDue || 0);

      // Convert negative balance to positive outstanding debt for display
      // Balance is negative when rider owes money (e.g., -5000 means ₦5000 debt)
      const outstanding = balance < 0 ? Math.abs(balance) : 0;

      console.log('[Earnings] Fetched balance:', { balance, outstanding, rawResponse: b });

      // Store outstanding debt (positive value) in state
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

  const handleSettleDebt = async () =>
  {
    try {
      const outstanding = earnings?.outstandingBalance || 0;
      if (!outstanding || Number(outstanding) <= 0) {
        setToastMsg('No outstanding balance to settle');
        setShowToast(true);
        return;
      }

      // outstandingBalance is already a positive value (converted from negative balance)

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

      const initResponse = await initializeDebtPayment({
        amount: outstanding,
        callback_url: `${window.location.origin}/payment/callback`,
      });

      const initPayload = initResponse?.data || initResponse;
      const paymentObj = initPayload?.data?.payment || initPayload?.payment || initPayload?.data || initPayload;
      const paymentId = paymentObj?.id || paymentObj?._id;
      const paymentReference = paymentObj?.reference || paymentObj?.paystackReference;
      const authorizationUrl = paymentObj?.authorizationUrl || paymentObj?.authorization_url;

      console.log('[Earnings] Payment initialized:', { paymentId, paymentReference, authorizationUrl });

      // Store payment identifiers
      if (paymentId) setCookie('pending_debt_payment_id', String(paymentId), 1);
      if (paymentReference) setCookie('pending_debt_payment_reference', String(paymentReference), 1);
      if (riderId) setCookie('pending_debt_rider_id', String(riderId), 1);

      const cleanupOnPaymentCancel = async () =>
      {
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
          const popupInterval = setInterval(() =>
          {
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
            onClose: function ()
            {
              cleanupOnPaymentCancel();
            },
            callback: function (response)
            {
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
              setTimeout(() =>
              {
                window.location.href = `/payment/callback?reference=${paymentReference}`;
              }, 500);
            }
          });

          handler.openIframe();
        } catch (paystackErr) {
          console.error('[Earnings] Paystack inline failed:', paystackErr);
          // Final fallback: redirect to callback page
          window.location.href = `/payment/callback?reference=${paymentReference}`;
        }
      }
    } catch (error) {
      console.error('[Earnings] Failed to initiate debt payment:', error);
      setToastMsg(error.message || 'Failed to initiate payment');
      setShowToast(true);
    }
  };

  const handleRequestPayout = async () =>
  {
    if (!bankDetails) {
      setToastMsg('Please add your bank details first (Earnings or Profile).');
      setShowToast(true);
      setShowPayoutModal(false);
      setShowBankModal(true);
      return;
    }
    if (!hasWithdrawalPin) {
      setToastMsg('Please set your withdrawal PIN first (Earnings or Profile).');
      setShowToast(true);
      setShowPayoutModal(false);
      setShowPinModal(true);
      return;
    }
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      setToastMsg('Please enter a valid payout amount');
      setShowToast(true);
      return;
    }
    if (!payoutWithdrawalPin || payoutWithdrawalPin.length < 4 || payoutWithdrawalPin.length > 6 || !/^\d+$/.test(payoutWithdrawalPin)) {
      setToastMsg('Please enter your 4-6 digit withdrawal PIN');
      setShowToast(true);
      return;
    }

    const amount = parseFloat(payoutAmount);
    const availableBalance = earnings?.availableBalance || earnings?.balance || 0;

    if (amount > availableBalance) {
      setToastMsg(`Insufficient balance. Available: ${formatCurrency(availableBalance)}`);
      setShowToast(true);
      return;
    }

    try {
      setRequestingPayout(true);
      await requestPayout(amount, payoutWithdrawalPin);
      setToastMsg(`Payout request of ${formatCurrency(amount)} submitted successfully. Awaiting admin approval.`);
      setShowToast(true);
      setShowPayoutModal(false);
      setPayoutAmount('');
      setPayoutWithdrawalPin('');
      await fetchEarnings();
      await fetchBalance();
    } catch (error) {
      console.error('[Earnings] Failed to request payout:', error);
      setToastMsg(error?.response?.data?.message || error?.message || 'Failed to submit payout request');
      setShowToast(true);
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleResolveAccountName = async () =>
  {
    const effectiveBankCode = (bankCode === '__other__' ? bankCodeOther : bankCode).trim();
    const num = (bankAccountNumber || '').replace(/\D/g, '');
    if (!effectiveBankCode || num.length < 10) {
      setToastMsg('Select your bank and enter a 10-digit account number first');
      setShowToast(true);
      return;
    }
    try {
      setResolvingAccount(true);
      const { accountName } = await resolveBankAccount(effectiveBankCode, num);
      setBankAccountName(accountName || '');
      if (accountName) setToastMsg('Account name found');
      else setToastMsg('Could not resolve account name');
      setShowToast(true);
    } catch (err) {
      setToastMsg(err?.response?.data?.message || err?.message || 'Could not resolve account. Check bank and number.');
      setShowToast(true);
    } finally {
      setResolvingAccount(false);
    }
  };

  const handleSaveBankDetails = async () =>
  {
    const effectiveBankCode = (bankCode === '__other__' ? bankCodeOther : bankCode).trim();
    if (!effectiveBankCode || !bankAccountNumber.trim() || !bankAccountName.trim()) {
      setToastMsg('Please select your bank (or enter bank code), account number and account name');
      setShowToast(true);
      return;
    }
    if (hasWithdrawalPin) {
      if (!bankUpdatePin || bankUpdatePin.length < 4 || bankUpdatePin.length > 6 || !/^\d+$/.test(bankUpdatePin)) {
        setToastMsg('Enter your withdrawal PIN (4-6 digits)');
        setShowToast(true);
        return;
      }
      if (bankUpdatePin !== bankUpdatePinConfirm) {
        setToastMsg('Withdrawal PIN and confirmation do not match');
        setShowToast(true);
        return;
      }
    }
    try {
      setSavingBank(true);
      const payload = { bankCode: effectiveBankCode, accountNumber: bankAccountNumber.trim(), accountName: bankAccountName.trim() };
      if (hasWithdrawalPin) payload.withdrawalPin = bankUpdatePin;
      await updateBankDetails(payload);
      setToastMsg('Bank details saved successfully');
      setShowToast(true);
      setShowBankModal(false);
      setBankCode('');
      setBankCodeOther('');
      setBankAccountNumber('');
      setBankAccountName('');
      setBankUpdatePin('');
      setBankUpdatePinConfirm('');
      await fetchDeclineLimitInfo();
    } catch (error) {
      setToastMsg(error?.response?.data?.message || error?.message || 'Failed to save bank details');
      setShowToast(true);
    } finally {
      setSavingBank(false);
    }
  };

  const handleSavePin = async () =>
  {
    if (!pinNewPin || pinNewPin.length < 4 || pinNewPin.length > 6 || !/^\d+$/.test(pinNewPin)) {
      setToastMsg('New PIN must be 4-6 digits');
      setShowToast(true);
      return;
    }
    if (pinNewPin !== pinConfirm) {
      setToastMsg('New PIN and confirmation do not match');
      setShowToast(true);
      return;
    }
    if (hasWithdrawalPin && !pinCurrentPin) {
      setToastMsg('Enter your current PIN to change it');
      setShowToast(true);
      return;
    }
    // When setting PIN for first time, password is optional (Google sign-in users may not have one)
    try {
      setSavingPin(true);
      await setWithdrawalPin({
        currentPassword: hasWithdrawalPin ? undefined : pinCurrentPassword,
        currentPin: hasWithdrawalPin ? pinCurrentPin : undefined,
        newPin: pinNewPin,
      });
      setToastMsg(hasWithdrawalPin ? 'Withdrawal PIN updated' : 'Withdrawal PIN set successfully');
      setShowToast(true);
      setShowPinModal(false);
      setPinCurrentPassword('');
      setPinCurrentPin('');
      setPinNewPin('');
      setPinConfirm('');
      await fetchDeclineLimitInfo();
    } catch (error) {
      setToastMsg(error?.response?.data?.message || error?.message || 'Failed to save PIN');
      setShowToast(true);
    } finally {
      setSavingPin(false);
    }
  };

  const fetchPayoutHistory = async () =>
  {
    try {
      setPayoutHistoryLoading(true);
      const response = await getPayoutHistory(1, 20);
      const data = response?.data || response;
      setPayoutHistory(data?.payoutRequests || []);
    } catch (error) {
      console.error('[Earnings] Failed to fetch payout history:', error);
    } finally {
      setPayoutHistoryLoading(false);
    }
  };

  useEffect(() =>
  {
    if (activeTab === 'payouts') {
      fetchPayoutHistory();
    }
  }, [activeTab]);

  const formatCurrency = (val) =>
  {
    if (val === null || val === undefined) return '₦0.00';
    const num = typeof val === 'string' ? parseFloat(val.replace(/[$,N\s]/g, '')) : Number(val);
    if (Number.isNaN(num)) return String(val);
    return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // todayDeliveries from backend is now a COUNT (number), not an array of objects
  const todayDeliveriesCount = typeof earnings?.todayDeliveries === 'number'
    ? earnings.todayDeliveries
    : (Array.isArray(earnings?.todayDeliveries) ? earnings.todayDeliveries.length : 0);

  // weeklyDeliveries count
  const weeklyDeliveriesCount = typeof earnings?.weeklyDeliveries === 'number'
    ? earnings.weeklyDeliveries
    : 0;

  // weeklyTrend is an array of { date, earnings, deliveries } — used for the chart
  const weeklyTrendData = Array.isArray(earnings?.weeklyTrend) ? earnings.weeklyTrend : [];

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

  // totalToday is just todayEarningsRaw (already computed from backend)
  const totalToday = todayEarningsRaw;

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

          {/* Decline Limit Banner */}
          {declineLimitInfo && (
            <div className={`mb-6 p-5 rounded-xl border-2 shadow-sm ${declineLimitInfo.remainingDeclines === 0
              ? 'bg-red-50 border-red-200'
              : declineLimitInfo.remainingDeclines <= 2
                ? 'bg-orange-50 border-orange-200'
                : 'bg-blue-50 border-blue-200'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${declineLimitInfo.remainingDeclines === 0
                    ? 'bg-red-100'
                    : declineLimitInfo.remainingDeclines <= 2
                      ? 'bg-orange-100'
                      : 'bg-blue-100'
                    }`}>
                    {declineLimitInfo.remainingDeclines === 0 ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={declineLimitInfo.remainingDeclines <= 2 ? "#F59E0B" : "#3B82F6"} strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className={`text-lg font-semibold mb-1 ${declineLimitInfo.remainingDeclines === 0
                      ? 'text-red-700'
                      : declineLimitInfo.remainingDeclines <= 2
                        ? 'text-orange-700'
                        : 'text-blue-700'
                      }`}>
                      Daily Decline Limit: <span className={declineLimitInfo.remainingDeclines === 0 ? 'text-red-900' : declineLimitInfo.remainingDeclines <= 2 ? 'text-orange-900' : 'text-blue-900'}>
                        {declineLimitInfo.currentDeclines}/{declineLimitInfo.declineLimit}
                      </span>
                      {declineLimitInfo.remainingDeclines > 0 && (
                        <span className="text-sm font-normal ml-2">
                          ({declineLimitInfo.remainingDeclines} remaining)
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${declineLimitInfo.remainingDeclines === 0
                      ? 'text-red-600'
                      : declineLimitInfo.remainingDeclines <= 2
                        ? 'text-orange-600'
                        : 'text-blue-600'
                      }`}>
                      {declineLimitInfo.remainingDeclines === 0
                        ? '⚠️ You have reached your daily decline limit. You cannot decline more deliveries today.'
                        : declineLimitInfo.remainingDeclines <= 2
                          ? `⚠️ You have ${declineLimitInfo.remainingDeclines} decline${declineLimitInfo.remainingDeclines !== 1 ? 's' : ''} remaining. Exceeding your limit will disqualify you from incentives.`
                          : `You can decline up to ${declineLimitInfo.declineLimit} deliveries per day. Exceeding this limit will disqualify you from incentives.`
                      }
                    </div>
                  </div>
                </div>
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
                <button
                  onClick={() =>
                  {
                    const balance = earnings?.availableBalance || earnings?.balance || 0;
                    if (balance <= 0) {
                      setToastMsg('You have no available balance to request payout');
                      setShowToast(true);
                      return;
                    }
                    setPayoutAmount('');
                    setShowPayoutModal(true);
                  }}
                  className="bg-[#00B75A] hover:bg-[#00B876] whitespace-nowrap text-sm text-white px-3 py-2 rounded-full transition-colors font-[400]"
                >
                  Request Payout
                </button>
                {earnings?.outstandingBalance > 0 ? (
                  <button
                    onClick={handleSettleDebt}
                    className="bg-red-600 hover:bg-red-700 whitespace-nowrap text-sm text-white px-3 py-2 rounded-full transition-colors font-[400]"
                  >
                    Settle Debt
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-green-600 whitespace-nowrap text-sm text-white px-3 py-2 rounded-full font-[400] opacity-75 cursor-not-allowed"
                  >
                    No Debt
                  </button>
                )}
                {earnings?.outstandingBalance > 0 && (
                  <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-full border border-red-200">
                    <span className="text-sm font-semibold text-red-700">Debt:</span>
                    <span className="text-base font-bold text-red-900">-{formatCurrency(earnings.outstandingBalance)}</span>
                  </div>
                )}
              </div>
            </div>
          </YummyText>

          {/* Prominent Add bank details banner when not set */}
          {!bankDetails && (
            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-[#00B75A] to-[#00A63E] text-white flex flex-wrap items-center justify-between gap-4" style={sideBottomShadow}>
              <div>
                <h3 className="text-lg font-semibold mb-1">Add your bank details</h3>
                <p className="text-sm text-white/90">Add your bank account to receive payouts. Withdrawals are sent to the account you provide.</p>
              </div>
              <button type="button" onClick={() => setShowBankModal(true)} className="px-6 py-3 bg-white text-[#00B75A] font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-md">
                Add bank details
              </button>
            </div>
          )}

          {/* Stats Grid (2x2 layout to match dashboard) */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<NairaIcon size={24} color="#00D68F" />}
              iconBg="bg-green-50"
              title="Today's Earnings"
              value={todayEarnings}
              subtitle={earnings?.todayChange || `${todayDeliveriesCount} deliveries today`}
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
              {weeklyTrendData.length === 0 ? (
                <div className="w-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[#64748B] mb-2">No weekly trend data yet</p>
                    <p className="text-sm text-[#94A3B8]">Complete deliveries this week to see your earnings chart. Weekly total: {weeklyEarnings}</p>
                  </div>
                </div>
              ) : (
                weeklyTrendData.map((day, index) =>
                {
                  // Calculate max earnings from the week for proper scaling
                  const allEarnings = weeklyTrendData.map(d => Number(d.earnings) || 0);
                  const maxEarnings = Math.max(...allEarnings, 1);

                  const earningsValue = Number(day.earnings) || 0;
                  const heightPercent = (earningsValue / maxEarnings) * 100;
                  // Ensure minimum 10% height for visibility
                  const height = Math.max(heightPercent, 10);
                  // Format label: show day abbreviation from date string e.g. '2026-03-01' → 'Sun'
                  const dayLabel = day.date
                    ? new Date(day.date + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'short' })
                    : `D${index + 1}`;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                      <YummyText className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
                        <div
                          className="w-full bg-[#00D68F] rounded-t-lg transition-all hover:bg-[#00B876] cursor-pointer relative group"
                          style={{ height: `${height}%`, minHeight: '24px' }}
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {dayLabel}: ₦{earningsValue.toLocaleString('en-NG', { minimumFractionDigits: 0 })}
                          </div>
                        </div>
                        <div className="text-xs text-[#64748B] mt-2 font-medium">{dayLabel}</div>
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
                    {todayDeliveriesCount === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-[#64748B] mb-2">No deliveries completed today</p>
                        <p className="text-sm text-[#94A3B8]">Your today's delivery breakdown will appear here once you complete a delivery today. All-time total: {totalDeliveries}</p>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-[#64748B] font-medium mb-1">{todayDeliveriesCount} {todayDeliveriesCount === 1 ? 'delivery' : 'deliveries'} completed today</p>
                        <p className="text-2xl font-semibold text-[#00D68F]">{todayEarnings}</p>
                        <p className="text-sm text-[#94A3B8] mt-1">Total earned today</p>
                      </div>
                    )}
                  </div>
                  {todayDeliveriesCount > 0 && (
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
                    {weeklyTrendData.length === 0 || weeklyDeliveriesCount === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-[#64748B] mb-2">No deliveries this week yet</p>
                        <p className="text-sm text-[#94A3B8]">Complete deliveries this week to see your day-by-day breakdown.</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Day</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Deliveries</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-[#64748B] bg-white">Earnings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weeklyTrendData.map((day, index) =>
                          {
                            const earningsValue = Number(day.earnings) || 0;
                            const dayLabel = day.date
                              ? new Date(day.date + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })
                              : `Day ${index + 1}`;

                            return (
                              <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${earningsValue > 0 ? '' : 'opacity-40'}`}>
                                <td className="py-4 px-4 text-sm text-[#0F172A]">{dayLabel}</td>
                                <td className="py-4 px-4 text-sm text-[#64748B]">{day.deliveries || 0}</td>
                                <td className="py-4 px-4 text-sm text-[#0F172A] font-medium text-right">{formatCurrency(earningsValue)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {weeklyDeliveriesCount > 0 && (
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
              {bankDetails && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-[#64748B] mb-1">Current bank account</div>
                  <div className="text-sm text-[#0F172A]">
                    {(() =>
                    {
                      const bankName = NIGERIAN_BANKS.find((b) => b.code === bankDetails.bankCode)?.name;
                      return (
                        <>
                          <span className="font-medium">{bankName || `Bank (${bankDetails.bankCode})`}</span>
                          {' · '}
                          <span>{bankDetails.accountNumberMasked ?? bankDetails.accountNumber ?? '***'}</span>
                          {bankDetails.accountName && <><span> · </span><span>{bankDetails.accountName}</span></>}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowBankModal(true)} className={bankDetails ? 'px-4 py-2 rounded-xl border border-[#00B75A] text-[#00B75A] text-sm font-medium hover:bg-[#00B75A]/10' : 'px-4 py-2 rounded-xl bg-[#00B75A] text-white text-sm font-medium hover:bg-[#00A63E] shadow-sm'}>
                  {bankDetails ? 'Update bank details' : 'Add bank details'}
                </button>
                <button type="button" onClick={() => setShowPinModal(true)} className={hasWithdrawalPin ? 'px-4 py-2 rounded-xl border border-[#00B75A] text-[#00B75A] text-sm font-medium hover:bg-[#00B75A]/10' : 'px-4 py-2 rounded-xl bg-[#00B75A] text-white text-sm font-medium hover:bg-[#00A63E] shadow-sm'}>
                  {hasWithdrawalPin ? 'Change withdrawal PIN' : 'Set withdrawal PIN'}
                </button>
              </div>
            </YummyText>
          </div>

          {/* Payout Request Modal */}
          {showPayoutModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#0F172A]">Request Payout</h2>
                  <button
                    onClick={() => { setShowPayoutModal(false); setPayoutAmount(''); setPayoutWithdrawalPin(''); }}
                    className="text-[#64748B] hover:text-[#0F172A]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {!bankDetails && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">Add your bank details first to receive payouts.</p>
                    <button onClick={() => { setShowPayoutModal(false); setShowBankModal(true); }} className="mt-2 text-sm font-medium text-amber-700 underline">Add bank details</button>
                  </div>
                )}
                {bankDetails && !hasWithdrawalPin && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">Set your withdrawal PIN first for security.</p>
                    <button onClick={() => { setShowPayoutModal(false); setShowPinModal(true); }} className="mt-2 text-sm font-medium text-amber-700 underline">Set withdrawal PIN</button>
                  </div>
                )}
                {bankDetails && hasWithdrawalPin && (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-[#64748B] mb-2">Available: <span className="font-semibold text-[#0F172A]">{formatCurrency(earnings?.availableBalance || earnings?.balance || 0)}</span></p>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">Payout Amount</label>
                      <input
                        type="number"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="0"
                        max={earnings?.availableBalance || earnings?.balance || 0}
                        className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none"
                      />
                      <label className="block text-sm font-medium text-[#0F172A] mt-3 mb-2">Withdrawal PIN (4-6 digits)</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={payoutWithdrawalPin}
                        onChange={(e) => setPayoutWithdrawalPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter your PIN"
                        className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowPayoutModal(false); setPayoutAmount(''); setPayoutWithdrawalPin(''); }} className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#0F172A] rounded-xl hover:bg-gray-50" disabled={requestingPayout}>Cancel</button>
                      <button onClick={handleRequestPayout} disabled={requestingPayout || !payoutAmount || parseFloat(payoutAmount) <= 0 || !payoutWithdrawalPin || payoutWithdrawalPin.length < 4} className="flex-1 px-4 py-2 bg-[#00B75A] text-white rounded-xl hover:bg-[#00B876] disabled:opacity-50 disabled:cursor-not-allowed">{requestingPayout ? 'Submitting...' : 'Submit Request'}</button>
                    </div>
                  </>
                )}
                {(!bankDetails || !hasWithdrawalPin) && (
                  <button onClick={() => { setShowPayoutModal(false); setPayoutAmount(''); }} className="w-full mt-2 px-4 py-2 border border-[#E2E8F0] text-[#0F172A] rounded-xl hover:bg-gray-50">Close</button>
                )}
              </div>
            </div>
          )}

          {/* Bank Details Modal */}
          {showBankModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#0F172A]">Bank Details</h2>
                  <button onClick={() => { setShowBankModal(false); setBankCode(''); setBankCodeOther(''); setBankAccountNumber(''); setBankAccountName(''); setBankUpdatePin(''); setBankUpdatePinConfirm(''); }} className="text-[#64748B] hover:text-[#0F172A]"><X className="w-5 h-5" /></button>
                </div>
                <p className="text-sm text-[#64748B] mb-4">Withdrawals will be sent to this account. Select your bank below (we use the bank code for transfers).</p>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Bank</label>
                    <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none bg-white">
                      {NIGERIAN_BANKS.map((b) => (
                        <option key={b.code || b.name} value={b.code}>{b.name || `Code ${b.code}`}</option>
                      ))}
                    </select>
                    {bankCode === '__other__' && (
                      <input type="text" value={bankCodeOther} onChange={(e) => setBankCodeOther(e.target.value.replace(/\D/g, ''))} placeholder="Enter your bank code (e.g. 058)" className="w-full mt-2 px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Account number</label>
                    <input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))} placeholder="10 digits" maxLength={10} className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none" />
                    <button type="button" onClick={handleResolveAccountName} disabled={resolvingAccount || (bankCode === '__other__' ? !bankCodeOther.trim() : !bankCode) || bankAccountNumber.replace(/\D/g, '').length < 10} className="mt-2 text-sm font-medium text-[#00B75A] hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline">
                      {resolvingAccount ? 'Resolving...' : 'Find account name automatically'}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Account name</label>
                    <input type="text" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="As on bank account or click above to resolve" className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none" />
                  </div>
                  {hasWithdrawalPin && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-1">Withdrawal PIN (enter to confirm update)</label>
                        <input type="password" inputMode="numeric" maxLength={6} value={bankUpdatePin} onChange={(e) => setBankUpdatePin(e.target.value.replace(/\D/g, ''))} placeholder="4-6 digits" className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-1">Confirm withdrawal PIN</label>
                        <input type="password" inputMode="numeric" maxLength={6} value={bankUpdatePinConfirm} onChange={(e) => setBankUpdatePinConfirm(e.target.value.replace(/\D/g, ''))} placeholder="Re-enter PIN" className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none" />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowBankModal(false); setBankCode(''); setBankCodeOther(''); setBankAccountNumber(''); setBankAccountName(''); setBankUpdatePin(''); setBankUpdatePinConfirm(''); }} className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#0F172A] rounded-xl hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSaveBankDetails} disabled={savingBank} className="flex-1 px-4 py-2 bg-[#00B75A] text-white rounded-xl hover:bg-[#00B876] disabled:opacity-50">{savingBank ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal PIN Modal */}
          {showPinModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#0F172A]">{hasWithdrawalPin ? 'Change Withdrawal PIN' : 'Set Withdrawal PIN'}</h2>
                  <button onClick={() => { setShowPinModal(false); setPinCurrentPassword(''); setPinCurrentPin(''); setPinNewPin(''); setPinConfirm(''); }} className="text-[#64748B] hover:text-[#0F172A]"><X className="w-5 h-5" /></button>
                </div>
                <p className="text-sm text-[#64748B] mb-4">Use this PIN when requesting a payout. Enter your new PIN twice below so you can be sure you remember it (4-6 digits).</p>
                <div className="space-y-3 mb-4">
                  {hasWithdrawalPin ? (
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-1">Current PIN</label>
                      <input type="password" inputMode="numeric" maxLength={6} value={pinCurrentPin} onChange={(e) => setPinCurrentPin(e.target.value.replace(/\D/g, ''))} placeholder="Current PIN" className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-1">Your account password (optional)</label>
                      <input type="password" value={pinCurrentPassword} onChange={(e) => setPinCurrentPassword(e.target.value)} placeholder="Leave blank if you signed up with Google" className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none" />
                      <p className="text-xs text-[#64748B] mt-1">If you signed up with Google, leave this blank. Otherwise enter your password to confirm.</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">New PIN (4-6 digits)</label>
                    <input type="password" inputMode="numeric" maxLength={6} value={pinNewPin} onChange={(e) => setPinNewPin(e.target.value.replace(/\D/g, ''))} placeholder="Enter new PIN" className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Re-enter new PIN</label>
                    <input type="password" inputMode="numeric" maxLength={6} value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))} placeholder="Enter again to confirm" className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowPinModal(false); setPinCurrentPassword(''); setPinCurrentPin(''); setPinNewPin(''); setPinConfirm(''); }} className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#0F172A] rounded-xl hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSavePin} disabled={savingPin} className="flex-1 px-4 py-2 bg-[#00B75A] text-white rounded-xl hover:bg-[#00B876] disabled:opacity-50">{savingPin ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          )}

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