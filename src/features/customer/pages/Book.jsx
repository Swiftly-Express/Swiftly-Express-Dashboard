import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const Book = () => {
  const [formData, setFormData] = useState({
    deliveryType: '',
    senderName: '',
    senderPhone: '',
    pickupAddress: '',
    pickupDate: '',
    recipientName: '',
    recipientPhone: '',
    deliveryAddress: '',
    recipientEmail: '',
    weight: '',
    length: '',
    width: '',
    packageDescription: '',
    declaredValue: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking delivery:', formData);
    // Add booking logic here
  };

  const calculateTotal = () => {
    const baseRate = 25.00;
    const insurance = 5.00;
    return baseRate + insurance;
  };

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <YummyText>
            <div className="mb-8">
              <div className="text-3xl font-medium text-[#0F172A] mb-2">
                Book a Delivery
              </div>
              <div className="text-[#4A5565] text-[15px] font-[400]">
                Schedule a new shipment with ease
              </div>
            </div>
          </YummyText>

          <form onSubmit={handleSubmit}>
            {/* Single Combined Section */}
            <div className="bg-white rounded-2xl p-6 mb-6" style={sideBottomShadow}>
              <YummyText>
                <div className="mb-4">
                  <div className="text-xl font-normal text-[#0F172A] mb-1">
                    Delivery Information
                  </div>
                  <div className="text-sm text-[#64748B]">
                    Fill in the details below to schedule your delivery
                  </div>
                </div>
              </YummyText>

              {/* Delivery Type */}
              <YummyText>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#0F172A] mb-2">
                  Delivery Type
                </label>
                <select
                  name="deliveryType"
                  value={formData.deliveryType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                  required
                >
                  <option value="">Select delivery type</option>
                  <option value="express">Express (Same day) - ₦2500</option>
                  <option value="standard">Standard (1-2 days) - ₦1200</option>
                  <option value="economy">Economy (3-5 days) - ₦800</option>
                </select>
              </div>

              {/* Pickup Details & Delivery Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pickup Details */}
                <div>
                  <div className="text-base font-sm text-[#0F172A] mb-4">
                    Pickup Details
                    <div className="border-t border-gray-300 mt-2"></div>
                  </div>
                  

                  <div className="space-y-4">
                    {/* Sender Name */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Sender Name
                      </label>
                      <input
                        type="text"
                        name="senderName"
                        value={formData.senderName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="senderPhone"
                        value={formData.senderPhone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                        required
                      />
                    </div>

                    {/* Pickup Address */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Pickup Address
                      </label>
                      <textarea
                        name="pickupAddress"
                        value={formData.pickupAddress}
                        onChange={handleChange}
                        placeholder="123 Main Street, New York, NY 10001"
                        rows="3"
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none resize-none"
                        required
                      ></textarea>
                    </div>

                    {/* Pickup Date */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Pickup Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="pickupDate"
                          value={formData.pickupDate}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Delivery Details */}
                <div>
                  <div className="text-base font-sm text-[#0F172A] mb-4">
                    Delivery Details
                  <div className="border-t border-gray-300 mt-2"></div>
                  </div>

                  <div className="space-y-4">
                    {/* Recipient Name */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        name="recipientName"
                        value={formData.recipientName}
                        onChange={handleChange}
                        placeholder="Jane Smith"
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="recipientPhone"
                        value={formData.recipientPhone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                        required
                      />
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Delivery Address
                      </label>
                      <textarea
                        name="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={handleChange}
                        placeholder="456 Oak Avenue, Los Angeles, CA 90001"
                        rows="3"
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none resize-none"
                        required
                      ></textarea>
                    </div>

                    {/* Email (for notifications) */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Email (for notifications)
                      </label>
                      <input
                        type="email"
                        name="recipientEmail"
                        value={formData.recipientEmail}
                        onChange={handleChange}
                        placeholder="jane@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              </YummyText>

              <div className="border-t border-gray-300 my-5"></div>

              {/* Package Details */}
              <div>
                <YummyText>
                <div className="text-xl font-sm text-[#0F172A] mb-6">
                  Package Details
                  <div className="border-t border-gray-300 my-5"></div>
                </div>
                

                {/* Weight, Length, Width */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="2.5"
                      step="0.1"
                      className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      name="length"
                      value={formData.length}
                      onChange={handleChange}
                      placeholder="30"
                      className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      name="width"
                      value={formData.width}
                      onChange={handleChange}
                      placeholder="20"
                      className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      required
                    />
                  </div>
                </div>

                {/* Package Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Package Description
                  </label>
                  <textarea
                    name="packageDescription"
                    value={formData.packageDescription}
                    onChange={handleChange}
                    placeholder="Describe the contents of your package"
                    rows="4"
                    className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none resize-none"
                    required
                  ></textarea>
                </div>

                {/* Declared Value */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Declared Value ($)
                  </label>
                  <input
                    type="number"
                    name="declaredValue"
                    value={formData.declaredValue}
                    onChange={handleChange}
                    placeholder="100.00"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                    required
                  />
                </div>
                </YummyText>
              </div>

              {/* Cost Breakdown */}
              <YummyText>
              <div className="bg-[#F0FDF4] rounded-xl p-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[#0F172A]">
                    <span className="text-[15px]">Base Rate</span>
                    <span className="text-[15px]">${(25.00).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#0F172A]">
                    <span className="text-[15px]">Insurance</span>
                    <span className="text-[15px]">${(5.00).toFixed(2)}</span>
                  </div>
                  
                  {/* Divider for Total */}
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-[#0F172A]">Total</span>
                      <span className="text-2xl font-medium text-[#00B75A]">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-3 bg-[#00B75A] hover:bg-[#00B876] text-white rounded-xl transition-colors font-medium text-[15px]"
                >
                  <img src="/blockicon-white.svg" alt="Book" className="w-5 h-5" />
                  Book Delivery
                </button>
                <button
                  type="button"
                  className="px-3 py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-[#0F172A] font-medium text-[15px]"
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  Save as Draft
                </button>
              </div>
              </YummyText>
            </div>

            
          </form>
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default Book;