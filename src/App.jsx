import React from "react";
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router-dom";
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utilities */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "./theme/variable.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { DeliveryProvider } from "./contexts/DeliveryContext";

/* Public pages have been archived and removed from active routes */

/* Auth pages */
import RoleSelect from "./features/auth/pages/RoleSelect";
import CustomerLogin from "./features/auth/pages/CustomerLogin";
import CustomerSignUp from "./features/auth/pages/CustomerSignUp";
import RiderLogin from "./features/auth/pages/RiderLogin";
import RiderSignUp from "./features/auth/pages/RiderSignUp";
import VerifyEmail from "./features/auth/pages/VerifyEmail";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import AdminLogin from "./features/auth/pages/AdminLogin";
import AuthCallback from "./features/auth/pages/AuthCallback";

/* Customer Dashboard pages */
import CustomerDashboard from "./features/customer/pages/Dashboard";
import Track from "./features/customer/pages/Track";
import MyDeliveries from "./features/customer/pages/MyDeliveries";
import Book from "./features/customer/pages/Book";
import CustomerProfile from "./features/customer/pages/CustomerProfile";
import CustomerSupport from "./features/customer/pages/CustomerSupport";

/* Rider Dashboard pages */
import RiderDashboard from "./features/rider/pages/Dashboard";
import AvailableOrders from "./features/rider/pages/AvailableOrders";
import ActiveDeliveries from "./features/rider/pages/ActiveDeliveries";
import Earnings from "./features/rider/pages/Earnings";
import Profile from "./features/rider/pages/Profile";
import Support from "./features/rider/pages/Support";
// import VerifyAccount from "./features/rider/pages/VerifyAccount";

/* Admin Dashboard pages */
import AdminDashboard from "./features/admin/pages/Dashboard";
import ManageUsers from "./features/admin/pages/ManageUsers";
import ManageRiders from "./features/admin/pages/ManageRiders";
import ManageOrders from "./features/admin/pages/ManageOrders";
import KYCApprovals from "./features/admin/pages/KYCApprovals";
import Analytics from "./features/admin/pages/Analytics";
import Settings from "./features/admin/pages/Settings";
import AdminRouteGuard from "./features/admin/components/AdminRouteGuard";
import CustomerRouteGuard from "./features/customer/components/CustomerRouteGuard";
import RiderRouteGuard from "./features/rider/components/RiderRouteGuard";

console.log('[App] About to initialize Ionic React...');
console.log('[App] React available:', typeof React !== 'undefined');
console.log('[App] window.React available:', typeof window !== 'undefined' && typeof window.React !== 'undefined');

try {
  setupIonicReact();
  console.log('[App] ✅ Ionic React initialized successfully');
} catch (error) {
  console.error('[App] ❌ Failed to initialize Ionic React:', error);
  throw error;
}

const App = () => {
  console.log('[App] App component rendering...');
  return (
    <DeliveryProvider>
      <IonApp>
        <IonReactRouter>
          <ErrorBoundary>
            <IonRouterOutlet>

              {/* Auth Routes */}
              <Route exact path="/auth/role-select">
                <RoleSelect />
              </Route>

              {/* Customer Auth */}
              <Route exact path="/auth/customer/login">
                <CustomerLogin />
              </Route>
              <Route exact path="/auth/customer/signup">
                <CustomerSignUp />
              </Route>

              {/* OAuth callback (Google) */}
              <Route exact path="/auth/callback">
                <AuthCallback />
              </Route>

              {/* Rider Auth */}
              <Route exact path="/auth/rider/login">
                <RiderLogin />
              </Route>
              <Route exact path="/auth/rider/signup">
                <RiderSignUp />
              </Route>

              {/* Email Verification */}
              <Route exact path="/auth/verify-email">
                <VerifyEmail />
              </Route>

              {/* Admin Auth */}
              <Route exact path="/auth/admin/login">
                <AdminLogin />
              </Route>
              <Route exact path="/admin/login">
                <AdminLogin />
              </Route>

              {/* Protected Dashboard Routes - Customer */}
              <Route exact path="/customer/dashboard">
                <CustomerRouteGuard>
                  <CustomerDashboard />
                </CustomerRouteGuard>
              </Route>
              <Route exact path="/customer/track">
                <CustomerRouteGuard>
                  <Track />
                </CustomerRouteGuard>
              </Route>
              <Route exact path="/customer/deliveries">
                <CustomerRouteGuard>
                  <MyDeliveries />
                </CustomerRouteGuard>
              </Route>
              <Route exact path="/customer/book">
                <CustomerRouteGuard>
                  <Book />
                </CustomerRouteGuard>
              </Route>
              <Route exact path="/customer/profile">
                <CustomerRouteGuard>
                  <CustomerProfile />
                </CustomerRouteGuard>
              </Route>
              <Route exact path="/customer/support">
                <CustomerRouteGuard>
                  <CustomerSupport />
                </CustomerRouteGuard>
              </Route>

              {/* Protected Dashboard Routes - Rider */}
              <Route exact path="/rider/dashboard">
                <RiderRouteGuard>
                  <RiderDashboard />
                </RiderRouteGuard>
              </Route>
              {/* <Route exact path="/rider/verify-account">
          <VerifyAccount />
        </Route> */}
              <Route exact path="/rider/available">
                <RiderRouteGuard>
                  <AvailableOrders />
                </RiderRouteGuard>
              </Route>
              <Route exact path="/rider/active">
                <RiderRouteGuard>
                  <ActiveDeliveries />
                </RiderRouteGuard>
              </Route>
              <Route exact path="/rider/earnings">
                <RiderRouteGuard>
                  <Earnings />
                </RiderRouteGuard>
              </Route>
              <Route exact path="/rider/profile">
                <RiderRouteGuard>
                  <Profile />
                </RiderRouteGuard>
              </Route>
              <Route exact path="/rider/support">
                <RiderRouteGuard>
                  <Support />
                </RiderRouteGuard>
              </Route>

              {/* Protected Dashboard Routes - Admin */}
              <Route exact path="/admin/dashboard">
                <AdminRouteGuard>
                  <AdminDashboard />
                </AdminRouteGuard>
              </Route>
              <Route exact path="/admin/users">
                <AdminRouteGuard>
                  <ManageUsers />
                </AdminRouteGuard>
              </Route>
              <Route exact path="/admin/riders">
                <AdminRouteGuard>
                  <ManageRiders />
                </AdminRouteGuard>
              </Route>
              <Route exact path="/admin/orders">
                <AdminRouteGuard>
                  <ManageOrders />
                </AdminRouteGuard>
              </Route>
              <Route exact path="/admin/kyc">
                <AdminRouteGuard>
                  <KYCApprovals />
                </AdminRouteGuard>
              </Route>
              <Route exact path="/admin/analytics">
                <AdminRouteGuard>
                  <Analytics />
                </AdminRouteGuard>
              </Route>
              <Route exact path="/admin/settings">
                <AdminRouteGuard>
                  <Settings />
                </AdminRouteGuard>
              </Route>

              {/* Public page routes removed — archived */}
              <Route exact path="/forgot-password">
                <ForgotPassword />
              </Route>

              <Route exact path="/">
                <Redirect to="/auth/role-select" />
              </Route>
            </IonRouterOutlet>
          </ErrorBoundary>
        </IonReactRouter>
      </IonApp>
    </DeliveryProvider>
  );
};

export default App;