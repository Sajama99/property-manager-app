'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type WorkOrder = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string | null;
    property_id: string | null;
    unit: string | null;
    created_at: string;
    assigned_to: string | null;
};

type LocationRow = {
    id: string;
    name: string | null;
    address: string | null;
};

type UserPermission = {
    user_id: string;
    permission_code: string;
    allowed: boolean;
};

type RolePermission = {
    role: string;
    permission_code: string;
    allowed: boolean;
};

type Profile = {
    id: string;
    role: string;
    approved: boolean;
};

export default function WorkOrdersPage() {
    const [sessionChecked, setSessionChecked] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [locations, setLocations] = useState<LocationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);

    // permissions we load
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);

    // form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [locationId, setLocationId] = useState('');
    const [unit, setUnit] = useState('');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');

    // 1) get session + profile + permissions
    useEffect(() => {
        const loadUserStuff = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session?.user || null;
            if (!user) {
                setSessionChecked(true);
                return;
            }
            setCurrentUserId(user.id);

            // get my profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role, approved')
                .eq('id', user.id)
                .maybeSingle();

            if (profile) {
                setCurrentProfile(profile as Profile);
            }

            // load role perms + user perms
            const [{ data: rpData }, { data: upData }] = await Promise.all([
                supabase.from('role_permissions').select('role, permission_code, allowed'),
                supabase.from('user_permissions').select('user_id, permission_code, allowed'),
            ]);

            setRolePermissions((rpData || []) as RolePermission[]);
            setUserPermissions((upData || []) as UserPermission[]);
            setSessionChecked(true);
        };

        loadUserStuff();
    }, []);

    // helper: does this user have a permission?
    const hasPermission = (permCode: string): boolean => {
        if (!currentUserId || !currentProfile) return false;

        // user override?
        const userOverride = userPermissions.find(
            (up) => up.user_id === currentUserId && up.permission_code === permCode,
        );
        if (userOverride) return userOverride.allowed;

        // role-level?
        const rolePerm = rolePermissions.find(
            (rp) => rp.role === currentProfile.role && rp.permission_code === permCode,
        );
        if (rolePerm) return rolePerm.allowed;

        return false;
    };

    // 2) load data (work orders + locations) AFTER we know who we are
    useEffect(() => {
        const loadData = async () => {
            if (!sessionChecked) return; // wait
            setLoading(true);
            setErrorText(null);

            // load locations (safe columns)
            const { data: locData, error: locError } = await supabase
                .from('locations')
                .select('id, name, address')
                .order('name');

            if (locError) {
                setErrorText(`Error loading locations: ${locError.message}`);
                setLocations([]);
            } else {
                setLocations((locData || []) as LocationRow[]);
            }

            // figure out what to load for work orders
            // if user can view all → no filter
            // else if user can view own → filter by assigned_to = currentUserId
            // else → empty
            let woData: WorkOrder[] = [];

            if (hasPermission('work_orders.view_all')) {
                const { data, error } = await supabase
                    .from('work_orders')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) {
                    setErrorText(`Error loading work_orders: ${error.message}`);
                } else {
                    woData = (data || []) as WorkOrder[];
                }
            } else if (hasPermission('work_orders.view_own')) {
                if (currentUserId) {
                    const { data, error } = await supabase
                        .from('work_orders')
                        .select('*')
                        .eq('assigned_to', currentUserId)
                        .order('created_at', { ascending: false });
                    if (error) {
                        setErrorText(`Error loading your work_orders: ${error.message}`);
                    } else {
                        woData = (data || []) as WorkOrder[];
                    }
                }
            } else {
                // no permission → empty
                woData = [];
            }

            setWorkOrders(woData);
            setLoading(false);
        };

        loadData();
        // we need to re-run when permissions change
    }, [sessionChecked, currentUserId, currentProfile, rolePermissions, userPermissions]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorText(null);

        // user must have at least create
        const canCreate = hasPermission('work_orders.create') || hasPermission('work_orders.edit'); // up to you
        if (!canCreate) {
            alert('You do not have permission to create work orders.');
            return;
        }

        const payload: any = {
            title,
            description: description || null,
            unit: unit || null,
            priority,
            status: 'open',
            property_id: locationId || null,
            assigned_to: currentUserId || null, // tie to user
            created_by: currentUserId || null,
        };

        const { data, error } = await supabase.from('work_orders').insert(payload).select().single();

        if (error) {
            alert(error.message);
            return;
        }

        // if user can only see their own, the new one will match
        setWorkOrders((prev) => [data as WorkOrder, ...prev]);

        setTitle('');
        setDescription('');
        setLocationId('');
        setUnit('');
        setPriority('normal');
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        const canEdit = hasPermission('work_orders.edit');
        if (!canEdit) {
            alert('You do not have permission to edit work orders.');
            return;
        }

        const { error } = await supabase
            .from('work_orders')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            alert(error.message);
            return;
        }

        setWorkOrders((prev) =>
            prev.map((wo) => (wo.id === id ? { ...wo, status: newStatus } : wo)),
        );
    };

    if (!sessionChecked) {
        return <div style={{ padding: 20 }}>Checking login…</div>;
    }

    if (!currentUserId || !currentProfile) {
        return (
            <div style={{ padding: 20 }}>
                <p>You must be logged in.</p>
                <a href="/login" style={{ color: '#2563eb' }}>
                    Go to login
                </a>
            </div>
        );
    }

    if (loading) {
        return <div style={{ padding: 20 }}>Loading…</div>;
    }

    const canCreateWO = hasPermission('work_orders.create');

    return (
        <div style={{ padding: 20, display: 'grid', gap: 20 }}>
            {/* debug */}
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

            {/* create form (only if allowed) */}
            {canCreateWO ? (
                <div
                    style={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        padding: 16,
                        maxWidth: 800,
                    }}
                >
                    <h1 style={{ fontSize: 22, marginBottom: 12 }}>Create work order</h1>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Title *</label>
                            <input
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 6,
                                    border: '1px solid #d1d5db',
                                    borderRadius: 4,
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: 6,
                                    border: '1px solid #d1d5db',
                                    borderRadius: 4,
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                                    Property / Location
                                </label>
                                <select
                                    value={locationId}
                                    onChange={(e) => setLocationId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: 6,
                                        border: '1px solid #d1d5db',
                                        borderRadius: 4,
                                    }}
                                >
                                    <option value="">(none)</option>
                                    {locations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name || loc.address || 'Location'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 120 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Unit</label>
                                <input
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: 6,
                                        border: '1px solid #d1d5db',
                                        borderRadius: 4,
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 120 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    style={{
                                        width: '100%',
                                        padding: 6,
                                        border: '1px solid #d1d5db',
                                        borderRadius: 4,
                                    }}
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                </select>
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

            {/* list */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 16,
                    maxWidth: 1000,
                }}
            >
                <h2 style={{ fontSize: 18, marginBottom: 10 }}>Work orders</h2>
                {workOrders.length === 0 ? (
                    <p>No work orders to show.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
                        {workOrders.map((wo) => {
                            const loc = locations.find((l) => l.id === wo.property_id);
                            return (
                                <li
                                    key={wo.id}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 6,
                                        padding: 12,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: 10,
                                        alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{wo.title}</div>
                                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                                            {loc ? (loc.name || loc.address) : 'No location'}
                                            {wo.unit ? ` • Unit ${wo.unit}` : ''}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                            Created {new Date(wo.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                background:
                                                    wo.status === 'completed'
                                                        ? '#dcfce7'
                                                        : wo.status === 'in_progress'
                                                            ? '#fef9c3'
                                                            : '#fee2e2',
                                                color:
                                                    wo.status === 'completed'
                                                        ? '#166534'
                                                        : wo.status === 'in_progress'
                                                            ? '#92400e'
                                                            : '#b91c1c',
                                                padding: '2px 8px',
                                                borderRadius: 999,
                                            }}
                                        >
                                            {wo.status}
                                        </span>
                                        {hasPermission('work_orders.edit') ? (
                                            <select
                                                value={wo.status}
                                                onChange={(e) => handleStatusChange(wo.id, e.target.value)}
                                                style={{ padding: 4, borderRadius: 4, border: '1px solid #d1d5db' }}
                                            >
                                                <option value="open">open</option>
                                                <option value="in_progress">in progress</option>
                                                <option value="completed">completed</option>
                                            </select>
                                        ) : null}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
