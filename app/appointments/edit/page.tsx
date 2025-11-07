'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Appointment = {
    id: string;
    title: string | null;
    description: string | null;
    scheduled_date: string | null;
    scheduled_time: string | null;
    is_time_specific: boolean | null;
    estimated_duration_minutes: number | null;
    status: string | null;
    priority: number | null;
    location_id: string | null; // property
    unit_id: string | null; // new!
    assigned_to: string | null;
    purpose: string | null;
    notes: string | null;
    next_destination: string | null;
};

type Location = {
    id: string;
    name?: string | null;
    address?: string | null;
};

type Unit = {
    id: string;
    location_id: string;
    name?: string | null;
};

export default function EditAppointmentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Appointment | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    useEffect(() => {
        if (!id) {
            setError('No appointment id provided.');
            setLoading(false);
            return;
        }

        async function load() {
            try {
                // appointment
                const apptRes = await fetch(`/api/appointments/by-id?id=${id}`);
                const apptJson = await apptRes.json();
                if (!apptRes.ok) throw new Error(apptJson.error || 'Load error');
                const appt = apptJson.data;

                // properties (locations)
                const locRes = await fetch('/api/properties');
                const locJson = await locRes.json();
                const locs = Array.isArray(locJson.data) ? locJson.data : [];

                // units for this property
                let unitList: Unit[] = [];
                if (appt.location_id) {
                    const unitRes = await fetch(`/api/units?location_id=${appt.location_id}`);
                    const unitJson = await unitRes.json();
                    unitList = Array.isArray(unitJson.data) ? unitJson.data : [];
                }

                setLocations(locs);
                setUnits(unitList);
                setForm({
                    id: appt.id,
                    title: appt.title ?? '',
                    description: appt.description ?? '',
                    scheduled_date: appt.scheduled_date ?? '',
                    scheduled_time: appt.scheduled_time ?? '',
                    is_time_specific: appt.is_time_specific ?? false,
                    estimated_duration_minutes: appt.estimated_duration_minutes ?? 30,
                    status: appt.status ?? '',
                    priority: appt.priority ?? 0,
                    location_id: appt.location_id ?? '',
                    unit_id: appt.unit_id ?? '',
                    assigned_to: appt.assigned_to ?? '',
                    purpose: appt.purpose ?? '',
                    notes: appt.notes ?? '',
                    next_destination: appt.next_destination ?? '',
                });
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    async function loadUnits(location_id: string) {
        if (!location_id) {
            setUnits([]);
            return;
        }
        const res = await fetch(`/api/units?location_id=${location_id}`);
        const json = await res.json();
        setUnits(Array.isArray(json.data) ? json.data : []);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!id || !form) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/appointments/by-id?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Save failed');
            router.push('/appointments');
            router.refresh();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
    if (error) return <div style={{ color: 'red', padding: 20 }}>{error}</div>;
    if (!form) return <div style={{ padding: 20 }}>No data.</div>;

    return (
        <div style={{ maxWidth: 800, padding: 20 }}>
            <h1>Edit Appointment</h1>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
                <label>
                    Title
                    <input
                        value={form.title ?? ''}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    />
                </label>

                <label>
                    Property
                    <select
                        value={form.location_id ?? ''}
                        onChange={(e) => {
                            const locId = e.target.value;
                            setForm({ ...form, location_id: locId, unit_id: '' });
                            loadUnits(locId);
                        }}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                    >
                        <option value="">-- select property --</option>
                        {locations.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.name || l.address || l.id}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Unit
                    <select
                        value={form.unit_id ?? ''}
                        onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
                        style={{ width: '100%', padding: 6, marginTop: 4 }}
                        disabled={!form.location_id}
                    >
                        <option value="">-- select unit --</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name || u.id}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 14px',
                    }}
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </form>
        </div>
    );
}
