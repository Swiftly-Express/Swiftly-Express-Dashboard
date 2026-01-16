import React, { useState } from 'react';
import { IonModal, IonContent, IonButton } from '@ionic/react';
import { Star, X } from 'lucide-react';
import { YummyText } from '../../../components/YummyText';

const RatingModal = ({ isOpen, onClose, delivery, onSubmitRating }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const driverName = delivery?.driver?.name ||
        delivery?.driver?.fullName ||
        delivery?.driverName ||
        'Your Driver';

    const handleSubmit = async () => {
        if (rating === 0) {
            return;
        }

        setSubmitting(true);
        try {
            // Only send rating field - backend doesn't accept comment or driverId
            await onSubmitRating({
                deliveryId: delivery._id || delivery.id,
                rating
            });

            // Reset and close
            setRating(0);
            setComment('');
            onClose();
        } catch (error) {
            console.error('[RatingModal] Failed to submit rating:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setComment('');
        setHoverRating(0);
        onClose();
    };

    return (
        <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
            <IonContent className="ion-padding">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <YummyText className="text-2xl font-bold text-gray-900">Rate Your Delivery</YummyText>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            disabled={submitting}
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                        {/* Driver Info */}
                        <div className="text-center mb-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                                {driverName.charAt(0).toUpperCase()}
                            </div>
                            <YummyText className="text-lg font-semibold text-gray-900 mb-1">
                                How was your delivery experience?
                            </YummyText>
                            <YummyText className="text-sm text-gray-600">
                                Rate {driverName}
                            </YummyText>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-2">
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
                                        fill={star <= (hoverRating || rating) ? '#FFD700' : 'none'}
                                        stroke={star <= (hoverRating || rating) ? '#FFD700' : '#D1D5DB'}
                                        strokeWidth={2}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Rating Label */}
                        {rating > 0 && (
                            <YummyText className="text-lg font-medium text-gray-700">
                                {rating === 5 && '⭐ Excellent!'}
                                {rating === 4 && '😊 Great!'}
                                {rating === 3 && '🙂 Good'}
                                {rating === 2 && '😐 Fair'}
                                {rating === 1 && '😞 Poor'}
                            </YummyText>
                        )}

                        {/* Comment */}
                        <div className="w-full max-w-md">
                            <YummyText className="text-sm font-medium text-gray-700 mb-2">
                                Additional Feedback (Optional)
                            </YummyText>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share more about your experience..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                rows={4}
                                maxLength={500}
                                disabled={submitting}
                            />
                            <YummyText className="text-xs text-gray-500 text-right mt-1">
                                {comment.length}/500
                            </YummyText>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting}
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={rating === 0 || submitting}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {submitting ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Rating'
                            )}
                        </button>
                    </div>
                </div>
            </IonContent>
        </IonModal>
    );
};

export default RatingModal;
