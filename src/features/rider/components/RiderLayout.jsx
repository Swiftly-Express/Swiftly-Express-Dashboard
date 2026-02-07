import React, { useState, useEffect } from 'react';
import RiderSidebar from './RiderSidebar';
import { YummyText } from '../../../components/YummyText';
import {
  getRiderProfile,
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateRiderAvailability,
  getAvailableJobs
} from '../../../utils/authApi';
import { getCookie, setCookie, getJSONCookie } from '../../../utils/cookies';

// Notification read IDs persistence
const NOTIF_READ_COOKIE = 'rider_read_notifications';
const getReadNotifIds = () => {
  try {
    const val = getCookie(NOTIF_READ_COOKIE);
    if (!val) return [];
    return JSON.parse(val);
  } catch (e) {
    return [];
  }
};
const setReadNotifIds = (ids) => {
  try {
    setCookie(NOTIF_READ_COOKIE, JSON.stringify(ids), 7);
  } catch (e) { }
};

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
  // Persist online state in cookie, default to true if not set
  const [isOnline, setIsOnline] = useState(() => {
    const cookieVal = getCookie('rider_is_online');
    if (cookieVal === 'false') return false;
    return true;
  });
  // Helper to sync online state to backend and admin
  const syncOnlineStateToBackend = async (active) => {
    try {
      let payload = { isActive: !!active };
      // If going online, try to get location
      if (active && navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
          });
          payload.currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch (e) {
          // ignore location error
        }
      }
      await updateRiderAvailability(payload);
      // Optionally, fetch jobs and dispatch events as in toggle
      try {
        const jobsResp = await getAvailableJobs(1, 20);
        const jobs = jobsResp?.data?.jobs || jobsResp?.jobs || jobsResp?.data || [];
        window.dispatchEvent(new CustomEvent('rider:availabilityChanged', { detail: { isActive: !!active, location: payload.currentLocation || null, jobs } }));
        window.dispatchEvent(new CustomEvent('deliveries:refresh'));
      } catch (e) {
        window.dispatchEvent(new CustomEvent('rider:availabilityChanged', { detail: { isActive: !!active, location: payload.currentLocation || null } }));
        window.dispatchEvent(new CustomEvent('deliveries:refresh'));
      }
      setCookie('rider_is_online', active ? 'true' : 'false', 1);
    } catch (err) {
      // fallback: revert UI
      setIsOnline(!active);
    }
  };

  const fetchNotifications = async (page = 1, append = false) => {
    try {
      setLoadingNotifications(true);
      const response = await getNotifications(page, 20);
      const data = response?.data || response;
      const notificationsList = data?.notifications || data?.data || [];
      const totalPages = data?.totalPages || data?.pages || 1;

      // Merge read state from local cookie into the notifications
      const merged = notificationsList.map(n => {
        const id = n._id || n.id;
        const locallyRead = readNotifIds.includes(id);
        return { ...n, isRead: (n.isRead || n.read) || locallyRead, read: (n.isRead || n.read) || locallyRead };
      });

      if (append) {
        setNotifications(prev => [...prev, ...merged]);
      } else {
        setNotifications(merged);
      }

      setHasMoreNotifications(page < totalPages);
      setNotificationPage(page);
    } catch (error) {
      console.error('[RiderLayout] Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readNotifIds, setReadNotifIdsState] = useState(() => getReadNotifIds());
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPage, setNotificationPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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
    checkNotifications();

    // On mount, restore online state from cookie
    const cookieVal = getCookie('rider_is_online');
    if (cookieVal === 'false') {
      setIsOnline(false);
    } else {
      setIsOnline(true);
    }

    // On login, always set online and sync to backend
    const handleLogin = () => {
      setIsOnline(true);
      syncOnlineStateToBackend(true);
    };
    // On logout, set offline and sync to backend
    const handleLogout = () => {
      setIsOnline(false);
      syncOnlineStateToBackend(false);
    };

    window.addEventListener('user:login', handleLogin);
    window.addEventListener('user:logout', handleLogout);

    // Poll notification count every 30 seconds
    const notificationInterval = setInterval(() => {
      checkNotifications();
    }, 30000);

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
      // Also refresh notifications/count
      checkNotifications();
    };

    // Listen for delivery status changes to check for new notifications
    const handleDeliveryUpdated = () => {
      checkNotifications();
    };

    const handleOrderAvailable = () => {
      checkNotifications();
    };

    const handleEarningsUpdated = () => {
      checkNotifications();
    };

    window.addEventListener('profile:updated', handleProfileUpdate);
    window.addEventListener('verification:completed', handleVerificationComplete);
    window.addEventListener('delivery:updated', handleDeliveryUpdated);
    window.addEventListener('delivery:accepted', handleDeliveryUpdated);
    window.addEventListener('delivery:completed', handleDeliveryUpdated);
    window.addEventListener('order:available', handleOrderAvailable);
    window.addEventListener('earnings:updated', handleEarningsUpdated);
    window.addEventListener('payout:scheduled', handleEarningsUpdated);

    return () => {
      window.removeEventListener('user:login', handleLogin);
      window.removeEventListener('user:logout', handleLogout);
      window.removeEventListener('profile:updated', handleProfileUpdate);
      window.removeEventListener('verification:completed', handleVerificationComplete);
      window.removeEventListener('delivery:updated', handleDeliveryUpdated);
      window.removeEventListener('delivery:accepted', handleDeliveryUpdated);
      window.removeEventListener('delivery:completed', handleDeliveryUpdated);
      window.removeEventListener('order:available', handleOrderAvailable);
      window.removeEventListener('earnings:updated', handleEarningsUpdated);
      window.removeEventListener('payout:scheduled', handleEarningsUpdated);
      clearInterval(notificationInterval);
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

  const checkNotifications = async () => {
    try {
      // Prefer fetching a page of notifications so we can exclude IDs we've already marked locally
      const resp = await getNotifications(1, 100);
      const list = resp?.data?.notifications || resp?.notifications || resp?.data || [];
      const unread = list.filter(n => {
        const id = n._id || n.id;
        const alreadyRead = (n.isRead || n.read) || readNotifIds.includes(id);
        return !alreadyRead;
      }).length;
      setUnreadCount(unread);
    } catch (error) {
      // Fallback to count endpoint and subtract locally stored read IDs
      try {
        const countResponse = await getUnreadNotificationCount();
        const count = countResponse?.data?.count || countResponse?.count || 0;
        const adjusted = Math.max(0, count - (readNotifIds?.length || 0));
        setUnreadCount(adjusted);
      } catch (err) {
        console.error('[RiderLayout] Failed to fetch notification count:', err);
      }
    }
  };

  const handleAvailabilityToggle = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    syncOnlineStateToBackend(newState);
  };


  const toggleNotifications = async () => {
    const newState = !showNotifications;
    setShowNotifications(newState);

    if (newState) {
      // Opening notification - fetch them
      await fetchNotifications(1, false);

      // Update state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);

      // Persist read IDs for current notifications (fetch fresh list to be safe)
      try {
        const resp = await getNotifications(1, 100);
        const list = resp?.data?.notifications || resp?.notifications || resp?.data || [];
        const ids = list.map(n => n._id || n.id).filter(Boolean);
        setReadNotifIds(ids);
        setReadNotifIdsState(ids);
      } catch (e) {
        // fallback: preserve existing
      }

      (async () => {
        try {
          await markAllNotificationsAsRead();

        } catch (err) {
          console.warn('[RiderLayout] Failed to mark notifications as read:', err);
        }

        setTimeout(async () => {
          try {
            await fetchNotifications(1, false);
            await checkNotifications();
          } catch (e) {
            console.warn('[RiderLayout] Refresh after toggle mark-all failed:', e);
          }
        }, 300);
      })();
    }
  };


  const handleMarkAllAsRead = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      console.log('[RiderLayout] Marking all notifications as read...');
      await markAllNotificationsAsRead();

      // Update UI
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);

      // Persist read IDs in cookie/state
      const allIds = notifications.map(n => n._id || n.id).filter(Boolean);
      setReadNotifIds(allIds);
      setReadNotifIdsState(allIds);

      console.log('[RiderLayout] All notifications marked as read successfully');
    } catch (error) {
      console.error('[RiderLayout] Failed to mark all as read:', error);
      console.error('[RiderLayout] Error details:', error.response?.data || error.message);
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      console.log('[RiderLayout] Marking notification as read:', notificationId);
      const response = await markNotificationAsRead(notificationId);
      console.log('[RiderLayout] Mark as read response:', response);

      // Update local state
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId || n.id === notificationId) ? { ...n, isRead: true, read: true } : n)
      );
      // Add to read IDs in cookie/state
      setReadNotifIdsState(prev => {
        const newIds = prev.includes(notificationId) ? prev : [...prev, notificationId];
        try { setReadNotifIds(newIds); } catch (e) { }
        return newIds;
      });

      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      console.log('[RiderLayout] Notification marked as read successfully');
    } catch (error) {
      console.error('[RiderLayout] Failed to mark as read:', error);
      console.error('[RiderLayout] Error details:', error.response?.data || error.message);
    }
  };

  const loadMoreNotifications = () => {
    if (!loadingNotifications && hasMoreNotifications) {
      fetchNotifications(notificationPage + 1, true);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      <RiderSidebar />
      <div className="md:ml-64 ml-0 flex-1 flex flex-col min-h-0 bricolage-font bg-white">
        {/* Mobile Header (visible on small screens) - match Admin compact header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50">
          <div className="bg-transparent backdrop-blur-sm border-b border-gray-200 h-14">
            <div className="flex items-center justify-between h-full">
              {/* Left: logo + title */}
              <div className="flex items-center gap-1 ml-0.5">
                <img src="/swiftly-logo.svg" alt="Swiftly" className="h-28 object-contain" />
                <YummyText className="text-xs text-[#0F172A] border border-[#00B75A] rounded-full px-2 py-0.5">Rider</YummyText>
              </div>

              {/* Right: actions (preserve rider controls) */}
              <div className="flex items-center justify-end gap-4 pr-6">
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Notifications"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#64748B" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#FF6B00] text-white text-[10px] rounded-full flex items-center justify-center font-medium px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <button
                  title="View Profile"
                  aria-label="View Profile"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B876] flex items-center justify-center overflow-hidden cursor-pointer"
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
          <div className="bg-white border-b border-gray-200 h-16 shadow-sm">
            <div className="flex items-center justify-between h-full">
              {/* Left: logo + title (match Admin layout) */}
              <div className="flex items-center gap-1 ml-4">
                <img src="/swiftly-logo.svg" alt="Swiftly" className="h-28 object-contain" />
                <YummyText className="text-xs text-[#0F172A] border border-[#00B75A] rounded-full px-2 py-0.5">Rider</YummyText>
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

                <button onClick={toggleNotifications} className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#64748B" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#FF6B00] text-white text-[10px] rounded-full flex items-center justify-center font-medium px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <button className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B876] flex items-center justify-center overflow-hidden">
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

        {/* Notification Dropdown */}
        {showNotifications && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setShowNotifications(false)} />
            <div className="fixed top-16 md:top-20 right-4 md:right-8 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] max-h-[500px] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <YummyText className="text-lg font-semibold text-[#0F172A]">Notifications</YummyText>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="text-xs text-[#00B75A] hover:text-[#00a352] font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {loadingNotifications && notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D68F] mx-auto mb-3"></div>
                    <YummyText className="text-sm text-gray-400">Loading notifications...</YummyText>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3 opacity-50">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                    </svg>
                    <YummyText className="text-sm">No notifications yet</YummyText>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100">
                      {notifications.map(notification => {
                        const notifId = notification._id || notification.id;
                        const isRead = (notification.isRead || notification.read) || readNotifIds.includes(notifId);
                        const notifType = notification.type || 'info';
                        const title = notification.title || notification.message?.substring(0, 50) || 'Notification';
                        const message = notification.message || notification.body || '';
                        const timestamp = notification.createdAt || notification.timestamp || new Date().toISOString();

                        // Icon based on type
                        const getIcon = () => {
                          if (notifType === 'order' || notifType === 'available_order') return '📋';
                          if (notifType === 'delivery' || notifType === 'active_delivery') return '📦';
                          if (notifType === 'earning' || notifType === 'earnings') return '💰';
                          if (notifType === 'payout') return '💵';
                          if (notifType === 'payment') return '💳';
                          if (notifType === 'warning' || notifType === 'alert') return '⚠️';
                          if (notifType === 'success') return '✅';
                          if (notifType === 'verification') return '🔐';
                          return '🔔';
                        };

                        const getBgColor = () => {
                          if (notifType === 'order' || notifType === 'available_order') return 'bg-indigo-100';
                          if (notifType === 'delivery' || notifType === 'active_delivery') return 'bg-blue-100';
                          if (notifType === 'earning' || notifType === 'earnings') return 'bg-green-100';
                          if (notifType === 'payout') return 'bg-emerald-100';
                          if (notifType === 'payment') return 'bg-teal-100';
                          if (notifType === 'warning' || notifType === 'alert') return 'bg-amber-100';
                          if (notifType === 'success') return 'bg-lime-100';
                          if (notifType === 'verification') return 'bg-purple-100';
                          return 'bg-gray-100';
                        };

                        return (
                          <div
                            key={notifId}
                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!isRead ? 'bg-blue-50' : ''}`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isRead) {
                                handleMarkAsRead(notifId, e);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor()}`}>
                                <span className="text-lg">{getIcon()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <YummyText className="font-medium text-[#0F172A] text-sm">{title}</YummyText>
                                  {!isRead && (
                                    <div className="w-2 h-2 bg-[#00B75A] rounded-full flex-shrink-0 mt-1"></div>
                                  )}
                                </div>
                                <YummyText className="text-xs text-[#64748B] leading-relaxed line-clamp-2">{message}</YummyText>
                                <YummyText className="text-xs text-gray-400 mt-2">
                                  {new Date(timestamp).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </YummyText>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {hasMoreNotifications && (
                      <div className="p-3 border-t border-gray-100">
                        <button
                          onClick={loadMoreNotifications}
                          disabled={loadingNotifications}
                          className="w-full py-2 text-sm text-[#00B75A] hover:text-[#00a352] font-medium transition-colors disabled:opacity-50"
                        >
                          {loadingNotifications ? 'Loading...' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RiderLayout;