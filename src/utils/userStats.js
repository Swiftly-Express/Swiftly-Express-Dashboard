// Utility to get dashboard stats from real user data
// Used to sync dashboard stat cards with ManageRiders page logic
import { getAllUsers } from '../utils/adminApi';

/**
 * Fetches all users and computes stats
 * @returns {Promise<{ total: number }>} Stats
 */
export async function getUserStatsFromUsers() {
    let page = 1;
    let total = 0;
    let hasMore = true;
    while (hasMore) {
        const response = await getAllUsers(page, 100);
        const users = response?.data?.users || response?.users || [];
        total += users.length;
        hasMore = users.length === 100;
        page++;
    }
    return { total };
}
