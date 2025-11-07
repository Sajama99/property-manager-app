'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const defaultCenter: [number, number] = [40.4406, -79.9959] // Pittsburgh

export default function RouteMap() {
  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <Marker position={defaultCenter} icon={icon}>
          <Popup>Pittsburgh Center</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
