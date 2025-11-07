'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        setMessage('Login successful! Redirecting...');
        window.location.href = '/work-orders';
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        setMessage('Signup successful! Check your email for verification.');
    };

    return (
        <div
            style={{
                display: 'flex',
                minHeight: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f1f5f9',
            }}
        >
            <div
                style={{
                    background: '#fff',
                    padding: 32,
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    width: 360,
                }}
            >
                <h1 style={{ fontSize: 22, marginBottom: 16, textAlign: 'center' }}>Login</h1>
                <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 13 }}>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 8,
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 13 }}>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 8,
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        {loading ? 'Logging in…' : 'Login'}
                    </button>
                    <button
                        onClick={handleSignup}
                        type="button"
                        style={{
                            background: '#fff',
                            color: '#2563eb',
                            border: '1px solid #2563eb',
                            borderRadius: 6,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        Create Account
                    </button>
                </form>

                {message && (
                    <p
                        style={{
                            marginTop: 12,
                            fontSize: 13,
                            color: message.includes('successful') ? '#16a34a' : '#b91c1c',
                            textAlign: 'center',
                        }}
                    >
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
