/**
 * Verification Notification & Reminder System
 * -------------------------------------------
 * Ionic + React (Vite) – JavaScript only
 *
 * Controls:
 * - Dashboard verification modal (cooldown)
 * - In-app verification notifications
 * - Push notification reminders
 *
 * Behavior:
 * - Reminds unverified users gently
 * - Never spams
 * - Stops completely once verified
 */

import { getCookie, setCookie, deleteCookie, getJSONCookie, setJSONCookie } from './cookies';

/* =========================
   STORAGE KEYS
========================= */

const STORAGE = {
  VERIFIED: 'riderAccountVerified',
  NOTIFICATIONS: 'riderNotifications',
  UNREAD_COUNT: 'riderUnreadNotifications',
  LAST_MODAL: 'lastVerificationModalShownAt',
  LAST_PUSH: 'lastVerificationPushNotification',
};

/* =========================
   HELPERS
========================= */

const isVerified = () => {
  return getCookie(STORAGE.VERIFIED) === 'true';
};

const now = () => Date.now();

const hoursSince = (timestamp) => {
  if (!timestamp) return Infinity;
  return (now() - Number(timestamp)) / (1000 * 60 * 60);
};

/* =========================
   DASHBOARD MODAL CONTROL
========================= */

export const shouldShowVerificationModal = () => {
  if (isVerified()) return false;

  const lastShown = getCookie(STORAGE.LAST_MODAL);
  return hoursSince(lastShown) >= 24; // once per day
};

export const markVerificationModalShown = () => {
  setCookie(STORAGE.LAST_MODAL, now().toString(), 1);
};

/* =========================
   IN-APP NOTIFICATIONS
========================= */

export const addVerificationNotification = () => {
  if (isVerified()) return;

  const notifications = getJSONCookie(STORAGE.NOTIFICATIONS) || [];

  const exists = notifications.some(
    (n) => n.type === 'verification_reminder' && n.read === false
  );

  if (exists) return;

  notifications.unshift({
    id: `verify_${now()}`,
    type: 'verification_reminder',
    title: 'Complete Account Verification',
    message:
      'Verify your account to unlock all features and start receiving delivery requests.',
    timestamp: new Date().toISOString(),
    read: false,
    priority: 'high',
    action: {
      label: 'Verify Now',
      route: '/rider/verify-account',
    },
  });

  setJSONCookie(STORAGE.NOTIFICATIONS, notifications, 7);

  updateUnreadCount();
};

export const removeVerificationNotification = () => {
  const notifications = getJSONCookie(STORAGE.NOTIFICATIONS) || [];

  const filtered = notifications.filter(
    (n) => n.type !== 'verification_reminder'
  );

  setJSONCookie(STORAGE.NOTIFICATIONS, filtered, 7);

  updateUnreadCount();
};

const updateUnreadCount = () => {
  const notifications = getJSONCookie(STORAGE.NOTIFICATIONS) || [];

  const unread = notifications.filter((n) => !n.read).length;

  setCookie(STORAGE.UNREAD_COUNT, unread.toString(), 7);
};

/* =========================
   PUSH NOTIFICATIONS
========================= */

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const scheduleVerificationPush = () => {
  if (isVerified()) {
    cancelVerificationPush();
    return;
  }

  const lastSent = getCookie(STORAGE.LAST_PUSH);

  // Max once every 24 hours
  if (hoursSince(lastSent) < 24) return;

  sendVerificationPush();
};

const sendVerificationPush = () => {
  if (isVerified()) return;

  setCookie(STORAGE.LAST_PUSH, now().toString(), 1);

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Verify Your Account', {
      body:
        'Complete your verification to start receiving delivery requests.',
      tag: 'verification-reminder',
      data: {
        url: '/rider/verify-account',
      },
    });
  }
};

export const cancelVerificationPush = () => {
  deleteCookie(STORAGE.LAST_PUSH);
};

/* =========================
   INITIALIZATION
========================= */

export const initializeVerificationSystem = async () => {
  if (isVerified()) {
    cleanupAfterVerification();
    return;
  }

  // In-app reminder
  addVerificationNotification();

  // Push notification (soft reminder)
  const granted = await requestNotificationPermission();
  if (granted) {
    scheduleVerificationPush();
  }
};

/* =========================
   FINAL STOP (CALL ON APPROVAL)
========================= */

export const onVerificationApproved = () => {
  setCookie(STORAGE.VERIFIED, 'true', 7);

  removeVerificationNotification();
  cancelVerificationPush();
  deleteCookie(STORAGE.LAST_MODAL);
};

// Missing function reference
function cleanupAfterVerification() {
  removeVerificationNotification();
  cancelVerificationPush();
  deleteCookie(STORAGE.LAST_MODAL);
}
