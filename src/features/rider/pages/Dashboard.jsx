import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import BlockIcon from "../../../icons/Blockicon";
import NairaIcon from "../../../icons/Nairaicon";
import AnalyticsIcon from "../../../icons/Analyticsicon";
import VerificationPromptModal from '../components/VerificationPromptModal';
// import { initializeVerificationSystem } from '../../../utils/verificationNotifications';
// import { isRiderVerified } from '../../../utils/cookies';
import { getRiderProfile } from '../../../utils/authApi';
import { getCookie, setCookie, getJSONCookie } from '../../../utils/cookies';

// Shadow only on left, right and bottom - no top shadow for seamless blend
const sideBottomShadow = {
  boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

export const shouldShowVerificationModal = () => {
  const isVerified = getCookie('riderAccountVerified') === 'true';
  if (isVerified) return false;

  const lastShown = getCookie('lastVerificationModalShownAt');
  if (!lastShown) return true;

  const hoursSince =
    (Date.now() - Number(lastShown)) / (1000 * 60 * 60);

  // Show at most once every 24 hours
  return hoursSince >= 24;
};

export const markVerificationModalShown = () => {
  setCookie(
    'lastVerificationModalShownAt',
    Date.now().toString(),
    1
  );
};

const StatCard = ({ icon, title, value, subtitle, iconBg }) => (
  <div className="bg-white rounded-xl p-5" style={sideBottomShadow}>
    <div className="flex items-start justify-between mb-10">
      <div className="text-xs text-[#4A5565] mt-2.5">{title}</div>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className="text-[29px] font-normal text-[#0F172A] mb-1">{value}</div>
    <div className="text-[11px] text-[#64748B] leading-none">{subtitle}</div>
  </div>
);

const DeliveryCard = ({ packageId, status, from, to, customer, price, distance, time, statusColor }) => (
  <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] rounded-2xl p-6 mb-3">
    <YummyText>
    <div className="flex items-start justify-between -mb-4">
      <div className="flex items-center gap-3">
        <div className="text-base font-normal text-[#0F172A]">{packageId}</div>
        <span className={`px-3 py-1 rounded-full text-xs font-normal ${statusColor}`}>
          {status}
        </span>
      </div>
      <div className="text-right">
        <div className="text-xl font-sm text-[#00A63E]">{price}</div>
        <div className="text-xs text-[#64748B]">{distance} · {time}</div>
      </div>
    </div>
    
    <div className="space-y-1 mb-4">
      <div className="text-xs text-[#0F172A]">From: <span className="text-[#0F172A]">{from}</span></div>
      <div className="text-xs text-[#0F172A]">To: <span className="text-[#0F172A]">{to}</span></div>
      <div className="text-xs text-[#0F172A]">Customer: <span className="text-[#0F172A]">{customer}</span></div>
    </div>

    <div className="flex gap-3">
      <button className="flex-1 bg-[#00B75A] text-sm hover:bg-[#00B876] text-medium text-white py-2 rounded-xl transition-colors font-[400]">
        Navigate
      </button>
      <button className="flex-1 py-2 bg-white text-sm hover:bg-[#FFFFFF] rounded-xl transition-colors text-[#0A0A0A] font-[400]" style={{border: "1px solid #0000001A"}}>
        Contact Customer
      </button>
      <button className="px-3 py-2 bg-white text-sm hover:bg-[#FFFFFF] rounded-xl transition-colors text-[#0A0A0A] font-[400]" style={{border: "1px solid #0000001A"}}>
        Update Status
      </button>
    </div>
    </YummyText>
  </div>
);

const AvailableOrderCard = ({ packageId, location, distance, price }) => (
  <YummyText>
  <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl mb-3">
    <div>
      <div className="text-base font-normal text-[#0F172A]">{packageId}</div>
      <div className="text-sm text-[#64748B] mb-0.5">{location}</div>
      <div className="text-xs text-[#94A3B8]">{distance}</div>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-lg font-normal text-[#00A63E]">{price}</div>
      <button className="bg-[#00B75A] hover:bg-[#00B876] text-white text-sm px-4 py-2.5 rounded-lg transition-colors font-nmedium">
        Accept
      </button>
    </div>
  </div>
  </YummyText>
);

const Dashboard = () => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [userName, setUserName] = useState(() => {
    // Initialize from cookies immediately
    const cachedUserData = getJSONCookie('user_data');
    if (cachedUserData) {
      try {
        const name = cachedUserData.fullName || `${cachedUserData.firstName || ''} ${cachedUserData.lastName || ''}`.trim();
        return name || 'Rider';
      } catch (e) {
        return 'Rider';
      }
    }
    return 'Rider';
  });

  useEffect(() => {
    fetchUserProfile();
    
    // Check if verification has been completed
    const verificationCompleted = getCookie('verificationCompleted');
    const verificationSubmitted = getCookie('verificationSubmitted');
    const riderVerificationStatus = getCookie('riderVerificationStatus');
    
    console.log('[Dashboard] 🔍 Verification status check:', { 
      verificationCompleted, 
      verificationSubmitted, 
      riderVerificationStatus
    });
    
    // Listen for verification completion to close modal
    const handleVerificationComplete = () => {
      console.log('[Dashboard] ✅ Verification completed, closing modal');
      setShowVerificationModal(false);
    };
    
    window.addEventListener('verification:completed', handleVerificationComplete);
    
    // Show modal if NOT approved
    const isApproved = riderVerificationStatus === 'approved';
    
    if (isApproved) {
      console.log('[Dashboard] ✓ Already approved - modal will NOT show');
      return () => {
        window.removeEventListener('verification:completed', handleVerificationComplete);
      };
    }
    
    // Show modal after 2 seconds
    console.log('[Dashboard] 🔔 Will show verification modal in 2 seconds...');
    const timer = setTimeout(() => {
      console.log('[Dashboard] 📋 Showing verification modal NOW');
      setShowVerificationModal(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('verification:completed', handleVerificationComplete);
    };
  }, []);


  const fetchUserProfile = async () => {
    try {
      const response = await getRiderProfile();
      const profile = response?.data?.driver || response?.driver || response?.data;
      
      if (profile) {
        const name = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        if (name) {
          setUserName(name);
        }
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch profile:', error);
      // Fallback to cookies
      const userData = getJSONCookie('user_data');
      if (userData) {
        try {
          const name = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          if (name) setUserName(name);
        } catch (e) {
          console.error('[Dashboard] Failed to parse user data:', e);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setShowVerificationModal(false);
  };

  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-padding">
          {/* Welcome Section */}
          <YummyText>
            <div className="mb-8 py-2">
              <div className="text-3xl font-medium text-[#0F172A] mb-2">
                Welcome back, {userName}!
              </div>
              <div className="text-[#4A5565] text-[15px] font-[400]">
                You're doing great today. Keep up the excellent work!
              </div>
            </div>
          </YummyText>

          {/* Stats Grid */}
          <YummyText>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<BlockIcon width={24} height={24} stroke="#007BFF" />}
              iconBg="bg-[#EFF6FF]"
              title="Today's Deliveries"
              value="8"
              subtitle="3 completed, 5 pending"
            />
            <StatCard
              icon={<NairaIcon size={24} color="#00C950" />}
              iconBg="bg-green-50"
              title="Today's Earnings"
              value="N12400.50"
              subtitle="+N2500.50 from yesterday"
            />
            <StatCard
              icon={<AnalyticsIcon width={24} height={24} stroke="#FF8C00" />}
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
          </YummyText>

          {/* Active Deliveries */}
          <div className="mb-8 bg-white p-6 rounded-2xl" style={sideBottomShadow}>
            <YummyText>
            <div className="mb-4">
              <div className="text-xl font-normal text-[#0F172A] mb-1">
                Active Deliveries
              </div>
              <div className="text-sm text-[#64748B]">
                Deliveries currently in progress
              </div>
            </div>
            </YummyText>
            
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
            <YummyText>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-medium text-[#0F172A] -mb-1">
                  Available Orders Nearby
                </div>
                <div className="text-medium text-gray-500 font-[400]">
                  Orders you can accept right now
                </div>
              </div>
              <button className="text-[#007BFF] text-sm font-medium">
                View All
              </button>
            </div>
            </YummyText>

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

      {/* Verification Prompt Modal */}
      <VerificationPromptModal 
        isOpen={showVerificationModal} 
        onClose={handleCloseModal} 
      />
    </IonPage>
  );
};

export default Dashboard;
