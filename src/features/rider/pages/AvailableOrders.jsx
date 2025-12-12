import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import { getAvailableJobs, acceptDeliveryJob } from '../../../utils/authApi';

// Shadow only on left, right and bottom - no top shadow for seamless blend
const sideBottomShadow = {
  boxShadow: '0.5px 1.5px 2px rgba(0, 0, 0, 0.05), -0.5px 1.5px 2px rgba(0, 0, 0, 0.05), 0 1.5px 3px rgba(0, 0, 0, 0.07)'
};

const StatCard = ({ icon, title, value, subtitle, color }) => (
  <div className="bg-white rounded-xl p-5 py-3 leading-none" style={sideBottomShadow}>
    <YummyText>
    <div className={`text-2xl font-[300] ${color} mb-1`}>{value}</div>
    <div className="text-xs text-[#64748B] mb-2">{title}</div>
    <div className="text-[11px] text-[#64748B] leading-none">{subtitle}</div>
    </YummyText>
  </div>
);

const OrderCard = ({ 
  deliveryId,
  packageId, 
  priority, 
  size, 
  pickupName, 
  pickupAddress, 
  deliveryName, 
  deliveryAddress, 
  distance, 
  time, 
  packageSize, 
  price, 
  tips,
  onAccept,
  accepting 
}) => (
  <div className="bg-white rounded-2xl p-6 mb-4" style={sideBottomShadow}>
    <YummyText>
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="text-lg font-normal text-[#0F172A]">{packageId}</div>
        {priority && (
          <span className="px-3 py-1 rounded-lg text-xs font-normal bg-[#FF7A00] text-[#FFFFFF]">
            {priority}
          </span>
        )}
        {size && (
          <span className="px-3 py-1 rounded-lg text-xs font-normal border border-gray-400 text-gray-700">
            {size}
          </span>
        )}
      </div>
      <div className="text-right">
        <div className="text-2xl font-normal text-[#00D68F]">{price}</div>
        <div className="text-xs text-[#64748B]">+ {tips} tips</div>
      </div>
    </div>
    </YummyText>

    <div className="grid grid-cols-2 gap-6 mb-4">
      <YummyText>
      {/* Pickup Location */}
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-[#E8F8F0] rounded-full flex items-center justify-center flex-shrink-0">
          <img width="16" height="16" src="/locationicon.svg" alt="Pickup Icon"/>
        </div>
        <div>
          <div className="text-xs font-medium text-[#64748B] mb-2">Pickup</div>
          <div className="text-sm font-medium text-[#0F172A] mb-1">{pickupName}</div>
          <div className="text-xs text-[#64748B]">{pickupAddress}</div>
        </div>
      </div>
      </YummyText>

      <YummyText>
      {/* Delivery Location */}
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-[#FFF4E6] rounded-full flex items-center justify-center flex-shrink-0">
          <img width="16" height="16" src="/location-orange.svg" alt="Delivery Icon"/>
        </div>
        <div>
          <div className="text-xs font-medium text-[#64748B] mb-2">Delivery</div>
          <div className="text-sm font-medium text-[#0F172A] mb-1">{deliveryName}</div>
          <div className="text-xs text-[#64748B]">{deliveryAddress}</div>
        </div>
      </div>
      </YummyText>
    </div>

    {/* Divider separating addresses from order meta (distance/time/size) */}
    <div className="my-3 border-t border-gray-200"></div>

    {/* Order Details */}
    <YummyText>
    <div className="flex items-center gap-4 mb-4 text-xs text-[#64748B]">
      <div className="flex items-center gap-1">
        <img width="16" height="16" src="/paperplane-icon.svg" alt="Distance Icon"/>
        {distance}
      </div>
      <div className="flex items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
        </svg>
        {time}
      </div>
      <div className="flex items-center gap-1">
        <img width="16" height="16" src="/dollar-icon.svg" alt="Package Size Icon"/>
        {packageSize}
      </div>
    </div>
    </YummyText>

    {/* Action Buttons */}
    <YummyText>
    <div className="flex gap-3">
      <button 
        onClick={() => onAccept(deliveryId)}
        disabled={accepting}
        className={`flex-1 bg-[#00B75A] hover:bg-[#00B876] text-white py-2 rounded-lg transition-colors font-[400] ${accepting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {accepting ? 'Accepting...' : 'Accept Order'}
      </button>
      <button className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-[#0F172A] font-[400] py-2" style={{border: "1px solid #0000001A"}}>
        View Details
      </button>
    </div>
    </YummyText>
  </div>
);

const AvailableOrders = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [page, setPage] = useState(1);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Fetch available jobs on mount
  useEffect(() => {
    fetchAvailableJobs();
  }, [page]);

  // Listen for new deliveries created by customers
  useEffect(() => {
    const handleDeliveryCreated = (event) => {
      console.log('[AvailableOrders] New delivery created, refreshing jobs:', event.detail);
      setToastMsg('New delivery available!');
      setShowToast(true);
      fetchAvailableJobs();
    };

    const handleDeliveriesRefresh = () => {
      console.log('[AvailableOrders] Deliveries refresh requested');
      fetchAvailableJobs();
    };

    window.addEventListener('delivery:created', handleDeliveryCreated);
    window.addEventListener('deliveries:refresh', handleDeliveriesRefresh);

    return () => {
      window.removeEventListener('delivery:created', handleDeliveryCreated);
      window.removeEventListener('deliveries:refresh', handleDeliveriesRefresh);
    };
  }, []);

  const fetchAvailableJobs = async () => {
    setLoading(true);
    try {
      const response = await getAvailableJobs(page, 20);
      console.log('[AvailableOrders] Fetched jobs:', response);
      
      // Extract jobs from response (adjust based on actual API response structure)
      const jobs = response?.data?.jobs || response?.jobs || response?.data || [];
      setOrders(jobs);
    } catch (error) {
      console.error('[AvailableOrders] Failed to fetch jobs:', error);
      setToastMsg(error.message || 'Failed to load available jobs');
      setShowToast(true);
      // Keep mock data as fallback for development
      setOrders([
        {
          id: 'PKG-2405',
          _id: 'PKG-2405',
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
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (deliveryId) => {
    setAccepting(deliveryId);
    try {
      const response = await acceptDeliveryJob(deliveryId);
      console.log('[AvailableOrders] Job accepted:', response);
      
      setToastMsg('Order accepted successfully!');
      setShowToast(true);
      
      // Remove accepted order from list
      setOrders(prev => prev.filter(order => (order._id || order.id) !== deliveryId));
      
      // Dispatch event to refresh active deliveries
      window.dispatchEvent(new CustomEvent('delivery:accepted', { detail: { deliveryId } }));
    } catch (error) {
      console.error('[AvailableOrders] Failed to accept job:', error);
      setToastMsg(error.message || 'Failed to accept order');
      setShowToast(true);
    } finally {
      setAccepting(null);
    }
  };

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
      <RiderLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <YummyText>
            <div className="mb-8 py-2">
              <div className="text-3xl font-medium text-[#0F172A] mb-2">
                Available Orders
              </div>
              <div className="text-[#4A5565] text-[15px] font-[400]">
                Accept orders in your area and start earning
              </div>
            </div>
          </YummyText>

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
            <YummyText>
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
            </YummyText>
          </div>

          {/* Orders List */}
          <div className="max-h-[800px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#00B75A]"></div>
                <p className="mt-4 text-[#64748B]">Loading available orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#64748B]">No available orders at the moment</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order._id || order.id}
                  deliveryId={order._id || order.id}
                  packageId={order.trackingNumber || order.id}
                  priority={order.priority}
                  size={order.size || order.packageDetails?.size}
                  pickupName={order.pickupName || order.pickupAddress?.name}
                  pickupAddress={order.pickupAddress?.street || order.pickupAddress}
                  deliveryName={order.deliveryName || order.deliveryAddress?.name}
                  deliveryAddress={order.deliveryAddress?.street || order.deliveryAddress}
                  distance={order.distance || 'N/A'}
                  time={order.estimatedTimeMinutes ? `${order.estimatedTimeMinutes} min` : order.time || 'N/A'}
                  packageSize={order.packageSize || order.packageDetails?.weight || 'N/A'}
                  price={order.price || 'N/A'}
                  tips={order.tips || '0.00'}
                  onAccept={handleAcceptOrder}
                  accepting={accepting === (order._id || order.id)}
                />
              ))
            )}
          </div>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
          />
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default AvailableOrders;
