// app/routes/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type Appointment = {
  id: string;
  title: string | null;
  status: string | null;
  location_id?: string | null;
  property_id?: string | null;
};

type Location = {
  id: string;
  name?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type Unit = {
  id: string;
  property_id: string;
  unit_label?: string | null;
  name?: string | null;
  occupant_name?: string | null;
  occupant_phone?: string | null;
};

export default function RoutesPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<
    Array<{ lat: number; lng: number; label: string }>
  >([]);

  // 1) load data: appointments (active) + properties + units
  useEffect(() => {
    async function load() {
      try {
        // appointments
        const apptRes = await fetch('/api/appointments');
        const apptJson = await apptRes.json();
        const allAppointments: Appointment[] = Array.isArray(apptJson.data)
          ? apptJson.data
          : [];

        // only NOT completed
        const activeAppointments = allAppointments.filter(
          (a) => a.status !== 'completed'
        );

        // properties
        const locRes = await fetch('/api/properties');
        const locJson = await locRes.json();
        const locations: Location[] = Array.isArray(locJson.data)
          ? locJson.data
          : [];

        // units (optional)
        let allUnits: Unit[] = [];
        try {
          const unitsRes = await fetch('/api/units');
          const unitsJson = await unitsRes.json();
          allUnits = Array.isArray(unitsJson.data) ? unitsJson.data : [];
        } catch {
          allUnits = [];
        }

        const newPoints: Array<{ lat: number; lng: number; label: string }> = [];

        for (const appt of activeAppointments) {
          const propId = appt.location_id || appt.property_id;
          if (!propId) continue;

          const loc = locations.find((l) => l.id === propId);
          if (!loc) continue;
          if (loc.lat == null || loc.lng == null) continue;

          // find unit with occupant
          const unitsForProp = allUnits.filter((u) => u.property_id === propId);
          const unitWithOccupant =
            unitsForProp.find((u) => u.occupant_name) || unitsForProp[0];

          let label = loc.name || loc.address || 'Property';
          if (unitWithOccupant?.occupant_name) {
            label = `${label} (${unitWithOccupant.occupant_name})`;
          } else if (appt.title) {
            // fallback to appointment name if no occupant
            label = `${label} – ${appt.title}`;
          }

          newPoints.push({
            lat: Number(loc.lat),
            lng: Number(loc.lng),
            label,
          });
        }

        setPoints(newPoints);
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
    if (mapRef.current) return;

    (async () => {
      const L = await import('leaflet');
      // @ts-ignore
      delete (L.Icon.Default as any).prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current!).setView([40.44, -79.99], 11);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
    })();
  }, []);

  // 3) draw markers + line whenever points change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapRef.current) return;

    (async () => {
      const L = await import('leaflet');
      const map = mapRef.current as any;

      // clear old markers
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      // clear old polyline
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      if (!points || points.length === 0) {
        // nothing to show → center on Pittsburgh
        map.setView([40.44, -79.99], 11);
        return;
      }

      const latlngs: Array<[number, number]> = [];

      points.forEach((pt) => {
        const marker = L.marker([pt.lat, pt.lng]).addTo(map);
        marker.bindPopup(pt.label);
        markersRef.current.push(marker);
        latlngs.push([pt.lat, pt.lng]);
      });

      // fit to markers
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [40, 40] });

      // draw line
      if (latlngs.length > 1) {
        const polyline = L.polyline(latlngs, { color: 'blue' }).addTo(map);
        polylineRef.current = polyline;
      }
    })();
  }, [points]);

  return (
    <div style={{ padding: 20, minHeight: '100vh' }}>
      <h1 style={{ fontSize: 22, marginBottom: 10 }}>Routes</h1>
      <p style={{ marginBottom: 10 }}>
        Map of active (not completed) appointments. Markers show property name and tenant
        if we have it.
      </p>
      {loading ? <p>Loading…</p> : null}
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
