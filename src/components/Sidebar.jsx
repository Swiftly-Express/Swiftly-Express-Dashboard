import { useLocation } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';
import { YummyText } from './YummyText';
import React from 'react';

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
          active ? 'bg-[#00B75A] text-white' : 'text-[#64748B] hover:bg-gray-50'
        }`}
      >
        <img src={icon} alt={label} className="w-5 h-5" style={{ filter: active ? 'brightness(0) invert(1)' : 'none' }} />
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

const Sidebar = () => {
  const menuItems = [
    {
      id: 'dashboard',
      to: '/rider/dashboard',
      icon: '/icons/dashboard.svg',
      label: 'Dashboard',
    },
    {
      id: 'available',
      to: '/rider/available',
      icon: '/icons/orders.svg',
      label: 'Available Orders',
      count: 5,
    },
    {
      id: 'active',
      to: '/rider/active',
      icon: '/icons/delivery.svg',
      label: 'Active Deliveries',
    },
    {
      id: 'earnings',
      to: '/rider/earnings',
      icon: '/icons/earnings.svg',
      label: 'Earnings',
    },
    {
      id: 'profile',
      to: '/rider/profile',
      icon: '/icons/profile.svg',
      label: 'Profile',
    },
    {
      id: 'support',
      to: '/rider/support',
      icon: '/icons/support.svg',
      label: 'Support',
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
        <button className="flex items-center gap-3 text-[#EF4444] hover:bg-red-50 transition-colors w-full px-3 py-2 rounded-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
          </svg>
          <YummyText className="text-[15px]">Logout</YummyText>
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, iconBg }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between mb-4">
      <YummyText className="text-sm text-[#64748B]">{title}</YummyText>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <YummyText className="text-3xl font-semibold text-[#0F172A] mb-1">{value}</YummyText>
    <YummyText className="text-sm text-[#64748B]">{subtitle}</YummyText>
  </div>
);

const DeliveryCard = ({ packageId, status, from, to, customer, price, distance, time, statusColor }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <YummyText className="text-lg font-semibold text-[#0F172A]">{packageId}</YummyText>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {status}
        </span>
      </div>
      <div className="text-right">
        <YummyText className="text-xl font-semibold text-[#00D68F]">{price}</YummyText>
        <YummyText className="text-xs text-[#64748B]">{distance} · {time}</YummyText>
      </div>
    </div>
    
    <div className="space-y-2 mb-4">
      <div>
        <YummyText className="text-xs text-[#64748B] mb-1">From:</YummyText>
        <YummyText className="text-sm text-[#0F172A]">{from}</YummyText>
      </div>
      <div>
        <YummyText className="text-xs text-[#64748B] mb-1">To:</YummyText>
        <YummyText className="text-sm text-[#0F172A]">{to}</YummyText>
      </div>
      <div>
        <YummyText className="text-xs text-[#64748B] mb-1">Customer:</YummyText>
        <YummyText className="text-sm text-[#0F172A]">{customer}</YummyText>
      </div>
    </div>

    <div className="flex gap-3">
      <button className="flex-1 bg-[#00D68F] hover:bg-[#00B876] text-white py-3 rounded-xl transition-colors">
        <YummyText className="font-medium">Navigate</YummyText>
      </button>
      <button className="px-6 py-3 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
        <YummyText className="text-[#0F172A]">Contact Customer</YummyText>
      </button>
      <button className="px-6 py-3 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
        <YummyText className="text-[#0F172A]">Update Status</YummyText>
      </button>
    </div>
  </div>
);

const AvailableOrderCard = ({ packageId, location, distance, price }) => (
  <div className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow mb-3">
    <div>
      <YummyText className="text-base font-semibold text-[#0F172A] mb-1">{packageId}</YummyText>
      <YummyText className="text-sm text-[#64748B] mb-0.5">{location}</YummyText>
      <YummyText className="text-xs text-[#94A3B8]">{distance}</YummyText>
    </div>
    <div className="flex items-center gap-4">
      <YummyText className="text-xl font-semibold text-[#00D68F]">{price}</YummyText>
      <button className="bg-[#00D68F] hover:bg-[#00B876] text-white px-6 py-2.5 rounded-xl transition-colors">
        <YummyText className="font-medium">Accept</YummyText>
      </button>
    </div>
  </div>
);

export default Sidebar;