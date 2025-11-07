'use client'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { supabase } from '../../lib/supabaseBrowser'

type Location = {
    id: string
    name: string
    address: string | null
    lat: number | null
    lng: number | null
    created_at: string
}

declare global {
    interface Window {
        google: any
    }
}

export default function LocationsPage() {
    const [rows, setRows] = useState<Location[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [lat, setLat] = useState<string>('')   // keep as string for the input
    const [lng, setLng] = useState<string>('')   // keep as string for the input

    const addressInputRef = useRef<HTMLInputElement | null>(null)
    const [mapsReady, setMapsReady] = useState(false)

    const load = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('locations')
            .select('id,name,address,lat,lng,created_at')
            .order('created_at', { ascending: false })
        if (error) setErr(error.message)
        setRows(data || [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        const ch = supabase
            .channel('rt-locations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, load)
            .subscribe()
        return () => { supabase.removeChannel(ch) }
    }, [])

    // Initialize Google Places Autocomplete after script loads
    useEffect(() => {
        if (!mapsReady) return
        const input = addressInputRef.current
        if (!input || !window.google?.maps?.places) return
        const ac = new window.google.maps.places.Autocomplete(input, {
            fields: ['geometry', 'formatted_address', 'name']
        })
        ac.addListener('place_changed', () => {
            const place = ac.getPlace()
            const loc = place?.geometry?.location
            if (place?.formatted_address) setAddress(place.formatted_address)
            if (place?.name && !name) setName(place.name) // prefill name if empty
            if (loc) {
                const _lat = loc.lat()
                const _lng = loc.lng()
                setLat(String(_lat))
                setLng(String(_lng))
            }
        })
        // no need to clean up; Autocomplete binds to input lifetime
    }, [mapsReady, name])

    const onAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null)
        if (!name.trim()) return setErr('Name is required')

        const latNum = lat ? Number(lat) : null
        const lngNum = lng ? Number(lng) : null
        if ((lat && Number.isNaN(latNum)) || (lng && Number.isNaN(lngNum))) {
            return setErr('Lat/Lng must be numbers')
        }

        setSaving(true)
        const { error } = await supabase.from('locations').insert({
            name: name.trim(),
            address: address.trim() || null,
            lat: latNum,
            lng: lngNum
        })
        setSaving(false)
        if (error) { setErr(error.message); return }
        setName(''); setAddress(''); setLat(''); setLng('')
        await load()
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    return (
        <>
            {/* Load Google Maps JS + Places; after it loads, mark mapsReady=true */}
            {apiKey && (
                <Script
                    src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
                    strategy="afterInteractive"
                    onLoad={() => setMapsReady(true)}
                />
            )}

            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-semibold">Locations</h1>

                {!apiKey && (
                    <div className="text-red-600">
                        Missing <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>. Autocomplete will be disabled.
                    </div>
                )}

                <form onSubmit={onAdd} className="max-w-xl space-y-3">
                    {err && <div className="text-red-600">{err}</div>}

                    <div>
                        <label className="block text-sm font-medium">Name *</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="220 Grant Ave"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Address (type to search)</label>
                        <input
                            ref={addressInputRef}
                            className="w-full border rounded px-3 py-2"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Start typing an address…"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {mapsReady ? 'Autocomplete enabled' : 'Loading Google Places…'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium">Lat (auto-filled)</label>
                            <input
                                className="w-full border rounded px-3 py-2"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                placeholder="40.3748"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Lng (auto-filled)</label>
                            <input
                                className="w-full border rounded px-3 py-2"
                                value={lng}
                                onChange={(e) => setLng(e.target.value)}
                                placeholder="-79.8561"
                            />
                        </div>
                    </div>

                    <button
                        disabled={saving}
                        className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Add Location'}
                    </button>
                </form>

                <div>
                    <h2 className="text-lg font-semibold mb-2">All Locations</h2>
                    {loading ? (
                        <div>Loading…</div>
                    ) : rows.length === 0 ? (
                        <div className="text-gray-600">No locations yet.</div>
                    ) : (
                        <ul className="divide-y">
                            {rows.map((r) => (
                                <li key={r.id} className="py-3">
                                    <div className="font-medium">{r.name}</div>
                                    <div className="text-sm text-gray-600">
                                        {r.address ?? '—'} · {r.lat ?? '—'}, {r.lng ?? '—'}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    )
}
