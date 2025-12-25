import React from 'react';
import { Redirect } from 'react-router-dom';
import { getCookie, getJSONCookie } from '../../../utils/cookies';

const CustomerRouteGuard = ({ children }) => {
    const authToken = getCookie('auth_token');
    const userData = getJSONCookie('user_data');

    // Check if user is logged in and is a customer
    const isCustomer = authToken && userData?.role === 'customer';

    if (!isCustomer) {
        console.warn('[CustomerRouteGuard] Access denied - user is not logged in as customer');

        // Redirect to role select if no user data at all, otherwise to login
        if (!userData) {
            return <Redirect to="/auth/role-select" />;
        }

        return <Redirect to="/auth/customer/login" />;
    }

    return <>{children}</>;
};

export default CustomerRouteGuard;
