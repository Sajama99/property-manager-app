import { NextResponse } from 'next/server'

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return NextResponse.json({
        url,
        urlLooksOk: url.startsWith('https://') && url.includes('.supabase.co'),
        keyPresent: !!key,
        keyLen: key.length,
        keyPreview: key ? key.slice(0, 8) + '…' + key.slice(-6) : null,
    })
}
