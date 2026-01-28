import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { YummyText } from '../../../components/YummyText';
import { getCookie } from '../../../utils/cookies';
import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../../utils/authApi';

const AdminLayout = ({ children }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPage, setNotificationPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const checkNotifications = async () => {
    try {
      const countResponse = await getUnreadNotificationCount();
      const count = countResponse?.data?.count || countResponse?.count || 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('[AdminLayout] Failed to fetch notification count:', error);
    }
  };

  const fetchNotifications = async (page = 1, append = false) => {
    try {
      setLoadingNotifications(true);
      const response = await getNotifications(page, 20);
      const data = response?.data || response;
      const notificationsList = data?.notifications || data?.data || [];
      const totalPages = data?.totalPages || data?.pages || 1;

      if (append) {
        setNotifications(prev => [...prev, ...notificationsList]);
      } else {
        setNotifications(notificationsList);
      }

      setHasMoreNotifications(page < totalPages);
      setNotificationPage(page);
    } catch (error) {
      console.error('[AdminLayout] Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const toggleNotifications = async () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState) {
      // Fetch notifications to populate dropdown
      await fetchNotifications(1, false);

      // Optimistically mark everything read locally and on the server
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);

      // Fire server-side mark-all in background and refresh shortly after
      (async () => {
        try {
          await markAllNotificationsAsRead();
        } catch (err) {
          console.warn('[AdminLayout] markAllNotificationsAsRead failed', err);
        }
        setTimeout(async () => {
          try {
            await fetchNotifications(1, false);
            await checkNotifications();
          } catch (e) {
            console.warn('[AdminLayout] Refresh after toggle mark-all failed', e);
          }
        }, 300);
      })();
    }
  };

  const handleMarkAllAsRead = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      console.log('[AdminLayout] Marking all notifications as read...');
      const response = await markAllNotificationsAsRead();
      console.log('[AdminLayout] Mark all as read response:', response);

      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);

      // Refresh from server in background (delayed to avoid race conditions)
      setTimeout(async () => {
        try {
          await fetchNotifications(1, false);
          await checkNotifications();
        } catch (err) {
          console.warn('[AdminLayout] Refresh after mark-all failed', err);
        }
      }, 200);

      try { if (document && document.activeElement) document.activeElement.blur(); } catch (err) { /* ignore */ }
      console.log('[AdminLayout] All notifications marked as read successfully');
    } catch (error) {
      console.error('[AdminLayout] Failed to mark all as read:', error);
      console.error('[AdminLayout] Error details:', error.response?.data || error.message);
      // Revert optimistic update on error
      try {
        await fetchNotifications(1, false);
        await checkNotifications();
      } catch (e) {
        console.warn('[AdminLayout] Failed to revert after mark-all error', e);
      }
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      console.log('[AdminLayout] Marking notification as read:', notificationId);
      const response = await markNotificationAsRead(notificationId);
      console.log('[AdminLayout] Mark as read response:', response);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId || n.id === notificationId ? { ...n, isRead: true, read: true } : n)
      );
      await checkNotifications();
      console.log('[AdminLayout] Notification marked as read successfully');
    } catch (error) {
      console.error('[AdminLayout] Failed to mark as read:', error);
      console.error('[AdminLayout] Error details:', error.response?.data || error.message);
    }
  };

  const loadMoreNotifications = () => {
    if (!loadingNotifications && hasMoreNotifications) {
      fetchNotifications(notificationPage + 1, true);
    }
  };

  useEffect(() => {
    checkNotifications();

    const notificationInterval = setInterval(() => {
      checkNotifications();
    }, 30000);

    const handleKycUpdate = () => {
      console.log('[AdminLayout] kyc:updated event received');
      checkNotifications();
    };
    const handleUserCreated = () => {
      console.log('[AdminLayout] user:created event received');
      checkNotifications();
    };
    const handleKycSubmitted = () => {
      console.log('[AdminLayout] kyc:submitted event received');
      checkNotifications();
    };

    const handleVerificationCompleted = () => {
      console.log('[AdminLayout] verification:completed event received');
      checkNotifications();
    };

    const handleDebtUpdated = (evt) => {
      console.log('[AdminLayout] debt:updated event received', evt?.detail);
      checkNotifications();
      // Optionally refresh visible notifications
      fetchNotifications(1, false).catch(() => { });
    };

    window.addEventListener('kyc:updated', handleKycUpdate);
    window.addEventListener('user:created', handleUserCreated);
    window.addEventListener('kyc:submitted', handleKycSubmitted);
    window.addEventListener('verification:completed', handleVerificationCompleted);
    window.addEventListener('debt:updated', handleDebtUpdated);

    return () => {
      clearInterval(notificationInterval);
      window.removeEventListener('kyc:updated', handleKycUpdate);
      window.removeEventListener('user:created', handleUserCreated);
      window.removeEventListener('kyc:submitted', handleKycSubmitted);
      window.removeEventListener('verification:completed', handleVerificationCompleted);
      window.removeEventListener('debt:updated', handleDebtUpdated);
    };
  }, []);
  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      <AdminSidebar />
      <div className="md:ml-64 ml-0 flex-1 flex flex-col min-h-0 bricolage-font bg-white">
        {/* Fixed Top Header - positioned to respect sidebar width (ml-64) */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50">
          <div className="bg-transparent backdrop-blur-sm border-b border-gray-200 h-14">
            <div className="flex items-center justify-between h-full">
              {/* Left: logo + title */}
              <div className="flex items-center gap-1 ml-0.5">
                <img src="/swiftly-logo.svg" alt="Swiftly" className="h-28 object-contain" />
                <YummyText className="text-xs text-[#0F172A] border border-[#00B75A] rounded-full px-2 py-0.5">Admin</YummyText>
              </div>

              {/* Right: actions */}
              <div className="flex items-center justify-end gap-4 pr-6">
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#64748B" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#FF6B00] text-white text-[10px] rounded-full flex items-center justify-center font-medium px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {/* <button className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B75A] flex items-center justify-center overflow-hidden text-white font-medium text-sm">
                  AD
                </button> */}

                <button className="p-2 flex flex-col gap-1 justify-center" aria-label="menu" onClick={() => window.dispatchEvent(new CustomEvent('admin:toggleMobileSidebar'))}>
                  <span className="block w-8 h-1 bg-[#111827] rounded"></span>
                  <span className="block w-8 h-1 bg-[#111827] rounded"></span>
                  <span className="block w-8 h-1 bg-[#111827] rounded"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Top Header - visible on md+ screens */}
        <div className="hidden md:block fixed top-0 left-0 right-0 z-40">
          <div className="bg-white border-b border-gray-200 h-16 shadow-sm">
            <div className="flex items-center justify-between h-full">
              {/* Left: logo + title */}
              <div className="flex items-center gap-1 ml-4">
                <img src="/swiftly-logo.svg" alt="Swiftly" className="h-28 object-contain" />
                <YummyText className="text-xs text-[#0F172A] border border-[#00B75A] rounded-full px-2 py-0.5">Admin</YummyText>
              </div>

              {/* Right actions */}
              <div className="flex items-center justify-end gap-4 pr-6">
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#64748B" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#FF6B00] text-white text-[10px] rounded-full flex items-center justify-center font-medium px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <button onClick={() => (window.location.href = '/auth/admin/profile')} title="View Profile" aria-label="View Profile" className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B75A] flex items-center justify-center overflow-hidden text-white font-medium text-sm">
                  AD
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content (header has fixed position).
            Allow page scrolling but hide the visible scrollbar using a utility class.
            Inner sections (with their own overflow-y-auto) will still show scrollbars.
        */}
        <div className="flex-1 md:p-8 p-0 pt-16 md:pt-24 overflow-y-auto no-scrollbar">
          {children}
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setShowNotifications(false)} />
            <div className="fixed top-16 md:top-20 right-4 md:right-8 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] max-h-[500px] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <YummyText className="text-lg font-semibold text-[#0F172A]">Notifications</YummyText>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="text-xs text-[#00B75A] hover:text-[#00a352] font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {loadingNotifications && notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D68F] mx-auto mb-3"></div>
                    <YummyText className="text-sm text-gray-400">Loading notifications...</YummyText>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3 opacity-50">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                    </svg>
                    <YummyText className="text-sm">No notifications yet</YummyText>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100">
                      {notifications.map(notification => {
                        const notifId = notification._id || notification.id;
                        const isRead = notification.isRead || notification.read;
                        const notifType = notification.type || 'info';
                        const title = notification.title || notification.message?.substring(0, 50) || 'Notification';
                        const message = notification.message || notification.body || '';
                        const timestamp = notification.createdAt || notification.timestamp || new Date().toISOString();

                        const getIcon = () => {
                          if (notifType === 'delivery' || notifType === 'order') return '📦';
                          if (notifType === 'payment' || notifType === 'earning') return '💰';
                          if (notifType === 'warning' || notifType === 'alert') return '⚠️';
                          if (notifType === 'success') return '✅';
                          if (notifType === 'user' || notifType === 'rider') return '👤';
                          if (notifType === 'verification' || notifType === 'kyc') return '🔐';
                          return '🔔';
                        };

                        const getBgColor = () => {
                          if (notifType === 'delivery' || notifType === 'order') return 'bg-blue-100';
                          if (notifType === 'payment' || notifType === 'earning') return 'bg-green-100';
                          if (notifType === 'warning' || notifType === 'alert') return 'bg-amber-100';
                          if (notifType === 'success') return 'bg-emerald-100';
                          if (notifType === 'user' || notifType === 'rider') return 'bg-purple-100';
                          if (notifType === 'verification' || notifType === 'kyc') return 'bg-indigo-100';
                          return 'bg-gray-100';
                        };

                        return (
                          <div
                            key={notifId}
                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!isRead ? 'bg-blue-50' : ''}`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isRead) {
                                handleMarkAsRead(notifId, e);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor()}`}>
                                <span className="text-lg">{getIcon()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <YummyText className="font-medium text-[#0F172A] text-sm">{title}</YummyText>
                                  {!isRead && (
                                    <div className="w-2 h-2 bg-[#00B75A] rounded-full flex-shrink-0 mt-1"></div>
                                  )}
                                </div>
                                <YummyText className="text-xs text-[#64748B] leading-relaxed line-clamp-2">{message}</YummyText>
                                <YummyText className="text-xs text-gray-400 mt-2">
                                  {new Date(timestamp).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </YummyText>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {hasMoreNotifications && (
                      <div className="p-3 border-t border-gray-100">
                        <button
                          onClick={loadMoreNotifications}
                          disabled={loadingNotifications}
                          className="w-full py-2 text-sm text-[#00B75A] hover:text-[#00a352] font-medium transition-colors disabled:opacity-50"
                        >
                          {loadingNotifications ? 'Loading...' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLayout;
