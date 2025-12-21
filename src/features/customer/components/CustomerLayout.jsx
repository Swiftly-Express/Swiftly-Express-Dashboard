import React, { useEffect, useState } from 'react';
import CustomerSidebar from './CustomerSidebar';
import { YummyText } from '../../../components/YummyText';

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';

const CustomerLayout = ({ children }) => {
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR);

  const loadAvatar = () => {
    try {
      // 1. Check explicit cached profile image
      const cached = localStorage.getItem('profile_image');
      if (cached) {
        setAvatarSrc(cached);
        return;
      }

      // 2. Fallback to user_data object
      const userRaw = localStorage.getItem('user_data');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const img = user?.profileImage || user?.profile_image || user?.avatar || user?.avatarUrl || user?.data?.profileImage || user?.data?.profile_image || user?.user?.profileImage || null;
        if (img) {
          setAvatarSrc(img);
          return;
        }
        // optionally use email/name seed for dicebear
        const seed = (user?.fullName || user?.name || user?.email || 'User').split(' ')[0];
        setAvatarSrc(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`);
        return;
      }

      // Default
      setAvatarSrc(DEFAULT_AVATAR);
    } catch (e) {
      console.warn('[CustomerLayout] Failed to load avatar from storage', e);
      setAvatarSrc(DEFAULT_AVATAR);
    }
  };

  useEffect(() => {
    loadAvatar();
    // Update when profile is updated elsewhere
    window.addEventListener('profile:updated', loadAvatar);
    return () => window.removeEventListener('profile:updated', loadAvatar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-[#f5f5f5] overflow-hidden">
      <CustomerSidebar />
      <div className="md:ml-64 ml-0 flex-1 flex flex-col min-h-0 bricolage-font bg-white">
        {/* Mobile Header (visible on small screens) */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50">
          <div className="bg-transparent backdrop-blur-sm border-b border-gray-200 py-4">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center">
                <YummyText className="text-2xl font-semibold text-[#0F172A]">Swiftly</YummyText>
              </div>

              <div className="flex items-center gap-3">
                <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors" aria-label="Notifications">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#64748B"/>
                  </svg>
                  <span className="absolute top-1 right-1 w-5 h-5 bg-[#FF6B00] text-white text-xs rounded-full flex items-center justify-center font-medium">0</span>
                </button>

                <button onClick={() => (window.location.href = '/customer/profile')} className="w-8 h-8 rounded-full ring-2 ring-[#00D68F] overflow-hidden flex items-center justify-center" aria-label="Profile">
                  <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                </button>

                <button className="p-2 flex flex-col gap-1 justify-center" aria-label="menu" onClick={() => window.dispatchEvent(new CustomEvent('customer:toggleMobileSidebar'))}>
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
                <YummyText className="text-lg font-medium text-[#0F172A]">Customer Dashboard</YummyText>
              </div>

              {/* Right: actions */}
              <div className="flex items-center justify-end gap-4 pr-6">
                <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#64748B"/>
                  </svg>
                  <span className="absolute top-1 right-2 w-2 h-2 bg-[#FF6B00] rounded-full"></span>
                </button>
                <button onClick={() => (window.location.href = '/customer/profile')} title="View Profile" aria-label="View Profile" className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B876] flex items-center justify-center overflow-hidden cursor-pointer">
                  <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content (header has fixed position). */}
        <div className="flex-1 p-8 pt-24 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CustomerLayout;
