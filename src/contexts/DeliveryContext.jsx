import React, { createContext, useContext, useState } from 'react';

const DeliveryContext = createContext();

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within DeliveryProvider');
  }
  return context;
};

export const DeliveryProvider = ({ children }) => {
  // All delivery orders (from customers)
  const [allOrders, setAllOrders] = useState([]);
  
  // Active deliveries assigned to riders
  const [activeDeliveries, setActiveDeliveries] = useState([
    {
      id: 'PKG-2401',
      customerId: 'CUST-101',
      riderId: 'RIDER-001',
      status: 'Package Picked Up',
      statusColor: 'bg-purple-100 text-purple-600',
      distance: '3.2 mi',
      time: '15 min',
      price: 'N2348.00',
      deliveryType: 'express',
      
      // Pickup details (from customer booking)
      pickupName: 'Central Mall',
      pickupAddress: '789 5th Avenue, NY 10001',
      pickupCoords: [-73.985428, 40.748817],
      pickupDate: '2025-11-20T14:30:00',
      senderName: 'John Store Manager',
      senderPhone: '+1 (555) 123-4567',
      
      // Delivery details (from customer booking)
      deliveryName: 'Sarah Mitchell',
      deliveryAddress: '123 Oak Street, Apt 4B, NY 10002',
      deliveryCoords: [-73.968285, 40.785091],
      recipientName: 'Sarah Mitchell',
      recipientPhone: '+1 (555) 987-6543',
      recipientEmail: 'sarah.mitchell@email.com',
      
      // Package details (from customer booking)
      size: 'Medium',
      weight: '2.5 kg',
      length: '30 cm',
      width: '20 cm',
      packageDescription: 'Electronics - Handle with care',
      declaredValue: '500.00',
      notes: 'Electronics - Handle with care',
      
      // Additional metadata
      createdAt: '2025-11-20T12:00:00',
      acceptedAt: '2025-11-20T12:15:00',
      pickedUpAt: '2025-11-20T13:00:00',
      estimatedDelivery: '2025-11-20T15:00:00'
    },
    {
      id: 'PKG-2403',
      customerId: 'CUST-102',
      riderId: 'RIDER-001',
      status: 'En Route to Pickup',
      statusColor: 'bg-blue-100 text-blue-600',
      distance: '1.8 mi',
      time: '8 min',
      price: 'N1200.00',
      deliveryType: 'standard',
      
      // Pickup details
      pickupName: 'Tech Store',
      pickupAddress: '555 Main Street, NY 10003',
      pickupCoords: [-73.991234, 40.731567],
      pickupDate: '2025-11-20T15:00:00',
      senderName: 'Mike Tech Store',
      senderPhone: '+1 (555) 234-5678',
      
      // Delivery details
      deliveryName: 'Mike Johnson',
      deliveryAddress: '456 Elm Avenue, NY 10004',
      deliveryCoords: [-73.978901, 40.722345],
      recipientName: 'Mike Johnson',
      recipientPhone: '+1 (555) 876-5432',
      recipientEmail: 'mike.johnson@email.com',
      
      // Package details
      size: 'Small',
      weight: '1.2 kg',
      length: '20 cm',
      width: '15 cm',
      packageDescription: 'Important documents',
      declaredValue: '100.00',
      notes: 'Documents',
      
      // Additional metadata
      createdAt: '2025-11-20T13:30:00',
      acceptedAt: '2025-11-20T13:45:00',
      pickedUpAt: null,
      estimatedDelivery: '2025-11-20T16:00:00'
    }
  ]);

  // Available orders for riders to accept
  const [availableOrders, setAvailableOrders] = useState([]);

  // Create new delivery order (called from customer Book page)
  const createDeliveryOrder = (orderData) => {
    const newOrder = {
      id: `PKG-${Date.now()}`,
      customerId: orderData.customerId || 'CUST-DEFAULT',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-600',
      createdAt: new Date().toISOString(),
      ...orderData
    };
    
    setAllOrders(prev => [...prev, newOrder]);
    setAvailableOrders(prev => [...prev, newOrder]);
    
    return newOrder;
  };

  // Rider accepts an order
  const acceptOrder = (orderId, riderId) => {
    const order = availableOrders.find(o => o.id === orderId);
    if (order) {
      const acceptedOrder = {
        ...order,
        riderId,
        status: 'Accepted',
        statusColor: 'bg-green-100 text-green-600',
        acceptedAt: new Date().toISOString()
      };
      
      setActiveDeliveries(prev => [...prev, acceptedOrder]);
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  // Update delivery status
  const updateDeliveryStatus = (orderId, newStatus, statusColor) => {
    setActiveDeliveries(prev =>
      prev.map(delivery =>
        delivery.id === orderId
          ? { ...delivery, status: newStatus, statusColor }
          : delivery
      )
    );
  };

  // Complete delivery
  const completeDelivery = (orderId) => {
    const delivery = activeDeliveries.find(d => d.id === orderId);
    if (delivery) {
      const completedDelivery = {
        ...delivery,
        status: 'Delivered',
        statusColor: 'bg-green-100 text-green-600',
        deliveredAt: new Date().toISOString()
      };
      
      setActiveDeliveries(prev => prev.filter(d => d.id !== orderId));
      // Could add to completedDeliveries array if needed
    }
  };

  const value = {
    allOrders,
    activeDeliveries,
    availableOrders,
    createDeliveryOrder,
    acceptOrder,
    updateDeliveryStatus,
    completeDelivery
  };

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
};
