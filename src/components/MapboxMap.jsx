import React, { useRef, useEffect } from 'react';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGVlamhheSIsImEiOiJjbWh3bnpzMXgwMmFjMmxzaGFkZTdiaGtxIn0.KWRtVlfphniQvkfUSTlQZA';

const MapboxMap = ({ 
  pickupCoords = [3.3792, 6.5244],
  deliveryCoords = [3.45, 6.52],
  height = '300px',
  showRoute = true,
  animateDriver = false,
  showRandomCars = false,
  randomCarsCount = 4
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Set access token
    mapboxgl.accessToken = MAPBOX_TOKEN;

    if (!mapContainerRef.current) return;
    
    // Prevent multiple map initializations
    if (mapRef.current) return;

    // Initialize map with custom style
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/deejhay/cmi6pw8jy00g001s92xh88svw',
      center: pickupCoords,
      zoom: 12,
      attributionControl: false
    });

    mapRef.current = map;

    map.on('load', () => {
      console.log('Map loaded successfully');

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Pickup marker with pulsing animation
      const pickupEl = document.createElement('div');
      pickupEl.className = 'pickup-marker';
      pickupEl.style.cssText = `
        width: 16px;
        height: 16px;
        background: #00D68F;
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(0,214,143,0.8);
        border: 3px solid white;
      `;

      const pickupMarker = new mapboxgl.Marker(pickupEl)
        .setLngLat(pickupCoords)
        .addTo(map);
      
      markersRef.current.push(pickupMarker);

      // Delivery marker
      const deliveryEl = document.createElement('div');
      deliveryEl.className = 'delivery-marker';
      deliveryEl.style.cssText = `
        width: 16px;
        height: 16px;
        background: #FF9500;
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(255,149,0,0.8);
        border: 3px solid white;
      `;

      const deliveryMarker = new mapboxgl.Marker(deliveryEl)
        .setLngLat(deliveryCoords)
        .addTo(map);
      
      markersRef.current.push(deliveryMarker);

      // Fit bounds to show both markers
      const bounds = new mapboxgl.LngLatBounds()
        .extend(pickupCoords)
        .extend(deliveryCoords);

      map.fitBounds(bounds, {
        padding: 80,
        duration: 1000,
        maxZoom: 14
      });

      // Fetch and display route
      if (showRoute) {
        fetchAndDisplayRoute(map, deliveryCoords, pickupCoords);
      }

      // Show random cars
      if (showRandomCars) {
        spawnRandomCars(map, pickupCoords, randomCarsCount);
      }
    });

    map.on('error', (e) => {
      console.error('Mapbox error:', e);
    });

    // Cleanup function
    return () => {
      // Remove all markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Remove map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pickupCoords, deliveryCoords, showRoute, showRandomCars, randomCarsCount]);

  const fetchAndDisplayRoute = async (map, start, end) => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    try {
      const res = await axios.get(url);
      const data = res.data;

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry.coordinates;

        // Check if source already exists
        if (map.getSource('route')) {
          map.removeLayer('route-line');
          map.removeSource('route');
        }

        // Add route source
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { 
              type: 'LineString', 
              coordinates: route 
            },
          },
        });

        // Add route layer
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#00D68F',
            'line-width': 4,
            'line-opacity': 0.8
          },
        });

        // Calculate ETA
        const etaMin = Math.ceil(data.routes[0].duration / 60);
        console.log(`Driver ETA: ${etaMin} mins`);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const spawnRandomCars = (map, center, count) => {
    for (let i = 0; i < count; i++) {
      const lon = center[0] + (Math.random() * 0.4 - 0.2);
      const lat = center[1] + (Math.random() * 0.3 - 0.15);

      const el = document.createElement('div');
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background-image: url(/car-icon.png);
        background-size: contain;
        background-repeat: no-repeat;
      `;

      const marker = new mapboxgl.Marker(el) 
        .setLngLat([lon, lat])
        .addTo(map);
      
      markersRef.current.push(marker);
    }
  };

  return (
    <div 
      ref={mapContainerRef} 
      className="mapbox-container"
      style={{ 
        height, 
        width: '100%', 
        borderRadius: '12px', 
        overflow: 'hidden',
        position: 'relative',
        minHeight: height,
        display: 'block'
      }} 
    />
  );
};

export default MapboxMap;