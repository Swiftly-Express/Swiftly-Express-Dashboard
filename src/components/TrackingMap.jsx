import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const normalizeCoords = (coords) =>
{
    if (!coords) return null;
    // Check if it's an array [lng, lat] (GeoJSON/Mapbox format)
    if (Array.isArray(coords)) {
        if (coords.length >= 2 && typeof coords[0] === 'number') {
            return { lat: coords[1], lng: coords[0] };
        }
        return null; // Invalid array
    }
    // Check if it's an object {lat, lng} or {latitude, longitude}
    if (typeof coords === 'object') {
        if (coords.lat !== undefined && coords.lng !== undefined) {
            return { lat: Number(coords.lat), lng: Number(coords.lng) };
        }
        if (coords.latitude !== undefined && coords.longitude !== undefined) {
            return { lat: Number(coords.latitude), lng: Number(coords.longitude) };
        }
    }
    return null;
};

const TrackingMap = ({ pickupLocation, dropoffLocation, driverLocation }) =>
{
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const [map, setMap] = useState(null);
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [directionsError, setDirectionsError] = useState(false);

    // Normalize coordinates
    const pickup = useMemo(() => normalizeCoords(pickupLocation), [pickupLocation]);
    const dropoff = useMemo(() => normalizeCoords(dropoffLocation), [dropoffLocation]);
    const driver = useMemo(() => normalizeCoords(driverLocation), [driverLocation]);

    const containerStyle = {
        width: '100%',
        height: '100%'
    };

    const center = useMemo(() =>
    {
        if (driver) return driver;
        if (pickup) return pickup;
        if (dropoff) return dropoff;
        return { lat: 6.5244, lng: 3.3792 }; // Default to Lagos, Nigeria
    }, [driver, pickup, dropoff]);

    const onLoad = useCallback((mapInstance) =>
    {
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(() =>
    {
        setMap(null);
    }, []);

    // Fetch directions
    useEffect(() =>
    {
        if (isLoaded && pickup && dropoff && !directionsError) { // Retry if error state resets? No, just fetch once valid
            // eslint-disable-next-line no-undef
            const directionsService = new google.maps.DirectionsService();

            directionsService.route(
                {
                    origin: pickup,
                    destination: dropoff,
                    // eslint-disable-next-line no-undef
                    travelMode: google.maps.TravelMode.DRIVING
                },
                (result, status) =>
                {
                    // eslint-disable-next-line no-undef
                    if (status === google.maps.DirectionsStatus.OK) {
                        setDirectionsResponse(result);
                        setDirectionsError(false);
                    } else {
                        console.error(`Google Maps Directions Error: ${status}`);
                        setDirectionsError(true);
                    }
                }
            );
        }
    }, [isLoaded, pickup, dropoff]);

    // Fit bounds
    useEffect(() =>
    {
        if (map && isLoaded && (pickup || dropoff || driver)) {
            // eslint-disable-next-line no-undef
            const bounds = new google.maps.LatLngBounds();
            if (pickup) bounds.extend(pickup);
            if (dropoff) bounds.extend(dropoff);
            if (driver) bounds.extend(driver);
            map.fitBounds(bounds);
        }
    }, [map, isLoaded, pickup, dropoff, driver]);

    if (loadError) {
        return <div className="h-full w-full flex items-center justify-center bg-red-50 text-red-500">Error loading map</div>;
    }

    if (!isLoaded) {
        return <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Loading Map...</div>;
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
                        suppressMarkers: true,
                        polylineOptions: {
                            strokeColor: "#00B75A",
                            strokeWeight: 5,
                        }
                    }}
                />
            )}

            {/* Pickup Marker */}
            {pickup && (
                <Marker
                    position={pickup}
                    title="Pickup"
                    icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    }}
                />
            )}

            {/* Dropoff Marker */}
            {dropoff && (
                <Marker
                    position={dropoff}
                    title="Dropoff"
                    icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                    }}
                />
            )}

            {/* Driver Marker */}
            {driver && (
                <Marker
                    position={driver}
                    title="Driver"
                    icon={{
                        url: "/vanicon.svg",
                        scaledSize: new google.maps.Size(40, 40)
                    }}
                    zIndex={100} // Ensure driver is on top
                />
            )}
        </GoogleMap>
    );
};

export default React.memo(TrackingMap);
