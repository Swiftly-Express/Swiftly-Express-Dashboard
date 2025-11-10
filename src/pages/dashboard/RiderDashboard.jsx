import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { YummyText } from '../../components/YummyText';

const RiderDashboard = () => {
  return (
    <DashboardLayout role="rider">
      <div>
        <YummyText className="text-3xl font-medium mb-6">Rider Dashboard</YummyText>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6">
            <YummyText className="text-gray-600 mb-2">Today's Earnings</YummyText>
            <YummyText className="text-2xl font-medium">$120.00</YummyText>
          </div>
          <div className="bg-white rounded-xl p-6">
            <YummyText className="text-gray-600 mb-2">Completed Deliveries</YummyText>
            <YummyText className="text-2xl font-medium">8</YummyText>
          </div>
          <div className="bg-white rounded-xl p-6">
            <YummyText className="text-gray-600 mb-2">Rating</YummyText>
            <YummyText className="text-2xl font-medium">4.8/5</YummyText>
          </div>
        </div>

        {/* Available Orders */}
        <div className="bg-white rounded-xl p-6">
          <YummyText className="text-xl font-medium mb-4">Available Orders</YummyText>
          {/* Add order list here */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RiderDashboard;