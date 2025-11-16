import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';

const sideBottomShadow = {
  boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const Track = () => {
  const [trackingId, setTrackingId] = useState('');

  const handleTrack = (e) => {
    e.preventDefault();
    // Add tracking logic here
    console.log('Tracking:', trackingId);
  };

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8 py-2">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Track Your Package
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              Enter your tracking number to get real-time updates on your delivery.
            </div>
          </div>

          {/* Tracking Input */}
          <div className="bg-white p-8 rounded-2xl mb-8" style={sideBottomShadow}>
            <form onSubmit={handleTrack} className="max-w-2xl">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tracking Number
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter tracking number (e.g., PKG-2401)"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500 border-none"
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#00D68F] hover:bg-[#00B876] text-white rounded-xl transition-colors font-normal"
                >
                  Track Package
                </button>
              </div>
            </form>
          </div>

          {/* Tracking Result (placeholder) */}
          {trackingId && (
            <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] rounded-2xl p-8" style={sideBottomShadow}>
              <div className="text-xl font-normal text-[#0F172A] mb-6">
                Tracking Information
              </div>
              
              <div className="space-y-6">
                {/* Timeline */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-[#00D68F] rounded-full"></div>
                    <div className="w-0.5 h-16 bg-[#00D68F]"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#0F172A]">Package Picked Up</div>
                    <div className="text-xs text-[#64748B]">Central Mall, 5th Ave</div>
                    <div className="text-xs text-[#94A3B8] mt-1">Today, 10:30 AM</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-[#00D68F] rounded-full"></div>
                    <div className="w-0.5 h-16 bg-gray-300"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#0F172A]">In Transit</div>
                    <div className="text-xs text-[#64748B]">On the way to destination</div>
                    <div className="text-xs text-[#94A3B8] mt-1">Today, 11:00 AM</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  </div>
                  <div className="flex-1 opacity-50">
                    <div className="text-sm font-medium text-[#0F172A]">Out for Delivery</div>
                    <div className="text-xs text-[#64748B]">Estimated arrival in 15 min</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default Track;
