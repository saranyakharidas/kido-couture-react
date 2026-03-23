import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Star, Heart, ShoppingBag, ArrowLeft, Maximize2 } from 'lucide-react';

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
                triggerPopup('Success! Added to cart.', 'success');
                // Trigger navbar refresh if needed
            } else if (response.status === 403) {
                window.location.href = '/signin';
            } else {
                triggerPopup(result.error || 'Failed to add', 'error');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="product-details-page p-t-40"
        >
            {/* Breadcrumb */}
            <div className="bread-crumb flex-w m-b-40">
                <span className="cursor-pointer stext-109 cl8 hov-cl1 trans-04" onClick={onBack}>
                    Shop <ChevronRight size={14} className="inline m-l-5 m-r-5" />
                </span>
                <span className="stext-109 cl8">
                    {variant.product.category.name} <ChevronRight size={14} className="inline m-l-5 m-r-5" />
                </span>
                <span className="stext-109 cl4">{variant.title}</span>
            </div>

            <div className="row">
                {/* Left: Gallery */}
                <div className="col-md-6 p-b-30">
                    <div className="gallery-container flex-w">
                        <div className="thumbnail-list d-flex flex-column gap-3 p-r-20">
                            <motion.img
                                whileHover={{ scale: 1.05 }}
                                src={getImageUrl(variant.variant_image)}
                                className={`thumb-img ${mainImage === variant.variant_image ? 'active' : ''}`}
                                onClick={() => setMainImage(variant.variant_image)}
                                style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '12px', cursor: 'pointer', border: mainImage === variant.variant_image ? '2px solid #717fe0' : '2px solid transparent' }}
                            />
                            {variant.additional_images.map(img => (
                                <motion.img
                                    key={img.id}
                                    whileHover={{ scale: 1.05 }}
                                    src={getImageUrl(img.image)}
                                    className={`thumb-img ${mainImage === img.image ? 'active' : ''}`}
                                    onClick={() => setMainImage(img.image)}
                                    style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '12px', cursor: 'pointer', border: mainImage === img.image ? '2px solid #717fe0' : '2px solid transparent' }}
                                />
                            ))}
                        </div>
                        <div className="main-image-wrap pos-relative" style={{ flex: 1 }}>
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={mainImage}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    src={getImageUrl(mainImage)}
                                    style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}
                                />
                            </AnimatePresence>
                            <button className="expand-btn pos-absolute" style={{ bottom: '20px', right: '20px', background: 'white', padding: '10px', borderRadius: '50%', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                                <Maximize2 size={20} color="#666" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Info */}
                <div className="col-md-6 p-b-30">
                    <div className="info-wrap p-l-50 p-lr-0-lg">
                        <h2 className="mtext-105 cl2 p-b-14">{variant.title}</h2>
                        <div className="flex-w flex-m p-b-20">
                            <div className="flex-w m-r-20">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill={i <= 4 ? "#f1c40f" : "none"} color="#f1c40f" />)}
                            </div>
                            <span className="stext-102 cl6">(1 customer review)</span>
                        </div>

                        <div className="price-box m-b-30">
                            {variant.discount_price ? (
                                <div className="flex-w flex-m">
                                    <span className="mtext-106 cl2 m-r-15" style={{ fontSize: '2rem', fontWeight: '800' }}>
                                        ₹{Math.round(variant.discount_price)}
                                    </span>
                                    <span className="stext-105 cl3" style={{ textDecoration: 'line-through', fontSize: '1.2rem' }}>
                                        ₹{variant.price}
                                    </span>
                                    {variant.offer_perc > 0 && (
                                        <span className="m-l-15 p-lr-10 p-tb-2 bg-red" style={{ background: '#ff4d4f', color: 'white', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            {variant.offer_perc}% OFF
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="mtext-106 cl2" style={{ fontSize: '2rem', fontWeight: '800' }}>
                                    ₹{variant.price}
                                </span>
                            )}
                        </div>

                        <p className="stext-102 cl6 m-b-40">
                            {variant.product.descriptions}
                        </p>

                        {/* Variants Picker */}
                        <div className="variants-picker m-b-40">
                            <div className="flex-w flex-m p-b-20">
                                <span className="stext-102 cl3 m-r-20" style={{ width: '60px' }}>Color:</span>
                                <span className="stext-102 cl6 font-weight-bold">{variant.color_name}</span>
                            </div>
                            <div className="flex-w flex-m p-b-20">
                                <span className="stext-102 cl3 m-r-20" style={{ width: '60px' }}>Size:</span>
                                <span className="stext-102 cl6 font-weight-bold">{variant.size_name}</span>
                            </div>

                            <div className="flex-w flex-m">
                                <span className="stext-102 cl3 m-r-20" style={{ width: '60px' }}>Others:</span>
                                <div className="flex-w gap-2">
                                    {variant.product.all_variants.map(v => (
                                        <motion.img
                                            key={v.id}
                                            whileHover={{ scale: 1.1 }}
                                            src={getImageUrl(v.variant_image)}
                                            onClick={() => onProductChange(v.slug)}
                                            style={{
                                                width: '50px',
                                                height: '60px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                border: v.slug === variant.slug ? '2px solid #717fe0' : '1px solid #ddd'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-w flex-r-m p-b-10">
                            <div className="w-full flex-w flex-m">
                                <div className="wrap-num-product flex-w m-r-20 m-tb-10" style={{ border: '1px solid #ddd', borderRadius: '30px', height: '50px', width: '120px' }}>
                                    <div className="btn-num-product-down cl8 hov-btn3 trans-04 flex-c-m" style={{ width: '40px', cursor: 'pointer' }} onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                                        -
                                    </div>
                                    <input className="mtext-104 cl3 txt-center num-product" type="number" value={quantity} readOnly style={{ width: '40px', border: 'none', background: 'transparent' }} />
                                    <div className="btn-num-product-up cl8 hov-btn3 trans-04 flex-c-m" style={{ width: '40px', cursor: 'pointer' }} onClick={() => setQuantity(q => q + 1)}>
                                        +
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    className="flex-c-m stext-101 cl0 size-101 bg1 bor1 hov-btn1 p-lr-15 trans-04 m-tb-10"
                                    style={{ flex: 1, borderRadius: '30px' }}
                                >
                                    ADD TO CART
                                </button>

                                <button className="m-l-20 p-15 bor10 hov-bg1 trans-04" style={{ borderRadius: '12px' }}>
                                    <Heart size={22} color="#666" />
                                </button>
                            </div>
                        </div>

                        <div className="stock-status m-t-20">
                            {variant.stock > 0 ? (
                                <span className="text-green-500 font-bold">● In Stock ({variant.stock} available)</span>
                            ) : (
                                <span className="text-red-500 font-bold">● Out of Stock</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container m-t-80 m-b-80">
                <div className="tab-nav flex-w flex-c-m border-b">
                    {['description', 'information', 'reviews'].map(t => (
                        <button
                            key={t}
                            className={`tab-link p-tb-15 p-lr-30 stext-101 ${activeTab === t ? 'cl1 border-b-2' : 'cl8'}`}
                            style={{ borderColor: activeTab === t ? '#717fe0' : 'transparent', background: 'transparent' }}
                            onClick={() => setActiveTab(t)}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="tab-content p-t-40 p-b-40">
                    {activeTab === 'description' && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stext-102 cl6">{variant.product.descriptions}</motion.p>
                    )}
                    {activeTab === 'information' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex-w flex-t p-b-7">
                                <span className="stext-102 cl3 size-205">Weight</span>
                                <span className="stext-102 cl6 size-206">0.8 kg</span>
                            </div>
                            <div className="flex-w flex-t p-b-7">
                                <span className="stext-102 cl3 size-205">Dimensions</span>
                                <span className="stext-102 cl6 size-206">110 x 30 x 100 cm</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Related Products */}
            <div className="related-section">
                <h3 className="mtext-105 cl2 txt-center m-b-50">Related Products</h3>
                <div className="product-grid">
                    {related.map(item => (
                        <div key={item.id} className="related-item cursor-pointer" onClick={() => onProductChange(item.slug)}>
                            <div className="hov-img0 pos-relative" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                                <img src={getImageUrl(item.variant_image)} style={{ width: '100%', height: '350px', objectFit: 'cover' }} />
                                <div className="hov-btn-wrap flex-c-m">
                                    <span className="p-lr-20 p-tb-10 bg0 cl2 bor1 trans-04">View Details</span>
                                </div>
                            </div>
                            <div className="m-t-20 text-center">
                                <h4 className="stext-104 cl4">{item.title}</h4>
                                <span className="stext-105 cl3">₹{item.price}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default ProductDetails;
