import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import SmartRideBooking from './Smartride-Booking';

// Ionic-compatible wrapper for Smart Ride Booking
const SmartRideBookingPage = () => {
    const ionRouter = useIonRouter();

    // Create a Next.js router-compatible object for the Smart Ride component
    const nextRouterShim = {
        push: (path) => ionRouter.push(path, 'forward', 'push'),
        back: () => ionRouter.goBack(),
        replace: (path) => ionRouter.push(path, 'root', 'replace'),
        pathname: window.location.pathname,
        query: {},
        asPath: window.location.pathname
    };

    return (
        <IonPage>
            <IonContent className="ion-padding">
                <SmartRideBookingWrapper router={nextRouterShim} />
            </IonContent>
        </IonPage>
    );
};

// Wrapper component that provides the router via context
const SmartRideBookingWrapper = ({ router }) => {
    // Mock Next.js router context
    React.useEffect(() => {
        // Inject mock router for Next.js useRouter hook
        if (typeof window !== 'undefined') {
            window.__NEXT_ROUTER__ = router;
        }
    }, [router]);

    return <SmartRideBooking />;
};

export default SmartRideBookingPage;
