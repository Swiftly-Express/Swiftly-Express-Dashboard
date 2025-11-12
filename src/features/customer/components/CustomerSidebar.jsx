import React from 'react';
import { useLocation } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';

const SidebarButton = ({ icon, label, path, isActive }) => {
  const router = useIonRouter();

  const handleClick = () => {
    if (document.activeElement) {
      document.activeElement.blur();
    }
    router.push(path, 'forward', 'push');
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
        isActive
          ? 'bg-[#00D68F] bg-opacity-10 text-[#00D68F] font-medium'
          : 'text-[#64748B] hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
};

const CustomerSidebar = () => {
  const location = useLocation();
  const router = useIonRouter();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_data');
    router.push('/auth/role-select', 'back', 'pop');
  };

  const menuItems = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
        </svg>
      ),
      label: 'Dashboard',
      path: '/customer/dashboard'
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="currentColor"/>
        </svg>
      ),
      label: 'New Delivery',
      path: '/customer/new-delivery'
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="currentColor"/>
        </svg>
      ),
      label: 'Active Deliveries',
      path: '/customer/active'
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" fill="currentColor"/>
        </svg>
      ),
      label: 'Delivery History',
      path: '/customer/history'
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
        </svg>
      ),
      label: 'Profile',
      path: '/customer/profile'
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM13 14h-2v-2h2v2zm0-4h-2V6h2v4z" fill="currentColor"/>
        </svg>
      ),
      label: 'Support',
      path: '/customer/support'
    }
  ];

  return (
    <div className="fixed left-0 top-24 h-[calc(100vh-6rem)] w-64 bg-white border-r border-gray-100 flex flex-col">
      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <SidebarButton
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
          />
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-6 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
          </svg>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default CustomerSidebar;
