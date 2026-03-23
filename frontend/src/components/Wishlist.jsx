import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import ProductCard from './ProductCard';

const Wishlist = ({ API_BASE_URL, getImageUrl, onBackToShop, triggerPopup }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/wishlist/`, {
                credentials: 'include'
            });
            if (!response.ok) {
                if (response.status === 403) {
                    window.location.href = '/signin';
                    return;
                }
                throw new Error('Failed to fetch wishlist');
            }
            const data = await response.json();
            setWishlistItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (variantId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/removing_wishlist/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include',
                body: `variant_id=${variantId}`
            });
            const data = await response.json();
            if (data.status === 'success') {
                setWishlistItems(prev => prev.filter(item => item.product.id !== variantId));
            }
        } catch (err) {
            console.error('Error removing from wishlist:', err);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="wishlist-container p-t-40">
            <div className="header-section text-center m-b-40">
                <h1 className="section-title">My Wishlist</h1>
                <p className="section-subtitle">YOUR FAVORITE ITEMS IN ONE PLACE</p>
            </div>

            {wishlistItems.length === 0 ? (
                <div className="text-center p-t-100 p-b-100">
                    <Heart size={64} className="m-b-20" style={{ color: '#eee', margin: '0 auto' }} />
                    <p className="stext-101 cl5">Your wishlist is empty.</p>
                    <button
                        onClick={onBackToShop}
                        className="flex-c-m stext-101 cl0 size-101 bg1 bor1 hov-btn1 p-lr-15 trans-04 m-t-30"
                        style={{ margin: '30px auto 0' }}
                    >
                        GO SHOPPING
                    </button>
                </div>
            ) : (
                <motion.div
                    layout
                    className="product-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <AnimatePresence>
                        {wishlistItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="wishlist-item-wrapper"
                                style={{ position: 'relative' }}
                            >
                                <div className="wishlist-remove-btn"
                                    onClick={() => removeFromWishlist(item.product.id)}
                                    style={{
                                        position: 'absolute',
                                        top: '15px',
                                        right: '15px',
                                        zIndex: 10,
                                        background: 'rgba(255,255,255,0.8)',
                                        padding: '8px',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                    }}>
                                    <Trash2 size={18} color="#ff4d4f" />
                                </div>
                                <ProductCard
                                    product={item.product}
                                    getImageUrl={getImageUrl}
                                    triggerPopup={triggerPopup}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <div className="flex-c-m p-t-50">
                <button
                    onClick={onBackToShop}
                    className="stext-101 cl5 hov-cl1 trans-04"
                >
                    ← Back to Shop
                </button>
            </div>
        </div>
    );
};

export default Wishlist;
