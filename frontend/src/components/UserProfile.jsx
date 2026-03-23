import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, MapPin, Wallet, Settings, LogOut, ChevronRight, CheckCircle2, Clock, XCircle, ChevronLeft, FileText } from 'lucide-react';

const UserProfile = ({ API_BASE_URL, getImageUrl, onBackToShop, triggerPopup }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [profileData, setProfileData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile/`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setProfileData(data);
            } else {
                if (response.status === 403) window.location.href = '/signin';
                setError('Failed to fetch profile.');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (err) {
            console.error('Failed to fetch orders', err);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchProfile(), fetchOrders()]).finally(() => setLoading(false));
        window.scrollTo(0, 0);
    }, [API_BASE_URL]);

    const handleCancelOrder = async (orderId) => {
        triggerPopup(
            'Are you sure you want to cancel this order?',
            'warning',
            async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                        },
                        credentials: 'include'
                    });
                    const data = await response.json();
                    if (response.ok && data.success) {
                        triggerPopup('Order cancelled successfully.', 'success');
                        fetchOrders();
                        if (selectedOrder) setSelectedOrder(null);
                    } else {
                        triggerPopup(data.error || 'Failed to cancel order.', 'error');
                    }
                } catch (err) {
                    triggerPopup('Network error while cancelling order.', 'error');
                }
            },
            true
        );
    };

    const handleDownloadInvoice = (orderId) => {
        window.open(`${API_BASE_URL}/order_pdf/${orderId}/`, '_blank');
    };

    if (loading) return (
        <div className="flex justify-center flex-col items-center h-96">
            <div className="premium-loader"></div>
            <p className="m-t-20 stext-102 cl6">Loading your profile...</p>
        </div>
    );

    if (error) return (
        <div className="text-center p-t-100 p-b-100">
            <h2 className="text-red-500 m-b-20">{error}</h2>
            <button onClick={onBackToShop} className="stext-101 cl0 bg1 bor1 hov-btn1 p-lr-15 trans-04 p-tb-10">Back to Shop</button>
        </div>
    );

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: User },
        { id: 'orders', label: 'My Orders', icon: Package },
        { id: 'addresses', label: 'Addresses', icon: MapPin },
        { id: 'wallet', label: 'My Wallet', icon: Wallet },
        { id: 'settings', label: 'Account Details', icon: Settings },
    ];

    const { user, addresses, wallet_balance } = profileData;

    return (
        <div className="profile-page p-b-80" style={{ paddingTop: '5px' }}>
            <div className="bread-crumb flex-w m-b-25">
                <span className="cursor-pointer stext-109 cl8 hov-cl1 trans-04" onClick={onBackToShop}>
                    Home <ChevronRight size={14} className="inline m-l-5 m-r-5" />
                </span>
                <span className="stext-109 cl4">My Account</span>
            </div>

            <div className="row flex-xl-nowrap">
                {/* Sidebar */}
                <div className="col-12 col-md-4 col-lg-3 m-b-50">
                    <div className="sidebar-wrap bor10 bg0 p-30 sticky" style={{ top: '100px' }}>
                        <div className="user-info flex-w flex-col flex-c m-b-40 text-center">
                            <div className="avatar-circle m-b-15 flex-c-m bg1 text-white mx-auto" style={{ width: '80px', height: '80px', borderRadius: '50%', fontSize: '2rem', fontWeight: 'bold' }}>
                                {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
                            </div>
                            <h4 className="mtext-105 cl2">{user.first_name} {user.last_name}</h4>
                            <span className="stext-102 cl6">{user.email}</span>
                        </div>

                        <ul className="profile-sidebar-menu" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {tabs.map(tab => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => { setActiveTab(tab.id); setSelectedOrder(null); }}
                                        className={`flex-m w-full p-t-15 p-b-15 p-l-25 p-r-20 bor10 trans-04 pointer ${activeTab === tab.id ? 'bg1 text-white' : 'bg-gray-50 hov-bg1 hov-text-white'}`}
                                        style={{ border: 'none', outline: 'none', textAlign: 'left', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '15px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', width: '100%', whiteSpace: 'nowrap' }}
                                    >
                                        <tab.icon size={20} className="flex-shrink-0" />
                                        <span>{tab.label}</span>
                                    </button>
                                </li>
                            ))}
                            <li className="m-t-20">
                                <a href="/logout_user/" className="flex-m w-full p-t-12 p-b-12 p-l-20 p-r-15 bor10 trans-04 pointer text-red-500 bg-red-50 hover:bg-red-500 hover:text-white" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <LogOut size={18} className="flex-shrink-0" />
                                    <span>Logout</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="col-12 col-md-8 col-lg-9">
                    <div className="content-wrap bor10 bg0 p-30 min-h-[500px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab + (selectedOrder ? '-detail' : '')}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Dashboard Tab */}
                                {activeTab === 'dashboard' && (
                                    <div>
                                        <div className="dashboard-header" style={{ marginBottom: '50px' }}>
                                            <h3 className="mtext-111 cl2" style={{ fontWeight: '700', lineHeight: '1.2', margin: '0 0 25px 0' }}>
                                                Hello{user.first_name ? `, ${user.first_name}` : ''}!
                                            </h3>
                                            <div style={{ borderBottom: '1px solid #eee', width: '100%' }}></div>
                                            <div style={{ height: '35px' }}></div>
                                            <p className="stext-102 cl6" style={{ lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
                                                From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.
                                            </p>
                                        </div>
                                        <div className="row">
                                            <div className="col-sm-6 mb-4">
                                                <div className="p-20 bor10 bg-gray-50 text-center pointer hov-bg1 hover:text-white trans-04" onClick={() => setActiveTab('orders')}>
                                                    <Package size={30} className="mx-auto m-b-15" />
                                                    <h4 className="mtext-106">Orders</h4>
                                                    <span className="stext-102">{orders.length} Total Orders</span>
                                                </div>
                                            </div>
                                            <div className="col-sm-6 mb-4">
                                                <div className="p-20 bor10 bg-gray-50 text-center pointer hov-bg1 hover:text-white trans-04" onClick={() => setActiveTab('wallet')}>
                                                    <Wallet size={30} className="mx-auto m-b-15" />
                                                    <h4 className="mtext-106">Wallet</h4>
                                                    <span className="stext-102">₹{wallet_balance} Balance</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Orders Tab */}
                                {activeTab === 'orders' && !selectedOrder && (
                                    <div>
                                        <h3 className="mtext-111 cl2 p-b-16 mb-4 border-b flex-sb-m">
                                            Order History
                                        </h3>
                                        {orders.length === 0 ? (
                                            <div className="text-center p-40 bg-gray-50 bor10">
                                                <Package size={50} className="mx-auto cl6 m-b-20" />
                                                <p className="stext-102 cl6">You haven't placed any orders yet.</p>
                                                <button onClick={onBackToShop} className="flex-c-m stext-101 cl0 size-101 bg1 bor1 hov-btn1 p-lr-15 trans-04 pointer mx-auto m-t-20">Start Shopping</button>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table-shopping-cart" style={{ width: '100%', minWidth: '600px' }}>
                                                    <thead>
                                                        <tr className="table_head">
                                                            <th className="column-1">Order ID</th>
                                                            <th className="column-2">Date</th>
                                                            <th className="column-3">Status</th>
                                                            <th className="column-4">Total</th>
                                                            <th className="column-5">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orders.map(order => (
                                                            <tr key={order.id} className="table_row transition-all hover:bg-gray-50">
                                                                <td className="column-1" style={{ padding: '20px 0' }}>#{order.tracking_no || order.id}</td>
                                                                <td className="column-2">{new Date(order.order_date).toLocaleDateString()}</td>
                                                                <td className="column-3">
                                                                    <span className={`badge p-lr-10 p-tb-3 bor10 text-xs text-white ${order.order_status === 'DELIVERED' ? 'bg-[#2ecc71]' :
                                                                        order.order_status === 'CANCELLED' ? 'bg-[#e74c3c]' :
                                                                            'bg-[#f39c12]'
                                                                        }`}>
                                                                        {order.order_status}
                                                                    </span>
                                                                </td>
                                                                <td className="column-4">₹{order.total_price} for {order.items.length} item(s)</td>
                                                                <td className="column-5">
                                                                    <button
                                                                        onClick={() => setSelectedOrder(order)}
                                                                        className="stext-101 cl0 bg3 bor1 hov-btn3 p-lr-15 trans-04 pointer"
                                                                        style={{ padding: '8px 15px', borderRadius: '20px', fontSize: '0.85rem' }}
                                                                    >
                                                                        View
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Order Details View */}
                                {activeTab === 'orders' && selectedOrder && (
                                    <div>
                                        <button onClick={() => setSelectedOrder(null)} className="flex-w flex-m stext-102 cl6 hov-cl1 trans-04 m-b-20" style={{ background: 'none', border: 'none' }}>
                                            <ChevronLeft size={16} className="m-r-5" /> Back to Orders
                                        </button>

                                        <div className="flex-w flex-sb-m p-b-20 m-b-30" style={{ borderBottom: '1px solid #eee' }}>
                                            <h3 className="mtext-111 cl2" style={{ fontWeight: '700' }}>Order #{selectedOrder.tracking_no || selectedOrder.id}</h3>
                                            <span className={`badge p-lr-15 p-tb-5 bor10 text-white ${selectedOrder.order_status === 'DELIVERED' ? 'bg-[#2ecc71]' :
                                                selectedOrder.order_status === 'CANCELLED' ? 'bg-[#e74c3c]' :
                                                    'bg-[#f39c12]'
                                                }`}>
                                                {selectedOrder.order_status}
                                            </span>
                                        </div>

                                        <p className="stext-102 cl6 m-b-30">Placed on: {new Date(selectedOrder.order_date).toLocaleString()}</p>

                                        <div className="row m-b-30 m-t-20">
                                            <div className="col-md-6 mb-3">
                                                <h4 className="mtext-106 cl2 m-b-15">Shipping Address</h4>
                                                <div className="p-20 bor10 bg-gray-50 h-full">
                                                    <p className="stext-102 cl2 font-bold mb-2">{selectedOrder.address.first_name} {selectedOrder.address.last_name}</p>
                                                    <p className="stext-102 cl6">{selectedOrder.address.address_line_1}</p>
                                                    {selectedOrder.address.address_line_2 && <p className="stext-102 cl6">{selectedOrder.address.address_line_2}</p>}
                                                    <p className="stext-102 cl6">{selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postal_code}</p>
                                                    <p className="stext-102 cl6 m-t-10">Phone: {selectedOrder.address.phone_number}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <h4 className="mtext-106 cl2 m-b-15">Payment Information</h4>
                                                <div className="p-20 bor10 bg-gray-50 h-full">
                                                    <p className="stext-102 cl2 font-bold mb-2">Method: {selectedOrder.payment_method.replace(/_/g, ' ')}</p>
                                                    <p className="stext-102 cl6">Status: <span className={selectedOrder.payment_status === 'PAID' ? 'text-green-500 font-bold' : selectedOrder.payment_status === 'REFUNDED' ? 'text-blue-500 font-bold' : 'text-red-500 font-bold'}>{selectedOrder.payment_status}</span></p>
                                                    <p className="stext-102 cl6 m-t-10 text-xl font-bold">Total: ₹{selectedOrder.total_price}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <h4 className="mtext-106 cl2 m-b-20 border-b p-b-10">Items in Order</h4>
                                        <div className="order-items-list m-b-40">
                                            {selectedOrder.items.map(item => (
                                                <div key={item.id} className="flex-w flex-sb-m p-20 bor10 m-b-10 border-solid border-[#e6e6e6]">
                                                    <div className="flex-w w-[70%]" style={{ width: '70%' }}>
                                                        <div className="m-r-20">
                                                            <img src={getImageUrl(item.product.variant_image)} alt="product" style={{ width: '60px', height: '75px', objectFit: 'cover', borderRadius: '8px' }} />
                                                        </div>
                                                        <div className="flex-col p-t-5">
                                                            <span className="mtext-106 cl2 mb-1 block">{item.product.title}</span>
                                                            <span className="stext-102 cl6 mb-1 block uppercase text-xs">{item.product.color_name} | {item.product.size_name}</span>
                                                            <span className="stext-102 cl6">Qty: x{item.quantity}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mtext-106 cl2 font-bold">
                                                        ₹{item.price * item.quantity}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex-w flex-sb-m m-t-30">
                                            <button
                                                onClick={() => handleDownloadInvoice(selectedOrder.id)}
                                                className="flex-c-m stext-101 cl2 bg-gray-100 bor1 hov-bg1 hover:text-white trans-04 pointer"
                                                style={{ padding: '12px 25px', borderRadius: '25px', width: 'auto' }}
                                            >
                                                <FileText size={18} className="m-r-10" /> Download Invoice
                                            </button>

                                            {(selectedOrder.order_status === 'ORDERED' || selectedOrder.order_status === 'PROCESSING') && (
                                                <button
                                                    onClick={() => handleCancelOrder(selectedOrder.id)}
                                                    className="flex-c-m stext-101 cl0 bg-red-500 bor1 hov-bg-red-600 trans-04 pointer"
                                                    style={{ padding: '12px 30px', borderRadius: '25px', width: 'auto' }}
                                                >
                                                    <XCircle size={18} className="m-r-10" /> Cancel Order
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Addresses Tab */}
                                {activeTab === 'addresses' && (
                                    <div>
                                        <div className="flex-w flex-sb-m p-b-20 m-b-30" style={{ borderBottom: '1px solid #eee' }}>
                                            <h3 className="mtext-111 cl2" style={{ fontWeight: '700' }}>Saved Addresses</h3>
                                            <button className="stext-101 cl0 bg1 bor1 hov-btn1 p-lr-20 p-tb-10 trans-04 pointer" style={{ borderRadius: '30px', fontWeight: 'bold' }}>
                                                + Add New
                                            </button>
                                        </div>
                                        <p className="stext-102 cl6 m-b-30">The following addresses will be used on the checkout page by default.</p>

                                        <div className="row">
                                            {addresses.length === 0 ? (
                                                <div className="col-12 text-center p-40 bg-gray-50 bor10">
                                                    <MapPin size={40} className="mx-auto cl6 m-b-15" />
                                                    <p className="stext-102 cl6">You have not set up this type of address yet.</p>
                                                </div>
                                            ) : (
                                                addresses.map(addr => (
                                                    <div className="col-md-6 mb-4" key={addr.id}>
                                                        <div className="p-30 bor10 bg-gray-50 h-full relative" style={{ borderTop: '4px solid #717fe0' }}>
                                                            <h4 className="mtext-106 cl2 m-b-15">{addr.first_name} {addr.last_name}</h4>
                                                            <p className="stext-102 cl6 mb-1">{addr.address_line_1}</p>
                                                            {addr.address_line_2 && <p className="stext-102 cl6 mb-1">{addr.address_line_2}</p>}
                                                            <p className="stext-102 cl6 mb-1">{addr.city}, {addr.state} {addr.postal_code}</p>
                                                            <p className="stext-102 cl6 mb-3">{addr.country}</p>

                                                            <p className="stext-102 cl6 mb-1">Phone: {addr.phone_number}</p>
                                                            <p className="stext-102 cl6">Email: {addr.email}</p>

                                                            <div className="flex gap-3 m-t-20 pt-3 border-t">
                                                                <button className="stext-102 cl1 hov-cl2">Edit Address</button>
                                                                <button className="stext-102 text-red-500 hover:text-red-700 ml-auto">Delete</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Wallet Tab */}
                                {activeTab === 'wallet' && (
                                    <div>
                                        <div className="flex-w flex-sb-m p-b-20 m-b-30" style={{ borderBottom: '1px solid #eee' }}>
                                            <h3 className="mtext-111 cl2" style={{ fontWeight: '700' }}>My Wallet</h3>
                                        </div>
                                        <div className="bg1 text-white p-40 bor10 text-center relative overflow-hidden m-b-40" style={{ backgroundImage: 'linear-gradient(135deg, #717fe0 0%, #5b67c4 100%)', boxShadow: '0 10px 30px rgba(113, 127, 224, 0.3)' }}>
                                            <Wallet size={100} className="absolute opacity-10" style={{ right: '-10px', bottom: '-20px' }} />
                                            <p className="stext-102 text-white mb-2 opacity-80 uppercase tracking-wider font-bold">Available Balance</p>
                                            <h1 className="mtext-111 m-b-0" style={{ fontSize: '4rem', fontWeight: '800' }}>₹{wallet_balance}</h1>
                                        </div>
                                        <p className="stext-102 cl6 text-center">Wallet balance can be used during your checkout for instant payments.</p>
                                    </div>
                                )}

                                {/* Settings Tab */}
                                {activeTab === 'settings' && (
                                    <div>
                                        <div className="flex-w flex-sb-m p-b-20 m-b-30" style={{ borderBottom: '1px solid #eee' }}>
                                            <h3 className="mtext-111 cl2" style={{ fontWeight: '700' }}>Account Details</h3>
                                        </div>
                                        <form className="p-t-15 p-b-30 max-w-[600px]">
                                            <div className="row">
                                                <div className="col-sm-6 p-b-20">
                                                    <label className="stext-102 cl2 m-b-10 block">First Name</label>
                                                    <input className="size-111 bor8 stext-102 cl2 p-lr-20 w-full" type="text" defaultValue={user.first_name} disabled style={{ background: '#f5f5f5' }} />
                                                </div>
                                                <div className="col-sm-6 p-b-20">
                                                    <label className="stext-102 cl2 m-b-10 block">Last Name</label>
                                                    <input className="size-111 bor8 stext-102 cl2 p-lr-20 w-full" type="text" defaultValue={user.last_name} disabled style={{ background: '#f5f5f5' }} />
                                                </div>
                                            </div>

                                            <div className="p-b-20">
                                                <label className="stext-102 cl2 m-b-10 block">Email Address</label>
                                                <input className="size-111 bor8 stext-102 cl2 p-lr-20 w-full" type="email" defaultValue={user.email} disabled style={{ background: '#f5f5f5' }} />
                                            </div>

                                            <h4 className="mtext-106 cl2 m-t-20 m-b-20 border-b p-b-10">Password Change</h4>

                                            <div className="p-b-20">
                                                <label className="stext-102 cl2 m-b-10 block">Current Password</label>
                                                <input className="size-111 bor8 stext-102 cl2 p-lr-20 w-full" type="password" />
                                            </div>

                                            <div className="p-b-20">
                                                <label className="stext-102 cl2 m-b-10 block">New Password</label>
                                                <input className="size-111 bor8 stext-102 cl2 p-lr-20 w-full" type="password" />
                                            </div>

                                            <div className="p-b-20 border-b m-b-30">
                                                <label className="stext-102 cl2 m-b-10 block">Confirm New Password</label>
                                                <input className="size-111 bor8 stext-102 cl2 p-lr-20 w-full m-b-20" type="password" />
                                            </div>

                                            <button className="flex-c-m stext-101 cl0 size-116 bg3 bor14 hov-btn3 p-lr-15 trans-04 pointer">
                                                Save Changes
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
