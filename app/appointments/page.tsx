'use client';

import { useEffect, useState } from 'react';

type Appointment = {
    id: string;
    title: string;
    scheduled_for: string | null;
    status: string;
    place?: string;
    work_summary?: string | null;
    next_destination?: string | null;
    ended_day?: boolean | null;
};

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);

    // edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editPlace, setEditPlace] = useState('');
    const [editDateTime, setEditDateTime] = useState('');

    // popup state (for stop/complete)
    const [popupForId, setPopupForId] = useState<string | null>(null);
    const [popupWorkDone, setPopupWorkDone] = useState('');
    const [popupNextDest, setPopupNextDest] = useState('');
    const [popupStatusTarget, setPopupStatusTarget] = useState<'stopped' | 'completed' | null>(null);

    // 1. load demo data (so the page always renders)
    useEffect(() => {
        // fake data so page loads
        const demo: Appointment[] = [
            {
                id: '1',
                title: 'Tenant Showing',
                scheduled_for: new Date().toISOString(),
                status: 'scheduled',
                place: '123 Main St',
            },
            {
                id: '2',
                title: 'Boiler Check',
                scheduled_for: null,
                status: 'scheduled',
                place: '456 Oak Ave',
            },
        ];
        setAppointments(demo);
        setLoading(false);
    }, []);

    // fake refresh (in real version we’ll call Supabase)
    const refresh = () => {
        // nothing right now
    };

    const handleEditClick = (appt: Appointment) => {
        setEditingId(appt.id);
        setEditTitle(appt.title);
        setEditPlace(appt.place || '');
        if (appt.scheduled_for) {
            const dt = new Date(appt.scheduled_for);
            setEditDateTime(dt.toISOString().slice(0, 16)); // yyyy-MM-ddTHH:mm
        } else {
            setEditDateTime('');
        }
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;

        setAppointments((prev) =>
            prev.map((a) =>
                a.id === editingId
                    ? {
                        ...a,
                        title: editTitle,
                        place: editPlace,
                        scheduled_for: editDateTime ? new Date(editDateTime).toISOString() : null,
                    }
                    : a
            )
        );
        setEditingId(null);
    };

    const handleStart = (id: string) => {
        setAppointments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: 'in_progress' } : a))
        );
        refresh();
    };

    const handleStopOrComplete = (appt: Appointment, target: 'stopped' | 'completed') => {
        setPopupForId(appt.id);
        setPopupWorkDone(appt.work_summary || '');
        setPopupNextDest(appt.next_destination || '');
        setPopupStatusTarget(target);
    };

    const handleSubmitPopup = (endDay: boolean) => {
        if (!popupForId || !popupStatusTarget) return;
        setAppointments((prev) =>
            prev.map((a) =>
                a.id === popupForId
                    ? {
                        ...a,
                        status: popupStatusTarget,
                        work_summary: popupWorkDone || null,
                        next_destination: popupNextDest || null,
                        ended_day: endDay,
                    }
                    : a
            )
        );
        setPopupForId(null);
        setPopupWorkDone('');
        setPopupNextDest('');
        setPopupStatusTarget(null);
    };

    if (loading) {
        return <div style={{ padding: 20 }}>Loading appointments…</div>;
    }

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ fontSize: 24, marginBottom: 16 }}>Appointments</h1>

            {errorText ? (
                <div
                    style={{
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        padding: 10,
                        borderRadius: 6,
                    }}
                >
                    {errorText}
                </div>
            ) : null}

            <div style={{ display: 'grid', gap: 12 }}>
                {appointments.length === 0 ? (
                    <p>No appointments.</p>
                ) : (
                    appointments.map((appt) => (
                        <div
                            key={appt.id}
                            style={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: 12,
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 12,
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600 }}>
                                    {appt.title}{' '}
                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                        ({appt.status})
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: '#475569' }}>
                                    {appt.place || ''}
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                    {appt.scheduled_for
                                        ? new Date(appt.scheduled_for).toLocaleString()
                                        : ''}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    onClick={() => handleEditClick(appt)}
                                    style={{
                                        background: '#e2e8f0',
                                        color: '#0f172a',
                                        border: 'none',
                                        borderRadius: 4,
                                        padding: '5px 10px',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleStart(appt.id)}
                                    disabled={appt.status === 'in_progress'}
                                    style={{
                                        background: '#2563eb',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 4,
                                        padding: '5px 10px',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        opacity: appt.status === 'in_progress' ? 0.5 : 1,
                                    }}
                                >
                                    Start
                                </button>
                                <button
                                    onClick={() => handleStopOrComplete(appt, 'stopped')}
                                    style={{
                                        background: '#f97316',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 4,
                                        padding: '5px 10px',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Stop
                                </button>
                                <button
                                    onClick={() => handleStopOrComplete(appt, 'completed')}
                                    style={{
                                        background: '#22c55e',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 4,
                                        padding: '5px 10px',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Complete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* edit form */}
            {editingId ? (
                <div
                    style={{
                        marginTop: 20,
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: 16,
                        maxWidth: 500,
                    }}
                >
                    <h2 style={{ fontSize: 16, marginBottom: 10 }}>Edit appointment</h2>
                    <form onSubmit={handleSaveEdit} style={{ display: 'grid', gap: 8 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, marginBottom: 2 }}>
                                Title
                            </label>
                            <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                style={{
                                    width: '100%',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 4,
                                    padding: 6,
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, marginBottom: 2 }}>
                                Property / Place
                            </label>
                            <input
                                value={editPlace}
                                onChange={(e) => setEditPlace(e.target.value)}
                                style={{
                                    width: '100%',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 4,
                                    padding: 6,
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, marginBottom: 2 }}>
                                Date & time
                            </label>
                            <input
                                type="datetime-local"
                                value={editDateTime}
                                onChange={(e) => setEditDateTime(e.target.value)}
                                style={{
                                    width: '100%',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 4,
                                    padding: 6,
                                }}
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                style={{
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '5px 10px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                }}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                style={{
                                    marginLeft: 8,
                                    background: '#e2e8f0',
                                    color: '#0f172a',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '5px 10px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {/* popup for stop/complete */}
            {popupForId ? (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.35)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20,
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 8,
                            padding: 16,
                            width: '100%',
                            maxWidth: 460,
                            display: 'grid',
                            gap: 10,
                        }}
                    >
                        <h2 style={{ fontSize: 16 }}>
                            {popupStatusTarget === 'completed'
                                ? 'Complete appointment'
                                : 'Stop appointment'}
                        </h2>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, marginBottom: 2 }}>
                                What was done?
                            </label>
                            <textarea
                                value={popupWorkDone}
                                onChange={(e) => setPopupWorkDone(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 4,
                                    padding: 6,
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, marginBottom: 2 }}>
                                Where are you headed next?
                            </label>
                            <input
                                value={popupNextDest}
                                onChange={(e) => setPopupNextDest(e.target.value)}
                                style={{
                                    width: '100%',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 4,
                                    padding: 6,
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: 8,
                                justifyContent: 'flex-end',
                            }}
                        >
                            <button
                                onClick={() => setPopupForId(null)}
                                style={{
                                    background: '#e2e8f0',
                                    color: '#0f172a',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '5px 10px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmitPopup(false)}
                                style={{
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '5px 10px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={() => handleSubmitPopup(true)}
                                style={{
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '5px 10px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                }}
                            >
                                End my day
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
