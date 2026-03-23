import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, product, getImageUrl, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !product) return null;

    const handleIncrement = () => {
        if (quantity < product.stock) {
            setQuantity(prev => prev + 1);
        }
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const success = await onAddToCart(product.id, quantity);
        setIsSubmitting(false);
    };

    return (
        <AnimatePresence>
            <div
                className="modal-overlay"
                onClick={onClose}
                style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 999999, padding: '20px', backdropFilter: 'blur(10px)'
                }}
            >
                <motion.div
                    className="modal-content"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'white', maxWidth: '1100px', width: '100%',
                        borderRadius: '30px', overflow: 'hidden', display: 'flex',
                        maxHeight: '90vh', boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                        position: 'relative'
                    }}
                >
                    {/* Close Button Top Right */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '25px', right: '25px',
                            background: 'white', border: 'none', cursor: 'pointer',
                            color: '#333', zIndex: 10, width: '40px', height: '40px',
                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                        }}
                    >
                        <X size={20} />
                    </button>

                    <div className="modal-image-section" style={{ flex: '1.2', background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <motion.img
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={getImageUrl(product.variant_image)}
                            alt={product.title || product.product?.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>

                    <div className="modal-info-section" style={{ flex: '1', padding: '60px 50px', display: 'flex', flexDirection: 'column', background: 'white', overflowY: 'auto' }}>
                        <div className="product-category" style={{ textAlign: 'left', color: '#717fe0', fontWeight: '600', letterSpacing: '2px', marginBottom: '15px' }}>
                            {product.product?.category?.name || 'KIDO PREMIUM'}
                        </div>

                        <h2 className="modal-title" style={{ fontSize: '2.5rem', margin: '0 0 20px 0', fontFamily: 'Playfair Display, serif', color: '#1a1a1a', lineHeight: '1.2' }}>
                            {product.title || product.product?.name}
                        </h2>

                        <div className="product-price-container" style={{ justifyContent: 'flex-start', margin: '15px 0', display: 'flex', alignItems: 'baseline', gap: '15px' }}>
                            <span className="current-price" style={{ fontSize: '2.2rem', color: '#717fe0', fontWeight: '700' }}>
                                ₹{Math.round(product.discount_price || product.price)}
                            </span>
                            {product.discount_price && product.discount_price < product.price && (
                                <span className="old-price" style={{ fontSize: '1.4rem', color: '#bbb', textDecoration: 'line-through' }}>
                                    ₹{product.price}
                                </span>
                            )}
                        </div>

                        <div style={{ height: '2px', width: '50px', background: '#eee', margin: '30px 0' }}></div>

                        <p className="modal-description" style={{ color: '#666', lineHeight: '1.8', fontSize: '1.05rem', marginBottom: '40px' }}>
                            {product.product?.descriptions || "Experience unparalleled comfort and sophisticated style with this premium selection from Kido Couture. Meticulously designed for the modern lifestyle."}
                        </p>

                        <div style={{ marginTop: 'auto' }}>
                            <div className="quantity-stock" style={{ display: 'flex', gap: '25px', alignItems: 'center', marginBottom: '35px' }}>
                                <div className="quantity-selector" style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '35px', padding: '6px', background: '#fcfcfc' }}>
                                    <button className="qty-btn" onClick={handleDecrement} style={{ width: '35px' }}><Minus size={14} /></button>
                                    <input type="text" value={quantity} readOnly style={{ width: '45px', textAlign: 'center', border: 'none', background: 'none', fontWeight: '600', fontSize: '1.1rem' }} />
                                    <button className="qty-btn" onClick={handleIncrement} style={{ width: '35px' }}><Plus size={14} /></button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Availability</span>
                                    <span className="stock-status" style={{ color: product.stock > 0 ? '#2ecc71' : '#e74c3c', fontSize: '1rem', fontWeight: '500' }}>
                                        {product.stock > 0 ? `${product.stock} pieces left` : 'Out of stock'}
                                    </span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: '#5b67c4' }}
                                whileTap={{ scale: 0.98 }}
                                className="add-to-cart-btn"
                                disabled={isSubmitting || product.stock <= 0}
                                onClick={handleSubmit}
                                style={{
                                    width: '100%', padding: '22px', background: product.stock > 0 ? '#717fe0' : '#d0d0d0', color: 'white',
                                    border: 'none', borderRadius: '40px', fontWeight: '700', fontSize: '1.1rem',
                                    cursor: product.stock > 0 ? 'pointer' : 'not-allowed', boxShadow: '0 15px 35px rgba(113, 127, 224, 0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    textTransform: 'uppercase', letterSpacing: '2px'
                                }}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
                                {product.stock > 0 ? 'ADD TO CART' : 'NOT AVAILABLE'}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProductModal;
