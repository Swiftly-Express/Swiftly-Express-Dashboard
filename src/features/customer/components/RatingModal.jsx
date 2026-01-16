import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { YummyText } from '../../../components/YummyText';
import { rateDriver } from '../../../utils/authApi';

const RatingModal = ({ isOpen: controlledOpen, onClose: controlledClose, delivery: controlledDelivery }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [delivery, setDelivery] = useState(controlledDelivery || null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (typeof controlledOpen !== 'undefined') {
            setIsOpen(!!controlledOpen);
        }
    }, [controlledOpen]);

    useEffect(() => {
        if (controlledDelivery) setDelivery(controlledDelivery);
    }, [controlledDelivery]);

    // Listen for global show/hide events so the card can be triggered from anywhere
    useEffect(() => {
        const handleShow = (e) => {
            const d = e?.detail || null;
            setDelivery(d);
            setIsOpen(true);
        };

        const handleHide = () => {
            setIsOpen(false);
        };

        window.addEventListener('rating:show', handleShow);
        window.addEventListener('rating:hide', handleHide);

        return () => {
            window.removeEventListener('rating:show', handleShow);
            window.removeEventListener('rating:hide', handleHide);
        };
    }, []);

    const close = () => {
        setIsOpen(false);
        setRating(0);
        setHoverRating(0);
        setDelivery(null);
        if (typeof controlledClose === 'function') controlledClose();
    };

    const handleSubmit = async () => {
        if (rating === 0 || !delivery) return;
        setSubmitting(true);
        try {
            const deliveryId = delivery._id || delivery.id || delivery.trackingId || delivery.trackingNumber;
            const res = await rateDriver(deliveryId, { rating });
            console.log('[RatingModal] rateDriver response:', res);

            // Notify app of submission so pages can refresh
            window.dispatchEvent(new CustomEvent('rating:submitted', { detail: { deliveryId, rating } }));

            close();
        } catch (err) {
            console.error('[RatingModal] Failed to submit rating:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const driverName = delivery?.driver?.name || delivery?.driver?.fullName || delivery?.driverName || 'Your Driver';

    return (
        // Glassmorphism fixed card similar to PaymentSuccess
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

            <div className="relative w-full max-w-lg mx-auto">
                <div className="relative bg-white/70 backdrop-blur-md border border-white/20 shadow-lg w-full rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <YummyText className="text-2xl font-semibold text-[#0F172A]">Rate Your Delivery</YummyText>
                        <button onClick={close} className="p-2 rounded-full hover:bg-gray-100 transition-colors" disabled={submitting}>
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                                {driverName.charAt(0).toUpperCase()}
                            </div>
                            <YummyText className="text-lg font-semibold text-gray-900">How was your delivery experience?</YummyText>
                            <YummyText className="text-sm text-gray-600">Rate {driverName}</YummyText>
                        </div>

                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="focus:outline-none transition-transform hover:scale-110" disabled={submitting}>
                                    <Star className="w-12 h-12" fill={star <= (hoverRating || rating) ? '#FFD700' : 'none'} stroke={star <= (hoverRating || rating) ? '#FFD700' : '#D1D5DB'} strokeWidth={2} />
                                </button>
                            ))}
                        </div>

                        {rating > 0 && (
                            <YummyText className="text-lg font-medium text-gray-700">
                                {rating === 5 && '⭐ Excellent!'}{rating === 4 && '😊 Great!'}{rating === 3 && '🙂 Good'}{rating === 2 && '😐 Fair'}{rating === 1 && '😞 Poor'}
                            </YummyText>
                        )}

                        <div className="w-full max-w-md mt-2">
                            <div className="flex gap-3 mt-4">
                                <button onClick={close} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50" disabled={submitting}>Skip</button>
                                <button onClick={handleSubmit} disabled={rating === 0 || submitting} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Rating'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
