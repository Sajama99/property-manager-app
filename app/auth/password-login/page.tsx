'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function PasswordLoginPage() {
    const router = useRouter()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [msg, setMsg] = useState('')

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setMsg('Signing in…')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setMsg(error.message)
            return
        }
        setMsg('Signed in ✅')
        router.replace('/routes')
    }

    return (
        <div className="p-6 max-w-sm mx-auto space-y-4">
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <form onSubmit={handleLogin} className="space-y-3">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input
                        type="email"
                        className="border p-2 w-full rounded"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Password</label>
                    <input
                        type="password"
                        className="border p-2 w-full rounded"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 rounded w-full"
                >
                    Sign In
                </button>
            </form>
            {msg && <div className="text-sm text-gray-700">{msg}</div>}
        </div>
    )
}
