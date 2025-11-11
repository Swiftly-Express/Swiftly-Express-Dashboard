import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { YummyText } from '../../components/YummyText';

const Support = () => {
  return (
    <DashboardLayout role="rider">
      <div>
        <YummyText className="text-2xl font-semibold mb-2">Support</YummyText>
        <YummyText className="text-sm text-[#64748B] mb-6">Get help and support</YummyText>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <YummyText>Support placeholder.</YummyText>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;