import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, Plus, Minus, Tag, CreditCard, ChevronRight, Gift, ShieldCheck, ArrowLeft } from 'lucide-react';

const Cart = ({ API_BASE_URL, getImageUrl, onBackToShop, triggerPopup }) => {
    const [cart, setCart] = useState(null);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [processing, setProcessing] = useState(false);
    const [couponFocused, setCouponFocused] = useState(false);

    const fetchCart = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/cart/`, { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to fetch cart');
            const data = await response.json();
            setCart(data.cart);
            setCoupons(data.available_coupons);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCart(); }, []);

    const updateQuantity = async (itemId, newQty) => {
        if (newQty < 1) return;
        setProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/cart/update-quantity/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include',
                body: JSON.stringify({ item_id: itemId, quantity: newQty })
            });
            if (response.ok) await fetchCart();
            else {
                const data = await response.json();
                triggerPopup(data.error || 'Failed to update quantity', 'error');
            }
        } catch (err) { console.error(err); }
        finally { setProcessing(false); }
    };

    const removeItem = async (itemId) => {
        setProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/cart/remove/${itemId}/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || '' },
                credentials: 'include'
            });
            if (response.ok) await fetchCart();
        } catch (err) { console.error(err); }
        finally { setProcessing(false); }
    };

    const applyCoupon = async () => {
        if (!couponCode) return;
        setProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/cart/apply-coupon/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include',
                body: JSON.stringify({ coupon_code: couponCode })
            });
            const data = await response.json();
            if (response.ok) {
                await fetchCart();
                setCouponCode('');
                triggerPopup('Coupon applied successfully!', 'success');
            } else {
                triggerPopup(data.error || 'Invalid coupon', 'error');
            }
        } catch (err) { console.error(err); }
        finally { setProcessing(false); }
    };

    const removeCoupon = async () => {
        setProcessing(true);
        try {
            await fetch(`${API_BASE_URL}/api/cart/remove-coupon/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || '' },
                credentials: 'include'
            });
            await fetchCart();
        } catch (err) { console.error(err); }
        finally { setProcessing(false); }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="premium-loader"></div>
        </div>
    );

    if (!cart || cart.items.length === 0) return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '120px 20px' }}
        >
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                style={{ display: 'inline-block', marginBottom: '30px' }}
            >
                <ShoppingBag size={80} style={{ color: '#e0e0e0' }} />
            </motion.div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: '#1a1a1a', marginBottom: '12px' }}>Your cart is empty</h2>
            <p style={{ color: '#aaa', fontSize: '1.05rem', marginBottom: '40px' }}>Looks like you haven't added anything yet.</p>
            <motion.button
                whileHover={{ scale: 1.04, backgroundColor: '#5b67c4' }}
                whileTap={{ scale: 0.97 }}
                onClick={onBackToShop}
                style={{
                    background: '#717fe0', color: 'white', border: 'none',
                    borderRadius: '40px', padding: '18px 50px', fontWeight: '700',
                    fontSize: '1rem', cursor: 'pointer', letterSpacing: '2px',
                    textTransform: 'uppercase', boxShadow: '0 15px 35px rgba(113,127,224,0.3)'
                }}
            >
                Start Shopping
            </motion.button>
        </motion.div>
    );

    const subtotal = parseFloat(cart.subtotal);
    const discount = cart.applied_coupon ? parseFloat(cart.applied_coupon.discount_price) : 0;
    const total = subtotal - discount;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingTop: '40px', paddingBottom: '80px' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <p style={{ color: '#717fe0', fontWeight: '700', letterSpacing: '3px', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your bag
                </p>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', color: '#1a1a1a', margin: 0 }}>
                    Shopping Cart
                </h1>
                <button
                    onClick={onBackToShop}
                    style={{ marginTop: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                    <ArrowLeft size={14} /> Continue Shopping
                </button>
            </div>

            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                {/* LEFT: Cart Items */}
                <div style={{ flex: '1 1 560px' }}>
                    {/* Column Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '16px', padding: '0 20px 16px', borderBottom: '2px solid #f5f5f5', marginBottom: '8px' }}>
                        {['Product', 'Price', 'Quantity', 'Total'].map(h => (
                            <span key={h} style={{ fontSize: '0.7rem', fontWeight: '800', color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', textAlign: h !== 'Product' ? 'center' : 'left' }}>
                                {h}
                            </span>
                        ))}
                    </div>

                    {/* Items */}
                    <AnimatePresence>
                        {cart.items.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -60, height: 0 }}
                                style={{
                                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                    gap: '16px', alignItems: 'center',
                                    padding: '20px', marginBottom: '12px',
                                    background: 'white', borderRadius: '20px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    border: '1px solid #f9f9f9',
                                    transition: 'box-shadow 0.2s',
                                    opacity: processing ? 0.7 : 1
                                }}
                            >
                                {/* Product Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div style={{ width: '72px', height: '90px', borderRadius: '14px', overflow: 'hidden', background: '#f5f5f7' }}>
                                            <img
                                                src={getImageUrl(item.product.variant_image)}
                                                alt={item.product.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.15 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => triggerPopup('Remove this item from cart?', 'warning', () => removeItem(item.id), true)}
                                            style={{
                                                position: 'absolute', top: '-8px', right: '-8px',
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: '#ff4d4f', border: 'none', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(255,77,79,0.4)'
                                            }}
                                        >
                                            <Trash2 size={11} color="white" />
                                        </motion.button>
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: '700', color: '#1a1a1a', fontSize: '0.95rem', marginBottom: '5px', lineHeight: 1.3 }}>
                                            {item.product.title}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: '#bbb', fontWeight: '500' }}>
                                            {item.product.color_name} · {item.product.size_name}
                                        </p>
                                    </div>
                                </div>

                                {/* Price */}
                                <p style={{ textAlign: 'center', fontWeight: '600', color: '#555', fontSize: '0.95rem' }}>
                                    ₹{Math.round(item.price)}
                                </p>

                                {/* Quantity */}
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #efefef', borderRadius: '30px', padding: '4px', background: '#fafafa' }}>
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}
                                        >
                                            <Minus size={13} />
                                        </motion.button>
                                        <span style={{ width: '32px', textAlign: 'center', fontWeight: '700', fontSize: '0.95rem', color: '#1a1a1a', userSelect: 'none' }}>
                                            {item.quantity}
                                        </span>
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}
                                        >
                                            <Plus size={13} />
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Item Total */}
                                <p style={{ textAlign: 'center', fontWeight: '800', color: '#717fe0', fontSize: '1rem' }}>
                                    ₹{Math.round(item.item_total)}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Coupon Section */}
                    <div style={{ marginTop: '30px', background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f9f9f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                            <Tag size={18} color="#717fe0" />
                            <span style={{ fontWeight: '700', color: '#1a1a1a', fontSize: '0.95rem' }}>Apply Coupon</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    value={couponCode}
                                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                    onFocus={() => setCouponFocused(true)}
                                    onBlur={() => setCouponFocused(false)}
                                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                                    placeholder="Enter coupon code"
                                    style={{
                                        width: '100%', padding: '14px 20px',
                                        borderRadius: '14px', border: `2px solid ${couponFocused ? '#717fe0' : '#f0f0f0'}`,
                                        outline: 'none', fontSize: '0.95rem', fontWeight: '600',
                                        background: '#fafafa', letterSpacing: '1px',
                                        transition: 'border-color 0.2s', boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={applyCoupon}
                                style={{
                                    padding: '14px 28px', background: '#717fe0', color: 'white',
                                    border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer',
                                    fontSize: '0.9rem', letterSpacing: '1px', whiteSpace: 'nowrap',
                                    boxShadow: '0 8px 20px rgba(113,127,224,0.3)'
                                }}
                            >
                                Apply
                            </motion.button>
                        </div>
                    </div>

                    {/* Available Offers */}
                    {coupons.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                            <p style={{ fontWeight: '700', color: '#1a1a1a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Gift size={16} color="#717fe0" /> Available Offers
                            </p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {coupons.map(coupon => (
                                    <motion.div
                                        key={coupon.id}
                                        whileHover={{ y: -3, boxShadow: '0 12px 30px rgba(113,127,224,0.15)' }}
                                        style={{
                                            background: 'white', borderRadius: '16px',
                                            padding: '16px 20px', border: '2px dashed #d4d8f5',
                                            display: 'flex', alignItems: 'center', gap: '16px',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onClick={() => setCouponCode(coupon.coupon_code)}
                                    >
                                        <div style={{ background: 'rgba(113,127,224,0.08)', padding: '10px', borderRadius: '10px' }}>
                                            <Tag size={18} color="#717fe0" />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '800', color: '#717fe0', fontSize: '0.9rem', letterSpacing: '1px' }}>
                                                {coupon.coupon_code}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '2px' }}>
                                                Save ₹{coupon.discount_price} on ₹{coupon.mininum_amount}+
                                            </p>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: '#717fe0', fontWeight: '700', marginLeft: 'auto', textTransform: 'uppercase' }}>
                                            Apply
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Order Summary */}
                <div style={{ flex: '0 0 340px', position: 'sticky', top: '100px' }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.07)', border: '1px solid #f5f5f5' }}>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#1a1a1a', marginBottom: '28px' }}>
                            Order Summary
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>Subtotal ({cart.items.length} items)</span>
                                <span style={{ fontWeight: '700', color: '#333' }}>₹{Math.round(subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>Shipping</span>
                                <span style={{ fontWeight: '700', color: '#2ecc71', fontSize: '0.85rem' }}>FREE</span>
                            </div>

                            {cart.applied_coupon && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(113,127,224,0.06)', borderRadius: '12px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Tag size={14} color="#717fe0" />
                                        <span style={{ color: '#717fe0', fontSize: '0.85rem', fontWeight: '600' }}>
                                            {cart.applied_coupon.coupon_code}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#717fe0', fontWeight: '700' }}>-₹{discount}</span>
                                        <button
                                            onClick={removeCoupon}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f', padding: '2px' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: '#f5f5f5', margin: '8px 0 24px' }} />

                        {/* Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1a1a1a' }}>Total</span>
                            <span style={{ fontWeight: '900', fontSize: '1.8rem', color: '#717fe0' }}>₹{Math.round(total)}</span>
                        </div>

                        {/* Checkout Button */}
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: '#5b67c4' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'checkout' }))}
                            style={{
                                width: '100%', padding: '20px',
                                background: '#717fe0', color: 'white', border: 'none',
                                borderRadius: '18px', fontWeight: '800', fontSize: '1rem',
                                cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase',
                                boxShadow: '0 15px 35px rgba(113,127,224,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                transition: 'all 0.3s', marginBottom: '18px'
                            }}
                        >
                            Proceed to Checkout <ChevronRight size={18} />
                        </motion.button>

                        {/* Trust Badges */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#bbb' }}>
                                <ShieldCheck size={16} color="#2ecc71" />
                                <span style={{ fontSize: '0.8rem' }}>Secure & Encrypted Checkout</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#bbb' }}>
                                <CreditCard size={16} color="#717fe0" />
                                <span style={{ fontSize: '0.8rem' }}>Multiple Payment Options</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default Cart;
