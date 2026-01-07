import React, { useState, useEffect, useRef } from 'react';
import Infoicon from '../../../icons/Infoicon';
import { IonPage, IonContent, IonToast, useIonRouter } from '@ionic/react';
import StyledDropdown from '../../../components/StyledDropdown';
import GoogleMapsAutocomplete from '../../../components/GoogleMapsAutocomplete';
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
    pickupDate: '',
    recipientName: '',
    recipientPhone: '',
    deliveryStreet: '',
    recipientEmail: '',
    // New package sizing fields
    sizeCategory: 'small',
    weightCategory: 'light',
    // human-readable dimensions string, e.g. "30x30x30 cm"
    dimensions: '',
    // scale percentage for fine adjustment (50-150)
    sizeScale: 100,
    // optional explicit weight override (kg)
    weight: '',
    packageDescription: '',
    declaredValue: ''
    ,
    // optional upload and payment fields
    image: null,
    paymentMethod: '',
    paymentNotes: ''
  });

  const [pickupCoordinates, setPickupCoordinates] = useState({ lat: 0, lng: 0 });
  const [deliveryCoordinates, setDeliveryCoordinates] = useState({ lat: 0, lng: 0 });
  const [pickupAddressObj, setPickupAddressObj] = useState(null);
  const [deliveryAddressObj, setDeliveryAddressObj] = useState(null);

  const router = useIonRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showDeliveryTypeModal, setShowDeliveryTypeModal] = useState(false);
  const sliderRef = useRef(null);
  const hideBubbleTimeout = useRef(null);
  const [sliderBubble, setSliderBubble] = useState(null); // { percent, value }
  const [showFineTuneInfo, setShowFineTuneInfo] = useState(false);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Initialize dimensions and weightCategory based on defaults
  useEffect(() => {
    const weightMap = { small: 'light', big: 'heavy', very_big: 'very_heavy' };
    const dimsMap = { small: [30, 30, 30], big: [50, 40, 30], very_big: [80, 60, 50] };
    const base = dimsMap[formData.sizeCategory] || dimsMap.small;
    const factor = (formData.sizeScale || 100) / 100;
    const dims = `${Math.round(base[0] * factor)}×${Math.round(base[1] * factor)}×${Math.round(base[2] * factor)} cm`;
    setFormData(prev => ({ ...prev, dimensions: dims, weightCategory: weightMap[prev.sizeCategory] || 'light' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // determine weight string - use user input or default to category range
      const defaultWeightRanges = {
        light: '0-5 kg',
        heavy: '5-20 kg',
        very_heavy: '20+ kg'
      };
      const weightString = (formData.weight && formData.weight.trim() !== '')
        ? formData.weight.trim()
        : defaultWeightRanges[formData.weightCategory] || '0-5 kg';

      // If user typed an address but didn't select a place, try to geocode the typed string
      if (!pickupAddressObj && formData.pickupStreet && typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const res = await geocoder.geocode({ address: formData.pickupStreet });
          if (res.results && res.results.length > 0) {
            const result = res.results.find(r => r.types && r.types.some(t => ['street_address', 'premise', 'establishment', 'route', 'postal_town', 'locality'].includes(t))) || res.results[0];
            const components = result.address_components || [];
            const extract = (componentsList) => {
              const out = { streetNumber: '', route: '', premise: '', subpremise: '', name: '', city: '', state: '', postal_code: '', country: '' };
              componentsList.forEach(component => {
                const types = component.types || [];
                if (types.includes('street_number')) out.streetNumber = component.long_name;
                if (types.includes('route')) out.route = component.long_name;
                if (types.includes('premise')) out.premise = component.long_name;
                if (types.includes('subpremise')) out.subpremise = component.long_name;
                if (types.includes('establishment')) out.name = component.long_name;
                if (types.includes('locality') || types.includes('postal_town')) {
                  if (!out.city) out.city = component.long_name;
                }
                if (types.includes('administrative_area_level_1')) out.state = component.long_name;
                if (types.includes('postal_code')) out.postal_code = component.long_name;
                if (types.includes('country')) out.country = component.long_name;
              });
              return out;
            };
            const c = extract(components);
            let streetLine = '';
            if (c.premise) streetLine = c.premise;
            else if (c.name) streetLine = c.name;
            else if (c.streetNumber || c.route) streetLine = [c.streetNumber, c.route].filter(Boolean).join(' ');
            else if (c.route) streetLine = c.route;
            if (!streetLine) streetLine = result.name || result.formatted_address || '';
            if (!c.city) {
              const alt = components.find(comp => comp.types && (comp.types.includes('administrative_area_level_2') || comp.types.includes('neighborhood') || comp.types.includes('sublocality_level_1')));
              if (alt) c.city = alt.long_name;
            }
            const placeResult = {
              street: streetLine || result.formatted_address,
              city: c.city || '',
              state: c.state || '',
              zipCode: c.postal_code || '',
              country: c.country || '',
              coordinates: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              },
              place_id: result.place_id,
            };
            setPickupAddressObj(placeResult);
            setPickupCoordinates(placeResult.coordinates || pickupCoordinates);
          }
        } catch (e) {
          console.warn('Geocode pickup failed', e);
        }
      }

      if (!deliveryAddressObj && formData.deliveryStreet && typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const res = await geocoder.geocode({ address: formData.deliveryStreet });
          if (res.results && res.results.length > 0) {
            const result = res.results.find(r => r.types && r.types.some(t => ['street_address', 'premise', 'establishment', 'route', 'postal_town', 'locality'].includes(t))) || res.results[0];
            const components = result.address_components || [];
            const extract = (componentsList) => {
              const out = { streetNumber: '', route: '', premise: '', subpremise: '', name: '', city: '', state: '', postal_code: '', country: '' };
              componentsList.forEach(component => {
                const types = component.types || [];
                if (types.includes('street_number')) out.streetNumber = component.long_name;
                if (types.includes('route')) out.route = component.long_name;
                if (types.includes('premise')) out.premise = component.long_name;
                if (types.includes('subpremise')) out.subpremise = component.long_name;
                if (types.includes('establishment')) out.name = component.long_name;
                if (types.includes('locality') || types.includes('postal_town')) {
                  if (!out.city) out.city = component.long_name;
                }
                if (types.includes('administrative_area_level_1')) out.state = component.long_name;
                if (types.includes('postal_code')) out.postal_code = component.long_name;
                if (types.includes('country')) out.country = component.long_name;
              });
              return out;
            };
            const c = extract(components);
            let streetLine = '';
            if (c.premise) streetLine = c.premise;
            else if (c.name) streetLine = c.name;
            else if (c.streetNumber || c.route) streetLine = [c.streetNumber, c.route].filter(Boolean).join(' ');
            else if (c.route) streetLine = c.route;
            if (!streetLine) streetLine = result.name || result.formatted_address || '';
            if (!c.city) {
              const alt = components.find(comp => comp.types && (comp.types.includes('administrative_area_level_2') || comp.types.includes('neighborhood') || comp.types.includes('sublocality_level_1')));
              if (alt) c.city = alt.long_name;
            }
            const placeResult = {
              street: streetLine || result.formatted_address,
              city: c.city || '',
              state: c.state || '',
              zipCode: c.postal_code || '',
              country: c.country || '',
              coordinates: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              },
              place_id: result.place_id,
            };
            setDeliveryAddressObj(placeResult);
            setDeliveryCoordinates(placeResult.coordinates || deliveryCoordinates);
          }
        } catch (e) {
          console.warn('Geocode delivery failed', e);
        }
      }

      const pickupAddrRaw = pickupAddressObj ? {
        street: pickupAddressObj.street || '',
        city: pickupAddressObj.city || '',
        state: pickupAddressObj.state || pickupAddressObj.country || pickupAddressObj.city || '',
        zipCode: pickupAddressObj.zipCode || '',
        country: pickupAddressObj.country || '',
        coordinates: pickupAddressObj.coordinates || pickupCoordinates
      } : {
        street: formData.pickupStreet,
        city: '',
        state: '',
        zipCode: '',
        country: '',
        coordinates: pickupCoordinates
      };

      const deliveryAddrRaw = deliveryAddressObj ? {
        street: deliveryAddressObj.street || '',
        city: deliveryAddressObj.city || '',
        state: deliveryAddressObj.state || deliveryAddressObj.country || deliveryAddressObj.city || '',
        zipCode: deliveryAddressObj.zipCode || '',
        country: deliveryAddressObj.country || '',
        coordinates: deliveryAddressObj.coordinates || deliveryCoordinates
      } : {
        street: formData.deliveryStreet,
        city: '',
        state: '',
        zipCode: '',
        country: '',
        coordinates: deliveryCoordinates
      };

      // Ensure required fields are non-empty to satisfy backend validation
      const { country: _pCountry, ...pickupNoCountry } = pickupAddrRaw;
      const pickupAddr = {
        ...pickupNoCountry,
        state: pickupAddrRaw.state || pickupAddrRaw.city || 'Unknown',
        zipCode: pickupAddrRaw.zipCode || '00000'
      };

      const { country: _dCountry, ...deliveryNoCountry } = deliveryAddrRaw;
      const deliveryAddr = {
        ...deliveryNoCountry,
        state: deliveryAddrRaw.state || deliveryAddrRaw.city || 'Unknown',
        zipCode: deliveryAddrRaw.zipCode || '00000'
      };

      const payload = {
        senderName: formData.senderName,
        senderPhone: formData.senderPhone,
        pickupDate: formData.pickupDate,
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        recipientEmail: formData.recipientEmail,
        pickupAddress: pickupAddr,
        deliveryAddress: deliveryAddr,
        packageDetails: {
          sizeCategory: formData.sizeCategory,
          weightCategory: formData.weightCategory,
          weight: weightString,
          dimensions: formData.dimensions || `${Math.round(30 * (formData.sizeScale / 100))}×${Math.round(30 * (formData.sizeScale / 100))}×${Math.round(30 * (formData.sizeScale / 100))} cm`,
          description: formData.packageDescription
        },
        payment: {
          method: formData.paymentMethod,
          notes: formData.paymentNotes
        }
      };

      let response;
      if (formData.image) {
        const fd = new FormData();
        fd.append('image', formData.image);
        // Append payload fields individually so backend receives expected keys
        Object.entries(payload).forEach(([k, v]) => {
          if (v === undefined || v === null) {
            fd.append(k, '');
          } else if (typeof v === 'object') {
            fd.append(k, JSON.stringify(v));
          } else {
            fd.append(k, String(v));
          }
        });
        response = await createDelivery(fd);
      } else {
        response = await createDelivery(payload);
      }

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
                        Pickup Address
                      </label>
                      <GoogleMapsAutocomplete
                        value={formData.pickupStreet}
                        onChange={(value) => setFormData({ ...formData, pickupStreet: value })}
                        placeholder="Enter pickup address"
                        onPlaceSelect={(place) => {
                          setFormData(prev => ({ ...prev, pickupStreet: place.street || place.formatted_address || '' }));
                          setPickupCoordinates(place.coordinates || { lat: 0, lng: 0 });
                          setPickupAddressObj(place);
                        }}
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
                        Delivery Address
                      </label>
                      <GoogleMapsAutocomplete
                        value={formData.deliveryStreet}
                        onChange={(value) => setFormData({ ...formData, deliveryStreet: value })}
                        placeholder="Enter delivery address"
                        onPlaceSelect={(place) => {
                          setFormData(prev => ({ ...prev, deliveryStreet: place.street || place.formatted_address || '' }));
                          setDeliveryCoordinates(place.coordinates || { lat: 0, lng: 0 });
                          setDeliveryAddressObj(place);
                        }}
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

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#0F172A] mb-3">Package Size & Weight</label>

                  <div className="space-y-4">
                    {/* Size Category Selection */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">Size Category</label>
                      <StyledDropdown
                        value={
                          formData.sizeCategory === 'small' ? 'Small' :
                            formData.sizeCategory === 'big' ? 'Medium' :
                              formData.sizeCategory === 'very_big' ? 'Very Big' :
                                'Size Category'
                        }
                        onChange={(label) => {
                          const valueMap = { 'Small': 'small', 'Medium': 'big', 'Very Big': 'very_big' };
                          const cat = valueMap[label];
                          const weightMap = { small: 'light', big: 'heavy', very_big: 'very_heavy' };
                          const dimsMap = { small: [30, 30, 30], big: [50, 40, 30], very_big: [80, 60, 50] };
                          const base = dimsMap[cat];
                          const factor = (formData.sizeScale || 100) / 100;
                          const dims = `${Math.round(base[0] * factor)}×${Math.round(base[1] * factor)}×${Math.round(base[2] * factor)} cm`;
                          setFormData({
                            ...formData,
                            sizeCategory: cat,
                            weightCategory: weightMap[cat],
                            dimensions: dims
                          });
                        }}
                        options={['Small', 'Medium', 'Very Big']}
                        tooltips={{
                          'Small': 'Perfect for phones, books, or small gifts. Think shoe box size.',
                          'Medium': 'Great for laptops, clothes, or documents. About the size of a briefcase.',
                          'Very Big': 'For electronics or furniture parts. As big as a suitcase or larger.'
                        }}
                        className="w-full border-[1.5px] border-gray-200 rounded-full"
                        width="w-full"
                      />
                    </div>

                    {/* Size Adjustment Slider */}
                    <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-2xl p-5 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#00B75A]/10 flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="14" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                            </svg>
                          </div>
                          <label className="text-sm font-semibold text-[#0F172A]">Adjust Size</label>
                          <button
                            type="button"
                            onClick={() => setShowFineTuneInfo(v => !v)}
                            aria-label="Fine-tune info"
                            className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
                          >
                            <Infoicon width="14" height="14" stroke="#64748B" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00B75A]"></div>
                            <span className="text-xs font-medium text-[#00B75A]">{formData.dimensions || '30×30×30 cm'}</span>
                          </div>
                          <div className="w-px h-4 bg-gray-200"></div>
                          <span className="text-xs font-bold text-[#0F172A]">{formData.sizeScale}%</span>
                        </div>
                      </div>

                      {showFineTuneInfo && (
                        <div className="mb-4 p-4 rounded-xl bg-white border border-[#00B75A]/20 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#00B75A] to-[#00D68F] flex items-center justify-center shadow-sm">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[#0F172A] mb-2">Quick Size Adjustments</div>
                              <div className="space-y-1.5 text-xs text-[#64748B]">
                                <div className="flex items-start gap-2">
                                  <span className="text-[#00B75A] mt-0.5">→</span>
                                  <span>Drag the slider to fine-tune your package dimensions</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-[#00B75A] mt-0.5">→</span>
                                  <span>Real-time preview shows exact measurements</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-[#00B75A] mt-0.5">→</span>
                                  <span>Range from 70% to 130% of base size</span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowFineTuneInfo(false)}
                              className="flex-shrink-0 w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="relative px-1">
                        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-gradient-to-r from-gray-200 via-[#00B75A]/20 to-gray-200 rounded-full pointer-events-none"></div>

                        <input
                          ref={sliderRef}
                          type="range"
                          min="70"
                          max="130"
                          name="sizeScale"
                          value={formData.sizeScale}
                          onChange={(e) => {
                            const scale = parseInt(e.target.value, 10);
                            const dimsMap = { small: [30, 30, 30], big: [50, 40, 30], very_big: [80, 60, 50] };
                            const base = dimsMap[formData.sizeCategory] || dimsMap.small;
                            const factor = scale / 100;
                            const dims = `${Math.round(base[0] * factor)}×${Math.round(base[1] * factor)}×${Math.round(base[2] * factor)} cm`;
                            setFormData({ ...formData, sizeScale: scale, dimensions: dims });

                            try {
                              const min = 70;
                              const max = 130;
                              const percent = (scale - min) / (max - min);
                              setSliderBubble({ percent, value: scale });
                              if (hideBubbleTimeout.current) clearTimeout(hideBubbleTimeout.current);
                              hideBubbleTimeout.current = setTimeout(() => setSliderBubble(null), 1200);
                            } catch (err) {
                              // ignore
                            }
                          }}
                          onMouseMove={(e) => {
                            if (!sliderRef.current) return;
                            const val = parseInt(sliderRef.current.value, 10);
                            const min = 70; const max = 130;
                            const percent = (val - min) / (max - min);
                            setSliderBubble({ percent, value: val });
                          }}
                          onMouseLeave={() => {
                            if (hideBubbleTimeout.current) clearTimeout(hideBubbleTimeout.current);
                            hideBubbleTimeout.current = setTimeout(() => setSliderBubble(null), 800);
                          }}
                          className="w-full h-1.5 bg-transparent rounded-full appearance-none cursor-pointer slider relative z-10"
                          style={{
                            background: 'transparent',
                            WebkitAppearance: 'none',
                            appearance: 'none'
                          }}
                        />

                        {sliderBubble && (
                          <div
                            style={{ left: `${sliderBubble.percent * 100}%` }}
                            className="absolute -top-10 transform -translate-x-1/2 animate-in fade-in zoom-in duration-200"
                          >
                            <div className="relative">
                              <div className="px-3 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-lg shadow-lg">
                                {sliderBubble.value}%
                              </div>
                              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#0F172A] rotate-45"></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 px-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12h14M5 12l4-4M5 12l4 4" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="font-medium">Smaller</span>
                        </div>
                        <div className="px-3 py-1 bg-white rounded-full border border-gray-200 text-xs font-medium text-[#64748B]">
                          70% - 130%
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                          <span className="font-medium">Larger</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12H5M19 12l-4 4M19 12l-4-4" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>

                      <style jsx>{`
                        .slider::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: linear-gradient(135deg, #00B75A 0%, #00D68F 100%);
                          cursor: pointer;
                          border: 3px solid white;
                          box-shadow: 0 2px 8px rgba(0, 183, 90, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
                          transition: transform 0.2s ease, box-shadow 0.2s ease;
                        }
                        
                        .slider::-webkit-slider-thumb:hover {
                          transform: scale(1.15);
                          box-shadow: 0 4px 12px rgba(0, 183, 90, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05);
                        }
                        
                        .slider::-webkit-slider-thumb:active {
                          transform: scale(1.05);
                          box-shadow: 0 2px 8px rgba(0, 183, 90, 0.5), 0 0 0 2px rgba(0, 183, 90, 0.2);
                        }
                        
                        .slider::-moz-range-thumb {
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: linear-gradient(135deg, #00B75A 0%, #00D68F 100%);
                          cursor: pointer;
                          border: 3px solid white;
                          box-shadow: 0 2px 8px rgba(0, 183, 90, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
                          transition: transform 0.2s ease, box-shadow 0.2s ease;
                        }
                        
                        .slider::-moz-range-thumb:hover {
                          transform: scale(1.15);
                          box-shadow: 0 4px 12px rgba(0, 183, 90, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05);
                        }
                        
                        .slider::-moz-range-thumb:active {
                          transform: scale(1.05);
                          box-shadow: 0 2px 8px rgba(0, 183, 90, 0.5), 0 0 0 2px rgba(0, 183, 90, 0.2);
                        }
                      `}</style>
                    </div>

                    {/* Weight Category Selection */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">Weight Category</label>
                      <StyledDropdown
                        value={
                          formData.weightCategory === 'light' ? 'Light' :
                            formData.weightCategory === 'heavy' ? 'Heavy' :
                              formData.weightCategory === 'very_heavy' ? 'Very Heavy' :
                                'Weight Category'
                        }
                        onChange={(label) => {
                          const valueMap = { 'Light': 'light', 'Heavy': 'heavy', 'Very Heavy': 'very_heavy' };
                          setFormData({ ...formData, weightCategory: valueMap[label] });
                        }}
                        options={['Light', 'Heavy', 'Very Heavy']}
                        tooltips={{
                          'Light': 'Easy to carry with one hand. Under 5kg - like a few books or a laptop.',
                          'Heavy': 'Needs both hands to lift. 5-20kg - think microwave or bag of rice.',
                          'Very Heavy': 'Requires serious effort, maybe two people. Over 20kg - like furniture.'
                        }}
                        className="w-full border-[1.5px] border-gray-200 rounded-full"
                        width="w-full"
                      />
                    </div>

                    {/* Optional Specific Weight */}
                    <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-2xl p-5 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-[#00B75A]/10 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-semibold text-[#0F172A] block">
                            Exact Weight
                          </label>
                          <span className="text-xs text-[#64748B]">Optional • Leave blank to use category</span>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="e.g., 2.5 kg, 10 kg, or 5-8 kg"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00B75A] focus:border-transparent shadow-sm transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-[#64748B]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="10" stroke="#00B75A" strokeWidth="2" />
                          <path d="M12 16v-4M12 8h.01" stroke="#00B75A" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>Enter a specific weight or range if you know it. Otherwise, we'll use your selected weight category.</span>
                      </div>
                    </div>
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

                {/* Package Image Upload - Redesigned */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#0F172A] mb-3">Package Image (optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#00B75A] transition-colors cursor-pointer bg-[#F8F9FA]">
                    <input
                      type="file"
                      accept="image/*"
                      id="package-image-upload"
                      onChange={(e) => setFormData({ ...formData, image: e.target.files && e.target.files[0] ? e.target.files[0] : null })}
                      className="hidden"
                    />
                    <label htmlFor="package-image-upload" className="cursor-pointer flex flex-col items-center justify-center text-center">
                      {formData.image ? (
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#00B75A" />
                              </svg>
                              <span className="text-sm font-medium text-[#0F172A]">{formData.image.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setFormData({ ...formData, image: null });
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs text-[#64748B]">Click to change image</p>
                        </div>
                      ) : (
                        <>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#94A3B8" />
                          </svg>
                          <p className="text-sm font-medium text-[#0F172A] mb-1">Click to upload package image</p>
                          <p className="text-xs text-[#64748B]">PNG, JPG up to 10MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Payment Method - Redesigned */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#0F172A] mb-3">Payment Method</label>
                  <button
                    type="button"
                    onClick={() => setShowPaymentDrawer(true)}
                    className="w-full px-5 py-1 rounded-full  border-2 !border-[#1E1E1E] hover:border-[#00B75A] text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#00B75A] transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      {formData.paymentMethod === 'cash' && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#00B75A" />
                            </svg>
                          </div>
                          <span className="font-medium text-[#0F172A]">Cash on Delivery</span>
                        </>
                      )}
                      {formData.paymentMethod === 'card' && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="#00B75A" />
                            </svg>
                          </div>
                          <span className="font-medium text-[#0F172A]">Pay Online</span>
                        </>
                      )}
                      {formData.paymentMethod === 'transfer' && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="#00B75A" />
                            </svg>
                          </div>
                          <span className="font-medium text-[#0F172A]">Bank Transfer</span>
                        </>
                      )}
                      {!formData.paymentMethod && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="#94A3B8" />
                            </svg>
                          </div>
                          <span className="text-[#94A3B8]">Select payment method</span>
                        </>
                      )}
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
                      <path d="M9 5l7 7-7 7" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">Payment Notes (optional)</label>
                  <input
                    type="text"
                    name="paymentNotes"
                    value={formData.paymentNotes}
                    onChange={handleChange}
                    placeholder="Any notes for payment (e.g., teller/transfer details)"
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

        {/* Payment Method Drawer / Modal */}
        {showPaymentDrawer && (
          <div className="fixed inset-0 z-[9999]" onClick={() => setShowPaymentDrawer(false)}>
            <div className="absolute inset-0 bg-black/50" />

            {isMobile ? (
              <div
                className="absolute top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl animate-slide-in-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <YummyText className="text-xl font-semibold text-[#0F172A]">Select Payment Method</YummyText>
                  <button onClick={() => setShowPaymentDrawer(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 overflow-y-auto h-[calc(100%-88px)]">
                  <button
                    onClick={() => {
                      setFormData({ ...formData, paymentMethod: 'cash' });
                      setShowPaymentDrawer(false);
                    }}
                    className={`w-full p-4 rounded-xl border-2 mb-4 transition-all ${formData.paymentMethod === 'cash'
                      ? 'border-[#00B75A] bg-[#F0FDF4]'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.paymentMethod === 'cash' ? 'bg-[#00B75A]' : 'bg-gray-100'
                        }`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill={formData.paymentMethod === 'cash' ? 'white' : '#64748B'} />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-[#0F172A] mb-1">Cash on Delivery</div>
                        <div className="text-sm text-[#64748B]">Pay with cash when your package is delivered</div>
                      </div>
                      {formData.paymentMethod === 'cash' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#00B75A" />
                        </svg>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setFormData({ ...formData, paymentMethod: 'card' });
                      setShowPaymentDrawer(false);
                    }}
                    className={`w-full p-4 rounded-xl border-2 mb-4 transition-all ${formData.paymentMethod === 'card'
                      ? 'border-[#00B75A] bg-[#F0FDF4]'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.paymentMethod === 'card' ? 'bg-[#00B75A]' : 'bg-gray-100'
                        }`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill={formData.paymentMethod === 'card' ? 'white' : '#64748B'} />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-[#0F172A] mb-1">Pay Online</div>
                        <div className="text-sm text-[#64748B]">Secure payment via Paystack (Visa, Mastercard, Verve)</div>
                        <div className="flex items-center gap-2 mt-2">
                          <img src="https://cdn.paystack.co/img/visa.svg" alt="Visa" className="h-6" />
                          <img src="https://cdn.paystack.co/img/mastercard.svg" alt="Mastercard" className="h-6" />
                          <img src="https://cdn.paystack.co/img/verve.svg" alt="Verve" className="h-6" />
                        </div>
                      </div>
                      {formData.paymentMethod === 'card' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#00B75A" />
                        </svg>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setFormData({ ...formData, paymentMethod: 'transfer' });
                      setShowPaymentDrawer(false);
                    }}
                    className={`w-full p-4 rounded-xl border-2 mb-4 transition-all ${formData.paymentMethod === 'transfer'
                      ? 'border-[#00B75A] bg-[#F0FDF4]'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.paymentMethod === 'transfer' ? 'bg-[#00B75A]' : 'bg-gray-100'
                        }`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill={formData.paymentMethod === 'transfer' ? 'white' : '#64748B'} />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-[#0F172A] mb-1">Bank Transfer</div>
                        <div className="text-sm text-[#64748B]">Transfer to our bank account and share proof</div>
                      </div>
                      {formData.paymentMethod === 'transfer' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#00B75A" />
                        </svg>
                      )}
                    </div>
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#3B82F6" />
                      </svg>
                      <div className="text-sm text-[#1E40AF]">
                        <div className="font-medium mb-1">Secure Payment</div>
                        <div>All card payments are processed securely through Paystack. Your payment information is encrypted and never stored on our servers.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-6" onClick={() => setShowPaymentDrawer(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <YummyText className="text-xl font-semibold text-[#0F172A]">Select Payment Method</YummyText>
                    <button onClick={() => setShowPaymentDrawer(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto max-h-[70vh]">
                    <button
                      onClick={() => {
                        setFormData({ ...formData, paymentMethod: 'cash' });
                        setShowPaymentDrawer(false);
                      }}
                      className={`w-full p-4 rounded-xl border-2 mb-4 transition-all ${formData.paymentMethod === 'cash'
                        ? 'border-[#00B75A] bg-[#F0FDF4]'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.paymentMethod === 'cash' ? 'bg-[#00B75A]' : 'bg-gray-100'
                          }`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill={formData.paymentMethod === 'cash' ? 'white' : '#64748B'} />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-[#0F172A] mb-1">Cash on Delivery</div>
                          <div className="text-sm text-[#64748B]">Pay with cash when your package is delivered</div>
                        </div>
                        {formData.paymentMethod === 'cash' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#00B75A" />
                          </svg>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setFormData({ ...formData, paymentMethod: 'card' });
                        setShowPaymentDrawer(false);
                      }}
                      className={`w-full p-4 rounded-xl border-2 mb-4 transition-all ${formData.paymentMethod === 'card'
                        ? 'border-[#00B75A] bg-[#F0FDF4]'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.paymentMethod === 'card' ? 'bg-[#00B75A]' : 'bg-gray-100'
                          }`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill={formData.paymentMethod === 'card' ? 'white' : '#64748B'} />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-[#0F172A] mb-1">Pay Online</div>
                          <div className="text-sm text-[#64748B]">Secure payment via Paystack (Visa, Mastercard, Verve)</div>
                          <div className="flex items-center gap-2 mt-2">
                            <img src="https://cdn.paystack.co/img/visa.svg" alt="Visa" className="h-6" />
                            <img src="https://cdn.paystack.co/img/mastercard.svg" alt="Mastercard" className="h-6" />
                            <img src="https://cdn.paystack.co/img/verve.svg" alt="Verve" className="h-6" />
                          </div>
                        </div>
                        {formData.paymentMethod === 'card' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#00B75A" />
                          </svg>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setFormData({ ...formData, paymentMethod: 'transfer' });
                        setShowPaymentDrawer(false);
                      }}
                      className={`w-full p-4 rounded-xl border-2 mb-4 transition-all ${formData.paymentMethod === 'transfer'
                        ? 'border-[#00B75A] bg-[#F0FDF4]'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.paymentMethod === 'transfer' ? 'bg-[#00B75A]' : 'bg-gray-100'
                          }`}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill={formData.paymentMethod === 'transfer' ? 'white' : '#64748B'} />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-[#0F172A] mb-1">Bank Transfer</div>
                          <div className="text-sm text-[#64748B]">Transfer to our bank account and share proof</div>
                        </div>
                        {formData.paymentMethod === 'transfer' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#00B75A" />
                          </svg>
                        )}
                      </div>
                    </button>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#3B82F6" />
                        </svg>
                        <div className="text-sm text-[#1E40AF]">
                          <div className="font-medium mb-1">Secure Payment</div>
                          <div>All card payments are processed securely through Paystack. Your payment information is encrypted and never stored on our servers.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CustomerLayout>
    </IonPage>
  );
};

export default Book;