import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { YummyText } from '../../components/YummyText';

const Profile = () => {
  return (
    <DashboardLayout role="rider">
      <div>
        <YummyText className="text-2xl font-semibold mb-2">Profile</YummyText>
        <YummyText className="text-sm text-[#64748B] mb-6">Manage your rider profile</YummyText>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <YummyText>Profile settings placeholder.</YummyText>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;