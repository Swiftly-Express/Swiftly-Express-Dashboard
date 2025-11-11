import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { YummyText } from '../../components/YummyText';

const AvailableOrders = () => {
  return (
    <DashboardLayout role="rider">
      <div>
        <YummyText className="text-2xl font-semibold mb-2">Available Orders</YummyText>
        <YummyText className="text-sm text-[#64748B] mb-6">Orders you can accept right now</YummyText>

        {/* TODO: Implement available orders list */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <YummyText>No orders yet — placeholder content.</YummyText>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AvailableOrders;