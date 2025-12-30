// Utility to get dashboard stats from real rider data
// Used to sync dashboard stat cards with ManageRiders page
import { getApprovedRiders } from '../utils/adminApi';

/**
 * Fetches all approved riders and computes stats
 * @returns {Promise<{ total: number, active: number, inactive: number, suspended: number, pendingKyc: number }>} Stats
 */
export async function getRiderStatsFromRiders() {
    const response = await getApprovedRiders(1, 1000); // fetch all
    const drivers = response?.data?.drivers || [];
    let total = 0, active = 0, inactive = 0, suspended = 0, pendingKyc = 0;
    for (const rider of drivers) {
        total++;
        const status = (rider.isSuspended || rider.suspended || rider.status === 'suspended') ? 'Suspended'
            : (typeof rider.isActive === 'boolean' ? (rider.isActive ? 'Active' : 'Inactive')
                : (typeof rider.active === 'boolean' ? (rider.active ? 'Active' : 'Inactive')
                    : (rider.status === 'active' ? 'Active' : 'Inactive')));
        if (status === 'Active') active++;
        else if (status === 'Inactive') inactive++;
        else if (status === 'Suspended') suspended++;
        const kyc = rider.verificationStatus || 'pending';
        if (kyc !== 'approved' && kyc !== 'verified') pendingKyc++;
    }
    return { total, active, inactive, suspended, pendingKyc };
}
