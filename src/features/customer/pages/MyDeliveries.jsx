import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonToast } from '@ionic/react';
import { eye, eyeOff, arrowForward, copy } from 'ionicons/icons';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';
import Loader from '../../../components/Loader';
import { getCustomerDeliveries } from '../../../utils/authApi';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

// Helper function to get status styling
const getStatusStyle = (status) => {
  const statusLower = status?.toLowerCase() || 'pending';
  
  const styles = {
    pending: { color: 'text-orange-700', bg: 'bg-orange-100' },
    'in transit': { color: 'text-blue-700', bg: 'bg-blue-100' },
    'in-transit': { color: 'text-blue-700', bg: 'bg-blue-100' },
    processing: { color: 'text-yellow-700', bg: 'bg-yellow-100' },
    delivered: { color: 'text-green-700', bg: 'bg-green-100' },
    completed: { color: 'text-green-700', bg: 'bg-green-100' },
    cancelled: { color: 'text-red-700', bg: 'bg-red-100' },
    failed: { color: 'text-red-700', bg: 'bg-red-100' }
  };
  
  return styles[statusLower] || { color: 'text-gray-700', bg: 'bg-gray-100' };
};

// Helper function to calculate progress
const getProgress = (status) => {
  const statusLower = status?.toLowerCase() || 'pending';
  
  const progressMap = {
    pending: 10,
    processing: 25,
    'in transit': 60,
    'in-transit': 60,
    'out for delivery': 85,
    delivered: 100,
    completed: 100
  };
  
  return progressMap[statusLower] || 0;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateString;
  }
};

const DeliveryCard = ({ delivery }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const statusStyle = getStatusStyle(delivery.status);
  const progress = getProgress(delivery.status);
  
  const handleToggleDetails = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      const deliveryId = delivery._id || delivery.id || delivery.trackingNumber || delivery.trackingId;
      if (deliveryId) {
        window.dispatchEvent(new CustomEvent('delivery:read', { 
          detail: { 
            id: deliveryId,
            _id: delivery._id,
            deliveryId: deliveryId
          } 
        }));
      }
    }
  };
  
  const handleCopyPackageId = async () => {
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    try {
      await navigator.clipboard.writeText(packageId);
      setShowCopyToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 mb-4" style={sideBottomShadow}>
      {/* Mobile & Desktop Layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3 md:gap-4 flex-1">
          {/* Package Icon */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <img src="/blockicon.svg" alt="Package" className="w-5 h-5 md:w-6 md:h-6" />
          </div>

          {/* Package Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
              <YummyText className="text-base md:text-lg font-medium text-[#0F172A] truncate">
                {delivery.packageDetails?.description || 'Package'}
              </YummyText>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color} w-fit`}>
                {delivery.status || 'Pending'}
              </span>
            </div>
            
            <div className="text-sm text-[#4A5565] mb-1 flex items-center gap-1 flex-wrap">
              <span className="truncate max-w-[120px] md:max-w-none">{delivery.pickupAddress?.city || 'Pickup'}</span>
              <IonIcon icon={arrowForward} className="text-sm flex-shrink-0" />
              <span className="truncate max-w-[120px] md:max-w-none">{delivery.deliveryAddress?.city || 'Delivery'}</span>
            </div>
            
            <div className="text-xs text-[#4A5565] mb-3">
              Booked: {formatDate(delivery.createdAt || delivery.bookedDate)}
            </div>

            {/* Progress Bar */}
            <div className="w-full md:max-w-[300px]">
              <div className="flex justify-between items-center mb-1">
                <YummyText className="text-xs text-[#4A5565]">Progress</YummyText>
                <YummyText className="text-xs font-medium text-[#4A5565]">{progress}%</YummyText>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-[#00D68F] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <button 
          onClick={handleToggleDetails}
          className="flex items-center justify-center gap-2 text-sm text-[#64748B] shadow-sm px-4 py-2 rounded-xl hover:text-[#0F172A] hover:border-gray-800 transition-colors w-full md:w-auto"
          style={{ border: '1.5px solid #0000001A' }}
        >
          <IonIcon icon={isOpen ? eyeOff : eye} className="text-lg" />
          <YummyText>{isOpen ? 'Hide' : 'View'} Details</YummyText>
        </button>
      </div>

      {/* Expanded Details */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Package ID</div>
              <div className="text-sm text-[#0F172A] flex items-center gap-2">
                <span className="truncate">{delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id || 'N/A'}</span>
                <button 
                  onClick={handleCopyPackageId}
                  className="text-[#64748B] hover:text-[#0F172A] transition-colors flex-shrink-0"
                  title="Copy Package ID"
                >
                  <IonIcon icon={copy} className="text-lg" />
                </button>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Package Details</div>
              <div className="text-sm text-[#0F172A]">
                Weight: {delivery.packageDetails?.weight || 'N/A'} kg<br />
                Dimensions: {delivery.packageDetails?.dimensions || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Pickup Address</div>
              <div className="text-sm text-[#0F172A] break-words">
                {delivery.pickupAddress?.street}, {delivery.pickupAddress?.city}, {delivery.pickupAddress?.state}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Delivery Address</div>
              <div className="text-sm text-[#0F172A] break-words">
                {delivery.deliveryAddress?.street}, {delivery.deliveryAddress?.city}, {delivery.deliveryAddress?.state}
              </div>
            </div>
          </div>
        </div>
      )}
      <IonToast
        isOpen={showCopyToast}
        onDidDismiss={() => setShowCopyToast(false)}
        message="Package ID copied to clipboard!"
        duration={2000}
        position="bottom"
      />
    </div>
  );
};

// Mobile Completed Delivery Card
const MobileCompletedCard = ({ delivery }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  const handleToggleDetails = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      const deliveryId = delivery._id || delivery.id || delivery.trackingNumber || delivery.trackingId;
      if (deliveryId) {
        window.dispatchEvent(new CustomEvent('delivery:read', { 
          detail: { 
            id: deliveryId,
            _id: delivery._id,
            deliveryId: deliveryId
          } 
        }));
      }
    }
  };
  
  const handleCopyPackageId = async () => {
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    try {
      await navigator.clipboard.writeText(packageId);
      setShowCopyToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <YummyText className="text-base font-medium text-[#0F172A] mb-1">
            {delivery.packageDetails?.description || 'Package'}
          </YummyText>
          <div className="text-sm text-[#4A5565] mb-2 flex items-center gap-1">
            <span className="truncate max-w-[100px]">{delivery.pickupAddress?.city || 'Pickup'}</span>
            <IonIcon icon={arrowForward} className="text-sm flex-shrink-0" />
            <span className="truncate max-w-[100px]">{delivery.deliveryAddress?.city || 'Delivery'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
            <span>Booked: {formatDate(delivery.createdAt)}</span>
            <span>•</span>
            <span>Delivered: {formatDate(delivery.deliveredAt)}</span>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            {delivery.status || 'Delivered'}
          </span>
        </div>
        <div className="flex items-center gap-3 ml-2">
          <button 
            onClick={handleToggleDetails}
            className="text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <IonIcon icon={isOpen ? eyeOff : eye} className="text-xl" />
          </button>
          <button className="text-[#64748B] hover:text-[#0F172A] transition-colors">
            <img src="/downloadicon.svg" alt="Download" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="pt-3 border-t border-gray-100">
          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Package ID</div>
              <div className="text-sm text-[#0F172A] flex items-center gap-2">
                <span className="truncate">{delivery.trackingNumber || delivery.trackingId || 'N/A'}</span>
                <button 
                  onClick={handleCopyPackageId}
                  className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                  title="Copy Package ID"
                >
                  <IonIcon icon={copy} className="text-lg" />
                </button>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Package Details</div>
              <div className="text-sm text-[#0F172A]">
                Weight: {delivery.packageDetails?.weight || 'N/A'} kg<br />
                Dimensions: {delivery.packageDetails?.dimensions || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Pickup Address</div>
              <div className="text-sm text-[#0F172A] break-words">
                {delivery.pickupAddress?.street}, {delivery.pickupAddress?.city}, {delivery.pickupAddress?.state}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#64748B] mb-1">Delivery Address</div>
              <div className="text-sm text-[#0F172A] break-words">
                {delivery.deliveryAddress?.street}, {delivery.deliveryAddress?.city}, {delivery.deliveryAddress?.state}
              </div>
            </div>
          </div>
        </div>
      )}
      <IonToast
        isOpen={showCopyToast}
        onDidDismiss={() => setShowCopyToast(false)}
        message="Package ID copied!"
        duration={2000}
        position="bottom"
      />
    </div>
  );
};

// Desktop Table Row
const CompletedDeliveryRow = ({ delivery }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  const handleToggleDetails = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      const deliveryId = delivery._id || delivery.id || delivery.trackingNumber || delivery.trackingId;
      if (deliveryId) {
        window.dispatchEvent(new CustomEvent('delivery:read', { 
          detail: { 
            id: deliveryId,
            _id: delivery._id,
            deliveryId: deliveryId
          } 
        }));
      }
    }
  };
  
  const handleCopyPackageId = async () => {
    const packageId = delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id;
    try {
      await navigator.clipboard.writeText(packageId);
      setShowCopyToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-4 px-4 text-sm font-medium text-[#0A0A0A]">
          {delivery.packageDetails?.description || 'Package'}
        </td>
        <td className="py-4 px-4 text-sm text-[#0A0A0A]">
          <div className="flex items-center gap-1">
            <span>{delivery.pickupAddress?.city || 'Pickup'}</span>
            <IonIcon icon={arrowForward} className="text-sm" />
            <span>{delivery.deliveryAddress?.city || 'Delivery'}</span>
          </div>
        </td>
        <td className="py-4 px-4 text-sm text-[#0A0A0A]">
          {formatDate(delivery.createdAt || delivery.bookedDate)}
        </td>
        <td className="py-4 px-4 text-sm text-[#0A0A0A]">
          {formatDate(delivery.deliveredAt || delivery.deliveredDate)}
        </td>
        <td className="py-4 px-4">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            {delivery.status || 'Delivered'}
          </span>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={handleToggleDetails}
              className="text-[#0A0A0A] hover:text-[#0F172A] transition-colors"
            >
              <IonIcon icon={isOpen ? eyeOff : eye} className="text-xl" />
            </button>
            <button className="text-[#0A0A0A] -mt-2 hover:text-[#0F172A] transition-colors">
              <img src="/downloadicon.svg" alt="Download" className="w-5 h-5" />
            </button>
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-gray-50">
          <td colSpan="6" className="py-4 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-[#64748B] mb-1">Package ID</div>
                <div className="text-sm text-[#0F172A] flex items-center gap-2">
                  <span>{delivery.trackingNumber || delivery.trackingId || delivery.id || delivery._id || 'N/A'}</span>
                  <button 
                    onClick={handleCopyPackageId}
                    className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                    title="Copy Package ID"
                  >
                    <IonIcon icon={copy} className="text-lg" />
                  </button>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#64748B] mb-1">Package Details</div>
                <div className="text-sm text-[#0F172A]">
                  Weight: {delivery.packageDetails?.weight || 'N/A'} kg<br />
                  Dimensions: {delivery.packageDetails?.dimensions || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#64748B] mb-1">Pickup Address</div>
                <div className="text-sm text-[#0F172A]">
                  {delivery.pickupAddress?.street}, {delivery.pickupAddress?.city}, {delivery.pickupAddress?.state}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#64748B] mb-1">Delivery Address</div>
                <div className="text-sm text-[#0F172A]">
                  {delivery.deliveryAddress?.street}, {delivery.deliveryAddress?.city}, {delivery.deliveryAddress?.state}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
      <IonToast
        isOpen={showCopyToast}
        onDidDismiss={() => setShowCopyToast(false)}
        message="Package ID copied to clipboard!"
        duration={2000}
        position="bottom"
      />
    </>
  );
};

const MyDeliveries = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const handleRefresh = () => {
      console.log('[MyDeliveries] Received refresh event');
      fetchDeliveries();
    };
    
    const handleDeliveryCreated = (event) => {
      console.log('[MyDeliveries] Delivery created:', event.detail);
      fetchDeliveries();
    };
    
    const handleDeliveryUpdated = (event) => {
      console.log('[MyDeliveries] Delivery updated:', event.detail);
      fetchDeliveries();
    };

    window.addEventListener('deliveries:refresh', handleRefresh);
    window.addEventListener('delivery:created', handleDeliveryCreated);
    window.addEventListener('delivery:updated', handleDeliveryUpdated);

    return () => {
      window.removeEventListener('deliveries:refresh', handleRefresh);
      window.removeEventListener('delivery:created', handleDeliveryCreated);
      window.removeEventListener('delivery:updated', handleDeliveryUpdated);
    };
  }, []);

  async function fetchDeliveries() {
    setLoading(true);
    setError('');
    try {
      console.log('[MyDeliveries] Fetching deliveries...');
      const res = await getCustomerDeliveries({ page, limit });
      console.log('[MyDeliveries] API response:', res);
      
      let items = [];
      
      if (Array.isArray(res)) {
        items = res;
      } else if (res?.data) {
        items = Array.isArray(res.data) ? res.data : (res.data.deliveries || res.data.items || []);
      } else if (res?.deliveries) {
        items = res.deliveries;
      } else if (res?.items) {
        items = res.items;
      } else if (res?.results) {
        items = res.results;
      }
      
      console.log('[MyDeliveries] Parsed items:', items);
      
      const active = items.filter((d) => {
        const status = d?.status?.toLowerCase() || 'pending';
        return status !== 'delivered' && status !== 'completed' && status !== 'cancelled';
      });
      
      const completed = items.filter((d) => {
        const status = d?.status?.toLowerCase() || '';
        return status === 'delivered' || status === 'completed';
      });
      
      console.log('[MyDeliveries] Active:', active.length, 'Completed:', completed.length);
      
      setActiveDeliveries(active);
      setCompletedDeliveries(completed);
    } catch (err) {
      console.error('[MyDeliveries] Failed to load deliveries:', err);
      setError(err?.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-6">
            <YummyText className="text-2xl md:text-3xl font-medium text-[#0F172A] mb-2">
              My Deliveries
            </YummyText>
            <YummyText className="text-sm md:text-base text-[#4A5565]">
              View and manage all your shipments
            </YummyText>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 rounded-full w-full md:w-fit">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 md:flex-none md:px-14 px-6 py-3 md:py-2 whitespace-nowrap rounded-full text-sm font-normal transition-colors ${
                activeTab === 'active'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Active ({activeDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 md:flex-none md:px-14 px-6 py-3 md:py-2 whitespace-nowrap rounded-full text-sm font-normal transition-colors ${
                activeTab === 'completed'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Completed ({completedDeliveries.length})
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-6">
              <Loader message="Loading deliveries..." />
            </div>
          )}

          {/* Active Deliveries */}
          {!loading && activeTab === 'active' && (
            <div>
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl" style={sideBottomShadow}>
                  <img src="/blockicon.svg" alt="No deliveries" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-[#64748B] text-base md:text-lg mb-2">No active deliveries</p>
                  <p className="text-[#94A3B8] text-sm">Your active shipments will appear here</p>
                </div>
              ) : (
                activeDeliveries.map((delivery, index) => (
                  <DeliveryCard key={delivery._id || delivery.id || index} delivery={delivery} />
                ))
              )}
            </div>
          )}

          {/* Completed Deliveries - Mobile Cards */}
          {!loading && activeTab === 'completed' && (
            <>
              {/* Mobile View */}
              <div className="block md:hidden">
                {completedDeliveries.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl" style={sideBottomShadow}>
                    <img src="/checkicon.svg" alt="No completed" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-[#64748B] text-base mb-2">No completed deliveries</p>
                    <p className="text-[#94A3B8] text-sm">Your completed shipments will appear here</p>
                  </div>
                ) : (
                  completedDeliveries.map((delivery, index) => (
                    <MobileCompletedCard key={delivery._id || delivery.id || index} delivery={delivery} />
                  ))
                )}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-2xl p-6" style={sideBottomShadow}>
                {completedDeliveries.length === 0 ? (
                  <div className="text-center py-12">
                    <img src="/checkicon.svg" alt="No completed" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-[#64748B] text-lg mb-2">No completed deliveries</p>
                    <p className="text-[#94A3B8] text-sm">Your completed shipments will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Tracking ID</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Route</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Booked Date</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Delivered Date</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-[#0F172A]">Status</th>
                          <th className="text-center py-4 px-4 text-sm font-medium text-[#0F172A]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedDeliveries.map((delivery, index) => (
                          <CompletedDeliveryRow key={delivery._id || delivery.id || index} delivery={delivery} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default MyDeliveries;