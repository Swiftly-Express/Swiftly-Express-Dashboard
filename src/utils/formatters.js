export function formatAddress(address) {
    if (!address) return '';

    // If already a string, return trimmed string
    if (typeof address === 'string') return address.trim();

    // If address is an object, prefer common fields
    if (typeof address === 'object') {
        const parts = [];

        // Some APIs return {street, city, state, zipCode}
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.zipCode || address.zip) parts.push(address.zipCode || address.zip);

        // Fallback to a single-line joined values if present
        if (parts.length) return parts.join(', ');

        // If object has a `address` field
        if (address.address && typeof address.address === 'string') return address.address;

        // If coordinates with readable label
        if (address.coordinates) return JSON.stringify(address.coordinates);

        // As a final fallback, stringify the object safely
        try {
            return Object.values(address).filter(v => typeof v === 'string' || typeof v === 'number').join(', ');
        } catch (e) {
            return '';
        }
    }

    return String(address);
}
