import React from 'react';
import { IonModal, IonContent } from '@ionic/react';
import { XCircle, X } from 'lucide-react';
import { YummyText } from '../../../components/YummyText';

const PaymentFailedModal = ({ isOpen, onClose, orderDetails }) => {
    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose}>
            <IonContent className="ion-padding">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <YummyText className="text-xl font-bold text-gray-900">Payment Status</YummyText>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8">
                        {/* Error Icon */}
                        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="w-16 h-16 text-red-600" />
                        </div>

                        {/* Message */}
                        <div className="text-center space-y-2">
                            <YummyText className="text-2xl font-bold text-gray-900">
                                Payment Not Completed
                            </YummyText>
                            <YummyText className="text-base text-gray-600">
                                Your order has been cancelled because payment was not completed.
                            </YummyText>
                        </div>

                        {/* Order Details */}
                        {orderDetails && (
                            <div className="w-full max-w-md bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <YummyText className="text-sm text-gray-600">Order ID:</YummyText>
                                    <YummyText className="text-sm font-medium text-gray-900">
                                        {orderDetails.trackingNumber || orderDetails.id || 'N/A'}
                                    </YummyText>
                                </div>
                                <div className="flex justify-between items-center">
                                    <YummyText className="text-sm text-gray-600">Status:</YummyText>
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                        Cancelled
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <YummyText className="text-sm text-gray-600">Amount:</YummyText>
                                    <YummyText className="text-sm font-medium text-gray-900">
                                        ₦{orderDetails.price?.toLocaleString() || '0'}
                                    </YummyText>
                                </div>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <YummyText className="text-sm text-blue-800">
                                <strong>Note:</strong> To complete your delivery, please create a new order and ensure payment is completed before leaving the payment page.
                            </YummyText>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                        <button
                            onClick={onClose}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            </IonContent>
        </IonModal>
    );
};

export default PaymentFailedModal;
