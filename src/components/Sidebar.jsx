import { Link, useLocation } from 'react-router-dom';
import { YummyText } from './YummyText';
import {React} from 'react';

const SidebarButton = ({ to, active, icon, label, count }) => (
  <Link to={to} className="w-full">
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full ${
        active ? 'bg-[#00D68F] text-white' : 'text-[#64748B] hover:bg-gray-50'
      }`}
    >
      {icon}
      <YummyText className="flex-1 text-left text-[15px]">{label}</YummyText>
      {count !== undefined && (
        <span className="bg-[#FF6B00] text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[24px] text-center">
          {count}
        </span>
      )}
    </div>
  </Link>
);

const Sidebar = () => {
  const menuItems = [
    {
      id: 'dashboard',
      to: '/rider/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
        </svg>
      ),
      label: 'Dashboard',
    },
    {
      id: 'available',
      to: '/rider/available',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="currentColor"/>
        </svg>
      ),
      label: 'Available Orders',
      count: 5,
    },
    {
      id: 'active',
      to: '/rider/active',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/>
        </svg>
      ),
      label: 'Active Deliveries',
    },
    {
      id: 'earnings',
      to: '/rider/earnings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"/>
        </svg>
      ),
      label: 'Earnings',
    },
    {
      id: 'profile',
      to: '/rider/profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
        </svg>
      ),
      label: 'Profile',
    },
    {
      id: 'support',
      to: '/rider/support',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="currentColor"/>
        </svg>
      ),
      label: 'Support',
    },
  ];

  const location = useLocation();

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-300 shadow-sm flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00D68F] to-[#00B876] rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="white"/>
            </svg>
          </div>
          <YummyText className="text-xl font-semibold text-[#0F172A]">Rider Portal</YummyText>
        </div>
      </div>

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