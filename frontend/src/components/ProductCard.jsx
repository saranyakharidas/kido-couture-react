import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';

const ProductCard = ({ product, getImageUrl, hoveredId, setHoveredId, onQuickView, onAddToCart, onClick, variants, triggerPopup }) => {
    return (
        <motion.div
            key={product.id}
            className="product-card"
            variants={variants}
            onMouseEnter={() => setHoveredId(product.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onClick && onClick(product.slug)}
            style={{ cursor: 'pointer' }}
            layout
            exit={{ opacity: 0, scale: 0.9 }}
        >
            {product.offer_perc > 0 && (
                <div className="offer-badge">-{product.offer_perc}% OFF</div>
            )}

            <div className="image-container">
                <img
                    src={getImageUrl(product.variant_image)}
                    alt={product.title}
                    className="product-image"
                    loading="lazy"
                />

                <div className="quick-view-overlay">
                    <motion.button
                        className="quick-view-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onQuickView(product)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Eye size={18} /> Quick View
                        </div>
                    </motion.button>
                </div>

                <div
                    className="product-actions"
                    style={{
                        position: 'absolute',
                        bottom: '15px',
                        right: hoveredId === product.id ? '15px' : '-50px',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}
                >
                    <button className="action-btn heart-btn" onClick={(e) => { e.stopPropagation(); /* Add wishlist logic later if needed */ }}>
                        <Heart size={18} />
                    </button>
                    <button 
                        className="action-btn cart-btn" 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (product.stock > 0) {
                                onAddToCart(product.id, 1); 
                            } else {
                                triggerPopup('Out of stock', 'warning');
                            }
                        }}
                    >
                        <ShoppingCart size={18} />
                    </button>
                </div>
            </div>

            <div className="product-info">
                <span className="product-category">{product.product?.category?.name || 'Category'}</span>
                <h3 className="product-name">{product.title}</h3>

                <div className="product-price-container">
                    <span className="current-price">₹{Math.round(product.discount_price || product.price)}</span>
                    {product.discount_price && product.discount_price < product.price && (
                        <span className="old-price">₹{product.price}</span>
                    )}
                </div>

                <div className="star-rating">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={14} fill={star <= 4 ? "#f1c40f" : "none"} color="#f1c40f" />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
