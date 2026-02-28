import React, { useState, useEffect, useRef } from 'react';
import Infoicon from '../../../icons/Infoicon';
import { IonPage, IonContent, IonToast, useIonRouter, IonIcon } from '@ionic/react';
import { wallet, informationCircleOutline } from 'ionicons/icons';
import VisaIcon from '../../../icons/Visa';
import MastercardIcon from '../../../icons/Mastercard';
import VerveIcon from '../../../icons/Verve';
import StyledDropdown from '../../../components/StyledDropdown';
import GoogleMapsAutocomplete from '../../../components/GoogleMapsAutocomplete';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';
import { createDelivery, isAuthenticated, cancelDelivery, getDeliveryEstimate, getCustomerProfile } from '../../../utils/authApi';
import { calculateDistance } from '../../../utils/pricing';
import SmartRideBooking from '../../smartride-booking/Smartride-Booking';
import socketService from '../../../services/socket.service';
import axios from 'axios';
import { getCookie, setCookie, setJSONCookie, getJSONCookie, deleteCookie } from '../../../utils/cookies';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';

// Create authenticated API client
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  withCredentials: true
});

// Add request interceptor to attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const riderToken = getCookie("rider_token");
    const customerToken = getCookie("customer_token");
    const adminToken = getCookie("admin_token");
    const authToken = getCookie("auth_token");

    const token = customerToken || adminToken || riderToken || authToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const Book = () => {
  const [formData, setFormData] = useState({
    deliveryType: 'express',
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showDeliveryTypeModal, setShowDeliveryTypeModal] = useState(false);
  const sliderRef = useRef(null);
  const hideBubbleTimeout = useRef(null);
  const [sliderBubble, setSliderBubble] = useState(null); // { percent, value }

  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [isMobile, setIsMobile] = useState(false);
  const [paymentHover, setPaymentHover] = useState(false);
  const [drawerHover, setDrawerHover] = useState('');

  const [isSpecialErrand, setIsSpecialErrand] = useState(false);
  const [waitingMinutes, setWaitingMinutes] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [appliedDeliveryTypeFee, setAppliedDeliveryTypeFee] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [isCaclulatingPrice, setIsCalculatingPrice] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null); // null | 'searching' | 'rider_found'
  const [assignedRider, setAssignedRider] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const deliveryTypes = [
    { value: 'express', label: 'Express (Same day)', price: '₦400' },
    { value: 'smart_ride', label: 'Smart Ride', price: '₦600' }
  ];

  const selectedDeliveryType = deliveryTypes.find(t => t.value === formData.deliveryType);

  const handleDeliveryTypeSelect = (value) => {
    // If user selected Smart Ride, open Smart Ride inline on this page
    if (value === 'smart_ride') {
      setFormData({ ...formData, deliveryType: value });
      setShowDeliveryTypeModal(false);
      // Reset Smart Ride states to ensure clean start
      setBookingStatus(null);
      setAssignedRider(null);
      // update URL so state is shareable
      try {
        const url = `${window.location.pathname}?delivery=smart_ride`;
        window.history.pushState({}, '', url);
      } catch (e) {
        // ignore
      }
      setShowSmartRide(true);
      return;
    }

    setFormData({ ...formData, deliveryType: value });
    setShowDeliveryTypeModal(false);
  };

  // Ensure delivery type fee applied immediately when user selects a type
  useEffect(() => {
    const dt = (formData.deliveryType || '').toString().toLowerCase();
    const fee = dt === 'express' ? 400 : (dt === 'smart_ride' ? 600 : 0);
    setAppliedDeliveryTypeFee(fee);
  }, [formData.deliveryType]);

  useEffect(() => {
    if (!isAuthenticated()) {
      setToastMsg('Please log in to book a delivery');
      setShowToast(true);
      setTimeout(() => {
        router.push('/auth/customer/login', 'root', 'replace');
      }, 2000);
    }

    // Listen for postMessage from payment callback popup
    const handlePaymentMessage = (event) => {
      console.log('[Book] Received postMessage:', event.data);
      if (event.data?.type === 'PAYMENT_REDIRECT') {
        const targetUrl = event.data.url || event.data.fullUrl;
        console.log('[Book] Payment redirect requested to:', targetUrl);
        if (targetUrl) {
          // Extract path from full URL if needed
          const path = targetUrl.startsWith('http') ? new URL(targetUrl).pathname + new URL(targetUrl).search : targetUrl;
          console.log('[Book] Navigating to:', path);
          router.push(path, 'root', 'replace');
        }
      }
    };

    window.addEventListener('message', handlePaymentMessage);
    return () => window.removeEventListener('message', handlePaymentMessage);
  }, [router]);

  // Inline SmartRide state: open if ?delivery=smart_ride present
  const [showSmartRide, setShowSmartRide] = useState(false);

  // Restore form data when returning from Smart Ride (user switched delivery type to Express)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('booking_form_data');
      if (!raw) return;
      const data = JSON.parse(raw);
      sessionStorage.removeItem('booking_form_data');

      setFormData(prev => ({
        ...prev,
        deliveryType: data.deliveryType === 'express' ? 'express' : prev.deliveryType,
        senderName: data.senderName ?? prev.senderName,
        senderPhone: data.senderPhone ?? prev.senderPhone,
        recipientName: data.recipientName ?? prev.recipientName,
        recipientPhone: data.recipientPhone ?? prev.recipientPhone,
        recipientEmail: data.recipientEmail ?? prev.recipientEmail,
        pickupStreet: data.pickupAddress ?? data.pickupStreet ?? prev.pickupStreet,
        deliveryStreet: data.deliveryAddress ?? data.deliveryStreet ?? prev.deliveryStreet,
        pickupDate: data.pickupDate ?? prev.pickupDate,
        sizeCategory: data.sizeCategory ?? prev.sizeCategory,
        weightCategory: data.weightCategory ?? prev.weightCategory,
        dimensions: data.dimensions ?? prev.dimensions,
        weight: data.weight ?? prev.weight,
        packageDescription: data.packageDescription ?? prev.packageDescription,
        paymentMethod: data.paymentMethod ?? prev.paymentMethod,
        paymentNotes: data.paymentNotes ?? prev.paymentNotes,
        image: data.image ?? prev.image,
        images: data.images ?? prev.images,
      }));

      if (data.pickupPlace?.coordinates) {
        setPickupAddressObj(data.pickupPlace);
        setPickupCoordinates({ lat: data.pickupPlace.coordinates.lat, lng: data.pickupPlace.coordinates.lng });
      }
      if (data.deliveryPlace?.coordinates) {
        setDeliveryAddressObj(data.deliveryPlace);
        setDeliveryCoordinates({ lat: data.deliveryPlace.coordinates.lat, lng: data.deliveryPlace.coordinates.lng });
      }
    } catch (e) {
      console.warn('[Book] Failed to restore booking_form_data from sessionStorage', e);
      try { sessionStorage.removeItem('booking_form_data'); } catch (e2) { }
    }
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('delivery') === 'smart_ride') setShowSmartRide(true);

    const onPop = () => {
      const p = new URLSearchParams(window.location.search);
      setShowSmartRide(p.get('delivery') === 'smart_ride');
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Cleanup socket listeners on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      try {
        const info = socketService._lastDeliveryListeners;
        if (info && info.handleAssigned) {
          socketService.off('delivery:assigned', info.handleAssigned);
          socketService.off('delivery:accepted', info.handleAssigned);
          socketService.off('delivery:status', info.handleAssigned);
          if (info.deliveryId) {
            socketService.leaveDelivery(info.deliveryId);
          }
          delete socketService._lastDeliveryListeners;
        }
      } catch (e) {
        console.warn('[Book] Failed to clean up socket listeners on unmount', e);
      }
    };
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

  // Auto-fill sender details from logged-in customer profile (Express & Smart Ride); fields remain editable
  useEffect(() => {
    const token = getCookie('customer_token') || getCookie('auth_token');
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await getCustomerProfile();
        if (cancelled) return;
        const user = res?.data?.user || res?.user;
        if (!user) return;

        const name = user.fullName || user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : '');
        const phone = user.phone || user.phoneNumber || '';
        const addr = user.address;
        const address = typeof addr === 'string' ? addr : (addr?.street || user.streetAddress || '');

        if (name || phone || address) {
          setFormData(prev => ({
            ...prev,
            ...(name && !prev.senderName && { senderName: name }),
            ...(phone && !prev.senderPhone && { senderPhone: phone }),
            ...(address && !prev.pickupStreet && { pickupStreet: address }),
          }));
        }
      } catch (e) {
        if (!cancelled) console.warn('[Book] Could not load customer profile for sender auto-fill:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => {
    const name = e.target.name;
    setFormData({
      ...formData,
      [name]: e.target.value
    });
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // Map API validation field paths to form field key and user-friendly message
  const getFieldErrorFromApi = (apiField, apiMessage) => {
    const lower = (apiField || '').toLowerCase();
    if (lower.includes('packagedetails.description')) return { key: 'packageDescription', msg: 'Please describe the contents of your package.' };
    if (lower.includes('pickupaddress')) return { key: 'pickupStreet', msg: 'Please enter or select a valid pickup address.' };
    if (lower.includes('deliveryaddress')) return { key: 'deliveryStreet', msg: 'Please enter or select a valid delivery address.' };
    if (lower.includes('sender') && lower.includes('name')) return { key: 'senderName', msg: 'Please enter the sender\'s name.' };
    if (lower.includes('sender') && (lower.includes('phone') || lower.includes('contact'))) return { key: 'senderPhone', msg: 'Please enter the sender\'s phone number.' };
    if (lower.includes('recipient') && lower.includes('name')) return { key: 'recipientName', msg: 'Please enter the recipient\'s name.' };
    if (lower.includes('recipient') && (lower.includes('phone') || lower.includes('contact'))) return { key: 'recipientPhone', msg: 'Please enter the recipient\'s phone number.' };
    if (lower.includes('pickup') && lower.includes('date')) return { key: 'pickupDate', msg: 'Please select a pickup date.' };
    if (lower.includes('description')) return { key: 'packageDescription', msg: 'Please describe the contents of your package.' };
    return { key: 'packageDescription', msg: apiMessage || 'Please check this field.' };
  };

  const handleSubmit = async () => {
    console.log('[Book] handleSubmit called', { paymentMethod: formData.paymentMethod });
    setIsSubmitting(true);
    setFieldErrors({});
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

      // Normalize payment method: cash_on_delivery → cash, ensure lowercase, default to cash
      let normalizedPaymentMethod = ((formData.paymentMethod || 'cash') + '').toString().toLowerCase().trim();
      if (normalizedPaymentMethod === 'cash_on_delivery' || normalizedPaymentMethod === 'cod' || !normalizedPaymentMethod) {
        normalizedPaymentMethod = 'cash';
      }

      const senderInfo = {
        name: (formData.senderName || '').trim() || undefined,
        phone: (formData.senderPhone || '').trim() || undefined,
      };
      const recipientInfo = {
        name: (formData.recipientName || '').trim() || undefined,
        phone: (formData.recipientPhone || '').trim() || undefined,
        email: (formData.recipientEmail || '').trim() || undefined,
      };
      const payload = {
        senderInfo: (senderInfo.name || senderInfo.phone) ? senderInfo : undefined,
        recipientInfo: (recipientInfo.name || recipientInfo.phone || recipientInfo.email) ? recipientInfo : undefined,
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
          method: normalizedPaymentMethod,
          notes: formData.paymentNotes
        },
        paymentMethod: normalizedPaymentMethod,
        method: normalizedPaymentMethod,
        deliveryType: formData.deliveryType
      };
      // Smart Ride only: customer can request a specific rider; Express goes to pool
      if (formData.deliveryType === 'smart_ride' && selectedRiderId) {
        payload.invitedDriver = selectedRiderId;
      }

      // If user selected online payment, create delivery record first (draft/pending),
      // then call payment initialize endpoint with the returned deliveryId.
      let response;
      const imageFiles = formData.images || (formData.image ? [formData.image] : []);
      if (imageFiles.length > 0) {
        const fd = new FormData();
        imageFiles.forEach(file => fd.append('images', file));
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
        console.log('[Book] createDelivery (FormData) response:', response);
      } else {
        response = await createDelivery(payload);
        console.log('[Book] createDelivery response:', response);
      }

      // If pay-online selected, initialize payment using deliveryId
      const deliveryId = response?.deliveryId || response?.id || response?._id || response?.data?.id || response?.data?._id || response?.data?.delivery?._id || response?.data?.delivery?.id || response?.data?.deliveryId;
      console.log('[Book] createDelivery response:', response);
      console.log('[Book] resolved deliveryId:', deliveryId);

      if (!deliveryId) {
        console.error('[Book] Missing deliveryId after createDelivery — aborting payment initialize', response);
        setToastMsg('Failed to create delivery before payment. Please try again.');
        setShowToast(true);
        setIsSubmitting(false);
        setIsProcessingPayment(false);
        return;
      }
      // Do not force payment initialization on booking for online/bank methods.
      // Only initialize payment here if an explicit `initiatePaymentOnBook` flag is set.
      // Default flow: create booking and redirect to My Deliveries where payment can be started.
      if (formData.paymentMethod === 'card' && formData.initiatePaymentOnBook) {
        try {
          setIsProcessingPayment(true);
          setToastMsg('Preparing payment...');
          setShowToast(true);

          // Open a popup synchronously to preserve user gesture (prevents popup blocker)
          let paymentWindow = null;
          try {
            paymentWindow = window.open('', '_blank');
            if (paymentWindow) paymentWindow.document.write('<p>Preparing payment...</p>');
          } catch (pwErr) {
            console.warn('[Book] Failed to open payment popup synchronously', pwErr);
            paymentWindow = null;
          }

          // In Book.jsx, when initializing payment:
          const initJson = await apiClient.post(`/api/payment/initialize/${deliveryId}`, {
            amount: calculateTotal(),
            currency: 'NGN',
            email: formData.recipientEmail || 'customer@swiftlyxpress.com',
            // prefer the global frontend callback route so Paystack returns straight to SPA
            callback_url: `${window.location.origin}/customer/payment/callback`,
            metadata: { deliveryId }
          });

          console.log('Payment initialization response (axios):', initJson);
          const initPayload = initJson?.data || initJson; // axios response -> .data is server payload
          console.log('Returned authorizationUrl (inspect):', initPayload?.data?.payment?.authorizationUrl || initPayload?.payment?.authorizationUrl || initPayload?.data?.authorizationUrl || initPayload?.authorizationUrl);

          // Backend returns shape like: { success: true, message: '', data: { payment: { id, amount, currency, status, authorizationUrl, reference } } }
          const paymentObj = initPayload?.data?.payment || initPayload?.payment || initPayload?.data;
          const paymentReference = paymentObj?.reference || paymentObj?.id || paymentObj?.paymentId || paymentObj?.referenceId;
          const authorizationUrl = paymentObj?.authorizationUrl || paymentObj?.authorization_url || paymentObj?.url || paymentObj?.payment_url;
          const paymentIdReturned = paymentObj?.id || paymentObj?.paymentId || paymentObj?._id || paymentObj?.reference;
          console.log('Parsed payment object:', { paymentObj, paymentReference, authorizationUrl, paymentIdReturned });

          if (!paymentReference && !authorizationUrl) {
            console.error('Payment initialize returned no reference or authorizationUrl:', initJson);
            setToastMsg('Failed to initialize payment. Please try again.');
            setShowToast(true);
            setIsProcessingPayment(false);
            setIsSubmitting(false);
            return;
          }

          // Store pending data in cookies (so callback/opened windows can access them)
          try {
            if (deliveryId) setCookie('pending_payment_delivery_id', String(deliveryId), 1);
            if (paymentIdReturned) setCookie('pending_payment_id', String(paymentIdReturned), 1);
          } catch (e) { /* ignore */ }

          // helper: cancel delivery if payment not completed
          const cleanupOnPaymentCancel = async (did) => {
            try {
              console.log('[Book] Payment window closed without completion for delivery:', did);
              // Don't cancel the booking - user can try paying again
            } catch (cleanupErr) {
              console.warn('[Book] Cleanup error:', cleanupErr);
            }
            try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { /* ignore */ }
            setIsProcessingPayment(false);
            setIsSubmitting(false);
            setToastMsg('Payment was not completed. Your booking is still pending. You can try paying again.');
            setShowToast(true);
          };

          // Dynamically import Paystack and open modal or navigate hosted checkout (prefer hosted authorizationUrl)
          try {
            const PaystackPop = (await import('@paystack/inline-js')).default;

            const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxx';
            console.log('Payment UI decision:', { authorizationUrl, paymentReference });

            // If backend provided hosted checkout URL, navigate the popup to it (preserves gesture)
            if (authorizationUrl) {
              console.log('Navigating payment popup to authorizationUrl');
              try {
                if (paymentWindow) {
                  paymentWindow.location.href = authorizationUrl;
                } else {
                  window.open(authorizationUrl, '_blank');
                }
                setIsProcessingPayment(false);
                // Redirect main window to My Deliveries so user sees the new delivery and can track it while paying in popup
                setTimeout(() => {
                  router.push('/customer/deliveries', 'root', 'replace');
                }, 400);
                // Payment will complete in popup; callback/success page will refresh deliveries
                return;
              } catch (navErr) {
                console.error('Failed to navigate popup to authorizationUrl:', navErr);
                // fallthrough to inline modal attempt
              }
            }

            // Fallback to inline modal if no hosted URL
            if (paymentReference) {
              // close the blank popup if it exists
              try { if (paymentWindow) paymentWindow.close(); } catch (e) { /* ignore */ }

              const handler = PaystackPop.setup({
                key: paystackPublicKey,
                email: formData.recipientEmail || 'customer@swiftlyxpress.com',
                amount: calculateTotal() * 100, // convert to kobo
                currency: 'NGN',
                ref: paymentReference,
                metadata: {
                  deliveryId,
                  custom_fields: [
                    {
                      display_name: 'Delivery ID',
                      variable_name: 'delivery_id',
                      value: deliveryId
                    }
                  ]
                },
                onSuccess: async (transaction) => {
                  console.log('Payment successful (inline):', transaction);
                  setToastMsg('Payment successful! Redirecting...');
                  setShowToast(true);

                  try {
                    // Ensure pending identifiers are stored so the success page can verify
                    try {
                      const pid = paymentReference || transaction?.reference || transaction?.trxref || transaction?.id;
                      if (pid) setCookie('pending_payment_id', String(pid), 1);
                      if (deliveryId) setCookie('pending_payment_delivery_id', String(deliveryId), 1);
                    } catch (e) { /* ignore */ }

                    // Close the Paystack iframe/modal if available
                    try {
                      if (handler && typeof handler.closeIframe === 'function') handler.closeIframe();
                      else if (handler && typeof handler.close === 'function') handler.close();
                    } catch (closeErr) {
                      console.warn('Failed to close Paystack iframe gracefully', closeErr);
                    }

                    // Redirect to the existing payment success page which performs verification
                    const pidEnc = encodeURIComponent(paymentReference || transaction?.reference || transaction?.trxref || '');
                    const didPart = deliveryId ? `&deliveryId=${encodeURIComponent(deliveryId)}` : '';
                    const target = `/customer/payment/success?paymentId=${pidEnc}${didPart}`;

                    setTimeout(() => {
                      router.push(target, 'root', 'replace');
                    }, 350);
                  } catch (err) {
                    console.error('Error handling inline paystack success:', err);
                    setIsProcessingPayment(false);
                    setIsSubmitting(false);
                  }
                },
                onCancel: async () => {
                  console.log('Payment cancelled by user');
                  // rollback delivery on cancel
                  try { await cleanupOnPaymentCancel(deliveryId); } catch (e) { console.warn(e); }
                }
              });

              console.log('Paystack handler created, opening iframe...');
              handler.openIframe();
              console.log('Paystack iframe opened successfully');
              setIsProcessingPayment(false);
            }
          } catch (paystackError) {
            console.error('Error loading Paystack:', paystackError);
            setToastMsg('Failed to load payment interface. Please try again.');
            setShowToast(true);
            setIsProcessingPayment(false);
            setIsSubmitting(false);
            return;
          }

          // Don't proceed with non-payment flow
          return;
        } catch (e) {
          console.error('Payment initialize error', e);
          setToastMsg(e.message || 'Payment initialization failed');
          setShowToast(true);
          // Close popup if it was opened and an error occurred
          try { if (paymentWindow && !paymentWindow.closed) paymentWindow.close(); } catch (closeErr) { /* ignore */ }
          setIsProcessingPayment(false);
          setIsSubmitting(false);
        }
      }

      // Non-card or fallback: finalize booking locally (already created)
      // NOTE: Payment is optional. We no longer force immediate online payment during booking.
      // Previously the code initialized Paystack and required payment before finalizing the booking.
      // Now we allow order creation without payment and users can pay later from My Deliveries.

      // If Smart Ride, join delivery room and listen for assignment events
      try {
        if ((formData.deliveryType || '').toString().toLowerCase() === 'smart_ride' && deliveryId) {
          setBookingStatus('searching');
          socketService.connect();
          socketService.onConnected(() => {
            try {
              socketService.joinRoom(`delivery:${deliveryId}`);
            } catch (e) { console.warn('[Book] joinRoom failed', e); }

            const handleAssigned = (payload) => {
              try {
                const dId = payload?.deliveryId || payload?.id || payload?._id || payload?.data?.deliveryId;
                if (String(dId) !== String(deliveryId)) return;
                const rider = payload?.rider || payload?.driver || payload?.assignedRider || payload?.data?.rider;
                setAssignedRider(rider || payload);
                setBookingStatus('rider_found');
                setToastMsg('A rider has accepted your delivery!');
                setShowToast(true);
              } catch (e) { console.warn('[Book] assigned handler error', e); }
            };

            // Listen for a few likely event names from backend
            socketService.on('delivery:assigned', handleAssigned);
            socketService.on('delivery:accepted', handleAssigned);
            socketService.on('delivery:status', handleAssigned);

            // Store cleanup on the socket instance so we can remove listeners later when navigating
            socketService._lastDeliveryListeners = { deliveryId, handleAssigned };
          });
        }
      } catch (e) {
        console.warn('[Book] socket join/listen error', e);
      }

      // Finalize booking locally (already created)
      window.dispatchEvent(new Event('deliveries:refresh'));
      window.dispatchEvent(new CustomEvent('delivery:created', {
        detail: response?.data || response
      }));

      // Clear form data from localStorage after successful delivery creation
      try {
        // Clear any persisted form data (if it exists)
        const keys = Object.keys(localStorage).filter(key =>
          key.includes('delivery_form') || key.includes('express_form')
        );
        keys.forEach(key => localStorage.removeItem(key));
        console.log('[Book] Cleared form data from localStorage after successful delivery creation');
      } catch (e) {
        console.warn('[Book] Failed to clear form data:', e);
      }

      setToastMsg('Delivery booked successfully! Redirecting to your deliveries…');
      setShowToast(true);
      // If Smart Ride, allow a short delay so socket may deliver assignment event
      const redirectDelay = (formData.deliveryType === 'smart_ride') ? 5000 : 600;
      setTimeout(() => {
        // cleanup socket listeners for this delivery to avoid leaks
        try {
          const info = socketService._lastDeliveryListeners;
          if (info && String(info.deliveryId) === String(deliveryId) && info.handleAssigned) {
            socketService.off('delivery:assigned', info.handleAssigned);
            socketService.off('delivery:accepted', info.handleAssigned);
            socketService.off('delivery:status', info.handleAssigned);
            try { socketService.leaveDelivery(deliveryId); } catch (e) { /* ignore */ }
            delete socketService._lastDeliveryListeners;
          }
        } catch (e) { /* ignore */ }

        router.push('/customer/deliveries', 'root', 'replace');
      }, redirectDelay);
    } catch (err) {
      const data = err?.response?.data || err?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const next = {};
        data.errors.forEach((e) => {
          const { key, msg } = getFieldErrorFromApi(e.field, e.message);
          if (key && msg) next[key] = msg;
        });
        setFieldErrors(next);
        setToastMsg('Please fix the errors below.');
      } else {
        setFieldErrors({});
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
      const draftsRaw = getJSONCookie('delivery_drafts');
      const drafts = draftsRaw ? draftsRaw : [];
      drafts.push({
        id: `draft-${Date.now()}`,
        data: formData,
        createdAt: new Date().toISOString()
      });
      setJSONCookie('delivery_drafts', drafts, 30);
      setToastMsg('Draft saved');
      setShowToast(true);
    } catch (e) {
      setToastMsg('Failed to save draft');
      setShowToast(true);
      setToastMsg('Failed to save draft');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch price estimation when relevant fields change
  useEffect(() => {
    const fetchEstimate = async () => {
      if (!pickupCoordinates?.lat || !deliveryCoordinates?.lat) {
        setEstimatedPrice(null);
        return;
      }

      setIsCalculatingPrice(true);
      try {
        const response = await getDeliveryEstimate({
          pickupLat: pickupCoordinates.lat,
          pickupLng: pickupCoordinates.lng,
          deliveryLat: deliveryCoordinates.lat,
          deliveryLng: deliveryCoordinates.lng,
          smartRide: formData.deliveryType === 'smart_ride',
          specialErrand: isSpecialErrand // Assuming this state exists or should be added
        });

        if (response && response.data) {
          // Store inner payload so we have estimatedPrice, distance, pricingBreakdown (backend is source of truth)
          const payload = response.data?.data ?? response.data;
          setEstimatedPrice(payload);
          setDistanceKm(payload.distance ?? response.data?.distance);
        }
      } catch (error) {
        console.error("Failed to fetch price estimate:", error);
        // Fallback or error handling? For now, maybe just log it.
        // We could potentially keep using local calculation as fallback if we wanted, 
        // but the goal is to align with backend.
      } finally {
        setIsCalculatingPrice(false);
      }
    };

    const debounceTimer = setTimeout(fetchEstimate, 500); // 500ms debounce
    return () => clearTimeout(debounceTimer);
  }, [pickupCoordinates, deliveryCoordinates, formData.deliveryType, isSpecialErrand]);

  // Fetch nearby riders only for Smart Ride when pickup location is set
  useEffect(() => {
    if (formData.deliveryType !== 'smart_ride') {
      setNearbyRiders([]);
      setNearbyPricing(null);
      setSelectedRiderId(null);
      return;
    }
    const lat = pickupCoordinates?.lat;
    const lng = pickupCoordinates?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number' || lat === 0 || lng === 0) {
      setNearbyRiders([]);
      setNearbyPricing(null);
      return;
    }
    let cancelled = false;
    setNearbyRidersLoading(true);
    getNearbyRiders({ lat, lng, radiusKm: 25, limit: 10 })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data || res?.data;
        setNearbyRiders(Array.isArray(data?.riders) ? data.riders : []);
        setNearbyPricing(data?.pricing || null);
      })
      .catch(() => {
        if (!cancelled) {
          setNearbyRiders([]);
          setNearbyPricing(null);
        }
      })
      .finally(() => {
        if (!cancelled) setNearbyRidersLoading(false);
      });
    return () => { cancelled = true; };
  }, [formData.deliveryType, pickupCoordinates?.lat, pickupCoordinates?.lng]);

  // Calculate distance whenever addresses change - KEEPING THIS FOR NOW BUT IS REDUNDANT WITH BACKEND RESPONSE potentially
  // If backend returns distance, we can use that.
  useEffect(() => {
    if (pickupCoordinates && deliveryCoordinates &&
      pickupCoordinates.lat !== 0 && deliveryCoordinates.lat !== 0) {
      const dist = calculateDistance(pickupCoordinates, deliveryCoordinates);
      // setDistanceKm(dist); // Let backend set this to be accurate
    } else {
      setDistanceKm(0);
    }
  }, [pickupCoordinates, deliveryCoordinates]);

  const getPricingBreakdown = () => {
    if (estimatedPrice) {
      const pb = estimatedPrice.pricingBreakdown;
      // Prefer backend breakdown so displayed price matches stored price after create
      if (pb && (estimatedPrice.estimatedPrice != null || pb.total != null)) {
        const total = Number(estimatedPrice.estimatedPrice ?? pb.total ?? 0);
        return {
          total,
          deliveryCharge: Number(pb.subtotal ?? total),
          baseFare: Number(pb.baseFare ?? 0),
          deliveryTypeFee: Number(pb.smartRideFee ?? 0),
          distance: Number(estimatedPrice.distance ?? 0),
          distanceCharge: Number(pb.distanceCharge ?? 0),
          perKmRate: 0,
          discountAmount: Number(pb.discount ?? 0),
          discountPercentage: pb.discount ? (total + pb.discount) > 0 ? Math.round((pb.discount / (total + pb.discount)) * 100) : 0 : 0,
          smartRideFee: Number(pb.smartRideFee ?? 0),
          errandFee: Number(pb.errandFee ?? 0)
        };
      }
      // Fallback if backend didn't return breakdown
      const deliveryTypeFee = appliedDeliveryTypeFee || 0;
      const distance = estimatedPrice.distance || 0;
      const baseFare = 500;
      const distanceCharge = distance > 2 ? (distance - 2) * 150 : 0;
      return {
        total: baseFare + distanceCharge + deliveryTypeFee,
        deliveryCharge: baseFare + distanceCharge + deliveryTypeFee,
        baseFare,
        deliveryTypeFee,
        distance,
        distanceCharge,
        perKmRate: 150,
        discountAmount: estimatedPrice.pricingBreakdown?.discountAmount || 0,
        discountPercentage: estimatedPrice.pricingBreakdown?.discountPercentage || 0,
        smartRideFee: 0,
        errandFee: 0
      };
    }
    return {
      total: 0,
      baseFare: 0,
      deliveryTypeFee: appliedDeliveryTypeFee || 0,
      deliveryCharge: appliedDeliveryTypeFee || 0,
      distance: 0,
      distanceCharge: 0,
      perKmRate: 0,
      discountAmount: 0,
      discountPercentage: 0,
      smartRideFee: 0,
      errandFee: 0
    };
  };

  const calculateTotal = () => {
    const pricing = getPricingBreakdown();
    // Use backend total when available so it matches the price stored when delivery is created
    if (pricing.total != null && pricing.total > 0) return pricing.total;

    const base = 500;
    const perKmRate = 150;
    const dtFee = Number(pricing.deliveryTypeFee || 0);
    const discount = Number(pricing.discountAmount || 0);
    const dist = (typeof distanceKm === 'number' && distanceKm > 0) ? Number(distanceKm) : Number(pricing.distance || 0);
    let distanceCharge = 0;
    if (dist > 2) distanceCharge = (dist - 2) * perKmRate;
    return Math.max(0, base + distanceCharge + dtFee - discount);
  };

  const getBaseRate = () => {
    // Logic for base rate display
    return getPricingBreakdown().deliveryCharge || 0;
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

          {/* Inline SmartRide: replaces booking form when active */}
          {showSmartRide && (
            <div>

              {/* inject delivery options for embedded SmartRide via global so Smartride can render dropdown */}
              {(() => { window.__SMART_RIDE_OPTIONS__ = deliveryTypes; return null; })()}

              <SmartRideBooking embedMode={true} initialData={{
                senderName: formData.senderName,
                senderPhone: formData.senderPhone,
                pickupAddress: formData.pickupStreet || formData.pickupAddress || (pickupAddressObj?.street || '') || '',
                deliveryAddress: formData.deliveryStreet || formData.deliveryAddress || (deliveryAddressObj?.street || '') || '',
                pickupPlace: pickupAddressObj || (pickupCoordinates?.lat ? { street: formData.pickupStreet || formData.pickupAddress, coordinates: pickupCoordinates } : null),
                deliveryPlace: deliveryAddressObj || (deliveryCoordinates?.lat ? { street: formData.deliveryStreet || formData.deliveryAddress, coordinates: deliveryCoordinates } : null),
                pickupDate: formData.pickupDate,
                recipientName: formData.recipientName,
                recipientPhone: formData.recipientPhone,
                recipientEmail: formData.recipientEmail,
                sizeCategory: formData.sizeCategory,
                weightCategory: formData.weightCategory,
                dimensions: formData.dimensions,
                weight: formData.weight,
                packageDescription: formData.packageDescription,
                paymentMethod: formData.paymentMethod,
                paymentNotes: formData.paymentNotes,
                image: formData.image
              }} onClose={() => {
                setShowSmartRide(false);
                // Reset all Smart Ride related state so next booking starts fresh
                setBookingStatus(null);
                setAssignedRider(null);
                // Clean up socket listeners if any
                try {
                  const info = socketService._lastDeliveryListeners;
                  if (info && info.handleAssigned) {
                    socketService.off('delivery:assigned', info.handleAssigned);
                    socketService.off('delivery:accepted', info.handleAssigned);
                    socketService.off('delivery:status', info.handleAssigned);
                    if (info.deliveryId) {
                      socketService.leaveDelivery(info.deliveryId);
                    }
                    delete socketService._lastDeliveryListeners;
                  }
                } catch (e) {
                  console.warn('[Book] Failed to clean up socket listeners on close', e);
                }
                try { window.history.replaceState({}, '', window.location.pathname); } catch (e) { }
              }} />
            </div>
          )}

          {/* Header */}
          <div style={{ display: showSmartRide ? 'none' : 'block' }} className="mb-4 md:mb-8 mt-4 sm:mt-0 md:mt-0">
            <YummyText className="text-2xl md:text-3xl  font-medium text-[#0F172A] mb-2 text-left md:text-left">
              Book a Delivery
            </YummyText>
            <YummyText className="text-sm md:text-base text-[#4A5565] text-left md:text-left">
              Schedule a new shipment with ease
            </YummyText>
          </div>

          <YummyText>
            <div style={{ display: showSmartRide ? 'none' : 'block' }}>
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
                          className={`w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 border-none ${fieldErrors.senderName ? 'focus:ring-red-500 ring-2 ring-red-200' : 'focus:ring-[#00D68F]'}`}
                        />
                        {fieldErrors.senderName && <p className="text-sm text-red-600 mt-1.5" role="alert">{fieldErrors.senderName}</p>}
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
                          className={`w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 border-none ${fieldErrors.senderPhone ? 'focus:ring-red-500 ring-2 ring-red-200' : 'focus:ring-[#00D68F]'}`}
                        />
                        {fieldErrors.senderPhone && <p className="text-sm text-red-600 mt-1.5" role="alert">{fieldErrors.senderPhone}</p>}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-[#0F172A]">
                            Pickup Address
                          </label>
                          <div className="group relative">
                            <IonIcon icon={informationCircleOutline} className="text-[#64748B] w-4 h-4 mt-2.5" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                              Please enter a precise location for accurate pickup.
                            </div>
                          </div>
                        </div>
                        <GoogleMapsAutocomplete
                          value={formData.pickupStreet}
                          onChange={(value) => {
                            setFormData(prev => ({ ...prev, pickupStreet: value }));
                            if (fieldErrors.pickupStreet) setFieldErrors(prev => ({ ...prev, pickupStreet: undefined }));
                          }}
                          placeholder="Enter pickup address"
                          onPlaceSelect={(place) => {
                            setFormData(prev => ({ ...prev, pickupStreet: place.street || place.formatted_address || '' }));
                            setPickupCoordinates(place.coordinates || { lat: 0, lng: 0 });
                            setPickupAddressObj(place);
                            if (fieldErrors.pickupStreet) setFieldErrors(prev => ({ ...prev, pickupStreet: undefined }));
                          }}
                        />
                        {fieldErrors.pickupStreet && <p className="text-sm text-red-600 mt-1.5" role="alert">{fieldErrors.pickupStreet}</p>}
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
                          className={`w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] focus:outline-none focus:ring-2 border-none ${fieldErrors.pickupDate ? 'focus:ring-red-500 ring-2 ring-red-200' : 'focus:ring-[#00D68F]'}`}
                        />
                        {fieldErrors.pickupDate && <p className="text-sm text-red-600 mt-1.5" role="alert">{fieldErrors.pickupDate}</p>}
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
                          className={`w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 border-none ${fieldErrors.recipientName ? 'focus:ring-red-500 ring-2 ring-red-200' : 'focus:ring-[#00D68F]'}`}
                        />
                        {fieldErrors.recipientName && <p className="text-sm text-red-600 mt-1.5" role="alert">{fieldErrors.recipientName}</p>}
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
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-[#0F172A]">
                            Delivery Address
                          </label>
                          <div className="group relative">
                            <IonIcon icon={informationCircleOutline} className="text-[#64748B] w-4 h-4 mt-2.5" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                              Please enter a precise location for accurate delivery.
                            </div>
                          </div>
                        </div>
                        <GoogleMapsAutocomplete
                          value={formData.deliveryStreet}
                          onChange={(value) => {
                            setFormData(prev => ({ ...prev, deliveryStreet: value }));
                            if (fieldErrors.deliveryStreet) setFieldErrors(prev => ({ ...prev, deliveryStreet: undefined }));
                          }}
                          placeholder="Enter delivery address"
                          onPlaceSelect={(place) => {
                            setFormData(prev => ({ ...prev, deliveryStreet: place.street || place.formatted_address || '' }));
                            setDeliveryCoordinates(place.coordinates || { lat: 0, lng: 0 });
                            setDeliveryAddressObj(place);
                            if (fieldErrors.deliveryStreet) setFieldErrors(prev => ({ ...prev, deliveryStreet: undefined }));
                          }}
                        />
                        {fieldErrors.deliveryStreet && <p className="text-sm text-red-600 mt-1.5" role="alert">{fieldErrors.deliveryStreet}</p>}
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
                            const defaultScaleMap = { small: 85, big: 100, very_big: 120 };
                            const cat = valueMap[label];
                            const weightMap = { small: 'light', big: 'heavy', very_big: 'very_heavy' };
                            const dimsMap = { small: [30, 30, 30], big: [50, 40, 30], very_big: [80, 60, 50] };
                            const scale = defaultScaleMap[cat] || 100;
                            const factor = scale / 100;
                            const base = dimsMap[cat];
                            const dims = `${Math.round(base[0] * factor)}×${Math.round(base[1] * factor)}×${Math.round(base[2] * factor)} cm`;
                            setFormData({
                              ...formData,
                              sizeCategory: cat,
                              weightCategory: weightMap[cat],
                              sizeScale: scale,
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
                      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <label className="text-sm font-semibold text-[#0F172A]">Adjust Size</label>
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
                              // Determine category from scale thresholds
                              let derivedCat = 'small';
                              if (scale <= 90) derivedCat = 'small';
                              else if (scale <= 110) derivedCat = 'big';
                              else derivedCat = 'very_big';
                              const weightMap = { small: 'light', big: 'heavy', very_big: 'very_heavy' };
                              const base = dimsMap[derivedCat] || dimsMap.small;
                              const factor = scale / 100;
                              const dims = `${Math.round(base[0] * factor)}×${Math.round(base[1] * factor)}×${Math.round(base[2] * factor)} cm`;
                              setFormData({ ...formData, sizeScale: scale, dimensions: dims, sizeCategory: derivedCat, weightCategory: weightMap[derivedCat] });

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
                      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-xl bg-[#FFFFFF]/10 shadow-sm border flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                              <path d="M12 2L2 7l10 5 10-5-10-5z" />
                              <path d="M2 17l10 5 10-5" />
                              <path d="M2 12l10 5 10-5" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <label className="text-sm font-semibold text-[#0F172A] block">
                              Exact Weight (optional)
                            </label>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="2.5 kg, 10 kg"
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
                            <circle cx="12" cy="12" r="10" stroke="#64748B" strokeWidth="2" />
                            <path d="M12 16v-4M12 8h.01" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span>Enter a specific weight or range if you know it.</span>
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
                      className={`w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 border-none resize-none ${fieldErrors.packageDescription ? 'ring-2 ring-red-200 focus:ring-red-500' : 'focus:ring-[#00D68F]'}`}
                      aria-invalid={!!fieldErrors.packageDescription}
                      aria-describedby={fieldErrors.packageDescription ? 'packageDescription-error' : undefined}
                    ></textarea>
                    {fieldErrors.packageDescription && <p id="packageDescription-error" className="text-sm text-red-600 mt-1.5" role="alert">{fieldErrors.packageDescription}</p>}
                  </div>

                  {/* Riders nearby — Smart Ride only: customer can request a rider; Express goes to pool */}
                  {formData.deliveryType === 'smart_ride' && pickupCoordinates?.lat && pickupCoordinates?.lng && (
                    <div className="mb-6 bg-[#F8F9FA] rounded-2xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-[#0F172A]">Riders nearby (Smart Ride)</span>
                        {nearbyPricing?.deliveryStartsFrom != null && (
                          <span className="text-xs text-[#64748B]">From ₦{Number(nearbyPricing.deliveryStartsFrom).toLocaleString()}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mb-2">Request a rider to accept your delivery. They can accept or decline.</p>
                      {nearbyRidersLoading ? (
                        <p className="text-sm text-[#64748B]">Loading riders...</p>
                      ) : nearbyRiders.length === 0 ? (
                        <p className="text-sm text-[#64748B]">No riders in range. Your order will be visible to all riders when you book.</p>
                      ) : (
                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                          {nearbyRiders.slice(0, 5).map((r) => (
                            <li key={r.riderId} className="flex items-center gap-3 py-2 px-3 bg-white rounded-xl border border-gray-100">
                              {r.profileImage ? (
                                <img src={r.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#00B75A]/20 flex items-center justify-center text-[#0F172A] font-semibold text-sm">
                                  {(r.fullName || 'R').charAt(0)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#0F172A] truncate">{r.fullName}</p>
                                <p className="text-xs text-[#64748B]">{r.ratingDisplay}</p>
                              </div>
                              {r.distanceKm != null && (
                                <div className="text-right text-xs text-[#64748B]">
                                  <p>{r.distanceKm} km</p>
                                  {r.estimatedArrivalMinutes != null && <p>~{r.estimatedArrivalMinutes} min</p>}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedRiderId(selectedRiderId === r.riderId ? null : r.riderId)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${selectedRiderId === r.riderId ? 'bg-[#00B75A] text-white' : 'bg-[#F8F9FA] text-[#0F172A] border border-gray-200 hover:border-[#00B75A]'}`}
                              >
                                {selectedRiderId === r.riderId ? 'Requested' : 'Request this rider'}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}



                  {/* Package Images Upload — up to 5 */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-[#0F172A]">
                        Package Images <span className="text-[#94A3B8] font-normal">(optional · up to 5)</span>
                      </label>
                      {(formData.images || []).length > 0 && (
                        <span className="text-xs text-[#64748B]">{(formData.images || []).length}/5 added</span>
                      )}
                    </div>

                    {/* Thumbnail row */}
                    <div className="flex flex-wrap gap-3">
                      {(formData.images || []).map((file, idx) => (
                        <div
                          key={idx}
                          className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[#00B75A] flex-shrink-0"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Package ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.images || []).filter((_, i) => i !== idx);
                              setFormData({ ...formData, images: updated });
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            title="Remove image"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Add tile — shown while under the limit */}
                      {(formData.images || []).length < 5 && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            id="package-image-upload"
                            className="hidden"
                            onChange={(e) => {
                              const incoming = Array.from(e.target.files || []);
                              const existing = formData.images || [];
                              const combined = [...existing, ...incoming].slice(0, 5);
                              setFormData({ ...formData, images: combined });
                              e.target.value = ''; // reset so same file can be re-added
                            }}
                          />
                          <label
                            htmlFor="package-image-upload"
                            className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#00B75A] transition-colors cursor-pointer flex flex-col items-center justify-center bg-[#F8F9FA] hover:bg-[#F0FDF4] flex-shrink-0"
                          >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mb-1">
                              <path d="M12 5v14M5 12h14" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                            <span className="text-[10px] text-[#94A3B8] text-center leading-tight px-1">
                              {(formData.images || []).length === 0 ? 'Add photos' : 'Add more'}
                            </span>
                          </label>
                        </>
                      )}
                    </div>

                    {(formData.images || []).length === 0 && (
                      <p className="text-xs text-[#94A3B8] mt-2">PNG, JPG, WebP up to 10MB each</p>
                    )}
                  </div>


                  {/* Payment Method - exact copy from SmartRide */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">Payment Method</label>
                    <button
                      type="button"
                      onClick={() => setShowPaymentDrawer(true)}
                      onMouseEnter={() => setPaymentHover(true)}
                      onMouseLeave={() => setPaymentHover(false)}
                      style={{
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: (paymentHover || formData.paymentMethod) ? '#00B75A' : '#E5E7EB',
                        backgroundColor: (paymentHover || formData.paymentMethod) ? '#F0FDF4' : '#FFFFFF',
                        boxShadow: paymentHover ? '0 0 0 10px rgba(16,185,129,0.12)' : (formData.paymentMethod ? '0 0 0 6px rgba(16,185,129,0.06)' : 'none'),
                        outline: 'none'
                      }}
                      className="w-full px-4 py-3 rounded-xl text-left flex items-center justify-between transition-all"
                    >
                      {formData.paymentMethod ? (
                        <div className="flex items-center gap-3">
                          {formData.paymentMethod === 'cash' && (
                            <>
                              <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                  <rect x="2" y="5" width="20" height="14" rx="2" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#0F172A]">Cash on Delivery</p>
                                <p className="text-xs text-[#64748B]">Pay with cash when delivered</p>
                              </div>
                            </>
                          )}
                          {formData.paymentMethod === 'card' && (
                            <>
                              <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                  <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#0F172A]">Pay Online (Card)</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-4" />
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
                                  <span className="text-xs text-[#64748B]">Verve</span>
                                </div>
                              </div>
                            </>
                          )}
                          {formData.paymentMethod === 'transfer' && (
                            <>
                              <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                  <line x1="12" y1="1" x2="12" y2="23" />
                                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#0F172A]">Bank Transfer</p>
                                <p className="text-xs text-[#64748B]">Transfer to our account</p>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#94A3B8]">Select payment method</span>
                      )}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
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

                {/* Discount / Launch offer notice */}
                {(() => {
                  const pricing = getPricingBreakdown();
                  const hasDiscount = (pricing.discountAmount ?? 0) > 0;
                  const note = estimatedPrice?.note;
                  const showNote = note && typeof note === 'string' && note.trim();
                  if (!hasDiscount && !showNote) return null;
                  return (
                    <div className="mb-4 rounded-xl p-4 flex items-start gap-3 bg-green-50 border border-green-200">
                      <span className="text-green-600 flex-shrink-0 mt-0.5" aria-hidden>✓</span>
                      <div className="flex-1 min-w-0">
                        {hasDiscount && (
                          <p className="text-sm font-medium text-green-800 mb-1">
                            You&apos;re eligible for a discount of ₦{(pricing.discountAmount ?? 0).toLocaleString()} on this delivery.
                          </p>
                        )}
                        {showNote && <p className="text-xs text-green-700">{note.trim()}</p>}
                      </div>
                    </div>
                  );
                })()}

                {/* Cost Breakdown */}
                <div className="bg-[#F0FDF4] rounded-xl p-4 md:p-6 mb-6">
                  <h3 className="text-base font-semibold text-[#0F172A] mb-4">Cost Breakdown</h3>
                  <div className="space-y-2.5">
                    {(() => {
                      const pricing = getPricingBreakdown();
                      return (
                        <>
                          {/* Base Fare */}
                          <div className="flex justify-between items-center text-[#0F172A]">
                            <span className="text-sm md:text-base">Base Fare</span>
                            <span className="text-sm md:text-base font-medium">₦{(pricing.baseFare ?? 0).toLocaleString()}</span>
                          </div>

                          {/* Distance charge (from backend) */}
                          {(pricing.distanceCharge ?? 0) > 0 && (
                            <div className="flex justify-between items-center text-[#0F172A]">
                              <span className="text-sm md:text-base">Distance ({pricing.distance?.toFixed(1) ?? 0} km)</span>
                              <span className="text-sm md:text-base font-medium">₦{(pricing.distanceCharge ?? 0).toLocaleString()}</span>
                            </div>
                          )}

                          {/* Smart Ride fee */}
                          {(pricing.smartRideFee ?? pricing.deliveryTypeFee ?? 0) > 0 && (
                            <div className="flex justify-between items-center text-[#0F172A]">
                              <span className="text-sm md:text-base">Smart Ride</span>
                              <span className="text-sm md:text-base font-medium">₦{(pricing.smartRideFee ?? pricing.deliveryTypeFee ?? 0).toLocaleString()}</span>
                            </div>
                          )}

                          {/* Batch / Launch discount */}
                          {(pricing.discountAmount ?? 0) > 0 && (
                            <div className="flex justify-between items-center text-green-700">
                              <span className="text-sm">Discount{pricing.discountPercentage ? ` (${pricing.discountPercentage}%)` : ''}</span>
                              <span className="text-sm font-medium">-₦{(pricing.discountAmount ?? 0).toLocaleString()}</span>
                            </div>
                          )}

                          <div className="border-t border-gray-300 pt-3 mt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-base md:text-lg font-medium text-[#0F172A]">Total</span>
                              <span className="text-xl md:text-2xl font-medium text-[#00B75A]">
                                ₦{calculateTotal().toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Payment Method Warning */}
                {(!formData.paymentMethod || formData.paymentMethod === '') && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
                      <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z" fill="#F59E0B" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900 mb-1">No payment method selected</p>
                      <p className="text-xs text-amber-700">If you proceed without selecting a payment method, <strong>Cash</strong> will be used as the default payment option.</p>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 md:px-8 py-3 bg-[#00B75A] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00B876]'} text-white rounded-xl transition-colors font-medium text-sm md:text-base`}
                  >
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
          </YummyText>
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
                      setTimeout(() => setShowPaymentDrawer(false), 150);
                    }}
                    onMouseEnter={() => setDrawerHover('cash')}
                    onMouseLeave={() => setDrawerHover('')}
                    style={{
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: (formData.paymentMethod === 'cash' || drawerHover === 'cash') ? '#00B75A' : '#E5E7EB',
                      backgroundColor: (formData.paymentMethod === 'cash' || drawerHover === 'cash') ? '#F0FDF4' : '#FFFFFF',
                      boxShadow: drawerHover === 'cash' ? '0 0 0 10px rgba(16,185,129,0.12)' : (formData.paymentMethod === 'cash' ? '0 0 0 6px rgba(16,185,129,0.06)' : 'none'),
                      outline: 'none'
                    }}
                    className={`w-full p-4 rounded-xl mb-4 transition-all`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.paymentMethod === 'cash' ? 'bg-[#00B75A]' : 'bg-gray-100'
                        }`}>
                        <IonIcon icon={wallet} className={`${formData.paymentMethod === 'cash' ? 'text-white' : 'text-[#64748B]'} text-xl`} />
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
                      setTimeout(() => setShowPaymentDrawer(false), 150);
                    }}
                    onMouseEnter={() => setDrawerHover('card')}
                    onMouseLeave={() => setDrawerHover('')}
                    style={{
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: (formData.paymentMethod === 'card' || drawerHover === 'card') ? '#00B75A' : '#E5E7EB',
                      backgroundColor: (formData.paymentMethod === 'card' || drawerHover === 'card') ? '#F0FDF4' : '#FFFFFF',
                      boxShadow: drawerHover === 'card' ? '0 0 0 10px rgba(16,185,129,0.12)' : (formData.paymentMethod === 'card' ? '0 0 0 6px rgba(16,185,129,0.06)' : 'none'),
                      outline: 'none'
                    }}
                    className={`w-full p-4 rounded-xl mb-4 transition-all`}
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
                        <div className="text-sm text-[#64748B]">Secure Online payment via Paystack</div>
                        <div className="flex items-center gap-2 mt-2">
                          <VisaIcon className="h-8" />
                          <MastercardIcon className="h-8" />
                          <VerveIcon className="h-8" />
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
                      setTimeout(() => setShowPaymentDrawer(false), 150);
                    }}
                    onMouseEnter={() => setDrawerHover('transfer')}
                    onMouseLeave={() => setDrawerHover('')}
                    style={{
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: (formData.paymentMethod === 'transfer' || drawerHover === 'transfer') ? '#00B75A' : '#E5E7EB',
                      backgroundColor: (formData.paymentMethod === 'transfer' || drawerHover === 'transfer') ? '#F0FDF4' : '#FFFFFF',
                      boxShadow: drawerHover === 'transfer' ? '0 0 0 10px rgba(16,185,129,0.12)' : (formData.paymentMethod === 'transfer' ? '0 0 0 6px rgba(16,185,129,0.06)' : 'none'),
                      outline: 'none'
                    }}
                    className={`w-full p-4 rounded-xl mb-4 transition-all`}
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
                        setTimeout(() => setShowPaymentDrawer(false), 150);
                      }}
                      onMouseEnter={() => setDrawerHover('cash')}
                      onMouseLeave={() => setDrawerHover('')}
                      style={{
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: (formData.paymentMethod === 'cash' || drawerHover === 'cash') ? '#00B75A' : '#E5E7EB',
                        backgroundColor: (formData.paymentMethod === 'cash' || drawerHover === 'cash') ? '#F0FDF4' : '#FFFFFF',
                        boxShadow: drawerHover === 'cash' ? '0 0 0 10px rgba(16,185,129,0.12)' : (formData.paymentMethod === 'cash' ? '0 0 0 6px rgba(16,185,129,0.06)' : 'none'),
                        outline: 'none'
                      }}
                      className={`w-full p-4 rounded-xl mb-4 transition-all`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.paymentMethod === 'cash' ? 'bg-[#00B75A]' : 'bg-gray-100'
                          }`}>
                          <IonIcon icon={wallet} className={`${formData.paymentMethod === 'cash' ? 'text-white' : 'text-[#64748B]'} text-xl`} />
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
                        setTimeout(() => setShowPaymentDrawer(false), 150);
                      }}
                      onMouseEnter={() => setDrawerHover('card')}
                      onMouseLeave={() => setDrawerHover('')}
                      style={{
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: (formData.paymentMethod === 'card' || drawerHover === 'card') ? '#00B75A' : '#E5E7EB',
                        backgroundColor: (formData.paymentMethod === 'card' || drawerHover === 'card') ? '#F0FDF4' : '#FFFFFF',
                        boxShadow: drawerHover === 'card' ? '0 0 0 10px rgba(16,185,129,0.12)' : (formData.paymentMethod === 'card' ? '0 0 0 6px rgba(16,185,129,0.06)' : 'none'),
                        outline: 'none'
                      }}
                      className={`w-full p-4 rounded-xl mb-4 transition-all`}
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
                          <div className="text-sm text-[#64748B]">Secure payment via Paystack</div>
                          <div className="flex items-center gap-2 mt-2">
                            <VisaIcon className="h-6" />
                            <MastercardIcon className="h-6" />
                            <VerveIcon className="h-6" />
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
                        setTimeout(() => setShowPaymentDrawer(false), 150);
                      }}
                      onMouseEnter={() => setDrawerHover('transfer')}
                      onMouseLeave={() => setDrawerHover('')}
                      style={{
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: (formData.paymentMethod === 'transfer' || drawerHover === 'transfer') ? '#00B75A' : '#E5E7EB',
                        backgroundColor: (formData.paymentMethod === 'transfer' || drawerHover === 'transfer') ? '#F0FDF4' : '#FFFFFF',
                        boxShadow: drawerHover === 'transfer' ? '0 0 0 10px rgba(16,185,129,0.12)' : (formData.paymentMethod === 'transfer' ? '0 0 0 6px rgba(16,185,129,0.06)' : 'none'),
                        outline: 'none'
                      }}
                      className={`w-full p-4 rounded-xl mb-4 transition-all`}
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