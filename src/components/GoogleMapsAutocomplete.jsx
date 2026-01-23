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

        // ✅ ALWAYS use the original autocomplete suggestion text as the display value
        // This preserves the full place name, building/estate name, and complete address
        onChange(prediction.description);

        if (onPlaceSelect && isLoaded) {
            try {
                // Use Geocoder to get coordinates and structured components (city, state, etc.)
                const geocoder = new window.google.maps.Geocoder();

                const response = await geocoder.geocode({
                    placeId: prediction.place_id
                });

                if (response.results && response.results.length > 0) {
                    const result = response.results[0];
                    const components = result.address_components || [];

                    const extract = (componentsList) => {
                        const out = { city: '', state: '', postal_code: '', country: '' };
                        componentsList.forEach(component => {
                            const types = component.types || [];
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

                    // City fallback: try administrative_area_level_2 or neighborhood
                    if (!c.city) {
                        const alt = components.find(comp => comp.types && (comp.types.includes('administrative_area_level_2') || comp.types.includes('neighborhood') || comp.types.includes('sublocality_level_1')));
                        if (alt) c.city = alt.long_name;
                    }

                    const placeResult = {
                        // ✅ Use the full autocomplete description as the street/address
                        street: prediction.description,
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
                    // Fallback: minimal place data with description
                    onPlaceSelect({
                        street: prediction.description,
                        city: '', 
                        state: '',
                        zipCode: '',
                        country: '',
                        place_id: prediction.place_id,
                    });
                }
            } catch (error) {
                console.error("Error fetching place details:", error);
                // Fallback - provide minimal place data
                onPlaceSelect({
                    street: prediction.description,
                    city: '',
                    state: '',
                    zipCode: '',
                    country: '',
                    place_id: prediction.place_id,
                });
            }
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
                    if (!isLoaded) throw new Error("Google Maps not loaded");

                    const geocoder = new window.google.maps.Geocoder();

                    const response = await geocoder.geocode({
                        location: { lat: latitude, lng: longitude },
                    });

                    if (!response.results || response.results.length === 0) {
                        throw new Error("No address found");
                    }

                    /**
                     * ✅ FILTER RULES
                     * - Exclude plus_code
                     * - Prefer ROOFTOP + street_address
                     */
                    const validResult = response.results.find(r =>
                        r.geometry?.location_type === "ROOFTOP" &&
                        !r.plus_code &&
                        r.types?.includes("street_address")
                    ) ||
                        response.results.find(r =>
                            !r.plus_code &&
                            (r.types?.includes("premise") ||
                                r.types?.includes("route"))
                        );

                    if (!validResult) {
                        throw new Error("Only plus-code or area-level address found");
                    }

                    const components = validResult.address_components || [];

                    const extract = () => {
                        const out = {
                            streetNumber: "",
                            route: "",
                            city: "",
                            state: "",
                            postal_code: "",
                            country: ""
                        };

                        components.forEach(c => {
                            if (c.types.includes("street_number")) out.streetNumber = c.long_name;
                            if (c.types.includes("route")) out.route = c.long_name;
                            if (c.types.includes("locality")) out.city = c.long_name;
                            if (c.types.includes("administrative_area_level_1")) out.state = c.long_name;
                            if (c.types.includes("postal_code")) out.postal_code = c.long_name;
                            if (c.types.includes("country")) out.country = c.long_name;
                        });

                        return out;
                    };

                    const c = extract();

                    // 🚫 Prevent Plus Code leakage
                    const street =
                        [c.streetNumber, c.route].filter(Boolean).join(" ");

                    if (!street || street.match(/[A-Z0-9]{4}\+[A-Z0-9]{3}/)) {
                        throw new Error("Invalid street address");
                    }

                    const cleanAddress = [
                        street,
                        c.city,
                        c.state,
                        c.postal_code
                    ].filter(Boolean).join(", ");

                    const placeResult = {
                        street,
                        city: c.city,
                        state: c.state,
                        zipCode: c.postal_code,
                        country: c.country,
                        coordinates: {
                            lat: latitude,
                            lng: longitude,
                        },
                        place_id: validResult.place_id,
                    };

                    onChange(cleanAddress);
                    onPlaceSelect?.(placeResult);

                } catch (error) {
                    console.error("Location error:", error);
                    alert(
                        "We couldn’t detect a precise street address. Please enter your address manually."
                    );
                } finally {
                    setIsLocationLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Failed to get current location.");
                setIsLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
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
