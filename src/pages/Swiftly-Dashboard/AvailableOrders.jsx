import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

// Shadow only on left, right and bottom - no top shadow for seamless blend
const sideBottomShadow = {
  boxShadow: '0.5px 1.5px 2px rgba(0, 0, 0, 0.05), -0.5px 1.5px 2px rgba(0, 0, 0, 0.05), 0 1.5px 3px rgba(0, 0, 0, 0.07)'
};

const StatCard = ({ icon, title, value, subtitle, color }) => (
  <div className="bg-white rounded-xl p-5 py-3 border-none leading-none" style={sideBottomShadow}>
    <div className={`text-2xl font-[300] ${color} mb-1`}>{value}</div>
    <div className="text-xs text-[#64748B] mb-2">{title}</div>
    <div className="text-[11px] text-[#64748B] leading-none">{subtitle}</div>
  </div>
);

const OrderCard = ({ packageId, priority, size, pickupName, pickupAddress, deliveryName, deliveryAddress, distance, time, packageSize, price, tips }) => (
  <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-100" style={sideBottomShadow}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="text-lg font-normal text-[#0F172A]">{packageId}</div>
        {priority && (
          <span className="px-3 py-1 rounded-full text-xs font-normal bg-orange-100 text-orange-600">
            {priority}
          </span>
        )}
        {size && (
          <span className="px-3 py-1 rounded-full text-xs font-normal bg-gray-100 text-gray-700">
            {size}
          </span>
        )}
      </div>
      <div className="text-right">
        <div className="text-2xl font-normal text-[#00D68F]">{price}</div>
        <div className="text-xs text-[#64748B]">+ {tips} tips</div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-6 mb-4">
      {/* Pickup Location */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#00D68F"/>
          </svg>
          <div className="text-xs font-medium text-[#64748B]">Pickup</div>
        </div>
        <div className="text-sm font-medium text-[#0F172A] mb-1">{pickupName}</div>
        <div className="text-xs text-[#64748B]">{pickupAddress}</div>
      </div>

      {/* Delivery Location */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FF9500"/>
          </svg>
          <div className="text-xs font-medium text-[#64748B]">Delivery</div>
        </div>
        <div className="text-sm font-medium text-[#0F172A] mb-1">{deliveryName}</div>
        <div className="text-xs text-[#64748B]">{deliveryAddress}</div>
      </div>
    </div>

    {/* Order Details */}
    <div className="flex items-center gap-4 mb-4 text-xs text-[#64748B]">
      <div className="flex items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"/>
        </svg>
        {distance}
      </div>
      <div className="flex items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
        </svg>
        {time}
      </div>
      <div className="flex items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="currentColor"/>
        </svg>
        {packageSize}
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex gap-3">
      <button className="flex-1 bg-[#00B75A] hover:bg-[#00B876] text-white py-2.5 rounded-xl transition-colors font-[300]">
        Accept Order
      </button>
      <button className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-[#0F172A] font-[300]">
        View Details
      </button>
    </div>
  </div>
);

const AvailableOrders = () => {
  const [activeTab, setActiveTab] = useState('all');

  const orders = [
    {
      id: 'PKG-2405',
      priority: null,
      size: 'Medium',
      pickupName: 'Downtown Market',
      pickupAddress: '789 Market St, NY 10001',
      deliveryName: 'Riverside Apartments',
      deliveryAddress: '456 River Rd, NY 10002',
      distance: '2.1 mi',
      time: '18 min',
      packageSize: '25.5',
      price: 'N2348.00',
      tips: '0.00'
    },
    {
      id: 'PKG-2406',
      priority: 'Express',
      size: 'Large',
      pickupName: 'West Side Plaza',
      pickupAddress: '321 Plaza Ave, NY 10003',
      deliveryName: 'Tech Campus Building B',
      deliveryAddress: '999 Innovation Dr, NY 10004',
      distance: '4.5 mi',
      time: '25 min',
      packageSize: '33.5',
      price: 'N2348.00',
      tips: 'N5.00'
    },
    {
      id: 'PKG-2407',
      priority: null,
      size: 'Small',
      pickupName: 'Central Pharmacy',
      pickupAddress: '555 Health Blvd, NY 10005',
      deliveryName: 'Greenwood Residence',
      deliveryAddress: '123 Green St, NY 10006',
      distance: '1.3 mi',
      time: '12 min',
      packageSize: '20',
      price: 'N2348.00',
      tips: 'N2.00'
    },
    {
      id: 'PKG-2408',
      priority: 'Express',
      size: 'Medium',
      pickupName: 'Fashion Outlet',
      pickupAddress: '888 Style Ave, NY 10007',
      deliveryName: 'Sunset Towers',
      deliveryAddress: '777 Sunset Blvd, NY 10008',
      distance: '3.8 mi',
      time: '22 min',
      packageSize: '28',
      price: 'N2348.00',
      tips: 'N4.00'
    }
  ];

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'express') return order.priority === 'Express';
    if (activeTab === 'nearby') return parseFloat(order.distance) <= 2.5;
    return true;
  });

  const expressCount = orders.filter(o => o.priority === 'Express').length;
  const nearbyCount = orders.filter(o => parseFloat(o.distance) <= 2.5).length;

  return (
    <IonPage>
      <DashboardLayout role="rider">
        <IonContent className="ion-no-padding">
          {/* Header */}
          <div className="mb-8 py-2">
        <div className="text-3xl font-medium text-[#0F172A] mb-2">
          Available Orders
        </div>
        <div className="text-[#4A5565] text-[15px] font-[400]">
          Accept orders in your area and start earning
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Available Now"
          value={orders.length}
          subtitle=""
          color="text-[#00A63E]"
        />
        <StatCard
          title="Potential Earnings"
          value="N8976.50"
          subtitle=""
          color="text-[#00A63E]"
        />
        <StatCard
          title="Avg. Distance"
          value="2.4 mi"
          subtitle=""
          color="text-[#FF7A00]"
        />
        <StatCard
          title="Avg. Time"
          value="17 min"
          subtitle=""
          color="text-[#9810FA]"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-gray-50 left-2 p-1 rounded-full w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 py-1 rounded-full text-sm font-normal transition-colors ${
            activeTab === 'all'
              ? 'text-[#00B75A] bg-white shadow-sm'
              : 'text-[#64748B]'
          }`}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('express')}
          className={`px-5 py-1 rounded-full text-sm font-normal transition-colors ${
            activeTab === 'express'
              ? 'text-[#00B75A] bg-white shadow-sm'
              : 'text-[#64748B]'
          }`}
        >
          Express ({expressCount})
        </button>
        <button
          onClick={() => setActiveTab('nearby')}
          className={`px-5 py-1 rounded-full text-sm font-normal transition-colors ${
            activeTab === 'nearby'
              ? 'text-[#00B75A] bg-white shadow-sm'
              : 'text-[#64748B]'
          }`}
        >
          Nearby ({nearbyCount})
        </button>
      </div>

      {/* Orders List */}
      <div className="max-h-[800px] overflow-y-auto pr-2">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            packageId={order.id}
            priority={order.priority}
            size={order.size}
            pickupName={order.pickupName}
            pickupAddress={order.pickupAddress}
            deliveryName={order.deliveryName}
            deliveryAddress={order.deliveryAddress}
            distance={order.distance}
            time={order.time}
            packageSize={order.packageSize}
            price={order.price}
            tips={order.tips}
          />
        ))}
      </div>
        </IonContent>
      </DashboardLayout>
    </IonPage>
  );
};

export default AvailableOrders;