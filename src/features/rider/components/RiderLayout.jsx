import React, { useState, useEffect } from 'react';
import RiderSidebar from './RiderSidebar';
import { YummyText } from '../../../components/YummyText';
import { getRiderProfile } from '../../../utils/authApi';

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
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      const userId = user.id || user._id || user.email;
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
    const cachedImage = localStorage.getItem(imageKey);
    if (cachedImage && !cachedImage.includes('dicebear') && !cachedImage.includes('profileimage.svg')) {
      // User has uploaded a custom image
      return cachedImage;
    }
    // Generate mock avatar based on user name
    const cachedUserData = localStorage.getItem('user_data');
    if (cachedUserData) {
      try {
        const user = JSON.parse(cachedUserData);
        const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return generateMockAvatar(name);
      } catch (e) {
        return generateMockAvatar('Rider');
      }
    }
    return generateMockAvatar('Rider');
  });
  const [userName, setUserName] = useState('Rider');
  const [isOnline, setIsOnline] = useState(true);

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
        localStorage.setItem(imageKey, newImage);
        console.log('[RiderLayout] Profile image state updated and saved to localStorage');
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
      const cachedImage = localStorage.getItem(imageKey);
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
          localStorage.setItem(imageKey, profile.profilePhoto);
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
      // Fallback to localStorage
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
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
    <div className="flex h-screen bg-[#f5f5f5]">
      <RiderSidebar />
      <div className="ml-64 flex-1 flex flex-col min-h-0 bricolage-font bg-white">
        {/* Fixed Top Header - positioned to respect sidebar width (ml-64) */}
        <div className="fixed top-0 left-0 right-0 z-40">
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

        {/* Main Content (header has fixed position).
            Allow page scrolling but hide the visible scrollbar using a utility class.
            Inner sections (with their own overflow-y-auto) will still show scrollbars.
        */}
        <div className="flex-1 p-8 pt-24 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default RiderLayout;
