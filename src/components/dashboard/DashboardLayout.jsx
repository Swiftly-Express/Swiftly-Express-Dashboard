import React from 'react';
import Sidebar from '../../components/Sidebar';
import { YummyText } from '../../components/YummyText';

const DashboardLayout = ({ role, children }) => {
  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      <Sidebar role={role} />
      <div className="ml-64 flex-1 flex flex-col h-screen bricolage-font">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-end gap-4">
            {/* Online Status Toggle */}
            <div className="flex items-center gap-2">
              <YummyText className="text-sm text-[#64748B]">Online</YummyText>
              <label className="relative inline-block w-11 h-6">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D68F]"></div>
              </label>
            </div>

            {/* Online Indicator */}
            <div className="w-2 h-2 bg-[#00D68F] rounded-full"></div>

            {/* Notification Icon */}
            <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#64748B"/>
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B00] rounded-full"></span>
            </button>

            {/* Profile Picture */}
            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B876] flex items-center justify-center overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" alt="Profile" className="w-full h-full" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;