import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';

const AdminDashboard = () => {
  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-no-padding">
          <div>
            <YummyText className="text-3xl font-medium mb-6">Admin Dashboard</YummyText>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-[#64748B] mb-2">Total Users</div>
                <div className="text-3xl font-semibold text-[#0F172A]">2,543</div>
                <div className="text-xs text-green-600 mt-2">↑ 12% from last month</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-[#64748B] mb-2">Active Riders</div>
                <div className="text-3xl font-semibold text-[#0F172A]">432</div>
                <div className="text-xs text-green-600 mt-2">↑ 8% from last month</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-[#64748B] mb-2">Total Deliveries</div>
                <div className="text-3xl font-semibold text-[#0F172A]">15,234</div>
                <div className="text-xs text-green-600 mt-2">↑ 23% from last month</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-[#64748B] mb-2">Total Revenue</div>
                <div className="text-3xl font-semibold text-[#0F172A]">N12.4M</div>
                <div className="text-xs text-green-600 mt-2">↑ 18% from last month</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6">
              <YummyText className="text-xl font-medium mb-4">Recent Activity</YummyText>
              <YummyText className="text-sm text-[#64748B]">Activity feed placeholder</YummyText>
            </div>
          </div>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default AdminDashboard;
