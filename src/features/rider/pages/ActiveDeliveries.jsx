import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import TelephoneIcon from "../../../icons/Telephoneicon";
import ChatIcon from "../../../icons/Chaticon";
import MapboxMap from '../../../components/MapboxMap';
import { useDelivery } from '../../../contexts/DeliveryContext';
import './ActiveDeliveries.css';

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
  pickupCoords,
  pickupBorder,
  deliveryName,
  deliveryAddress,
  deliveryCoords,
  deliveryBorder,
  size,
  weight,
  notes,
  actionButtonText
}) => (
  <div className="bg-white rounded-2xl mb-6 overflow-hidden ml-0.5" style={sideBottomShadow}>
    {/* Header Section with Background */}
    <YummyText>
    <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] p-6">
      {/* Package ID, Status, and Price */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="text-lg font-normal text-[#0F172A]">{packageId}</div>
          <span className={`px-3 py-1 rounded-full text-xs font-normal ${statusColor}`}>
            {status}
          </span>
        </div>
        <div className="text-2xl font-normal text-[#00D68F]">{price}</div>
      </div>

      {/* Distance and Time */}
      <div className="text-base text-[#64748B] -mb-3">{distance} • Est. {time}</div>
    </div>
    </YummyText>

    {/* Main Content */}
    <div className="p-6">
      <YummyText>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Pickup Location */}
        <div className={`p-4 rounded-xl border-2 ${pickupBorder} bg-[#F9FAFB]`}>
          <div className="flex gap-3 mb-3">
            <div className="location-icon-container location-icon-pickup w-8 h-8 bg-[#00D68F] rounded-full flex items-center justify-center flex-shrink-0">
              <img src="/locationicon-white.svg" alt="Pickup" className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">Pickup Location</div>
              <div className="text-sm font-[500] text-[#0A0A0A] mb-1">{pickupName}</div>
              <div className="text-xs text-[#64748B]">{pickupAddress}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors"
              style={{border: "1px solid #E5E7EB"}}
            >
              <TelephoneIcon size={20} color="black" />
              Call
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors"
              style={{border: "2px solid #E5E7EB"}}
            >
              <img src="/paperplane-icon.svg" alt="Navigate" className="w-4 h-4" />
              Navigate
            </button>
          </div>
        </div>

        {/* Delivery Location */}
        <div className={`p-4 rounded-xl border-2 ${deliveryBorder} ${deliveryBorder === 'border-[#FF9500]' ? 'bg-[#FFF7ED]' : 'bg-gray-50'}`}>
          <div className="flex gap-3 mb-3">
            <div className="location-icon-container location-icon-delivery w-8 h-8 bg-[#FF9500] rounded-full flex items-center justify-center flex-shrink-0">
              <img src="/location-orange.svg" alt="Delivery" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">Delivery Location</div>
              <div className="text-sm font-[500] text-[#0A0A0A] mb-1">{deliveryName}</div>
              <div className="text-xs text-[#64748B]">{deliveryAddress}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors"
              style={{border: "2px solid #E5E7EB"}}
            >
              <TelephoneIcon size={20} color="black" />
              Call
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors"
              style={{border: "2px solid #E5E7EB"}}
            >
              <ChatIcon size={20} color="black" />
              Message
            </button>
          </div>
        </div>
      </div>
      </YummyText>

      {/* Package Details with Background */}
      <YummyText>
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
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
      </YummyText>

      {/* Map Section */}
      <div className="mb-4 w-full">
        <MapboxMap 
          pickupCoords={pickupCoords}
          deliveryCoords={deliveryCoords}
          height="300px"
          showRoute={true}
        />
      </div>

      {/* Action Buttons */}
      <YummyText>
      <div className="flex gap-3">
        <button className="flex-1 bg-[#00B75A] hover:bg-[#00B876] text-white py-2 rounded-xl transition-colors font-[300]">
          {actionButtonText}
        </button>
        <button className="px-6 py-2 bg-white hover:bg-gray-50 rounded-xl transition-colors text-[#0F172A] font-[300]"
          style={{border: "1px solid #0000001A"}}
        >
          Report Issue
        </button>
      </div>
      </YummyText>
    </div>
  </div>
);

const ActiveDeliveries = () => {
  const { activeDeliveries, updateDeliveryStatus } = useDelivery();

  // Use context data instead of hardcoded deliveries
  const deliveries = activeDeliveries;

  const handleStatusUpdate = (orderId, newStatus, statusColor) => {
    updateDeliveryStatus(orderId, newStatus, statusColor);
  };

  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <YummyText>
          <div className="mb-4 py-2">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Active Deliveries
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              Manage your ongoing deliveries
            </div>
          </div>
          </YummyText>

          {/* Deliveries List */}
          <div className="max-h-[900px] overflow-y-auto pr-2">
            {deliveries.length > 0 ? (
              deliveries.map((delivery) => (
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
                  pickupCoords={delivery.pickupCoords}
                  pickupBorder={delivery.status === 'Package Picked Up' ? 'border-[#E5E7EB]' : 'border-[#00D68F]'}
                  deliveryName={delivery.deliveryName}
                  deliveryAddress={delivery.deliveryAddress}
                  deliveryCoords={delivery.deliveryCoords}
                  deliveryBorder={delivery.status === 'Package Picked Up' ? 'border-[#FF9500]' : 'border-gray-200'}
                  size={delivery.size}
                  weight={delivery.weight}
                  notes={delivery.notes || delivery.packageDescription}
                  actionButtonText={delivery.status === 'En Route to Pickup' ? 'Arrived at Pickup' : 'Started Delivery'}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-5xl mb-4">📦</div>
                <div className="text-lg text-gray-500">No active deliveries</div>
                <div className="text-sm text-gray-400 mt-2">Accept orders from the Available Orders page</div>
              </div>
            )}
          </div>
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default ActiveDeliveries;