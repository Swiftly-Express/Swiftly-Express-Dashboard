import React, { useState } from 'react';
import { IonHeader, IonContent } from '@ionic/react';
import CustomerSidebar from './CustomerSidebar';
import { YummyText } from '../../../components/YummyText';

const CustomerLayout = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <>
      {/* Fixed Header */}
      <IonHeader className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 h-24 z-40 ion-no-border">
        <div className="flex items-center justify-between h-full px-8">
          {/* Left: Logo/Title */}
          <div className="flex items-center gap-2">
            <YummyText className="text-2xl font-semibold text-[#00D68F]">Swiftly Express</YummyText>
            <span className="text-sm text-[#64748B] ml-2">Customer Portal</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-6">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="#64748B"/>
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#00D68F] rounded-full"></span>
            </button>

            {/* Profile */}
            <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00D68F] to-[#00B876] rounded-full flex items-center justify-center text-white font-medium">
                JD
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-[#0F172A]">John Doe</div>
                <div className="text-xs text-[#64748B]">Customer</div>
              </div>
            </button>
          </div>
        </div>
      </IonHeader>

      {/* Sidebar */}
      <CustomerSidebar />

      {/* Main Content Area with top padding for fixed header */}
      <div className="ml-64 pt-24 min-h-screen bg-[#FAFBFC]">
        <div className="p-8">
          {children}
        </div>
      </div>
    </>
  );
};

export default CustomerLayout;
