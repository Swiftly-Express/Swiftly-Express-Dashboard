class PushNotificationService {
    constructor() {
        this.permission = 'default';
        this.checkPermission();
    }


    checkPermission() {
        if (!('Notification' in window)) {
            console.warn('[PushNotifications] Browser does not support notifications');
            return false;
        }
        this.permission = Notification.permission;
        return this.permission === 'granted';
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('[PushNotifications] Browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            console.log('[PushNotifications] Permission already granted');
            this.permission = 'granted';
            return true;
        }

        if (Notification.permission === 'denied') {
            console.warn('[PushNotifications] Permission denied by user');
            this.permission = 'denied';
            return false;
        }

        try {
            console.log('[PushNotifications] Requesting permission...');
            const permission = await Notification.requestPermission();
            this.permission = permission;

            if (permission === 'granted') {
                console.log('[PushNotifications] ✅ Permission granted!');
                return true;
            } else {
                console.warn('[PushNotifications] ❌ Permission denied');
                return false;
            }
        } catch (error) {
            console.error('[PushNotifications] Error requesting permission:', error);
            return false;
        }
    }


    showNotification(title, options = {}) {
        if (!this.checkPermission()) {
            console.warn('[PushNotifications] Permission not granted, cannot show notification');
            return null;
        }

        try {
            const defaultOptions = {
                icon: '/swiftly-icon.svg', // Add your app icon path
                badge: '/swiftly-icon.svg', // Small icon for notification badge
                vibrate: [200, 100, 200], // Vibration pattern for mobile
                requireInteraction: true, // Keep notification visible until user interacts
                tag: 'swiftly-order', // Unique tag to replace old notifications
                renotify: true, // Vibrate/sound even if tag exists
                ...options
            };

            const notification = new Notification(title, defaultOptions);

            // Auto-close after 30 seconds if user doesn't interact
            setTimeout(() => {
                if (notification) {
                    notification.close();
                }
            }, 30000);

            // Handle notification click - focus the window
            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                notification.close();
            };

            console.log('[PushNotifications] 🔔 Notification shown:', title);
            return notification;
        } catch (error) {
            console.error('[PushNotifications] Error showing notification:', error);
            return null;
        }
    }

    /**
     * Show new order notification
     * @param {number} count - Number of new orders
     */
    notifyNewOrders(count = 1) {
        const title = count === 1
            ? 'New Delivery Available!'
            : `${count} New Deliveries Available!`;

        const body = count === 1
            ? 'A customer just created a new delivery order. Open the app to accept!'
            : `${count} customers just created delivery orders. Open the app to view!`;

        return this.showNotification(title, {
            body,
            icon: '/swiftly-icon.svg',
            badge: '/swiftly-icon.svg',
            tag: 'new-orders',
            data: { type: 'new-orders', count }
        });
    }

    notifyInvitation(customerName = 'A customer') {
        return this.showNotification('Delivery Request!', {
            body: `${customerName} requested you specifically for a delivery. Accept now!`,
            icon: '/swiftly-icon.svg',
            badge: '/swiftly-icon.svg',
            tag: 'invitation',
            data: { type: 'invitation' }
        });
    }

    /**
     * Notify admin of new user registration
     * @param {string} role - User role (customer or rider)
     * @param {string} name - User name
     */
    notifyNewUserRegistration(role = 'user', name = 'A new user') {
        const roleLabel = role === 'customer' ? 'Customer' : role === 'rider' ? 'Rider' : 'User';
        return this.showNotification(`New ${roleLabel} Registered!`, {
            body: `${name} just registered as a ${role}. Review their profile in the admin dashboard.`,
            icon: '/swiftly-icon.svg',
            badge: '/swiftly-icon.svg',
            tag: 'new-user-registration',
            renotify: true,
            data: { type: 'new-user-registration', role, name }
        });
    }

    /**
     * Notify admin of new KYC verification submission
     * @param {string} riderName - Rider name
     */
    notifyNewKYCSubmission(riderName = 'A rider') {
        return this.showNotification('New KYC Verification Submitted!', {
            body: `${riderName} submitted their verification documents. Review and approve in the KYC Approvals page.`,
            icon: '/swiftly-icon.svg',
            badge: '/swiftly-icon.svg',
            tag: 'new-kyc-submission',
            renotify: true,
            data: { type: 'new-kyc-submission', riderName }
        });
    }
}

// Singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;

// Named exports for convenience
export const requestNotificationPermission = () => pushNotificationService.requestPermission();
export const showNotification = (title, options) => pushNotificationService.showNotification(title, options);
export const notifyNewOrders = (count) => pushNotificationService.notifyNewOrders(count);
export const notifyInvitation = (customerName) => pushNotificationService.notifyInvitation(customerName);
export const notifyNewUserRegistration = (role, name) => pushNotificationService.notifyNewUserRegistration(role, name);
export const notifyNewKYCSubmission = (riderName) => pushNotificationService.notifyNewKYCSubmission(riderName);
