// Utility to get dashboard stats from real order data
// Used to sync dashboard stat cards with backend order data
import { getAllDeliveries } from '../utils/adminApi';

/**
 * Fetches all orders and computes stats
 * @returns {Promise<{ total: number }>} Stats
 */
export async function getOrderStatsFromOrders() {
    let page = 1;
    let total = 0;
    let hasMore = true;
    while (hasMore) {
        const response = await getAllDeliveries(page, 100);
        const deliveries = response?.data?.deliveries || response?.deliveries || [];
        total += deliveries.length;
        hasMore = deliveries.length === 100;
        page++;
    }
    return { total };
}
