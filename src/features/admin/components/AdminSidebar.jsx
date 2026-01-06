import { useLocation } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';
import { YummyText } from '../../../components/YummyText';
import { logout as apiLogout } from '../../../utils/authApi';
import { getCookie, deleteCookie } from '../../../utils/cookies';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import BlockIcon from '../../../icons/Blockicon';
import DashboardIcon from '../../../icons/Dashboardicon';
import PeopleIcon from '../../../icons/Peopleicon';
import KycIcon from '../../../icons/Kycicon';
import AnalyzeIcon from '../../../icons/Analyzeicon';
import SettingsIcon from '../../../icons/Settingsicon';
import ToybikeIcon from '../../../icons/Toybikeicon';

const SidebarButton = ({ to, active, icon, label, count }) => {
  const router = useIonRouter();

  const handleClick = (e) => {
    e.preventDefault();
    if (document && document.activeElement) document.activeElement.blur();
    router.push(to, 'forward', 'push');
  };

  return (
    <button onClick={handleClick} className="w-full text-left">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full ${active ? 'bg-[#00A63E] text-white' : 'text-[#4B5563] hover:bg-gray-50'
          }`}
      >
        {typeof icon === 'string' ? (
          <img src={icon} alt={`${label} icon`} className="w-5 h-5 flex-shrink-0" />
        ) : React.isValidElement(icon) ? (
          React.cloneElement(icon, {
            className: [icon.props.className, `w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-[#101828]'}`]
              .filter(Boolean)
              .join(' '),
          })
        ) : (
          icon
        )}
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


const AdminSidebar = () => {
  const router = useIonRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setMobileOpen((s) => !s);
    const close = () => setMobileOpen(false);
    window.addEventListener('admin:toggleMobileSidebar', toggle);
    window.addEventListener('admin:closeMobileSidebar', close);
    return () => {
      window.removeEventListener('admin:toggleMobileSidebar', toggle);
      window.removeEventListener('admin:closeMobileSidebar', close);
    };
  }, []);

  const handleLogout = () => {
    (async () => {
      try {
        const refreshToken = getCookie('refresh_token') || getCookie('admin_refresh_token') || '';
        if (refreshToken) await apiLogout({ refreshToken });
      } catch (err) {
        console.error('Logout API failed', err);
      } finally {
        deleteCookie('auth_token');
        deleteCookie('admin_token');
        deleteCookie('refresh_token');
        deleteCookie('admin_refresh_token');
        deleteCookie('user_type');
        deleteCookie('user_data');
        deleteCookie('userRole');

        if (document && document.activeElement) document.activeElement.blur();
        router.push('/auth/admin/login', 'back', 'pop');
      }
    })();
  };

  const menuItems = [
    {
      id: 'dashboard',
      to: '/admin/dashboard',
      icon: <DashboardIcon />,
      label: 'Dashboard',
    },
    {
      id: 'manage-users',
      to: '/admin/users',
      icon: <PeopleIcon />,
      label: 'Manage Users',
    },
    {
      id: 'manage-riders',
      to: '/admin/riders',
      icon: <ToybikeIcon />,
      label: 'Manage Riders',
    },
    {
      id: 'manage-orders',
      to: '/admin/orders',
      icon: <BlockIcon />,
      label: 'Manage Orders',
      count: 12,
    },
    {
      id: 'kyc-approvals',
      to: '/admin/kyc',
      icon: <KycIcon />,
      label: 'KYC Approvals',
      count: 5,
    },
    {
      id: 'analytics',
      to: '/admin/analytics',
      icon: <AnalyzeIcon />,
      label: 'Analytics',
    },
    {
      id: 'settings',
      to: '/admin/settings',
      icon: <SettingsIcon />,
      label: 'Settings',
    },
  ];

  const location = useLocation();

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-300 shadow-sm flex flex-col pt-4">
      {/* Top Branding */}
      <div className="px-4 py-8 flex items-center gap-3">
        {/* <div className="flex flex-col items-start">
          <img src="/swiftly-logo.svg" alt="Swiftly" className="h-10 object-contain" />
          <YummyText className="text-xs text-[#64748B] mt-1">Admin</YummyText>
        </div> */}
      </div>
      {/* Menu Items */}
      <div className="px-3 py-2 space-y-1 flex-1 mt-2">
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
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor" />
          </svg>
          <YummyText className="text-[15px]">Logout</YummyText>
        </button>
      </div>
      {/* Mobile sidebar panel (overlay) rendered into document.body to escape stacking contexts */}
      {mobileOpen && ReactDOM.createPortal(
        <div className="md:hidden fixed inset-0" style={{ zIndex: 9999999 }}>
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="relative inset-0 w-full h-full bg-white shadow-xl p-5 overflow-auto">
            <div className="flex items-center justify-between mb-6 h-12">
              <div className="flex items-center gap-1 -ml-2.5">
                <img src="/swiftly-logo.svg" alt="Swiftly" className="h-28 object-contain" />
                <YummyText className="text-xs text-[#0F172A] border border-[#00B75A] rounded-full px-2 py-0.5">Admin</YummyText>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileOpen(false)} aria-label="Close" className="p-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left`}
                >
                  <div
                    className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-colors w-full ${location.pathname === item.to ? 'bg-[#00A63E] text-white' : 'text-[#64748B] hover:bg-gray-50'
                      }`}
                  >
                    {typeof item.icon === 'string' ? (
                      <img src={item.icon} alt={`${item.label} icon`} className="w-7 h-7" />
                    ) : (
                      item.icon
                    )}
                    <YummyText className="flex-1 text-left text-[20px] font-medium">{item.label}</YummyText>
                    {item.count !== undefined && (
                      <span className="bg-[#FF6B00] text-white text-sm font-medium px-2.5 py-1 rounded-full min-w-[28px] text-center">{item.count}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-base font-medium text-[#64748B]">Notifications</div>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D68F]"></div>
                </label>
              </div>

              <div>
                <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="w-full flex items-center gap-4 text-[#EF4444] hover:bg-red-50 transition-colors px-4 py-3 rounded-lg">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor" />
                  </svg>
                  <YummyText className="text-[20px] font-medium">Logout</YummyText>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminSidebar;
