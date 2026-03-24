import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, KeyRound, Loader2, CheckCircle2, Gift } from 'lucide-react';

const AuthForms = ({ API_BASE_URL, onViewChange, onLoginSuccess, initialView = 'login' }) => {
    const [view, setView] = useState(initialView); // 'login', 'signup', 'otp', 'success'

    React.useEffect(() => {
        setView(initialView);
    }, [initialView]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        otp: '',
        referral_code: ''
    });


    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                })
            });
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                throw new Error('Server returned non-JSON response (possibly a 500 error)');
            }

            if (response.ok && data.success) {
                if (data.requires_otp) {
                    setView('otp');
                } else {
                    onLoginSuccess();
                }
            } else {
                setError(data.error || 'Invalid username or password');
            }
        } catch (err) {
            console.error(err);
            setError(`Connection Failed: ${err.message || 'Ensure backend is running'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/signup/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    confirm_password: formData.confirm_password,
                    referral_code: formData.referral_code
                })

            });
            const data = await response.json();
            if (response.ok && data.success) {
                setView('success');
            } else {
                setError(data.error || 'Signup failed');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/verify-otp/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include',
                body: JSON.stringify({ otp: formData.otp })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                onLoginSuccess();
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
    };

    return (
        <div className="auth-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 20px 80px', background: '#f8f9fa' }}>
            <div className="auth-card" style={{ width: '100%', maxWidth: '450px', background: '#fff', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <AnimatePresence mode="wait">

                    {/* LOGIN VIEW */}
                    {view === 'login' && (
                        <motion.div key="login" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ padding: '40px' }}>
                            <div className="text-center" style={{ marginBottom: '30px' }}>
                                <h3 className="mtext-111 cl2" style={{ paddingBottom: '10px' }}>Welcome Back</h3>
                                <p className="stext-102 cl6">Please enter your details to sign in.</p>
                            </div>

                            {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

                            <form onSubmit={handleLogin}>
                                <div style={{ position: 'relative', marginBottom: '20px' }}>
                                    <User size={18} style={{ position: 'absolute', top: '16px', left: '20px', color: '#999' }} />
                                    <input
                                        className="stext-102 cl2 trans-04"
                                        type="text" name="username" placeholder="Username"
                                        value={formData.username} onChange={handleInputChange} required
                                        style={{ width: '100%', paddingLeft: '50px', paddingRight: '20px', height: '50px', borderRadius: '25px', background: '#fcfcfc', border: '1px solid #e6e6e6', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ position: 'relative', marginBottom: '20px' }}>
                                    <Lock size={18} style={{ position: 'absolute', top: '16px', left: '20px', color: '#999' }} />
                                    <input
                                        className="stext-102 cl2 trans-04"
                                        type="password" name="password" placeholder="Password"
                                        value={formData.password} onChange={handleInputChange} required
                                        style={{ width: '100%', paddingLeft: '50px', paddingRight: '20px', height: '50px', borderRadius: '25px', background: '#fcfcfc', border: '1px solid #e6e6e6', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input style={{ marginRight: '10px' }} id="remember" type="checkbox" />
                                        <label className="stext-102 cl6" style={{ marginBottom: 0, cursor: 'pointer' }} htmlFor="remember">Remember me</label>
                                    </div>
                                    <a href="#" className="stext-102 cl1 hov-cl2 trans-04">Forgot Password?</a>
                                </div>

                                <button
                                    className="flex-c-m stext-101 cl0 trans-04 pointer"
                                    disabled={loading}
                                    style={{ width: '100%', height: '50px', fontSize: '1rem', background: '#717fe0', borderRadius: '25px', border: 'none', color: 'white', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'SIGN IN'}
                                </button>

                                <div style={{ textAlign: 'center' }}>
                                    <span className="stext-102 cl6">Don't have an account? </span>
                                    <button type="button" onClick={() => { setView('signup'); setError(null); }} className="stext-102" style={{ color: '#717fe0', fontWeight: 'bold', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
                                        Sign up
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* SIGNUP VIEW */}
                    {view === 'signup' && (
                        <motion.div key="signup" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ padding: '40px' }}>
                            <div className="text-center" style={{ marginBottom: '30px' }}>
                                <h3 className="mtext-111 cl2" style={{ paddingBottom: '10px' }}>Create Account</h3>
                                <p className="stext-102 cl6">Join Kido Couture today.</p>
                            </div>

                            {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

                            <form onSubmit={handleSignup}>
                                <div style={{ position: 'relative', marginBottom: '15px' }}>
                                    <User size={18} style={{ position: 'absolute', top: '16px', left: '20px', color: '#999' }} />
                                    <input
                                        className="stext-102 cl2 trans-04"
                                        type="text" name="username" placeholder="Username"
                                        value={formData.username} onChange={handleInputChange} required
                                        style={{ width: '100%', paddingLeft: '50px', paddingRight: '20px', height: '50px', borderRadius: '25px', background: '#fcfcfc', border: '1px solid #e6e6e6', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ position: 'relative', marginBottom: '15px' }}>
                                    <Mail size={18} style={{ position: 'absolute', top: '16px', left: '20px', color: '#999' }} />
                                    <input
                                        className="stext-102 cl2 trans-04"
                                        type="email" name="email" placeholder="Email Address"
                                        value={formData.email} onChange={handleInputChange} required
                                        style={{ width: '100%', paddingLeft: '50px', paddingRight: '20px', height: '50px', borderRadius: '25px', background: '#fcfcfc', border: '1px solid #e6e6e6', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ position: 'relative', marginBottom: '15px' }}>
                                    <Lock size={18} style={{ position: 'absolute', top: '16px', left: '20px', color: '#999' }} />
                                    <input
                                        className="stext-102 cl2 trans-04"
                                        type="password" name="password" placeholder="Password (Min 8 chars)"
                                        value={formData.password} onChange={handleInputChange} required
                                        style={{ width: '100%', paddingLeft: '50px', paddingRight: '20px', height: '50px', borderRadius: '25px', background: '#fcfcfc', border: '1px solid #e6e6e6', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ position: 'relative', marginBottom: '25px' }}>
                                    <Lock size={18} style={{ position: 'absolute', top: '16px', left: '20px', color: '#999' }} />
                                    <input
                                        className="stext-102 cl2 trans-04"
                                        type="password" name="confirm_password" placeholder="Confirm Password"
                                        value={formData.confirm_password} onChange={handleInputChange} required
                                        style={{ width: '100%', paddingLeft: '50px', paddingRight: '20px', height: '50px', borderRadius: '25px', background: '#fcfcfc', border: '1px solid #e6e6e6', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ position: 'relative', marginBottom: '25px' }}>
                                    <Gift size={18} style={{ position: 'absolute', top: '16px', left: '20px', color: '#999' }} />
                                    <input
                                        className="stext-102 cl2 trans-04"
                                        type="text" name="referral_code" placeholder="Referral Code (Optional)"
                                        value={formData.referral_code} onChange={handleInputChange}
                                        style={{ width: '100%', paddingLeft: '50px', paddingRight: '20px', height: '50px', borderRadius: '25px', background: '#fcfcfc', border: '1px solid #e6e6e6', outline: 'none' }}
                                    />
                                </div>


                                <button
                                    className="flex-c-m stext-101 cl0 trans-04 pointer"
                                    disabled={loading}
                                    style={{ width: '100%', height: '50px', fontSize: '1rem', background: '#1a1a1a', borderRadius: '25px', border: 'none', color: 'white', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'CREATE ACCOUNT'}
                                </button>

                                <div style={{ textAlign: 'center' }}>
                                    <span className="stext-102 cl6">Already have an account? </span>
                                    <button type="button" onClick={() => { setView('login'); setError(null); }} className="stext-102" style={{ color: '#717fe0', fontWeight: 'bold', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
                                        Sign in
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* OTP VIEW */}
                    {view === 'otp' && (
                        <motion.div key="otp" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ padding: '40px', textAlign: 'center' }}>
                            <div style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <KeyRound size={32} />
                            </div>
                            <h3 className="mtext-111 cl2" style={{ paddingBottom: '10px' }}>Verification Code</h3>
                            <p className="stext-102 cl6" style={{ marginBottom: '30px' }}>We've sent an OTP to your email address.</p>

                            {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

                            <form onSubmit={handleVerifyOtp}>
                                <input
                                    className="stext-102 cl2 trans-04"
                                    type="text" name="otp" placeholder="•••••" maxLength="5"
                                    value={formData.otp} onChange={handleInputChange} required
                                    style={{ width: '100%', padding: '0 20px', height: '60px', borderRadius: '15px', background: '#fcfcfc', border: '1px solid #e6e6e6', outline: 'none', textAlign: 'center', marginBottom: '20px', fontSize: '1.25rem', letterSpacing: '10px', fontWeight: 'bold' }}
                                />

                                <button
                                    className="flex-c-m stext-101 cl0 trans-04 pointer"
                                    disabled={loading || formData.otp.length < 5}
                                    style={{ width: '100%', height: '50px', fontSize: '1rem', background: '#717fe0', borderRadius: '25px', border: 'none', color: 'white', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>VERIFY <ArrowRight size={18} style={{ marginLeft: '10px' }} /></>}
                                </button>

                                <button type="button" onClick={() => setView('login')} className="stext-102 cl6 hov-cl2 trans-04" style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
                                    Back to Login
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* SUCCESS REGISTRATION VIEW */}
                    {view === 'success' && (
                        <motion.div key="success" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ padding: '40px', textAlign: 'center' }}>
                            <div style={{ background: '#f0fdf4', color: '#22c55e', borderRadius: '50%', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="mtext-111 cl2" style={{ paddingBottom: '10px' }}>Registration Successful!</h3>
                            <p className="stext-102 cl6" style={{ marginBottom: '30px', padding: '0 12px' }}>We have sent an activation link to your email address. Please click the link to activate your account before logging in.</p>

                            <button
                                onClick={() => setView('login')}
                                className="flex-c-m stext-101 cl0 trans-04 pointer"
                                style={{ width: '100%', height: '50px', fontSize: '1rem', background: '#1a1a1a', borderRadius: '25px', border: 'none', color: 'white', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            >
                                GO TO LOGIN
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuthForms;
