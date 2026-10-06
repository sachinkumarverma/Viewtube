import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { supabase } from '../lib/supabase';
import { useDocumentTitle } from '../utils/useDocumentTitle';

const Login = () => {
    useDocumentTitle('Login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password,
            });

            // Save token and navigate
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/');
            window.location.reload(); // Quick way to update Navbar state
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                try {
                    const { email, user_metadata } = session.user;
                    const response = await axios.post(`${API_BASE_URL}/auth/google`, {
                        email,
                        username: user_metadata.name || email?.split('@')[0] || 'User',
                        avatar_url: user_metadata.avatar_url
                    });
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    await supabase.auth.signOut();
                    window.location.href = '/';
                } catch (err) {
                    console.error("Google Auth Sync Failed", err);
                }
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleGoogleAuth = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname }
        });
    };

    const token = localStorage.getItem('token');
    if (token) return <Navigate to="/" replace />;

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', padding: '1rem', background: 'var(--bg-primary)', position: 'relative' }}>
            <div style={{ width: '100%', maxWidth: '380px', padding: '1.75rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}>
                <Link to="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem', textDecoration: 'none' }} title="Back to Home">
                    <img src="/logo.png" alt="ViewTube Logo" style={{ height: '46px', objectFit: 'contain' }} />
                </Link>
                <h2 style={{ textAlign: 'center', marginBottom: '1.25rem', fontSize: '18px', fontWeight: '700' }}>Login to ViewTube</h2>

                {error && <div style={{ color: '#ff4444', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,0,0,0.1)', borderRadius: '6px', fontSize: '13px' }}>{error}</div>}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label htmlFor="email" style={{ fontSize: '13px', fontWeight: '500' }}>Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label htmlFor="password" style={{ fontSize: '13px', fontWeight: '500' }}>Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 2.4rem 0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary, #888)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ padding: '0.65rem', background: loading ? '#555' : '#ff0000', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '0.4rem' }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                    <Link to="/forgot-password" style={{ color: '#3ea6ff', textDecoration: 'none', fontSize: '13px' }}>Forgot Password?</Link>
                </div>

                <div style={{ textAlign: 'center', margin: '0.8rem 0', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>OR</div>
                <button
                    type="button"
                    onClick={handleGoogleAuth}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
                    Continue with Google
                </button>

                <p style={{ textAlign: 'center', marginTop: '1rem', color: '#aaa', fontSize: '13px', marginBottom: 0 }}>
                    Don't have an account? <Link to="/register" style={{ color: '#3ea6ff', textDecoration: 'none', fontWeight: '600' }}>Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
