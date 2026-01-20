'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Bike, Phone, MessageCircle, Package, CheckCircle } from 'lucide-react';
import { IonPage, IonContent, IonToast, useIonRouter } from '@ionic/react';
import Button from '../../components/Button';
import { YummyText } from '../../components/YummyText';
import Breadcrumb from '../../components/Breadcrumb';
import GoogleMap from '../../components/TrackingMap';
import GoogleMapsAutocomplete from '../../components/GoogleMapsAutocomplete';
import axios from 'axios';
import { getCookie, setCookie, deleteCookie } from '../../utils/cookies';
import { createDelivery, cancelDelivery } from '../../utils/authApi';

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

export default function SmartRideBooking() {
    const router = useIonRouter();
    const [currentStep, setCurrentStep] = useState('form');
    const [isSearching, setIsSearching] = useState(false);
    const sliderRef = useRef(null);
    const hideBubbleTimeout = useRef(null);
    const [sliderBubble, setSliderBubble] = useState(null);
    const [showFineTuneInfo, setShowFineTuneInfo] = useState(false);

    const [formData, setFormData] = useState({
        deliveryType: 'Smart Ride',
        senderName: '',
        senderPhone: '',
        pickupAddress: '',
        pickupPlace: null,
        pickupDate: '',
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
        declaredValue: '',
        // Payment and image fields
        image: null,
        paymentMethod: '',
        paymentNotes: ''
    });

    const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [deliveryId, setDeliveryId] = useState(null);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

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
        const baseDelivery = 500;

        // Parse weight - use explicit weight if provided, otherwise derive from category
        const weightMap = { light: 2.5, heavy: 12.5, very_heavy: 25 };
        const explicitWeight = parseFloat(formData.weight);
        const effectiveWeight = !isNaN(explicitWeight) && explicitWeight > 0
            ? explicitWeight
            : weightMap[formData.weightCategory] || 2.5;

        const perKgRate = 200;
        const weightCharge = Math.ceil(effectiveWeight) * perKgRate;

        const baseRate = baseDelivery + weightCharge;

        const declaredValue = parseFloat(formData.declaredValue) || 0;
        const insurance = declaredValue > 0 ? Math.max(Math.round(declaredValue * 0.01), 200) : 0;

        const total = baseRate + insurance;

        return {
            baseRate,
            insurance,
            total,
            details: { effectiveWeight, weightCharge, declaredValue }
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

    const findRider = () => {
        setCurrentStep('finding-rider');
        setIsSearching(true);
        setTimeout(() => {
            setIsSearching(false);
            setCurrentStep('rider-found');
        }, 3000);
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

                const payload = {
                    senderName: formData.senderName,
                    senderPhone: formData.senderPhone,
                    pickupDate: formData.pickupDate,
                    recipientName: formData.recipientName,
                    recipientPhone: formData.recipientPhone,
                    recipientEmail: formData.recipientEmail,
                    pickupAddress: {
                        street: formData.pickupPlace?.street || formData.pickupAddress,
                        city: formData.pickupPlace?.city || '',
                        state: formData.pickupPlace?.state || 'Unknown',
                        zipCode: formData.pickupPlace?.zipCode || '',
                        coordinates: formData.pickupPlace?.coordinates || null
                    },
                    deliveryAddress: {
                        street: formData.deliveryPlace?.street || formData.deliveryAddress,
                        city: formData.deliveryPlace?.city || '',
                        state: formData.deliveryPlace?.state || 'Unknown',
                        zipCode: formData.deliveryPlace?.zipCode || '',
                        coordinates: formData.deliveryPlace?.coordinates || null
                    },
                    packageDetails: {
                        sizeCategory: formData.sizeCategory,
                        weightCategory: formData.weightCategory,
                        weight: formData.weight || `${formData.weightCategory} weight`,
                        dimensions: formData.dimensions,
                        description: formData.packageDescription
                    },
                    payment: { method: formData.paymentMethod, notes: formData.paymentNotes }
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

                setToast?.('Preparing payment...');

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
                    setToast?.('Payment was not completed. Your booking was cancelled.');
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
    };

    const handleWeightCategoryChange = (label) => {
        const valueMap = { 'Light': 'light', 'Heavy': 'heavy', 'Very Heavy': 'very_heavy' };
        setFormData({ ...formData, weightCategory: valueMap[label] });
    };

    const handleSliderChange = (e) => {
        const scale = parseInt(e.target.value, 10);
        const dimsMap = { small: [30, 30, 30], big: [50, 40, 30], very_big: [80, 60, 50] };
        const base = dimsMap[formData.sizeCategory] || dimsMap.small;
        const factor = scale / 100;
        const dims = `${Math.round(base[0] * factor)}×${Math.round(base[1] * factor)}×${Math.round(base[2] * factor)} cm`;
        setFormData({ ...formData, sizeScale: scale, dimensions: dims });

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

    // Simple dropdown component
    const StyledDropdown = ({ value, onChange, options, tooltips }) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm text-left text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none flex items-center justify-between"
                >
                    <span>{value}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9l6 6 6-6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                {isOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        {options.map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-[#0F172A] hover:bg-[#F8F9FA] transition-colors"
                                title={tooltips?.[opt]}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (currentStep === 'form') {
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

                            {/* Desktop/back button */}
                            <div>
                                <Button
                                    variant="primary"
                                    className="!bg-[#FFFFFF] !border-[1.5px] !border-[#0A0A0A] text-[#000000] text-sm hover:!bg-[#FFFFFF] rounded-full px-4 py-2 inline-flex"
                                    onClick={() => router.goBack()}
                                >
                                    Back
                                </Button>
                            </div>
                        </div>
                    </div>
                </YummyText>

                {/* Breadcrumb */}
                <YummyText>
                    <div className="max-w-4xl mx-auto -mt-6 px-4 sm:px-6 lg:px-8">
                        <Breadcrumb steps={breadcrumbSteps} currentStep={getCurrentStepIndex()} />
                    </div>
                </YummyText>

                {/* Page Title */}
                <div className="max-w-5xl mx-auto px-4">
                    <div className="mb-3">
                        <YummyText className="text-3xl font-medium text-gray-900 mb-1">Book a Delivery</YummyText>
                        <YummyText className="text-gray-600 text-sm">Schedule a new shipment with ease</YummyText>
                    </div>
                </div>

                {/* Main Content */}
                <YummyText>
                    <div className="max-w-5xl mx-auto px-4 pb-12">
                        <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
                            <form onSubmit={handleSubmit}>
                                {/* Delivery Information Section */}
                                <div className="mb-3">
                                    <YummyText className="text-lg font-medium text-gray-900 mb-1">Delivery Information</YummyText>
                                    <YummyText className="text-sm text-gray-600 mb-4">Fill in the details below to schedule your delivery</YummyText>

                                    {/* Delivery Type */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Type</label>
                                        <input
                                            type="text"
                                            name="deliveryType"
                                            value={formData.deliveryType}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-[#FBFBFB] placeholder:text-[#BDBDBD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D68F]"
                                            readOnly
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

                                            <div>
                                                <label className="block text-sm font-medium text-[#0F172A] mb-2">Pickup Date</label>
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
                                                />
                                            </div>

                                            {/* Size Adjustment Slider */}
                                            <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-gray-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-xl bg-[FFFFFF]/10 shadow-sm border flex items-center justify-center">
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
                                                            className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <path d="M12 16v-4M12 8h.01" />
                                                            </svg>
                                                        </button>
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

                                    {/* Declared Value */}
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
                                            className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                                        />
                                    </div>

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
                                            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-left flex items-center justify-between hover:border-[#00B75A] transition-all"
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
                                            setShowPaymentDrawer(false);
                                        }}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-[#00B75A] hover:bg-[#F0FDF4]/30 ${formData.paymentMethod === 'cash' ? 'border-[#00B75A] bg-[#F0FDF4]' : 'border-gray-200 bg-white'
                                            }`}
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
                                            setShowPaymentDrawer(false);
                                        }}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-[#00B75A] hover:bg-[#F0FDF4]/30 ${formData.paymentMethod === 'card' ? 'border-[#00B75A] bg-[#F0FDF4]' : 'border-gray-200 bg-white'
                                            }`}
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
                                            setShowPaymentDrawer(false);
                                        }}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-[#00B75A] hover:bg-[#F0FDF4]/30 ${formData.paymentMethod === 'transfer' ? 'border-[#00B75A] bg-[#F0FDF4]' : 'border-gray-200 bg-white'
                                            }`}
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
        const declaredValueNumber = pricing.details?.declaredValue ?? (parseFloat(formData.declaredValue) || 0);

        return (
            <div className="min-h-screen bg-[#FFFFFF]">
                <YummyText>
                    <div className="bg-white">
                        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-0 h-16 md:h-32 flex items-center justify-between mb-8 md:mb-0 sm:md-0 lg:mb-0t">
                            <div className="flex items-center gap-3">
                                <a href="/" className="inline-block">
                                    <img src="/swiftly-logo.svg" alt="Swiftly" className="h-40 md:h-22 lg:h-22 object-contain" />
                                </a>
                            </div>

                            {/* Desktop/back button */}
                            <div>
                                <Button
                                    variant="primary"
                                    className="!bg-[#FFFFFF] border-[1.5px] border-[#0A0A0A] text-[#000000] text-sm hover:!bg-[#FFFFFF] rounded-full px-4 py-2 inline-flex"
                                    onClick={() => router.goBack()}
                                >
                                    Back
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Breadcrumb */}
                    <div className="max-w-4xl mx-auto -mt-6 px-4 sm:px-6 lg:px-8">
                        <Breadcrumb steps={breadcrumbSteps} currentStep={getCurrentStepIndex()} />
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

                            <div className="mb-8">
                                <p className="text-sm text-[#1E1E1E] font-medium mb-1">Declared Value (₦)</p>
                                <p className="font-sm text-[#1E1E1E] bg-[#FBFBFB] rounded-md px-3 py-3">₦{declaredValueNumber.toLocaleString()}</p>
                            </div>

                            {/* Pricing */}
                            <div className="bg-[#F0FDF4] rounded-xl p-6 mb-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[#0F172A]">
                                        <span className="text-[15px]">Base Rate</span>
                                        <span className="text-[15px]">₦{pricing.baseRate.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[#0F172A]">
                                        <span className="text-[15px]">Insurance (1% of declared value)</span>
                                        <span className="text-[15px]">₦{pricing.insurance.toLocaleString()}</span>
                                    </div>

                                    <div className="border-t border-gray-300 pt-3 mt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-medium text-[#0F172A]">Total</span>
                                            <span className="text-2xl font-medium text-[#00B75A]">₦{pricing.total.toLocaleString()}</span>
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
                                >
                                    Find a Rider
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
                                <a href="/" className="inline-block">
                                    <img src="/swiftly-logo.svg" alt="Swiftly" className="h-40 md:h-22 lg:h-22 object-contain" />
                                </a>
                            </div>

                            {/* Desktop/back button */}
                            <div>
                                <Button
                                    variant="primary"
                                    className="!bg-[#FFFFFF] border-[1.5px] !border-[#0A0A0A] text-[#000000] text-sm hover:!bg-[#FFFFFF] rounded-full px-4 py-2 inline-flex"
                                    onClick={() => router.goBack()}
                                >
                                    Back
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto -mt-6 px-4">
                        <Breadcrumb steps={breadcrumbSteps} currentStep={getCurrentStepIndex()} />
                    </div>

                    <div className="max-w-6xl mx-auto px-4 py-8">
                        {/* Map with centered bike icon */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-6 relative" style={{ height: '420px' }}>
                            <GoogleMap
                                center={{ lat: 6.5244, lng: 3.3792 }}
                                zoom={13}
                                showMarker={false}
                                className="w-full h-full"
                            />

                            {/* Centered bike icon on map */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                                <div className="w-16 h-16 bg-[#00B75A] rounded-2xl flex items-center justify-center shadow-lg">
                                    <Bike className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Status text and content */}
                        <div className="text-center mb-8">
                            {isSearching ? (
                                <>
                                    <h2 className="text-3xl font-semibold text-gray-900 mb-3">Finding Nearby Riders</h2>
                                    <p className="text-gray-600 text-base">You can make payment as soon as you are paired with a rider.<br />Hold On</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-semibold text-gray-900 mb-3">Rider Found 🎉</h2>
                                    <p className="text-gray-600 text-base mb-6">Great news! We found a rider near your pickup location.</p>
                                    <Button
                                        variant="primary"
                                        className="!bg-white !text-[#0F172A] !border-2 !border-[#0F172A] !py-3 !px-12 !rounded-full hover:!bg-gray-50"
                                        onClick={proceedToPayment}
                                    >
                                        Make Payment
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Loader spinner above skeleton placeholders */}
                        {isSearching && (
                            <div className="flex items-center justify-center mb-6">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00B75A] border-t-transparent"></div>
                            </div>
                        )}

                        {/* Skeleton placeholders when searching */}
                        {isSearching && (
                            <div className="space-y-4 max-w-4xl mx-auto opacity-20">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                            <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
                                        </div>
                                    </div>
                                ))}
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

                            {/* Desktop/back button */}
                            <div>
                                <Button
                                    variant="primary"
                                    className="!bg-[#FFFFFF] border-[1.5px] border-[#0A0A0A] text-[#000000] text-sm hover:!bg-[#FFFFFF] rounded-full px-4 py-2 inline-flex"
                                    onClick={() => router.goBack()}
                                >
                                    Back
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto -mt-6 px-4">
                        <Breadcrumb steps={breadcrumbSteps} currentStep={getCurrentStepIndex()} />
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
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-[#00B75A] hover:bg-[#F0FDF4]/30 ${formData.paymentMethod === 'cash'
                                        ? 'border-[#00B75A] bg-[#F0FDF4]'
                                        : 'border-gray-200 bg-white'
                                        }`}
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
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-[#00B75A] hover:bg-[#F0FDF4]/30 ${formData.paymentMethod === 'card'
                                        ? 'border-[#00B75A] bg-[#F0FDF4]'
                                        : 'border-gray-200 bg-white'
                                        }`}
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
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-[#00B75A] hover:bg-[#F0FDF4]/30 ${formData.paymentMethod === 'transfer'
                                        ? 'border-[#00B75A] bg-[#F0FDF4]'
                                        : 'border-gray-200 bg-white'
                                        }`}
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
        </>
    );
}