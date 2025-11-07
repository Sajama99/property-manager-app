// app/api/locations/route.ts
import { NextResponse } from 'next/server'

function jsonErr(status: number, msg: string, extra: any = {}) {
    return NextResponse.json({ error: msg, ...extra }, { status })
}

/** Geocode an address using OpenStreetMap Nominatim (server-side). */
async function geocodeAddress(address: string) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        address
    )}`
    const r = await fetch(url, {
        // Nominatim requires a valid UA; include your domain/app name/email if you deploy.
        headers: { 'User-Agent': 'property-manager-app (local dev)' },
        // Avoid caching wrong results while you iterate.
        cache: 'no-store',
    })
    if (!r.ok) throw new Error(`geocode http ${r.status}`)
    const data: any[] = await r.json()
    if (!Array.isArray(data) || data.length === 0) return null
    const first = data[0]
    const lat = parseFloat(first.lat)
    const lng = parseFloat(first.lon)
    const display = first.display_name as string
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng, display }
}

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return jsonErr(500, 'Missing env', { haveUrl: !!url, haveKey: !!key })

    const target = `${url}/rest/v1/locations?select=*`
    try {
        const r = await fetch(target, {
            headers: { apikey: key, Authorization: `Bearer ${key}` },
            cache: 'no-store',
        })
        const text = await r.text()
        if (!r.ok) return jsonErr(502, 'Supabase error', { status: r.status, body: text, target })
        return new NextResponse(text, {
            status: 200,
            headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
        })
    } catch (e: any) {
        return jsonErr(500, 'Proxy fetch failed', { message: e?.message || String(e), target })
    }
}

export async function POST(req: Request) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!baseUrl || !key) {
        return jsonErr(500, 'Missing env', { haveUrl: !!baseUrl, haveKey: !!key })
    }

    const incoming = await req.json().catch(() => ({} as any))

    // Normalize incoming fields
    let name: string | null = incoming.name ?? null
    let address: string | null = incoming.address ?? null
    let lat: number | null =
        typeof incoming.lat === 'number' ? incoming.lat : incoming.lat ? Number(incoming.lat) : null
    let lng: number | null =
        typeof incoming.lng === 'number' ? incoming.lng : incoming.lng ? Number(incoming.lng) : null

    // If no lat/lng but we have an address → geocode it
    if ((!lat || !lng) && address) {
        try {
            const geo = await geocodeAddress(address)
            if (geo) {
                lat = geo.lat
                lng = geo.lng
                // If user didn’t provide a nicer address, use the geocoder’s formatted one
                if (!name && address) name = address
                address = address || geo.display
            }
        } catch (e: any) {
            // Don’t fail the whole request—let it insert without coords if your table allows NULLs
            // But include info in response if Supabase insert succeeds.
            console.warn('Geocode failed:', e?.message || e)
        }
    }

    const row = { name, address, lat, lng }

    const target = `${baseUrl}/rest/v1/locations`
    try {
        const r = await fetch(target, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                apikey: key,
                Authorization: `Bearer ${key}`,
                Prefer: 'return=representation',
            },
            body: JSON.stringify(row),
            cache: 'no-store',
        })

        const text = await r.text()
        if (!r.ok) return jsonErr(502, 'Supabase insert error', { status: r.status, body: text, target })

        // Pass through the inserted row(s)
        return new NextResponse(text, {
            status: 200,
            headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
        })
    } catch (e: any) {
        return jsonErr(500, 'Proxy insert failed', { message: e?.message || String(e), target })
    }
}
