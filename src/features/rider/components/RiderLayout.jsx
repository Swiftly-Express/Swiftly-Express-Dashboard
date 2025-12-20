import React, { useState, useEffect } from 'react';
import RiderSidebar from './RiderSidebar';
import { YummyText } from '../../../components/YummyText';
import { getRiderProfile } from '../../../utils/authApi';
import { getCookie, setCookie, getJSONCookie } from '../../../utils/cookies';

// Generate mock avatar based on user name
const generateMockAvatar = (name) => {
  if (!name || name === 'Rider') {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rider';
  }
  // Use the name as seed for consistent avatar
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
};

// Get user-specific profile image key
const getProfileImageKey = () => {
  try {
    const userData = getJSONCookie('user_data');
    if (userData) {
      const userId = userData.id || userData._id || userData.email;
      if (userId) {
        return `profile_image_${userId}`;
      }
    }
  } catch (e) {
    console.error('[RiderLayout] Error getting user ID:', e);
  }
  return 'profile_image'; // fallback
};

const RiderLayout = ({ children }) => {
  const [profileImage, setProfileImage] = useState(() => {
    const imageKey = getProfileImageKey();
    const cachedImage = getCookie(imageKey);
    if (cachedImage && !cachedImage.includes('dicebear') && !cachedImage.includes('profileimage.svg')) {
      // User has uploaded a custom image
      return cachedImage;
    }
    // Generate mock avatar based on user name
    const cachedUserData = getJSONCookie('user_data');
    if (cachedUserData) {
      try {
        const name = cachedUserData.fullName || `${cachedUserData.firstName || ''} ${cachedUserData.lastName || ''}`.trim();
        return generateMockAvatar(name);
      } catch (e) {
        return generateMockAvatar('Rider');
      }
    }
    return generateMockAvatar('Rider');
  });
  const [userName, setUserName] = useState('Rider');
  const [isOnline, setIsOnline] = useState(true);

  // Keep a simple cookie copy of the profile image so mobile sidebar can read the same image key
  useEffect(() => {
    try {
      if (profileImage) setCookie('profile_image', profileImage, 7);
    } catch (e) {
      // ignore
    }
  }, [profileImage]);

  useEffect(() => {
    fetchUserProfile();

    // Listen for profile updates
    const handleProfileUpdate = (event) => {
      console.log('[RiderLayout] Profile updated event received:', event.detail);
      if (event.detail?.profileImage || event.detail?.profilePhoto) {
        const newImage = event.detail.profileImage || event.detail.profilePhoto;
        console.log('[RiderLayout] Updating profile image to:', newImage);
        setProfileImage(newImage);
        const imageKey = getProfileImageKey();
        setCookie(imageKey, newImage, 7);
        console.log('[RiderLayout] Profile image state updated and saved to cookies');
      }
      if (event.detail?.fullName || event.detail?.firstName) {
        const name = event.detail.fullName || `${event.detail.firstName || ''} ${event.detail.lastName || ''}`.trim();
        setUserName(name || 'Rider');
      }
    };

    const handleVerificationComplete = (event) => {
      console.log('[RiderLayout] Verification completed, refreshing profile');
      fetchUserProfile();
    };

    window.addEventListener('profile:updated', handleProfileUpdate);
    window.addEventListener('verification:completed', handleVerificationComplete);

    return () => {
      window.removeEventListener('profile:updated', handleProfileUpdate);
      window.removeEventListener('verification:completed', handleVerificationComplete);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Load cached profile image immediately
      const imageKey = getProfileImageKey();
      const cachedImage = getCookie(imageKey);
      if (cachedImage) {
        setProfileImage(cachedImage);
      }
      
      const response = await getRiderProfile();
      const profile = response?.data?.driver || response?.driver || response?.data;
      
      if (profile) {
        // Update profile image from API
        if (profile.profilePhoto && !profile.profilePhoto.includes('dicebear')) {
          // User has a custom uploaded image
          setProfileImage(profile.profilePhoto);
          setCookie(imageKey, profile.profilePhoto, 7);
        } else if (!cachedImage || cachedImage.includes('dicebear') || cachedImage.includes('profileimage.svg')) {
          // No custom image, generate mock avatar based on name
          const name = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
          if (name) {
            const mockAvatar = generateMockAvatar(name);
            setProfileImage(mockAvatar);
          }
        }
        
        // Update user name
        const name = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        if (name) {
          setUserName(name);
        }
        
        console.log('[RiderLayout] Profile loaded:', { name, hasPhoto: !!profile.profilePhoto });
      }
    } catch (error) {
      console.error('[RiderLayout] Failed to fetch profile:', error);
      // Fallback to cookies
      const userData = getJSONCookie('user_data');
      if (userData) {
        try {
          const name = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          if (name) setUserName(name);
        } catch (e) {
          console.error('[RiderLayout] Failed to parse user data:', e);
        }
      }
    }
  };

  const handleAvailabilityToggle = () => {
    setIsOnline(!isOnline);
    // TODO: Call updateRiderAvailability API
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5] overflow-hidden">
      <RiderSidebar />
      <div className="md:ml-64 ml-0 flex-1 flex flex-col min-h-0 bricolage-font bg-white">
        {/* Mobile Header (visible on small screens) */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50">
          <div className="bg-transparent backdrop-blur-sm border-b border-gray-200 py-4">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center">
                <YummyText className="text-3xl font-semibold text-[#0F172A]">
                  Swiftly
                </YummyText>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="w-10 h-10 rounded-full ring-2 ring-[#00D68F] overflow-hidden flex items-center justify-center"
                  aria-label="Profile"
                >
                  <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
                </button>

                <button
                  className="p-2 flex flex-col gap-1 justify-center"
                  aria-label="menu"
                  onClick={() => window.dispatchEvent(new CustomEvent('rider:toggleMobileSidebar'))}
                >
                  <span className="block w-8 h-1 bg-[#111827] rounded"></span>
                  <span className="block w-8 h-1 bg-[#111827] rounded"></span>
                  <span className="block w-8 h-1 bg-[#111827] rounded"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Header - visible on md+ screens (sticky inside scroll area) */}
        <div className="hidden md:block fixed top-0 left-0 right-0 z-40">
          <div className="bg-white border-b border-gray-200 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Left: logo + title */}
              <div className="flex items-center gap-3 ml-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#00D68F] to-[#00B876] rounded-lg flex items-center justify-center">
                  <img src="/vanicon-white.svg" alt="truck" width={20} height={20} />
                </div>
                <YummyText className="text-lg font-medium text-[#0F172A]">
                  Rider Dashboard
                </YummyText>
              </div>

              {/* Right: actions */}
              <div className="flex items-center justify-end gap-4 pr-6">
                <div className="flex items-center gap-4 bg-[#F3F4F6] p-3 px-5 rounded-full shadow-sm">
                  <YummyText className="text-sm text-[#0A0A0A]">{isOnline ? 'Online' : 'Offline'}</YummyText>
                  <label className="relative inline-block w-11 h-6">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isOnline}
                      onChange={handleAvailabilityToggle}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D68F]"></div>
                  </label>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#00D68F]' : 'bg-gray-400'}`}></div>
                </div>

                <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#64748B"/>
                  </svg>
                  <span className="absolute top-1 right-2 w-2 h-2 bg-[#FF6B00] rounded-full"></span>
                </button>

                <button className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B876] flex items-center justify-center overflow-hidden">
                  <img 
                    src={profileImage} 
                    alt={userName} 
                    className="w-full h-full object-cover" 
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content (header is sticky inside the scrollable area).
            The main scroll container is the parent so the scrollbar starts at the top.
        */}
          <div className="flex-1 md:p-8 pt-16 md:pt-24 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default RiderLayout;