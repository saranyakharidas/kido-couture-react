import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CreditCard, ShoppingBag, ShieldCheck, ChevronRight, CheckCircle2, X } from 'lucide-react';

const Checkout = ({ API_BASE_URL, getImageUrl, onBackToCart, onOrderSuccess, triggerPopup }) => {
    const [checkoutData, setCheckoutData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
    const [processing, setProcessing] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        first_name: '', last_name: '', email: '', phone_number: '',
        address_line_1: '', address_line_2: '', city: '',
        state: '', postal_code: '', country: 'India'
    });

    const fetchCheckoutDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/checkout/`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setCheckoutData(data);
                if (data.addresses && data.addresses.length > 0 && !selectedAddress) {
                    setSelectedAddress(data.addresses[0].id);
                }
            } else {
                setError(data.error || 'Failed to fetch checkout details');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCheckoutDetails();
        window.scrollTo(0, 0);
    }, [API_BASE_URL]);

    const handleAddAddress = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/add-address/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include',
                body: JSON.stringify(newAddress)
            });
            const data = await response.json();
            if (data.success) {
                await fetchCheckoutDetails();
                setShowAddressForm(false);
                setSelectedAddress(data.address.id);
                setNewAddress({
                    first_name: '', last_name: '', email: '', phone_number: '',
                    address_line_1: '', address_line_2: '', city: '',
                    state: '', postal_code: '', country: 'India'
                });
                triggerPopup('Address added successfully!', 'success');
            } else {
                triggerPopup(data.error || 'Failed to add address', 'error');
            }
        } catch (err) {
            triggerPopup('Error adding address', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            triggerPopup('Please select a delivery address', 'warning');
            return;
        }

        if (paymentMethod === 'RAZORPAY') {
            handleRazorpayPayment();
            return;
        }

        if (paymentMethod === 'WALLET' && checkoutData.summary.total_price > checkoutData.wallets.balance) {
            triggerPopup('Insufficient wallet balance', 'error');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/place-order/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    address_id: selectedAddress,
                    payment_method: paymentMethod
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                onOrderSuccess(data.order_id);
            } else {
                triggerPopup(data.error || 'Failed to place order', 'error');
                setProcessing(false);
            }
        } catch (err) {
            console.error(err);
            triggerPopup('Network error while placing order', 'error');
            setProcessing(false);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay && typeof window.Razorpay === 'function') {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => {
                // Poll for a few ms to ensure the constructor is attached
                let attempts = 0;
                const check = setInterval(() => {
                    if (window.Razorpay && typeof window.Razorpay === 'function') {
                        clearInterval(check);
                        resolve(true);
                    } else if (attempts > 50) { // 5 seconds
                        clearInterval(check);
                        resolve(false);
                    }
                    attempts++;
                }, 100);
            };
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleRazorpayPayment = async () => {
        setProcessing(true);
        
        // 0. Ensure script is loaded
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            triggerPopup('Razorpay SDK failed to load. Are you online?', 'error');
            setProcessing(false);
            return;
        }

        try {
            // 1. Initialize payment on server
            const response = await fetch(`${API_BASE_URL}/api/initiate_payment/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include'
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                triggerPopup(`Error ${response.status}: ${errorData?.error || 'Failed to initialize payment on server'}`, 'error');
                setProcessing(false);
                return;
            }

            const data = await response.json();
            if (data.error) {
                triggerPopup(data.error, 'error');
                setProcessing(false);
                return;
            }

            // 2. Open Razorpay checkout
            const options = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: "Kido Couture",
                description: "Secure Order Payment",
                order_id: data.order_id,
                handler: async function (response) {
                    // 3. Handle success - verify on server
                    const formData = new FormData();
                    formData.append('payment_id', response.razorpay_payment_id);
                    formData.append('orderId', response.razorpay_order_id);
                    formData.append('signature', response.razorpay_signature);

                    try {
                        const verifyRes = await fetch(`${API_BASE_URL}/api/online_payment_order/${selectedAddress}`, {
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                            },
                            credentials: 'include',
                            body: formData
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok && verifyData.orderId) {
                            onOrderSuccess(verifyData.orderId);
                        } else {
                            triggerPopup(verifyData.error || 'Payment verification failed', 'error');
                        }
                    } catch (err) {
                        triggerPopup('Error finalizing order', 'error');
                    } finally {
                        setProcessing(false);
                    }
                },
                prefill: {
                    name: `${checkoutData.addresses.find(a => a.id === selectedAddress)?.first_name} ${checkoutData.addresses.find(a => a.id === selectedAddress)?.last_name}`,
                    email: checkoutData.addresses.find(a => a.id === selectedAddress)?.email,
                    contact: checkoutData.addresses.find(a => a.id === selectedAddress)?.phone_number
                },
                theme: { color: "#717fe0" },
                modal: {
                    ondismiss: function() {
                        setProcessing(false);
                    }
                }
            };

            console.log('Razorpay object type:', typeof window.Razorpay);
            console.log('Razorpay object value:', window.Razorpay);
            
            let RazorpayConstructor = window.Razorpay;
            
            // Check if it's nested (sometimes happens with certain loaders)
            if (typeof RazorpayConstructor !== 'function' && RazorpayConstructor && typeof RazorpayConstructor.default === 'function') {
                console.log('Found Razorpay in .default');
                RazorpayConstructor = RazorpayConstructor.default;
            }

            if (typeof RazorpayConstructor !== 'function') {
                console.error('Razorpay is not a function/constructor:', RazorpayConstructor);
                triggerPopup(`Error: razorpay.js is loaded but Razorpay constructor is ${typeof RazorpayConstructor}. Please check for conflicts.`, 'error');
                setProcessing(false);
                return;
            }

            try {
                const rzp = new RazorpayConstructor(options);
                rzp.open();
            } catch (constrError) {
                console.error('Constructor call failed:', constrError);
                // Fallback attempt if it's an object with a constructor method? Unlikely but let's be safe.
                if (RazorpayConstructor.Razorpay) {
                    const rzp = new RazorpayConstructor.Razorpay(options);
                    rzp.open();
                } else {
                    throw constrError;
                }
            }

        } catch (err) {
            console.error('Razorpay initiation error:', err);
            triggerPopup(`Failed to initiate payment: ${err.message}`, 'error');
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="premium-loader"></div>
        </div>
    );

    if (error) return (
        <div className="text-center p-t-100 p-b-100">
            <h2 className="text-red-500 m-b-20">{error}</h2>
            <button onClick={onBackToCart} className="stext-101 cl0 bg1 bor1 hov-btn1 p-lr-15 trans-04 p-tb-10">Back to Cart</button>
        </div>
    );

    const { cart, addresses, wallets, summary } = checkoutData;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="checkout-page p-t-40 p-b-80">
            {/* Breadcrumb */}
            <div className="bread-crumb flex-w m-b-40">
                <span className="cursor-pointer stext-109 cl8 hov-cl1 trans-04" onClick={onBackToCart}>
                    Cart <ChevronRight size={14} className="inline m-l-5 m-r-5" />
                </span>
                <span className="stext-109 cl4">Checkout</span>
            </div>

            <div className="header-section text-center m-b-50">
                <h1 className="section-title">Secure Checkout</h1>
                <p className="section-subtitle">ALMOST THERE! COMPLETE YOUR ORDER</p>
            </div>

            <div className="row">
                {/* Left side: Address & Payment Info */}
                <div className="col-lg-7 col-xl-8 p-b-50">
                    <div className="checkout-details-wrap bg0 p-40 bor10 m-r-20 m-r-0-lg">

                        {/* 1. Address Section */}
                        <div className="m-b-50">
                            <div className="flex-w flex-m m-b-25">
                                <span className="bg1 text-white flex-c-m rounded-full mr-3" style={{ width: '32px', height: '32px', fontWeight: 'bold' }}>1</span>
                                <h4 className="mtext-109 cl2">Delivery Address</h4>
                            </div>

                            {addresses.length === 0 ? (
                                <div className="p-30 bg-gray-50 bor10 text-center">
                                    <p className="stext-102 cl6 m-b-20">You don't have any saved addresses.</p>
                                    <button 
                                        onClick={() => setShowAddressForm(true)}
                                        className="flex-c-m stext-101 cl2 size-118 bg8 bor13 hov-btn3 p-lr-15 trans-04 pointer mx-auto"
                                    >
                                        + Add New Address
                                    </button>
                                </div>
                            ) : (
                                    <div className="address-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                        {addresses.map(addr => (
                                            <motion.div
                                                key={addr.id}
                                                whileHover={{ y: -3 }}
                                                onClick={() => setSelectedAddress(addr.id)}
                                                className={`address-card p-25 bor10 pointer transition-all`}
                                                style={{
                                                    border: '1px solid',
                                                    borderColor: selectedAddress === addr.id ? 'transparent' : '#eee',
                                                    background: selectedAddress === addr.id ? '#fafaff' : 'white',
                                                    boxShadow: selectedAddress === addr.id ? '0 12px 30px rgba(113, 127, 224, 0.15)' : '0 2px 10px rgba(0,0,0,0.02)',
                                                    position: 'relative',
                                                    transform: selectedAddress === addr.id ? 'scale(1.02)' : 'scale(1)',
                                                    zIndex: selectedAddress === addr.id ? 10 : 1
                                                }}
                                            >
                                                <div className="flex-w flex-sb-m m-b-15">
                                                    <span className="mtext-106 cl2" style={{ fontSize: '1.25rem', fontWeight: '800', color: selectedAddress === addr.id ? '#717fe0' : '#333' }}>{addr.first_name} {addr.last_name}</span>
                                                    {selectedAddress === addr.id && (
                                                        <CheckCircle2 size={24} color="#717fe0" />
                                                    )}
                                                </div>
                                                <p className="stext-102 cl6 m-b-5">{addr.address_line_1}{addr.address_line_2 && `, ${addr.address_line_2}`}</p>
                                                <p className="stext-102 cl6 m-b-10">{addr.city}, {addr.state} - {addr.postal_code}</p>
                                                <p className="stext-102 cl6 flex-w flex-m"><MapPin size={14} className="m-r-5" /> {addr.phone_number}</p>
                                                <p className="stext-102 cl6 m-t-5">{addr.email}</p>
                                            </motion.div>
                                        ))}
                                        <motion.div
                                            whileHover={{ y: -5 }}
                                            onClick={() => setShowAddressForm(true)}
                                            className="address-card p-20 bor10 pointer transition-all flex-c-m flex-col text-center"
                                            style={{ border: '2px dashed #e6e6e6', minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <span style={{ fontSize: '2rem', color: '#ccc' }}>+</span>
                                            <span className="stext-102 cl6">Add New Address</span>
                                        </motion.div>
                                    </div>
                            )}
                        </div>

                        {/* 2. Payment Method */}
                        <div>
                            <div className="flex-w flex-m m-b-25">
                                <span className="bg1 text-white flex-c-m rounded-full mr-3" style={{ width: '32px', height: '32px', fontWeight: 'bold' }}>2</span>
                                <h4 className="mtext-109 cl2">Payment Method</h4>
                            </div>

                            <div className="payment-options" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* Online Payment - Razorpay */}
                                <div
                                    className={`payment-option p-25 bor10 pointer transition-all`}
                                    onClick={() => setPaymentMethod('RAZORPAY')}
                                    style={{ 
                                        border: paymentMethod === 'RAZORPAY' ? '1px solid #717fe0' : '1px solid #f0f0f0',
                                        background: paymentMethod === 'RAZORPAY' ? '#fcfcff' : 'white',
                                        boxShadow: paymentMethod === 'RAZORPAY' ? '0 8px 25px rgba(113, 127, 224, 0.1)' : 'none'
                                    }}
                                >
                                    <div className="flex-w flex-m">
                                        <div className="m-r-20">
                                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: paymentMethod === 'RAZORPAY' ? '6px solid #717fe0' : '2px solid #ddd', background: 'white', transition: 'all 0.3s' }}></div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="flex-w flex-sb-m">
                                                <div className="flex-w flex-m">
                                                    <span className="mtext-106 cl2 m-r-10">Online Payment</span>
                                                    <span style={{ fontSize: '9px', background: '#ecf0ff', color: '#717fe0', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>RECOMMENDED</span>
                                                </div>
                                                <div className="flex-w flex-m">
                                                    <img src="https://checkout.razorpay.com/v1/checkout.js" alt="" style={{ display: 'none' }} onError={(e) => e.target.style.display='none'} />
                                                    <span className="stext-102 cl6" style={{ fontSize: '10px', opacity: 0.6 }}>Razorpay Secure</span>
                                                </div>
                                            </div>
                                            <p className="stext-102 cl6 m-t-5">UPI, Cards, Wallets or NetBanking.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet Payment */}
                                <div
                                    className={`payment-option p-25 bor10 pointer transition-all ${wallets.balance < summary.total_price ? 'opacity-50 grayscale' : ''}`}
                                    onClick={() => { if (wallets.balance >= summary.total_price) setPaymentMethod('WALLET') }}
                                    style={{ 
                                        border: paymentMethod === 'WALLET' ? '1px solid #717fe0' : '1px solid #f0f0f0',
                                        background: paymentMethod === 'WALLET' ? '#fcfcff' : 'white',
                                        boxShadow: paymentMethod === 'WALLET' ? '0 8px 25px rgba(113, 127, 224, 0.1)' : 'none'
                                    }}
                                >
                                    <div className="flex-w flex-m">
                                        <div className="m-r-20">
                                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: paymentMethod === 'WALLET' ? '6px solid #717fe0' : '2px solid #ddd', background: 'white', transition: 'all 0.3s' }}></div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="flex-w flex-sb-m">
                                                <span className="mtext-106 cl2">My Wallet Balance</span>
                                                <span className="mtext-106 cl1" style={{ fontWeight: '800' }}>₹{Math.round(wallets.balance)}</span>
                                            </div>
                                            <p className="stext-102 cl6 m-t-5">Use your available account credit.</p>
                                            {wallets.balance < summary.total_price && (
                                                <p className="m-t-5" style={{ color: '#ff4d4f', fontSize: '11px', fontWeight: '500' }}>
                                                    Short by ₹{Math.round(summary.total_price - wallets.balance)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Cash on Delivery */}
                                <div
                                    className={`payment-option p-25 bor10 pointer transition-all`}
                                    onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                                    style={{ 
                                        border: paymentMethod === 'CASH_ON_DELIVERY' ? '1px solid #717fe0' : '1px solid #f0f0f0',
                                        background: paymentMethod === 'CASH_ON_DELIVERY' ? '#fcfcff' : 'white',
                                        boxShadow: paymentMethod === 'CASH_ON_DELIVERY' ? '0 8px 25px rgba(113, 127, 224, 0.1)' : 'none'
                                    }}
                                >
                                    <div className="flex-w flex-m">
                                        <div className="m-r-20">
                                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: paymentMethod === 'CASH_ON_DELIVERY' ? '6px solid #717fe0' : '2px solid #ddd', background: 'white', transition: 'all 0.3s' }}></div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="flex-w flex-sb-m">
                                                <span className="mtext-106 cl2">Cash on Delivery</span>
                                                <span className="stext-112 cl6" style={{ fontSize: '10px', background: '#f5f5f5', padding: '2px 8px', borderRadius: '10px' }}>STANDARD</span>
                                            </div>
                                            <p className="stext-102 cl6 m-t-5">Pay at your doorstep.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right side: Order Summary */}
                <div className="col-lg-5 col-xl-4 p-b-50">
                    <div className="order-summary-wrap bor10 p-40 p-lr-25-xl">
                        <h4 className="mtext-109 cl2 p-b-20 border-b m-b-25">Order Summary</h4>

                        {/* Items */}
                        <div className="summary-items m-b-30" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {cart.items.map(item => (
                                <div key={item.id} className="flex-w flex-sb-m p-b-15">
                                    <div className="flex-w" style={{ width: '70%' }}>
                                        <div className="m-r-15" style={{ position: 'relative' }}>
                                            <img src={getImageUrl(item.product.variant_image)} style={{ width: '50px', height: '65px', borderRadius: '5px', objectFit: 'cover' }} />
                                            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#717fe0', color: 'white', fontSize: '10px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="stext-104 cl4">{item.product.title.length > 20 ? item.product.title.substring(0, 20) + '...' : item.product.title}</span>
                                            <div className="stext-112 cl6 text-uppercase">{item.product.color_name} / {item.product.size_name}</div>
                                        </div>
                                    </div>
                                    <div className="stext-104 cl2">
                                        ₹{Math.round(item.item_total)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Calculation */}
                        <div className="border-t p-t-20 m-b-30">
                            <div className="flex-w flex-t p-b-13">
                                <div className="size-208"><span className="stext-110 cl2">Subtotal</span></div>
                                <div className="size-209 txt-right"><span className="mtext-110 cl2">₹{Math.round(summary.subtotal)}</span></div>
                            </div>

                            <div className="flex-w flex-t p-b-13">
                                <div className="size-208"><span className="stext-110 cl2">Shipping</span></div>
                                <div className="size-209 txt-right"><span className="mtext-110 cl2" style={{ color: '#2ecc71' }}>FREE</span></div>
                            </div>

                            {summary.discount > 0 && (
                                <div className="flex-w flex-t p-b-13">
                                    <div className="size-208"><span className="stext-110 cl2">Discount</span></div>
                                    <div className="size-209 txt-right"><span className="mtext-110 cl1" style={{ color: '#717fe0' }}>-₹{Math.round(summary.discount)}</span></div>
                                </div>
                            )}
                        </div>

                        <div className="flex-w flex-t p-b-33 border-t p-t-20">
                            <div className="size-208">
                                <span className="mtext-101 cl2 text-xl">Total</span>
                            </div>
                            <div className="size-209 p-t-1 txt-right">
                                <span className="mtext-110 cl2 text-xl" style={{ fontSize: '1.6rem', fontWeight: '800' }}>₹{Math.round(summary.total_price)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={processing || !selectedAddress || (paymentMethod === 'WALLET' && wallets.balance < summary.total_price)}
                            className={`flex-c-m stext-101 cl0 size-116 bg3 bor14 hov-btn3 p-lr-15 trans-04 pointer ${processing ? 'opacity-50' : ''}`}
                            style={{ width: '100%', height: '55px', fontSize: '1.1rem', background: '#1a1a1a' }}
                        >
                            {processing ? 'Processing...' : `PAY ₹${Math.round(summary.total_price)}`}
                        </button>

                        <div className="flex-w flex-c-m m-t-20">
                            <ShieldCheck size={18} className="m-r-5 text-gray-500" />
                            <span className="stext-112 cl6">256-bit Secure Encryption</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Address Form Modal */}
            <AnimatePresence>
                {showAddressForm && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 99999, padding: '20px',
                        backdropFilter: 'blur(5px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg0 bor10"
                            style={{ 
                                maxWidth: '700px', width: '100%', maxHeight: '90vh', 
                                overflowY: 'auto', position: 'relative',
                                padding: '40px', borderRadius: '24px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                        >
                            <button 
                                onClick={() => setShowAddressForm(false)}
                                style={{ position: 'absolute', top: '25px', right: '25px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <h4 className="mtext-109 cl2 m-b-35" style={{ fontSize: '1.8rem', fontWeight: '800' }}>Add New Address</h4>
                            
                            <form onSubmit={handleAddAddress}>
                                <div className="row">
                                    <div className="col-sm-6 m-b-25">
                                        <label className="stext-102 cl3 m-b-10" style={{ display: 'block', fontWeight: '600' }}>First Name</label>
                                        <input required className="size-111 bor8 stext-102 cl2 p-lr-20" style={{ height: '50px', borderRadius: '12px' }} type="text" value={newAddress.first_name} onChange={(e) => setNewAddress({ ...newAddress, first_name: e.target.value })} placeholder="John" />
                                    </div>
                                    <div className="col-sm-6 m-b-25">
                                        <label className="stext-102 cl3 m-b-10" style={{ display: 'block', fontWeight: '600' }}>Last Name</label>
                                        <input required className="size-111 bor8 stext-102 cl2 p-lr-20" style={{ height: '50px', borderRadius: '12px' }} type="text" value={newAddress.last_name} onChange={(e) => setNewAddress({ ...newAddress, last_name: e.target.value })} placeholder="Doe" />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-sm-6 m-b-25">
                                        <label className="stext-102 cl3 m-b-10" style={{ display: 'block', fontWeight: '600' }}>Email Address</label>
                                        <input required className="size-111 bor8 stext-102 cl2 p-lr-20" style={{ height: '50px', borderRadius: '12px' }} type="email" value={newAddress.email} onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })} placeholder="john@example.com" />
                                    </div>
                                    <div className="col-sm-6 m-b-25">
                                        <label className="stext-102 cl3 m-b-10" style={{ display: 'block', fontWeight: '600' }}>Phone Number</label>
                                        <input required className="size-111 bor8 stext-102 cl2 p-lr-20" style={{ height: '50px', borderRadius: '12px' }} type="text" value={newAddress.phone_number} onChange={(e) => setNewAddress({ ...newAddress, phone_number: e.target.value })} placeholder="+91 9876543210" />
                                    </div>
                                </div>

                                <div className="m-b-25">
                                    <label className="stext-102 cl3 m-b-10" style={{ display: 'block', fontWeight: '600' }}>Address Line 1</label>
                                    <input required className="size-111 bor8 stext-102 cl2 p-lr-20" style={{ height: '50px', borderRadius: '12px' }} type="text" value={newAddress.address_line_1} onChange={(e) => setNewAddress({ ...newAddress, address_line_1: e.target.value })} placeholder="House No, Street name" />
                                </div>

                                <div className="m-b-25">
                                    <label className="stext-102 cl3 m-b-10" style={{ display: 'block', fontWeight: '600' }}>Address Line 2 (Optional)</label>
                                    <input className="size-111 bor8 stext-102 cl2 p-lr-20" style={{ height: '50px', borderRadius: '12px' }} type="text" value={newAddress.address_line_2} onChange={(e) => setNewAddress({ ...newAddress, address_line_2: e.target.value })} placeholder="Apartment, Landmark" />
                                </div>

                                <div className="row">
                                    <div className="col-sm-6 m-b-25">
                                        <label className="stext-102 cl3 m-b-10" style={{ display: 'block', fontWeight: '600' }}>City</label>
                                        <input required className="size-111 bor8 stext-102 cl2 p-lr-20" style={{ height: '50px', borderRadius: '12px' }} type="text" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="City" />
                                    </div>
                                    <div className="col-sm-6 m-b-25">
                                        <label className="stext-102 cl3 m-b-10" style={{ display: 'block', fontWeight: '600' }}>State</label>
                                        <input required className="size-111 bor8 stext-102 cl2 p-lr-20" style={{ height: '50px', borderRadius: '12px' }} type="text" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} placeholder="State" />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-sm-6 m-b-25">
                                        <label className="stext-102 cl3 m-b-10" style={{ display: 'block', fontWeight: '600' }}>Postal Code</label>
                                        <input required className="size-111 bor8 stext-102 cl2 p-lr-20" style={{ height: '50px', borderRadius: '12px' }} type="text" value={newAddress.postal_code} onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })} placeholder="123456" />
                                    </div>
                                    <div className="col-sm-6 m-b-25">
                                        <label className="stext-102 cl3 m-b-10" style={{ display: 'block', fontWeight: '600' }}>Country</label>
                                        <input required className="size-111 bor8 stext-102 cl2 p-lr-20" style={{ height: '50px', borderRadius: '12px' }} type="text" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} placeholder="India" />
                                    </div>
                                </div>

                                <div className="flex-w flex-m p-t-30" style={{ gap: '15px' }}>
                                    <button 
                                        type="submit" 
                                        className="flex-c-m stext-101 cl0 size-116 bg1 bor14 hov-btn1 p-lr-15 trans-04 pointer"
                                        style={{ flex: 1, height: '55px', borderRadius: '15px', background: '#1a1a1a' }}
                                    >
                                        Save Address & Proceed
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddressForm(false)} 
                                        className="flex-c-m stext-101 cl2 size-116 bg8 bor14 hov-btn3 p-lr-15 trans-04 pointer"
                                        style={{ flex: '0 0 150px', height: '55px', borderRadius: '15px' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Checkout;
