import React from 'react';
import { Redirect } from 'react-router-dom';
import { getCookie, getJSONCookie } from '../../../utils/cookies';

const AdminRouteGuard = ({ children }) => {
  const adminToken = getCookie('admin_token');
  const authToken = getCookie('auth_token');
  const userData = getJSONCookie('user_data');
  
  // Check if user is logged in as admin
  const isAdmin = adminToken || (authToken && userData?.role === 'admin');
  
  if (!isAdmin) {
    console.warn('[AdminRouteGuard] Access denied - not an admin');
    return <Redirect to="/auth/role-select" />;
  }
  
  return <>{children}</>;
};

export default AdminRouteGuard;
