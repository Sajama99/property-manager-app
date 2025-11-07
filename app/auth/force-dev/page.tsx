'use client'

import { useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ForceDevPage() {
    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
        []
    )

    const email = process.env.NEXT_PUBLIC_DEV_EMAIL || ''
    const password = process.env.NEXT_PUBLIC_DEV_PASSWORD || ''
    const [out, setOut] = useState<string>('Ready')

    async function checkUser() {
        const u = await supabase.auth.getUser()
        setOut(JSON.stringify(u, null, 2))
    }

    async function signIn() {
        setOut('Signing in…')
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setOut('ERROR: ' + error.message)
        else setOut('OK: ' + JSON.stringify(data.user, null, 2))
    }

    async function signOut() {
        await supabase.auth.signOut()
        setOut('Signed out.')
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">Force Dev Sign-In</h1>
            <div className="text-sm text-gray-700">
                Using email: <code>{email || '(not set)'}</code>
            </div>
            <div className="flex gap-2">
                <button onClick={checkUser} className="rounded bg-gray-200 px-3 py-2">Check user</button>
                <button onClick={signIn} className="rounded bg-black text-white px-3 py-2">Sign in</button>
                <button onClick={signOut} className="rounded bg-gray-200 px-3 py-2">Sign out</button>
            </div>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">{out}</pre>
        </div>
    )
}
