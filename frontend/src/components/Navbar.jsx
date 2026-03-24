import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, User, Heart, LogIn, LogOut } from 'lucide-react';

const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl) return '';
    try {
        const url = new URL(envUrl);
        if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
            window.location.hostname !== url.hostname) {
            return '';
        }
        return envUrl;
    } catch (e) {
        return envUrl;
    }
};

const Navbar = ({ onViewChange, currentView }) => {
    const [user, setUser] = useState({ is_authenticated: false });
    const [counts, setCounts] = useState({ cart_count: 0, wishlist_count: 0 });
    const API_BASE_URL = getApiBaseUrl();

    const fetchUser = () => {
        fetch(`${API_BASE_URL}/api/user-status/`, {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => setUser(data))
            .catch(err => console.error('Error fetching user status:', err));
    };

    const fetchCounts = () => {
        fetch(`${API_BASE_URL}/api/counts/`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                // console.log('Fetched counts:', data);
                setCounts(data);
            })
            .catch(err => console.error('Error fetching counts:', err));
    };

    const refreshNavbar = () => {
        fetchUser();
        fetchCounts();
    };

    useEffect(() => {
        refreshNavbar();
        window.addEventListener('user-login-success', refreshNavbar);
        return () => window.removeEventListener('user-login-success', refreshNavbar);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Shop', onClick: () => onViewChange('shop'), active: currentView === 'shop' },
        { name: 'Categories', href: '#' },
        { name: 'About', href: '#' },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="navbar"
            style={{
                position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0,0,0,0.05)', height: 'var(--header-height)'
            }}
        >
            <div className="nav-container" style={{
                maxWidth: '1400px', margin: '0 auto', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px'
            }}>
                <div className="nav-logo" style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-1px' }}>
                    <a href="/" onClick={(e) => { e.preventDefault(); onViewChange('shop'); }} style={{ color: '#1a1a1a', textDecoration: 'none' }}>
                        KIDO<span style={{ color: '#717fe0' }}>COUTURE</span>
                    </a>
                </div>

                <div className="nav-links" style={{ display: 'flex', gap: '35px' }}>
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href || '#'}
                            onClick={(e) => { if (link.onClick) { e.preventDefault(); link.onClick(); } }}
                            className={`nav-link ${link.active ? 'active' : ''}`}
                            style={{
                                textDecoration: 'none', color: link.active ? '#717fe0' : '#444',
                                fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.3s',
                                cursor: 'pointer'
                            }}
                        >
                            {link.name}
                        </a>
                    ))}
                </div>

                <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button className="nav-icon-btn"><Search size={22} /></button>
                    <button
                        className={`nav-icon-btn ${currentView === 'wishlist' ? 'active' : ''}`}
                        onClick={() => onViewChange('wishlist')}
                        style={{ color: currentView === 'wishlist' ? '#717fe0' : 'inherit' }}
                    >
                        <Heart size={22} />
                        {counts.wishlist_count > 0 && <span className="badge">{counts.wishlist_count}</span>}
                    </button>
                    <button
                        className={`nav-icon-btn ${currentView === 'cart' ? 'active' : ''}`}
                        onClick={() => onViewChange('cart')}
                        style={{ color: currentView === 'cart' ? '#717fe0' : 'inherit' }}
                    >
                        <ShoppingBag size={22} />
                        {counts.cart_count > 0 && <span className="badge primary">{counts.cart_count}</span>}
                    </button>

                    <div style={{ padding: '0 10px', height: '24px', width: '1px', background: '#eee' }}></div>

                    {user.is_authenticated ? (
                        <div style={{ position: 'relative' }} className="user-dropdown-container">
                            <div
                                onClick={() => onViewChange('profile')}
                                className="nav-user-profile pointer trans-04"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '5px 15px', borderRadius: '20px',
                                    background: currentView === 'profile' ? 'rgba(113, 127, 224, 0.1)' : 'transparent',
                                    border: currentView === 'profile' ? '1px solid #717fe0' : '1px solid transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: '#717fe0', color: 'white', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                }}>
                                    {user.username ? user.username[0].toUpperCase() : <User size={16} />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '0.9rem', color: currentView === 'profile' ? '#717fe0' : '#1a1a1a', fontWeight: '600' }}>{user.username}</span>
                                </div>
                            </div>

                            {/* Dropdown Menu */}
                            <div className="user-dropdown-menu" style={{
                                position: 'absolute', top: '100%', right: 0, 
                                background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                border: '1px solid #eee', minWidth: '180px', overflow: 'hidden',
                                display: 'none', zIndex: 1001,
                                paddingTop: '5px' // Add a small internal gap instead of external margin
                            }}>

                                <div style={{ padding: '15px', borderBottom: '1px solid #f5f5f5' }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Logged in as</p>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: '#1a1a1a' }}>{user.username}</p>
                                </div>
                                
                                {user.is_superuser && (
                                    <a href={`${API_BASE_URL}/admin_home`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', color: '#1a1a1a', textDecoration: 'none', fontSize: '0.9rem', transition: 'background 0.2s' }} className="dropdown-item-hover">
                                        <Search size={16} /> Admin Dashboard
                                    </a>
                                )}

                                
                                <div onClick={() => onViewChange('profile')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', color: '#1a1a1a', textDecoration: 'none', fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s' }} className="dropdown-item-hover">
                                    <User size={16} /> My Profile
                                </div>
                                
                                <a href={`${API_BASE_URL}/logout_user/`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', color: '#ff4757', textDecoration: 'none', fontSize: '0.9rem', borderTop: '1px solid #f5f5f5', transition: 'background 0.2s' }} className="dropdown-item-hover">
                                    <LogOut size={16} /> Logout
                                </a>
                            </div>

                            <style>{`
                                .user-dropdown-container:hover .user-dropdown-menu {
                                    display: block !important;
                                }
                                .dropdown-item-hover:hover {
                                    background: #f8f9ff;
                                }
                            `}</style>
                        </div>
                    ) : (
                        <button
                            onClick={() => onViewChange('auth')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: '#1a1a1a', color: 'white', padding: '10px 22px', border: 'none',
                                borderRadius: '30px', textDecoration: 'none', fontSize: '0.9rem',
                                fontWeight: '600', transition: 'all 0.3s', cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#717fe0'}
                            onMouseOut={(e) => e.target.style.background = '#1a1a1a'}
                        >
                            <LogIn size={18} />
                            SIGN IN
                        </button>
                    )}
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
