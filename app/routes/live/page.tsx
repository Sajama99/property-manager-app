'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Property = {
    id: string;
    name: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    tenant_name: string | null;
};

export default function LiveRoutesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data, error } = await supabase
                .from('properties')
                .select('id, name, address, latitude, longitude, tenant_name');

            if (error) {
                console.error('error fetching properties for map', error);
                setProperties([]);
            } else {
                setProperties(data ?? []);
            }
            setLoading(false);
        };

        load();
    }, []);

    useEffect(() => {
        if (loading) return;

        const setup = async () => {
            const L = (await import('leaflet')).default;
            const el = document.getElementById('live-map');
            if (!el) return;

            if (el.dataset.mapInit === 'true') return;
            el.dataset.mapInit = 'true';

            // find first property with coords
            const withCoords = properties.find((p) => p.latitude && p.longitude);

            // Pittsburgh fallback
            const centerLat = withCoords ? (withCoords.latitude as number) : 40.4406;
            const centerLng = withCoords ? (withCoords.longitude as number) : -79.9959;

            const map = L.map(el).setView([centerLat, centerLng], 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(map);

            // add markers for all properties that have coords
            properties
                .filter((p) => p.latitude && p.longitude)
                .forEach((p) => {
                    const m = L.marker([p.latitude as number, p.longitude as number]).addTo(map);
                    const popupParts = [];
                    if (p.name) popupParts.push(`<strong>${p.name}</strong>`);
                    if (p.address) popupParts.push(`<div>${p.address}</div>`);
                    if (p.tenant_name) popupParts.push(`<div>Tenant: ${p.tenant_name}</div>`);
                    m.bindPopup(popupParts.join(''));
                });
        };

        setup();
    }, [loading, properties]);

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ marginBottom: 12 }}>Live page (all properties on map)</h1>
            <div
                id="live-map"
                style={{
                    height: '70vh',
                    width: '100%',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    overflow: 'hidden',
                }}
            >
                {loading ? 'Loading map…' : null}
            </div>
        </div>
    );
}
