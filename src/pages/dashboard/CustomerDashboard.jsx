import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { YummyText } from '../../components/YummyText';
import Button from '../../components/Button';

const CustomerDashboard = () => {
  return (
    <DashboardLayout role="customer">
      <div>
        <YummyText className="text-3xl font-medium mb-6">Welcome back, John!</YummyText>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Button
            variant="primary"
            className="!bg-[#00D68F] !text-white !p-6 !h-32 rounded-xl flex flex-col items-center justify-center"
          >
            <img src="/book.svg" alt="" className="w-8 h-8 mb-2" />
            <YummyText>Book a Delivery</YummyText>
          </Button>
          <Button
            variant="light"
            className="!bg-white !text-gray-800 !p-6 !h-32 rounded-xl flex flex-col items-center justify-center"
          >
            <img src="/track.svg" alt="" className="w-8 h-8 mb-2" />
            <YummyText>Track Package</YummyText>
          </Button>
          <Button
            variant="light"
            className="!bg-white !text-gray-800 !p-6 !h-32 rounded-xl flex flex-col items-center justify-center"
          >
            <img src="/history.svg" alt="" className="w-8 h-8 mb-2" />
            <YummyText>Delivery History</YummyText>
          </Button>
          <Button
            variant="light"
            className="!bg-white !text-gray-800 !p-6 !h-32 rounded-xl flex flex-col items-center justify-center"
          >
            <img src="/support.svg" alt="" className="w-8 h-8 mb-2" />
            <YummyText>Get Support</YummyText>
          </Button>
        </div>

        {/* Recent Deliveries */}
        <div className="bg-white rounded-xl p-6">
          <YummyText className="text-xl font-medium mb-4">Recent Deliveries</YummyText>
          {/* Add delivery list here */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;