import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Star, Heart, ShoppingBag, ArrowLeft, Maximize2, Plus, Minus } from 'lucide-react';

const ProductDetails = ({ productSlug, API_BASE_URL, getImageUrl, onBack, onProductChange, triggerPopup }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [activeTab, setActiveTab] = useState('description');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/product_details/${productSlug}`, {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Product not found');
                const result = await response.json();
                setData(result);
                setMainImage(result.variant.variant_image);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
        window.scrollTo(0, 0);
    }, [productSlug, API_BASE_URL]);

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="premium-loader"></div>
        </div>
    );

    if (error) return (
        <div className="text-center p-t-100">
            <h2 className="text-red-500">{error}</h2>
            <button onClick={onBack} className="m-t-20 stext-101 cl5 hov-cl1 trans-04">← Back to Shop</button>
        </div>
    );

    const { variant, related } = data;

    const handleAddToCart = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/add-to-cart/${variant.id}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
                },
                credentials: 'include',
                body: JSON.stringify({ quantity })
            });

            const result = await response.json();
            if (result.success) {
                window.dispatchEvent(new Event('user-login-success'));
                triggerPopup(
                    'Added to cart successfully! Go to your cart?',
                    'success',
                    () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'cart' })),
                    true
                );
            } else if (response.status === 403) {
                // Not logged in — navigate within React to sign-in
                triggerPopup(
                    'Please sign in to add items to your cart.',
                    'error',
                    () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'auth' })),
                    true
                );
            } else {
                triggerPopup(result.error || 'Failed to add to cart', 'error');
            }
        } catch (err) {
            console.error(err);
            triggerPopup('Network error. Please try again.', 'error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="product-details-page p-t-40 p-b-80"
        >
            <div className="premium-container">
                {/* Breadcrumb */}
                <div className="bread-crumb flex-w m-b-40 text-sm">
                    <span className="cursor-pointer cl8 hov-cl1 trans-04" onClick={onBack}>
                        Shop <ChevronRight size={14} className="inline m-l-5 m-r-5" />
                    </span>
                    <span className="cl8">
                        {variant.product.category.name} <ChevronRight size={14} className="inline m-l-5 m-r-5" />
                    </span>
                    <span className="cl4 font-bold">{variant.title}</span>
                </div>

                <div className="flex flex-col md:flex-row gap-12">
                    {/* Left: Gallery Section */}
                    <div className="w-full md:w-1/2">
                        <div className="flex flex-col-reverse md:flex-row gap-4">
                            {/* Thumbnails */}
                            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto" style={{ maxHeight: '600px' }}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${mainImage === variant.variant_image ? 'border-primary' : 'border-transparent'}`}
                                    onClick={() => setMainImage(variant.variant_image)}
                                    style={{ minWidth: '80px', width: '80px', height: '100px' }}
                                >
                                    <img src={getImageUrl(variant.variant_image)} className="w-full h-full object-cover" alt="thumbnail" />
                                </motion.div>
                                {variant.additional_images.map(img => (
                                    <motion.div
                                        key={img.id}
                                        whileHover={{ scale: 1.05 }}
                                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${mainImage === img.image ? 'border-primary' : 'border-transparent'}`}
                                        onClick={() => setMainImage(img.image)}
                                        style={{ minWidth: '80px', width: '80px', height: '100px' }}
                                    >
                                        <img src={getImageUrl(img.image)} className="w-full h-full object-cover" alt="thumbnail" />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Main Image */}
                            <div className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl bg-gray-50" style={{ maxHeight: '600px' }}>
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={mainImage}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        transition={{ duration: 0.4 }}
                                        src={getImageUrl(mainImage)}
                                        className="w-full h-full object-contain"
                                        style={{ aspectRatio: '4/5' }}
                                        alt="main product"
                                    />
                                </AnimatePresence>
                                <button className="absolute bottom-6 right-6 p-3 bg-white/80 backdrop-blur rounded-full shadow-lg hov-scale trans-04">
                                    <Maximize2 size={20} className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info Section — matches Quick View modal */}
                    <div style={{ flex: 1, padding: '40px 50px', display: 'flex', flexDirection: 'column', background: 'white', overflowY: 'auto' }}>

                        {/* Back breadcrumb */}
                        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '0.85rem', marginBottom: '30px', padding: 0 }}>
                            <ArrowLeft size={16} /> Back to Shop
                        </button>

                        {/* Category */}
                        <div style={{ color: '#717fe0', fontWeight: '700', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '15px' }}>
                            {variant.product.category.name}
                        </div>

                        {/* Title */}
                        <h2 style={{ fontSize: '2.5rem', margin: '0 0 20px 0', fontFamily: 'Playfair Display, serif', color: '#1a1a1a', lineHeight: '1.2' }}>
                            {variant.title}
                        </h2>

                        {/* Stars */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', gap: '3px' }}>
                                {[1,2,3,4,5].map(i => <Star key={i} size={16} fill={i <= 4 ? '#f1c40f' : 'none'} color='#f1c40f' />)}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#aaa' }}>(No reviews yet)</span>
                        </div>

                        {/* Price */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', margin: '15px 0' }}>
                            <span style={{ fontSize: '2.2rem', color: '#717fe0', fontWeight: '700' }}>
                                ₹{Math.round(variant.discount_price || variant.price)}
                            </span>
                            {variant.discount_price && variant.discount_price < variant.price && (
                                <>
                                    <span style={{ fontSize: '1.4rem', color: '#bbb', textDecoration: 'line-through' }}>
                                        ₹{variant.price}
                                    </span>
                                    {variant.offer_perc > 0 && (
                                        <span style={{ background: '#ff4d4f', color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
                                            {variant.offer_perc}% OFF
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Thin divider */}
                        <div style={{ height: '2px', width: '50px', background: '#eee', margin: '25px 0' }}></div>

                        {/* Description */}
                        <p style={{ color: '#666', lineHeight: '1.8', fontSize: '1.05rem', marginBottom: '30px' }}>
                            {variant.product.descriptions}
                        </p>

                        {/* Attributes */}
                        <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Color</div>
                                <div style={{ fontWeight: '600', color: '#333' }}>{variant.color_name}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Size</div>
                                <div style={{ fontWeight: '600', color: '#333' }}>{variant.size_name}</div>
                            </div>
                        </div>

                        {/* Variant thumbnails */}
                        {variant.product.all_variants.length > 1 && (
                            <div style={{ marginBottom: '30px' }}>
                                <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Other Variants</div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {variant.product.all_variants.map(v => (
                                        <motion.div
                                            key={v.id}
                                            whileHover={{ y: -4, scale: 1.05 }}
                                            onClick={() => onProductChange(v.slug)}
                                            style={{
                                                width: '56px', height: '70px', borderRadius: '12px',
                                                overflow: 'hidden', cursor: 'pointer',
                                                border: v.slug === variant.slug ? '2px solid #717fe0' : '2px solid #eee',
                                                boxShadow: v.slug === variant.slug ? '0 0 0 3px rgba(113,127,224,0.15)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <img src={getImageUrl(v.variant_image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="variant" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity + Stock */}
                        <div style={{ display: 'flex', gap: '25px', alignItems: 'center', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '35px', padding: '6px', background: '#fcfcfc' }}>
                                <motion.button whileTap={{ scale: 0.9 }} className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '35px' }}>
                                    <Minus size={14} />
                                </motion.button>
                                <input type="text" value={quantity} readOnly style={{ width: '45px', textAlign: 'center', border: 'none', background: 'none', fontWeight: '600', fontSize: '1.1rem' }} />
                                <motion.button whileTap={{ scale: 0.9 }} className="qty-btn" onClick={() => setQuantity(q => q + 1)} style={{ width: '35px' }}>
                                    <Plus size={14} />
                                </motion.button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Availability</span>
                                <span style={{ color: variant.stock > 0 ? '#2ecc71' : '#e74c3c', fontSize: '1rem', fontWeight: '600' }}>
                                    {variant.stock > 0 ? `${variant.stock} pieces left` : 'Out of stock'}
                                </span>
                            </div>
                        </div>

                        {/* Add to Cart + Wishlist */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: '#5b67c4' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAddToCart}
                                disabled={variant.stock <= 0}
                                style={{
                                    flex: 1, padding: '20px', background: variant.stock > 0 ? '#717fe0' : '#d0d0d0', color: 'white',
                                    border: 'none', borderRadius: '40px', fontWeight: '700', fontSize: '1rem',
                                    cursor: variant.stock > 0 ? 'pointer' : 'not-allowed',
                                    boxShadow: variant.stock > 0 ? '0 15px 35px rgba(113, 127, 224, 0.3)' : 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s'
                                }}
                            >
                                <ShoppingBag size={20} />
                                {variant.stock > 0 ? 'ADD TO CART' : 'NOT AVAILABLE'}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                    width: '60px', height: '60px', background: 'white', border: '1px solid #eee',
                                    borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', color: '#aaa',
                                    transition: 'all 0.3s', flexShrink: 0
                                }}
                            >
                                <Heart size={22} />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Details Tabs */}
                <div className="mt-20 border-t border-gray-100 pt-20">
                    <div className="flex justify-center gap-12 mb-12">
                        {['description', 'information', 'reviews'].map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`text-sm font-bold uppercase tracking-widest pb-4 transition-all relative ${activeTab === t ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {t}
                                {activeTab === t && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                            </button>
                        ))}
                    </div>

                    <div className="max-w-3xl mx-auto min-h-[200px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'description' && (
                                <motion.p 
                                    key="desc"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="text-gray-600 leading-relaxed text-lg text-center"
                                >
                                    {variant.product.descriptions}
                                </motion.p>
                            )}
                            {activeTab === 'information' && (
                                <motion.div 
                                    key="info"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex justify-between py-4 border-b border-gray-50">
                                        <span className="text-gray-400 font-medium">Category</span>
                                        <span className="text-gray-900 font-bold">{variant.product.category.name}</span>
                                    </div>
                                    <div className="flex justify-between py-4 border-b border-gray-50">
                                        <span className="text-gray-400 font-medium">Material</span>
                                        <span className="text-gray-900 font-bold">Premium Cotton Mix</span>
                                    </div>
                                    <div className="flex justify-between py-4 border-b border-gray-50">
                                        <span className="text-gray-400 font-medium">Product ID</span>
                                        <span className="text-gray-900 font-bold">#KC-{variant.id.toString().padStart(5, '0')}</span>
                                    </div>
                                </motion.div>
                            )}
                            {activeTab === 'reviews' && (
                                <motion.div 
                                    key="rev"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="text-center py-10 bg-gray-50 rounded-3xl"
                                >
                                    <p className="text-gray-400 font-medium">No reviews yet for this variant.</p>
                                    <button className="mt-4 text-primary font-bold hover:underline">Be the first to review</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Related Products */}
                <div className="mt-32">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h3 className="text-3xl font-black text-gray-900 mb-2">You Might Also Like</h3>
                            <p className="text-gray-400 font-medium">Explore more items from this category</p>
                        </div>
                        <button onClick={onBack} className="text-primary font-bold hover:underline flex items-center gap-2">
                            View All <ChevronRight size={16} />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {related.map(item => (
                            <motion.div 
                                key={item.id} 
                                whileHover={{ y: -10 }}
                                className="group cursor-pointer" 
                                onClick={() => onProductChange(item.slug)}
                            >
                                <div className="aspect-[3/4] rounded-3xl overflow-hidden relative shadow-md mb-6">
                                    <img src={getImageUrl(item.variant_image)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="related" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">Quick View</span>
                                    </div>
                                </div>
                                <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-center">{item.title}</h4>
                                <p className="text-primary font-black text-center mt-2">₹{item.price}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductDetails;
