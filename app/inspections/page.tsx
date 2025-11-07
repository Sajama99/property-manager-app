'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/supabaseClient';

// inspections table
type InspectionType = 'preinspect' | 'first' | 'reinspect';

type Inspection = {
    id: string;
    inspector_name: string | null;
    inspection_type: InspectionType | null;
    property_name: string | null;
    scheduled_at: string | null;
    notes: string | null;
    unit_number: string | null;
    tenant_name: string | null;
    tenant_phone: string | null;
};

// reinspection / preinspection items
type InspectionItem = {
    id: string;
    inspection_id: string;
    item_text: string;
    room: string | null;
    materials: string | null;
    is_complete: boolean | null;
};

// locations = your properties table
type LocationRow = {
    id: string;
    name: string | null;
};

// units — your table has occupant_name/occupant_phone
type UnitRow = {
    [key: string]: any;
    id: string;
    property_id: string | null;
};

export default function InspectionsPage() {
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [items, setItems] = useState<InspectionItem[]>([]);
    const [locations, setLocations] = useState<LocationRow[]>([]);
    const [units, setUnits] = useState<UnitRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);

    // form state
    const [inspectorName, setInspectorName] = useState('');
    const [inspectionType, setInspectionType] = useState<InspectionType>('first');
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [propertyName, setPropertyName] = useState('');
    const [selectedUnitId, setSelectedUnitId] = useState('');
    const [unitNumber, setUnitNumber] = useState('');
    const [tenantName, setTenantName] = useState('');
    const [tenantPhone, setTenantPhone] = useState('');
    const [inspectionDateTime, setInspectionDateTime] = useState('');
    const [notes, setNotes] = useState('');

    // add-item state
    const [addingForInspectionId, setAddingForInspectionId] = useState<string | null>(null);
    const [itemText, setItemText] = useState('');
    const [itemRoom, setItemRoom] = useState('');
    const [itemMaterials, setItemMaterials] = useState('');

    // edit state (was requested earlier)
    const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);
    const [editInspectorName, setEditInspectorName] = useState('');
    const [editInspectionType, setEditInspectionType] = useState<InspectionType>('first');
    const [editPropertyName, setEditPropertyName] = useState('');
    const [editUnitNumber, setEditUnitNumber] = useState('');
    const [editTenantName, setEditTenantName] = useState('');
    const [editTenantPhone, setEditTenantPhone] = useState('');
    const [editDateTime, setEditDateTime] = useState('');
    const [editNotes, setEditNotes] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);

            const [
                { data: inspData, error: inspErr },
                { data: itemsData },
                { data: locData },
                unitsRes,
            ] = await Promise.all([
                supabase
                    .from('inspections')
                    .select(
                        'id, inspector_name, inspection_type, property_name, scheduled_at, notes, unit_number, tenant_name, tenant_phone'
                    )
                    .order('created_at', { ascending: false }),
                supabase.from('inspection_items').select('*'),
                supabase.from('locations').select('id, name'),
                supabase.from('units').select('*'),
            ]);

            if (inspErr) {
                setErrorText(inspErr.message);
            } else {
                setInspections((inspData || []) as Inspection[]);
            }

            setItems((itemsData || []) as InspectionItem[]);
            setLocations((locData || []) as LocationRow[]);

            if ('error' in unitsRes && unitsRes.error) {
                setUnits([]);
            } else {
                setUnits(((unitsRes as any).data || []) as UnitRow[]);
            }

            setLoading(false);
        };

        load();
    }, []);

    const refreshInspections = async () => {
        const { data } = await supabase
            .from('inspections')
            .select(
                'id, inspector_name, inspection_type, property_name, scheduled_at, notes, unit_number, tenant_name, tenant_phone'
            )
            .order('created_at', { ascending: false });
        setInspections((data || []) as Inspection[]);
    };

    const refreshItems = async () => {
        const { data } = await supabase.from('inspection_items').select('*');
        setItems((data || []) as InspectionItem[]);
    };

    // property change
    const handlePropertyChange = (propertyId: string) => {
        setSelectedPropertyId(propertyId);
        const loc = locations.find((l) => l.id === propertyId);
        setPropertyName(loc?.name || '');
        setSelectedUnitId('');
        setUnitNumber('');
        setTenantName('');
        setTenantPhone('');
    };

    // units for a property
    const unitsForSelectedProperty = selectedPropertyId
        ? units.filter((u) => u.property_id === selectedPropertyId)
        : [];

    // label for unit dropdown
    const makeUnitLabel = (u: UnitRow) => {
        const main = u.unit_number || u.unit_label || u.name || '(no unit)';
        const occ = u.occupant_name ? ` — ${u.occupant_name}` : '';
        return `${main}${occ}`;
    };

    // unit change
    const handleUnitChange = (unitId: string) => {
        setSelectedUnitId(unitId);
        const unit = units.find((u) => u.id === unitId) || null;

        if (!unit) {
            setUnitNumber('');
            setTenantName('');
            setTenantPhone('');
            return;
        }

        const num = unit.unit_number || unit.unit_label || unit.name || '';
        const name = unit.occupant_name || '';
        const phone = unit.occupant_phone || '';

        setUnitNumber(num);
        setTenantName(name);
        setTenantPhone(phone);
    };

    // create inspection
    const handleCreateInspection = async (e: React.FormEvent) => {
        e.preventDefault();

        const { data, error } = await supabase
            .from('inspections')
            .insert({
                inspector_name: inspectorName || null,
                inspection_type: inspectionType,
                property_name: propertyName || null,
                scheduled_at: inspectionDateTime ? new Date(inspectionDateTime).toISOString() : null,
                notes: notes || null,
                unit_number: unitNumber || null,
                tenant_name: tenantName || null,
                tenant_phone: tenantPhone || null,
            })
            .select('id')
            .single();

        if (error) {
            alert(error.message);
            return;
        }

        // reset form
        setInspectorName('');
        setInspectionType('first');
        setSelectedPropertyId('');
        setPropertyName('');
        setSelectedUnitId('');
        setUnitNumber('');
        setTenantName('');
        setTenantPhone('');
        setInspectionDateTime('');
        setNotes('');

        // if it's pre-inspection OR reinspection, open the add-items box
        if (data && (inspectionType === 'reinspect' || inspectionType === 'preinspect')) {
            setAddingForInspectionId(data.id);
        }

        await refreshInspections();
    };

    // add item
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addingForInspectionId) return;
        if (!itemText.trim()) return;

        const { error } = await supabase.from('inspection_items').insert({
            inspection_id: addingForInspectionId,
            item_text: itemText.trim(),
            room: itemRoom || null,
            materials: itemMaterials || null,
            is_complete: false,
        });

        if (error) {
            alert(error.message);
            return;
        }

        setItemText('');
        setItemRoom('');
        setItemMaterials('');
        await refreshItems();
    };

    const getItemsFor = (inspectionId: string) =>
        items.filter((i) => i.inspection_id === inspectionId);

    // toggle item
    const toggleComplete = async (item: InspectionItem) => {
        const { error } = await supabase
            .from('inspection_items')
            .update({ is_complete: !item.is_complete })
            .eq('id', item.id);
        if (error) {
            alert(error.message);
            return;
        }
        await refreshItems();
    };

    // EDIT
    const startEdit = (insp: Inspection) => {
        setEditingInspectionId(insp.id);
        setEditInspectorName(insp.inspector_name || '');
        setEditInspectionType(insp.inspection_type || 'first');
        setEditPropertyName(insp.property_name || '');
        setEditUnitNumber(insp.unit_number || '');
        setEditTenantName(insp.tenant_name || '');
        setEditTenantPhone(insp.tenant_phone || '');
        setEditNotes(insp.notes || '');
        if (insp.scheduled_at) {
            const dt = new Date(insp.scheduled_at);
            const isoLocal = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            setEditDateTime(isoLocal);
        } else {
            setEditDateTime('');
        }
    };

    const cancelEdit = () => {
        setEditingInspectionId(null);
    };

    const saveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingInspectionId) return;

        const { error } = await supabase
            .from('inspections')
            .update({
                inspector_name: editInspectorName || null,
                inspection_type: editInspectionType,
                property_name: editPropertyName || null,
                scheduled_at: editDateTime ? new Date(editDateTime).toISOString() : null,
                notes: editNotes || null,
                unit_number: editUnitNumber || null,
                tenant_name: editTenantName || null,
                tenant_phone: editTenantPhone || null,
            })
            .eq('id', editingInspectionId);

        if (error) {
            alert(error.message);
            return;
        }

        setEditingInspectionId(null);
        await refreshInspections();
    };

    const renderMaterials = (materials: string | null) => {
        if (!materials) return null;
        const parts = materials
            .split(/\r?\n|,| and /i)
            .map((p) => p.trim())
            .filter(Boolean);
        if (parts.length === 0) return null;
        return (
            <ol style={{ margin: '4px 0 0 16px', padding: 0, fontSize: 11, color: '#475569' }}>
                {parts.map((p, i) => (
                    <li key={i}>{p}</li>
                ))}
            </ol>
        );
    };

    if (loading) {
        return <div style={{ padding: 20 }}>Loading inspections…</div>;
    }

    return (
        <div style={{ padding: 20, display: 'grid', gap: 20 }}>
            <h1 style={{ fontSize: 24 }}>Inspections</h1>

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
                    padding: 16,
                    maxWidth: 780,
                }}
            >
                <h2 style={{ fontSize: 16, marginBottom: 10 }}>New inspection</h2>
                <form onSubmit={handleCreateInspection} style={{ display: 'grid', gap: 10 }}>
                    <div>
                        <label style={{ fontSize: 12, display: 'block', marginBottom: 3 }}>
                            Inspector name
                        </label>
                        <input
                            value={inspectorName}
                            onChange={(e) => setInspectorName(e.target.value)}
                            style={{
                                width: '100%',
                                border: '1px solid #cbd5e1',
                                borderRadius: 4,
                                padding: 5,
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {/* inspection type buttons */}
                        <div>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 3 }}>
                                Inspection type
                            </label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    type="button"
                                    onClick={() => setInspectionType('preinspect')}
                                    style={inspectionType === 'preinspect' ? selectedBtn : unselectedBtn}
                                >
                                    Pre-Inspection
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInspectionType('first')}
                                    style={inspectionType === 'first' ? selectedBtn : unselectedBtn}
                                >
                                    First time
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInspectionType('reinspect')}
                                    style={inspectionType === 'reinspect' ? selectedBtn : unselectedBtn}
                                >
                                    Reinspection
                                </button>
                            </div>
                        </div>

                        {/* property */}
                        <div style={{ minWidth: 180 }}>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 3 }}>
                                Property
                            </label>
                            <select
                                value={selectedPropertyId}
                                onChange={(e) => handlePropertyChange(e.target.value)}
                                style={{
                                    width: '100%',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    padding: 5,
                                }}
                            >
                                <option value="">Select property…</option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* unit */}
                        <div style={{ minWidth: 200 }}>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 3 }}>Unit</label>
                            <select
                                value={selectedUnitId}
                                onChange={(e) => handleUnitChange(e.target.value)}
                                disabled={!selectedPropertyId}
                                style={{
                                    width: '100%',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    padding: 5,
                                    background: !selectedPropertyId ? '#e2e8f0' : '#fff',
                                }}
                            >
                                {!selectedPropertyId ? (
                                    <option value="">Select property first…</option>
                                ) : unitsForSelectedProperty.length === 0 ? (
                                    <option value="">No units for this property</option>
                                ) : (
                                    <>
                                        <option value="">Select unit…</option>
                                        {unitsForSelectedProperty.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {makeUnitLabel(u)}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>

                        {/* date/time */}
                        <div>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 3 }}>
                                Date / time
                            </label>
                            <input
                                type="datetime-local"
                                value={inspectionDateTime}
                                onChange={(e) => setInspectionDateTime(e.target.value)}
                                style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    padding: 5,
                                }}
                            />
                        </div>
                    </div>

                    {/* auto-filled tenant info */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 160 }}>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 3 }}>
                                Tenant name
                            </label>
                            <input
                                value={tenantName}
                                onChange={(e) => setTenantName(e.target.value)}
                                style={{
                                    width: '100%',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    padding: 5,
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 3 }}>
                                Tenant phone
                            </label>
                            <input
                                value={tenantPhone}
                                onChange={(e) => setTenantPhone(e.target.value)}
                                style={{
                                    width: '100%',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    padding: 5,
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 130 }}>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 3 }}>
                                Unit number (save)
                            </label>
                            <input
                                value={unitNumber}
                                onChange={(e) => setUnitNumber(e.target.value)}
                                style={{
                                    width: '100%',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    padding: 5,
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 12, display: 'block', marginBottom: 3 }}>Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            style={{
                                width: '100%',
                                border: '1px solid #cbd5e1',
                                borderRadius: 4,
                                padding: 5,
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
                                padding: '6px 12px',
                                cursor: 'pointer',
                            }}
                        >
                            Save inspection
                        </button>
                    </div>
                </form>
            </div>

            {/* LIST OF INSPECTIONS */}
            <div style={{ display: 'grid', gap: 14 }}>
                {inspections.length === 0 ? (
                    <p>No inspections yet.</p>
                ) : (
                    inspections.map((insp) => {
                        const inspItems = getItemsFor(insp.id);
                        const isReinspect = insp.inspection_type === 'reinspect';
                        const isPreinspect = insp.inspection_type === 'preinspect';
                        const dateLabel =
                            isReinspect || isPreinspect ? 'Follow-up date' : 'Inspection date';
                        const dateText = insp.scheduled_at
                            ? new Date(insp.scheduled_at).toLocaleString()
                            : '—';
                        const isEditing = editingInspectionId === insp.id;

                        return (
                            <div
                                key={insp.id}
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    padding: 14,
                                }}
                            >
                                {/* header + buttons */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: 8,
                                        marginBottom: 8,
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15 }}>
                                            {insp.property_name || 'Inspection'}
                                            {insp.unit_number ? ` — Unit ${insp.unit_number}` : ''}
                                            {isPreinspect ? ' (Pre-Inspection)' : ''}
                                            {isReinspect ? ' (Reinspection)' : ''}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            type="button"
                                            onClick={() => startEdit(insp)}
                                            style={{
                                                background: '#fff',
                                                border: '1px solid #0f172a',
                                                color: '#0f172a',
                                                borderRadius: 6,
                                                padding: '4px 10px',
                                                fontSize: 12,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <a
                                            href={`/inspections/${insp.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                background: '#0f172a',
                                                color: '#fff',
                                                textDecoration: 'none',
                                                padding: '4px 10px',
                                                borderRadius: 6,
                                                fontSize: 12,
                                            }}
                                        >
                                            Open list
                                        </a>
                                        {(isReinspect || isPreinspect) ? (
                                            <button
                                                type="button"
                                                onClick={() => setAddingForInspectionId(insp.id)}
                                                style={{
                                                    background: '#fff',
                                                    border: '1px solid #2563eb',
                                                    color: '#2563eb',
                                                    borderRadius: 6,
                                                    padding: '4px 10px',
                                                    fontSize: 12,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                + Add item
                                            </button>
                                        ) : null}
                                    </div>
                                </div>

                                {/* info line */}
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 14,
                                        flexWrap: 'wrap',
                                        fontSize: 12,
                                        color: '#475569',
                                        marginBottom: 8,
                                    }}
                                >
                                    <div>
                                        <strong>Property:</strong> {insp.property_name || '—'}
                                    </div>
                                    <div>
                                        <strong>Unit:</strong> {insp.unit_number || '—'}
                                    </div>
                                    <div>
                                        <strong>Tenant:</strong> {insp.tenant_name || '—'}
                                    </div>
                                    <div>
                                        <strong>Phone:</strong> {insp.tenant_phone || '—'}
                                    </div>
                                    <div>
                                        <strong>{dateLabel}:</strong> {dateText}
                                    </div>
                                </div>

                                {/* edit form for THIS inspection */}
                                {isEditing ? (
                                    <form
                                        onSubmit={saveEdit}
                                        style={{
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 6,
                                            padding: 10,
                                            marginBottom: 10,
                                            display: 'grid',
                                            gap: 8,
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: 140 }}>
                                                <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                                    Inspector name
                                                </label>
                                                <input
                                                    value={editInspectorName}
                                                    onChange={(e) => setEditInspectorName(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: 4,
                                                        padding: 4,
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                                    Type
                                                </label>
                                                <select
                                                    value={editInspectionType}
                                                    onChange={(e) =>
                                                        setEditInspectionType(e.target.value as InspectionType)
                                                    }
                                                    style={{
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: 4,
                                                        padding: 4,
                                                    }}
                                                >
                                                    <option value="preinspect">Pre-Inspection</option>
                                                    <option value="first">First time</option>
                                                    <option value="reinspect">Reinspection</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 140 }}>
                                                <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                                    Property
                                                </label>
                                                <input
                                                    value={editPropertyName}
                                                    onChange={(e) => setEditPropertyName(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: 4,
                                                        padding: 4,
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                                    Date / time
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={editDateTime}
                                                    onChange={(e) => setEditDateTime(e.target.value)}
                                                    style={{
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: 4,
                                                        padding: 4,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            <div style={{ minWidth: 100 }}>
                                                <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                                    Unit #
                                                </label>
                                                <input
                                                    value={editUnitNumber}
                                                    onChange={(e) => setEditUnitNumber(e.target.value)}
                                                    style={{
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: 4,
                                                        padding: 4,
                                                    }}
                                                />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 140 }}>
                                                <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                                    Tenant name
                                                </label>
                                                <input
                                                    value={editTenantName}
                                                    onChange={(e) => setEditTenantName(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: 4,
                                                        padding: 4,
                                                    }}
                                                />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 140 }}>
                                                <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                                    Tenant phone
                                                </label>
                                                <input
                                                    value={editTenantPhone}
                                                    onChange={(e) => setEditTenantPhone(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: 4,
                                                        padding: 4,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                                Notes
                                            </label>
                                            <textarea
                                                value={editNotes}
                                                onChange={(e) => setEditNotes(e.target.value)}
                                                rows={2}
                                                style={{
                                                    width: '100%',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: 4,
                                                    padding: 4,
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
                                                    padding: '4px 10px',
                                                    fontSize: 12,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Save changes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                style={{
                                                    marginLeft: 8,
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#94a3b8',
                                                    fontSize: 12,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : null}

                                {/* items */}
                                {inspItems.length > 0 ? (
                                    <div style={{ marginTop: 4, display: 'grid', gap: 6 }}>
                                        {inspItems.map((item) => (
                                            <div
                                                key={item.id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    gap: 10,
                                                    background: item.is_complete ? '#dcfce7' : '#fee2e2',
                                                    border: `1px solid ${item.is_complete ? '#22c55e' : '#fca5a5'}`,
                                                    borderRadius: 6,
                                                    padding: 6,
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.item_text}</div>
                                                    <div style={{ fontSize: 11, color: '#475569' }}>
                                                        {item.room ? `Room: ${item.room}` : ''}
                                                    </div>
                                                    {item.materials ? (
                                                        <div style={{ marginTop: 3 }}>
                                                            <div style={{ fontSize: 11, fontWeight: 500 }}>Materials:</div>
                                                            {renderMaterials(item.materials)}
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleComplete(item)}
                                                        style={{
                                                            background: item.is_complete ? '#22c55e' : '#ef4444',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: 4,
                                                            padding: '4px 10px',
                                                            fontSize: 11,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {item.is_complete ? 'Done' : 'Not Done'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : isReinspect || isPreinspect ? (
                                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                                        No checklist items yet.
                                    </p>
                                ) : null}

                                {/* inline add form */}
                                {addingForInspectionId === insp.id ? (
                                    <form
                                        onSubmit={handleAddItem}
                                        style={{
                                            marginTop: 10,
                                            background: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 6,
                                            padding: 10,
                                            display: 'grid',
                                            gap: 6,
                                        }}
                                    >
                                        <div>
                                            <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                                                Item to fix
                                            </label>
                                            <input
                                                required
                                                value={itemText}
                                                onChange={(e) => setItemText(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: 4,
                                                    padding: 4,
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                                                    Room
                                                </label>
                                                <input
                                                    value={itemRoom}
                                                    onChange={(e) => setItemRoom(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: 4,
                                                        padding: 4,
                                                    }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                                                    Materials (one per line)
                                                </label>
                                                <textarea
                                                    value={itemMaterials}
                                                    onChange={(e) => setItemMaterials(e.target.value)}
                                                    rows={2}
                                                    style={{
                                                        width: '100%',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: 4,
                                                        padding: 4,
                                                    }}
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
                                                    padding: '4px 10px',
                                                    fontSize: 12,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Save item
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAddingForInspectionId(null)}
                                                style={{
                                                    marginLeft: 8,
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#94a3b8',
                                                    fontSize: 12,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : null}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

const selectedBtn = {
    background: '#2563eb',
    color: '#fff',
    border: '1px solid #2563eb',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
};

const unselectedBtn = {
    background: '#fff',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
};
