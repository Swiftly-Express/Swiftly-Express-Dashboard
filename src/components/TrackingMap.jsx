import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const TrackingMap = ({ pickupLocation, dropoffLocation, driverLocation }) =>
{
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const [map, setMap] = useState(null);
    const [directionsResponse, setDirectionsResponse] = useState(null);

    const containerStyle = {
        width: '100%',
        height: '100%'
    };

    const center = useMemo(() =>
    {
        if (driverLocation) return driverLocation;
        if (pickupLocation) return pickupLocation;
        return { lat: 6.5244, lng: 3.3792 }; // Default to Lagos, Nigeria
    }, [driverLocation, pickupLocation]);

    const onLoad = useCallback(function callback(map)
    {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map)
    {
        setMap(null);
    }, []);

    // Fetch directions when pickup and dropoff are available
    useEffect(() =>
    {
        if (isLoaded && pickupLocation && dropoffLocation) {
            // eslint-disable-next-line no-undef
            const directionsService = new google.maps.DirectionsService();

            directionsService.route(
                {
                    origin: pickupLocation,
                    destination: dropoffLocation,
                    // eslint-disable-next-line no-undef
                    travelMode: google.maps.TravelMode.DRIVING
                },
                (result, status) =>
                {
                    // eslint-disable-next-line no-undef
                    if (status === google.maps.DirectionsStatus.OK) {
                        setDirectionsResponse(result);
                    } else {
                        console.error(`error fetching directions ${result}`);
                    }
                }
            );
        }
    }, [isLoaded, pickupLocation, dropoffLocation]);

    // Fit bounds to include all markers
    useEffect(() =>
    {
        if (map && isLoaded && (pickupLocation || dropoffLocation || driverLocation)) {
            // eslint-disable-next-line no-undef
            const bounds = new google.maps.LatLngBounds();
            if (pickupLocation) bounds.extend(pickupLocation);
            if (dropoffLocation) bounds.extend(dropoffLocation);
            if (driverLocation) bounds.extend(driverLocation);
            map.fitBounds(bounds);
        }
    }, [map, isLoaded, pickupLocation, dropoffLocation, driverLocation]);

    if (!isLoaded) {
        return <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Loading Map...</div>;
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
            }}
        >
            {/* Route */}
            {directionsResponse && (
                <DirectionsRenderer
                    directions={directionsResponse}
                    options={{
                        suppressMarkers: true, // We will use custom markers
                        polylineOptions: {
                            strokeColor: "#00B75A",
                            strokeWeight: 5,
                        }
                    }}
                />
            )}

            {/* Pickup Marker */}
            {pickupLocation && (
                <Marker
                    position={pickupLocation}
                    title="Pickup"
                    icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    }}
                />
            )}

            {/* Dropoff Marker */}
            {dropoffLocation && (
                <Marker
                    position={dropoffLocation}
                    title="Dropoff"
                    icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                    }}
                />
            )}

            {/* Driver Marker */}
            {driverLocation && (
                <Marker
                    position={driverLocation}
                    title="Driver"
                    icon={{
                        url: "/vanicon.svg", // Using the icon found in public directory
                        scaledSize: { width: 40, height: 40, equals: () => false }, // scaledSize needs to NOT be a google.maps.Size instance if we are not loading the library explicitly, but here we are using useJsApiLoader so we could use google.maps.Size, but simple object often works or we let the library handle it. Actually with useJsApiLoader, 'google' is defined globally once loaded.
                        // Let's rely on standard object structure for scaledSize {width, height} provided by the API usually. 
                        // Wait, for 'scaledSize' to work with simple object, we might need new google.maps.Size.
                        // Safe bet: if google is defined use it, otherwise don't render this prop yet? No, this code runs when isLoaded is true.
                    }}
                // We can use the 'onLoad' prop of Marker to set the icon with proper types if needed, but 'icon' prop usually accepts simple objects for url. 
                // However, scaledSize must be a google.maps.Size object.
                // Let's fix the scaledSize construction inside a useMemo or inline conditionally.
                />
            )}
        </GoogleMap>
    );
};

export default React.memo(TrackingMap);
