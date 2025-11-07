'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  )
  const [phase, setPhase] = useState<'init' | 'exchanging' | 'done' | 'error'>('init')
  const [err, setErr] = useState<string>('')

  async function doExchange(href: string) {
    setPhase('exchanging')
    try {
      // Quick sanity check: do we even have a code in the URL?
      const url = new URL(href)
      const hasCode = url.searchParams.get('code')
      const hasError = url.searchParams.get('error')

      if (hasError) {
        setErr(`Provider returned error: ${hasError}`)
        setPhase('error'); return
      }
      if (!hasCode) {
        setErr('Missing ?code in URL. Your magic link may be pointing to the wrong host/port.')
        setPhase('error'); return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(href)
      if (error) {
        setErr(`exchangeCodeForSession failed: ${error.message}`)
        setPhase('error'); return
      }

      // Confirm we truly have a session
      const { data: sessData, error: sessErr } = await supabase.auth.getSession()
      if (sessErr) {
        setErr(`getSession error: ${sessErr.message}`)
        setPhase('error'); return
      }
      if (!sessData.session) {
        setErr('No session after exchange (possible redirect host mismatch).')
        setPhase('error'); return
      }

      setPhase('done')
      router.replace('/') // change to '/routes' if you want
    } catch (e: any) {
      setErr(e?.message || String(e))
      setPhase('error')
    }
  }

  useEffect(() => {
    // Run once on mount with current URL
    if (typeof window !== 'undefined') {
      doExchange(window.location.href)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      {phase === 'exchanging' && (
        <div className="rounded bg-gray-100 p-3 text-gray-700">Signing you in…</div>
      )}
      {phase === 'done' && (
        <div className="rounded bg-green-100 p-3 text-green-800">Signed in. Redirecting…</div>
      )}
      {phase === 'error' && (
        <div className="space-y-3 max-w-[600px] p-4 rounded border border-red-300 bg-red-50 text-red-800">
          <div className="font-semibold">Sign-in failed</div>
          <div className="whitespace-pre-wrap text-sm">{err}</div>

          <div className="text-sm text-red-900/80">
            Try this:
            <ol className="list-decimal ml-5 mt-1 space-y-1">
              <li>Copy the magic link URL from your email.</li>
              <li>Ensure it starts with <code>http://127.0.0.1:3020/auth/callback?code=</code> (or your exact dev origin).</li>
              <li>Paste it directly into the address bar of the SAME browser running your dev app.</li>
            </ol>
          </div>

          <div className="text-xs text-red-900/70">
            Tip: If the link says <code>localhost</code> but your app runs on <code>127.0.0.1</code> (or a different port), replace it to match exactly.
          </div>

          <div className="pt-2">
            <button
              className="rounded bg-black px-3 py-2 text-white"
              onClick={() => typeof window !== 'undefined' && doExchange(window.location.href)}
            >
              Retry exchange
            </button>
          </div>
        </div>
      )}
      {phase === 'init' && (
        <div className="rounded bg-gray-100 p-3 text-gray-700">Preparing…</div>
      )}
    </div>
  )
}
