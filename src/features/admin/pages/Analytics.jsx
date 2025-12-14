import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(false);

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-padding">
          <YummyText>
            <div className="mb-6">
              <h1 className="text-3xl font-medium text-[#0F172A] mb-2">Analytics</h1>
              <p className="text-[#64748B]">Platform performance and insights</p>
            </div>

            {/* Time Range Filter */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setTimeRange('24hours')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === '24hours'
                    ? 'bg-[#9333EA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                24 Hours
              </button>
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === '7days'
                    ? 'bg-[#9333EA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === '30days'
                    ? 'bg-[#9333EA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeRange('90days')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === '90days'
                    ? 'bg-[#9333EA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                90 Days
              </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-[#64748B] mb-2">Total Revenue</div>
                <div className="text-3xl font-semibold text-[#0F172A] mb-2">₦12.4M</div>
                <div className="text-xs text-green-600">↑ 18% from previous period</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-[#64748B] mb-2">Total Orders</div>
                <div className="text-3xl font-semibold text-[#0F172A] mb-2">15,234</div>
                <div className="text-xs text-green-600">↑ 23% from previous period</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-[#64748B] mb-2">Active Riders</div>
                <div className="text-3xl font-semibold text-[#0F172A] mb-2">432</div>
                <div className="text-xs text-green-600">↑ 8% from previous period</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm text-[#64748B] mb-2">Avg. Delivery Time</div>
                <div className="text-3xl font-semibold text-[#0F172A] mb-2">28 min</div>
                <div className="text-xs text-green-600">↓ 5% from previous period</div>
              </div>
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-medium text-[#0F172A] mb-4">Revenue Trend</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-[#64748B]">Chart placeholder - Revenue over time</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-medium text-[#0F172A] mb-4">Order Status Distribution</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-[#64748B]">Chart placeholder - Order status breakdown</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-medium text-[#0F172A] mb-4">Top Performing Riders</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-[#64748B]">Table placeholder - Top riders by deliveries</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-medium text-[#0F172A] mb-4">Popular Routes</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-[#64748B]">Map placeholder - Most frequented routes</p>
                </div>
              </div>
            </div>
          </YummyText>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default Analytics;
