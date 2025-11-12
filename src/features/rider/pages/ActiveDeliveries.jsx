import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';

// Shadow only on left, right and bottom
const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const DeliveryCard = ({ 
  packageId, 
  status, 
  statusColor,
  distance, 
  time, 
  price,
  pickupName,
  pickupAddress,
  pickupBorder,
  deliveryName,
  deliveryAddress,
  deliveryBorder,
  size,
  weight,
  notes,
  actionButton,
  actionButtonText
}) => (
  <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100" style={sideBottomShadow}>
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="text-lg font-normal text-[#0F172A]">{packageId}</div>
        <span className={`px-3 py-1 rounded-full text-xs font-normal ${statusColor}`}>
          {status}
        </span>
      </div>
      <div className="text-2xl font-normal text-[#00D68F]">{price}</div>
    </div>

    <div className="text-xs text-[#64748B] mb-4">{distance} • Est. {time}</div>

    {/* Pickup and Delivery Locations */}
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Pickup Location */}
      <div className={`p-4 rounded-xl border-2 ${pickupBorder} bg-opacity-5`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-[#00D68F] rounded-full flex items-center justify-center">
            <img src="/icons/location.svg" alt="Pickup" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="text-xs text-[#64748B]">Pickup Location</div>
        </div>
        <div className="text-sm font-medium text-[#0F172A] mb-1">{pickupName}</div>
        <div className="text-xs text-[#64748B] mb-3">{pickupAddress}</div>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors">
            <img src="/icons/phone.svg" alt="Call" className="w-4 h-4" />
            Call
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors">
            <img src="/icons/navigation.svg" alt="Navigate" className="w-4 h-4" />
            Navigate
          </button>
        </div>
      </div>

      {/* Delivery Location */}
      <div className={`p-4 rounded-xl border-2 ${deliveryBorder} bg-opacity-5`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-[#FF9500] rounded-full flex items-center justify-center">
            <img src="/icons/location.svg" alt="Delivery" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="text-xs text-[#64748B]">Delivery Location</div>
        </div>
        <div className="text-sm font-medium text-[#0F172A] mb-1">{deliveryName}</div>
        <div className="text-xs text-[#64748B] mb-3">{deliveryAddress}</div>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors">
            <img src="/icons/phone.svg" alt="Call" className="w-4 h-4" />
            Call
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors">
            <img src="/icons/message.svg" alt="Message" className="w-4 h-4" />
            Message
          </button>
        </div>
      </div>
    </div>

    {/* Package Details */}
    <div className="mb-4">
      <div className="text-sm font-medium text-[#0F172A] mb-3">Package Details</div>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-xs text-[#64748B] mb-1">Size</div>
          <div className="text-sm text-[#0F172A] font-medium">{size}</div>
        </div>
        <div>
          <div className="text-xs text-[#64748B] mb-1">Weight</div>
          <div className="text-sm text-[#0F172A] font-medium">{weight}</div>
        </div>
        <div>
          <div className="text-xs text-[#64748B] mb-1">Notes</div>
          <div className="text-sm text-[#0F172A] font-medium">{notes}</div>
        </div>
      </div>
    </div>

    {/* Map Placeholder */}
    <div className="bg-gray-100 rounded-xl h-48 mb-4 flex items-center justify-center text-sm text-[#64748B]">
      Map View
    </div>

    {/* Action Buttons */}
    <div className="flex gap-3">
      <button className="flex-1 bg-[#00B75A] hover:bg-[#00B876] text-white py-3 rounded-xl transition-colors font-[300]">
        {actionButtonText}
      </button>
      <button className="px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-[#0F172A] font-[300]">
        Report Issue
      </button>
    </div>
  </div>
);

const ActiveDeliveries = () => {
  const deliveries = [
    {
      id: 'PKG-2401',
      status: 'Package Picked Up',
      statusColor: 'bg-purple-100 text-purple-600',
      distance: '3.2 mi',
      time: '15 min',
      price: '$24.50',
      pickupName: 'Central Mall',
      pickupAddress: '789 5th Avenue, NY 10001',
      pickupBorder: 'border-[#00D68F]',
      deliveryName: 'Sarah Mitchell',
      deliveryAddress: '123 Oak Street, Apt 4B, NY 10002',
      deliveryBorder: 'border-[#FF9500]',
      size: 'Medium',
      weight: '2.5 kg',
      notes: 'Electronics - Handle with care',
      actionButtonText: 'Started Delivery'
    },
    {
      id: 'PKG-2403',
      status: 'En Route to Pickup',
      statusColor: 'bg-blue-100 text-blue-600',
      distance: '1.8 mi',
      time: '8 min',
      price: '$18.00',
      pickupName: 'Tech Store',
      pickupAddress: '555 Main Street, NY 10003',
      pickupBorder: 'border-[#00D68F]',
      deliveryName: 'Mike Johnson',
      deliveryAddress: '456 Elm Avenue, NY 10004',
      deliveryBorder: 'border-gray-200',
      size: 'Small',
      weight: '1.2 kg',
      notes: 'Documents',
      actionButtonText: 'Arrived at Pickup'
    }
  ];

  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8 py-2">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Active Deliveries
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              Manage your ongoing deliveries
            </div>
          </div>

          {/* Deliveries List */}
          <div className="max-h-[900px] overflow-y-auto pr-2">
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                packageId={delivery.id}
                status={delivery.status}
                statusColor={delivery.statusColor}
                distance={delivery.distance}
                time={delivery.time}
                price={delivery.price}
                pickupName={delivery.pickupName}
                pickupAddress={delivery.pickupAddress}
                pickupBorder={delivery.pickupBorder}
                deliveryName={delivery.deliveryName}
                deliveryAddress={delivery.deliveryAddress}
                deliveryBorder={delivery.deliveryBorder}
                size={delivery.size}
                weight={delivery.weight}
                notes={delivery.notes}
                actionButtonText={delivery.actionButtonText}
              />
            ))}
          </div>
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default ActiveDeliveries;
