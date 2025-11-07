// app/appointments/completed/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Appointment = {
    id: string;
    title: string | null;
    scheduled_date: string | null;
    status: string | null;
    visit_end_time?: string | null;
    visit_notes?: string | null;
    next_destination?: string | null;
};

export default function CompletedAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/appointments?status=completed');
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to load completed appointments');
                setAppointments(json.data || []);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div style={{ padding: 20 }}>Loading…</div>;
    if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ fontSize: 22, marginBottom: 16 }}>Completed appointments</h1>
            <Link href="/appointments" style={{ textDecoration: 'underline', marginBottom: 16 }}>
                ← Back to active
            </Link>
            {appointments.length === 0 ? (
                <p>No completed appointments.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, maxWidth: 900, marginTop: 16 }}>
                    {appointments.map((a) => (
                        <li
                            key={a.id}
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                padding: 12,
                                marginBottom: 10,
                            }}
                        >
                            <div style={{ fontWeight: 600 }}>{a.title || '(no title)'}</div>
                            <div style={{ fontSize: 12, color: '#555' }}>
                                {a.scheduled_date ? `Date: ${a.scheduled_date}` : null}
                                {a.status ? ` • Status: ${a.status}` : null}
                            </div>
                            {a.visit_end_time ? (
                                <div style={{ fontSize: 12, color: '#555' }}>
                                    Ended: {a.visit_end_time}
                                </div>
                            ) : null}
                            {a.visit_notes ? (
                                <div style={{ marginTop: 6 }}>
                                    <strong>Outcome:</strong> {a.visit_notes}
                                </div>
                            ) : null}
                            {a.next_destination ? (
                                <div style={{ fontSize: 12, color: '#555' }}>
                                    Next: {a.next_destination}
                                </div>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
