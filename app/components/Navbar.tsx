'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/supabaseClient';

export default function Navbar() {
    const [signedIn, setSignedIn] = useState(false);

    useEffect(() => {
        // Check session
        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setSignedIn(!!session);
        };
        checkSession();

        // Listen for auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSignedIn(!!session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setSignedIn(false);
    };

    return (
        <nav
            style={{
                width: '100%',
                background: '#0f172a',
                color: 'white',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
            }}
        >
            {/* LEFT SIDE MENU */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <Link
                    href="/"
                    style={{
                        fontWeight: 700,
                        fontSize: 16,
                        textDecoration: 'none',
                        color: 'white',
                    }}
                >
                    Property Manager
                </Link>

                <Link href="/properties" style={navLink}>
                    Properties
                </Link>
                <Link href="/work-orders" style={navLink}>
                    Work Orders
                </Link>
                <Link href="/appointments" style={navLink}>
                    Appointments
                </Link>
                <Link href="/inspections" style={navLink}>
                    Inspections
                </Link>
                <Link href="/showings" style={navLink}>
                    Showings
                </Link>
                <Link href="/court-dates" style={navLink}>
                    Court Dates
                </Link>
                <Link href="/at-a-glance" style={navLink}>
                    At a Glance
                </Link>

                {/* NEW MENU ITEMS */}
                <Link href="/move-ins" style={navLink}>
                    Move Ins
                </Link>
                <Link href="/move-outs" style={navLink}>
                    Move Outs
                </Link>
                <Link href="/home-depot" style={navLink}>
                    Home Depot
                </Link>
                <Link href="/open-units" style={navLink}>
                    Open Units
                </Link>

                {/* ADMIN LINK */}
                <Link href="/admin/lookups" style={navLink}>
                    Lookups
                </Link>
            </div>

            {/* RIGHT SIDE AUTH BUTTON */}
            <div style={{ display: 'flex', gap: 10 }}>
                {signedIn ? (
                    <button
                        onClick={handleSignOut}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.5)',
                            borderRadius: 4,
                            color: 'white',
                            padding: '4px 10px',
                            cursor: 'pointer',
                        }}
                    >
                        Sign Out
                    </button>
                ) : (
                    <Link
                        href="/login"
                        style={{
                            background: 'white',
                            color: '#0f172a',
                            borderRadius: 4,
                            padding: '4px 10px',
                            textDecoration: 'none',
                            fontWeight: 500,
                        }}
                    >
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}

const navLink: React.CSSProperties = {
    color: 'white',
    textDecoration: 'none',
    fontSize: 13,
    opacity: 0.9,
    whiteSpace: 'nowrap',
};
