'use client'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import icon2x from 'leaflet/dist/images/marker-icon-2x.png'
import icon from 'leaflet/dist/images/marker-icon.png'
import shadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon.src,
  iconRetinaUrl: icon2x.src,
  shadowUrl: shadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

const MapContainer = dynamic(async () => (await import('react-leaflet')).MapContainer, { ssr: false })
const TileLayer = dynamic(async () => (await import('react-leaflet')).TileLayer, { ssr: false })
const Marker = dynamic(async () => (await import('react-leaflet')).Marker, { ssr: false })
const Popup = dynamic(async () => (await import('react-leaflet')).Popup, { ssr: false })
const Polyline = dynamic(async () => (await import('react-leaflet')).Polyline, { ssr: false })

export type Stop = {
  id: string
  name: string
  lat: number
  lng: number
  time?: string | null
}

export default function RouteMap({
  stops,
  line
}: {
  stops: Stop[]
  line: [number, number][] | null
}) {
  const center: [number, number] = stops.length
    ? [stops[0].lat, stops[0].lng]
    : [40.44, -79.99] // default center

  useEffect(() => { }, [])

  return (
    <div className="w-full h-[70vh] rounded-xl overflow-hidden border">
      <MapContainer center={center} zoom={12} style={{ width: '100%', height: '100%' }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {stops.map((s, idx) => (
          <Marker key={s.id} position={[s.lat, s.lng]}>
            <Popup>
              <div className="space-y-1">
                <div className="font-medium">{idx + 1}. {s.name}</div>
                {s.time ? <div className="text-sm text-gray-600">{new Date(s.time).toLocaleString()}</div> : null}
                <a className="text-blue-600 underline text-sm"
                  href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                  target="_blank">Open in Google Maps</a>
              </div>
            </Popup>
          </Marker>
        ))}
        {line && <Polyline positions={line} />}
      </MapContainer>
    </div>
  )
}
