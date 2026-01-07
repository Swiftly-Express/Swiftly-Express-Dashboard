import React, { useRef, useEffect, useState, useCallback } from 'react';

const GoogleMapsAutocomplete = ({
    value,
    onChange,
    placeholder = "Enter Location...",
    className = "",
    onPlaceSelect
}) => {
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const [predictions, setPredictions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Check if Google Maps is loaded
    useEffect(() => {
        const checkGoogleMaps = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                setIsLoaded(true);
            } else {
                setTimeout(checkGoogleMaps, 100);
            }
        };
        checkGoogleMaps();
    }, []);

    // Debounce utility function
    function debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (!isLoaded || !query.trim()) {
                setPredictions([]);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                // Using the new AutocompleteSuggestion API
                const { AutocompleteSuggestion } = await window.google.maps.importLibrary("places");

                const request = {
                    input: query,
                    includedRegionCodes: ["NG"], // Restrict to Nigeria
                };

                const suggestions = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

                if (suggestions.suggestions) {
                    const formattedPredictions = suggestions.suggestions
                        .slice(0, 5)
                        .map((suggestion) => ({
                            place_id: suggestion.placePrediction.placeId,
                            description: suggestion.placePrediction.text.text,
                            lat: undefined,
                            lng: undefined,
                        }));

                    setPredictions(formattedPredictions);
                    setIsOpen(true);
                } else {
                    setPredictions([]);
                }
            } catch (error) {
                console.error("Error fetching place predictions:", error);
                setPredictions([]);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        [isLoaded]
    );

    useEffect(() => {
        debouncedSearch(value);
    }, [value, debouncedSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !inputRef?.current?.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = async (prediction) => {
        setIsOpen(false);

        if (onPlaceSelect && isLoaded) {
            try {
                // Use Geocoder to get detailed address components
                const geocoder = new window.google.maps.Geocoder();

                const response = await geocoder.geocode({
                    placeId: prediction.place_id
                });

                if (response.results && response.results.length > 0) {
                    const result = response.results[0];
                    const components = result.address_components || [];

                    const extract = (componentsList) => {
                        const out = { streetNumber: '', route: '', premise: '', subpremise: '', name: '', city: '', state: '', postal_code: '', country: '' };
                        componentsList.forEach(component => {
                            const types = component.types || [];
                            if (types.includes('street_number')) out.streetNumber = component.long_name;
                            if (types.includes('route')) out.route = component.long_name;
                            if (types.includes('premise')) out.premise = component.long_name;
                            if (types.includes('subpremise')) out.subpremise = component.long_name;
                            if (types.includes('establishment')) out.name = component.long_name;
                            if (types.includes('locality') || types.includes('postal_town')) {
                                if (!out.city) out.city = component.long_name;
                            }
                            if (types.includes('administrative_area_level_1')) out.state = component.long_name;
                            if (types.includes('postal_code')) out.postal_code = component.long_name;
                            if (types.includes('country')) out.country = component.long_name;
                        });
                        return out;
                    };

                    const c = extract(components);

                    // Build street: prefer premise/name, then street_number + route, then route
                    let streetLine = '';
                    if (c.premise) streetLine = c.premise;
                    else if (c.name) streetLine = c.name;
                    else if (c.streetNumber || c.route) streetLine = [c.streetNumber, c.route].filter(Boolean).join(' ');
                    else if (c.route) streetLine = c.route;

                    // Fallback to result.name or formatted_address if still empty
                    if (!streetLine) {
                        streetLine = result.name || result.formatted_address || '';
                    }

                    // City fallback: try administrative_area_level_2 or neighborhood
                    if (!c.city) {
                        const alt = components.find(comp => comp.types && (comp.types.includes('administrative_area_level_2') || comp.types.includes('neighborhood') || comp.types.includes('sublocality_level_1')));
                        if (alt) c.city = alt.long_name;
                    }

                    const cleanAddress = [streetLine, c.city, c.state].filter(Boolean).join(', ') || result.formatted_address;

                    onChange(cleanAddress);

                    const placeResult = {
                        street: streetLine || result.formatted_address,
                        city: c.city || '',
                        state: c.state || '',
                        zipCode: c.postal_code || '',
                        country: c.country || '',
                        coordinates: {
                            lat: result.geometry.location.lat(),
                            lng: result.geometry.location.lng(),
                        },
                        place_id: prediction.place_id,
                    };

                    onPlaceSelect(placeResult);
                } else {
                    // Fallback to prediction
                    onChange(prediction.description);
                }
            } catch (error) {
                console.error("Error fetching place details:", error);
                // Fallback - use the prediction data
                onChange(prediction.description);
                if (prediction.lat && prediction.lng) {
                    const place = {
                        formatted_address: prediction.description,
                        geometry: {
                            location: {
                                lat: prediction.lat,
                                lng: prediction.lng,
                            },
                        },
                        place_id: prediction.place_id,
                    };
                    onPlaceSelect(place);
                }
            }
        } else {
            onChange(prediction.description);
        }
    };

    const handleKeyDown = (e) => {
        if (!isOpen) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) =>
                prev < predictions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(predictions[activeIndex]);
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    // Get current location and reverse geocode to address
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by this browser.");
            return;
        }

        setIsLocationLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    if (!isLoaded) {
                        throw new Error("Google Maps not loaded");
                    }

                    // Use Google Maps Geocoding API for reverse geocoding
                    const { Geocoder } = await window.google.maps.importLibrary("geocoding");

                    const geocoder = new Geocoder();

                    const response = await geocoder.geocode({
                        location: { lat: latitude, lng: longitude },
                    });

                    if (response.results && response.results.length > 0) {
                        // Pick the most specific/relevant result: prefer street_address, premise, establishment
                        const preferredTypes = ['street_address', 'premise', 'establishment', 'route', 'postal_town', 'locality'];
                        let result = response.results.find(r => r.types && r.types.some(t => preferredTypes.includes(t)));
                        if (!result) result = response.results[0];
                        const components = result.address_components || [];

                        const extract = (componentsList) => {
                            const out = { streetNumber: '', route: '', premise: '', subpremise: '', name: '', city: '', state: '', postal_code: '', country: '' };
                            componentsList.forEach(component => {
                                const types = component.types || [];
                                if (types.includes('street_number')) out.streetNumber = component.long_name;
                                if (types.includes('route')) out.route = component.long_name;
                                if (types.includes('premise')) out.premise = component.long_name;
                                if (types.includes('subpremise')) out.subpremise = component.long_name;
                                if (types.includes('establishment')) out.name = component.long_name;
                                if (types.includes('locality') || types.includes('postal_town')) {
                                    if (!out.city) out.city = component.long_name;
                                }
                                if (types.includes('administrative_area_level_1')) out.state = component.long_name;
                                if (types.includes('postal_code')) out.postal_code = component.long_name;
                                if (types.includes('country')) out.country = component.long_name;
                            });
                            return out;
                        };

                        const c = extract(components);

                        let streetLine = '';
                        if (c.premise) streetLine = c.premise;
                        else if (c.name) streetLine = c.name;
                        else if (c.streetNumber || c.route) streetLine = [c.streetNumber, c.route].filter(Boolean).join(' ');
                        else if (c.route) streetLine = c.route;
                        if (!streetLine) {
                            streetLine = result.name || result.formatted_address || '';
                        }

                        if (!c.city) {
                            const alt = components.find(comp => comp.types && (comp.types.includes('administrative_area_level_2') || comp.types.includes('neighborhood') || comp.types.includes('sublocality_level_1')));
                            if (alt) c.city = alt.long_name;
                        }

                        const cleanAddress = [streetLine, c.city, c.state].filter(Boolean).join(', ') || result.formatted_address;

                        const placeResult = {
                            street: streetLine || result.formatted_address,
                            city: c.city || '',
                            state: c.state || '',
                            zipCode: c.postal_code || '',
                            country: c.country || '',
                            coordinates: {
                                lat: latitude,
                                lng: longitude,
                            },
                            place_id: result.place_id,
                        };

                        onChange(cleanAddress);
                        onPlaceSelect?.(placeResult);
                    } else {
                        throw new Error("No address found for current location");
                    }
                } catch (error) {
                    console.error("Error getting address from coordinates:", error);
                    // Fallback: Use coordinates as address
                    const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    const fallbackPlace = {
                        formatted_address: fallbackAddress,
                        geometry: {
                            location: {
                                lat: latitude,
                                lng: longitude,
                            },
                        },
                        place_id: `custom_${latitude}_${longitude}`,
                    };

                    onChange(fallbackAddress);
                    onPlaceSelect?.(fallbackPlace);
                } finally {
                    setIsLocationLoading(false);
                }
            },
            (error) => {
                console.error("Error getting location:", error);
                let errorMessage = "Failed to get current location.";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location permissions.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                }

                alert(errorMessage);
                setIsLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0 // force fresh reading
            }
        );
    };

    return (
        <div className="relative w-full">
            <div className="space-y-2">
                <input
                    ref={inputRef}
                    value={value}
                    className={`w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-sm md:text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none ${className}`}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => predictions.length > 0 && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    type="text"
                    placeholder={placeholder}
                    aria-autocomplete="list"
                    aria-controls={isOpen ? "location-predictions" : undefined}
                    aria-activedescendant={
                        activeIndex >= 0 ? `prediction-${activeIndex}` : undefined
                    }
                />

                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLocationLoading || !isLoaded}
                    className="flex items-center gap-1.5 text-sm text-[#00B75A] hover:text-[#00D68F] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLocationLoading ? (
                        <>
                            <div className="w-4 h-4 animate-spin border-2 border-[#00B75A] border-t-transparent rounded-full"></div>
                            <span>Getting location...</span>
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>Use current location</span>
                        </>
                    )}
                </button>
            </div>

            {isLoading && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00B75A] border-t-transparent"></div>
                        <span className="text-sm text-[#64748B]">Searching...</span>
                    </div>
                </div>
            )}

            {isOpen && !isLoading && predictions.length > 0 && (
                <ul
                    id="location-predictions"
                    ref={dropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                    role="listbox"
                >
                    {predictions.map((prediction, index) => (
                        <li
                            key={prediction.place_id}
                            id={`prediction-${index}`}
                            className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${index === activeIndex ? "bg-gray-50" : ""
                                } ${index !== 0 ? "border-t border-gray-100" : ""}`}
                            onClick={() => handleSelect(prediction)}
                            onMouseEnter={() => setActiveIndex(index)}
                            role="option"
                            aria-selected={index === activeIndex}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B75A" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="text-sm text-[#0F172A]">{prediction.description}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default GoogleMapsAutocomplete;
