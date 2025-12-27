import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast, useIonRouter } from '@ionic/react';
import StyledDropdown from '../../../components/StyledDropdown';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';
import { createDelivery, isAuthenticated } from '../../../utils/authApi';

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
  const [showDeliveryTypeModal, setShowDeliveryTypeModal] = useState(false);

  const deliveryTypes = [
    { value: 'express', label: 'Express (Same day)', price: '₦2500' },
    { value: 'standard', label: 'Standard (1-2 days)', price: '₦1200' },
    { value: 'economy', label: 'Economy (3-5 days)', price: '₦800' }
  ];

  const selectedDeliveryType = deliveryTypes.find(t => t.value === formData.deliveryType);

  const handleDeliveryTypeSelect = (value) => {
    setFormData({ ...formData, deliveryType: value });
    setShowDeliveryTypeModal(false);
  };

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        pickupAddress: {
          street: formData.pickupStreet,
          city: formData.pickupCity,
          state: formData.pickupState,
          zipCode: formData.pickupZipCode || '00000',
          coordinates: { lat: 0, lng: 0 }
        },
        deliveryAddress: {
          street: formData.deliveryStreet,
          city: formData.deliveryCity,
          state: formData.deliveryState,
          zipCode: formData.deliveryZipCode || '00000',
          coordinates: { lat: 0, lng: 0 }
        },
        packageDetails: {
          description: formData.packageDescription,
          weight: parseFloat(formData.weight) || 0,
          dimensions: `${formData.length}x${formData.width}x0`
        }
      };

      const response = await createDelivery(payload);

      window.dispatchEvent(new Event('deliveries:refresh'));
      window.dispatchEvent(new CustomEvent('delivery:created', {
        detail: response?.data || response
      }));

      setToastMsg('Delivery booked successfully!');
      setShowToast(true);
      setTimeout(() => {
        router.push('/customer/deliveries', 'root', 'replace');
      }, 1500);
    } catch (err) {
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
  };

  const saveDraft = async () => {
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
    switch (formData.deliveryType) {
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
          <div className="mb-4 md:mb-8 mt-4 sm:mt-0 md:mt-0">
            <YummyText className="text-2xl md:text-3xl  font-medium text-[#0F172A] mb-2 text-left md:text-left">
              Book a Delivery
            </YummyText>
            <YummyText className="text-sm md:text-base text-[#4A5565] text-left md:text-left">
              Schedule a new shipment with ease
            </YummyText>
          </div>

          <div>
            <div className="bg-white rounded-2xl p-4 md:p-6 mb-6" style={sideBottomShadow}>
              {/* Section Title */}
              <div className="mb-4 md:mb-6">
                <YummyText className="text-lg md:text-xl font-normal text-[#0F172A] mb-1">
                  Delivery Information
                </YummyText>
                <YummyText className="text-xs md:text-sm text-[#64748B]">
                  Fill in the details below to schedule your delivery
                </YummyText>
              </div>

              {/* Delivery Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Delivery Type</label>
                <StyledDropdown
                  value={selectedDeliveryType?.label || 'Select delivery type'}
                  onChange={(label) => {
                    const selected = deliveryTypes.find(t => t.label === label);
                    if (selected) handleDeliveryTypeSelect(selected.value);
                  }}
                  options={deliveryTypes.map(t => t.label)}
                  className="w-full border-[1.5px] border-gray-200 rounded-full"
                  width="w-full"
                />
              </div>

              {/* Pickup & Delivery Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Pickup Details */}
                <div>
                  <div className="mb-4">
                    <YummyText className="text-base font-medium text-[#0F172A]">
                      Pickup Details
                    </YummyText>
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
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div>
                  <div className="mb-4">
                    <YummyText className="text-base font-medium text-[#0F172A]">
                      Delivery Details
                    </YummyText>
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
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-300 my-6"></div>

              {/* Package Details */}
              <div>
                <div className="mb-4 md:mb-6">
                  <YummyText className="text-lg md:text-xl font-medium text-[#0F172A]">
                    Package Details
                  </YummyText>
                  <div className="border-t border-gray-300 my-3 md:my-5"></div>
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
                      className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                      className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                      className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                    className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none resize-none"
                  ></textarea>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Declared Value (₦)
                    <span className="text-xs text-gray-500 ml-2 block md:inline">(For insurance)</span>
                  </label>
                  <input
                    type="number"
                    name="declaredValue"
                    value={formData.declaredValue}
                    onChange={handleChange}
                    placeholder="10000.00"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                  />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-[#F0FDF4] rounded-xl p-4 md:p-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[#0F172A]">
                    <span className="text-sm md:text-base">Base Rate</span>
                    <span className="text-sm md:text-base font-medium">₦{getBaseRate().toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#0F172A]">
                    <span className="text-sm md:text-base">Insurance (1%)</span>
                    <span className="text-sm md:text-base font-medium">₦{getInsurance().toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base md:text-lg font-medium text-[#0F172A]">Total</span>
                      <span className="text-xl md:text-2xl font-medium text-[#00B75A]">₦{calculateTotal().toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 md:px-8 py-3 bg-[#00B75A] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00B876]'} text-white rounded-xl transition-colors font-medium text-sm md:text-base`}
                >
                  <img src="/blockicon-white.svg" alt="Book" className="w-5 h-5" />
                  {isSubmitting ? 'Booking...' : 'Book Delivery'}
                </button>
                <button
                  onClick={saveDraft}
                  disabled={isSubmitting}
                  className={`w-full md:w-auto px-6 md:px-8 py-3 bg-white border border-gray-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} rounded-xl transition-colors text-[#0F172A] font-medium text-sm md:text-base`}
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </button>
              </div>
            </div>
          </div>
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default Book;