import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast, useIonRouter } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';
import './Book.css';
import { createDelivery, isAuthenticated, getDeliveryById } from '../../../utils/authApi';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const Book = () => {
  const [formData, setFormData] = useState({
    deliveryType: '',
    senderName: '',
    senderPhone: '',
    pickupStreet: '',
    pickupCity: '',
    pickupState: '',
    pickupZipCode: '',
    pickupDate: '',
    recipientName: '',
    recipientPhone: '',
    deliveryStreet: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryZipCode: '',
    recipientEmail: '',
    weight: '',
    length: '',
    width: '',
    packageDescription: '',
    declaredValue: ''
  });

  const router = useIonRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      setToastMsg('Please log in to book a delivery');
      setShowToast(true);
      setTimeout(() => {
        router.push('/auth/customer/login', 'root', 'replace');
      }, 2000);
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitAsync = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Match the exact API structure based on validation errors
      const payload = {
        pickupAddress: {
          street: formData.pickupStreet,
          city: formData.pickupCity,
          state: formData.pickupState,
          zipCode: formData.pickupZipCode || '00000', // Default if not provided
          coordinates: { lat: 0, lng: 0 }
        },
        deliveryAddress: {
          street: formData.deliveryStreet,
          city: formData.deliveryCity,
          state: formData.deliveryState,
          zipCode: formData.deliveryZipCode || '00000', // Default if not provided
          coordinates: { lat: 0, lng: 0 }
        },
        packageDetails: {
          description: formData.packageDescription,
          weight: parseFloat(formData.weight) || 0,
          dimensions: `${formData.length}x${formData.width}x0` // Format as string: "length x width x height"
        }
      };
      
      console.log('[Book] Submitting payload:', payload);
      const response = await createDelivery(payload);
      console.log('[Book] Delivery created:', response);
      
      // create delivery and attempt to fetch canonical object
      const created = await createDelivery(payload);
      let createdDelivery = created;
      const createdId = created?.id || created?._id || created?.data?.id || created?.deliveryId || null;
      if (createdId) {
        try {
          const fetched = await getDeliveryById(createdId);
          if (fetched) createdDelivery = fetched;
        } catch (e) {
          console.warn('[Book] Failed to fetch created delivery by id', e);
        }
      }

      setToastMsg('Delivery booked successfully');
      setShowToast(true);
      setTimeout(() => {
        router.push('/customer/deliveries', 'root', 'replace');
      }, 1500);
    } catch (err) {
      console.error('Create delivery failed', err);
      
      // Show detailed error message
      if (err?.data?.errors && Array.isArray(err.data.errors)) {
        const errorMessages = err.data.errors.map(e => `${e.field}: ${e.message}`).join('; ');
        setToastMsg(`Validation error: ${errorMessages}`);
      } else {
        setToastMsg(err?.message || 'Failed to book delivery');
      }
      
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
    // Signal MyDeliveries to refresh when user arrives and provide the created delivery for optimistic insert
    try {
      localStorage.setItem('deliveries_refresh', Date.now().toString());
      window.dispatchEvent(new Event('deliveries:refresh'));
      window.dispatchEvent(new CustomEvent('delivery:created', { detail: createdDelivery }));
    } catch (e) {
      // ignore
    }
  };

  const saveDraftAsync = async () => {
    setIsSubmitting(true);
    try {
      const draftsRaw = localStorage.getItem('delivery_drafts');
      const drafts = draftsRaw ? JSON.parse(draftsRaw) : [];
      drafts.push({ 
        id: `draft-${Date.now()}`, 
        data: formData, 
        createdAt: new Date().toISOString() 
      });
      localStorage.setItem('delivery_drafts', JSON.stringify(drafts));
      setToastMsg('Draft saved locally');
      setShowToast(true);
    } catch (e) {
      setToastMsg('Failed to save draft');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    const baseRate = getBaseRate();
    const insurance = getInsurance();
    return baseRate + insurance;
  };

  const getBaseRate = () => {
    switch(formData.deliveryType) {
      case 'express':
        return 2500;
      case 'standard':
        return 1200;
      case 'economy':
        return 800;
      default:
        return 0;
    }
  };

  const getInsurance = () => {
    // Note: API doesn't accept declaredValue, so insurance calculation is for display only
    const declaredValue = parseFloat(formData.declaredValue) || 0;
    return declaredValue > 0 ? Math.max(declaredValue * 0.01, 200) : 0;
  };

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
          />

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

          <form onSubmit={handleSubmitAsync}>
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
                  <div className="relative mt-3 custom-dropdown-container">
                    <select
                      name="deliveryType"
                      value={formData.deliveryType}
                      onChange={handleChange}
                      className="custom-select w-full px-5 py-3 pr-12 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      required
                    >
                      <option value="">Select delivery type</option>
                      <option value="express">Express (Same day) - ₦2500</option>
                      <option value="standard">Standard (1-2 days) - ₦1200</option>
                      <option value="economy">Economy (3-5 days) - ₦800</option>
                    </select>
                  </div>
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

                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="senderPhone"
                          value={formData.senderPhone}
                          onChange={handleChange}
                          placeholder="+234 800 000 0000"
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="pickupStreet"
                          value={formData.pickupStreet}
                          onChange={handleChange}
                          placeholder="123 Main Street"
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-[#0F172A] mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            name="pickupCity"
                            value={formData.pickupCity}
                            onChange={handleChange}
                            placeholder="Lagos"
                            className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#0F172A] mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            name="pickupState"
                            value={formData.pickupState}
                            onChange={handleChange}
                            placeholder="Lagos State"
                            className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Zip/Postal Code
                        </label>
                        <input
                          type="text"
                          name="pickupZipCode"
                          value={formData.pickupZipCode}
                          onChange={handleChange}
                          placeholder="100001"
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Pickup Date
                        </label>
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

                  {/* Delivery Details */}
                  <div>
                    <div className="text-base font-sm text-[#0F172A] mb-4">
                      Delivery Details
                      <div className="border-t border-gray-300 mt-2"></div>
                    </div>

                    <div className="space-y-4">
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

                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="recipientPhone"
                          value={formData.recipientPhone}
                          onChange={handleChange}
                          placeholder="+234 800 000 0000"
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="deliveryStreet"
                          value={formData.deliveryStreet}
                          onChange={handleChange}
                          placeholder="456 Oak Avenue"
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-[#0F172A] mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            name="deliveryCity"
                            value={formData.deliveryCity}
                            onChange={handleChange}
                            placeholder="Abuja"
                            className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#0F172A] mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            name="deliveryState"
                            value={formData.deliveryState}
                            onChange={handleChange}
                            placeholder="FCT"
                            className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Zip/Postal Code
                        </label>
                        <input
                          type="text"
                          name="deliveryZipCode"
                          value={formData.deliveryZipCode}
                          onChange={handleChange}
                          placeholder="900001"
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                          required
                        />
                      </div>

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

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Declared Value (₦)
                      <span className="text-xs text-gray-500 ml-2">(For insurance calculation only)</span>
                    </label>
                    <input
                      type="number"
                      name="declaredValue"
                      value={formData.declaredValue}
                      onChange={handleChange}
                      placeholder="10000.00"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                      <span className="text-[15px]">₦{getBaseRate().toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[#0F172A]">
                      <span className="text-[15px]">Insurance (1% of declared value)</span>
                      <span className="text-[15px]">₦{getInsurance().toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-[#0F172A]">Total</span>
                        <span className="text-2xl font-medium text-[#00B75A]">₦{calculateTotal().toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 flex items-center justify-center gap-2 px-8 py-3 bg-[#00B75A] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00B876]'} text-white rounded-xl transition-colors font-medium text-[15px]`}
                  >
                    <img src="/blockicon-white.svg" alt="Book" className="w-5 h-5" />
                    {isSubmitting ? 'Booking...' : 'Book Delivery'}
                  </button>
                  <button
                    type="button"
                    onClick={saveDraftAsync}
                    disabled={isSubmitting}
                    className={`px-3 py-3 bg-white border border-gray-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} rounded-xl transition-colors text-[#0F172A] font-medium text-[15px]`}
                    style={{ border: "1px solid #E5E7EB" }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save as Draft'}
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