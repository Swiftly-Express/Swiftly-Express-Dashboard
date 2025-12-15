import React from 'react';
import AdminSidebar from './AdminSidebar';
import { YummyText } from '../../../components/YummyText';

const AdminLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      <AdminSidebar />
      <div className="ml-64 flex-1 flex flex-col min-h-0 bricolage-font bg-white">
        {/* Fixed Top Header - positioned to respect sidebar width (ml-64) */}
        <div className="fixed top-0 left-0 right-0 z-40">
          <div className="bg-white border-b border-gray-200 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Left: logo + title */}
              <div className="flex items-center gap-3 ml-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#00D68F] to-[#00B75A] rounded-lg flex items-center justify-center">
                  <img src="/vanicon-white.svg" alt="truck" width={20} height={20} />
                </div>
                <div className="flex flex-col">
                  <YummyText className="text-lg font-medium text-[#0F172A]">
                    Swiftly Xpress
                  </YummyText>
                  <YummyText className="text-xs text-[#64748B]">
                    Admin
                  </YummyText>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center justify-end gap-4 pr-6">
                <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#64748B"/>
                  </svg>
                  <span className="absolute top-1 right-2 w-2 h-2 bg-[#FF6B00] rounded-full"></span>
                </button>
                <button className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B75A] flex items-center justify-center overflow-hidden text-white font-medium text-sm">
                  AD
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content (header has fixed position).
            Allow page scrolling but hide the visible scrollbar using a utility class.
            Inner sections (with their own overflow-y-auto) will still show scrollbars.
        */}
        <div className="flex-1 p-8 pt-24 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
