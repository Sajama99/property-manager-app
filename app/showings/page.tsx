'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Showing = {
    id: string;
    title: string | null;
    description: string | null;
    property_id: string | null;
    showing_time: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    assigned_to: string | null;
    created_at: string;
};

type Profile = {
    id: string;
    role: string;
    approved: boolean;
};

type RolePermission = {
    role: string;
    permission_code: string;
    allowed: boolean;
};

type UserPermission = {
    user_id: string;
    permission_code: string;
    allowed: boolean;
};

export default function ShowingsPage() {
    const [sessionChecked, setSessionChecked] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);

    const [showings, setShowings] = useState<Showing[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);

    // form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [showingTime, setShowingTime] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');

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

            const { data, error } = await supabase.from('showings').select('*').order('showing_time');
            if (error) {
                setErrorText(error.message);
                setShowings([]);
                setLoading(false);
                return;
            }

            let rows = (data || []) as Showing[];

            if (hasPermission('showings.view_all')) {
                // keep all
            } else if (hasPermission('showings.view_own')) {
                rows = rows.filter((r) => r.assigned_to === currentUserId);
            } else {
                rows = [];
            }

            setShowings(rows);
            setLoading(false);
        };
        load();
    }, [sessionChecked, currentUserId, currentProfile, rolePermissions, userPermissions]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasPermission('showings.create')) {
            alert('You do not have permission to create showings.');
            return;
        }

        const payload: any = {
            title,
            description: description || null,
            showing_time: showingTime || null,
            contact_name: contactName || null,
            contact_phone: contactPhone || null,
            assigned_to: currentUserId || null,
            created_by: currentUserId || null,
        };

        const { data, error } = await supabase.from('showings').insert(payload).select().single();
        if (error) {
            alert(error.message);
            return;
        }

        setShowings((prev) => [...prev, data as Showing]);
        setTitle('');
        setDescription('');
        setShowingTime('');
        setContactName('');
        setContactPhone('');
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

            {hasPermission('showings.create') ? (
                <div
                    style={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        padding: 16,
                        maxWidth: 800,
                    }}
                >
                    <h1 style={{ fontSize: 22, marginBottom: 10 }}>Create showing</h1>
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
                            <div style={{ flex: 1, minWidth: 150 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Showing time</label>
                                <input
                                    type="datetime-local"
                                    value={showingTime}
                                    onChange={(e) => setShowingTime(e.target.value)}
                                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 6 }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 150 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Contact name</label>
                                <input
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 6 }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 150 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Contact phone</label>
                                <input
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
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
                <h2 style={{ fontSize: 18, marginBottom: 10 }}>Showings</h2>
                {showings.length === 0 ? (
                    <p>No showings to show.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
                        {showings.map((s) => (
                            <li
                                key={s.id}
                                style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 6,
                                    padding: 10,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{s.title || 'Showing'}</div>
                                    {s.description ? <div style={{ fontSize: 13 }}>{s.description}</div> : null}
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                                        {s.showing_time ? new Date(s.showing_time).toLocaleString() : 'No time set'}
                                    </div>
                                    {s.contact_name ? (
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            {s.contact_name} {s.contact_phone ? `• ${s.contact_phone}` : ''}
                                        </div>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
