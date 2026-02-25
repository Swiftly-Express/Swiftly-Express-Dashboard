/**
 * Resolves the target route when a notification is clicked (deep link).
 * Uses notification.type and metadata (trackingId, trackingNumber, routeHint, thread) to determine destination.
 * @param {{ type: string; metadata?: { trackingId?: string; trackingNumber?: string; routeHint?: string; thread?: string } }} notification
 * @param {'customer'|'rider'|'admin'} role
 * @returns {string} Route path to navigate to
 */
export function getNotificationRoute(notification, role) {
  if (!notification) return getDashboardForRole(role);
  const meta = notification.metadata || {};
  const trackingId = meta.trackingId || meta.trackingNumber;
  const routeHint = meta.routeHint;

  if (routeHint && typeof routeHint === 'string' && routeHint.startsWith('/')) {
    return routeHint;
  }

  switch (notification.type) {
    case 'delivery':
      if (role === 'customer') {
        return trackingId ? `/customer/track/${encodeURIComponent(trackingId)}` : '/customer/deliveries';
      }
      if (role === 'rider') {
        return trackingId ? `/rider/active` : '/rider/available';
      }
      if (role === 'admin') {
        return '/admin/orders';
      }
      break;
    case 'payment':
      if (role === 'customer') {
        return trackingId ? `/customer/track/${encodeURIComponent(trackingId)}` : '/customer/deliveries';
      }
      if (role === 'rider') {
        return '/rider/earnings';
      }
      if (role === 'admin') {
        return '/admin/orders';
      }
      break;
    case 'payout':
      if (role === 'rider') return '/rider/earnings';
      if (role === 'admin') return '/admin/payouts';
      break;
    case 'rating':
      if (role === 'rider') {
        return trackingId ? `/rider/active` : '/rider/earnings';
      }
      if (role === 'admin') return '/admin/orders';
      break;
    case 'verification':
      if (role === 'rider') return '/rider/profile';
      if (role === 'admin') return '/admin/kyc';
      break;
    case 'system':
      if (role === 'rider') return '/rider/available';
      if (role === 'admin') return '/admin/dashboard';
      if (role === 'customer') return '/customer/dashboard';
      break;
    default:
      break;
  }

  return getDashboardForRole(role);
}

function getDashboardForRole(role) {
  switch (role) {
    case 'customer': return '/customer/dashboard';
    case 'rider': return '/rider/dashboard';
    case 'admin': return '/admin/dashboard';
    default: return '/';
  }
}
