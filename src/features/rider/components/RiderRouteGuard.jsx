import React from 'react';
import { Redirect } from 'react-router-dom';
import { getCookie, getJSONCookie } from '../../../utils/cookies';

const RiderRouteGuard = ({ children }) => {
  const authToken = getCookie('auth_token');
  const userData = getJSONCookie('user_data');
  
  // Check if user is logged in and is a rider
  const isRider = authToken && userData?.role === 'rider';
  
  if (!isRider) {
    console.warn('[RiderRouteGuard] Access denied - user is not logged in as rider');
    
    // Redirect to role select if no user data at all, otherwise to login
    if (!userData) {
      return <Redirect to="/auth/role-select" />;
    }
    
    return <Redirect to="/auth/rider/login" />;
  }
  
  return <>{children}</>;
};

export default RiderRouteGuard;
