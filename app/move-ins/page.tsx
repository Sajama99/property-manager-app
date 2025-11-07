'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/supabaseClient';

type MoveIn = {
    id: string;
    property_name: string | null;
    unit: string | null;
    tenant_name: string | null;
    phone: string | null;
    email: string | null;
    move_in_date: string | null;
    lease_start_date: string | null;
    lease_end_date: string | null;
    rent_increase_date: string | null;
    lease_url: string | null;
    keys_done: boolean;
    video_done: boolean;
    pictures_done: boolean;
    clean_done: boolean;
    electric_done: boolean;
    gas_done: boolean;
    completed: boolean;
};

export default function MoveInsPage() {
    const [list, setList] = useState<MoveIn[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);

    const [propertyName, setPropertyName] = useState('');
    const [unit, setUnit] = useState('');
    const [tenantName, setTenantName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [moveInDate, setMoveInDate] = useState('');
    const [leaseStart, setLeaseStart] = useState('');
    const [leaseEnd, setLeaseEnd] = useState('');
    const [dueSoon, setDueSoon] = useState<MoveIn[]>([]);

    const [formChecklist, setFormChecklist] = useState({
        keys: false,
        video: false,
        pictures: false,
        clean: false,
        electric: false,
        gas: false,
    });

    useEffect(() => {
        loadMoveIns();
    }, []);

    const loadMoveIns = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('move_ins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            setErrorText(error.message);
            setList([]);
            setLoading(false);
            return;
        }

        const rows = (data || []) as MoveIn[];
        setList(rows);
        setDueSoon(getDueSoon(rows));
        setLoading(false);
    };

    const getDueSoon = (rows: MoveIn[]) => {
        const now = new Date();
        return rows.filter((row) => {
            if (!row.rent_increase_date) return false;
            const inc = new Date(row.rent_increase_date);
            const diffDays = (inc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays <= 7 && diffDays >= 0;
        });
    };

    const calcIncreaseDate = (isoDate: string) => {
        const d = new Date(isoDate);
        d.setMonth(d.getMonth() + 9);
        return d.toISOString().slice(0, 10);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!moveInDate) {
            alert('Please choose a move-in date');
            return;
        }

        const rentIncreaseDate = calcIncreaseDate(moveInDate);

        const { error } = await supabase.from('move_ins').insert({
            property_name: propertyName || null,
            unit: unit || null,
            tenant_name: tenantName || null,
            phone: phone || null,
            email: email || null,
            move_in_date: moveInDate,
            lease_start_date: leaseStart || null,
            lease_end_date: leaseEnd || null,
            rent_increase_date: rentIncreaseDate,
            keys_done: formChecklist.keys,
            video_done: formChecklist.video,
            pictures_done: formChecklist.pictures,
            clean_done: formChecklist.clean,
            electric_done: formChecklist.electric,
            gas_done: formChecklist.gas,
            completed: false,
        });

        if (error) {
            alert(error.message);
            return;
        }

        setPropertyName('');
        setUnit('');
        setTenantName('');
        setPhone('');
        setEmail('');
        setMoveInDate('');
        setLeaseStart('');
        setLeaseEnd('');
        setFormChecklist({
            keys: false,
            video: false,
            pictures: false,
            clean: false,
            electric: false,
            gas: false,
        });

        await loadMoveIns();
    };

    const toggleTask = async (row: MoveIn, field: keyof MoveIn) => {
        const current = row[field] as boolean;
        const { error } = await supabase
            .from('move_ins')
            .update({ [field]: !current })
            .eq('id', row.id);
        if (error) {
            alert(error.message);
            return;
        }
        await loadMoveIns();
    };

    const toggleCompleted = async (row: MoveIn) => {
        const { error } = await supabase
            .from('move_ins')
            .update({ completed: !row.completed })
            .eq('id', row.id);
        if (error) {
            alert(error.message);
            return;
        }
        await loadMoveIns();
    };

    const toggleFormChecklist = (key: keyof typeof formChecklist) => {
        setFormChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div style={{ padding: 20, display: 'grid', gap: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>Move Ins</h1>

            {dueSoon.length > 0 && (
                <div style={{ background: '#f97316', color: '#fff', padding: 8, borderRadius: 6 }}>
                    <strong>Reminder:</strong>{' '}
                    {dueSoon.map((d) => d.tenant_name || '(no name)').join(', ')} rent increase is due soon.
                </div>
            )}

            {errorText ? (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: 10 }}>
                    {errorText}
                </div>
            ) : null}

            {/* FORM */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: 14,
                    maxWidth: 900,
                }}
            >
                <h2 style={{ fontSize: 16, marginBottom: 10 }}>New Move-In</h2>
                <form onSubmit={handleSave} style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <input
                            placeholder="Property Name"
                            value={propertyName}
                            onChange={(e) => setPropertyName(e.target.value)}
                            style={inputStyle}
                        />
                        <input
                            placeholder="Unit"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            style={inputStyle}
                        />
                        <input
                            placeholder="Tenant Name"
                            value={tenantName}
                            onChange={(e) => setTenantName(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <input
                            placeholder="Phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={inputStyle}
                        />
                        <input
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    {/* labeled date fields */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div style={dateFieldContainer}>
                            <label style={labelStyle}>Lease Start Date</label>
                            <input
                                type="date"
                                value={leaseStart}
                                onChange={(e) => setLeaseStart(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={dateFieldContainer}>
                            <label style={labelStyle}>Lease End Date</label>
                            <input
                                type="date"
                                value={leaseEnd}
                                onChange={(e) => setLeaseEnd(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={dateFieldContainer}>
                            <label style={labelStyle}>Move-In Date</label>
                            <input
                                type="date"
                                value={moveInDate}
                                onChange={(e) => setMoveInDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {moveInDate && (
                        <div style={{ fontSize: 12 }}>
                            Rent increase date: <strong>{calcIncreaseDate(moveInDate)}</strong>
                        </div>
                    )}

                    {/* checklist */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[
                            ['2 sets of keys', 'keys'],
                            ['Take video', 'video'],
                            ['Take pictures', 'pictures'],
                            ['Clean unit', 'clean'],
                            ['Electric in tenant name', 'electric'],
                            ['Gas in tenant name', 'gas'],
                        ].map(([label, key]) => (
                            <ChecklistButton
                                key={key}
                                label={label}
                                active={formChecklist[key as keyof typeof formChecklist]}
                                onClick={() => toggleFormChecklist(key as keyof typeof formChecklist)}
                            />
                        ))}
                    </div>

                    <button type="submit" style={saveBtnStyle}>
                        Save Move-In
                    </button>
                </form>
            </div>

            {/* LIST */}
            <div style={{ display: 'grid', gap: 10 }}>
                {loading ? (
                    <div>Loading move-ins…</div>
                ) : list.length === 0 ? (
                    <div>No move-ins yet.</div>
                ) : (
                    list.map((row) => (
                        <div
                            key={row.id}
                            style={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: 12,
                                display: 'grid',
                                gap: 8,
                            }}
                        >
                            <div style={{ fontWeight: 600 }}>
                                {row.property_name || 'No property'} {row.unit ? `— Unit ${row.unit}` : ''}
                            </div>
                            <div>
                                {row.tenant_name || 'No tenant'} {row.phone ? `(${row.phone})` : ''}
                            </div>
                            <div style={{ fontSize: 12 }}>
                                Move-In: {row.move_in_date ? new Date(row.move_in_date).toLocaleDateString() : '—'} |
                                Lease: {row.lease_start_date ? new Date(row.lease_start_date).toLocaleDateString() : '—'}
                                {' → '}
                                {row.lease_end_date ? new Date(row.lease_end_date).toLocaleDateString() : '—'}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {[
                                    ['2 sets of keys', 'keys_done'],
                                    ['Take video', 'video_done'],
                                    ['Take pictures', 'pictures_done'],
                                    ['Clean unit', 'clean_done'],
                                    ['Electric in tenant name', 'electric_done'],
                                    ['Gas in tenant name', 'gas_done'],
                                ].map(([label, key]) => (
                                    <ChecklistButton
                                        key={key}
                                        label={label}
                                        active={row[key as keyof MoveIn] as boolean}
                                        onClick={() => toggleTask(row, key as keyof MoveIn)}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => toggleCompleted(row)}
                                style={{
                                    background: row.completed ? '#22c55e' : '#475569',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                }}
                            >
                                {row.completed ? 'Completed' : 'Mark Completed'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    padding: 8,
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    flex: 1,
    minWidth: 150,
};

const saveBtnStyle: React.CSSProperties = {
    background: '#2563eb',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
};

const dateFieldContainer: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 150,
};

const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 4,
};

function ChecklistButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                background: active ? '#22c55e' : '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 13,
            }}
        >
            {label}: {active ? 'Completed' : 'Open'}
        </button>
    );
}
