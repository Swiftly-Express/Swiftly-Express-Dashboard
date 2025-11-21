// Verification Notification Helper
// Manages verification reminders in notifications and push notifications

/**
 * Add verification reminder to rider's notifications
 */
export const addVerificationNotification = () => {
  const notifications = JSON.parse(localStorage.getItem('riderNotifications') || '[]');
  
  // Check if verification notification already exists
  const existingNotification = notifications.find(
    n => n.type === 'verification_reminder' && !n.read
  );
  
  if (!existingNotification) {
    const notification = {
      id: `verify_${Date.now()}`,
      type: 'verification_reminder',
      title: 'Complete Account Verification',
      message: 'Verify your account to unlock all features and start receiving premium delivery orders.',
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high',
      action: {
        label: 'Verify Now',
        route: '/rider/verify-account'
      }
    };
    
    // Add to the beginning of notifications array
    notifications.unshift(notification);
    localStorage.setItem('riderNotifications', JSON.stringify(notifications));
    
    // Update unread count
    updateUnreadCount();
  }
};

/**
 * Remove verification notification when account is verified
 */
export const removeVerificationNotification = () => {
  const notifications = JSON.parse(localStorage.getItem('riderNotifications') || '[]');
  const filtered = notifications.filter(n => n.type !== 'verification_reminder');
  localStorage.setItem('riderNotifications', JSON.stringify(filtered));
  updateUnreadCount();
};

/**
 * Update unread notification count
 */
const updateUnreadCount = () => {
  const notifications = JSON.parse(localStorage.getItem('riderNotifications') || '[]');
  const unreadCount = notifications.filter(n => !n.read).length;
  localStorage.setItem('riderUnreadNotifications', unreadCount.toString());
};

/**
 * Schedule push notification reminders
 * This would integrate with your push notification service (Firebase, OneSignal, etc.)
 */
export const schedulePushNotifications = () => {
  const isVerified = localStorage.getItem('riderAccountVerified') === 'true';
  
  if (isVerified) {
    // Cancel all scheduled verification reminders
    cancelScheduledNotifications();
    return;
  }
  
  // Get last reminder time
  const lastReminder = localStorage.getItem('lastVerificationPushNotification');
  const now = new Date().getTime();
  
  if (lastReminder) {
    const lastReminderTime = new Date(lastReminder).getTime();
    const hoursSinceLastReminder = (now - lastReminderTime) / (1000 * 60 * 60);
    
    // Don't schedule if a reminder was sent less than 3 hours ago
    if (hoursSinceLastReminder < 3) {
      return;
    }
  }
  
  // Schedule next push notification
  scheduleNextPushReminder();
};

/**
 * Schedule the next push notification reminder (every 3-4 hours)
 */
const scheduleNextPushReminder = () => {
  // Random interval between 3-4 hours
  const hoursDelay = 3 + Math.random(); // 3 to 4 hours
  const delayMs = hoursDelay * 60 * 60 * 1000;
  
  // Store schedule info
  const nextReminderTime = new Date(Date.now() + delayMs);
  localStorage.setItem('nextVerificationPushNotification', nextReminderTime.toISOString());
  
  // In a real implementation, this would call your push notification service API
  // For now, we'll simulate with setTimeout (note: this won't persist across sessions)
  // In production, use a backend service or Firebase Cloud Messaging
  
  setTimeout(() => {
    sendVerificationPushNotification();
  }, delayMs);
};

/**
 * Send push notification reminder
 * This is a placeholder - integrate with your actual push notification service
 */
const sendVerificationPushNotification = () => {
  // Check if still not verified
  const isVerified = localStorage.getItem('riderAccountVerified') === 'true';
  if (isVerified) return;
  
  // Update last sent time
  localStorage.setItem('lastVerificationPushNotification', new Date().toISOString());
  
  // In a real app, this would send via Firebase, OneSignal, etc.
  // Example with Web Push API (requires service worker):
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Complete Your Verification', {
      body: 'Verify your account to unlock all features and start earning more.',
      icon: '/icon.png',
      badge: '/badge.png',
      tag: 'verification-reminder',
      requireInteraction: false,
      data: {
        url: '/rider/verify-account'
      }
    });
  }
  
  // Schedule next reminder
  scheduleNextPushReminder();
};

/**
 * Cancel all scheduled verification push notifications
 */
const cancelScheduledNotifications = () => {
  localStorage.removeItem('nextVerificationPushNotification');
  localStorage.removeItem('lastVerificationPushNotification');
  // In production, also cancel scheduled notifications on your backend/push service
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

/**
 * Initialize verification notification system
 */
export const initializeVerificationNotifications = () => {
  const isVerified = localStorage.getItem('riderAccountVerified') === 'true';
  
  if (!isVerified) {
    // Add in-app notification
    addVerificationNotification();
    
    // Request permission and schedule push notifications
    requestNotificationPermission().then(granted => {
      if (granted) {
        schedulePushNotifications();
      }
    });
  }
};
