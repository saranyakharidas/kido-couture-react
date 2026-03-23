import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, Plus, Minus, Tag, CreditCard, ChevronRight } from 'lucide-react';

const Cart = ({ API_BASE_URL, getImageUrl, onBackToShop, triggerPopup }) => {
    const [cart, setCart] = useState(null);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchCart = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/cart/`, {
                credentials: 'include'
            });
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

    useEffect(() => {
        fetchCart();
    }, []);

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
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    const removeItem = async (itemId) => {
        setProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/cart/remove/${itemId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include'
            });
            if (response.ok) await fetchCart();
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
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
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    const removeCoupon = async () => {
        setProcessing(true);
        try {
            await fetch(`${API_BASE_URL}/api/cart/remove-coupon/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include'
            });
            await fetchCart();
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="premium-loader"></div>
        </div>
    );

    if (!cart || cart.items.length === 0) return (
        <div className="text-center p-t-100 p-b-100">
            <ShoppingBag size={64} className="m-b-20" style={{ color: '#eee', margin: '0 auto' }} />
            <h2 className="mtext-105 cl2">Your cart is empty</h2>
            <button onClick={onBackToShop} className="m-t-30 flex-c-m stext-101 cl0 size-101 bg1 bor1 hov-btn1 p-lr-15 trans-04" style={{ margin: '30px auto' }}>
                START SHOPPING
            </button>
        </div>
    );

    const subtotal = parseFloat(cart.subtotal);
    const discount = cart.applied_coupon ? parseFloat(cart.applied_coupon.discount_price) : 0;
    const total = subtotal - discount;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="cart-page p-t-40">
            <div className="header-section text-center m-b-60">
                <h1 className="section-title">Your Shopping Cart</h1>
                <p className="section-subtitle">REVIEW YOUR ITEMS AND CHECKOUT</p>
            </div>

            <div className="row">
                {/* Items List */}
                <div className="col-lg-8 p-b-50">
                    <div className="cart-items-container bg0 p-30 bor10">
                        <div className="flex-w flex-sb-m p-b-20 border-b m-b-20">
                            <span className="stext-101 cl2" style={{ width: '40%' }}>Product</span>
                            <span className="stext-101 cl2 txt-center" style={{ width: '20%' }}>Price</span>
                            <span className="stext-101 cl2 txt-center" style={{ width: '20%' }}>Quantity</span>
                            <span className="stext-101 cl2 txt-right" style={{ width: '20%' }}>Total</span>
                        </div>

                        <AnimatePresence>
                            {cart.items.map(item => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    exit={{ opacity: 0, x: -50 }}
                                    className="flex-w flex-sb-m p-tb-20 border-b"
                                >
                                    <div className="flex-w flex-m" style={{ width: '40%' }}>
                                        <div className="how-itemcart1 m-r-20" onClick={() => removeItem(item.id)}>
                                            <img src={getImageUrl(item.product.variant_image)} alt="IMG" style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                                        </div>
                                        <div className="item-info">
                                            <span className="stext-104 cl4 js-name-b2 p-b-6">{item.product.title}</span>
                                            <div className="stext-102 cl6" style={{ fontSize: '0.8rem' }}>
                                                {item.product.color_name} | {item.product.size_name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="stext-101 cl2 txt-center" style={{ width: '20%' }}>₹{Math.round(item.price)}</div>

                                    <div className="flex-w flex-c-m" style={{ width: '20%' }}>
                                        <div className="wrap-num-product flex-w bor8" style={{ height: '35px', borderRadius: '18px', overflow: 'hidden' }}>
                                            <div className="btn-num-product-down cl8 hov-btn3 trans-04 flex-c-m" style={{ width: '30px', cursor: 'pointer' }} onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                <Minus size={12} />
                                            </div>
                                            <input className="mtext-104 cl3 txt-center num-product" type="number" value={item.quantity} readOnly style={{ width: '30px', border: 'none' }} />
                                            <div className="btn-num-product-up cl8 hov-btn3 trans-04 flex-c-m" style={{ width: '30px', cursor: 'pointer' }} onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                <Plus size={12} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="stext-101 cl2 txt-right" style={{ width: '20%' }}>₹{Math.round(item.item_total)}</div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <div className="flex-w flex-sb-m p-t-25">
                            <div className="flex-w flex-m m-r-20 m-tb-5">
                                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="stext-104 cl2 plh4 size-117 bor13 p-lr-20 m-r-10 m-tb-5" type="text" name="coupon" placeholder="Coupon Code" />
                                <button onClick={applyCoupon} className="flex-c-m stext-101 cl2 size-118 bg8 bor13 hov-btn3 p-lr-15 trans-04 pointer m-tb-5">
                                    Apply Coupon
                                </button>
                            </div>
                            <button onClick={onBackToShop} className="flex-c-m stext-101 cl2 size-119 bg8 bor13 hov-btn3 p-lr-15 trans-04 pointer m-tb-10">
                                Update Cart
                            </button>
                        </div>
                    </div>
                </div>

                {/* Totals Section */}
                <div className="col-lg-4 p-b-50">
                    <div className="bor10 p-lr-40 p-t-30 p-b-40 m-l-63 m-lr-0-xl">
                        <h4 className="mtext-109 cl2 p-b-30">Cart Totals</h4>

                        <div className="flex-w flex-t bor12 p-b-13">
                            <div className="size-208">
                                <span className="stext-110 cl2">Subtotal:</span>
                            </div>
                            <div className="size-209">
                                <span className="mtext-110 cl2">₹{Math.round(subtotal)}</span>
                            </div>
                        </div>

                        {cart.applied_coupon && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex-w flex-t bor12 p-tb-13">
                                <div className="size-208 flex-w flex-m">
                                    <Tag size={14} className="m-r-5" color="#717fe0" />
                                    <span className="stext-110 cl2">Coupon ({cart.applied_coupon.coupon_code}):</span>
                                </div>
                                <div className="size-209 flex-w flex-sb-m">
                                    <span className="mtext-110 cl1" style={{ color: '#717fe0' }}>-₹{discount}</span>
                                    <Trash2 size={16} className="pointer hov-cl1" color="#ff4d4f" onClick={removeCoupon} />
                                </div>
                            </motion.div>
                        )}

                        <div className="flex-w flex-t p-t-27 p-b-33">
                            <div className="size-208">
                                <span className="mtext-101 cl2">Total:</span>
                            </div>
                            <div className="size-209 p-t-1">
                                <span className="mtext-110 cl2" style={{ fontSize: '1.5rem', fontWeight: '800' }}>₹{Math.round(total)}</span>
                            </div>
                        </div>

                        <button className="flex-c-m stext-101 cl0 size-116 bg3 bor14 hov-btn3 p-lr-15 trans-04 pointer m-b-20" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'checkout' }))}>
                            PROCEED TO CHECKOUT
                        </button>

                        <div className="flex-w flex-m p-t-10">
                            <CreditCard size={18} className="m-r-10" color="#888" />
                            <span className="stext-102 cl6">Secure Checkout Guaranteed</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Show Available Coupons */}
            <div className="m-t-50">
                <h3 className="stext-101 cl2 m-b-20">Available Offers</h3>
                <div className="row">
                    {coupons.map(coupon => (
                        <div key={coupon.id} className="col-md-4 p-b-20">
                            <div className="bg0 p-20 bor10 flex-w flex-sb-m" style={{ border: '2px dashed #717fe0', background: 'rgba(113, 127, 224, 0.05)' }}>
                                <div>
                                    <div className="stext-101 cl2 font-weight-bold">{coupon.coupon_code}</div>
                                    <div className="stext-102 cl6">Save ₹{coupon.discount_price} on orders above ₹{coupon.mininum_amount}</div>
                                </div>
                                <button onClick={() => setCouponCode(coupon.coupon_code)} className="stext-101 cl1 hov-cl1 trans-04">COPY</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default Cart;
