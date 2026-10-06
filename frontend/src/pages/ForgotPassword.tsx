import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { Mail, ArrowLeft, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { useDocumentTitle } from '../utils/useDocumentTitle';

type Step = 'email' | 'otp' | 'reset';

const ForgotPassword = () => {
    useDocumentTitle('Forgot Password');
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const navigate = useNavigate();
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (resendTimer > 0) {
            const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendTimer]);

    const token = localStorage.getItem('token');
    if (token) return <Navigate to="/" replace />;

    const handleSendOtp = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email }, { timeout: 60000 });
            setStep('otp');
            setResendTimer(60);
            setSuccess('OTP sent to your email');
        } catch (err: any) {
            setError(err.response?.data?.error || (err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : 'Failed to send OTP'));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (value && !/^\d$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            otpRefs.current[5]?.focus();
        }
    };

    const handleVerifyOtp = async (e: FormEvent) => {
        e.preventDefault();
        const otpStr = otp.join('');
        if (otpStr.length !== 6) { setError('Please enter the complete OTP'); return; }
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/verify-otp`, { email, otp: otpStr });
            setStep('reset');
            setSuccess('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault();
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/reset-password`, { email, otp: otp.join(''), password });
            setSuccess('Password reset successfully!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email }, { timeout: 60000 });
            setOtp(['', '', '', '', '', '']);
            setResendTimer(60);
            setSuccess('New OTP sent to your email');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        padding: '0.8rem',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        outline: 'none',
        fontSize: '15px',
        width: '100%',
        boxSizing: 'border-box'
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', padding: '1rem', background: 'var(--bg-primary)', position: 'relative' }}>
            <div style={{ width: '100%', maxWidth: '380px', padding: '1.75rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}>
                <Link to="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem', textDecoration: 'none' }} title="Back to Home">
                    <img src="/logo.png" alt="ViewTube Logo" style={{ height: '46px', objectFit: 'contain' }} />
                </Link>

                <h2 style={{ textAlign: 'center', marginBottom: '0.3rem', fontSize: '18px', fontWeight: '700' }}>
                    {step === 'email' && 'Forgot Password'}
                    {step === 'otp' && 'Verify OTP'}
                    {step === 'reset' && 'Reset Password'}
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '1rem' }}>
                    {step === 'email' && 'Enter your email to receive a verification code'}
                    {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
                    {step === 'reset' && 'Create your new password'}
                </p>

                {error && <div style={{ color: '#ff4444', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,0,0,0.1)', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}>{error}</div>}
                {success && <div style={{ color: '#4ade80', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(74,222,128,0.1)', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}>{success}</div>}

                {step === 'email' && (
                    <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" style={{ ...inputStyle, padding: '0.6rem 0.8rem 0.6rem 38px', borderRadius: '6px', fontSize: '14px' }} />
                        </div>
                        <button type="submit" disabled={loading} style={{ padding: '0.65rem', background: loading ? '#555' : '#ff0000', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '0.3rem' }}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} onPaste={handleOtpPaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    style={{
                                        width: '42px', height: '48px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold',
                                        borderRadius: '8px', border: digit ? '2px solid #ff0000' : '1px solid var(--border)',
                                        background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                            ))}
                        </div>
                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.65rem', background: loading ? '#555' : '#ff0000', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button type="button" onClick={handleResend} disabled={resendTimer > 0 || loading} style={{ background: 'transparent', border: 'none', color: resendTimer > 0 ? 'var(--text-secondary)' : '#3ea6ff', cursor: resendTimer > 0 ? 'default' : 'pointer', fontSize: '13px' }}>
                            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                        </button>
                    </form>
                )}

                {step === 'reset' && (
                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="New password"
                                minLength={6}
                                style={{ ...inputStyle, padding: '0.6rem 2.4rem 0.6rem 38px', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
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
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Confirm new password"
                                minLength={6}
                                style={{ ...inputStyle, padding: '0.6rem 2.4rem 0.6rem 38px', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button type="submit" disabled={loading} style={{ padding: '0.65rem', background: loading ? '#555' : '#ff0000', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '0.3rem' }}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link to="/login" style={{ color: '#3ea6ff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                        <ArrowLeft size={15} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
