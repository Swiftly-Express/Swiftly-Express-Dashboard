import { describe, it, expect } from 'vitest';
import { getNotificationRoute } from './notificationNavigation';

describe('getNotificationRoute', () => {
  it('returns customer dashboard for null/undefined notification', () => {
    expect(getNotificationRoute(null, 'customer')).toBe('/customer/dashboard');
    expect(getNotificationRoute(undefined, 'customer')).toBe('/customer/dashboard');
  });

  it('returns role dashboard for unknown type', () => {
    expect(getNotificationRoute({ type: 'unknown' }, 'customer')).toBe('/customer/dashboard');
    expect(getNotificationRoute({ type: 'unknown' }, 'rider')).toBe('/rider/dashboard');
    expect(getNotificationRoute({ type: 'unknown' }, 'admin')).toBe('/admin/dashboard');
  });

  it('delivery: customer with trackingId goes to track page', () => {
    expect(getNotificationRoute(
      { type: 'delivery', metadata: { trackingId: 'PKG-2401' } },
      'customer'
    )).toBe('/customer/track/PKG-2401');
    expect(getNotificationRoute(
      { type: 'delivery', metadata: { trackingNumber: 'PKG-2402' } },
      'customer'
    )).toBe('/customer/track/PKG-2402');
  });

  it('delivery: customer without trackingId goes to deliveries', () => {
    expect(getNotificationRoute({ type: 'delivery', metadata: {} }, 'customer')).toBe('/customer/deliveries');
  });

  it('delivery: rider goes to active or available', () => {
    expect(getNotificationRoute(
      { type: 'delivery', metadata: { trackingId: 'PKG-2401' } },
      'rider'
    )).toBe('/rider/active');
    expect(getNotificationRoute({ type: 'delivery', metadata: {} }, 'rider')).toBe('/rider/available');
  });

  it('delivery: admin goes to orders', () => {
    expect(getNotificationRoute({ type: 'delivery', metadata: {} }, 'admin')).toBe('/admin/orders');
  });

  it('payment: customer with trackingId goes to track page', () => {
    expect(getNotificationRoute(
      { type: 'payment', metadata: { trackingId: 'PKG-2401' } },
      'customer'
    )).toBe('/customer/track/PKG-2401');
  });

  it('payout: rider goes to earnings', () => {
    expect(getNotificationRoute({ type: 'payout', metadata: {} }, 'rider')).toBe('/rider/earnings');
  });

  it('payout: admin goes to payouts', () => {
    expect(getNotificationRoute({ type: 'payout', metadata: {} }, 'admin')).toBe('/admin/payouts');
  });

  it('verification: rider goes to profile', () => {
    expect(getNotificationRoute({ type: 'verification', metadata: {} }, 'rider')).toBe('/rider/profile');
  });

  it('verification: admin goes to kyc', () => {
    expect(getNotificationRoute({ type: 'verification', metadata: {} }, 'admin')).toBe('/admin/kyc');
  });

  it('system: uses role dashboard fallback', () => {
    expect(getNotificationRoute({ type: 'system', metadata: {} }, 'customer')).toBe('/customer/dashboard');
    expect(getNotificationRoute({ type: 'system', metadata: {} }, 'rider')).toBe('/rider/available');
    expect(getNotificationRoute({ type: 'system', metadata: {} }, 'admin')).toBe('/admin/dashboard');
  });

  it('respects metadata.routeHint when present', () => {
    expect(getNotificationRoute(
      { type: 'system', metadata: { routeHint: '/rider/earnings' } },
      'rider'
    )).toBe('/rider/earnings');
    expect(getNotificationRoute(
      { type: 'delivery', metadata: { routeHint: '/customer/profile' } },
      'customer'
    )).toBe('/customer/profile');
  });
});
