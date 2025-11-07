'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type CourtDate = {
    id: string;
    title: string | null;
    description: string | null;
    court_name: string | null;
    courtroom: string | null;
    court_time: string | null;
    related_unit: string | null;
    assigned_to: string | null;
    created_at: string;
};

type Profile = { id: string; role: string; approved: boolean };
type RolePermission = { role: string; permission_code: string; allowed: boolean };
type UserPermission = { user_id: string; permission_code: string; allowed: boolean };

export default function CourtDatesPage() {
    const [sessionChecked, setSessionChecked] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
    const [courtDates, setCourtDates] = useState<CourtDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);

    // form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [courtName, setCourtName] = useState('');
    const [courtroom, setCourtroom] = useState('');
    const [courtTime, setCourtTime] = useState('');
    const [relatedUnit, setRelatedUnit] = useState('');

    useEffect(() => {
        const init = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session?.user;
            if (!user) {
                setSessionChecked(true);
                return;
            }
            setCurrentUserId(user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role, approved')
                .eq('id', user.id)
                .maybeSingle();
            if (profile) setCurrentProfile(profile as Profile);

            const [{ data: rpData }, { data: upData }] = await Promise.all([
                supabase.from('role_permissions').select('role, permission_code, allowed'),
                supabase.from('user_permissions').select('user_id, permission_code, allowed'),
            ]);

            setRolePermissions((rpData || []) as RolePermission[]);
            setUserPermissions((upData || []) as UserPermission[]);
            setSessionChecked(true);
        };
        init();
    }, []);

    const hasPermission = (code: string) => {
        if (!currentUserId || !currentProfile) return false;
        const userOverride = userPermissions.find(
            (up) => up.user_id === currentUserId && up.permission_code === code,
        );
        if (userOverride) return userOverride.allowed;
        const rolePerm = rolePermissions.find(
            (rp) => rp.role === currentProfile.role && rp.permission_code === code,
        );
        if (rolePerm) return rolePerm.allowed;
        return false;
    };

    useEffect(() => {
        const load = async () => {
            if (!sessionChecked) return;
            setLoading(true);
            setErrorText(null);

            const { data, error } = await supabase.from('court_dates').select('*').order('court_time');
            if (error) {
                setErrorText(error.message);
                setCourtDates([]);
                setLoading(false);
                return;
            }

            let rows = (data || []) as CourtDate[];

            if (hasPermission('court_dates.view_all')) {
                // keep all
            } else if (hasPermission('court_dates.view_own')) {
                rows = rows.filter((r) => r.assigned_to === currentUserId);
            } else {
                rows = [];
            }

            setCourtDates(rows);
            setLoading(false);
        };
        load();
    }, [sessionChecked, currentUserId, currentProfile, rolePermissions, userPermissions]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasPermission('court_dates.create')) {
            alert('You do not have permission to create court dates.');
            return;
        }

        const payload: any = {
            title,
            description: description || null,
            court_name: courtName || null,
            courtroom: courtroom || null,
            court_time: courtTime || null,
            related_unit: relatedUnit || null,
            assigned_to: currentUserId || null,
            created_by: currentUserId || null,
        };

        const { data, error } = await supabase.from('court_dates').insert(payload).select().single();
        if (error) {
            alert(error.message);
            return;
        }

        setCourtDates((prev) => [...prev, data as CourtDate]);
        setTitle('');
        setDescription('');
        setCourtName('');
        setCourtroom('');
        setCourtTime('');
        setRelatedUnit('');
    };

    if (!sessionChecked) return <div style={{ padding: 20 }}>Checking login…</div>;
    if (!currentUserId || !currentProfile)
        return (
            <div style={{ padding: 20 }}>
                <p>You must be logged in.</p>
                <a href="/login" style={{ color: '#2563eb' }}>
                    Go to login
                </a>
            </div>
        );
    if (loading) return <div style={{ padding: 20 }}>Loading…</div>;

    return (
        <div style={{ padding: 20, display: 'grid', gap: 20 }}>
            {errorText ? (
                <div style={{ background: '#fee2e2', padding: 10, borderRadius: 6 }}>{errorText}</div>
            ) : null}

            {hasPermission('court_dates.create') ? (
                <div
                    style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}
                >
                    <h1 style={{ fontSize: 22, marginBottom: 10 }}>Create court date</h1>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Title *</label>
                            <input
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 6 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 6 }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 140 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Court name</label>
                                <input
                                    value={courtName}
                                    onChange={(e) => setCourtName(e.target.value)}
                                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 6 }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 140 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Courtroom</label>
                                <input
                                    value={courtroom}
                                    onChange={(e) => setCourtroom(e.target.value)}
                                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 6 }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 140 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Court time</label>
                                <input
                                    type="datetime-local"
                                    value={courtTime}
                                    onChange={(e) => setCourtTime(e.target.value)}
                                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 6 }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 140 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Related unit</label>
                                <input
                                    value={relatedUnit}
                                    onChange={(e) => setRelatedUnit(e.target.value)}
                                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 6 }}
                                />
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                style={{
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '6px 14px',
                                    cursor: 'pointer',
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            <div
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}
            >
                <h2 style={{ fontSize: 18, marginBottom: 10 }}>Court dates</h2>
                {courtDates.length === 0 ? (
                    <p>No court dates to show.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
                        {courtDates.map((c) => (
                            <li
                                key={c.id}
                                style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 6,
                                    padding: 10,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{c.title || 'Court date'}</div>
                                    {c.description ? <div style={{ fontSize: 13 }}>{c.description}</div> : null}
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                                        {c.court_time ? new Date(c.court_time).toLocaleString() : 'No time'}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                        {c.court_name ? c.court_name : ''}
                                        {c.courtroom ? ` • Room ${c.courtroom}` : ''}
                                        {c.related_unit ? ` • Unit ${c.related_unit}` : ''}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
