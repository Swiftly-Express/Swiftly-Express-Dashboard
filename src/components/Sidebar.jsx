import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { YummyText } from './YummyText';

const SidebarButton = ({ to, active, icon, label, count }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
      active
        ? 'bg-[#00D68F] text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <img src={icon} alt="" className="w-5 h-5" />
    <YummyText className="flex-1">{label}</YummyText>
    {count !== undefined && (
      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
        {count}
      </span>
    )}
  </Link>
);

const Sidebar = ({ role = 'customer' }) => {
  const location = useLocation();
  const pathName = location.pathname;

  const riderMenuItems = [
    { to: '/rider/dashboard', icon: '/dashboard.svg', label: 'Dashboard' },
    { to: '/rider/available-orders', icon: '/orders.svg', label: 'Available Orders', count: 5 },
    { to: '/rider/active-delivery', icon: '/delivery.svg', label: 'Active Delivery' },
    { to: '/rider/earnings', icon: '/earnings.svg', label: 'Earnings' },
    { to: '/rider/profile', icon: '/profile.svg', label: 'Profile' },
    { to: '/rider/support', icon: '/support.svg', label: 'Support' },
  ];

  const customerMenuItems = [
    { to: '/customer/dashboard', icon: '/dashboard.svg', label: 'Dashboard' },
    { to: '/customer/track', icon: '/track.svg', label: 'Track' },
    { to: '/customer/deliveries', icon: '/delivery.svg', label: 'My Deliveries' },
    { to: '/customer/book', icon: '/book.svg', label: 'Book' },
    { to: '/customer/profile', icon: '/profile.svg', label: 'Profile' },
    { to: '/customer/support', icon: '/support.svg', label: 'Support' },
  ];

  const menuItems = role === 'rider' ? riderMenuItems : customerMenuItems;

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-200">
      {/* Logo */}
      <div className="p-6">
        <YummyText className="text-2xl font-medium text-black">Swiftly</YummyText>
      </div>

      {/* Menu Items */}
      <div className="px-3 space-y-1">
        {menuItems.map((item) => (
          <SidebarButton
            key={item.to}
            to={item.to}
            active={pathName === item.to}
            icon={item.icon}
            label={item.label}
            count={item.count}
          />
        ))}
      </div>

      {/* Logout Button */}
      <div className="absolute bottom-8 px-6 w-full">
        <button
          onClick={() => {/* Handle logout */}}
          className="flex items-center gap-3 text-gray-600 hover:text-red-500 transition-colors w-full"
        >
          <img src="/logout.svg" alt="" className="w-5 h-5" />
          <YummyText>Logout</YummyText>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;