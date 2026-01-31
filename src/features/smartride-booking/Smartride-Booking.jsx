'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Bike, Phone, MessageCircle, Package, CheckCircle, X } from 'lucide-react';
import { IonPage, IonContent, IonToast, useIonRouter } from '@ionic/react';
import Button from '../../components/Button';
import { YummyText } from '../../components/YummyText';
import Breadcrumb from '../../components/Breadcrumb';
import GoogleMap from '../../components/TrackingMap';
import GoogleMapsAutocomplete from '../../components/GoogleMapsAutocomplete';
import StyledDropdown from '../../components/StyledDropdown';
import axios from 'axios';
import { getCookie, setCookie, deleteCookie } from '../../utils/cookies';
import { createDelivery, cancelDelivery, isAuthenticated, getDeliveryEstimate, getDeliveryById, getNearbyRiders } from '../../utils/authApi';
import socketService from '../../services/socket.service';
import { calculateDistance } from '../../utils/pricing';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    withCredentials: true
});

// Add request interceptor to attach auth token (match Book.jsx behavior)
apiClient.interceptors.request.use((config) => {
    const riderToken = getCookie('rider_token');
    const customerToken = getCookie('customer_token');
    const adminToken = getCookie('admin_token');
    const authToken = getCookie('auth_token');

    const token = customerToken || adminToken || riderToken || authToken;

    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => Promise.reject(error));

const sideBottomShadow = {
    boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

export default function SmartRideBooking({ embedMode = false, initialData = {}, onClose = null }) {
    const router = useIonRouter();
    const [currentStep, setCurrentStep] = useState('form');
    const [isSearching, setIsSearching] = useState(false);
    const sliderRef = useRef(null);
    const hideBubbleTimeout = useRef(null);
    const [sliderBubble, setSliderBubble] = useState(null);


    const [formData, setFormData] = useState({
        deliveryType: 'smart_ride',
        senderName: '',
        senderPhone: '',
        pickupAddress: '',
        pickupPlace: null,
        // pickupDate removed for Smart Ride flow
        recipientName: '',
        recipientPhone: '',
        deliveryAddress: '',
        deliveryPlace: null,
        recipientEmail: '',
        // New package sizing fields
        sizeCategory: 'small',
        weightCategory: 'light',
        dimensions: '30×30×30 cm',
        sizeScale: 100,
        weight: '',
        packageDescription: '',
        // Payment and image fields
        image: null,
        paymentMethod: '',
        paymentNotes: '',
        ...initialData
    });

    const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [deliveryId, setDeliveryId] = useState(null);
    const [toastMsg, setToastMsg] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [isPriority, setIsPriority] = useState(false);
    const [isSpecialErrand, setIsSpecialErrand] = useState(false);
    const [waitingMinutes, setWaitingMinutes] = useState(0);
    const [distanceKm, setDistanceKm] = useState(0);
    const [boosted, setBoosted] = useState(false);
    const [estimatedPrice, setEstimatedPrice] = useState(null);
    const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
    const [nearbyRiders, setNearbyRiders] = useState([]);
    const [nearbyRidersLoading, setNearbyRidersLoading] = useState(false);
    const [requestSentToRiderId, setRequestSentToRiderId] = useState(null);
    const [requestSentToRiderName, setRequestSentToRiderName] = useState(null);
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const [isCancellingRequest, setIsCancellingRequest] = useState(false);
    const [paymentHover, setPaymentHover] = useState(false);
    const [drawerHover, setDrawerHover] = useState('');

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Calculate distance and fetch price whenever addresses change
    useEffect(() => {
        const pickupCoords = formData.pickupPlace?.coordinates;
        const deliveryCoords = formData.deliveryPlace?.coordinates;

        const updatePrice = async () => {
            if (pickupCoords && deliveryCoords && pickupCoords.lat && deliveryCoords.lat) {
                // Determine if special errand based on user selection or other logic? 
                // SmartRide implies smartRide=true
                setIsCalculatingPrice(true);
                try {
                    const response = await getDeliveryEstimate({
                        pickupLat: pickupCoords.lat,
                        pickupLng: pickupCoords.lng,
                        deliveryLat: deliveryCoords.lat,
                        deliveryLng: deliveryCoords.lng,
                        smartRide: true,
                        specialErrand: isSpecialErrand
                    });
                    if (response && response.data) {
                        setEstimatedPrice(response.data);
                        setDistanceKm(response.data.distance);
                    }
                } catch (e) {
                    console.error("Failed to estimate price", e);
                } finally {
                    setIsCalculatingPrice(false);
                }
            } else {
                setDistanceKm(0);
                setEstimatedPrice(null);
            }
        };

        const debounceTimer = setTimeout(updatePrice, 500);
        return () => clearTimeout(debounceTimer);
    }, [formData.pickupPlace, formData.deliveryPlace, isSpecialErrand]);

    // Listen for postMessage from payment callback popup (same behavior as Book.jsx)
    useEffect(() => {
        const handlePaymentMessage = (event) => {
            // Expecting { type: 'PAYMENT_REDIRECT', url: '...' }
            if (event.data?.type === 'PAYMENT_REDIRECT') {
                const targetUrl = event.data.url || event.data.fullUrl;
                if (targetUrl) {
                    const path = targetUrl.startsWith('http') ? new URL(targetUrl).pathname + new URL(targetUrl).search : targetUrl;
                    router.push(path, 'root', 'replace');
                }
            }
        };

        window.addEventListener('message', handlePaymentMessage);
        return () => window.removeEventListener('message', handlePaymentMessage);
    }, [router]);

    // Listen for rider acceptance events - show rider-found only when the created delivery is accepted
    useEffect(() => {
        const onDeliveryAccepted = async (e) => {
            console.log('[SmartRide] 📢 delivery:accepted event received:', e?.detail);
            const detail = e?.detail || {};

            // Collect many possible id fields that backends/clients may use
            const candidateIds = [
                detail.deliveryId,
                detail.delivery?._id,
                detail.delivery?.id,
                detail._id,
                detail.id,
                detail.order?._id,
                detail.order?.id,
                detail.order?.deliveryId,
                detail.order?.trackingNumber,
                detail.trackingNumber
            ].filter(Boolean).map(String);

            const storedId = String(deliveryId || localStorage.getItem('smartride_delivery_id') || '');
            console.log('[SmartRide] Comparing candidate IDs to storedId:', { candidateIds, storedId, deliveryId });

            const directMatch = storedId && candidateIds.some(id => String(id) === String(storedId));
            if (directMatch) {
                console.log('[SmartRide] ✅ Direct ID match found — moving to rider-found');
                setIsSearching(false);
                setCurrentStep('rider-found');
                try {
                    localStorage.setItem('smartride_step', 'rider-found');
                    localStorage.setItem('smartride_rider_details', JSON.stringify(detail?.rider || {}));
                } catch (err) { console.warn('[SmartRide] Failed to store rider details:', err); }
                return;
            }

            // If not a direct id match, attempt to match by payload (phones or addresses) as a fallback
            try {
                const order = detail.order || detail.delivery || null;
                if (order) {
                    const orderSender = (order.senderPhone || order.sender || order.fromPhone || order.from?.phone || order.fromPhoneNumber || '').toString();
                    const orderRecipient = (order.recipientPhone || order.toPhone || order.to?.phone || order.recipientPhoneNumber || '').toString();
                    const formSender = (formData.senderPhone || '').toString();
                    const formRecipient = (formData.recipientPhone || '').toString();

                    if (storedId && ((orderSender && formSender && orderSender === formSender) || (orderRecipient && formRecipient && orderRecipient === formRecipient))) {
                        console.log('[SmartRide] ✅ Payload phone match — moving to rider-found');
                        setIsSearching(false);
                        setCurrentStep('rider-found');
                        try {
                            localStorage.setItem('smartride_step', 'rider-found');
                            localStorage.setItem('smartride_rider_details', JSON.stringify(detail?.rider || {}));
                        } catch (err) { console.warn('[SmartRide] Failed to store rider details:', err); }
                        return;
                    }
                }
            } catch (err) {
                console.warn('[SmartRide] Payload matching failed:', err);
            }

            // Last-resort: validate stored delivery from API and see if its id now appears in the event payload
            if (storedId) {
                try {
                    const resp = await getDeliveryById(storedId);
                    const storedDelivery = resp?.data?.delivery || resp?.data || resp;
                    const storedCanonicalId = storedDelivery?._id || storedDelivery?.id || storedDelivery?.deliveryId || storedDelivery?.trackingNumber;
                    if (storedCanonicalId && candidateIds.some(id => String(id) === String(storedCanonicalId))) {
                        console.log('[SmartRide] ✅ Matched via backend-validated canonical id — moving to rider-found');
                        setIsSearching(false);
                        setCurrentStep('rider-found');
                        try {
                            localStorage.setItem('smartride_step', 'rider-found');
                            localStorage.setItem('smartride_rider_details', JSON.stringify(detail?.rider || {}));
                        } catch (err) { console.warn('[SmartRide] Failed to store rider details:', err); }
                        return;
                    }
                } catch (err) {
                    console.warn('[SmartRide] Failed to validate stored delivery id via API:', err);
                }
            }

            console.log('[SmartRide] No match for delivery:accepted event — ignoring');
        };

        window.addEventListener('delivery:accepted', onDeliveryAccepted);

        // Also listen for socket events directly. Ensure socket is connected so listeners register.
        const handleSocketAcceptance = (data) => {
            console.log('[SmartRide] 🔌 Socket delivery:accepted received:', data);
            onDeliveryAccepted({ detail: data });
        };

        try {
            socketService.connect();
            socketService.on('delivery:accepted', handleSocketAcceptance);
        } catch (e) {
            console.warn('[SmartRide] Socket listener failed:', e);
        }

        return () => {
            window.removeEventListener('delivery:accepted', onDeliveryAccepted);
            try {
                socketService.off('delivery:accepted', handleSocketAcceptance);
            } catch (e) { }
        };
    }, [deliveryId]);

    // Poll delivery status as a fallback when socket events are missed.
    // This avoids forcing the customer to refresh the page while keeping them on the form.
    useEffect(() => {
        if (!deliveryId) return;
        let cancelled = false;
        let interval = null;

        const poll = async () => {
            try {
                const resp = await getDeliveryById(deliveryId);
                const delivery = resp?.data?.delivery || resp?.data || resp;
                if (!delivery) return;

                const status = (delivery.status || '').toString().toLowerCase();
                const hasRider = !!(delivery.rider || delivery.assignedDriver || delivery.driverId);

                // Consider accepted/assigned/picked-up as accepted
                if (status.includes('accepted') || status.includes('assigned') || status.includes('picked') || hasRider) {
                    const detail = { delivery: delivery, deliveryId: delivery._id || delivery.id || delivery.deliveryId || delivery.trackingNumber, order: delivery };
                    console.log('[SmartRide] Poll detected acceptance for delivery:', detail.deliveryId);
                    window.dispatchEvent(new CustomEvent('delivery:accepted', { detail }));
                }
            } catch (e) {
                console.warn('[SmartRide] Polling delivery status failed:', e);
            }
        };

        // Immediately poll once then every 5s while waiting
        poll();
        interval = setInterval(() => { if (!cancelled) poll(); }, 5000);

        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
        };
    }, [deliveryId]);

    // Socket: rider declined the invitation — clear request state and show "Search again"
    useEffect(() => {
        socketService.connect();
        const handleInvitationRejected = (data) => {
            const eventId = data?.deliveryId ? String(data.deliveryId) : '';
            const currentId = deliveryId ? String(deliveryId) : '';
            if (eventId && currentId && eventId === currentId) {
                setRequestSentToRiderId(null);
                setRequestSentToRiderName(null);
                setToastMsg('Rider declined. Search again?');
                setShowToast(true);
            }
        };
        socketService.on('delivery:invitation:rejected', handleInvitationRejected);
        return () => {
            try { socketService.off('delivery:invitation:rejected', handleInvitationRejected); } catch (e) { }
        };
    }, [deliveryId]);

    // Fetch nearby riders when on Rider Matching step (so we call /api/customer/nearby-riders)
    useEffect(() => {
        const coords = formData.pickupPlace?.coordinates;
        const lat = coords?.lat;
        const lng = coords?.lng;
        if ((currentStep !== 'finding-rider' && currentStep !== 'rider-found') || lat == null || lng == null) {
            setNearbyRiders([]);
            return;
        }
        let cancelled = false;
        setNearbyRidersLoading(true);
        getNearbyRiders({ lat, lng, radiusKm: 20, limit: 1 })
            .then((res) => {
                if (cancelled) return;
                const list = res?.data?.riders ?? res?.riders ?? (Array.isArray(res?.data) ? res.data : []);
                setNearbyRiders(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (!cancelled) setNearbyRiders([]);
            })
            .finally(() => {
                if (!cancelled) setNearbyRidersLoading(false);
            });
        return () => { cancelled = true; };
    }, [currentStep, formData.pickupPlace?.coordinates?.lat, formData.pickupPlace?.coordinates?.lng]);

    useEffect(() => {
        // Check if user came from public page via returnUrl after authentication
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl');

        if (returnUrl) {
            // Clear the returnUrl from URL to avoid confusion
            window.history.replaceState({}, '', window.location.pathname);

            // Show a welcome toast for new users who just signed up
            setToastMsg('Welcome! Let\'s book your delivery 🎉');
            setShowToast(true);
        }

        // Verify authentication status
        if (!isAuthenticated()) {
            setToastMsg('Please log in to book a delivery');
            setShowToast(true);
            setTimeout(() => {
                router.push('/auth/customer/login?returnUrl=/customer/smartride-booking', 'root', 'replace');
            }, 2000);
        }
    }, [router]);

    // Restore SmartRide session on refresh: validate stored delivery id before resuming finding state
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const stored = localStorage.getItem('smartride_delivery_id');
                const storedStep = localStorage.getItem('smartride_step');
                if (!stored) return;

                // Validate delivery exists and is still in an active matching state
                try {
                    const resp = await getDeliveryById(stored);
                    const delivery = resp?.data?.delivery || resp?.data || resp;
                    const type = (delivery?.deliveryType || delivery?.type || '').toString().toLowerCase();
                    const status = (delivery?.status || '').toString().toLowerCase();

                    const finalStatuses = ['delivered', 'cancelled', 'completed', 'expired', 'failed'];
                    if (type !== 'smart_ride' || finalStatuses.includes(status)) {
                        try {
                            localStorage.removeItem('smartride_delivery_id');
                            localStorage.removeItem('smartride_step');
                            localStorage.removeItem('smartride_rider_details');
                        } catch (e) { }
                        return;
                    }

                    if (mounted) {
                        setDeliveryId(stored);

                        // Restore request-sent state if this delivery was sent to an invited rider
                        const invitedId = delivery?.invitedDriver?._id ?? delivery?.invitedDriver;
                        if (invitedId) {
                            setRequestSentToRiderId(String(invitedId));
                            const name = delivery?.invitedDriver?.fullName ?? delivery?.invitedDriver?.name;
                            if (name) setRequestSentToRiderName(name);
                        }

                        // Ensure we join the delivery room so server can target events to this client
                        try {
                            const room = `delivery:${stored}`;
                            socketService.connect();
                            const onConnectJoin = () => {
                                try { socketService.joinRoom(room); } catch (e) { console.warn('[SmartRide] joinRoom failed on connect:', e); }
                                try { socketService.off('connect', onConnectJoin); } catch (e) { }
                            };
                            try { socketService.on('connect', onConnectJoin); } catch (e) { }
                            try { socketService.joinRoom(room); } catch (e) { }
                        } catch (e) { console.warn('[SmartRide] Failed to join stored delivery room:', e); }

                        // Restore to appropriate step based on delivery status
                        if (status === 'accepted' || status === 'in_progress' || storedStep === 'rider-details') {
                            setCurrentStep('rider-details');
                            setIsSearching(false);
                        } else if (storedStep === 'rider-found') {
                            setCurrentStep('rider-found');
                            setIsSearching(false);
                        } else {
                            setCurrentStep('finding-rider');
                            setIsSearching(false);
                        }
                    }
                } catch (e) {
                    // If fetching the delivery failed (not found or no access), clear stored id
                    try {
                        localStorage.removeItem('smartride_delivery_id');
                        localStorage.removeItem('smartride_step');
                        localStorage.removeItem('smartride_rider_details');
                    } catch (er) { }
                }
            } catch (e) {
                // ignore
            }
        })();

        return () => { mounted = false; };
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Geocode manually typed address
    const geocodeAddress = async (address, fieldType) => {
        if (!address || address.trim().length < 5) return;

        try {
            if (typeof window === 'undefined' || !window.google?.maps) return;

            const geocoder = new window.google.maps.Geocoder();
            const result = await geocoder.geocode({ address, componentRestrictions: { country: 'NG' } });

            if (result.results && result.results.length > 0) {
                const place = result.results[0];
                const components = place.address_components || [];

                const extract = () => {
                    const out = { city: '', state: '', postal_code: '', country: '' };
                    components.forEach(c => {
                        if (c.types.includes('locality')) out.city = c.long_name;
                        if (c.types.includes('administrative_area_level_1')) out.state = c.long_name;
                        if (c.types.includes('postal_code')) out.postal_code = c.long_name;
                        if (c.types.includes('country')) out.country = c.long_name;
                    });
                    return out;
                };

                const c = extract();
                const placeData = {
                    street: address,
                    city: c.city,
                    state: c.state,
                    zipCode: c.postal_code,
                    country: c.country,
                    coordinates: {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    },
                    place_id: place.place_id
                };

                if (fieldType === 'pickup') {
                    setFormData(prev => ({ ...prev, pickupPlace: placeData }));
                    console.log('Pickup geocoded:', placeData);
                } else {
                    setFormData(prev => ({ ...prev, deliveryPlace: placeData }));
                    console.log('Delivery geocoded:', placeData);
                }
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        setCurrentStep('summary');
    };

    const calculateTotal = () => {
        if (estimatedPrice) {
            const pb = estimatedPrice.pricingBreakdown || {};
            const total = estimatedPrice.estimatedPrice ?? pb.total ?? 0;
            return {
                total: Number(total),
                riderEarnings: pb.riderEarnings || 0,
                priorityFee: pb.priorityFee || 0,
                baseFare: pb.baseFare ?? 0,
                distance: estimatedPrice.distance ?? 0,
                distanceCharge: pb.distanceCharge ?? 0,
                smartRideFee: pb.smartRideFee ?? 0,
                errandFee: pb.errandFee ?? 0,
                waitingTimeFee: pb.waitingTimeFee ?? 0,
                subtotal: pb.subtotal ?? total,
                ...pb
            };
        }
        return {
            total: 0,
            riderEarnings: 0,
            priorityFee: 0,
            baseFare: 0,
            distance: 0,
            distanceCharge: 0,
            smartRideFee: 0,
            errandFee: 0,
            waitingTimeFee: 0,
            subtotal: 0
        };
    };

    const breadcrumbSteps = ['Package Information', 'Package Summary', 'Rider Matching', 'Rider Details'];

    const getCurrentStepIndex = () => {
        switch (currentStep) {
            case 'form': return 0;
            case 'summary': return 1;
            case 'finding-rider':
            case 'rider-found': return 2;
            case 'rider-details': return 3;
            default: return 0;
        }
    };

    const handleBreadcrumbClick = (index) => {
        if (index === 0) setCurrentStep('form');
        else if (index === 1) setCurrentStep('summary');
        else if (index === 2) setCurrentStep(currentStep === 'rider-details' ? 'rider-found' : 'finding-rider');
        else if (index === 3) setCurrentStep('rider-details');
    };

    const findRider = async () => {
        const pickupCoords = formData.pickupPlace;
        const deliveryCoords = formData.deliveryPlace;
        const hasPickupCoords = pickupCoords?.coordinates?.lat != null && pickupCoords?.coordinates?.lng != null;
        const hasDeliveryCoords = deliveryCoords?.coordinates?.lat != null && deliveryCoords?.coordinates?.lng != null;

        if (!hasPickupCoords || !hasDeliveryCoords) {
            setToastMsg('Please select pickup and delivery locations on the map so we can find a rider.');
            setShowToast(true);
            return;
        }

        setCurrentStep('finding-rider');
    };

    const searchAgain = () => {
        const coords = formData.pickupPlace?.coordinates;
        const lat = coords?.lat;
        const lng = coords?.lng;
        if (lat == null || lng == null) return;
        setNearbyRidersLoading(true);
        getNearbyRiders({ lat, lng, radiusKm: 20, limit: 1 })
            .then((res) => {
                const list = res?.data?.riders ?? res?.riders ?? (Array.isArray(res?.data) ? res.data : []);
                setNearbyRiders(Array.isArray(list) ? list : []);
            })
            .catch(() => setNearbyRiders([]))
            .finally(() => setNearbyRidersLoading(false));
    };

    const sendRequestToRider = async (rider) => {
        const riderId = rider?.riderId ?? rider?._id;
        if (!riderId) return;

        const pickupCoords = formData.pickupPlace;
        const deliveryCoords = formData.deliveryPlace;
        const hasPickupCoords = pickupCoords?.coordinates?.lat != null && pickupCoords?.coordinates?.lng != null;
        const hasDeliveryCoords = deliveryCoords?.coordinates?.lat != null && deliveryCoords?.coordinates?.lng != null;
        if (!hasPickupCoords || !hasDeliveryCoords) {
            setToastMsg('Please select pickup and delivery locations on the map.');
            setShowToast(true);
            return;
        }

        const pickupAddrRaw = pickupCoords ? {
            street: pickupCoords.street || '',
            city: pickupCoords.city || '',
            state: pickupCoords.state || pickupCoords.country || pickupCoords.city || '',
            zipCode: pickupCoords.zipCode || '',
            country: pickupCoords.country || '',
            coordinates: pickupCoords.coordinates || { lat: 0, lng: 0 }
        } : {
            street: formData.pickupAddress || '',
            city: '', state: '', zipCode: '', country: '', coordinates: { lat: 0, lng: 0 }
        };
        const deliveryAddrRaw = deliveryCoords ? {
            street: deliveryCoords.street || '',
            city: deliveryCoords.city || '',
            state: deliveryCoords.state || deliveryCoords.country || deliveryCoords.city || '',
            zipCode: deliveryCoords.zipCode || '',
            country: deliveryCoords.country || '',
            coordinates: deliveryCoords.coordinates || { lat: 0, lng: 0 }
        } : {
            street: formData.deliveryAddress || '',
            city: '', state: '', zipCode: '', country: '', coordinates: { lat: 0, lng: 0 }
        };
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
            recipientName: formData.recipientName,
            recipientPhone: formData.recipientPhone,
            recipientEmail: formData.recipientEmail,
            pickupAddress: pickupAddr,
            deliveryAddress: deliveryAddr,
            packageDetails: {
                sizeCategory: formData.sizeCategory,
                weightCategory: formData.weightCategory,
                weight: formData.weight || `${formData.weightCategory} weight`,
                dimensions: formData.dimensions,
                description: formData.packageDescription
            },
            paymentMethod: formData.paymentMethod || 'cash',
            notes: formData.paymentNotes || '',
            payment: { method: formData.paymentMethod || 'cash', notes: formData.paymentNotes },
            deliveryType: 'smart_ride',
            smartRide: true,
            invitedDriver: String(riderId)
        };

        setIsSendingRequest(true);
        try {
            let createResp = null;
            if (formData.image) {
                const fd = new FormData();
                fd.append('image', formData.image);
                Object.entries(payload).forEach(([k, v]) => {
                    if (typeof v === 'object' && v !== null && !(v instanceof File)) fd.append(k, JSON.stringify(v));
                    else fd.append(k, String(v));
                });
                createResp = await createDelivery(fd);
            } else {
                createResp = await createDelivery(payload);
            }

            const deliveryObj = createResp?.data?.delivery || createResp?.delivery || createResp?.data || createResp;
            const dId = deliveryObj?._id || deliveryObj?.id || deliveryObj?.deliveryId || deliveryObj?.trackingNumber;
            if (!dId) {
                throw new Error('Failed to create delivery (no id returned)');
            }
            setDeliveryId(dId);
            setRequestSentToRiderId(String(riderId));
            setRequestSentToRiderName(rider?.fullName || 'Rider');
            setIsSendingRequest(false);
            try {
                localStorage.setItem('smartride_delivery_id', String(dId));
            } catch (e) { }

            try {
                const room = `delivery:${dId}`;
                socketService.connect();
                const onConnectJoin = () => {
                    try { socketService.joinRoom(room); } catch (e) { console.warn('[SmartRide] joinRoom failed on connect:', e); }
                    try { socketService.off('connect', onConnectJoin); } catch (e) { }
                };
                try { socketService.on('connect', onConnectJoin); } catch (e) { }
                try { socketService.joinRoom(room); } catch (e) { }
            } catch (e) { console.warn('[SmartRide] Failed to join delivery room:', e); }

            window.dispatchEvent(new Event('deliveries:refresh'));
            window.dispatchEvent(new CustomEvent('delivery:created', { detail: createResp?.data || createResp }));
        } catch (err) {
            console.error('[SmartRide] sendRequestToRider error:', err);
            setToastMsg('Failed to send request to rider. Please try again.');
            setShowToast(true);
            setIsSendingRequest(false);
        }
    };

    const cancelRequest = async () => {
        if (!deliveryId || isCancellingRequest) return;
        setIsCancellingRequest(true);
        try {
            await cancelDelivery(deliveryId, { reason: 'user_cancelled' });
            try {
                localStorage.removeItem('smartride_delivery_id');
                localStorage.removeItem('smartride_step');
            } catch (e) { }
            try {
                socketService.connect();
                socketService.emit('delivery:cancelled', { deliveryId });
            } catch (e) { }
            try {
                window.dispatchEvent(new CustomEvent('delivery:cancelled', { detail: { deliveryId } }));
            } catch (e) { }
            setDeliveryId(null);
            setRequestSentToRiderId(null);
            setRequestSentToRiderName(null);
            setToastMsg('Request cancelled. You can send a new request or search for another rider.');
            setShowToast(true);
        } catch (e) {
            console.warn('[SmartRide] Cancel request failed:', e);
            setToastMsg('Failed to cancel request. Please try again.');
            setShowToast(true);
        } finally {
            setIsCancellingRequest(false);
        }
    };

    const proceedToRiderDetails = (rider) => {
        setIsSearching(false);
        setCurrentStep('rider-details');
        try {
            localStorage.setItem('smartride_step', 'rider-details');
            const stored = localStorage.getItem('smartride_rider_details');
            const details = rider || (stored ? JSON.parse(stored) : { name: requestSentToRiderName });
            localStorage.setItem('smartride_rider_details', JSON.stringify(details || {}));
        } catch (e) { console.warn('[SmartRide] Failed to persist rider details on proceed:', e); }
    };

    const proceedToPayment = async () => {
        if (!formData.paymentMethod) {
            alert('Please select a payment method');
            setShowPaymentDrawer(true);
            return;
        }

        if (formData.paymentMethod !== 'card') {
            alert('Only online card payment is supported for Smart Ride');
            return;
        }

        try {
            setIsProcessingPayment(true);

            // Build pickup/delivery address objects similar to Book.jsx to satisfy backend validation
            const pickupAddrRaw = formData.pickupPlace ? {
                street: formData.pickupPlace.street || '',
                city: formData.pickupPlace.city || '',
                state: formData.pickupPlace.state || formData.pickupPlace.country || formData.pickupPlace.city || '',
                zipCode: formData.pickupPlace.zipCode || '',
                country: formData.pickupPlace.country || '',
                coordinates: formData.pickupPlace.coordinates || { lat: 0, lng: 0 }
            } : {
                street: formData.pickupAddress || '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
                coordinates: { lat: 0, lng: 0 }
            };

            const deliveryAddrRaw = formData.deliveryPlace ? {
                street: formData.deliveryPlace.street || '',
                city: formData.deliveryPlace.city || '',
                state: formData.deliveryPlace.state || formData.deliveryPlace.country || formData.deliveryPlace.city || '',
                zipCode: formData.deliveryPlace.zipCode || '',
                country: formData.deliveryPlace.country || '',
                coordinates: formData.deliveryPlace.coordinates || { lat: 0, lng: 0 }
            } : {
                street: formData.deliveryAddress || '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
                coordinates: { lat: 0, lng: 0 }
            };

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
                    weight: formData.weight || `${formData.weightCategory} weight`,
                    dimensions: formData.dimensions,
                    description: formData.packageDescription
                },
                payment: { method: formData.paymentMethod, notes: formData.paymentNotes },
                deliveryType: 'smart_ride'
            };

            let createResp = null;
            if (formData.image) {
                const fd = new FormData();
                fd.append('image', formData.image);
                Object.entries(payload).forEach(([k, v]) => {
                    if (typeof v === 'object') fd.append(k, JSON.stringify(v));
                    else fd.append(k, String(v));
                });
                createResp = await createDelivery(fd);
            } else {
                createResp = await createDelivery(payload);
            }

            const deliveryObj = createResp?.data?.delivery || createResp?.delivery || createResp?.data || createResp;
            const dId = deliveryObj?._id || deliveryObj?.id || deliveryObj?.deliveryId || deliveryObj?.trackingNumber;
            if (!dId) {
                console.error('Create delivery response:', createResp);
                throw new Error('Failed to create delivery (no id returned)');
            }
            setDeliveryId(dId);
            // Payment is optional for SmartRide — finalize booking now and allow payment later
            window.dispatchEvent(new Event('deliveries:refresh'));
            window.dispatchEvent(new CustomEvent('delivery:created', { detail: createResp?.data || createResp }));
            try {
                localStorage.setItem('smartride_delivery_id', String(dId));
            } catch (e) { }

            // Join delivery-specific room so customer receives backend-emitted events
            try {
                const room = `delivery:${dId}`;
                socketService.connect();
                const onConnectJoin = () => {
                    try { socketService.joinRoom(room); } catch (e) { console.warn('[SmartRide] joinRoom failed on connect:', e); }
                    try { socketService.off('connect', onConnectJoin); } catch (e) { }
                };
                try { socketService.on('connect', onConnectJoin); } catch (e) { }
                try { socketService.joinRoom(room); } catch (e) { }
            } catch (e) { console.warn('[SmartRide] Failed to join delivery room:', e); }
            setToastMsg('Delivery booked successfully!');
            setShowToast(true);
            setIsProcessingPayment(false);
            setIsCreating(false);
            try { router.push('/customer/deliveries', 'root', 'replace'); } catch (e) { window.location.href = '/customer/deliveries'; }
            return;

            // Open popup synchronously to preserve user gesture
            let paymentWindow = null;
            try {
                paymentWindow = window.open('', '_blank');
                if (paymentWindow) paymentWindow.document.write('<p>Preparing payment...</p>');
            } catch (pwErr) {
                console.warn('[SmartRide] Failed to open payment popup synchronously', pwErr);
                paymentWindow = null;
            }

            const initJson = await apiClient.post(`/api/payment/initialize/${dId}`, {
                amount: calculateTotal().total,
                currency: 'NGN',
                email: formData.recipientEmail || 'customer@swiftlyxpress.com',
                callback_url: `${window.location.origin}/customer/payment/callback`,
                metadata: { deliveryId: dId }
            });

            const initPayload = initJson?.data || initJson;
            const paymentObj = initPayload?.data?.payment || initPayload?.payment || initPayload?.data;
            const paymentReference = paymentObj?.reference || paymentObj?.id || paymentObj?.paymentId;
            const authorizationUrl = paymentObj?.authorizationUrl || paymentObj?.authorization_url || paymentObj?.url || paymentObj?.payment_url;

            if (!paymentReference && !authorizationUrl) {
                throw new Error('Payment initialization failed');
            }

            try {
                if (dId) setCookie('pending_payment_delivery_id', String(dId), 1);
                if (paymentReference) setCookie('pending_payment_id', String(paymentReference), 1);
            } catch (e) { }

            const cleanupOnPaymentCancel = async (did) => {
                try {
                    if (did) await cancelDelivery(did, { reason: 'payment_cancelled' });
                } catch (cleanupErr) {
                    console.warn('[SmartRide] Failed to cancel delivery on backend:', cleanupErr);
                }
                try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { }
                setIsProcessingPayment(false);
                setToastMsg('Payment was not completed. Your booking was cancelled.');
                setShowToast(true);
            };

            // If hosted authorization URL is provided, navigate popup to it
            if (authorizationUrl) {
                try {
                    if (paymentWindow) {
                        paymentWindow.location.href = authorizationUrl;
                    } else {
                        window.open(authorizationUrl, '_blank');
                    }

                    // Monitor popup closure
                    try {
                        const popupInterval = setInterval(() => {
                            try {
                                if (!paymentWindow || paymentWindow.closed) {
                                    clearInterval(popupInterval);
                                    const pending = getCookie('pending_payment_id');
                                    if (pending) {
                                        cleanupOnPaymentCancel(dId);
                                    }
                                }
                            } catch (e) {
                                clearInterval(popupInterval);
                            }
                        }, 1000);
                    } catch (monErr) { console.warn('[SmartRide] Failed to monitor payment popup:', monErr); }

                    setIsProcessingPayment(false);
                    return;
                } catch (navErr) {
                    console.error('[SmartRide] Failed to navigate popup to authorizationUrl', navErr);
                    // fall through to inline modal attempt
                }
            }

            // Fallback to inline Paystack modal if no hosted URL
            if (paymentReference) {
                try { if (paymentWindow) paymentWindow.close(); } catch (e) { }

                const PaystackPop = (await import('@paystack/inline-js')).default;
                const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxx';

                const handler = PaystackPop.setup({
                    key: paystackPublicKey,
                    email: formData.recipientEmail || 'customer@swiftlyxpress.com',
                    amount: calculateTotal().total * 100, // Paystack expects kobo
                    ref: paymentReference,
                    onClose: function () {
                        cleanupOnPaymentCancel(dId);
                    },
                    callback: function (response) {
                        try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { }
                        // Navigate to payment callback route to let SPA finalize
                        try { router.push('/customer/payment/callback', 'root', 'replace'); } catch (e) { window.location.href = '/customer/payment/callback'; }
                    }
                });

                handler.openIframe();
                setIsProcessingPayment(false);
                return;
            }
        } catch (err) {
            console.error('Payment error', err);
            alert(err?.message || 'Payment failed');
            setIsProcessingPayment(false);
        }
    };

    // Helper for size category dropdown
    const handleSizeCategoryChange = (label) => {
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
    };

    const handleWeightCategoryChange = (label) => {
        const valueMap = { 'Light': 'light', 'Heavy': 'heavy', 'Very Heavy': 'very_heavy' };
        setFormData({ ...formData, weightCategory: valueMap[label] });
    };

    const handleSliderChange = (e) => {
        const scale = parseInt(e.target.value, 10);
        const dimsMap = { small: [30, 30, 30], big: [50, 40, 30], very_big: [80, 60, 50] };
        // Derive category from scale thresholds so slider controls category too
        let derivedCat = 'small';
        if (scale <= 90) derivedCat = 'small';
        else if (scale <= 110) derivedCat = 'big';
        else derivedCat = 'very_big';
        const weightMap = { small: 'light', big: 'heavy', very_big: 'very_heavy' };
        const base = dimsMap[derivedCat] || dimsMap.small;
        const factor = scale / 100;
        const dims = `${Math.round(base[0] * factor)}×${Math.round(base[1] * factor)}×${Math.round(base[2] * factor)} cm`;
        setFormData({ ...formData, sizeScale: scale, dimensions: dims, sizeCategory: derivedCat, weightCategory: weightMap[derivedCat] });

        const min = 70;
        const max = 130;
        const percent = (scale - min) / (max - min);
        setSliderBubble({ percent, value: scale });
        if (hideBubbleTimeout.current) clearTimeout(hideBubbleTimeout.current);
        hideBubbleTimeout.current = setTimeout(() => setSliderBubble(null), 1200);
    };

    const handleSliderMouseMove = () => {
        if (!sliderRef.current) return;
        const val = parseInt(sliderRef.current.value, 10);
        const min = 70; const max = 130;
        const percent = (val - min) / (max - min);
        setSliderBubble({ percent, value: val });
    };

    const handleSliderMouseLeave = () => {
        if (hideBubbleTimeout.current) clearTimeout(hideBubbleTimeout.current);
        hideBubbleTimeout.current = setTimeout(() => setSliderBubble(null), 800);
    };



    if (currentStep === 'form') {
        return (
            <div className="min-h-screen bg-[#FFFFFF]">
                {/* Header */}
                <YummyText>
                    <div className="">
                        <div className="max-w-6xl mx-auto px-0 sm:px-4 py-0 h-16 md:h-32 flex items-center justify-between mb-8 md:mb-0 sm:md-0 lg:mb-0t">
                            <div className="flex items-center gap-3">
                                {!(embedMode && isMobile) && (
                                    <a href="/" className="inline-block">
                                        <img src="/swiftly-logo.svg" alt="Swiftly" className="h-40 md:h-22 lg:h-22 object-contain" />
                                    </a>
                                )}
                                {embedMode && isMobile && (
                                    <YummyText className="text-xs text-[#0F172A] border border-[#00B75A] rounded-full px-2 py-0.5">Smartride</YummyText>
                                )}
                            </div>
                            <div>
                                <button
                                    type="button"
                                    aria-label="Close"
                                    onClick={async () => {
                                        // If in finding/found state, cancel the smart ride delivery
                                        if ((currentStep === 'finding-rider' || currentStep === 'rider-found') && deliveryId) {
                                            try {
                                                await cancelDelivery(deliveryId);
                                            } catch (e) {
                                                console.warn('[SmartRide] Cancel delivery failed:', e);
                                            }
                                            try { localStorage.removeItem('smartride_delivery_id'); } catch (e) { }
                                            // Notify other clients and server
                                            try { socketService.connect(); socketService.emit('delivery:cancelled', { deliveryId }); } catch (e) { }
                                            try { window.dispatchEvent(new CustomEvent('delivery:cancelled', { detail: { deliveryId } })); } catch (e) { }
                                            setIsSearching(false);
                                            setCurrentStep('form');
                                            return;
                                        }

                                        if (embedMode && typeof onClose === 'function') return onClose();
                                        return router.goBack();
                                    }}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border-[1.5px] border-[#0A0A0A] bg-white hover:bg-white"
                                >
                                    <X className="w-5 h-5 text-[#0A0A0A]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </YummyText>

                {/* Breadcrumb */}
                <YummyText>
                    <div className="max-w-4xl mx-auto -mt-6 px-0 sm:px-6 lg:px-8">
                        <Breadcrumb steps={breadcrumbSteps} currentStep={getCurrentStepIndex()} onStepClick={handleBreadcrumbClick} />
                    </div>
                </YummyText>

                {/* Page Title */}
                <div className="max-w-5xl mx-auto px-0 md:px-4 lg:px-4">
                    <div className="mb-3">
                        <YummyText className="text-3xl font-medium text-gray-900 mb-1">Book a Delivery</YummyText>
                        <YummyText className="text-gray-600 text-sm">Schedule a new shipment with ease</YummyText>
                    </div>
                </div>

                {/* Main Content */}
                <YummyText>
                    <div className="max-w-5xl mx-auto px-0 md:px-4 lg:px-4 pb-12 mt-6">
                        <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
                            <form onSubmit={handleSubmit}>
                                {/* Delivery Information Section */}
                                <div className="mb-3">
                                    <YummyText className="text-lg font-medium text-gray-900 mb-1">Delivery Information</YummyText>
                                    <YummyText className="text-sm text-gray-600 mb-8 md:mb-4 lg:mb-4">Fill in the details below to schedule your delivery</YummyText>

                                    {/* Delivery Type */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 mt-5">Delivery Type</label>
                                        <StyledDropdown
                                            value={
                                                formData.deliveryType === 'express' ? 'Express (Same day)' :
                                                    formData.deliveryType === 'standard' ? 'Standard (1-2 days)' :
                                                        formData.deliveryType === 'economy' ? 'Economy (3-5 days)' :
                                                            formData.deliveryType === 'smart_ride' ? 'Smart Ride' :
                                                                'Smart Ride'
                                            }
                                            onChange={(label) => {
                                                const deliveryTypeMap = {
                                                    'Express (Same day)': 'express',
                                                    'Standard (1-2 days)': 'standard',
                                                    'Economy (3-5 days)': 'economy',
                                                    'Smart Ride': 'smart_ride'
                                                };
                                                const selectedValue = deliveryTypeMap[label];

                                                // If user selected a non-Smart Ride option, redirect to main booking
                                                if (selectedValue !== 'smart_ride') {
                                                    // Store form data in sessionStorage for pre-filling
                                                    try {
                                                        sessionStorage.setItem('booking_form_data', JSON.stringify({
                                                            ...formData,
                                                            deliveryType: selectedValue
                                                        }));
                                                    } catch (e) {
                                                        console.warn('Failed to store form data:', e);
                                                    }

                                                    // Close Smart Ride if embedded
                                                    if (embedMode && typeof onClose === 'function') {
                                                        onClose();
                                                    }

                                                    // Navigate to main booking page
                                                    router.push('/customer/book', 'root', 'replace');
                                                } else {
                                                    setFormData({ ...formData, deliveryType: selectedValue });
                                                }
                                            }}
                                            options={['Express (Same day)', 'Standard (1-2 days)', 'Economy (3-5 days)', 'Smart Ride']}
                                            tooltips={{
                                                'Express (Same day)': 'Fast delivery within the same day — starting from ₦1,200',
                                                'Standard (1-2 days)': 'Regular delivery in 1-2 days — starting from ₦800',
                                                'Economy (3-5 days)': 'Budget-friendly delivery in 3-5 days — starting from ₦800',
                                                'Smart Ride': 'Quick motorcycle delivery with instant rider matching — starting from ₦1,400'
                                            }}
                                            className="w-full border-[1.5px] border-gray-200 rounded-full"
                                            width="w-full"
                                        />
                                    </div>
                                </div>

                                {/* Pickup and Delivery Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Pickup Details */}
                                    <div>
                                        <div className="text-base font-medium text-[#0F172A] mb-4">
                                            Pickup Details
                                            <div className="border-t border-gray-300 mt-2"></div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#0F172A] mb-2">Sender Name</label>
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
                                                <label className="block text-sm font-medium text-[#0F172A] mb-2">Phone Number</label>
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
                                                <label className="block text-sm font-medium text-[#0F172A] mb-2">Pickup Address</label>
                                                <GoogleMapsAutocomplete
                                                    value={formData.pickupAddress}
                                                    onChange={(val) => setFormData({ ...formData, pickupAddress: val })}
                                                    onPlaceSelect={(place) => {
                                                        console.log('Pickup place selected:', place);
                                                        setFormData({ ...formData, pickupAddress: `${place.street}${place.city ? ', ' + place.city : ''}`, pickupPlace: place });
                                                    }}
                                                    onBlur={() => {
                                                        // Geocode if user typed manually and didn't select from dropdown
                                                        if (formData.pickupAddress && !formData.pickupPlace?.coordinates) {
                                                            geocodeAddress(formData.pickupAddress, 'pickup');
                                                        }
                                                    }}
                                                    placeholder="123 Main Street"
                                                    className="w-full"
                                                />
                                                {formData.pickupPlace?.coordinates && (
                                                    <p className="text-xs text-green-600 mt-1">✓ Location captured: {formData.pickupPlace.coordinates.lat.toFixed(4)}, {formData.pickupPlace.coordinates.lng.toFixed(4)}</p>
                                                )}
                                            </div>

                                            {/* Pickup Date removed for Smart Ride */}
                                        </div>
                                    </div>

                                    {/* Delivery Details */}
                                    <div>
                                        <div className="text-base font-medium text-[#0F172A] mb-4">
                                            Delivery Details
                                            <div className="border-t border-gray-300 mt-2"></div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#0F172A] mb-2">Recipient Name</label>
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
                                                <label className="block text-sm font-medium text-[#0F172A] mb-2">Phone Number</label>
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
                                                <label className="block text-sm font-medium text-[#0F172A] mb-2">Delivery Address</label>
                                                <GoogleMapsAutocomplete
                                                    value={formData.deliveryAddress}
                                                    onChange={(val) => setFormData({ ...formData, deliveryAddress: val })}
                                                    onPlaceSelect={(place) => {
                                                        console.log('Delivery place selected:', place);
                                                        setFormData({ ...formData, deliveryAddress: `${place.street}${place.city ? ', ' + place.city : ''}`, deliveryPlace: place });
                                                    }}
                                                    onBlur={() => {
                                                        // Geocode if user typed manually and didn't select from dropdown
                                                        if (formData.deliveryAddress && !formData.deliveryPlace?.coordinates) {
                                                            geocodeAddress(formData.deliveryAddress, 'delivery');
                                                        }
                                                    }}
                                                    placeholder="456 Oak Avenue"
                                                    className="w-full"
                                                />
                                                {formData.deliveryPlace?.coordinates && (
                                                    <p className="text-xs text-green-600 mt-1">✓ Location captured: {formData.deliveryPlace.coordinates.lat.toFixed(4)}, {formData.deliveryPlace.coordinates.lng.toFixed(4)}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-[#0F172A] mb-2">Email (for notifications)</label>
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

                                <div className="border-t border-gray-300 my-5"></div>

                                {/* Package Details */}
                                <div>
                                    <div className="text-xl font-medium text-[#0F172A] mb-6">
                                        Package Details
                                        <div className="border-t border-gray-300 my-5"></div>
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
                                                    onChange={handleSizeCategoryChange}
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
                                                            <span className="text-xs font-medium text-[#00B75A]">{formData.dimensions}</span>
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
                                                        value={formData.sizeScale}
                                                        onChange={handleSliderChange}
                                                        onMouseMove={handleSliderMouseMove}
                                                        onMouseLeave={handleSliderMouseLeave}
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
                                                    onChange={handleWeightCategoryChange}
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

                                    {/* Package Description */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-[#0F172A] mb-2">Package Description</label>
                                        <textarea
                                            name="packageDescription"
                                            value={formData.packageDescription}
                                            onChange={handleChange}
                                            placeholder="Describe the contents of your package"
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none resize-none"
                                            required
                                        ></textarea>
                                    </div>

                                    {/* Optional Services for Smart Ride */}
                                    {/* Smart Ride features removed from form - priority offered during rider search */}

                                    {/* Live price preview removed for Smart Ride (hidden by design) */}

                                    {/* Package Image Upload */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-[#0F172A] mb-2">Package Image (optional)</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="package-image-upload"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        if (file.size > 10 * 1024 * 1024) {
                                                            alert('File size must be less than 10MB');
                                                            return;
                                                        }
                                                        setFormData({ ...formData, image: file });
                                                    }
                                                }}
                                            />
                                            {formData.image ? (
                                                <div className="relative border-2 border-[#00B75A] rounded-xl p-4 bg-[#F0FDF4]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg bg-[#00B75A]/10 flex items-center justify-center flex-shrink-0">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                                <polyline points="21 15 16 10 5 21" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-[#0F172A] truncate">{formData.image.name}</p>
                                                            <p className="text-xs text-[#64748B]">{(formData.image.size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, image: null })}
                                                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label
                                                    htmlFor="package-image-upload"
                                                    className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#00B75A] hover:bg-[#F0FDF4]/30 transition-all"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-12 h-12 rounded-full bg-[#F8F9FA] flex items-center justify-center">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="17 8 12 3 7 8" />
                                                                <line x1="12" y1="3" x2="12" y2="15" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-[#0F172A]">Click to upload package image</p>
                                                            <p className="text-xs text-[#64748B] mt-1">PNG, JPG up to 10MB</p>
                                                        </div>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Method Selection */}
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
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-center pt-4">
                                    <Button variant="primary" className="!w-full !py-4 !bg-[#00B75A] !text-sm !font-[400]">
                                        Review Summary
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </YummyText>

                {/* Payment Drawer/Modal (render inside form view) */}
                <YummyText>
                    {showPaymentDrawer && (
                        <div
                            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowPaymentDrawer(false)}
                        >
                            <div
                                className={`bg-white ${isMobile
                                    ? 'w-full rounded-t-3xl animate-slide-up'
                                    : 'w-full max-w-md rounded-2xl animate-scale-in'
                                    } shadow-2xl`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-[#0F172A]">Select Payment Method</h3>
                                    <button
                                        onClick={() => setShowPaymentDrawer(false)}
                                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-6 space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, paymentMethod: 'cash' });
                                            setTimeout(() => setShowPaymentDrawer(false), 150);
                                        }}
                                        style={{
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            borderColor: formData.paymentMethod === 'cash' ? '#00B75A' : '#E5E7EB',
                                            backgroundColor: formData.paymentMethod === 'cash' ? '#F0FDF4' : '#FFFFFF',
                                            boxShadow: formData.paymentMethod === 'cash' ? '0 0 0 6px rgba(16,185,129,0.06)' : 'none',
                                            outline: 'none'
                                        }}
                                        className={`w-full p-4 rounded-xl text-left transition-all`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-[#0F172A]">Cash on Delivery</p>
                                                <p className="text-xs text-[#64748B] mt-1">Pay with cash when your package is delivered</p>
                                            </div>
                                            {formData.paymentMethod === 'cash' && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, paymentMethod: 'card' });
                                            setTimeout(() => setShowPaymentDrawer(false), 150);
                                        }}
                                        style={{
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            borderColor: formData.paymentMethod === 'card' ? '#00B75A' : '#E5E7EB',
                                            backgroundColor: formData.paymentMethod === 'card' ? '#F0FDF4' : '#FFFFFF',
                                            boxShadow: formData.paymentMethod === 'card' ? '0 0 0 6px rgba(16,185,129,0.06)' : 'none',
                                            outline: 'none'
                                        }}
                                        className={`w-full p-4 rounded-xl text-left transition-all`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                                    <line x1="1" y1="10" x2="23" y2="10" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-[#0F172A]">Pay Online (Card)</p>
                                                <p className="text-xs text-[#64748B] mt-1">Secure payment with your card</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-4" />
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
                                                    <span className="text-xs font-medium text-[#64748B] px-2 py-0.5 bg-gray-100 rounded">Verve</span>
                                                </div>
                                            </div>
                                            {formData.paymentMethod === 'card' && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, paymentMethod: 'transfer' });
                                            setTimeout(() => setShowPaymentDrawer(false), 150);
                                        }}
                                        style={{
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            borderColor: formData.paymentMethod === 'transfer' ? '#00B75A' : '#E5E7EB',
                                            backgroundColor: formData.paymentMethod === 'transfer' ? '#F0FDF4' : '#FFFFFF',
                                            boxShadow: formData.paymentMethod === 'transfer' ? '0 0 0 6px rgba(16,185,129,0.06)' : 'none',
                                            outline: 'none'
                                        }}
                                        className={`w-full p-4 rounded-xl text-left transition-all`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                    <line x1="12" y1="1" x2="12" y2="23" />
                                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-[#0F172A]">Bank Transfer</p>
                                                <p className="text-xs text-[#64748B] mt-1">Transfer directly to our account</p>
                                            </div>
                                            {formData.paymentMethod === 'transfer' && (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12" />
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
                </YummyText>
            </div>
        );
    }

    // Package Summary
    if (currentStep === 'summary') {
        const pricing = calculateTotal();

        return (
            <div className="min-h-screen bg-[#FFFFFF]">
                <YummyText>
                    <div className="bg-white">
                        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-0 h-16 md:h-32 flex items-center justify-between mb-8 md:mb-0 sm:md-0 lg:mb-0t">
                            <div className="flex items-center gap-3">
                                {!(embedMode && isMobile) && (
                                    <a href="/" className="inline-block">
                                        <img src="/swiftly-logo.svg" alt="Swiftly" className="h-40 md:h-22 lg:h-22 object-contain" />
                                    </a>
                                )}
                                {embedMode && isMobile && (
                                    <YummyText className="text-xs text-[#0F172A] border border-[#00B75A] rounded-full px-2 py-0.5">Smartride</YummyText>
                                )}
                            </div>
                            <div>
                                <button
                                    type="button"
                                    aria-label="Close"
                                    onClick={() => {
                                        if (embedMode && typeof onClose === 'function') return onClose();
                                        return router.goBack();
                                    }}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border-[1.5px] border-[#0A0A0A] bg-white hover:bg-white"
                                >
                                    <X className="w-5 h-5 text-[#0A0A0A]" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Breadcrumb */}
                    <div className="max-w-4xl mx-auto -mt-6 px-4 sm:px-6 lg:px-8">
                        <Breadcrumb steps={breadcrumbSteps} currentStep={getCurrentStepIndex()} onStepClick={handleBreadcrumbClick} />
                    </div>

                    <div className="max-w-5xl mx-auto px-4 pb-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-9">
                            {/* Pick-Up Information */}
                            <div className="relative w-full bg-transparent">
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <defs>
                                        <mask id="scallop-mask-pickup" x="0" y="0" width="100%" height="100%">
                                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                            <g fill="black">
                                                {Array.from({ length: 20 }).map((_, i) => (
                                                    <circle key={`top-p-${i}`} cx={i * 40 + 20} cy={0} r={15} />
                                                ))}
                                            </g>
                                            <g fill="black">
                                                {Array.from({ length: 20 }).map((_, i) => (
                                                    <circle key={`bottom-p-${i}`} cx={i * 40 + 20} cy="100%" r={15} />
                                                ))}
                                            </g>
                                        </mask>
                                    </defs>
                                </svg>

                                <div
                                    className="bg-[#F7F7F7] text-[#0F172A] p-12 pb-12 min-h-[260%] rounded-2xl"
                                    style={{ mask: 'url(#scallop-mask-pickup)', WebkitMask: 'url(#scallop-mask-pickup)' }}
                                >
                                    <h2 className="text-xl font-semibold mb-5">Pick-Up Information</h2>
                                    <p className="mb-1"><span className="text-[#4B5563] font-[600]">Sender Name</span><span className="mx-3 font-[300]">{formData.senderName}</span></p>
                                    <p className="mb-1"><span className="text-[#4B5563] font-[600]">Phone</span><span className="mx-3 font-[300]">{formData.senderPhone}</span></p>
                                    <p className="mb-1"><span className="text-[#4B5563] font-[600]">Address</span><span className="mx-3 font-[300]">{formData.pickupAddress}</span></p>
                                    <p className="mb-1"><span className="text-[#4B5563] font-[600]">Pick-Up Confirmation</span><span className="mx-3 font-[300]">{formData.senderName}</span></p>
                                    <p className="mb-1"><span className="text-[#4B5563] font-[600]">Pick-up date</span><span className="mx-3 font-[300]">{formData.pickupDate} 1:42 PM</span></p>
                                    <p className="mb-1"><span className="text-[#4B5563] font-[600]">Notes</span><span className="mx-3 font-[300]">Delivery at the front desk</span></p>
                                </div>
                            </div>

                            {/* Delivery Information */}
                            <div className="relative w-full bg-transparent">
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <defs>
                                        <mask id="scallop-mask-delivery" x="0" y="0" width="100%" height="100%">
                                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                            <g fill="black">
                                                {Array.from({ length: 20 }).map((_, i) => (
                                                    <circle key={`top-d-${i}`} cx={i * 40 + 20} cy={0} r={15} />
                                                ))}
                                            </g>
                                            <g fill="black">
                                                {Array.from({ length: 20 }).map((_, i) => (
                                                    <circle key={`bottom-d-${i}`} cx={i * 40 + 20} cy="100%" r={15} />
                                                ))}
                                            </g>
                                        </mask>
                                    </defs>
                                </svg>

                                <div
                                    className="bg-[#00B75A] text-white p-12 pb-12 min-h-[260%] rounded-2xl"
                                    style={{ mask: 'url(#scallop-mask-delivery)', WebkitMask: 'url(#scallop-mask-delivery)' }}
                                >
                                    <h2 className="text-xl font-semibold text-white mb-5">Delivery Information</h2>
                                    <p className="mb-1"><span className="text-[#FFFFFF] font-[600]">Recipient Name</span><span className="mx-3 font-[300]">{formData.recipientName}</span></p>
                                    <p className="mb-1"><span className="text-[#FFFFFF] font-[600]">Phone</span><span className="mx-3 font-[300]">{formData.recipientPhone}</span></p>
                                    <p className="mb-1"><span className="text-[#FFFFFF] font-[600]">Address</span><span className="mx-3 font-[300]">{formData.deliveryAddress}</span></p>
                                    <p className="mb-1"><span className="text-[#FFFFFF] font-[600]">Delivery Confirmation</span><span className="mx-3 font-[300]">{formData.recipientName}</span></p>
                                    <p className="mb-1"><span className="text-[#FFFFFF] font-[600]">Delivery Date</span><span className="mx-3 font-[300]">{formData.pickupDate} 3:42 PM</span></p>
                                    <p className="mb-1"><span className="text-[#FFFFFF] font-[600]">Notes</span><span className="mx-3 font-[300]">Delivery at the front desk</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Package Information */}
                        <div className="bg-white rounded-2xl mt-2">
                            <h2 className="text-xl font-medium text-[#1E1E1E] mb-6">Package Information</h2>

                            <div className="grid grid-cols-3 gap-6 mb-6">
                                <div>
                                    <p className="text-sm text-[#1E1E1E] font-medium mb-1">Size Category</p>
                                    <p className="font-sm text-[#1E1E1E] bg-[#FBFBFB] rounded-md px-3 py-3">
                                        {formData.sizeCategory === 'small' ? 'Small' : formData.sizeCategory === 'big' ? 'Medium' : 'Very Big'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-[#1E1E1E] font-medium mb-1">Dimensions</p>
                                    <p className="font-sm text-[#1E1E1E] bg-[#FBFBFB] rounded-md px-3 py-3">{formData.dimensions}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-[#1E1E1E] font-medium mb-1">Weight Category</p>
                                    <p className="font-sm text-[#1E1E1E] bg-[#FBFBFB] rounded-md px-3 py-3">
                                        {formData.weightCategory === 'light' ? 'Light' : formData.weightCategory === 'heavy' ? 'Heavy' : 'Very Heavy'}
                                        {formData.weight && ` (${formData.weight})`}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-[#1E1E1E] font-medium mb-1">Package Description</p>
                                <p className="font-sm text-[#1E1E1E] bg-[#FBFBFB] rounded-md px-3 py-3">{formData.packageDescription}</p>
                            </div>

                            {/* Declared value removed */}

                            {/* Pricing - Smart Ride charge breakdown */}
                            <div className="bg-[#F0FDF4] rounded-xl p-6 mb-6">
                                <h3 className="text-base font-semibold text-[#0F172A] mb-4">Cost Breakdown</h3>
                                <div className="space-y-2.5">
                                    {/* Base Fare */}
                                    <div className="flex justify-between items-center text-[#0F172A]">
                                        <span className="text-[15px]">Base Fare</span>
                                        <span className="text-[15px]">₦{Number(pricing.baseFare || 0).toLocaleString()}</span>
                                    </div>

                                    {/* Smart Ride Fee */}
                                    {(pricing.smartRideFee > 0 || (formData.deliveryType === 'smart_ride' && (pricing.total || 0) > (pricing.baseFare || 0))) && (
                                        <div className="flex justify-between items-center text-[#0F172A]">
                                            <span className="text-[15px]">Smart Ride</span>
                                            <span className="text-[15px]">₦{Number(pricing.smartRideFee || Math.max(0, (pricing.total || 0) - (pricing.baseFare || 0) - (pricing.distanceCharge || 0))).toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Distance charge */}
                                    {pricing.distanceCharge > 0 && (
                                        <div className="flex justify-between items-center text-[#0F172A]">
                                            <span className="text-[15px]">Distance ({Number(pricing.distance || 0).toFixed(1)} km)</span>
                                            <span className="text-[15px]">₦{Number(pricing.distanceCharge).toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Priority / Errand (if ever used) */}
                                    {pricing.priorityFee > 0 && (
                                        <div className="flex justify-between items-center text-orange-700">
                                            <span className="text-sm">Priority Delivery</span>
                                            <span className="text-sm font-medium">+₦{Number(pricing.priorityFee).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {pricing.errandFee > 0 && (
                                        <div className="flex justify-between items-center text-[#0F172A]">
                                            <span className="text-[15px]">Special Errand</span>
                                            <span className="text-[15px]">₦{Number(pricing.errandFee).toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="border-t border-gray-300 pt-3 mt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-medium text-[#0F172A]">Total</span>
                                            <span className="text-2xl font-medium text-[#00B75A]">₦{Number(pricing.total || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    className="px-4 py-2 mt-6 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors text-[#000000] font-medium text-[15px]"
                                    onClick={() => setCurrentStep('form')}
                                >
                                    Back
                                </button>

                                <Button
                                    variant="primary"
                                    className="!flex-1 !py-4 !bg-[#00B75A] !text-sm !font-[400] !rounded-full mt-6"
                                    onClick={findRider}
                                    disabled={isSearching}
                                >
                                    {isSearching ? 'Finding rider...' : 'Find a Rider'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </YummyText>
            </div>
        );
    }

    // Finding Rider / Rider Found
    if (currentStep === 'finding-rider' || currentStep === 'rider-found') {
        return (
            <div className="min-h-screen bg-[#FFFFFF]">
                {/* Header */}
                <YummyText>
                    <div className="bg-white">
                        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-0 h-16 md:h-32 flex items-center justify-between mb-8 md:mb-0 sm:md-0 lg:mb-0t">
                            <div className="flex items-center gap-3">
                                {!(embedMode && isMobile) && (
                                    <a href="/" className="inline-block">
                                        <img src="/swiftly-logo.svg" alt="Swiftly" className="h-40 md:h-22 lg:h-22 object-contain" />
                                    </a>
                                )}
                                {embedMode && isMobile && (
                                    <YummyText className="text-xs text-[#0F172A] border border-[#00B75A] rounded-full px-2 py-0.5">Smartride</YummyText>
                                )}
                            </div>
                            <div>
                                <button
                                    type="button"
                                    aria-label="Close"
                                    onClick={async () => {
                                        // FIXED: Enhanced cancel logic to remove from available orders
                                        if ((currentStep === 'finding-rider' || currentStep === 'rider-found') && deliveryId) {
                                            try {
                                                console.log('[SmartRide] 🚫 Cancelling delivery:', deliveryId);
                                                await cancelDelivery(deliveryId, { reason: 'user_cancelled' });

                                                // Clear all SmartRide session data
                                                try {
                                                    localStorage.removeItem('smartride_delivery_id');
                                                    localStorage.removeItem('smartride_step');
                                                    localStorage.removeItem('smartride_rider_details');
                                                } catch (e) { }

                                                // Notify system that delivery was cancelled
                                                try {
                                                    socketService.connect();
                                                    socketService.emit('delivery:cancelled', { deliveryId });
                                                } catch (e) { }

                                                try {
                                                    window.dispatchEvent(new CustomEvent('delivery:cancelled', { detail: { deliveryId } }));
                                                } catch (e) { }

                                                setIsSearching(false);
                                                setDeliveryId(null);
                                            } catch (e) {
                                                console.warn('[SmartRide] Cancel delivery failed:', e);
                                            }
                                        }

                                        // Reset to initial state
                                        setCurrentStep('form');

                                        if (embedMode && typeof onClose === 'function') return onClose();
                                        return router.goBack();
                                    }}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border-[1.5px] border-[#0A0A0A] bg-white hover:bg-white"
                                >
                                    <X className="w-5 h-5 text-[#0A0A0A]" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto -mt-6 px-4">
                        <Breadcrumb steps={breadcrumbSteps} currentStep={getCurrentStepIndex()} onStepClick={handleBreadcrumbClick} />
                    </div>

                    <div className="max-w-6xl mx-auto px-4 py-8">
                        {/* Map with centered bike icon */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-6 relative" style={{ height: '320px' }}>
                            <div className="relative w-full h-full">
                                <GoogleMap
                                    center={{ lat: 6.5244, lng: 3.3792 }}
                                    zoom={13}
                                    showMarker={false}
                                    className="w-full h-full"
                                />

                                {/* Centered bike icon on map */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                                    <div className="w-12 h-12 bg-[#00B75A] rounded-2xl flex items-center justify-center shadow-lg">
                                        <Bike className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* Glass overlay: only when sending request (creating delivery) or when rider found */}
                                {(currentStep === 'finding-rider' && isSendingRequest) || (currentStep === 'rider-found' && currentStep !== 'rider-details') ? (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(6px) saturate(120%)' }}>
                                        <div className="text-center">
                                            {isSendingRequest ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D68F] mx-auto mb-4"></div>
                                                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Creating your delivery</h2>
                                                    <p className="text-sm text-gray-600">One moment...</p>
                                                </>
                                            ) : currentStep === 'rider-found' ? (
                                                <>
                                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                                    </div>
                                                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Rider Found! 🎉</h2>
                                                    <p className="text-sm text-gray-600">A rider has accepted your delivery</p>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Single rider card + Send request / Request sent / Search again */}
                        {isSendingRequest && (
                            <div className="max-w-5xl mx-auto -mt-4 opacity-20">
                                <div className="bg-white rounded-3xl p-6 shadow-sm">
                                    <div className="flex items-start gap-6 mb-4">
                                        <div className="w-32 h-32 bg-gray-200 rounded-2xl overflow-hidden flex-shrink-0"></div>
                                        <div className="flex-1">
                                            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                                            <div className="grid grid-cols-3 gap-4 mt-2">
                                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 w-32">
                                            <div className="h-9 bg-gray-200 rounded-full"></div>
                                            <div className="h-9 bg-gray-200 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!isSendingRequest && (currentStep === 'finding-rider' || currentStep === 'rider-found') && (
                            <div className="max-w-5xl mx-auto mt-4">
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-semibold text-[#0F172A] mb-3">
                                        {requestSentToRiderId ? 'Request status' : 'Closest rider'}
                                    </h3>
                                    {nearbyRidersLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00B75A] border-t-transparent"></div>
                                            <span className="ml-3 text-sm text-gray-600">Loading riders...</span>
                                        </div>
                                    ) : nearbyRiders.length === 0 && !requestSentToRiderId ? (
                                        <p className="text-sm text-gray-600 py-4">No riders in your area right now.</p>
                                    ) : nearbyRiders.length >= 1 ? (
                                        <>
                                            {(() => {
                                                const r = nearbyRiders[0];
                                                const rid = String(r?.riderId ?? r?._id ?? '');
                                                const alreadySent = requestSentToRiderId === rid;
                                                return (
                                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                                        <div className="w-14 h-14 rounded-full bg-[#00B75A]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {r.profileImage ? (
                                                                <img src={r.profileImage} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Bike className="w-7 h-7 text-[#00B75A]" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-base font-medium text-[#0F172A]">{r.fullName || 'Rider'}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {r.distanceKm != null ? `~${r.distanceKm} km away` : 'Distance unknown'}
                                                                {r.estimatedArrivalMinutes != null ? ` · ~${r.estimatedArrivalMinutes} min` : ''}
                                                                {r.ratingDisplay ? ` · ${r.ratingDisplay}` : ''}
                                                            </p>
                                                            {alreadySent ? (
                                                                currentStep === 'rider-found' ? (
                                                                    <div className="mt-3">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => proceedToRiderDetails(r)}
                                                                            className="px-5 py-2.5 bg-[#00B75A] text-white rounded-full font-semibold text-sm hover:bg-[#00A050]"
                                                                        >
                                                                            Proceed
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-sm text-[#00B75A] font-medium mt-2">Request sent to {requestSentToRiderName || r.fullName || 'this rider'}. They can accept or decline.</p>
                                                                        <button
                                                                            type="button"
                                                                            onClick={cancelRequest}
                                                                            disabled={isCancellingRequest}
                                                                            className="mt-3 px-5 py-2.5 border-2 border-red-200 text-red-600 rounded-full font-semibold text-sm hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                        >
                                                                            {isCancellingRequest ? 'Cancelling...' : 'Cancel request'}
                                                                        </button>
                                                                    </>
                                                                )
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => sendRequestToRider(r)}
                                                                    disabled={isSendingRequest}
                                                                    className="mt-3 px-5 py-2.5 bg-[#00B75A] text-white rounded-full font-semibold text-sm hover:bg-[#00A050] disabled:opacity-60 disabled:cursor-not-allowed"
                                                                >
                                                                    Send request
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            {!requestSentToRiderId && (
                                                <button
                                                    type="button"
                                                    onClick={searchAgain}
                                                    disabled={nearbyRidersLoading}
                                                    className="mt-4 w-full py-2.5 border-2 border-gray-200 text-gray-700 rounded-full font-semibold text-sm hover:bg-gray-50 disabled:opacity-60"
                                                >
                                                    Search again
                                                </button>
                                            )}
                                        </>
                                    ) : requestSentToRiderId ? (
                                        <div className="py-4">
                                            {currentStep === 'rider-found' ? (
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => proceedToRiderDetails()}
                                                        className="px-5 py-2.5 bg-[#00B75A] text-white rounded-full font-semibold text-sm hover:bg-[#00A050]"
                                                    >
                                                        Proceed
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm text-[#00B75A] font-medium mb-3">Request sent to {requestSentToRiderName || 'your rider'}. They can accept or decline.</p>
                                                    <button
                                                        type="button"
                                                        onClick={cancelRequest}
                                                        disabled={isCancellingRequest}
                                                        className="px-5 py-2.5 border-2 border-red-200 text-red-600 rounded-full font-semibold text-sm hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        {isCancellingRequest ? 'Cancelling...' : 'Cancel request'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                </YummyText>
            </div>
        );
    }

    // Rider Details & Tracking
    if (currentStep === 'rider-details') {
        return (
            <div className="min-h-screen bg-[#FFFFFF]">
                {/* Header */}
                <YummyText>
                    <div className="bg-white">
                        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-0 h-16 md:h-32 flex items-center justify-between mb-8 md:mb-0 sm:md-0 lg:mb-0t">
                            <div className="flex items-center gap-3">
                                <a href="/" className="inline-block">
                                    <img src="/swiftly-logo.svg" alt="Swiftly" className="h-40 md:h-22 lg:h-22 object-contain" />
                                </a>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    aria-label="Close"
                                    onClick={() => {
                                        if (embedMode && typeof onClose === 'function') return onClose();
                                        return router.goBack();
                                    }}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border-[1.5px] border-[#0A0A0A] bg-white hover:bg-white"
                                >
                                    <X className="w-5 h-5 text-[#0A0A0A]" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto -mt-6 px-4">
                        <Breadcrumb steps={breadcrumbSteps} currentStep={getCurrentStepIndex()} onStepClick={handleBreadcrumbClick} />
                    </div>

                    <div className="max-w-6xl mx-auto px-4 py-8">
                        {/* Map with route visualization */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-8 relative" style={{ height: '400px' }}>
                            <GoogleMap
                                center={{ lat: 6.5244, lng: 3.3792 }}
                                zoom={13}
                                pickupLocation={formData.pickupPlace?.coordinates || { lat: 6.5244, lng: 3.3792 }}
                                deliveryLocation={formData.deliveryPlace?.coordinates || { lat: 6.5344, lng: 3.3892 }}
                                riderLocation={{ lat: 6.5294, lng: 3.3842 }}
                                showRoute={true}
                                className="w-full h-full"
                            />
                            {/* Debug info */}
                            {(!formData.pickupPlace?.coordinates || !formData.deliveryPlace?.coordinates) && (
                                <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 text-xs text-yellow-800 z-10">
                                    ⚠️ Using default coordinates. Please select addresses from autocomplete dropdown.
                                </div>
                            )}
                        </div>

                        {/* Rider Details Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Rider Details</h2>

                            <div className="flex items-start gap-8 mb-10">
                                {/* Rider Photo */}
                                <div className="w-40 h-40 bg-gray-200 rounded-2xl overflow-hidden flex-shrink-0">
                                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400"></div>
                                </div>

                                {/* Rider Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <h3 className="text-2xl font-semibold text-gray-900">Kufre Sunday</h3>
                                        <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold border border-green-200">
                                            Rider ID Verified
                                        </span>
                                        <span className="text-gray-500 text-sm font-medium">120 Rides</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 mt-6">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Bike Model</p>
                                            <p className="font-semibold text-gray-900">Bajaj Boxer</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Plate number</p>
                                            <p className="font-semibold text-gray-900">LAG 234 KJ</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Estimated Arrival</p>
                                            <p className="font-semibold text-gray-900">6 mins</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3">
                                    <button className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#00B75A] text-white rounded-full hover:bg-[#00A050] transition-colors shadow-sm">
                                        <Phone className="w-5 h-5" />
                                        <span className="font-semibold">Call</span>
                                    </button>
                                    <button className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white border-2 border-[#00B75A] text-[#00B75A] rounded-full hover:bg-green-50 transition-colors">
                                        <MessageCircle className="w-5 h-5" />
                                        <span className="font-semibold">Chat</span>
                                    </button>
                                </div>
                            </div>

                            {/* Tracking Steps */}
                            <div className="border-t border-gray-200 pt-10">
                                <h3 className="text-xl font-semibold text-gray-900 mb-8">Tracking</h3>

                                <div className="flex items-center justify-between max-w-3xl mx-auto">
                                    {/* Dispatch */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-[#00B75A] rounded-full flex items-center justify-center mb-3 shadow-sm">
                                            <Bike className="w-10 h-10 text-white" />
                                        </div>
                                        <p className="text-sm font-semibold text-[#00B75A]">Dispatch</p>
                                    </div>

                                    {/* Connecting line */}
                                    <div className="flex-1 h-1 bg-gray-200 mx-6"></div>

                                    {/* Pick Up */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <Package className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-400">Pick Up</p>
                                    </div>

                                    {/* Connecting line */}
                                    <div className="flex-1 h-1 bg-gray-200 mx-6"></div>

                                    {/* Delivery */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <CheckCircle className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-400">Delivery</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </YummyText>
            </div>
        );
    }

    return (
        <>
            {/* Payment Method Drawer/Modal */}
            {showPaymentDrawer && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowPaymentDrawer(false)}
                >
                    <div
                        className={`bg-white ${isMobile
                            ? 'w-full rounded-t-3xl animate-slide-up'
                            : 'w-full max-w-md rounded-2xl animate-scale-in'
                            } shadow-2xl`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <YummyText>
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-[#0F172A]">Select Payment Method</h3>
                                <button
                                    onClick={() => setShowPaymentDrawer(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* Payment Options */}
                            <div className="p-6 space-y-3">
                                {/* Cash on Delivery */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, paymentMethod: 'cash' });
                                        setShowPaymentDrawer(false);
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
                                    className={`w-full p-4 rounded-xl text-left transition-all`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-[#0F172A]">Cash on Delivery</p>
                                            <p className="text-xs text-[#64748B] mt-1">Pay with cash when your package is delivered</p>
                                        </div>
                                        {formData.paymentMethod === 'cash' && (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                </button>

                                {/* Pay Online (Card) */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, paymentMethod: 'card' });
                                        setShowPaymentDrawer(false);
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
                                    className={`w-full p-4 rounded-xl text-left transition-all`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                                <line x1="1" y1="10" x2="23" y2="10" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-[#0F172A]">Pay Online (Card)</p>
                                            <p className="text-xs text-[#64748B] mt-1">Secure payment with your card</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-4" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
                                                <span className="text-xs font-medium text-[#64748B] px-2 py-0.5 bg-gray-100 rounded">Verve</span>
                                            </div>
                                        </div>
                                        {formData.paymentMethod === 'card' && (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                </button>

                                {/* Bank Transfer */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, paymentMethod: 'transfer' });
                                        setShowPaymentDrawer(false);
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
                                    className={`w-full p-4 rounded-xl text-left transition-all`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                <line x1="12" y1="1" x2="12" y2="23" />
                                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-[#0F172A]">Bank Transfer</p>
                                            <p className="text-xs text-[#64748B] mt-1">Transfer directly to our account</p>
                                        </div>
                                        {formData.paymentMethod === 'transfer' && (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
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
                        </YummyText>
                    </div>
                </div>
            )}

            <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
            <IonToast
                isOpen={showToast}
                message={toastMsg}
                duration={3000}
                onDidDismiss={() => setShowToast(false)}
            />
        </>
    );
}