import React from 'react';
import Sidebar from '../../components/Sidebar';
import { YummyText } from '../../components/YummyText';

const DashboardLayout = ({ role, children }) => {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar role={role} />
      <div className="ml-64 flex-1 p-8">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;