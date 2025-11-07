'use client'
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function SupaDebug() {
    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ), []
    )
    const [out, setOut] = useState('Running…')
    useEffect(() => {
        (async () => {
            try {
                const { data, error } = await supabase.from('locations').select('id').limit(1)
                if (error) setOut('API responded with error:\n' + JSON.stringify(error, null, 2))
                else setOut('OK:\n' + JSON.stringify(data, null, 2))
            } catch (e: any) {
                setOut('Failed to fetch:\n' + (e?.message || String(e)))
            }
        })()
    }, [supabase])
    return <pre style={{ whiteSpace: 'pre-wrap' }}>{out}</pre>
}
