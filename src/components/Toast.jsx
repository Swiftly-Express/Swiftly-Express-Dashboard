import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Toast = ({ message, type = 'info', duration = 5000, isOpen, onClose, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsExiting(false);

            if (duration > 0) {
                const timer = setTimeout(() => {
                    handleClose();
                }, duration);

                return () => clearTimeout(timer);
            }
        }
    }, [isOpen, duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsExiting(false);
            if (onClose) onClose();
        }, 300);
    };

    if (!isVisible && !isOpen) return null;

    const icons = {
        success: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#00B75A" />
            </svg>
        ),
        error: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#EF4444" />
            </svg>
        ),
        warning: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="#F59E0B" />
            </svg>
        ),
        info: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#3B82F6" />
            </svg>
        ),
        reminder: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#00B75A" />
            </svg>
        ),
    };

    const backgrounds = {
        success: 'bg-gradient-to-r from-[#00B75A]/10 to-[#00D68F]/10 border-[#00B75A]',
        error: 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-500',
        warning: 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-500',
        info: 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-500',
        reminder: 'bg-gradient-to-r from-[#00B75A]/10 to-[#00D68F]/10 border-[#00B75A]',
    };

    const textColors = {
        success: 'text-[#0F172A]',
        error: 'text-[#0F172A]',
        warning: 'text-[#0F172A]',
        info: 'text-[#0F172A]',
        reminder: 'text-[#0F172A]',
    };

    const positionClasses = {
        top: 'top-4 left-1/2 -translate-x-1/2',
        bottom: 'bottom-4 left-1/2 -translate-x-1/2',
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
    };

    const animationClasses = isExiting
        ? 'animate-slide-out-up opacity-0'
        : 'animate-slide-in-down';

    const toastContent = (
        <div
            className={`fixed ${positionClasses[position]} z-[10000] ${animationClasses} transition-all duration-300`}
            style={{
                fontFamily: "'Yummy Food', 'Bricolage Grotesque', system-ui, -apple-system, sans-serif",
            }}
        >
            <div
                className={`${backgrounds[type]} ${textColors[type]} min-w-[320px] max-w-md px-4 py-3 rounded-xl border-2 shadow-lg backdrop-blur-sm flex items-start gap-3`}
            >
                <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
                <div className="flex-1 min-w-0">
                    {typeof message === 'string' ? (
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-line">{message}</p>
                    ) : (
                        message
                    )}
                </div>
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors"
                    aria-label="Close"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    );

    return createPortal(toastContent, document.body);
};

// Hook for easier toast management
export const useToast = () => {
    const [toast, setToast] = useState({
        isOpen: false,
        message: '',
        type: 'info',
        duration: 5000,
        position: 'top',
    });

    const showToast = (message, type = 'info', duration = 5000, position = 'top') => {
        setToast({ isOpen: true, message, type, duration, position });
    };

    const hideToast = () => {
        setToast((prev) => ({ ...prev, isOpen: false }));
    };

    return {
        toast,
        showToast,
        hideToast,
        ToastComponent: () => (
            <Toast
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                isOpen={toast.isOpen}
                onClose={hideToast}
                position={toast.position}
            />
        ),
    };
};

export default Toast;
