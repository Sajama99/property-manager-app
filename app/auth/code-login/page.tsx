'use client'

import { FormEvent, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function CodeLoginPage() {
    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    )

    const [email, setEmail] = useState('')
    const [msg, setMsg] = useState<string | null>(null)
    const [err, setErr] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        setMsg(null); setErr(null)
        if (!email.trim()) { setErr('Enter your email'); return }
        setLoading(true)

        try {
            // Ask Supabase to email a 6-digit code (no redirect required)
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: { shouldCreateUser: true },
            })
            if (error) setErr(error.message)
            else setMsg('We sent a 6-digit code to your email. Open it, then click "Enter Code".')
        } catch (e: any) {
            setErr(e?.message || 'Sign-in failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <form onSubmit={onSubmit} className="w-[360px] space-y-4 rounded bg-white p-6 shadow">
                <h1 className="text-2xl font-semibold text-center">Email Sign In (Code)</h1>
                <p className="text-sm text-gray-600 text-center">We’ll send a 6-digit code to your email.</p>

                {msg && <div className="rounded bg-green-100 p-2 text-green-800">{msg}</div>}
                {err && <div className="rounded bg-red-100 p-2 text-red-800">{err}</div>}

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded border p-2"
                    autoFocus
                    required
                />

                <button type="submit" disabled={loading} className="w-full rounded bg-black py-2 text-white disabled:opacity-60">
                    {loading ? 'Sending…' : 'Send Code'}
                </button>

                <a href="/auth/enter-code" className="block text-center underline text-sm">Enter Code</a>
            </form>
        </div>
    )
}
