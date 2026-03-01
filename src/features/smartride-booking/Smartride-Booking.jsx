'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Bike, Phone, MessageCircle, Package, CheckCircle, X } from 'lucide-react';
import { IonPage, IonContent, IonToast, useIonRouter, IonIcon } from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import Button from '../../components/Button';
import { YummyText } from '../../components/YummyText';
import Breadcrumb from '../../components/Breadcrumb';
import GoogleMap from '../../components/TrackingMap';
import GoogleMapsAutocomplete from '../../components/GoogleMapsAutocomplete';
import { BASE_FARE, PER_KM_RATE, PLATFORM_COMMISSION_RATE } from '../../utils/pricing';
import StyledDropdown from '../../components/StyledDropdown';
import axios from 'axios';
import { getCookie, setCookie, deleteCookie, setJSONCookie, getJSONCookie } from '../../utils/cookies';
import { createDelivery, cancelDelivery, isAuthenticated, getDeliveryEstimate, getDeliveryById, getNearbyRiders, getCustomerProfile } from '../../utils/authApi';
import socketService from '../../services/socket.service';
import { playNotificationSound } from '../../utils/notificationSound';
import DeliveryChat from './DeliveryChat';
import { calculateDistance } from '../../utils/pricing';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftlyxpress.com';

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    withCredentials: true
});

// Add request interceptor to attach auth token (match Book.jsx behavior)
apiClient.interceptors.request.use((config) =>
{
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

export default function SmartRideBooking({ embedMode = false, initialData = {}, onClose = null })
{
    const router = useIonRouter();
    const [currentStep, setCurrentStep] = useState('form');
    const [isSearching, setIsSearching] = useState(false);
    const sliderRef = useRef(null);
    const hideBubbleTimeout = useRef(null);
    const [sliderBubble, setSliderBubble] = useState(null);


    const [formData, setFormData] = useState(() =>
    {
        try {
            const userId = (() =>
            {
                try {
                    const userDataCookie = getCookie('user_data');
                    if (userDataCookie) {
                        const userData = JSON.parse(userDataCookie);
                        return userData._id || userData.id || null;
                    }
                } catch (e) { }
                return null;
            })();

            const key = userId ? `smartride_form_data_${userId}` : 'smartride_form_data';
            const saved = localStorage.getItem(key);
            const base = saved ? JSON.parse(saved) : {};
            const defaults = {
                deliveryType: 'smart_ride',
                senderName: '',
                senderPhone: '',
                pickupAddress: '',
                pickupPlace: null,
                recipientName: '',
                recipientPhone: '',
                deliveryAddress: '',
                deliveryPlace: null,
                recipientEmail: '',
                sizeCategory: 'small',
                weightCategory: 'light',
                dimensions: '30×30×30 cm',
                sizeScale: 100,
                weight: '',
                packageDescription: '',
                image: null,
                paymentMethod: '',
                paymentNotes: ''
            };
            // When parent passes initialData (e.g. from Express form), it wins over localStorage so switching Express → Smart Ride keeps the info
            const hasInitial = initialData && typeof initialData === 'object' && Object.keys(initialData).length > 0;
            return hasInitial ? { ...defaults, ...base, ...initialData } : { ...defaults, ...base };
        } catch (e) {
            const defaults = {
                deliveryType: 'smart_ride',
                senderName: '',
                senderPhone: '',
                pickupAddress: '',
                pickupPlace: null,
                recipientName: '',
                recipientPhone: '',
                deliveryAddress: '',
                deliveryPlace: null,
                recipientEmail: '',
                sizeCategory: 'small',
                weightCategory: 'light',
                dimensions: '30×30×30 cm',
                sizeScale: 100,
                weight: '',
                packageDescription: '',
                image: null,
                paymentMethod: '',
                paymentNotes: ''
            };
            return { ...defaults, ...initialData };
        }
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
    const [riderDetails, setRiderDetails] = useState(() =>
    {
        try {
            const userId = getCurrentUserId();
            const key = userId ? `smartride_rider_details_${userId}` : 'smartride_rider_details';
            const json = localStorage.getItem(key);
            return json ? JSON.parse(json) : null;
        } catch (e) { return null; }
    });
    const [deliveryData, setDeliveryData] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [driverLocation, setDriverLocation] = useState(null);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    // Get current user ID for user-specific storage
    const getCurrentUserId = () =>
    {
        try {
            const userDataCookie = getCookie('user_data');
            if (userDataCookie) {
                const userData = JSON.parse(userDataCookie);
                return userData._id || userData.id || null;
            }
        } catch (e) {
            console.error('[SmartRide] Failed to get user ID:', e);
        }
        return null;
    };

    const currentUserId = getCurrentUserId();

    // Helper functions for user-specific storage
    const getStorageKey = (baseName) =>
    {
        return currentUserId ? `${baseName}_${currentUserId}` : baseName;
    };

    const setSmartRideStorage = (baseName, value) =>
    {
        if (!currentUserId) return; // Don't store if no user logged in
        const key = getStorageKey(baseName);
        try {
            if (typeof value === 'string') {
                localStorage.setItem(key, value);
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (e) {
            console.error('[SmartRide] Storage error:', e);
        }
    };

    const getSmartRideStorage = (baseName) =>
    {
        const key = getStorageKey(baseName);
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    };

    // Normalize any existing stored rider details on mount so UI uses vehicle fields
    useEffect(() =>
    {
        if (!currentUserId) return;
        try {
            const key = `smartride_rider_details_${currentUserId}`;
            const stored = localStorage.getItem(key);
            if (!stored) return;
            const parsed = JSON.parse(stored);
            const norm = normalizeDriverProfile(parsed);
            if (JSON.stringify(norm) !== JSON.stringify(parsed)) {
                try { localStorage.setItem(key, JSON.stringify(norm)); } catch (e) { }
                setRiderDetails(norm);
            } else {
                setRiderDetails(parsed);
            }
        } catch (e) { }
    }, [currentUserId]);

    // Persist form data so refresh doesn't force user to start over (user-specific)
    useEffect(() =>
    {
        if (!currentUserId) return; // Only persist if user is logged in
        try {
            const timeout = setTimeout(() =>
            {
                const key = `smartride_form_data_${currentUserId}`;
                try { localStorage.setItem(key, JSON.stringify(formData)); } catch (e) { }
            }, 300);
            return () => clearTimeout(timeout);
        } catch (e) { }
    }, [formData, currentUserId]);

    // Auto-fill sender details from logged-in customer profile; fields remain editable
    useEffect(() =>
    {
        const customerToken = getCookie('customer_token') || getCookie('auth_token');
        if (!customerToken) return;

        let cancelled = false;
        (async () =>
        {
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
                        ...(address && !prev.pickupAddress && { pickupAddress: address }),
                    }));
                }
            } catch (e) {
                if (!cancelled) console.warn('[SmartRide] Could not load customer profile for sender auto-fill:', e);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Helper: attempt to fetch a driver's public/profile info by id (best-effort)
    const fetchDriverProfileById = async (driverId) =>
    {
        if (!driverId) return null;
        try {
            // Best-effort: try a few likely endpoints; backend may or may not support these.
            const candidates = [
                `/api/driver/${driverId}`,
                `/api/drivers/${driverId}`,
                `/api/driver/profile/${driverId}`,
                `/api/driver/public/${driverId}`
            ];
            for (const path of candidates) {
                try {
                    const res = await apiClient.get(path);
                    const profile = res?.data?.driver || res?.data || res;
                    if (profile) return profile;
                } catch (e) {
                    // ignore and try next
                }
            }
        } catch (e) { }
        return null;
    };

    // Normalize various possible driver profile shapes into a consistent object
    const normalizeDriverProfile = (profile) =>
    {
        if (!profile) return profile;
        const out = { ...profile };
        try {
            const vehicle = profile.vehicle || profile.vehicleInfo || profile.vehicleDetails || profile.vehicle_data || profile.verification?.vehicle || {};
            const verification = profile.verification || {};

            // fallback keys
            const model = vehicle.model || vehicle.vehicleModel || vehicle.bikeModel || vehicle.makeModel || profile.bikeModel || profile.vehicleModel || '';
            const plateNumber = vehicle.plateNumber || vehicle.plate || vehicle.plate_number || vehicle.licensePlate || profile.plateNumber || profile.plate || '';
            const profileImage = profile.profileImage || profile.profilePhoto || profile.imageUrl || profile.avatar || profile.photo || verification.profilePhotoUrl || null;
            const phone = profile.phone || profile.phoneNumber || profile.contact || profile.mobile || verification.contactInfo?.phone || null;
            const ridesCount = profile.ridesCount || profile.totalRides || profile.deliveriesCompleted || profile.completedDeliveries || null;

            // Extract verification documents
            const idDocumentUrl = verification.idDocumentUrl || profile.idDocumentUrl || null;
            const driversLicenseUrl = verification.vehicle?.driversLicenseUrl || verification.driversLicenseUrl || profile.driversLicenseUrl || null;
            const verificationStatus = verification.verificationStatus || profile.verificationStatus || null;

            out.vehicle = { ...(out.vehicle || {}), model: model || undefined, plateNumber: plateNumber || undefined };
            if (profileImage) out.profileImage = profileImage;
            if (phone) out.phone = phone;
            if (ridesCount != null) out.ridesCount = ridesCount;
            if (idDocumentUrl) out.idDocumentUrl = idDocumentUrl;
            if (driversLicenseUrl) out.driversLicenseUrl = driversLicenseUrl;
            if (verificationStatus) out.verificationStatus = verificationStatus;
            if (verification) out.verification = verification;
        } catch (e) { }
        return out;
    };

    useEffect(() =>
    {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Calculate distance and fetch price whenever addresses change
    useEffect(() =>
    {
        const pickupCoords = formData.pickupPlace?.coordinates;
        const deliveryCoords = formData.deliveryPlace?.coordinates;

        const updatePrice = async () =>
        {
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
                        const payload = response.data?.data ?? response.data;
                        setEstimatedPrice(payload);
                        setDistanceKm(payload.distance ?? response.data?.distance);
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
    useEffect(() =>
    {
        const handlePaymentMessage = (event) =>
        {
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
    useEffect(() =>
    {
        const onDeliveryAccepted = async (e) =>
        {
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

            const storedId = String(deliveryId || localStorage.getItem('smartride_delivery_id') || getCookie('smartride_delivery_id') || '');
            console.log('[SmartRide] Comparing candidate IDs to storedId:', { candidateIds, storedId, deliveryId });

            const directMatch = storedId && candidateIds.some(id => String(id) === String(storedId));
            if (directMatch) {
                console.log('[SmartRide] ✅ Direct ID match found — moving to rider-found');
                // Play notification sound for rider acceptance
                playNotificationSound();
                try {
                    const storedStepNow = localStorage.getItem('smartride_step');
                    // If user already proceeded to rider-details, preserve that choice
                    try { setDeliveryData(detail?.delivery || detail?.order || detail || null); } catch (e) { }
                    try {
                        const rd = detail?.rider || detail?.delivery?.rider || detail?.order?.rider || {};
                        let finalRd = rd;
                        if (rd && (rd._id || rd.id)) {
                            const driverId = rd._id || rd.id;
                            const profile = await fetchDriverProfileById(driverId).catch(() => null);
                            if (profile) finalRd = { ...(rd || {}), ...(normalizeDriverProfile(profile) || {}) };
                        }

                        if (storedStepNow === 'rider-details') {
                            setIsSearching(false);
                            setRiderDetails(finalRd || {});
                            try { localStorage.setItem('smartride_rider_details', JSON.stringify(finalRd || {})); } catch (err) { }
                            try { setJSONCookie('smartride_rider_details', finalRd || {}); } catch (err) { }
                        } else if (storedStepNow === 'rider-found') {
                            setIsSearching(false);
                            setCurrentStep('rider-found');
                            setRiderDetails(finalRd || {});
                        } else {
                            setIsSearching(false);
                            setCurrentStep('rider-found');
                            setRiderDetails(finalRd || {});
                            try {
                                localStorage.setItem('smartride_step', 'rider-found');
                                localStorage.setItem('smartride_rider_details', JSON.stringify(finalRd || {}));
                            } catch (err) { console.warn('[SmartRide] Failed to store rider details:', err); }
                            try { setCookie('smartride_step', 'rider-found'); } catch (err) { }
                            try { setJSONCookie('smartride_rider_details', finalRd || {}); } catch (err) { }
                            try { setJSONCookie('smartride_rider_details', finalRd || {}); } catch (err) { }
                        }
                    } catch (err) { console.warn('[SmartRide] delivery accept handling error:', err); }
                } catch (err) { console.warn('[SmartRide] delivery accept handling error:', err); }
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
                        try {
                            const storedStepNow = localStorage.getItem('smartride_step');
                            if (storedStepNow === 'rider-details') {
                                setIsSearching(false);
                                try { localStorage.setItem('smartride_rider_details', JSON.stringify(detail?.rider || {})); } catch (err) { }
                            } else {
                                setIsSearching(false);
                                setCurrentStep('rider-found');
                                try {
                                    localStorage.setItem('smartride_step', 'rider-found');
                                    localStorage.setItem('smartride_rider_details', JSON.stringify(detail?.rider || {}));
                                } catch (err) { console.warn('[SmartRide] Failed to store rider details:', err); }
                            }
                        } catch (err) { console.warn('[SmartRide] delivery accept handling error:', err); }
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
                        try {
                            const storedStepNow = localStorage.getItem('smartride_step');
                            if (storedStepNow === 'rider-details') {
                                setIsSearching(false);
                                try { localStorage.setItem('smartride_rider_details', JSON.stringify(detail?.rider || {})); } catch (err) { }
                            } else {
                                setIsSearching(false);
                                setCurrentStep('rider-found');
                                try {
                                    localStorage.setItem('smartride_step', 'rider-found');
                                    localStorage.setItem('smartride_rider_details', JSON.stringify(detail?.rider || {}));
                                } catch (err) { console.warn('[SmartRide] Failed to store rider details:', err); }
                            }
                        } catch (err) { console.warn('[SmartRide] delivery accept handling error:', err); }
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
        // Listen for multiple event names since backend may use different variations
        const handleSocketAcceptance = (data) =>
        {
            console.log('[SmartRide] 🔌 Socket delivery event received:', data);
            onDeliveryAccepted({ detail: data });
        };

        try {
            socketService.connect();
            socketService.on('delivery:accepted', handleSocketAcceptance);
            socketService.on('delivery:assigned', handleSocketAcceptance);
            socketService.on('delivery:status', handleSocketAcceptance);
        } catch (e) {
            console.warn('[SmartRide] Socket listener failed:', e);
        }

        return () =>
        {
            window.removeEventListener('delivery:accepted', onDeliveryAccepted);
            try {
                socketService.off('delivery:accepted', handleSocketAcceptance);
                socketService.off('delivery:assigned', handleSocketAcceptance);
                socketService.off('delivery:status', handleSocketAcceptance);
            } catch (e) { }
        };
    }, [deliveryId]);

    // Listen for verification completion events to sync rider profile data
    useEffect(() =>
    {
        const handleVerificationCompleted = (e) =>
        {
            const profile = e?.detail?.profile || null;
            const verificationData = e?.detail?.verificationData || null;
            if (profile) {
                try {
                    const norm = normalizeDriverProfile(profile);
                    try { setRiderDetails(norm); localStorage.setItem('smartride_rider_details', JSON.stringify(norm)); } catch (err) { }
                    try { setJSONCookie('smartride_rider_details', norm); } catch (err) { }
                } catch (err) { }
            } else if (verificationData) {
                // Merge verificationData into riderDetails
                try {
                    const existing = riderDetails || {};
                    const merged = {
                        ...existing,
                        phone: verificationData.contactInfo?.phone || existing.phone,
                        vehicle: { ...(existing.vehicle || {}), ...(verificationData.vehicle || {}) }
                    };
                    setRiderDetails(merged);
                    localStorage.setItem('smartride_rider_details', JSON.stringify(merged));
                } catch (err) { }
            }
        };

        window.addEventListener('verification:completed', handleVerificationCompleted);
        return () => window.removeEventListener('verification:completed', handleVerificationCompleted);
    }, [riderDetails]);

    // Poll delivery status as a fallback when socket events are missed.
    // This avoids forcing the customer to refresh the page while keeping them on the form.
    useEffect(() =>
    {
        if (!deliveryId) return;
        let cancelled = false;
        let interval = null;

        const poll = async () =>
        {
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

        return () =>
        {
            cancelled = true;
            if (interval) clearInterval(interval);
        };
    }, [deliveryId]);

    // Socket: rider declined the invitation — clear request state and show "Search again"
    useEffect(() =>
    {
        socketService.connect();
        const handleInvitationRejected = (data) =>
        {
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
        return () =>
        {
            try { socketService.off('delivery:invitation:rejected', handleInvitationRejected); } catch (e) { }
        };
    }, [deliveryId]);

    // Listen for delivery status updates (from rider actions) and refresh delivery/rider details
    useEffect(() =>
    {
        if (!deliveryId) return;

        const refreshDelivery = async (id) =>
        {
            try {
                const resp = await getDeliveryById(id);
                const delivery = resp?.data?.delivery || resp?.data || resp;
                if (!delivery) return;

                const rd = delivery?.rider || delivery?.assignedDriver || delivery?.driver || null;
                if (rd) {
                    try {
                        let finalRd = rd;
                        if (rd && (rd._id || rd.id)) {
                            const driverId = rd._id || rd.id;
                            const profile = await fetchDriverProfileById(driverId).catch(() => null);
                            if (profile) finalRd = { ...(rd || {}), ...(normalizeDriverProfile(profile) || {}) };
                        }
                        try { localStorage.setItem('smartride_rider_details', JSON.stringify(finalRd)); } catch (e) { }
                        setRiderDetails(finalRd);
                    } catch (e) { console.warn('[SmartRide] Failed merging driver profile:', e); }
                }
                try { setDeliveryData(delivery); } catch (e) { }

                // If delivery moved into active states, ensure stored step reflects progress
                const status = (delivery.status || '').toString().toLowerCase();
                if (status.includes('accepted') || status.includes('assigned') || status.includes('picked') || rd) {
                    try {
                        const storedStepNow = localStorage.getItem('smartride_step');
                        if (storedStepNow !== 'rider-details') {
                            localStorage.setItem('smartride_step', 'rider-found');
                        }
                    } catch (e) { }
                }
            } catch (e) {
                console.warn('[SmartRide] Failed to refresh delivery on status update:', e);
            }
        };

        const handleStatusChanged = async (e) =>
        {
            const dId = e?.detail?.deliveryId || e?.detail?.id || e?.detail?.delivery?._id;
            if (!dId) return;
            if (String(dId) === String(deliveryId)) {
                await refreshDelivery(deliveryId);

                // Check if delivery is completed and trigger rating modal
                const newStatus = e?.detail?.newStatus || e?.detail?.status;
                if (newStatus) {
                    const statusLower = newStatus.toLowerCase();
                    if (statusLower === 'delivered' || statusLower === 'completed') {
                        try {
                            const resp = await getDeliveryById(deliveryId);
                            const delivery = resp?.data?.delivery || resp?.data || resp;
                            const alreadyRated = delivery?.rating || delivery?.customerRating || delivery?.hasRated;

                            if (!alreadyRated) {
                                console.log('[SmartRide] 🔔 Delivery completed via event! Showing rating modal in 2s');
                                setTimeout(() =>
                                {
                                    console.log('[SmartRide] 🚀 Dispatching rating:show event');
                                    window.dispatchEvent(new CustomEvent('rating:show', { detail: delivery }));
                                }, 2000);
                            }
                        } catch (err) {
                            console.warn('[SmartRide] Failed to check rating status:', err);
                        }
                    }
                }
            }
        };

        const handleDeliveryUpdated = async (e) =>
        {
            const dId = e?.detail?.deliveryId || e?.detail?.id || e?.detail?.delivery?._id;
            if (!dId) return;
            if (String(dId) === String(deliveryId)) {
                await refreshDelivery(deliveryId);

                // Check if delivery is completed and trigger rating modal
                const newStatus = e?.detail?.newStatus || e?.detail?.status;
                if (newStatus) {
                    const statusLower = newStatus.toLowerCase();
                    if (statusLower === 'delivered' || statusLower === 'completed') {
                        try {
                            const resp = await getDeliveryById(deliveryId);
                            const delivery = resp?.data?.delivery || resp?.data || resp;
                            const alreadyRated = delivery?.rating || delivery?.customerRating || delivery?.hasRated;

                            if (!alreadyRated) {
                                console.log('[SmartRide] 🔔 Delivery completed via updated event! Showing rating modal in 2s');
                                setTimeout(() =>
                                {
                                    console.log('[SmartRide] 🚀 Dispatching rating:show event');
                                    window.dispatchEvent(new CustomEvent('rating:show', { detail: delivery }));
                                }, 2000);
                            }
                        } catch (err) {
                            console.warn('[SmartRide] Failed to check rating status:', err);
                        }
                    }
                }
            }
        };

        window.addEventListener('delivery:statusChanged', handleStatusChanged);
        window.addEventListener('delivery:updated', handleDeliveryUpdated);
        try {
            socketService.on('delivery:statusChanged', handleStatusChanged);
            socketService.on('delivery:updated', handleDeliveryUpdated);
        } catch (e) { }

        return () =>
        {
            window.removeEventListener('delivery:statusChanged', handleStatusChanged);
            window.removeEventListener('delivery:updated', handleDeliveryUpdated);
            try {
                socketService.off('delivery:statusChanged', handleStatusChanged);
                socketService.off('delivery:updated', handleDeliveryUpdated);
            } catch (e) { }
        };
    }, [deliveryId]);

    // Ensure rider profile (vehicle info) is fetched and merged when showing rider details
    useEffect(() =>
    {
        let mounted = true;
        const ensureProfile = async () =>
        {
            try {
                // Prefer canonical delivery data when available
                let rd = null;
                if (deliveryId) {
                    try {
                        const resp = await getDeliveryById(deliveryId);
                        const delivery = resp?.data?.delivery || resp?.data || resp;
                        rd = delivery?.rider || delivery?.assignedDriver || delivery?.driver || null;
                        if (delivery && mounted) try { setDeliveryData(delivery); } catch (e) { }
                    } catch (e) { /* ignore */ }
                }

                // Fallback: use stored riderDetails
                if (!rd) {
                    try {
                        const stored = localStorage.getItem('smartride_rider_details');
                        rd = stored ? JSON.parse(stored) : riderDetails;
                    } catch (e) { rd = riderDetails; }
                }

                if (!rd) return;

                const driverId = rd._id || rd.id || rd.riderId;
                if (!driverId) return;

                const profile = await fetchDriverProfileById(driverId).catch(() => null);
                if (profile && mounted) {
                    const merged = { ...(rd || {}), ...(normalizeDriverProfile(profile) || {}) };
                    try { localStorage.setItem('smartride_rider_details', JSON.stringify(merged)); } catch (e) { }
                    try { setJSONCookie('smartride_rider_details', merged); } catch (e) { }
                    setRiderDetails(merged);
                }
            } catch (e) {
                console.warn('[SmartRide] ensureProfile failed:', e);
            }
        };

        if (currentStep === 'rider-details') ensureProfile();
        return () => { mounted = false; };
    }, [currentStep, deliveryId]);

    // Real-time tracking for rider-details step: listen for location and status updates
    useEffect(() =>
    {
        if (currentStep !== 'rider-details' || !deliveryId) return;

        let socketCleanup = () => { };

        try {
            socketService.connect();
            const room = `delivery:${deliveryId}`;

            const onConnectJoin = () =>
            {
                try { socketService.joinRoom(room); } catch (e) { }
            };

            socketService.on('connect', onConnectJoin);
            try { socketService.joinRoom(room); } catch (e) { }

            const handleLocationUpdate = (data) =>
            {
                if (data && data.location) {
                    console.log('[SmartRide] Driver location updated:', data.location);
                    setDriverLocation(data.location);
                }
            };

            const handleDeliveryStatusUpdate = async (data) =>
            {
                console.log('[SmartRide] Delivery status updated:', data);
                const newStatus = data?.status || data?.delivery?.status;
                if (newStatus) {
                    try {
                        const resp = await getDeliveryById(deliveryId);
                        const delivery = resp?.data?.delivery || resp?.data || resp;
                        if (delivery) {
                            setDeliveryData(delivery);
                            const rd = delivery?.rider || delivery?.assignedDriver || delivery?.driver;
                            if (rd) {
                                const driverId = rd._id || rd.id;
                                const profile = await fetchDriverProfileById(driverId).catch(() => null);
                                const merged = profile ? { ...(rd || {}), ...(normalizeDriverProfile(profile) || {}) } : rd;
                                setRiderDetails(merged);
                                try { localStorage.setItem('smartride_rider_details', JSON.stringify(merged)); } catch (e) { }
                                try { setJSONCookie('smartride_rider_details', merged); } catch (e) { }
                            }

                            // Show rating modal if delivery is completed and not yet rated
                            const statusLower = (delivery.status || '').toLowerCase();
                            const isCompleted = statusLower === 'delivered' || statusLower === 'completed';
                            const alreadyRated = delivery.rating || delivery.customerRating || delivery.hasRated;

                            if (isCompleted && !alreadyRated) {
                                console.log('[SmartRide] 🔔 Delivery completed! Showing rating modal in 2s');
                                setTimeout(() =>
                                {
                                    console.log('[SmartRide] 🚀 Dispatching rating:show event for delivery:', delivery._id || delivery.id);
                                    window.dispatchEvent(new CustomEvent('rating:show', { detail: delivery }));
                                }, 2000);
                            }
                        }
                    } catch (e) { console.warn('[SmartRide] Failed to refresh on status update:', e); }
                }
            };

            const handleNewMessage = (data) =>
            {
                console.log('[SmartRide] Received chat message:', data);

                // Extract message and sender info
                const messageData = data?.message || data;
                const senderRole = messageData?.senderRole || data?.senderRole || data?.role;

                // Only count messages from driver (not from customer/self)
                if (senderRole === 'driver' || senderRole === 'rider') {
                    console.log('[SmartRide] Message from driver/rider, showChat:', showChat);
                    // Don't increment if chat modal is open
                    if (!showChat) {
                        setUnreadMessageCount(prev =>
                        {
                            const newCount = prev + 1;
                            console.log('[SmartRide] Incrementing unread count to:', newCount);
                            return newCount;
                        });
                    }
                }
            };

            socketService.on('delivery:location:updated', handleLocationUpdate);
            socketService.on('delivery:statusChanged', handleDeliveryStatusUpdate);
            socketService.on('delivery:updated', handleDeliveryStatusUpdate);
            socketService.on('delivery:chat:message', handleNewMessage);

            // Initialize driver location from deliveryData
            if (deliveryData) {
                if (deliveryData.currentLocation) {
                    const loc = deliveryData.currentLocation;
                    if (Array.isArray(loc)) {
                        setDriverLocation({ lat: loc[1], lng: loc[0] });
                    } else if (loc.lat && loc.lng) {
                        setDriverLocation(loc);
                    } else if (loc.coordinates) {
                        setDriverLocation({ lat: loc.coordinates[1], lng: loc.coordinates[0] });
                    }
                } else if (deliveryData.estimatedRiderLocation) {
                    const loc = deliveryData.estimatedRiderLocation;
                    if (loc.lat != null && loc.lng != null) {
                        setDriverLocation({ lat: Number(loc.lat), lng: Number(loc.lng) });
                    }
                }
            }

            socketCleanup = () =>
            {
                try { socketService.off('connect', onConnectJoin); } catch (e) { }
                try { socketService.leaveRoom(room); } catch (e) { }
                try { socketService.off('delivery:location:updated', handleLocationUpdate); } catch (e) { }
                try { socketService.off('delivery:statusChanged', handleDeliveryStatusUpdate); } catch (e) { }
                try { socketService.off('delivery:updated', handleDeliveryStatusUpdate); } catch (e) { }
                try { socketService.off('delivery:chat:message', handleNewMessage); } catch (e) { }
            };
        } catch (e) {
            console.warn('[SmartRide] Real-time tracking setup failed:', e);
        }

        return () => { socketCleanup(); };
    }, [currentStep, deliveryId, deliveryData, showChat]);

    // Fetch nearby riders when on Rider Matching step (so we call /api/customer/nearby-riders)
    useEffect(() =>
    {
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
            .then((res) =>
            {
                if (cancelled) return;
                const list = res?.data?.riders ?? res?.riders ?? (Array.isArray(res?.data) ? res.data : []);
                setNearbyRiders(Array.isArray(list) ? list : []);
            })
            .catch(() =>
            {
                if (!cancelled) setNearbyRiders([]);
            })
            .finally(() =>
            {
                if (!cancelled) setNearbyRidersLoading(false);
            });
        return () => { cancelled = true; };
    }, [currentStep, formData.pickupPlace?.coordinates?.lat, formData.pickupPlace?.coordinates?.lng]);

    useEffect(() =>
    {
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
            setTimeout(() =>
            {
                router.push('/auth/customer/login?returnUrl=/customer/smartride-booking', 'root', 'replace');
            }, 2000);
        }
    }, [router]);

    // Restore SmartRide session on refresh: validate stored delivery id before resuming finding state
    useEffect(() =>
    {
        let mounted = true;
        (async () =>
        {
            try {
                const stored = localStorage.getItem('smartride_delivery_id') || getCookie('smartride_delivery_id');
                const storedStep = localStorage.getItem('smartride_step') || getCookie('smartride_step');

                // If there's no stored delivery id, but there is a saved step, restore UI-only state
                if (!stored) {
                    if (storedStep) {
                        try {
                            const sd = storedStep;
                            let parsedRd = null;
                            try {
                                const storedRd = localStorage.getItem('smartride_rider_details');
                                if (storedRd) parsedRd = JSON.parse(storedRd);
                                else {
                                    const cookieRd = getJSONCookie('smartride_rider_details');
                                    if (cookieRd) parsedRd = cookieRd;
                                }
                            } catch (e) { parsedRd = null; }

                            if (sd === 'rider-details') {
                                if (mounted) {
                                    setCurrentStep('rider-details');
                                    setIsSearching(false);
                                    if (parsedRd) try { setRiderDetails(parsedRd); } catch (e) { }
                                    console.log('[SmartRide] Restored rider-details step without delivery id');
                                }
                            } else if (sd === 'rider-found') {
                                if (mounted) {
                                    setCurrentStep('rider-found');
                                    setIsSearching(false);
                                    if (parsedRd) try { setRiderDetails(parsedRd); } catch (e) { }
                                }
                            } else if (sd === 'finding-rider') {
                                if (mounted) {
                                    setCurrentStep('finding-rider');
                                    setIsSearching(true);
                                }
                            }

                            if (parsedRd && mounted) {
                                const rid = parsedRd._id || parsedRd.id || parsedRd.riderId || parsedRd.driverId;
                                if (rid) setRequestSentToRiderId(String(rid));
                                const name = parsedRd.fullName || parsedRd.name || parsedRd.displayName || requestSentToRiderName;
                                if (name) setRequestSentToRiderName(name);
                            }
                        } catch (e) { console.warn('[SmartRide] Failed to restore UI-only step:', e); }
                    }
                    return;
                }

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
                        try { deleteCookie('smartride_delivery_id'); } catch (e) { }
                        try { deleteCookie('smartride_step'); } catch (e) { }
                        try { deleteCookie('smartride_rider_details'); } catch (e) { }
                        return;
                    }

                    if (mounted) {
                        setDeliveryId(stored);
                        console.log('[SmartRide] Restored delivery id:', stored);
                        try { setDeliveryData(delivery); } catch (e) { }

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
                            const onConnectJoin = () =>
                            {
                                try { socketService.joinRoom(room); } catch (e) { console.warn('[SmartRide] joinRoom failed on connect:', e); }
                                try { socketService.off('connect', onConnectJoin); } catch (e) { }
                            };
                            try { socketService.on('connect', onConnectJoin); } catch (e) { }
                            try { socketService.joinRoom(room); } catch (e) { }
                        } catch (e) { console.warn('[SmartRide] Failed to join stored delivery room:', e); }

                        // Restore to appropriate step based on stored step first, then delivery status
                        // Prioritize stored step to preserve user's last viewed screen on refresh
                        if (storedStep === 'rider-details' || status === 'accepted' || status === 'in_progress' || status === 'picked-up' || status === 'in-transit') {
                            try {
                                const rd = delivery?.rider || delivery?.assignedDriver || delivery?.driver || null;
                                let finalRd = rd;
                                if (rd && (rd._id || rd.id)) {
                                    const driverId = rd._id || rd.id;
                                    const profile = await fetchDriverProfileById(driverId).catch(() => null);
                                    if (profile) {
                                        finalRd = { ...(rd || {}), ...(normalizeDriverProfile(profile) || {}) };
                                    }
                                }
                                if (finalRd) {
                                    try { setRiderDetails(finalRd); localStorage.setItem('smartride_rider_details', JSON.stringify(finalRd)); } catch (e) { }
                                    try { setJSONCookie('smartride_rider_details', finalRd); } catch (e) { }
                                } else {
                                    // If no rider in delivery, try to restore from stored rider details
                                    try {
                                        const storedRd = localStorage.getItem('smartride_rider_details');
                                        if (storedRd) {
                                            const parsedRd = JSON.parse(storedRd);
                                            setRiderDetails(parsedRd);
                                        } else {
                                            // Also check cookie fallback
                                            const cookieRd = getJSONCookie('smartride_rider_details');
                                            if (cookieRd) setRiderDetails(cookieRd);
                                        }
                                    } catch (e) { }
                                }
                            } catch (e) { console.warn('[SmartRide] Failed to restore rider details:', e); }
                            setCurrentStep('rider-details');
                            setIsSearching(false);
                            console.log('[SmartRide] Restored to rider-details step');
                        } else if (storedStep === 'rider-found') {
                            setCurrentStep('rider-found');
                            setIsSearching(false);
                            console.log('[SmartRide] Restored to rider-found step');
                        } else {
                            setCurrentStep('finding-rider');
                            setIsSearching(false);
                            console.log('[SmartRide] Restored to finding-rider step');
                        }
                    }
                } catch (e) {
                    // Only clear stored delivery info when server indicates the resource is gone or access denied.
                    const status = e?.response?.status || e?.status || null;
                    if (status === 404 || status === 410 || status === 403) {
                        try {
                            localStorage.removeItem('smartride_delivery_id');
                            localStorage.removeItem('smartride_step');
                            localStorage.removeItem('smartride_rider_details');
                        } catch (er) { }
                    } else {
                        console.warn('[SmartRide] getDeliveryById failed (kept stored state):', e);
                    }
                }
            } catch (e) {
                // ignore
            }
        })();

        return () => { mounted = false; };
    }, []);

    const handleChange = (e) =>
    {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Geocode manually typed address
    const geocodeAddress = async (address, fieldType) =>
    {
        if (!address || address.trim().length < 5) return;

        try {
            if (typeof window === 'undefined' || !window.google?.maps) return;

            const geocoder = new window.google.maps.Geocoder();
            const result = await geocoder.geocode({ address, componentRestrictions: { country: 'NG' } });

            if (result.results && result.results.length > 0) {
                const place = result.results[0];
                const components = place.address_components || [];

                const extract = () =>
                {
                    const out = { city: '', state: '', postal_code: '', country: '' };
                    components.forEach(c =>
                    {
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

    const handleSubmit = (e) =>
    {
        e.preventDefault();
        console.log('Form submitted:', formData);
        setCurrentStep('summary');
    };

    const calculateTotal = () =>
    {
        if (estimatedPrice) {
            const pb = estimatedPrice.pricingBreakdown;
            // Use backend breakdown so displayed price matches stored price after create
            if (pb && (estimatedPrice.estimatedPrice != null || pb.total != null)) {
                const total = Number(estimatedPrice.estimatedPrice ?? pb.total ?? 0);
                return {
                    total,
                    riderEarnings: Number(pb.riderEarnings ?? total * 0.7),
                    baseFare: Number(pb.baseFare ?? 0),
                    distance: Number(estimatedPrice.distance ?? 0),
                    distanceCharge: Number(pb.distanceCharge ?? 0),
                    smartRideFee: Number(pb.smartRideFee ?? 0),
                    priorityFee: 0,
                    errandFee: Number(pb.errandFee ?? 0),
                    waitingTimeFee: Number(pb.waitingTimeFee ?? 0),
                    subtotal: Number(pb.subtotal ?? total),
                    discountAmount: Number(pb.discount ?? 0),
                    discountPercentage: (pb.discount && total + pb.discount > 0) ? Math.round((pb.discount / (total + pb.discount)) * 100) : 0,
                    note: estimatedPrice.note
                };
            }
            // Fallback: local calculation
            const distance = estimatedPrice.distance ?? 0;
            const baseFare = 500;
            const distanceCharge = distance > 2 ? (distance - 2) * 150 : 0;
            const deliveryTypeFee = 600; // Smart Ride
            const total = baseFare + distanceCharge + deliveryTypeFee;
            return {
                total: Number(total),
                riderEarnings: Number(total * 0.7),
                baseFare,
                distance,
                distanceCharge: Number(distanceCharge),
                smartRideFee: deliveryTypeFee,
                priorityFee: 0,
                errandFee: 0,
                waitingTimeFee: 0,
                subtotal: Number(total),
                discountAmount: 0,
                discountPercentage: 0,
                note: null
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
            subtotal: 0,
            discountAmount: 0,
            discountPercentage: 0,
            note: null
        };
    };

    const breadcrumbSteps = ['Package Information', 'Package Summary', 'Booked ✓'];

    const getCurrentStepIndex = () =>
    {
        switch (currentStep) {
            case 'form': return 0;
            case 'summary': return 1;
            case 'booked': return 2;
            default: return 0;
        }
    };

    const handleBreadcrumbClick = (index) =>
    {
        if (index === 0) setCurrentStep('form');
        else if (index === 1) setCurrentStep('summary');
    };

    /**
     * bookNow — creates a SmartRide delivery immediately and puts it in the
     * shared available-orders pool (same as Express). No rider-search step.
     */
    const bookNow = async () =>
    {
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
            zipCode: pickupCoords.zipCode || '00000',
            country: pickupCoords.country || '',
            coordinates: pickupCoords.coordinates || { lat: 0, lng: 0 }
        } : { street: formData.pickupAddress || '', city: '', state: 'Unknown', zipCode: '00000', country: '', coordinates: { lat: 0, lng: 0 } };

        const deliveryAddrRaw = deliveryCoords ? {
            street: deliveryCoords.street || '',
            city: deliveryCoords.city || '',
            state: deliveryCoords.state || deliveryCoords.country || deliveryCoords.city || '',
            zipCode: deliveryCoords.zipCode || '00000',
            country: deliveryCoords.country || '',
            coordinates: deliveryCoords.coordinates || { lat: 0, lng: 0 }
        } : { street: formData.deliveryAddress || '', city: '', state: 'Unknown', zipCode: '00000', country: '', coordinates: { lat: 0, lng: 0 } };

        const { country: _pc, ...pickupNoCountry } = pickupAddrRaw;
        const { country: _dc, ...deliveryNoCountry } = deliveryAddrRaw;
        const pickupAddr = { ...pickupNoCountry, state: pickupAddrRaw.state || pickupAddrRaw.city || 'Unknown', zipCode: pickupAddrRaw.zipCode || '00000' };
        const deliveryAddr = { ...deliveryNoCountry, state: deliveryAddrRaw.state || deliveryAddrRaw.city || 'Unknown', zipCode: deliveryAddrRaw.zipCode || '00000' };

        const senderInfo = { name: (formData.senderName || '').trim() || undefined, phone: (formData.senderPhone || '').trim() || undefined };
        const recipientInfo = { name: (formData.recipientName || '').trim() || undefined, phone: (formData.recipientPhone || '').trim() || undefined, email: (formData.recipientEmail || '').trim() || undefined };

        const payload = {
            senderInfo: (senderInfo.name || senderInfo.phone) ? senderInfo : undefined,
            recipientInfo: (recipientInfo.name || recipientInfo.phone || recipientInfo.email) ? recipientInfo : undefined,
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
            // No invitedDriver — open to all riders (same as Express)
        };

        setIsSearching(true);
        try {
            let createResp = null;
            const srImageFiles = formData.images || (formData.image ? [formData.image] : []);
            if (srImageFiles.length > 0) {
                const fd = new FormData();
                srImageFiles.forEach(file => fd.append('images', file));
                Object.entries(payload).forEach(([k, v]) =>
                {
                    if (typeof v === 'object' && v !== null && !(v instanceof File)) fd.append(k, JSON.stringify(v));
                    else fd.append(k, String(v));
                });
                createResp = await createDelivery(fd);
            } else {
                createResp = await createDelivery(payload);
            }

            const deliveryObj = createResp?.data?.delivery || createResp?.delivery || createResp?.data || createResp;
            const dId = deliveryObj?._id || deliveryObj?.id || deliveryObj?.deliveryId || deliveryObj?.trackingNumber;
            if (!dId) throw new Error('Failed to create SmartRide delivery (no id returned)');

            // Clear form data
            try {
                const formKey = currentUserId ? `smartride_form_data_${currentUserId}` : 'smartride_form_data';
                localStorage.removeItem(formKey);
                ['smartride_step', 'smartride_delivery_id', 'smartride_rider_details'].forEach(k =>
                {
                    try { localStorage.removeItem(k); } catch (e) { }
                    try { localStorage.removeItem(`${k}_${currentUserId}`); } catch (e) { }
                });
            } catch (e) { }

            // Broadcast so riders see it immediately
            window.dispatchEvent(new Event('deliveries:refresh'));
            window.dispatchEvent(new CustomEvent('delivery:created', { detail: createResp?.data || createResp }));

            setToastMsg('SmartRide booked! Riders will pick it up shortly.');
            setShowToast(true);

            // Navigate to My Deliveries after a short delay so toast is visible
            setTimeout(() =>
            {
                try {
                    router.push('/customer/my-deliveries', 'root', 'replace');
                } catch (e) {
                    window.location.href = '/customer/my-deliveries';
                }
            }, 1200);
        } catch (err) {
            console.error('[SmartRide] bookNow error:', err);
            setToastMsg(err?.response?.data?.message || err?.message || 'Failed to book SmartRide. Please try again.');
            setShowToast(true);
        } finally {
            setIsSearching(false);
        }
    };

    // Persist current step so a page refresh preserves progress
    useEffect(() =>
    {
        try {
            if (currentStep) {
                localStorage.setItem('smartride_step', currentStep);
                try { setCookie('smartride_step', currentStep); } catch (e) { }
            }
        } catch (e) { }
    }, [currentStep]);

    const searchAgain = () =>
    {
        const coords = formData.pickupPlace?.coordinates;
        const lat = coords?.lat;
        const lng = coords?.lng;
        if (lat == null || lng == null) return;
        setNearbyRidersLoading(true);
        getNearbyRiders({ lat, lng, radiusKm: 20, limit: 1 })
            .then((res) =>
            {
                const list = res?.data?.riders ?? res?.riders ?? (Array.isArray(res?.data) ? res.data : []);
                setNearbyRiders(Array.isArray(list) ? list : []);
            })
            .catch(() => setNearbyRiders([]))
            .finally(() => setNearbyRidersLoading(false));
    };

    const sendRequestToRider = async (rider) =>
    {
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

        const senderInfo = { name: (formData.senderName || '').trim() || undefined, phone: (formData.senderPhone || '').trim() || undefined };
        const recipientInfo = { name: (formData.recipientName || '').trim() || undefined, phone: (formData.recipientPhone || '').trim() || undefined, email: (formData.recipientEmail || '').trim() || undefined };
        const payload = {
            senderInfo: (senderInfo.name || senderInfo.phone) ? senderInfo : undefined,
            recipientInfo: (recipientInfo.name || recipientInfo.phone || recipientInfo.email) ? recipientInfo : undefined,
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
            const srImageFiles = formData.images || (formData.image ? [formData.image] : []);
            if (srImageFiles.length > 0) {
                const fd = new FormData();
                srImageFiles.forEach(file => fd.append('images', file));
                Object.entries(payload).forEach(([k, v]) =>
                {
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
                setCookie('smartride_delivery_id', String(dId));
            } catch (e) { }

            // Clear form data from localStorage after successful delivery creation
            try {
                const formKey = currentUserId ? `smartride_form_data_${currentUserId}` : 'smartride_form_data';
                localStorage.removeItem(formKey);
                console.log('[SmartRide] Cleared form data from localStorage after successful delivery creation');
            } catch (e) {
                console.warn('[SmartRide] Failed to clear form data:', e);
            }

            try {
                const room = `delivery:${dId}`;
                socketService.connect();
                const onConnectJoin = () =>
                {
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

    const cancelRequest = async () =>
    {
        if (!deliveryId || isCancellingRequest) return;
        setIsCancellingRequest(true);
        try {
            await cancelDelivery(deliveryId, { reason: 'user_cancelled' });
            try {
                localStorage.removeItem('smartride_delivery_id');
                localStorage.removeItem('smartride_step');
            } catch (e) { }
            try { deleteCookie('smartride_delivery_id'); } catch (e) { }
            try { deleteCookie('smartride_step'); } catch (e) { }
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

    const proceedToRiderDetails = async (rider) =>
    {
        setIsSearching(false);
        setCurrentStep('rider-details');
        try {
            localStorage.setItem('smartride_step', 'rider-details');
            try { setCookie('smartride_step', 'rider-details'); } catch (e) { }
            const stored = localStorage.getItem('smartride_rider_details');
            let details = rider || (stored ? JSON.parse(stored) : { name: requestSentToRiderName });

            // If we have an id, try to fetch latest profile and merge vehicle info
            try {
                const driverId = details?._id || details?.id || details?.riderId;
                if (driverId) {
                    const profile = await fetchDriverProfileById(driverId).catch(() => null);
                    if (profile) details = { ...(details || {}), ...(normalizeDriverProfile(profile) || {}) };
                }
            } catch (e) { console.warn('[SmartRide] Failed to fetch driver profile on proceed:', e); }

            try { localStorage.setItem('smartride_rider_details', JSON.stringify(details || {})); } catch (e) { }
            try { setJSONCookie('smartride_rider_details', details || {}); } catch (e) { }
            setRiderDetails(details || {});
        } catch (e) { console.warn('[SmartRide] Failed to persist rider details on proceed:', e); }
    };

    const proceedToPayment = async () =>
    {
        // Default to cash if no payment method selected
        const selectedMethod = formData.paymentMethod || 'cash';
        if (selectedMethod !== 'card' && selectedMethod !== 'cash') {
            alert('Please select either card or cash payment method');
            setShowPaymentDrawer(true);
            return;
        }

        // For card payments, proceed with online payment
        if (selectedMethod !== 'card') {
            // Cash payment - proceed directly to booking
            await handleFindRider();
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

            const senderInfo = { name: (formData.senderName || '').trim() || undefined, phone: (formData.senderPhone || '').trim() || undefined };
            const recipientInfo = { name: (formData.recipientName || '').trim() || undefined, phone: (formData.recipientPhone || '').trim() || undefined, email: (formData.recipientEmail || '').trim() || undefined };
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
                    weight: formData.weight || `${formData.weightCategory} weight`,
                    dimensions: formData.dimensions,
                    description: formData.packageDescription
                },
                payment: { method: formData.paymentMethod, notes: formData.paymentNotes },
                deliveryType: 'smart_ride'
            };

            let createResp = null;
            const srImageFiles2 = formData.images || (formData.image ? [formData.image] : []);
            if (srImageFiles2.length > 0) {
                const fd = new FormData();
                srImageFiles2.forEach(file => fd.append('images', file));
                Object.entries(payload).forEach(([k, v]) =>
                {
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
                const onConnectJoin = () =>
                {
                    try { socketService.joinRoom(room); } catch (e) { console.warn('[SmartRide] joinRoom failed on connect:', e); }
                    try { socketService.off('connect', onConnectJoin); } catch (e) { }
                };
                try { socketService.on('connect', onConnectJoin); } catch (e) { }
                try { socketService.joinRoom(room); } catch (e) { }
            } catch (e) { console.warn('[SmartRide] Failed to join delivery room:', e); }
            setToastMsg('Delivery booked successfully! Initializing payment...');
            setShowToast(true);

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
            // Use backend-confirmed amount (delivery.price) so inline Paystack charges the same as hosted
            const amountNaira = paymentObj?.amount ?? initPayload?.data?.payment?.amount ?? initPayload?.payment?.amount;

            if (!paymentReference && !authorizationUrl) {
                throw new Error('Payment initialization failed');
            }

            try {
                if (dId) setCookie('pending_payment_delivery_id', String(dId), 1);
                if (paymentReference) setCookie('pending_payment_id', String(paymentReference), 1);
            } catch (e) { }

            const cleanupOnPaymentCancel = async (did) =>
            {
                try {
                    // Don't cancel the booking - just clear payment cookies and notify user
                    console.log('[SmartRide] Payment window closed without completion for delivery:', did);
                } catch (cleanupErr) {
                    console.warn('[SmartRide] Cleanup error:', cleanupErr);
                }
                try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { }
                setIsProcessingPayment(false);
                setIsCreating(false);
                setToastMsg('Payment was not completed. Your booking is still pending. You can try paying again.');
                setShowToast(true);
                // Navigate to deliveries page
                try { router.push('/customer/deliveries', 'root', 'replace'); } catch (e) { window.location.href = '/customer/deliveries'; }
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
                        const popupInterval = setInterval(() =>
                        {
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

                const amountKobo = Math.round((amountNaira ?? calculateTotal().total) * 100);
                const handler = PaystackPop.setup({
                    key: paystackPublicKey,
                    email: formData.recipientEmail || 'customer@swiftlyxpress.com',
                    amount: amountKobo, // Paystack expects kobo; use backend amount to match delivery.price
                    ref: paymentReference,
                    onClose: function ()
                    {
                        cleanupOnPaymentCancel(dId);
                    },
                    callback: function (response)
                    {
                        try { deleteCookie('pending_payment_delivery_id'); deleteCookie('pending_payment_id'); } catch (e) { }
                        setIsProcessingPayment(false);
                        setIsCreating(false);
                        // Navigate to payment callback route to let SPA finalize
                        try { router.push('/customer/payment/callback', 'root', 'replace'); } catch (e) { window.location.href = '/customer/payment/callback'; }
                    }
                });

                try {
                    handler.openIframe();
                    setIsProcessingPayment(false);
                    setIsCreating(false);
                    return;
                } catch (iframeErr) {
                    console.error('[SmartRide] Paystack iframe failed to open:', iframeErr);
                    // Fallback: open payment callback route in a new tab so user can complete payment
                    try {
                        window.open('/customer/payment/callback', '_blank');
                    } catch (openErr) {
                        console.warn('[SmartRide] Fallback window.open also failed:', openErr);
                    }
                    setIsProcessingPayment(false);
                    setIsCreating(false);
                    // Navigate to deliveries even if iframe fails
                    try { router.push('/customer/deliveries', 'root', 'replace'); } catch (e) { window.location.href = '/customer/deliveries'; }
                    return;
                }
            }
        } catch (err) {
            console.error('Payment error', err);
            alert(err?.message || 'Payment failed');
            setIsProcessingPayment(false);
            setIsCreating(false);
        }
    };

    // Helper for size category dropdown
    const handleSizeCategoryChange = (label) =>
    {
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

    const handleWeightCategoryChange = (label) =>
    {
        const valueMap = { 'Light': 'light', 'Heavy': 'heavy', 'Very Heavy': 'very_heavy' };
        setFormData({ ...formData, weightCategory: valueMap[label] });
    };

    const handleSliderChange = (e) =>
    {
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

    const handleSliderMouseMove = () =>
    {
        if (!sliderRef.current) return;
        const val = parseInt(sliderRef.current.value, 10);
        const min = 70; const max = 130;
        const percent = (val - min) / (max - min);
        setSliderBubble({ percent, value: val });
    };

    const handleSliderMouseLeave = () =>
    {
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
                                    onClick={async () =>
                                    {
                                        // If in finding/found state, cancel the smart ride delivery
                                        if ((currentStep === 'finding-rider' || currentStep === 'rider-found') && deliveryId) {
                                            try {
                                                await cancelDelivery(deliveryId);
                                            } catch (e) {
                                                console.warn('[SmartRide] Cancel delivery failed:', e);
                                            }
                                            try { localStorage.removeItem('smartride_delivery_id'); } catch (e) { }
                                            try { deleteCookie('smartride_delivery_id'); } catch (e) { }
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
                                            onChange={(label) =>
                                            {
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
                                            options={['Express (Same day)', 'Smart Ride']}
                                            tooltips={{
                                                'Express (Same day)': 'Fast delivery within the same day — starting from ₦900',
                                                'Smart Ride': 'Quick motorcycle delivery with instant rider matching — starting from ₦1,100'
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
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="block text-sm font-medium text-[#0F172A]">Pickup Address</label>
                                                    <div className="group relative">
                                                        <IonIcon icon={informationCircleOutline} className="text-[#64748B] w-4 h-4 mt-2.5" />
                                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                                                            Please enter a precise location for accurate pickup.
                                                        </div>
                                                    </div>
                                                </div>
                                                <GoogleMapsAutocomplete
                                                    value={formData.pickupAddress}
                                                    onChange={(val) => setFormData({ ...formData, pickupAddress: val })}
                                                    onPlaceSelect={(place) =>
                                                    {
                                                        console.log('Pickup place selected:', place);
                                                        setFormData({ ...formData, pickupAddress: `${place.street}${place.city ? ', ' + place.city : ''}`, pickupPlace: place });
                                                    }}
                                                    onBlur={() =>
                                                    {
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
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="block text-sm font-medium text-[#0F172A]">Delivery Address</label>
                                                    <div className="group relative">
                                                        <IonIcon icon={informationCircleOutline} className="text-[#64748B] w-4 h-4 mt-2.5" />
                                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                                                            Please enter a precise location for accurate delivery.
                                                        </div>
                                                    </div>
                                                </div>
                                                <GoogleMapsAutocomplete
                                                    value={formData.deliveryAddress}
                                                    onChange={(val) => setFormData({ ...formData, deliveryAddress: val })}
                                                    onPlaceSelect={(place) =>
                                                    {
                                                        console.log('Delivery place selected:', place);
                                                        setFormData({ ...formData, deliveryAddress: `${place.street}${place.city ? ', ' + place.city : ''}`, deliveryPlace: place });
                                                    }}
                                                    onBlur={() =>
                                                    {
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

                                    {/* Package Images Upload — up to 5 */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-[#0F172A]">
                                                Package Images <span className="text-[#94A3B8] font-normal">(optional · up to 5)</span>
                                            </label>
                                            {(formData.images || []).length > 0 && (
                                                <span className="text-xs text-[#64748B]">{(formData.images || []).length}/5 added</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {(formData.images || []).map((file, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[#00B75A] flex-shrink-0"
                                                >
                                                    <img
                                                        src={file instanceof File ? URL.createObjectURL(file) : (typeof file === 'string' ? file : '')}
                                                        alt={`Package ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                        {
                                                            const updated = (formData.images || []).filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, images: updated });
                                                        }}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                                            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}

                                            {(formData.images || []).length < 5 && (
                                                <>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        id="package-image-upload"
                                                        className="hidden"
                                                        onChange={(e) =>
                                                        {
                                                            const incoming = Array.from(e.target.files || []).filter(f => f.size <= 10 * 1024 * 1024);
                                                            const existing = formData.images || [];
                                                            const combined = [...existing, ...incoming].slice(0, 5);
                                                            setFormData({ ...formData, images: combined });
                                                            e.target.value = '';
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
                                        onClick={() =>
                                        {
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
                                        onClick={() =>
                                        {
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
                                        onClick={() =>
                                        {
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
                                    onClick={() =>
                                    {
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

                            {/* Discount / Launch offer notice */}
                            {((pricing.discountAmount ?? 0) > 0 || (pricing.note && String(pricing.note).trim())) && (
                                <div className="mb-4 rounded-xl p-4 flex items-start gap-3 bg-green-50 border border-green-200">
                                    <span className="text-green-600 flex-shrink-0 mt-0.5" aria-hidden>✓</span>
                                    <div className="flex-1 min-w-0">
                                        {(pricing.discountAmount ?? 0) > 0 && (
                                            <p className="text-sm font-medium text-green-800 mb-1">
                                                You&apos;re eligible for a discount of ₦{Number(pricing.discountAmount ?? 0).toLocaleString()} on this delivery.
                                            </p>
                                        )}
                                        {pricing.note && String(pricing.note).trim() && (
                                            <p className="text-xs text-green-700">{String(pricing.note).trim()}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pricing - Smart Ride (backend as source of truth) */}
                            <div className="bg-[#F0FDF4] rounded-xl p-6 mb-6">
                                <h3 className="text-base font-semibold text-[#0F172A] mb-4">Cost Breakdown</h3>
                                <div className="space-y-2.5">
                                    {/* Base Fare */}
                                    <div className="flex justify-between items-center text-[#0F172A]">
                                        <span className="text-[15px]">Base Fare</span>
                                        <span className="text-[15px]">₦{Number(pricing.baseFare || 0).toLocaleString()}</span>
                                    </div>

                                    {/* Distance charge */}
                                    {(pricing.distanceCharge ?? 0) > 0 && (
                                        <div className="flex justify-between items-center text-[#0F172A]">
                                            <span className="text-[15px]">Distance ({Number(pricing.distance || 0).toFixed(1)} km)</span>
                                            <span className="text-[15px]">₦{Number(pricing.distanceCharge ?? 0).toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Smart Ride fee */}
                                    {(pricing.smartRideFee ?? 0) > 0 && (
                                        <div className="flex justify-between items-center text-[#0F172A]">
                                            <span className="text-[15px]">Smart Ride</span>
                                            <span className="text-[15px]">₦{Number(pricing.smartRideFee ?? 0).toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Priority / Errand */}
                                    {(pricing.priorityFee ?? 0) > 0 && (
                                        <div className="flex justify-between items-center text-orange-700">
                                            <span className="text-sm">Priority Delivery</span>
                                            <span className="text-sm font-medium">+₦{Number(pricing.priorityFee ?? 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {(pricing.errandFee ?? 0) > 0 && (
                                        <div className="flex justify-between items-center text-[#0F172A]">
                                            <span className="text-[15px]">Special Errand</span>
                                            <span className="text-[15px]">₦{Number(pricing.errandFee ?? 0).toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Discount */}
                                    {(pricing.discountAmount ?? 0) > 0 && (
                                        <div className="flex justify-between items-center text-green-700">
                                            <span className="text-[15px]">Discount{pricing.discountPercentage ? ` (${pricing.discountPercentage}%)` : ''}</span>
                                            <span className="text-[15px] font-medium">-₦{Number(pricing.discountAmount ?? 0).toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="border-t border-gray-300 pt-3 mt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-medium text-[#0F172A]">Total</span>
                                            <span className="text-2xl font-medium text-[#00B75A]">₦{Number(pricing.total || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 relative z-10">
                                <button
                                    type="button"
                                    className="px-4 py-2 mt-6 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors text-[#000000] font-medium text-[15px] pointer-events-auto"
                                    onClick={() => setCurrentStep('form')}
                                >
                                    Back
                                </button>

                                <Button
                                    variant="primary"
                                    className="!flex-1 !py-4 !bg-[#00B75A] !text-sm !font-[400] !rounded-full mt-6 pointer-events-auto"
                                    onClick={bookNow}
                                    disabled={isSearching}
                                >
                                    {isSearching ? 'Booking...' : 'Confirm & Book'}
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
                                    onClick={async () =>
                                    {
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
                                    pickupLocation={formData.pickupPlace?.coordinates || { lat: 5.0075, lng: 7.8492 }}
                                    dropoffLocation={null}
                                    driverLocation={null}
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
                                            {(() =>
                                            {
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
                                    onClick={() =>
                                    {
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
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-8 relative" style={{ height: isMobile ? '240px' : '400px' }}>
                            <GoogleMap
                                center={driverLocation || formData.pickupPlace?.coordinates || { lat: 5.0075, lng: 7.8492 }}
                                zoom={13}
                                pickupLocation={formData.pickupPlace?.coordinates || { lat: 5.0075, lng: 7.8492 }}
                                deliveryLocation={formData.deliveryPlace?.coordinates || { lat: 5.0175, lng: 7.8592 }}
                                riderLocation={driverLocation || { lat: 5.0125, lng: 7.8542 }}
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

                            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 mb-10">
                                {/* Rider Photo */}
                                <div className="w-24 h-24 md:w-40 md:h-40 bg-gray-200 rounded-2xl overflow-hidden flex-shrink-0">
                                    {riderDetails?.profileImage || riderDetails?.profilePhoto || riderDetails?.imageUrl || riderDetails?.avatar || deliveryData?.rider?.profileImage || deliveryData?.driver?.profileImage ? (
                                        <img
                                            src={riderDetails?.profileImage || riderDetails?.profilePhoto || riderDetails?.imageUrl || riderDetails?.avatar || deliveryData?.rider?.profileImage || deliveryData?.driver?.profileImage}
                                            alt={riderDetails?.fullName || riderDetails?.name || 'Rider'}
                                            className="w-full h-full object-cover"
                                            onError={(e) =>
                                            {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="w-full h-full bg-gradient-to-br from-[#00B75A] to-[#00A04A] flex items-center justify-center"
                                        style={{ display: (riderDetails?.profileImage || riderDetails?.profilePhoto || riderDetails?.imageUrl || riderDetails?.avatar || deliveryData?.rider?.profileImage || deliveryData?.driver?.profileImage) ? 'none' : 'flex' }}
                                    >
                                        <span className="text-white text-4xl md:text-6xl font-bold">
                                            {(riderDetails?.fullName || riderDetails?.name || 'R')?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Rider Info */}
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <h3 className="text-2xl font-semibold text-gray-900">{riderDetails?.fullName || riderDetails?.name || requestSentToRiderName || 'Rider'}</h3>
                                        <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold border border-green-200">
                                            {riderDetails?.verified ? 'Rider ID Verified' : 'Rider'}
                                        </span>
                                        <span className="text-gray-500 text-sm font-medium">{riderDetails?.ridesCount ?? riderDetails?.totalRides ?? ''}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                                            <p className="font-semibold text-gray-900">
                                                {riderDetails?.phone || riderDetails?.phoneNumber || riderDetails?.contact || deliveryData?.rider?.phone || deliveryData?.rider?.phoneNumber || deliveryData?.assignedRider?.phone || deliveryData?.driver?.phone || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Bike Model</p>
                                            <p className="font-semibold text-gray-900">{riderDetails?.vehicle?.model || riderDetails?.bikeModel || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Plate number</p>
                                            <p className="font-semibold text-gray-900">{riderDetails?.vehicle?.plateNumber || riderDetails?.plateNumber || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Estimated Arrival</p>
                                            <p className="font-semibold text-gray-900">{riderDetails?.estimatedArrivalMinutes ? `~${riderDetails.estimatedArrivalMinutes} mins` : (nearbyRiders[0]?.estimatedArrivalMinutes ? `~${nearbyRiders[0].estimatedArrivalMinutes} mins` : '-')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col md:flex-col gap-3 w-full md:w-auto">
                                    <button
                                        type="button"
                                        onClick={() =>
                                        {
                                            const num = riderDetails?.phone || riderDetails?.phoneNumber || riderDetails?.contact || deliveryData?.rider?.phone || deliveryData?.rider?.phoneNumber || deliveryData?.assignedRider?.phone || deliveryData?.driver?.phone;
                                            if (num) {
                                                window.location.href = `tel:${num}`;
                                            } else {
                                                alert('Rider phone number not available');
                                            }
                                        }}
                                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#00B75A] text-white rounded-full hover:bg-[#00A050] transition-colors shadow-sm"
                                    >
                                        <Phone className="w-5 h-5" />
                                        <span className="font-semibold">
                                            {riderDetails?.phone || riderDetails?.phoneNumber || riderDetails?.contact || deliveryData?.rider?.phone || deliveryData?.rider?.phoneNumber || deliveryData?.assignedRider?.phone || deliveryData?.driver?.phone ? 'Call' : 'No Phone'}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                        {
                                            setShowChat(true);
                                            setUnreadMessageCount(0);
                                        }}
                                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#00B75A] text-[#00B75A] rounded-full hover:bg-green-50 transition-colors relative"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        <span className="font-semibold">Chat</span>
                                        {unreadMessageCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Verification Documents */}
                            {(riderDetails?.verificationStatus === 'approved' || riderDetails?.verification?.verificationStatus === 'approved') && (
                                <div className="border-t border-gray-200 pt-6 mt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Documents</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(riderDetails?.idDocumentUrl || riderDetails?.verification?.idDocumentUrl) && (
                                            <div className="border border-gray-200 rounded-xl p-4">
                                                <p className="text-sm text-gray-500 mb-2">ID Document</p>
                                                <p className="text-xs text-gray-600 mb-3">
                                                    {riderDetails?.verification?.identity?.idType || riderDetails?.idType || 'ID'}: {riderDetails?.verification?.identity?.idNumber || riderDetails?.idNumber || '-'}
                                                </p>
                                                <button
                                                    onClick={() => window.open(riderDetails?.idDocumentUrl || riderDetails?.verification?.idDocumentUrl, '_blank')}
                                                    className="w-full px-4 py-2 bg-[#00B75A] text-white rounded-lg hover:bg-[#00A04A] transition-colors text-sm font-medium"
                                                >
                                                    View ID Document
                                                </button>
                                            </div>
                                        )}
                                        {(riderDetails?.driversLicenseUrl || riderDetails?.verification?.vehicle?.driversLicenseUrl) && (
                                            <div className="border border-gray-200 rounded-xl p-4">
                                                <p className="text-sm text-gray-500 mb-2">Driver's License</p>
                                                <p className="text-xs text-gray-600 mb-3">
                                                    Verified license document
                                                </p>
                                                <button
                                                    onClick={() => window.open(riderDetails?.driversLicenseUrl || riderDetails?.verification?.vehicle?.driversLicenseUrl, '_blank')}
                                                    className="w-full px-4 py-2 bg-[#00B75A] text-white rounded-lg hover:bg-[#00A04A] transition-colors text-sm font-medium"
                                                >
                                                    View Driver's License
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-sm">
                                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-green-700 font-medium">Verified Rider</span>
                                        {riderDetails?.verification?.verifiedAt && (
                                            <span className="text-gray-500">• Verified on {new Date(riderDetails.verification.verifiedAt).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tracking Steps */}
                            <div className="border-t border-gray-200 pt-10">
                                <h3 className="text-xl font-semibold text-gray-900 mb-8">Tracking</h3>

                                {(() =>
                                {
                                    // Derive status flags like Track.jsx for dynamic highlighting
                                    const statusLower = deliveryData?.status?.toLowerCase() || '';
                                    const pickedUpReached = statusLower === 'picked-up' || statusLower === 'picked up' || statusLower === 'in-transit' || statusLower === 'in transit' || statusLower === 'delivered' || statusLower === 'completed';
                                    const inTransitReached = statusLower === 'in-transit' || statusLower === 'in transit' || statusLower === 'delivered' || statusLower === 'completed';
                                    const deliveredReached = statusLower === 'delivered' || statusLower === 'completed';

                                    return (
                                        <div className="flex items-center justify-between max-w-3xl mx-auto">
                                            {/* Dispatch */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 md:w-20 md:h-20 bg-[#00B75A] rounded-full flex items-center justify-center mb-3 shadow-sm">
                                                    <Bike className="w-6 h-6 md:w-10 md:h-10 text-white" />
                                                </div>
                                                <p className="text-xs md:text-sm font-semibold text-[#00B75A]">Dispatch</p>
                                            </div>

                                            {/* Connecting line */}
                                            <div className={`flex-1 h-1 ${pickedUpReached ? 'bg-[#00B75A]' : 'bg-gray-200'} mx-2 md:mx-6`}></div>

                                            {/* Pick Up */}
                                            <div className="flex flex-col items-center">
                                                <div className={`w-12 h-12 md:w-20 md:h-20 ${pickedUpReached ? 'bg-[#00B75A]' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-3`}>
                                                    <Package className={`w-6 h-6 md:w-10 md:h-10 ${pickedUpReached ? 'text-white' : 'text-gray-400'}`} />
                                                </div>
                                                <p className={`text-xs md:text-sm font-semibold ${pickedUpReached ? 'text-[#00B75A]' : 'text-gray-400'}`}>Pick Up</p>
                                            </div>

                                            {/* Connecting line */}
                                            <div className={`flex-1 h-1 ${inTransitReached ? 'bg-[#00B75A]' : 'bg-gray-200'} mx-2 md:mx-6`}></div>

                                            {/* Delivery */}
                                            <div className="flex flex-col items-center">
                                                <div className={`w-12 h-12 md:w-20 md:h-20 ${deliveredReached ? 'bg-[#00B75A]' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-3`}>
                                                    <CheckCircle className={`w-6 h-6 md:w-10 md:h-10 ${deliveredReached ? 'text-white' : 'text-gray-400'}`} />
                                                </div>
                                                <p className={`text-xs md:text-sm font-semibold ${deliveredReached ? 'text-[#00B75A]' : 'text-gray-400'}`}>Delivery</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </YummyText>

                {/* Chat modal / bottom sheet for rider-details */}
                {showChat && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setShowChat(false)} />
                        <div className="relative w-full md:w-2/3 lg:w-1/2 bg-white rounded-t-3xl shadow-2xl p-4 max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b">
                                <h4 className="text-lg font-semibold text-gray-900">Chat with Rider</h4>
                                <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-gray-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-gray-100">Close</button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <DeliveryChat deliveryId={deliveryId} currentUserRole="customer" canSend={!!(deliveryData?.driver || deliveryData?.rider || deliveryData?.assignedDriver)} maxHeight="60vh" />
                            </div>
                        </div>
                    </div>
                )}
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
                                    onClick={() =>
                                    {
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
                                    onClick={() =>
                                    {
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
                                    onClick={() =>
                                    {
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