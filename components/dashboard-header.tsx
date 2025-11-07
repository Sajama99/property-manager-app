'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase/supabaseClient'; // 👈 <-- this is the correct path

type Profile = {
  id: string;
  email?: string;
  role?: string;
};

export default function DashboardHeader() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      setUserEmail(user.email ?? null);

      // try to get role from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role) {
        setUserRole(profile.role);
      }
    };

    loadUser();
  }, []);

  return (
    <header
      style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div>
        <h1 style={{ fontSize: 18, margin: 0 }}>Reports</h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
          Quick view of property manager data
        </p>
      </div>

      <nav style={{ display: 'flex', gap: 10 }}>
        <Link href="/reports" style={navLink}>
          Reports Home
        </Link>
        <Link href="/work-orders" style={navLink}>
          Work Orders
        </Link>
        <Link href="/appointments" style={navLink}>
          Appointments
        </Link>
        <Link href="/admin/lookups" style={navLink}>
          Lookups
        </Link>
      </nav>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 12, color: '#0f172a' }}>
          {userEmail ? userEmail : 'Not signed in'}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          {userRole ? `Role: ${userRole}` : ''}
        </div>
      </div>
    </header>
  );
}

const navLink: React.CSSProperties = {
  textDecoration: 'none',
  background: '#1d4ed8',
  color: '#fff',
  padding: '4px 10px',
  borderRadius: 6,
  fontSize: 12,
};
