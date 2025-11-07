'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type Profile = {
    id: string;
    role: string;
    approved: boolean;
};

type LocationRow = {
    id: string;
    name: string | null;
    address?: string | null;
    active: boolean | null;
};

type InspectorRow = {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    active: boolean | null;
};

type CourtRow = {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    active: boolean | null;
};

export default function AdminLookupsPage() {
    const [sessionChecked, setSessionChecked] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const [locations, setLocations] = useState<LocationRow[]>([]);
    const [inspectors, setInspectors] = useState<InspectorRow[]>([]);
    const [courts, setCourts] = useState<CourtRow[]>([]);

    const [locName, setLocName] = useState('');
    const [locAddress, setLocAddress] = useState('');

    const [insName, setInsName] = useState('');
    const [insPhone, setInsPhone] = useState('');
    const [insEmail, setInsEmail] = useState('');

    const [courtName, setCourtName] = useState('');
    const [courtAddress, setCourtAddress] = useState('');
    const [courtPhone, setCourtPhone] = useState('');

    const [msg, setMsg] = useState<string | null>(null);

    // 1) check super admin
    useEffect(() => {
        const check = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session?.user;
            if (!user) {
                setSessionChecked(true);
                setIsSuperAdmin(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, approved')
                .eq('id', user.id)
                .maybeSingle();

            if (profile?.role === 'super_admin' && profile.approved) {
                setIsSuperAdmin(true);
            } else {
                setIsSuperAdmin(false);
            }

            setSessionChecked(true);
        };
        check();
    }, []);

    // 2) load lookup data
    useEffect(() => {
        const loadAll = async () => {
            if (!isSuperAdmin) return;

            const [{ data: locData }, { data: insData }, { data: courtData }] = await Promise.all([
                supabase.from('locations').select('id, name, address, active').order('name'),
                supabase.from('inspector_lookup').select('*').order('name'),
                supabase.from('court_name_lookup').select('*').order('name'),
            ]);

            setLocations((locData || []) as LocationRow[]);
            setInspectors((insData || []) as InspectorRow[]);
            setCourts((courtData || []) as CourtRow[]);
        };

        loadAll();
    }, [isSuperAdmin]);

    const refreshLocations = async () => {
        const { data } = await supabase
            .from('locations')
            .select('id, name, address, active')
            .order('name');
        if (data) setLocations(data as LocationRow[]);
    };

    const refreshInspectors = async () => {
        const { data } = await supabase.from('inspector_lookup').select('*').order('name');
        if (data) setInspectors(data as InspectorRow[]);
    };

    const refreshCourts = async () => {
        const { data } = await supabase.from('court_name_lookup').select('*').order('name');
        if (data) setCourts(data as CourtRow[]);
    };

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        const { error } = await supabase.from('locations').insert({
            name: locName,
            address: locAddress || null,
            active: true,
        });
        if (error) {
            setMsg(error.message);
            return;
        }
        setLocName('');
        setLocAddress('');
        refreshLocations();
    };

    const handleAddInspector = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        const { error } = await supabase.from('inspector_lookup').insert({
            name: insName,
            phone: insPhone || null,
            email: insEmail || null,
            active: true,
        });
        if (error) {
            setMsg(error.message);
            return;
        }
        setInsName('');
        setInsPhone('');
        setInsEmail('');
        refreshInspectors();
    };

    const handleAddCourt = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        const { error } = await supabase.from('court_name_lookup').insert({
            name: courtName,
            address: courtAddress || null,
            phone: courtPhone || null,
            active: true,
        });
        if (error) {
            setMsg(error.message);
            return;
        }
        setCourtName('');
        setCourtAddress('');
        setCourtPhone('');
        refreshCourts();
    };

    const toggleLocationActive = async (id: string, current: boolean | null) => {
        await supabase.from('locations').update({ active: !current }).eq('id', id);
        refreshLocations();
    };

    const toggleInspectorActive = async (id: string, current: boolean | null) => {
        await supabase.from('inspector_lookup').update({ active: !current }).eq('id', id);
        refreshInspectors();
    };

    const toggleCourtActive = async (id: string, current: boolean | null) => {
        await supabase.from('court_name_lookup').update({ active: !current }).eq('id', id);
        refreshCourts();
    };

    if (!sessionChecked) return <div style={{ padding: 20 }}>Checking…</div>;
    if (!isSuperAdmin)
        return (
            <div style={{ padding: 20 }}>
                <h1>Admin – Lookups</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        );

    return (
        <div style={{ padding: 20, display: 'grid', gap: 20 }}>
            <h1 style={{ fontSize: 22 }}>Admin – Lookup Lists</h1>
            <p style={{ color: '#475569' }}>
                Add/edit values that show up in dropdown menus (properties/locations, inspectors, court
                names).
            </p>

            {msg ? (
                <div
                    style={{
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        padding: 10,
                        borderRadius: 6,
                    }}
                >
                    {msg}
                </div>
            ) : null}

            {/* LOCATIONS */}
            <section
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}
            >
                <h2 style={{ fontSize: 16, marginBottom: 8 }}>Properties / Locations</h2>
                <form
                    onSubmit={handleAddLocation}
                    style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}
                >
                    <input
                        value={locName}
                        onChange={(e) => setLocName(e.target.value)}
                        placeholder="Property name"
                        required
                        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 4, minWidth: 180 }}
                    />
                    <input
                        value={locAddress}
                        onChange={(e) => setLocAddress(e.target.value)}
                        placeholder="Address (optional)"
                        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 4, minWidth: 220 }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 12px',
                            cursor: 'pointer',
                        }}
                    >
                        Add
                    </button>
                </form>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={th}>Name</th>
                            <th style={th}>Address</th>
                            <th style={th}>Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {locations.map((loc) => (
                            <tr key={loc.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={td}>{loc.name}</td>
                                <td style={td}>{loc.address || ''}</td>
                                <td style={td}>
                                    <button
                                        onClick={() => toggleLocationActive(loc.id, loc.active)}
                                        style={loc.active ? btnGreen : btnRed}
                                        type="button"
                                    >
                                        {loc.active ? 'Yes' : 'No'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {locations.length === 0 ? (
                            <tr>
                                <td style={td} colSpan={3}>
                                    No locations.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </section>

            {/* INSPECTORS */}
            <section
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}
            >
                <h2 style={{ fontSize: 16, marginBottom: 8 }}>Inspector names</h2>
                <form
                    onSubmit={handleAddInspector}
                    style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}
                >
                    <input
                        value={insName}
                        onChange={(e) => setInsName(e.target.value)}
                        placeholder="Inspector name"
                        required
                        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 4, minWidth: 180 }}
                    />
                    <input
                        value={insPhone}
                        onChange={(e) => setInsPhone(e.target.value)}
                        placeholder="Phone"
                        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 4, minWidth: 140 }}
                    />
                    <input
                        value={insEmail}
                        onChange={(e) => setInsEmail(e.target.value)}
                        placeholder="Email"
                        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 4, minWidth: 180 }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 12px',
                            cursor: 'pointer',
                        }}
                    >
                        Add
                    </button>
                </form>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={th}>Name</th>
                            <th style={th}>Phone</th>
                            <th style={th}>Email</th>
                            <th style={th}>Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inspectors.map((ins) => (
                            <tr key={ins.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={td}>{ins.name}</td>
                                <td style={td}>{ins.phone || ''}</td>
                                <td style={td}>{ins.email || ''}</td>
                                <td style={td}>
                                    <button
                                        onClick={() => toggleInspectorActive(ins.id, ins.active)}
                                        style={ins.active ? btnGreen : btnRed}
                                        type="button"
                                    >
                                        {ins.active ? 'Yes' : 'No'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {inspectors.length === 0 ? (
                            <tr>
                                <td style={td} colSpan={4}>
                                    No inspectors.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </section>

            {/* COURTS */}
            <section
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}
            >
                <h2 style={{ fontSize: 16, marginBottom: 8 }}>Court names</h2>
                <form
                    onSubmit={handleAddCourt}
                    style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}
                >
                    <input
                        value={courtName}
                        onChange={(e) => setCourtName(e.target.value)}
                        placeholder="Court name"
                        required
                        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 4, minWidth: 180 }}
                    />
                    <input
                        value={courtAddress}
                        onChange={(e) => setCourtAddress(e.target.value)}
                        placeholder="Address"
                        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 4, minWidth: 170 }}
                    />
                    <input
                        value={courtPhone}
                        onChange={(e) => setCourtPhone(e.target.value)}
                        placeholder="Phone"
                        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 4, minWidth: 140 }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 12px',
                            cursor: 'pointer',
                        }}
                    >
                        Add
                    </button>
                </form>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={th}>Name</th>
                            <th style={th}>Address</th>
                            <th style={th}>Phone</th>
                            <th style={th}>Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courts.map((c) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={td}>{c.name}</td>
                                <td style={td}>{c.address || ''}</td>
                                <td style={td}>{c.phone || ''}</td>
                                <td style={td}>
                                    <button
                                        onClick={() => toggleCourtActive(c.id, c.active)}
                                        style={c.active ? btnGreen : btnRed}
                                        type="button"
                                    >
                                        {c.active ? 'Yes' : 'No'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {courts.length === 0 ? (
                            <tr>
                                <td style={td} colSpan={4}>
                                    No courts.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '6px 8px',
    fontSize: 12,
    color: '#475569',
    borderBottom: '1px solid #e2e8f0',
};

const td: React.CSSProperties = {
    padding: '6px 8px',
    fontSize: 13,
};

const btnGreen: React.CSSProperties = {
    background: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '2px 10px',
    cursor: 'pointer',
    fontSize: 12,
};

const btnRed: React.CSSProperties = {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '2px 10px',
    cursor: 'pointer',
    fontSize: 12,
};
