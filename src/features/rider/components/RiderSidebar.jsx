import { useLocation } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';
import { YummyText } from '../../../components/YummyText';
import { logout as apiLogout } from '../../../utils/authApi';
import { getCookie, deleteCookie } from '../../../utils/cookies';
import React, { useEffect, useState } from 'react';

const SidebarButton = ({ to, active, icon, label, count }) => {
  const router = useIonRouter();
  
  const handleClick = (e) => {
    e.preventDefault();
    if (document && document.activeElement) document.activeElement.blur();
    router.push(to, 'forward', 'push');
    // close mobile panel if open
    try {
      window.dispatchEvent(new CustomEvent('rider:closeMobileSidebar'));
    } catch (e) {}
  };
  
  return (
    <button onClick={handleClick} className="w-full text-left">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full ${
          active ? 'bg-[#00B75A] text-white' : 'text-[#64748B] hover:bg-gray-50'
        }`}
      >
        <img src={icon} alt={label} className="w-5 h-5" style={{ filter: active ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
        <YummyText className="flex-1 text-left text-[15px]">{label}</YummyText>
        {count !== undefined && (
          <span className="bg-[#FF6B00] text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[24px] text-center">
            {count}
          </span>
        )}
      </div>
    </button>
  );
};

const RiderSidebar = () => {
  const router = useIonRouter();
  const location = useLocation();
  
  const handleLogout = () => {
    (async () => {
      try {
        const refreshToken = getCookie('refresh_token') || '';
        if (refreshToken) await apiLogout({ refreshToken });
      } catch (err) {
        console.error('Logout API failed', err);
      } finally {
        // Note: apiLogout already clears cookies, but let's ensure they're all cleared
        deleteCookie('auth_token');
        deleteCookie('rider_token');
        deleteCookie('customer_token');
        deleteCookie('refresh_token');
        deleteCookie('rider_refresh_token');
        deleteCookie('customer_refresh_token');
        deleteCookie('user_type');
        deleteCookie('user_data');
        deleteCookie('userRole');
        if (document && document.activeElement) document.activeElement.blur();
        router.push('/auth/rider/login', 'back', 'pop');
      }
    })();
  };

  const menuItems = [
    {
      id: 'dashboard',
      to: '/rider/dashboard',
      icon: '/dashboard-icon.svg',
      label: 'Dashboard',
    },
    {
      id: 'available',
      to: '/rider/available',
      icon: '/blockicon.svg',
      label: 'Available Orders',
      count: 5,
    },
    {
      id: 'active',
      to: '/rider/active',
      icon: '/locationicon.svg',
      label: 'Active Deliveries',
    },
    {
      id: 'earnings',
      to: '/rider/earnings',
      icon: '/dollar-icon.svg',
      label: 'Earnings',
    },
    {
      id: 'profile',
      to: '/rider/profile',
      icon: '/profileicon.svg',
      label: 'Profile',
    },
    {
      id: 'support',
      to: '/rider/support',
      icon: '/supporticon.svg',
      label: 'Support',
    },
  ];

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setMobileOpen((s) => !s);
    const close = () => setMobileOpen(false);
    window.addEventListener('rider:toggleMobileSidebar', toggle);
    window.addEventListener('rider:closeMobileSidebar', close);
    // cleanup
    return () => {
      window.removeEventListener('rider:toggleMobileSidebar', toggle);
      window.removeEventListener('rider:closeMobileSidebar', close);
    };
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Desktop sidebar (hidden on small screens) */}
      <div className="hidden md:flex w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-300 shadow-sm flex-col pt-20">
      {/* Menu Items */}
      <div className="px-3 py-4 space-y-1 flex-1">
        {menuItems.map((item) => (
          <SidebarButton
            key={item.id}
            to={item.to}
            active={location.pathname === item.to}
            icon={item.icon}
            label={item.label}
            count={item.count}
          />
        ))}
      </div>

      {/* Logout Button */}
      <div className="px-6 py-6 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-[#EF4444] hover:bg-red-50 transition-colors w-full px-3 py-2 rounded-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
          </svg>
          <YummyText className="text-[15px]">Logout</YummyText>
        </button>
      </div>
      </div>

      {/* Mobile sidebar panel (overlay) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0" style={{ zIndex: 99999 }}>
          <div className="absolute inset-0 bg-black/30" onClick={closeMobile} />
          <div className="relative inset-0 w-full h-full bg-white shadow-xl p-5 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <YummyText className="text-lg font-medium">Swiftly</YummyText>
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-full ring-2 ring-[#00D68F] overflow-hidden flex items-center justify-center">
                  <img src={getCookie('profile_image') || '/vanicon-white.svg'} alt="profile" className="w-full h-full object-cover" />
                </button>
                <button onClick={closeMobile} aria-label="Close" className="p-2">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.preventDefault();
                    if (document && document.activeElement) document.activeElement.blur();
                    router.push(item.to, 'forward', 'push');
                    closeMobile();
                  }}
                  className={`w-full text-left`}
                >
                  <div
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors w-full ${
                      location.pathname === item.to ? 'bg-[#00B75A] text-white' : 'text-[#64748B] hover:bg-gray-50'
                    }`}
                  >
                    <img src={item.icon} alt={item.label} className="w-5 h-5" style={{ filter: location.pathname === item.to ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
                    <YummyText className="flex-1 text-left text-[15px]">{item.label}</YummyText>
                    {item.count !== undefined && (
                      <span className="bg-[#FF6B00] text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[24px] text-center">
                        {item.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-[#64748B]">Online</div>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D68F]"></div>
                </label>
              </div>

              <div>
                <button onClick={() => { closeMobile(); (async () => { try { const refreshToken = getCookie('refresh_token') || ''; if (refreshToken) await apiLogout({ refreshToken }); } catch (err) { console.error('Logout API failed', err); } finally { deleteCookie('auth_token'); deleteCookie('rider_token'); deleteCookie('customer_token'); deleteCookie('refresh_token'); deleteCookie('rider_refresh_token'); deleteCookie('customer_refresh_token'); deleteCookie('user_type'); deleteCookie('user_data'); deleteCookie('userRole'); window.location.href = '/auth/rider/login'; } })(); }} className="w-full flex items-center gap-3 text-[#EF4444] hover:bg-red-50 transition-colors px-3 py-2 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
                  </svg>
                  <YummyText className="text-[15px]">Logout</YummyText>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RiderSidebar;