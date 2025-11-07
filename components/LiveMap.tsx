'use client'

import Link from 'next/link'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

export type LivePoint = {
    id: string
    name: string
    address?: string
    lat: number
    lng: number
    tenants: Array<{ unit: string; full_name: string; phone: string | null }>
    lastSeen?: Date | null
}

const defaultCenter: [number, number] = [40.4406, -79.9959] // Pittsburgh

const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
})

export default function LiveMap({ points = [] }: { points?: LivePoint[] }) {
    return (
        <div style={{ height: '500px', width: '100%' }}>
            <MapContainer
                center={defaultCenter}
                zoom={11}
                scrollWheelZoom
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />

                {points.length === 0 && (
                    <Marker position={defaultCenter} icon={icon}>
                        <Popup>No live points yet</Popup>
                    </Marker>
                )}

                {points.map((p) => {
                    const show = p.tenants?.slice(0, 6) ?? []
                    const extra = (p.tenants?.length || 0) - show.length
                    return (
                        <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
                            <Popup>
                                <div style={{ minWidth: 240 }}>
                                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                                    {p.address && <div style={{ fontSize: 12, color: '#555' }}>{p.address}</div>}

                                    {show.length > 0 ? (
                                        <div style={{ marginTop: 8 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tenants</div>
                                            <ul style={{ paddingLeft: 16, margin: 0 }}>
                                                {show.map((t, i) => (
                                                    <li key={i} style={{ fontSize: 12 }}>
                                                        Unit {t.unit}: {t.full_name}{t.phone ? ` — ${t.phone}` : ''}
                                                    </li>
                                                ))}
                                            </ul>
                                            {extra > 0 && (
                                                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                                    …and {extra} more
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>No tenants yet.</div>
                                    )}

                                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                        <Link
                                            href={`/properties/${p.id}?action=add-tenant#add-tenant`}
                                            className="px-2 py-1 rounded bg-black text-white text-xs"
                                        >
                                            Add tenant
                                        </Link>
                                        <Link
                                            href={`/properties/${p.id}?action=remove-tenant#units`}
                                            className="px-2 py-1 rounded border text-xs"
                                        >
                                            Remove tenant
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    )
}
