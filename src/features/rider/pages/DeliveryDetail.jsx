import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useIonRouter, IonPage, IonContent, IonToast } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import TrackingMap from '../../../components/TrackingMap';
import DeliveryChat from '../../../components/DeliveryChat';
import SmartRideDeliveryChat from '../../smartride-booking/DeliveryChat';
import TelephoneIcon from '../../../icons/Telephoneicon';
import Loader from '../../../components/Loader';
import { getRiderDeliveries, getRiderDeliveryById, updateDeliveryStatus } from '../../../utils/authApi';
import socketService from '../../../services/socket.service';

const sideBottomShadow = {
    boxShadow: '0.5px 1.5px 2px rgba(0, 0, 0, 0.05), -0.5px 1.5px 2px rgba(0, 0, 0, 0.05), 0 1.5px 3px rgba(0, 0, 0, 0.07)'
};

// ── Phone helpers ─────────────────────────────────────────────────────────────
const normalizePhoneForTel = (phone) =>
{
    if (!phone || typeof phone !== 'string') return '';
    let cleaned = phone.replace(/[\s\-()]/g, '').replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+234')) return cleaned;
    if (cleaned.startsWith('234')) return `+${cleaned}`;
    if (cleaned.startsWith('0') && cleaned.length >= 10) return `+234${cleaned.slice(1)}`;
    if (cleaned.length >= 10 && !cleaned.startsWith('0')) return `+234${cleaned}`;
    return cleaned ? `+234${cleaned}` : '';
};

const formatNigerianPhone = (phone) =>
{
    if (!phone || typeof phone !== 'string') return '';
    const cleaned = phone.replace(/[\s\-()]/g, '').replace(/[^0-9+]/g, '');
    if (cleaned.length < 7) return phone;
    if (cleaned.startsWith('+234')) return `+234 ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)} ${cleaned.slice(10)}`;
    if (cleaned.startsWith('0')) return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    return phone;
};

// ── Image gallery ─────────────────────────────────────────────────────────────
const PackageImageGallery = ({ images }) =>
{
    const [lightboxUrl, setLightboxUrl] = React.useState(null);
    const [errored, setErrored] = React.useState({});

    return (
        <>
            <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((url, i) =>
                    !errored[i] ? (
                        <div
                            key={i}
                            onClick={() => setLightboxUrl(url)}
                            className="flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                        >
                            <img
                                src={url}
                                alt={`Package image ${i + 1}`}
                                className="w-full h-full object-cover"
                                onError={() => setErrored(prev => ({ ...prev, [i]: true }))}
                            />
                        </div>
                    ) : null
                )}
            </div>
            {lightboxUrl && (
                <div
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        onClick={() => setLightboxUrl(null)}
                        style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        aria-label="Close image"
                    >✕</button>
                    <img
                        src={lightboxUrl}
                        alt="Package full"
                        style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};

// ── Address formatter ─────────────────────────────────────────────────────────
const formatAddr = (addr) =>
{
    if (!addr) return 'Address not available';
    if (typeof addr === 'string') return addr;
    const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
    return parts.join(', ') || 'Address not available';
};

// ── Phone extractor (mirrors ActiveDeliveries) ────────────────────────────────
const extractPhone = (delivery, role = 'pickup') =>
{
    if (!delivery) return null;
    const get = (obj, path) =>
    {
        try { return path.split('.').reduce((o, k) => o?.[k], obj); } catch { return null; }
    };
    const pickup = ['senderInfo.phone', 'senderPhone', 'sender.phone', 'pickup.phone', 'pickupPhone', 'pickupContactPhone'];
    const dropoff = ['recipientInfo.phone', 'recipientPhone', 'recipient.phone', 'dropoff.phone', 'deliveryPhone', 'deliveryContactPhone'];
    const paths = role === 'pickup' ? pickup : dropoff;
    for (const p of paths) {
        const v = get(delivery, p);
        if (v && /[0-9]/.test(String(v))) return String(v).trim();
    }
    return null;
};

// ── Status helpers ─────────────────────────────────────────────────────────────
const getStatusColor = (status) =>
{
    const s = (status || '').toLowerCase();
    if (s.includes('picked') || s.includes('transit')) return 'bg-blue-100 text-blue-600';
    if (s.includes('delivered') || s.includes('completed')) return 'bg-green-100 text-green-600';
    if (s.includes('pending') || s.includes('assigned')) return 'bg-orange-100 text-orange-600';
    if (s.includes('cancelled')) return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
};

const getActionButtonText = (status) =>
{
    const s = (status || '').toLowerCase();
    if (s.includes('assigned') || s.includes('pending')) return 'Start Pickup';
    if (s.includes('picked')) return 'Start Delivery';
    if (s.includes('transit')) return 'Complete Delivery';
    return 'Update Status';
};

const getNextStatus = (status) =>
{
    const s = (status || '').toLowerCase();
    if (s.includes('assigned') || s.includes('pending')) return 'picked-up';
    if (s.includes('picked')) return 'in-transit';
    if (s.includes('transit')) return 'delivered';
    return null;
};

// ── Main Component ─────────────────────────────────────────────────────────────
const DeliveryDetail = () =>
{
    const { deliveryId } = useParams();
    const router = useIonRouter();

    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [driverLocation, setDriverLocation] = useState(null);
    const [routeStats, setRouteStats] = useState(null);

    // ── Fetch delivery ────────────────────────────────────────────────────────
    const fetchDelivery = useCallback(async () =>
    {
        setLoading(true);
        try {
            // First try a single-delivery endpoint which may exist for drivers
            let data = null;
            try {
                const res = await getRiderDeliveryById(deliveryId);
                data = res?.data?.delivery || res?.delivery || res?.data || res;
            } catch {
                // Fallback: fetch all and filter
                const res = await getRiderDeliveries(1, 100);
                const list = res?.data?.deliveries || res?.deliveries || res?.data || [];
                data = list.find(d => (d._id || d.id) === deliveryId) || null;
            }
            setDelivery(data);
        } catch (err) {
            console.error('[DeliveryDetail] Failed to fetch:', err);
            setToastMsg(err?.message || 'Failed to load delivery');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    }, [deliveryId]);

    useEffect(() => { fetchDelivery(); }, [fetchDelivery]);

    // ── Socket: driver location updates ──────────────────────────────────────
    useEffect(() =>
    {
        if (!delivery) return;
        socketService.connect();
        socketService.joinRoom(deliveryId);

        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) =>
                {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setDriverLocation(loc);
                    socketService.emit('driver:location:update', { deliveryId, location: loc });
                },
                (err) => console.error('[DeliveryDetail] Location watch error:', err),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
            return () =>
            {
                navigator.geolocation.clearWatch(watchId);
                socketService.leaveRoom(deliveryId);
            };
        }
        return () => socketService.leaveRoom(deliveryId);
    }, [delivery, deliveryId]);

    // ── Status update ─────────────────────────────────────────────────────────
    const handleStatusUpdate = async () =>
    {
        if (!delivery) return;
        const nextStatus = getNextStatus(delivery.status);
        if (!nextStatus) return;

        setUpdatingStatus(true);
        try {
            let currentLocation = null;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise((res, rej) =>
                        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 15000 })
                    );
                    currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                } catch { /* location optional */ }
            }

            await updateDeliveryStatus(deliveryId, { status: nextStatus, ...(currentLocation ? { currentLocation } : {}) });

            setDelivery(prev => prev ? { ...prev, status: nextStatus } : prev);
            setToastMsg('✅ Status updated successfully!');
            setShowToast(true);

            window.dispatchEvent(new CustomEvent('delivery:statusChanged', { detail: { deliveryId, newStatus: nextStatus } }));
        } catch (err) {
            console.error('[DeliveryDetail] Status update failed:', err);
            setToastMsg(err?.response?.data?.message || err?.message || 'Failed to update status');
            setShowToast(true);
        } finally {
            setUpdatingStatus(false);
        }
    };

    // ── Derived values ────────────────────────────────────────────────────────
    const pickupCoords = (() =>
    {
        const c = delivery?.pickupAddress?.coordinates;
        if (!c) return null;
        return Array.isArray(c) ? { lat: c[1], lng: c[0] } : c;
    })();

    const deliveryCoords = (() =>
    {
        const c = delivery?.deliveryAddress?.coordinates;
        if (!c) return null;
        return Array.isArray(c) ? { lat: c[1], lng: c[0] } : c;
    })();

    const pickupPhone = delivery ? extractPhone(delivery, 'pickup') : null;
    const deliveryPhone = delivery ? extractPhone(delivery, 'delivery') : null;
    const pickupAddressText = formatAddr(delivery?.pickup?.address || delivery?.pickupAddress?.address || delivery?.pickupAddress);
    const deliveryAddressText = formatAddr(delivery?.dropoff?.address || delivery?.deliveryAddress?.address || delivery?.deliveryAddress);
    const packageId = delivery?.trackingNumber || delivery?.deliveryId || delivery?.id || 'N/A';
    const statusStr = (delivery?.status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const paymentMethod = (delivery?.paymentMethod || delivery?.payment?.method || '').toLowerCase();
    const isCash = paymentMethod === 'cash' || paymentMethod === 'cash_on_delivery' || paymentMethod === 'cod';
    const paymentStatus = (delivery?.paymentStatus || delivery?.payment?.status || '').toLowerCase();

    const isSmartRide = delivery?.serviceType === 'smartride' || delivery?.service === 'smartride' || delivery?.type === 'smartride';
    const ChatComponent = isSmartRide ? SmartRideDeliveryChat : DeliveryChat;

    // Collect package images from all known fields
    const rawImages = delivery?.images || delivery?.image || delivery?.packageImage ||
        delivery?.packageDetails?.images || delivery?.packageDetails?.image || null;
    const imageList = (() =>
    {
        if (!rawImages) return [];
        const arr = Array.isArray(rawImages) ? rawImages : [rawImages];
        return arr.map(img =>
        {
            if (!img) return null;
            if (typeof img === 'string') return img.trim();
            if (typeof img === 'object') return img.url || img.src || img.path || null;
            return null;
        }).filter(Boolean);
    })();

    const hasNextStatus = !!getNextStatus(delivery?.status);

    return (
        <IonPage>
            <RiderLayout>
                <IonContent className="ion-padding">
                    <IonToast
                        isOpen={showToast}
                        onDidDismiss={() => setShowToast(false)}
                        message={toastMsg}
                        duration={3000}
                        position="top"
                    />

                    {/* Back + Header */}
                    <YummyText>
                        <div className="mb-4 mt-1">
                            <button
                                onClick={() => router.push('/rider/active', 'back')}
                                className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-3"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Back to Active Deliveries
                            </button>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <div className="text-2xl font-medium text-[#0F172A]">Delivery Details</div>
                                    <div className="text-sm text-[#64748B] mt-0.5">{packageId}</div>
                                </div>
                                {delivery && (
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                            {statusStr}
                                        </span>
                                        {paymentStatus === 'paid' && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Paid</span>
                                        )}
                                        {paymentStatus !== 'paid' && isCash && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-white text-green-600 border border-green-300">Cash</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </YummyText>

                    {loading ? (
                        <Loader message="Loading delivery details..." />
                    ) : !delivery ? (
                        <div className="text-center py-16">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4 opacity-30">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#94A3B8" />
                            </svg>
                            <div className="text-lg font-medium text-[#0F172A] mb-2">Delivery Not Found</div>
                            <div className="text-sm text-[#64748B]">This delivery may no longer be in your active list.</div>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-8">

                            {/* ── Earnings banner ── */}
                            {delivery.earningsBreakdown && (
                                <div className="bg-gradient-to-r from-[#00B75A] to-[#00D68F] rounded-2xl p-4 text-white" style={sideBottomShadow}>
                                    <YummyText>
                                        <div className="text-xs opacity-80 mb-1">Your Earnings</div>
                                        <div className="text-2xl font-semibold">₦{Number(delivery.earningsBreakdown.driverEarnings || 0).toLocaleString()}</div>
                                        <div className="text-xs opacity-70 mt-0.5">of ₦{Number(delivery.earningsBreakdown.deliveryTotal || 0).toLocaleString()} total</div>
                                    </YummyText>
                                </div>
                            )}

                            {/* ── Map ── */}
                            <div className="rounded-2xl overflow-hidden" style={sideBottomShadow}>
                                <div className="h-64 w-full">
                                    {pickupCoords && deliveryCoords ? (
                                        <TrackingMap
                                            pickupLocation={pickupCoords}
                                            dropoffLocation={deliveryCoords}
                                            driverLocation={driverLocation}
                                            onRouteStats={(s) => setRouteStats(s)}
                                        />
                                    ) : (
                                        <div className="h-full bg-gradient-to-br from-[#E5F5E5] to-[#C8E6C9] flex items-center justify-center">
                                            <div className="text-center">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 opacity-50">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#00B75A" />
                                                    <circle cx="12" cy="10" r="3" fill="white" />
                                                </svg>
                                                <YummyText><p className="text-xs text-[#64748B]">Map unavailable — coordinates missing</p></YummyText>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {routeStats && (
                                    <div className="bg-white px-4 py-2 flex gap-6 border-t border-gray-100">
                                        <YummyText>
                                            <span className="text-xs text-[#64748B]">{routeStats.distance}</span>
                                            <span className="text-xs text-[#94A3B8] mx-2">•</span>
                                            <span className="text-xs text-[#64748B]">Est. {routeStats.duration}</span>
                                        </YummyText>
                                    </div>
                                )}
                            </div>

                            {/* ── Pickup & Delivery cards ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Pickup */}
                                <div className="bg-white rounded-2xl p-4" style={sideBottomShadow}>
                                    <div className="flex gap-3 mb-3">
                                        <div className="w-8 h-8 bg-[#00D68F] rounded-full flex items-center justify-center flex-shrink-0">
                                            <img src="/locationicon-white.svg" alt="Pickup" className="w-4 h-4" onError={(e) => e.target.style.display = 'none'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-[#64748B] mb-0.5">Pickup Location</div>
                                            <YummyText>
                                                <div className="text-sm font-medium text-[#0A0A0A] truncate">
                                                    {delivery.pickup?.name || delivery.pickupName || delivery.senderName || 'Pickup Location'}
                                                </div>
                                                <div className="text-xs text-[#64748B] mt-0.5">{pickupAddressText}</div>
                                            </YummyText>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {pickupPhone && normalizePhoneForTel(pickupPhone) ? (
                                            <a
                                                href={`tel:${normalizePhoneForTel(pickupPhone)}`}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors no-underline text-[#0F172A]"
                                                style={{ border: '1px solid #E5E7EB' }}
                                                title={formatNigerianPhone(pickupPhone)}
                                            >
                                                <TelephoneIcon size={16} color="black" /> Call
                                            </a>
                                        ) : (
                                            <button
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors"
                                                style={{ border: '1px solid #E5E7EB' }}
                                                onClick={() => alert('Pickup phone not available')}
                                            >
                                                <TelephoneIcon size={16} color="black" /> Call
                                            </button>
                                        )}
                                        {pickupCoords && (
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${pickupCoords.lat},${pickupCoords.lng}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors no-underline text-[#0F172A]"
                                                style={{ border: '1px solid #E5E7EB' }}
                                            >
                                                <img src="/paperplane-icon.svg" alt="Nav" className="w-3.5 h-3.5" /> Navigate
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Delivery */}
                                <div className="bg-white rounded-2xl p-4" style={sideBottomShadow}>
                                    <div className="flex gap-3 mb-3">
                                        <div className="w-8 h-8 bg-[#FF9500] rounded-full flex items-center justify-center flex-shrink-0">
                                            <img src="/location-orange.svg" alt="Delivery" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} onError={(e) => e.target.style.display = 'none'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-[#64748B] mb-0.5">Delivery Location</div>
                                            <YummyText>
                                                <div className="text-sm font-medium text-[#0A0A0A] truncate">
                                                    {delivery.dropoff?.name || delivery.deliveryName || delivery.recipientName || 'Delivery Location'}
                                                </div>
                                                <div className="text-xs text-[#64748B] mt-0.5">{deliveryAddressText}</div>
                                            </YummyText>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {deliveryPhone && normalizePhoneForTel(deliveryPhone) ? (
                                            <a
                                                href={`tel:${normalizePhoneForTel(deliveryPhone)}`}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors no-underline text-[#0F172A]"
                                                style={{ border: '1px solid #E5E7EB' }}
                                                title={formatNigerianPhone(deliveryPhone)}
                                            >
                                                <TelephoneIcon size={16} color="black" /> Call
                                            </a>
                                        ) : (
                                            <button
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors"
                                                style={{ border: '1px solid #E5E7EB' }}
                                                onClick={() => alert('Delivery phone not available')}
                                            >
                                                <TelephoneIcon size={16} color="black" /> Call
                                            </button>
                                        )}
                                        {deliveryCoords && (
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${deliveryCoords.lat},${deliveryCoords.lng}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white rounded-lg text-xs hover:bg-gray-50 transition-colors no-underline text-[#0F172A]"
                                                style={{ border: '1px solid #E5E7EB' }}
                                            >
                                                <img src="/paperplane-icon.svg" alt="Nav" className="w-3.5 h-3.5" /> Navigate
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Package Details ── */}
                            <div className="bg-white rounded-2xl p-5" style={sideBottomShadow}>
                                <YummyText>
                                    <div className="text-sm font-medium text-[#0F172A] mb-3">Package Details</div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-xs text-[#64748B] mb-1">Size</div>
                                            <div className="text-sm font-medium text-[#0F172A]">
                                                {delivery.packageSize || delivery.size || delivery.packageDetails?.size || 'Standard'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[#64748B] mb-1">Weight</div>
                                            <div className="text-sm font-medium text-[#0F172A]">
                                                {delivery.packageWeight || delivery.weight || delivery.packageDetails?.weight || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[#64748B] mb-1">Notes</div>
                                            <div className="text-sm font-medium text-[#0F172A] line-clamp-2">
                                                {delivery.specialInstructions || delivery.notes || delivery.packageDetails?.description || '—'}
                                            </div>
                                        </div>
                                    </div>
                                </YummyText>
                            </div>

                            {/* ── Package Images ── */}
                            <div className="bg-white rounded-2xl p-5" style={sideBottomShadow}>
                                <YummyText>
                                    <div className="text-sm font-medium text-[#0F172A] mb-3">Package Images</div>
                                </YummyText>
                                {imageList.length > 0 ? (
                                    <PackageImageGallery images={imageList} />
                                ) : (
                                    <div className="w-full h-36 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="mb-2 opacity-30">
                                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#CBD5E1" />
                                        </svg>
                                        <YummyText><p className="text-xs text-[#94A3B8]">No package images uploaded</p></YummyText>
                                    </div>
                                )}
                            </div>

                            {/* ── Chat with customer ── */}
                            <div className="bg-white rounded-2xl overflow-hidden" style={sideBottomShadow}>
                                <div className="px-5 pt-4">
                                    <YummyText>
                                        <div className="text-sm font-medium text-[#0F172A] mb-1">Chat with customer</div>
                                    </YummyText>
                                </div>
                                <ChatComponent
                                    deliveryId={deliveryId}
                                    currentUserRole="driver"
                                    userRole="rider"
                                    maxHeight="260px"
                                />
                            </div>

                            {/* ── Action Buttons ── */}
                            {hasNextStatus && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleStatusUpdate}
                                        disabled={updatingStatus}
                                        className="flex-1 bg-[#00B75A] hover:bg-[#00B876] disabled:bg-gray-400 text-white py-3.5 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        {updatingStatus ? 'Updating...' : getActionButtonText(delivery.status)}
                                    </button>
                                    <button
                                        className="px-5 py-3.5 bg-white hover:bg-gray-50 rounded-xl text-sm text-[#0F172A] font-medium transition-colors"
                                        style={{ border: '1px solid #E5E7EB' }}
                                        onClick={() =>
                                        {
                                            setToastMsg('Report submitted. Our team will review it shortly.');
                                            setShowToast(true);
                                        }}
                                    >
                                        Report Issue
                                    </button>
                                </div>
                            )}

                        </div>
                    )}
                </IonContent>
            </RiderLayout>
        </IonPage>
    );
};

export default DeliveryDetail;
