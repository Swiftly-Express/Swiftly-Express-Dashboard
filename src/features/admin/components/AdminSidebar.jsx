import { useLocation } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';
import { YummyText } from '../../../components/YummyText';
import { logout as apiLogout } from '../../../utils/authApi';
import React from 'react';
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
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full ${
          active ? 'bg-[#00A63E] text-white' : 'text-[#4B5563] hover:bg-gray-50'
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

  const handleLogout = () => {
    (async () => {
      try {
        const refreshToken = localStorage.getItem('refresh_token') || '';
        if (refreshToken) await apiLogout({ refreshToken });
      } catch (err) {
        console.error('Logout API failed', err);
      } finally {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_data');
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
    <div className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-300 shadow-sm flex flex-col pt-20">
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
  );
};

export default AdminSidebar;
