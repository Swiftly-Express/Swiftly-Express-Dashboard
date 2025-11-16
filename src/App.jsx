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

/* App pages */
import Home from "./pages/Home";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";
import SmartRide from "./pages/SmartRide";

/* Additional pages */
import About from "./pages/About";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import TrackPackage from "./pages/TrackPackage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import ForgotPassword from "./pages/auth/ForgotPassword";

/* Auth pages */
import RoleSelect from "./pages/auth/RoleSelect";
import CustomerLogin from "./pages/auth/CustomerLogin";
import CustomerSignUp from "./pages/auth/CustomerSignUp";
import RiderLogin from "./pages/auth/RiderLogin";
import RiderSignUp from "./pages/auth/RiderSignUp";

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

/* Admin Dashboard pages */
import AdminDashboard from "./features/admin/pages/Dashboard";

setupIonicReact();

const App = () => (
  <IonApp>
    <IonReactRouter>
      <ErrorBoundary>
        <IonRouterOutlet>
          <Route exact path="/home">
            <Home />
          </Route>
        <Route exact path="/services">
          <Services />
        </Route>
        <Route exact path="/how-it-works">
          <HowItWorks />
        </Route>
        <Route exact path="/smart-ride">
          <SmartRide />
        </Route>
        <Route exact path="/contact">
          <Contact />
        </Route>

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

        {/* Additional Routes */}
        <Route exact path="/about">
          <About />
        </Route>
        <Route exact path="/blog">
          <Blog />
        </Route>
        <Route exact path="/careers">
          <Careers />
        </Route>
        <Route exact path="/track-package">
          <TrackPackage />
        </Route>
        <Route exact path="/privacy-policy">
          <PrivacyPolicy />
        </Route>
        <Route exact path="/terms-of-service">
          <TermsOfService />
        </Route>
        <Route exact path="/cookie-policy">
          <CookiePolicy />
        </Route>
        <Route exact path="/forgot-password">
          <ForgotPassword />
        </Route>

        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
        </IonRouterOutlet>
      </ErrorBoundary>
    </IonReactRouter>
  </IonApp>
);

export default App;