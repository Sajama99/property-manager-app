// app/live/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type PropertyLocation = {
    id: string;
    name?: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
};

export default function LivePage() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<PropertyLocation[]>([]);

    // 1) fetch ALL properties
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/properties');
                const json = await res.json();
                const data: PropertyLocation[] = Array.isArray(json.data) ? json.data : [];
                setProperties(data);
            } catch (e) {
                // ignore, just show empty map
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // 2) init map once
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!mapContainerRef.current) return;

        (async () => {
            const L = await import('leaflet');

            // fix Leaflet icons in Next
            // @ts-ignore
            delete (L.Icon.Default as any).prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl:
                    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            if (!mapRef.current) {
                // center on Pittsburgh
                const map = L.map(mapContainerRef.current!).setView([40.44, -79.99], 11);
                mapRef.current = map;

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                }).addTo(map);
            } else {
                // if we come back to this page, ensure it's centered
                mapRef.current.setView([40.44, -79.99], 11);
            }
        })();
    }, []);

    // 3) once we have properties AND a map, show them all
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!mapRef.current) return;
        if (!properties || properties.length === 0) return;

        (async () => {
            const L = await import('leaflet');
            const map = mapRef.current as any;

            // clear old markers first
            markersRef.current.forEach((m) => map.removeLayer(m));
            markersRef.current = [];

            const baseLat = 40.44;
            const baseLng = -79.99;
            const latlngs: Array<[number, number]> = [];

            properties.forEach((prop, idx) => {
                // if the row doesn't have lat/lng, put it near PIT with a tiny offset
                const lat =
                    prop.lat != null
                        ? Number(prop.lat)
                        : baseLat + idx * 0.002; // spread a bit so they don't overlap
                const lng =
                    prop.lng != null
                        ? Number(prop.lng)
                        : baseLng + idx * 0.002;

                const label = prop.name || prop.address || 'Property';

                const marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(label);

                markersRef.current.push(marker);
                latlngs.push([lat, lng]);
            });

            // fit map to all points
            if (latlngs.length > 0) {
                const bounds = L.latLngBounds(latlngs);
                map.fitBounds(bounds, { padding: [40, 40] });
            } else {
                // no properties? just sit on Pittsburgh
                map.setView([40.44, -79.99], 11);
            }
        })();
    }, [properties]);

    return (
        <div style={{ padding: 20, minHeight: '100vh' }}>
            <h1 style={{ fontSize: 22, marginBottom: 10 }}>Live</h1>
            <p style={{ marginBottom: 10 }}>
                All properties from your database are shown as pins. Ones without coordinates are
                placed near Pittsburgh.
            </p>
            {loading ? <p>Loading properties…</p> : null}
            <div
                ref={mapContainerRef}
                style={{
                    width: '100%',
                    height: '70vh',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    overflow: 'hidden',
                }}
            />
            <p style={{ marginTop: 10, fontSize: 12 }}>
                Make sure <code>app/globals.css</code> has:
                <br />
                @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
            </p>
        </div>
    );
}
