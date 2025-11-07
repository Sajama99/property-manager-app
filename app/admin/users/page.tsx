'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type Profile = {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string;
    approved: boolean;
    created_at: string;
};

type Permission = {
    code: string;
    description: string | null;
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

const ROLE_OPTIONS = [
    'super_admin',
    'property_manager',
    'sub_contractor',
    'pending',
] as const;

export default function AdminUsersPage() {
    const [sessionChecked, setSessionChecked] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);

    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<string | null>(null);

    // 1) check current user
    useEffect(() => {
        const check = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session?.user;
            if (!user) {
                setSessionChecked(true);
                setIsSuperAdmin(false);
                return;
            }

            const { data: myProfile } = await supabase
                .from('profiles')
                .select('role, approved')
                .eq('id', user.id)
                .maybeSingle();

            if (myProfile?.role === 'super_admin' && myProfile.approved) {
                setIsSuperAdmin(true);
            } else {
                setIsSuperAdmin(false);
            }

            setSessionChecked(true);
        };
        check();
    }, []);

    // 2) load all admin data
    useEffect(() => {
        const load = async () => {
            if (!isSuperAdmin) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setMsg(null);

            const [
                { data: profilesData, error: profilesErr },
                { data: permsData, error: permsErr },
                { data: rolePermsData, error: rolePermsErr },
                { data: userPermsData, error: userPermsErr },
            ] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, email, full_name, role, approved, created_at')
                    .order('created_at', { ascending: false }),
                supabase.from('permissions').select('code, description').order('code'),
                supabase.from('role_permissions').select('role, permission_code, allowed'),
                supabase.from('user_permissions').select('user_id, permission_code, allowed'),
            ]);

            if (profilesErr) setMsg(profilesErr.message);
            if (permsErr) setMsg(permsErr.message);
            if (rolePermsErr) setMsg(rolePermsErr.message);
            if (userPermsErr) setMsg(userPermsErr.message);

            setProfiles((profilesData || []) as Profile[]);
            setPermissions((permsData || []) as Permission[]);
            setRolePermissions((rolePermsData || []) as RolePermission[]);
            setUserPermissions((userPermsData || []) as UserPermission[]);

            setLoading(false);
        };

        load();
    }, [isSuperAdmin]);

    const refreshUserPerms = async () => {
        const { data: userPermsData } = await supabase
            .from('user_permissions')
            .select('user_id, permission_code, allowed');
        if (userPermsData) setUserPermissions(userPermsData as UserPermission[]);
    };

    const refreshProfiles = async () => {
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, approved, created_at')
            .order('created_at', { ascending: false });
        if (profilesData) setProfiles(profilesData as Profile[]);
    };

    const handleApprove = async (id: string) => {
        setMsg(null);
        const { error } = await supabase.from('profiles').update({ approved: true }).eq('id', id);
        if (error) {
            setMsg(error.message);
            return;
        }
        await refreshProfiles();
    };

    const handleRoleChange = async (id: string, role: string) => {
        setMsg(null);
        const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
        if (error) {
            setMsg(error.message);
            return;
        }
        await refreshProfiles();
    };

    /**
     * Toggle per-user permission.
     * If user already has an override, flip it.
     * If not, create an override (true).
     */
    const toggleUserPermission = async (
        userId: string,
        permCode: string,
        current: boolean | null,
    ) => {
        setMsg(null);

        const existing = userPermissions.find(
            (up) => up.user_id === userId && up.permission_code === permCode,
        );

        if (existing) {
            // update
            const { error } = await supabase
                .from('user_permissions')
                .update({ allowed: !existing.allowed })
                .eq('user_id', userId)
                .eq('permission_code', permCode);

            if (error) {
                setMsg(error.message);
                return;
            }

            setUserPermissions((prev) =>
                prev.map((up) =>
                    up.user_id === userId && up.permission_code === permCode
                        ? { ...up, allowed: !existing.allowed }
                        : up,
                ),
            );
        } else {
            // create override, default yes
            const { error } = await supabase.from('user_permissions').insert({
                user_id: userId,
                permission_code: permCode,
                allowed: true,
            });
            if (error) {
                setMsg(error.message);
                return;
            }

            setUserPermissions((prev) => [
                ...prev,
                { user_id: userId, permission_code: permCode, allowed: true },
            ]);
        }
    };

    /**
     * Figure out what to show in the cell:
     * - if user override exists -> use that
     * - else if role permission exists -> use that
     * - else false
     */
    const getEffectivePermission = (user: Profile, perm: Permission) => {
        // user override?
        const userOverride = userPermissions.find(
            (up) => up.user_id === user.id && up.permission_code === perm.code,
        );
        if (userOverride) {
            return {
                allowed: userOverride.allowed,
                source: 'user' as const,
            };
        }

        // role?
        const rolePerm = rolePermissions.find(
            (rp) => rp.role === user.role && rp.permission_code === perm.code,
        );
        if (rolePerm) {
            return {
                allowed: rolePerm.allowed,
                source: 'role' as const,
            };
        }

        return {
            allowed: false,
            source: 'none' as const,
        };
    };

    if (!sessionChecked) {
        return <div style={{ padding: 20 }}>Checking permissions…</div>;
    }

    if (!isSuperAdmin) {
        return (
            <div style={{ padding: 20 }}>
                <h1 style={{ fontSize: 20, marginBottom: 8 }}>Admin – Users</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ fontSize: 22, marginBottom: 12 }}>Admin – Users</h1>
            <p style={{ marginBottom: 16, color: '#475569' }}>
                Manage signups, approvals, roles, and per-user permission overrides.
            </p>

            {msg ? (
                <div
                    style={{
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 12,
                    }}
                >
                    {msg}
                </div>
            ) : null}

            {loading ? (
                <div>Loading users…</div>
            ) : profiles.length === 0 ? (
                <div>No users found.</div>
            ) : (
                <div
                    style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        overflow: 'hidden',
                    }}
                >
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Role</th>
                                <th style={thStyle}>Approved</th>
                                <th style={thStyle}>Permissions (click to override)</th>
                                <th style={thStyle}>Created</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map((p) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={tdStyle}>{p.email || '—'}</td>
                                    <td style={tdStyle}>{p.full_name || '—'}</td>
                                    <td style={tdStyle}>
                                        <select
                                            value={p.role}
                                            onChange={(e) => handleRoleChange(p.id, e.target.value)}
                                            style={{
                                                padding: 4,
                                                border: '1px solid #cbd5e1',
                                                borderRadius: 4,
                                                background: '#fff',
                                            }}
                                        >
                                            {ROLE_OPTIONS.map((r) => (
                                                <option key={r} value={r}>
                                                    {r}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={tdStyle}>
                                        {p.approved ? (
                                            <span style={badgeGreen}>Yes</span>
                                        ) : (
                                            <span style={badgeRed}>No</span>
                                        )}
                                    </td>
                                    {/* permissions */}
                                    <td style={{ ...tdStyle, minWidth: 280 }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {permissions.map((perm) => {
                                                const { allowed, source } = getEffectivePermission(p, perm);
                                                return (
                                                    <div
                                                        key={perm.code}
                                                        onClick={() =>
                                                            toggleUserPermission(
                                                                p.id,
                                                                perm.code,
                                                                allowed,
                                                            )
                                                        }
                                                        style={{
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: 6,
                                                            padding: '4px 6px',
                                                            background: allowed ? '#dcfce7' : '#fee2e2',
                                                            display: 'flex',
                                                            gap: 4,
                                                            alignItems: 'center',
                                                            cursor: 'pointer',
                                                        }}
                                                        title={
                                                            perm.description
                                                                ? `${perm.description} (from: ${source})`
                                                                : `from: ${source}`
                                                        }
                                                    >
                                                        <span style={{ fontSize: 11 }}>
                                                            {perm.code.replace('.', ' / ')}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: 10,
                                                                background: source === 'user' ? '#0f766e' : '#475569',
                                                                color: '#fff',
                                                                borderRadius: 999,
                                                                padding: '1px 5px',
                                                            }}
                                                        >
                                                            {allowed ? 'yes' : 'no'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                                    </td>
                                    <td style={tdStyle}>
                                        {!p.approved ? (
                                            <button onClick={() => handleApprove(p.id)} style={btnPrimary}>
                                                Approve
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>Approved</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 13,
    color: '#475569',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'top',
};

const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 13,
    verticalAlign: 'top',
};

const btnPrimary: React.CSSProperties = {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 12,
};

const badgeGreen: React.CSSProperties = {
    background: '#dcfce7',
    color: '#166534',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
};

const badgeRed: React.CSSProperties = {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
};
