import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { YummyText } from '../../../components/YummyText';
import { rateDriver } from '../../../utils/authApi';

const RatingModal = ({ isOpen: controlledOpen, onClose: controlledClose, delivery: controlledDelivery }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [delivery, setDelivery] = useState(controlledDelivery || null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState([]);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Tag options based on design
    const tags = [
        'Fast Delivery',
        'Professional',
        'Courteous',
        'Handled with Care',
        'Arrived Late'
    ];

    useEffect(() => {
        if (typeof controlledOpen !== 'undefined') {
            setIsOpen(!!controlledOpen);
        }
    }, [controlledOpen]);

    useEffect(() => {
        if (controlledDelivery) setDelivery(controlledDelivery);
    }, [controlledDelivery]);

    // Listen for global show/hide events
    useEffect(() => {
        const handleShow = (e) => {
            const d = e?.detail || null;
            setDelivery(d);
            setIsOpen(true);
            setShowSuccess(false);
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
        setSelectedTags([]);
        setComment('');
        setDelivery(null);
        setShowSuccess(false);
        if (typeof controlledClose === 'function') controlledClose();
    };

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (rating === 0 || !delivery) return;

        setSubmitting(true);
        try {
            const deliveryId = delivery._id || delivery.id || delivery.trackingId || delivery.trackingNumber;

            // Submit rating with tags and comment
            const res = await rateDriver(deliveryId, {
                rating,
                tags: selectedTags,
                comment: comment.trim() || undefined
            });

            console.log('[RatingModal] rateDriver response:', res);

            // Show success state
            setShowSuccess(true);

            // Notify app of submission
            window.dispatchEvent(new CustomEvent('rating:submitted', {
                detail: { deliveryId, rating, tags: selectedTags, comment }
            }));

            // Auto-close after 2.5 seconds
            setTimeout(() => {
                close();
            }, 2500);
        } catch (err) {
            console.error('[RatingModal] Failed to submit rating:', err);
            setShowSuccess(false);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const driverName = delivery?.driver?.name || delivery?.driver?.fullName || delivery?.driverName || 'Your Rider';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                }}
                onClick={!submitting && !showSuccess ? close : undefined}
            />

            {/* Modal with glassmorphism */}
            <div className="relative w-full max-w-lg mx-auto">
                <div
                    className="relative rounded-3xl shadow-2xl w-full overflow-hidden border"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                    }}
                >
                    {!showSuccess ? (
                        // Rating Form
                        <div className="p-8">
                            {/* Header with badge */}
                            <div className="flex flex-col items-center mb-6">
                                <div
                                    className="mb-4 px-4 py-1.5 border-2 border-green-500 border-dashed rounded-lg"
                                    style={{
                                        background: 'rgba(240, 253, 244, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <YummyText className="text-sm text-green-700 font-medium">
                                        Rate Your Rider
                                    </YummyText>
                                </div>

                                <YummyText className="text-2xl font-semibold text-[#0F172A] text-center mb-2">
                                    How was your delivery experience?
                                </YummyText>
                            </div>

                            {/* Star Rating */}
                            <div className="flex items-center justify-center gap-3 mb-8">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                        disabled={submitting}
                                    >
                                        <Star
                                            className="w-12 h-12"
                                            fill={star <= (hoverRating || rating) ? '#D1D5DB' : 'none'}
                                            stroke={star <= (hoverRating || rating) ? '#D1D5DB' : '#E5E7EB'}
                                            strokeWidth={2}
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Tags */}
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            disabled={submitting}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTags.includes(tag)
                                                ? 'bg-gray-300 text-gray-800'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Comment Section */}
                            <div className="mb-6">
                                <YummyText className="text-sm text-gray-700 font-medium mb-2">
                                    Leave a comment
                                </YummyText>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add a comment (optional)..."
                                    disabled={submitting}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={rating === 0 || submitting}
                                className="w-full px-6 py-4 bg-[#00B75A] hover:bg-[#00A04A] text-white rounded-xl font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    ) : (
                        // Success State
                        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                            {/* Party Popper Icon */}
                            <div className="mb-6 text-8xl">
                                🎉
                            </div>

                            <YummyText className="text-2xl font-semibold text-[#0F172A] text-center mb-3">
                                Thank you for your feedback! Your rating has been submitted successfully.
                            </YummyText>

                            <button
                                onClick={close}
                                className="mt-6 w-full px-6 py-4 bg-[#00B75A] hover:bg-[#00A04A] text-white rounded-xl font-medium text-base transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RatingModal;