'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseBrowser'

type Apt = {
    id: string
    purpose: string | null
    notes: string | null
    scheduled_date: string | null   // YYYY-MM-DD
    start_time: string | null       // HH:MM:SS
    end_time: string | null
    property_id: string | null
    property_name?: string | null
}

export default function AppointmentCard({
    item,
    onDeleted,
}: {
    item: Apt
    onDeleted?: (id: string) => void
}) {
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    async function handleDelete() {
        if (!confirm('Delete this appointment?')) return
        setBusy(true); setErr(null)
        const { error } = await supabase.from('appointments').delete().eq('id', item.id)
        setBusy(false)
        if (error) { setErr(error.message); return }
        onDeleted?.(item.id)
    }

    return (
        <div className="rounded border p-3 flex items-start justify-between gap-3">
            <div className="space-y-1">
                <div className="text-sm text-gray-500">
                    {item.scheduled_date || 'No date'}
                    {item.start_time ? ` • ${item.start_time.substring(0, 5)}` : ''}
                </div>
                <div className="font-medium">
                    {item.purpose || 'Appointment'} {item.property_name ? `• ${item.property_name}` : ''}
                </div>
                {item.notes ? <div className="text-sm text-gray-700">{item.notes}</div> : null}
                {err && <div className="text-sm text-red-600">Error: {err}</div>}
            </div>

            <div className="flex items-center gap-2">
                <Link
                    href={`/appointments/${item.id}`}
                    className="px-3 py-1 rounded bg-black text-white text-sm"
                >
                    Edit
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="px-3 py-1 rounded border text-sm"
                    title="Delete"
                >
                    {busy ? 'Deleting…' : 'Delete'}
                </button>
            </div>
        </div>
    )
}
