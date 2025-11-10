import React from "react";
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router-dom";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utilities */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Global styles with brand colors */
import "./theme/variable.css";

/* App pages */
import Home from "./pages/Home";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";
import SmartRide from "./pages/SmartRide";

/* Auth pages */
import RoleSelect from "./pages/auth/RoleSelect";
import CustomerLogin from "./pages/auth/CustomerLogin";
import CustomerSignUp from "./pages/auth/CustomerSignUp";
import RiderLogin from "./pages/auth/RiderLogin";
import RiderSignUp from "./pages/auth/RiderSignUp";

/* Dashboard pages */
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";
import RiderDashboard from "./pages/dashboard/RiderDashboard";

setupIonicReact();

const App = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Public Routes */}
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

        {/* Protected Dashboard Routes */}
        <Route exact path="/customer/dashboard">
          <CustomerDashboard />
        </Route>
        <Route exact path="/rider/dashboard">
          <RiderDashboard />
        </Route>

        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;