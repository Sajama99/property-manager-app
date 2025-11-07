'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function EnterCodePage() {
    const router = useRouter()
    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    )

    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [err, setErr] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        setErr(null)
        if (!email.trim() || !code.trim()) { setErr('Enter your email and the 6-digit code.'); return }
        setLoading(true)
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: code.trim(),
                type: 'email', // verifies the 6-digit email OTP
            })
            if (error) { setErr(error.message); return }
            if (!data?.session) { setErr('No session after verifying code.'); return }
            router.replace('/') // or '/routes' if you prefer
        } catch (e: any) {
            setErr(e?.message || 'Verification failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <form onSubmit={onSubmit} className="w-[360px] space-y-4 rounded bg-white p-6 shadow">
                <h1 className="text-2xl font-semibold text-center">Enter Code</h1>
                <p className="text-sm text-gray-600 text-center">Paste the 6-digit code we emailed you.</p>

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
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full rounded border p-2 tracking-widest text-center"
                    required
                />

                <button type="submit" disabled={loading} className="w-full rounded bg-black py-2 text-white disabled:opacity-60">
                    {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
            </form>
        </div>
    )
}
