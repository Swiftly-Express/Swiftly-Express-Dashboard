import React from 'react';
import RiderSidebar from './RiderSidebar';
import { YummyText } from '../../../components/YummyText';

const RiderLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      <RiderSidebar />
      <div className="ml-64 flex-1 flex flex-col min-h-0 bricolage-font bg-white">
        {/* Fixed Top Header - positioned to respect sidebar width (ml-64) */}
        <div className="fixed top-0 left-0 right-0 z-40">
          <div className="bg-white border-b border-gray-200 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Left: logo + title */}
              <div className="flex items-center gap-3 ml-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#00D68F] to-[#00B876] rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="white"/>
                  </svg>
                </div>
                <YummyText className="text-lg font-medium text-[#0F172A]">
                  Rider Dashboard
                </YummyText>
              </div>

              {/* Right: actions */}
              <div className="flex items-center justify-end gap-4 pr-6">
                <div className="flex items-center gap-4 bg-[#F3F4F6] p-3 px-5 rounded-full shadow-sm">
                  <YummyText className="text-sm text-[#0A0A0A]">Online</YummyText>
                  <label className="relative inline-block w-11 h-6">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D68F]"></div>
                  </label>
                  <div className="w-2 h-2 bg-[#00D68F] rounded-full"></div>
                </div>

                <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#64748B"/>
                  </svg>
                  <span className="absolute top-1 right-2 w-2 h-2 bg-[#FF6B00] rounded-full"></span>
                </button>

                <button className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B876] flex items-center justify-center overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" alt="Profile" className="w-full h-full" />
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

export default RiderLayout;
