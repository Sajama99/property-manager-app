'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Showing = {
    id: string;
    title: string | null;
    showing_time: string | null;
    contact_name: string | null;
    assigned_to: string | null;
};

type Inspection = {
    id: string;
    title: string | null;
    inspection_time: string | null;
    inspector_name: string | null;
    assigned_to: string | null;
};

type CourtDate = {
    id: string;
    title: string | null;
    court_time: string | null;
    court_name: string | null;
    assigned_to: string | null;
};

type Appointment = {
    id: string;
    title: string | null;
    start_time: string | null;
    assigned_to: string | null;
};

type WorkOrder = {
    id: string;
    title: string;
    status: string;
    property_id: string | null;
    assigned_to: string | null;
    created_at: string;
};

type Profile = { id: string; role: string; approved: boolean };
type RolePermission = { role: string; permission_code: string; allowed: boolean };
type UserPermission = { user_id: string; permission_code: string; allowed: boolean };

export default function AtAGlancePage() {
    const [sessionChecked, setSessionChecked] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);

    const [showings, setShowings] = useState<Showing[]>([]);
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [courtDates, setCourtDates] = useState<CourtDate[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // toggles
    const [showShowings, setShowShowings] = useState(true);
    const [showInspections, setShowInspections] = useState(true);
    const [showCourtDates, setShowCourtDates] = useState(true);
    const [showAppointments, setShowAppointments] = useState(true);
    const [showWorkOrders, setShowWorkOrders] = useState(true);

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
        const up = userPermissions.find(
            (u) => u.user_id === currentUserId && u.permission_code === code,
        );
        if (up) return up.allowed;
        const rp = rolePermissions.find(
            (r) => r.role === currentProfile.role && r.permission_code === code,
        );
        if (rp) return rp.allowed;
        return false;
    };

    useEffect(() => {
        const loadAll = async () => {
            if (!sessionChecked) return;
            setLoading(true);

            // we can run these all at once
            const [
                { data: showData },
                { data: inspData },
                { data: courtData },
                { data: apptData },
                { data: woData },
            ] = await Promise.all([
                supabase.from('showings').select('id,title,showing_time,contact_name,assigned_to'),
                supabase.from('inspections').select('id,title,inspection_time,inspector_name,assigned_to'),
                supabase.from('court_dates').select('id,title,court_time,court_name,assigned_to'),
                supabase.from('appointments').select('id,title,start_time,assigned_to'),
                supabase.from('work_orders').select('id,title,status,property_id,assigned_to,created_at'),
            ]);

            const userId = currentUserId;

            // apply view_all / view_own per section
            // showings
            let showRows = (showData || []) as Showing[];
            if (!hasPermission('showings.view_all') && hasPermission('showings.view_own')) {
                showRows = showRows.filter((r) => r.assigned_to === userId);
            } else if (!hasPermission('showings.view_all') && !hasPermission('showings.view_own')) {
                showRows = [];
            }

            // inspections
            let inspRows = (inspData || []) as Inspection[];
            if (!hasPermission('inspections.view_all') && hasPermission('inspections.view_own')) {
                inspRows = inspRows.filter((r) => r.assigned_to === userId);
            } else if (!hasPermission('inspections.view_all') && !hasPermission('inspections.view_own')) {
                inspRows = [];
            }

            // court dates
            let courtRows = (courtData || []) as CourtDate[];
            if (!hasPermission('court_dates.view_all') && hasPermission('court_dates.view_own')) {
                courtRows = courtRows.filter((r) => r.assigned_to === userId);
            } else if (
                !hasPermission('court_dates.view_all') &&
                !hasPermission('court_dates.view_own')
            ) {
                courtRows = [];
            }

            // appointments
            let apptRows = (apptData || []) as Appointment[];
            if (!hasPermission('appointments.view_all') && hasPermission('appointments.view_own')) {
                apptRows = apptRows.filter((r) => r.assigned_to === userId);
            } else if (
                !hasPermission('appointments.view_all') &&
                !hasPermission('appointments.view_own')
            ) {
                apptRows = [];
            }

            // work orders (reuse your perms if you added them)
            let woRows = (woData || []) as WorkOrder[];
            if (!hasPermission('work_orders.view_all') && hasPermission('work_orders.view_own')) {
                woRows = woRows.filter((r) => r.assigned_to === userId);
            } else if (!hasPermission('work_orders.view_all') && !hasPermission('work_orders.view_own')) {
                woRows = [];
            }

            setShowings(showRows);
            setInspections(inspRows);
            setCourtDates(courtRows);
            setAppointments(apptRows);
            setWorkOrders(woRows);
            setLoading(false);
        };

        loadAll();
    }, [sessionChecked, currentUserId, currentProfile, rolePermissions, userPermissions]);

    if (!sessionChecked) return <div style={{ padding: 20 }}>Checking…</div>;
    if (!currentUserId || !currentProfile)
        return (
            <div style={{ padding: 20 }}>
                <p>You must be logged in.</p>
                <a href="/login" style={{ color: '#2563eb' }}>
                    Go to login
                </a>
            </div>
        );

    return (
        <div style={{ padding: 20, display: 'grid', gap: 16 }}>
            <h1 style={{ fontSize: 22 }}>At a glance</h1>
            <p style={{ color: '#475569' }}>
                Toggle the sections below to see condensed info from all parts of the system.
            </p>

            {/* toggles */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <label style={toggleLabel}>
                    <input
                        type="checkbox"
                        checked={showShowings}
                        onChange={(e) => setShowShowings(e.target.checked)}
                    />{' '}
                    Showings
                </label>
                <label style={toggleLabel}>
                    <input
                        type="checkbox"
                        checked={showInspections}
                        onChange={(e) => setShowInspections(e.target.checked)}
                    />{' '}
                    Inspections
                </label>
                <label style={toggleLabel}>
                    <input
                        type="checkbox"
                        checked={showCourtDates}
                        onChange={(e) => setShowCourtDates(e.target.checked)}
                    />{' '}
                    Court dates
                </label>
                <label style={toggleLabel}>
                    <input
                        type="checkbox"
                        checked={showAppointments}
                        onChange={(e) => setShowAppointments(e.target.checked)}
                    />{' '}
                    Appointments
                </label>
                <label style={toggleLabel}>
                    <input
                        type="checkbox"
                        checked={showWorkOrders}
                        onChange={(e) => setShowWorkOrders(e.target.checked)}
                    />{' '}
                    Work orders
                </label>
            </div>

            {loading ? (
                <div>Loading data…</div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {showShowings && (
                        <CondensedTable
                            title="Showings"
                            rows={showings.map((s) => ({
                                id: s.id,
                                col1: s.title || 'Showing',
                                col2: s.showing_time ? new Date(s.showing_time).toLocaleString() : '',
                                col3: s.contact_name || '',
                            }))}
                        />
                    )}
                    {showInspections && (
                        <CondensedTable
                            title="Inspections"
                            rows={inspections.map((i) => ({
                                id: i.id,
                                col1: i.title || 'Inspection',
                                col2: i.inspection_time ? new Date(i.inspection_time).toLocaleString() : '',
                                col3: i.inspector_name || '',
                            }))}
                        />
                    )}
                    {showCourtDates && (
                        <CondensedTable
                            title="Court dates"
                            rows={courtDates.map((c) => ({
                                id: c.id,
                                col1: c.title || 'Court date',
                                col2: c.court_time ? new Date(c.court_time).toLocaleString() : '',
                                col3: c.court_name || '',
                            }))}
                        />
                    )}
                    {showAppointments && (
                        <CondensedTable
                            title="Appointments"
                            rows={appointments.map((a) => ({
                                id: a.id,
                                col1: a.title || 'Appointment',
                                col2: a.start_time ? new Date(a.start_time).toLocaleString() : '',
                                col3: '',
                            }))}
                        />
                    )}
                    {showWorkOrders && (
                        <CondensedTable
                            title="Work orders"
                            rows={workOrders.map((w) => ({
                                id: w.id,
                                col1: w.title,
                                col2: w.status,
                                col3: w.created_at ? new Date(w.created_at).toLocaleString() : '',
                            }))}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function CondensedTable({
    title,
    rows,
}: {
    title: string;
    rows: { id: string; col1: string; col2: string; col3: string }[];
}) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
                {title} ({rows.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td style={{ padding: 8, fontSize: 12, color: '#94a3b8' }}>No items.</td>
                        </tr>
                    ) : (
                        rows.map((r) => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                <td style={{ padding: 6, fontSize: 13, width: '40%' }}>{r.col1}</td>
                                <td style={{ padding: 6, fontSize: 12, width: '30%', color: '#475569' }}>
                                    {r.col2}
                                </td>
                                <td style={{ padding: 6, fontSize: 12, width: '30%', color: '#94a3b8' }}>
                                    {r.col3}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

const toggleLabel: React.CSSProperties = {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    fontSize: 13,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 9999,
    padding: '4px 10px',
};
