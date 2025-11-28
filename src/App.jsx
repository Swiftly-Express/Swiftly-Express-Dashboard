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

setupIonicReact();

const App = () => (
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

        {/* Protected Dashboard Routes - Customer */}
        <Route exact path="/customer/dashboard">
          <CustomerDashboard />
        </Route>
        <Route exact path="/customer/track">
          <Track />
        </Route>
        <Route exact path="/customer/deliveries">
          <MyDeliveries />
        </Route>
        <Route exact path="/customer/book">
          <Book />
        </Route>
        <Route exact path="/customer/profile">
          <CustomerProfile />
        </Route>
        <Route exact path="/customer/support">
          <CustomerSupport />
        </Route>
        
        {/* Protected Dashboard Routes - Rider */}
        <Route exact path="/rider/dashboard">
          <RiderDashboard />
        </Route>
        {/* <Route exact path="/rider/verify-account">
          <VerifyAccount />
        </Route> */}
        <Route exact path="/rider/available">
          <AvailableOrders />
        </Route>
        <Route exact path="/rider/active">
          <ActiveDeliveries />
        </Route>
        <Route exact path="/rider/earnings">
          <Earnings />
        </Route>
        <Route exact path="/rider/profile">
          <Profile />
        </Route>
        <Route exact path="/rider/support">
          <Support />
        </Route>

        {/* Protected Dashboard Routes - Admin */}
        <Route exact path="/admin/dashboard">
          <AdminDashboard />
        </Route>

        {/* Public page routes removed — archived */}
        <Route exact path="/forgot-password">
          <ForgotPassword />
        </Route>

        <Route exact path="/">
          <Redirect to="/customer/dashboard" />
        </Route>
        </IonRouterOutlet>
      </ErrorBoundary>
    </IonReactRouter>
  </IonApp>
  </DeliveryProvider>
);

export default App;