import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Search, Filter, MoreVertical, User, Bike, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';
import BlockIcon from '../../../icons/Blockicon';
import CheckIcon from '../../../icons/Checkicon';
import ToyBikeIcon from '../../../icons/Toybikeicon';
import ClockIcon from '../../../icons/Clockicon';
import { getAllDeliveries } from '../../../utils/adminApi';

const ManageOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 20;

  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    inTransit: 0,
    pending: 0
  });

  const fetchDeliveries = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`Fetching deliveries page ${page}...`);
      const response = await getAllDeliveries(page, limit);
      
      console.log('Deliveries API response:', response);
      
      const deliveriesData = response?.data?.deliveries || response?.deliveries || response?.data || [];
      const pagination = response?.data?.pagination || response?.pagination || {};
      
      setOrders(deliveriesData);
      setTotalOrders(pagination.total || deliveriesData.length);
      setTotalPages(pagination.totalPages || Math.ceil((pagination.total || deliveriesData.length) / limit));
      setCurrentPage(pagination.currentPage || page);
      
      calculateStats(deliveriesData);
      
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError(err.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (deliveriesData) => {
    const total = deliveriesData.length;
    const delivered = deliveriesData.filter(d => 
      d.status === 'delivered' || d.status === 'completed'
    ).length;
    const inTransit = deliveriesData.filter(d => 
      d.status === 'in_transit' || d.status === 'in-transit' || d.status === 'picked_up'
    ).length;
    const pending = deliveriesData.filter(d => 
      d.status === 'pending' || d.status === 'awaiting_pickup'
    ).length;
    
    setStats({ total, delivered, inTransit, pending });
  };

  useEffect(() => {
    fetchDeliveries(1);
  }, []);

  const statsCards = [
    { 
      label: 'Total Orders', 
      value: totalOrders.toLocaleString(), 
      icon: <BlockIcon className="w-5 h-5" stroke="#1E1E1E" />,
      bgColor: '#F3F4F6',
      valueColor: '#1E1E1E'
    },
    { 
      label: 'Delivered', 
      value: stats.delivered.toLocaleString(), 
      icon: <CheckIcon className="w-5 h-5" stroke="#00A63E" />,
      bgColor: '#D1FAE5',
      valueColor: '#00A63E'
    },
    { 
      label: 'In Transit', 
      value: stats.inTransit.toLocaleString(), 
      icon: <ToyBikeIcon className="w-5 h-5" stroke="#3B82F6" />,
      bgColor: '#DBEAFE',
      valueColor: '#3B82F6'
    },
    { 
      label: 'Pending', 
      value: stats.pending.toLocaleString(), 
      icon: <ClockIcon className="w-5 h-5" stroke="#F59E0B" />,
      bgColor: '#FEF3C7',
      valueColor: '#F59E0B'
    }
  ];

  const filteredOrders = orders.filter(order => {
    const orderId = order.deliveryId || order._id || order.id || '';
    const customerName = order.customer?.name || order.customerName || '';
    const driverName = order.driver?.name || order.driverName || order.rider?.name || '';
    
    const matchesSearch = !searchQuery || 
      orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driverName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const orderStatus = (order.status || '').toLowerCase().replace('_', ' ').replace('-', ' ');
    const matchesStatus = statusFilter === 'All Status' || 
      orderStatus === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getDeliveryStatus = (order) => {
    const status = (order.status || 'pending').toLowerCase();
    
    if (status === 'delivered' || status === 'completed') {
      return { status: 'Delivered', color: 'bg-green-100 text-green-800' };
    }
    if (status === 'in_transit' || status === 'in-transit' || status === 'picked_up') {
      return { status: 'In Transit', color: 'bg-blue-100 text-blue-800' };
    }
    if (status === 'pending' || status === 'awaiting_pickup') {
      return { status: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (status === 'cancelled' || status === 'canceled') {
      return { status: 'Cancelled', color: 'bg-red-100 text-red-800' };
    }
    return { 
      status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '), 
      color: 'bg-gray-100 text-gray-800' 
    };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'N/A', time: '' };
    
    try {
      const date = new Date(dateString);
      const dateStr = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      return { date: dateStr, time: timeStr };
    } catch (e) {
      return { date: 'N/A', time: '' };
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return `${Number(amount).toLocaleString()}`;
  };

  const formatDistance = (distance) => {
    if (!distance && distance !== 0) return 'N/A';
    return `${Number(distance).toFixed(1)} km`;
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchDeliveries(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchDeliveries(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    fetchDeliveries(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-no-padding">
          <div className="mb-8">
            <YummyText className="text-3xl font-medium text-[#1E1E1E] mb-2">Manage Orders</YummyText>
            <YummyText className="text-[#717182]">View and manage all delivery orders</YummyText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col items-start">
                  <div
                    className="p-2 rounded-lg mb-3"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    {stat.icon}
                  </div>
                  <YummyText className="text-sm text-gray-500 mb-1">{stat.label}</YummyText>
                  <YummyText className="text-3xl font-medium" style={{ color: stat.valueColor }}>{stat.value}</YummyText>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={() => fetchDeliveries(currentPage)}
                className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <YummyText className="text-medium font-medium text-gray-900">All Orders</YummyText>
                  <YummyText className="text-xs text-gray-500">
                    {loading ? 'Loading...' : `Showing ${filteredOrders.length} of ${totalOrders} orders`}
                  </YummyText>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>All Status</option>
                    <option>Delivered</option>
                    <option>In Transit</option>
                    <option>Pending</option>
                  </select>
                </div>
              </div>
            </div>

            <YummyText>
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="border-b border-gray-100 sticky top-0 bg-white z-10">
                        <tr>
                          <th className="w-[9%] px-2 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="w-[11%] px-3 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="w-[11%] px-4 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                            Rider
                          </th>
                          <th className="w-[22%] px-3 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                            Route
                          </th>
                          <th className="w-[9%] px-2 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                            Distance
                          </th>
                          <th className="w-[9%] px-3 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="w-[11%] px-6 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                            Status
                          </th>
                          <th className="w-[13%] px-6 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                            Date
                          </th>
                          <th className="w-[5%] px-0 py-3 text-left text-[10.5px] font-[500] text-[#0A0A0A] uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map((order, index) => {
                          const orderId = order.deliveryId || order._id || order.id || 'N/A';
                          const customerName = order.customer?.name || order.customerName || 'N/A';
                          const customerId = order.customer?.id || order.customerId || '';
                          const driverName = order.driver?.name || order.driverName || order.rider?.name || 'Unassigned';
                          const driverId = order.driver?.id || order.driverId || order.riderId || '';
                          const pickupAddress = order.pickupLocation?.address || order.pickupAddress || order.from || 'N/A';
                          const deliveryAddress = order.deliveryLocation?.address || order.deliveryAddress || order.to || 'N/A';
                          const distance = order.distance || 0;
                          const amount = order.price || order.amount || order.totalAmount || 0;
                          const deliveryStatus = getDeliveryStatus(order);
                          const dateTime = formatDateTime(order.createdAt || order.created_at || order.dateTime);
                          
                          return (
                            <tr key={order._id || order.id || index} className="hover:bg-gray-50 transition-colors">
                              <td className="w-[9%] px-2 py-4 whitespace-nowrap">
                                <YummyText className="text-[12px] font-medium text-gray-900">
                                  {orderId.length > 12 ? `${orderId.substring(0, 12)}...` : orderId}
                                </YummyText>
                              </td>
                              <td className="w-[11%] px-2 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <User className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                                  <div>
                                    <YummyText className="text-xs font-medium text-gray-900 truncate">{customerName}</YummyText>
                                    {customerId && (
                                      <YummyText className="text-xs text-gray-500 truncate">{customerId.substring(0, 8)}</YummyText>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="w-[11%] px-2 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Bike className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                                  <div>
                                    <YummyText className="text-xs font-medium text-gray-900 truncate">{driverName}</YummyText>
                                    {driverId && (
                                      <YummyText className="text-xs text-gray-500 truncate">{driverId.substring(0, 8)}</YummyText>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="w-[22%] px-2 py-4">
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-900">
                                    <span className="font-medium">From:</span>{' '}
                                    <span className="truncate inline-block max-w-[180px] align-bottom">
                                      {pickupAddress}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-900">
                                    <span className="font-medium">To:</span>{' '}
                                    <span className="truncate inline-block max-w-[180px] align-bottom">
                                      {deliveryAddress}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="w-[9%] px-2 py-4 whitespace-nowrap">
                                <YummyText className="text-xs text-gray-900">{formatDistance(distance)}</YummyText>
                              </td>
                              <td className="w-[9%] px-2 py-4 whitespace-nowrap">
                                <YummyText className="text-xs font-medium text-gray-900">{formatCurrency(amount)}</YummyText>
                              </td>
                              <td className="w-[11%] px-2 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${deliveryStatus.color}`}>
                                  {deliveryStatus.status}
                                </span>
                              </td>
                              <td className="w-[13%] px-2 py-4 whitespace-nowrap">
                                <div>
                                  <YummyText className="text-xs text-gray-900">{dateTime.date}</YummyText>
                                  <YummyText className="text-xs text-gray-500">{dateTime.time}</YummyText>
                                </div>
                              </td>
                              <td className="w-[5%] px-0 py-4 whitespace-nowrap text-left">
                                <button className="text-gray-400 hover:text-gray-600">
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </YummyText>

            {!loading && filteredOrders.length > 0 && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg border ${
                        currentPage === 1
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, idx) => (
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-3 py-1 text-gray-500">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageClick(page)}
                            className={`px-3 py-1 rounded-lg text-sm ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                    </div>

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg border ${
                        currentPage === totalPages
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default ManageOrders;
