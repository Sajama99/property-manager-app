'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/supabaseClient';

type MoveOutDamage = {
    id: string;
    move_out_id: string;
    description: string | null;
    room: string | null;
    estimated_cost: number | null;
    is_tenant_damage: boolean;
    is_wear_and_tear: boolean;
};

type MoveOut = {
    id: string;
    property_name: string | null;
    unit: string | null;
    tenant_name: string | null;
    phone: string | null;
    email: string | null;
    move_out_date: string | null;
    inspection_date: string | null;
    notes: string | null;
    created_at: string | null;
    move_out_damages?: MoveOutDamage[];
};

export default function MoveOutsPage() {
    const [moveOuts, setMoveOuts] = useState<MoveOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);

    // form for new move-out
    const [propertyName, setPropertyName] = useState('');
    const [unit, setUnit] = useState('');
    const [tenantName, setTenantName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [moveOutDate, setMoveOutDate] = useState('');
    const [inspectionDate, setInspectionDate] = useState('');
    const [notes, setNotes] = useState('');

    // per-move-out draft for adding a damage row
    const [damageDrafts, setDamageDrafts] = useState<{
        [moveOutId: string]: {
            description: string;
            room: string;
            estimated_cost: string;
        };
    }>({});

    useEffect(() => {
        loadMoveOuts();
    }, []);

    async function loadMoveOuts() {
        setLoading(true);
        const { data, error } = await supabase
            .from('move_outs')
            .select('*, move_out_damages(*)')
            .order('created_at', { ascending: false });

        if (error) {
            setErrorText(error.message);
            setMoveOuts([]);
            setLoading(false);
            return;
        }

        setMoveOuts((data || []) as MoveOut[]);
        setLoading(false);
    }

    async function handleCreateMoveOut(e: React.FormEvent) {
        e.preventDefault();

        const { error } = await supabase.from('move_outs').insert({
            property_name: propertyName || null,
            unit: unit || null,
            tenant_name: tenantName || null,
            phone: phone || null,
            email: email || null,
            move_out_date: moveOutDate || null,
            inspection_date: inspectionDate || null,
            notes: notes || null,
        });

        if (error) {
            alert(error.message);
            return;
        }

        // reset
        setPropertyName('');
        setUnit('');
        setTenantName('');
        setPhone('');
        setEmail('');
        setMoveOutDate('');
        setInspectionDate('');
        setNotes('');

        await loadMoveOuts();
    }

    function updateDamageDraft(
        moveOutId: string,
        field: 'description' | 'room' | 'estimated_cost',
        value: string
    ) {
        setDamageDrafts((prev) => ({
            ...prev,
            [moveOutId]: {
                description: prev[moveOutId]?.description || '',
                room: prev[moveOutId]?.room || '',
                estimated_cost: prev[moveOutId]?.estimated_cost || '',
                [field]: value,
            },
        }));
    }

    async function addDamageRow(moveOutId: string) {
        const draft = damageDrafts[moveOutId];
        if (!draft || !draft.description) {
            alert('Please enter a description for the damage.');
            return;
        }

        const cost =
            draft.estimated_cost && draft.estimated_cost.trim() !== ''
                ? Number(draft.estimated_cost)
                : null;

        const { error } = await supabase.from('move_out_damages').insert({
            move_out_id: moveOutId,
            description: draft.description,
            room: draft.room || null,
            estimated_cost: cost,
            is_tenant_damage: false,
            is_wear_and_tear: false,
        });

        if (error) {
            alert(error.message);
            return;
        }

        setDamageDrafts((prev) => ({
            ...prev,
            [moveOutId]: { description: '', room: '', estimated_cost: '' },
        }));

        await loadMoveOuts();
    }

    async function toggleDamageType(dmg: MoveOutDamage, type: 'tenant' | 'wear') {
        const isTenant = type === 'tenant';
        const { error } = await supabase
            .from('move_out_damages')
            .update({
                is_tenant_damage: isTenant,
                is_wear_and_tear: !isTenant,
            })
            .eq('id', dmg.id);

        if (error) {
            alert(error.message);
            return;
        }

        await loadMoveOuts();
    }

    async function updateDamageCost(dmg: MoveOutDamage, value: string) {
        // empty string -> null
        const num =
            value.trim() === '' ? null : Number.isNaN(Number(value)) ? null : Number(value);

        const { error } = await supabase
            .from('move_out_damages')
            .update({ estimated_cost: num })
            .eq('id', dmg.id);

        if (error) {
            alert(error.message);
            return;
        }

        await loadMoveOuts();
    }

    return (
        <div style={{ padding: 20, display: 'grid', gap: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>Move Outs</h1>

            {errorText ? (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: 10 }}>
                    {errorText}
                </div>
            ) : null}

            {/* CREATE FORM */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: 14,
                    maxWidth: 940,
                }}
            >
                <h2 style={{ fontSize: 16, marginBottom: 10 }}>New Move-Out</h2>
                <form onSubmit={handleCreateMoveOut} style={{ display: 'grid', gap: 10 }}>
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

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div style={dateFieldContainer}>
                            <label style={labelStyle}>Move-Out Date</label>
                            <input
                                type="date"
                                value={moveOutDate}
                                onChange={(e) => setMoveOutDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={dateFieldContainer}>
                            <label style={labelStyle}>Move-Out Inspection Date</label>
                            <input
                                type="date"
                                value={inspectionDate}
                                onChange={(e) => setInspectionDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <textarea
                        placeholder="Notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ ...inputStyle, minHeight: 60 }}
                    />

                    <button type="submit" style={saveBtnStyle}>
                        Save Move-Out
                    </button>
                </form>
            </div>

            {/* LIST OF MOVE OUTS */}
            <div style={{ display: 'grid', gap: 10 }}>
                {loading ? (
                    <div>Loading move-outs…</div>
                ) : moveOuts.length === 0 ? (
                    <div>No move-outs yet.</div>
                ) : (
                    moveOuts.map((mo) => {
                        const draft = damageDrafts[mo.id] || {
                            description: '',
                            room: '',
                            estimated_cost: '',
                        };

                        const tenantTotal = (mo.move_out_damages || []).reduce((sum, d) => {
                            if (d.is_tenant_damage) {
                                return sum + (d.estimated_cost || 0);
                            }
                            return sum;
                        }, 0);

                        return (
                            <div
                                key={mo.id}
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    padding: 12,
                                    display: 'grid',
                                    gap: 10,
                                }}
                            >
                                {/* header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>
                                            {mo.property_name || 'No property'} {mo.unit ? `— Unit ${mo.unit}` : ''}
                                        </div>
                                        <div style={{ fontSize: 13 }}>
                                            {mo.tenant_name || 'No tenant'} {mo.phone ? `(${mo.phone})` : ''}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: 12 }}>
                                        Move-out:{' '}
                                        {mo.move_out_date
                                            ? new Date(mo.move_out_date).toLocaleDateString()
                                            : '—'}
                                        <br />
                                        Inspection:{' '}
                                        {mo.inspection_date
                                            ? new Date(mo.inspection_date).toLocaleDateString()
                                            : '—'}
                                    </div>
                                </div>

                                {/* damages */}
                                <div style={{ display: 'grid', gap: 6 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                                        Damages / Final Bill Items
                                    </h3>

                                    {(mo.move_out_damages || []).length === 0 ? (
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            No damages recorded yet.
                                        </div>
                                    ) : (
                                        (mo.move_out_damages || []).map((dmg) => (
                                            <div
                                                key={dmg.id}
                                                style={{
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 6,
                                                    padding: 6,
                                                    display: 'flex',
                                                    gap: 8,
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <div style={{ minWidth: 160 }}>
                                                    <div style={{ fontWeight: 500 }}>
                                                        {dmg.description || '(no description)'}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                                        Room: {dmg.room || '—'}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <ToggleButton
                                                        label="Tenant responsible"
                                                        active={dmg.is_tenant_damage}
                                                        onClick={() => toggleDamageType(dmg, 'tenant')}
                                                    />
                                                    <ToggleButton
                                                        label="Normal wear"
                                                        active={dmg.is_wear_and_tear}
                                                        onClick={() => toggleDamageType(dmg, 'wear')}
                                                    />
                                                </div>

                                                <div>
                                                    <label style={{ fontSize: 11, display: 'block' }}>${' '}</label>
                                                    <input
                                                        defaultValue={
                                                            dmg.estimated_cost != null ? String(dmg.estimated_cost) : ''
                                                        }
                                                        onBlur={(e) => updateDamageCost(dmg, e.target.value)}
                                                        placeholder="0.00"
                                                        style={{
                                                            padding: 4,
                                                            border: '1px solid #cbd5e1',
                                                            borderRadius: 4,
                                                            width: 90,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* add new damage row */}
                                <div
                                    style={{
                                        borderTop: '1px solid #e2e8f0',
                                        paddingTop: 8,
                                        display: 'grid',
                                        gap: 6,
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                                        Add damage / charge for this move-out
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <input
                                            placeholder="Description (ex: door damaged)"
                                            value={draft.description}
                                            onChange={(e) =>
                                                updateDamageDraft(mo.id, 'description', e.target.value)
                                            }
                                            style={inputStyle}
                                        />
                                        <input
                                            placeholder="Room (ex: kitchen)"
                                            value={draft.room}
                                            onChange={(e) => updateDamageDraft(mo.id, 'room', e.target.value)}
                                            style={inputStyle}
                                        />
                                        <input
                                            placeholder="Estimated cost"
                                            value={draft.estimated_cost}
                                            onChange={(e) =>
                                                updateDamageDraft(mo.id, 'estimated_cost', e.target.value)
                                            }
                                            style={inputStyle}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addDamageRow(mo.id)}
                                            style={{
                                                background: '#2563eb',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 6,
                                                padding: '6px 12px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* total */}
                                <div
                                    style={{
                                        borderTop: '1px solid #e2e8f0',
                                        paddingTop: 6,
                                        textAlign: 'right',
                                        fontWeight: 600,
                                    }}
                                >
                                    Tenant damage total: ${tenantTotal.toFixed(2)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

/* styles + small components */

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

function ToggleButton({
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
                padding: '4px 10px',
                fontSize: 11,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
            }}
        >
            {label}
        </button>
    );
}
