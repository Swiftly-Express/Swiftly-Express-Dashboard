import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { YummyText } from '../../components/YummyText';

const Earnings = () => {
  return (
    <DashboardLayout role="rider">
      <div>
        <YummyText className="text-2xl font-semibold mb-2">Earnings</YummyText>
        <YummyText className="text-sm text-[#64748B] mb-6">Your earnings overview</YummyText>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <YummyText>No earnings data — placeholder content.</YummyText>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Earnings;