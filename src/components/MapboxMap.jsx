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
  animateVehicle = true,
  vehicleCoords = null,
  packageId = null,
  showRandomCars = false,
  randomCarsCount = 4
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ pickup: null, delivery: null, vehicle: null, others: [] });
  const vehiclePosRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/deejhay/cmi6pw8jy00g001s92xh88svw',
      center: pickupCoords,
      zoom: 12,
      attributionControl: false
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Create labeled pickup marker
      const pickupEl = document.createElement('div');
      pickupEl.style.cssText = `display:flex;align-items:center;gap:8px;`;
      const pickupDot = document.createElement('div');
      pickupDot.style.cssText = `width:14px;height:14px;background:#00D68F;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,214,143,0.6)`;
      const pickupLabel = document.createElement('div');
      pickupLabel.style.cssText = `padding:4px 8px;background:rgba(0,214,143,0.95);color:white;border-radius:12px;font-size:12px;font-weight:600`;
      pickupLabel.innerText = 'Pickup';
      pickupEl.appendChild(pickupDot);
      pickupEl.appendChild(pickupLabel);

      const pickupMarker = new mapboxgl.Marker(pickupEl)
        .setLngLat(pickupCoords)
        .addTo(map);
      markersRef.current.pickup = pickupMarker;

      // Create labeled delivery marker
      const deliveryEl = document.createElement('div');
      deliveryEl.style.cssText = `display:flex;align-items:center;gap:8px;`;
      const deliveryDot = document.createElement('div');
      deliveryDot.style.cssText = `width:14px;height:14px;background:#FF9500;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(255,149,0,0.6)`;
      const deliveryLabel = document.createElement('div');
      deliveryLabel.style.cssText = `padding:4px 8px;background:rgba(255,149,0,0.95);color:white;border-radius:12px;font-size:12px;font-weight:600`;
      deliveryLabel.innerText = 'Delivery';
      deliveryEl.appendChild(deliveryDot);
      deliveryEl.appendChild(deliveryLabel);

      const deliveryMarker = new mapboxgl.Marker(deliveryEl)
        .setLngLat(deliveryCoords)
        .addTo(map);
      markersRef.current.delivery = deliveryMarker;

      // Vehicles source/layer (for car icons + labels) to avoid DOM marker clustering
      // create the source immediately so we can update vehicle positions even before the icon loads
      if (!map.getSource('vehicles')) {
        map.addSource('vehicles', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }
      // load car image and add as an icon
      try {
        map.loadImage('/car-icon.png', (err, img) => {
          if (!err && img) {
            if (!map.hasImage('car-icon')) map.addImage('car-icon', img);

            if (!map.getLayer('vehicles-icons')) {
              map.addLayer({
                id: 'vehicles-icons',
                type: 'symbol',
                source: 'vehicles',
                layout: {
                  'icon-image': 'car-icon',
                  'icon-size': 0.6,
                  'icon-allow-overlap': true,
                  'icon-ignore-placement': true,
                  'text-field': ['coalesce', ['get', 'label'], ['get', 'packageId']],
                  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                  'text-size': 12,
                  'text-offset': [0, 1.2],
                  'text-anchor': 'top',
                  'text-allow-overlap': false,
                  'text-ignore-placement': false
                },
                paint: {
                  'text-color': '#000000',
                  'text-halo-color': 'rgba(255,255,255,0.9)',
                  'text-halo-width': 2
                }
              });
            }
          }
        });
      } catch (e) {
        console.warn('Vehicle icon load failed', e);
      }

      // Fit bounds to show markers
      try {
        const bounds = new mapboxgl.LngLatBounds()
          .extend(pickupCoords)
          .extend(deliveryCoords);
        map.fitBounds(bounds, { padding: 80, duration: 1000, maxZoom: 14 });
      } catch (e) {
        console.warn('Failed to fit bounds', e);
      }

      if (showRoute) {
        fetchAndDisplayRoute(map, pickupCoords, deliveryCoords);
      }

      if (showRandomCars) spawnRandomCars(map, pickupCoords, randomCarsCount);
    });

    map.on('error', (e) => console.error('Mapbox error:', e));

    return () => {
      // cleanup RAF
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // remove markers
      try {
        markersRef.current.pickup?.remove();
        markersRef.current.delivery?.remove();
        markersRef.current.vehicle?.remove();
        (markersRef.current.others || []).forEach(m => m.remove());
      } catch (e) { }
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    // update pickup/delivery positions when props change
    try {
      if (mapRef.current) {
        markersRef.current.pickup?.setLngLat(pickupCoords);
        markersRef.current.delivery?.setLngLat(deliveryCoords);
        // refit bounds lightly
        const bounds = new mapboxgl.LngLatBounds().extend(pickupCoords).extend(deliveryCoords);
        mapRef.current.fitBounds(bounds, { padding: 80, duration: 800, maxZoom: 14 });
      }
    } catch (e) { console.warn(e); }
  }, [pickupCoords, deliveryCoords]);

  // Helper: update vehicle feature in vehicles source
  const setVehicleFeature = (id, lngLat, label) => {
    try {
      const map = mapRef.current;
      if (!map || !map.getSource || !map.getSource('vehicles')) return;
      const src = map.getSource('vehicles');
      const data = src._data || (typeof src.getData === 'function' ? src.getData() : null) || src._options?.data;
      const fc = (data && data.type === 'FeatureCollection') ? data : { type: 'FeatureCollection', features: [] };

      // find existing feature
      const idx = fc.features.findIndex(f => (f.properties && (f.properties.packageId === id || f.id === id)));
      const feat = {
        type: 'Feature',
        id: id,
        properties: { packageId: id, label: label || id },
        geometry: { type: 'Point', coordinates: [lngLat[0], lngLat[1]] }
      };
      if (idx >= 0) fc.features[idx] = feat; else fc.features.push(feat);

      // set data back on source
      try {
        map.getSource('vehicles').setData(fc);
      } catch (e) {
        // fallback for older mapbox versions
        try { map.removeSource('vehicles'); } catch (er) { }
        map.addSource('vehicles', { type: 'geojson', data: fc });
      }
    } catch (e) {
      console.warn('setVehicleFeature failed', e);
    }
  };

  // Helper: smooth move vehicle by interpolating and updating source
  const moveVehicleTo = (id, lngLat, label) => {
    try {
      const map = mapRef.current;
      if (!map) return;
      // previous position
      const src = map.getSource('vehicles');
      let from = null;
      if (src && src._data && src._data.features) {
        const f = src._data.features.find(f => f.id === id || (f.properties && f.properties.packageId === id));
        if (f) from = f.geometry.coordinates;
      }
      const to = [lngLat[0], lngLat[1]];
      const startTime = performance.now();
      const duration = 600;
      let canceled = false;
      const step = (now) => {
        const t = Math.min((now - startTime) / duration, 1);
        let cur;
        if (!from) cur = to; else cur = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
        setVehicleFeature(id, cur, label);
        if (t < 1 && !canceled) rafRef.current = requestAnimationFrame(step);
      };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(step);
    } catch (e) { console.warn('moveVehicleTo failed', e); }
  };

  // Listen for rider position events if animateVehicle and no direct prop
  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      // support various detail shapes: {lat,lng}, {coords:{lat,lng}}, {deliveryId, lat, lng}
      let lat, lng, id;
      if (detail.coords) { lat = detail.coords.lat; lng = detail.coords.lng; }
      if (detail.lat && detail.lng) { lat = detail.lat; lng = detail.lng; }
      id = detail.deliveryId || detail.trackingNumber || detail.packageId;
      if (packageId && id && packageId !== id) return; // ignore other packages
      if (typeof lat === 'number' && typeof lng === 'number') {
        moveVehicleTo(id || packageId || 'vehicle', [lng, lat], id || packageId || 'vehicle');
      }
    };

    if (animateVehicle && !vehicleCoords) {
      window.addEventListener('rider:position', handler);
    }

    return () => {
      window.removeEventListener('rider:position', handler);
    };
  }, [animateVehicle, vehicleCoords, packageId]);

  // If vehicleCoords prop provided, animate towards it
  useEffect(() => {
    if (!vehicleCoords) return;
    let lnglat = null;
    if (Array.isArray(vehicleCoords) && vehicleCoords.length >= 2) lnglat = vehicleCoords;
    else if (vehicleCoords.lng && vehicleCoords.lat) lnglat = [vehicleCoords.lng, vehicleCoords.lat];
    if (lnglat) moveVehicleTo(packageId || 'vehicle', lnglat, packageId || 'vehicle');
  }, [vehicleCoords]);

  const fetchAndDisplayRoute = async (map, start, end) => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    try {
      const res = await axios.get(url);
      const data = res.data;

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry.coordinates;

        if (map.getSource('route')) {
          try { map.removeLayer('route-line'); } catch (e) { }
          try { map.removeSource('route'); } catch (e) { }
        }

        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: route },
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#00D68F', 'line-width': 4, 'line-opacity': 0.8 },
        });

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
      el.style.cssText = `width:24px;height:24px;background-image:url(/car-icon.png);background-size:contain;background-repeat:no-repeat;`;
      const marker = new mapboxgl.Marker(el).setLngLat([lon, lat]).addTo(map);
      markersRef.current.others.push(marker);
    }
  };

  return (
    <div
      ref={mapContainerRef}
      className="mapbox-container"
      style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', position: 'relative', minHeight: height, display: 'block' }}
    />
  );
};

export default MapboxMap;