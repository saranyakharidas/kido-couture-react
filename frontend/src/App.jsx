import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Eye, Heart, Star } from 'lucide-react'
import './index.css'

console.log('App.jsx is executing');

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/media/')) return `http://localhost:8000${url}`
  return `http://localhost:8000/media/${url}`
}

function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(0)
  const [hoveredId, setHoveredId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [price, setPrice] = useState('all')

  const handleQuickView = (product) => {
    setSelectedProduct(product)
    setShowModal(true)
  }

  const fetchCategories = () => {
    fetch('/api/categories/')
      .then(res => res.json())
      .then(data => {
        setCategories([{ id: 0, name: 'All Products' }, ...data])
      })
      .catch(err => console.error('Error fetching categories:', err))
  }

  const fetchProducts = () => {
    setLoading(true)
    let url = `/api/shop/${activeCategory}?search=${search}&sort=${sort}&price=${price}`

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data)
        } else {
          console.error('Invalid products data format', data)
          setProducts([])
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching products:', error)
        setProducts([])
        setLoading(false)
      })
  }

  useEffect(() => {
    console.log('App mounted, calling fetchCategories');
    fetchCategories()
  }, [])

  useEffect(() => {
    console.log('Dependency change, calling fetchProducts', { search, sort, price, activeCategory });
    const timer = setTimeout(() => {
      fetchProducts()
    }, search ? 500 : 0)
    return () => clearTimeout(timer)
  }, [search, sort, price, activeCategory])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  }


  return (
    <div className="premium-container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="section-title">Kido Couture</h1>
        <p className="section-subtitle">DISCOVER OUR EXCLUSIVE REACT POWERED COLLECTION</p>

        {/* Premium Category Navigation */}
        <div className="category-nav">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.name}
              {activeCategory === cat.id && (
                <motion.div
                  layoutId="activeTab"
                  className="active-indicator"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
          marginBottom: '40px',
          padding: '20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-premium)'
        }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px 12px 45px',
                borderRadius: '30px',
                border: '1px solid #eee',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
            <Eye size={18} style={{ position: 'absolute', left: '18px', top: '13px', color: '#888' }} />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '12px 25px',
              borderRadius: '30px',
              border: '1px solid #eee',
              outline: 'none',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="default">Default Sorting</option>
            <option value="newness">Newness</option>
            <option value="price_low_to_high">Price: Low to High</option>
            <option value="price_high_to_low">Price: High to Low</option>
          </select>

          <select
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{
              padding: '12px 25px',
              borderRadius: '30px',
              border: '1px solid #eee',
              outline: 'none',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Prices</option>
            <option value="0-500">₹0 - ₹500</option>
            <option value="500-1000">₹500 - ₹1000</option>
            <option value="1000-2000">₹1000 - ₹2000</option>
            <option value="2000-3000">₹2000 - ₹3000</option>
            <option value="3000+">₹3000+</option>
          </select>
        </div>
      </motion.div>

      {loading ? (
        <div className="product-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="product-card skeleton" style={{ height: '450px' }}>
              <div style={{ height: '350px', background: '#eee', borderRadius: '12px 12px 0 0' }}></div>
              <div style={{ padding: '20px' }}>
                <div style={{ height: '10px', background: '#eee', width: '40%', margin: '0 auto 10px' }}></div>
                <div style={{ height: '15px', background: '#eee', width: '70%', margin: '0 auto' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="product-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#888' }}
              >
                <h3>No products found in this category.</h3>
              </motion.div>
            ) : products.map((product) => (
              <motion.div
                key={product.id}
                className="product-card"
                variants={itemVariants}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
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
                  />

                  <div className="quick-view-overlay">
                    <motion.button
                      className="quick-view-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickView(product)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Eye size={18} /> Quick View
                      </div>
                    </motion.button>
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: '15px',
                    right: hoveredId === product.id ? '15px' : '-50px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <button style={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      padding: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                      <Heart size={20} color="#717fe0" />
                    </button>
                    <button style={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      padding: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                      <ShoppingCart size={20} color="#717fe0" />
                    </button>
                  </div>
                </div>

                <div className="product-info">
                  <div className="product-category">{product.product.category.name}</div>
                  <h3 className="product-name">{product.title}</h3>

                  <div className="product-price-container">
                    <span className="current-price">₹{Math.round(product.discount_price || product.price)}</span>
                    {product.discount_price && product.discount_price < product.price && (
                      <span className="old-price">₹{product.price}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={14} fill={star <= 4 ? "#f1c40f" : "none"} color="#f1c40f" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Premium Quick View Modal */}
      <AnimatePresence>
        {showModal && selectedProduct && (
          <div className="modal-overlay" onClick={() => setShowModal(false)} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(8px)'
          }}>
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white',
                maxWidth: '1000px',
                width: '100%',
                borderRadius: '24px',
                overflow: 'hidden',
                display: 'flex',
                maxHeight: '90vh'
              }}
            >
              <div style={{ flex: 1, background: '#f8f8f8' }}>
                <img
                  src={getImageUrl(selectedProduct.variant_image)}
                  alt={selectedProduct.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ flex: 1, padding: '50px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="product-category" style={{ textAlign: 'left' }}>{selectedProduct.product.category.name}</div>
                    <h2 style={{ fontSize: '2rem', margin: '10px 0', fontFamily: 'Playfair Display, serif' }}>{selectedProduct.title}</h2>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
                </div>

                <div className="product-price-container" style={{ justifyContent: 'flex-start', margin: '20px 0' }}>
                  <span className="current-price" style={{ fontSize: '1.8rem' }}>₹{Math.round(selectedProduct.discount_price || selectedProduct.price)}</span>
                  {selectedProduct.discount_price && selectedProduct.discount_price < selectedProduct.price && (
                    <span className="old-price" style={{ fontSize: '1.2rem' }}>₹{selectedProduct.price}</span>
                  )}
                </div>

                <p style={{ color: '#666', lineHeight: '1.6', margin: '20px 0' }}>
                  {selectedProduct.product.descriptions || "This premium garment is crafted with the finest materials to ensure both comfort and style for any occasion."}
                </p>

                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '30px', padding: '5px' }}>
                      <button style={{ background: 'none', border: 'none', width: '40px', cursor: 'pointer' }}>-</button>
                      <input type="text" value="1" readOnly style={{ width: '40px', textAlign: 'center', border: 'none', background: 'none' }} />
                      <button style={{ background: 'none', border: 'none', width: '40px', cursor: 'pointer' }}>+</button>
                    </div>
                    <span style={{ color: '#888' }}>{selectedProduct.stock > 0 ? `${selectedProduct.stock} items in stock` : 'Out of stock'}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%',
                      padding: '18px',
                      background: '#717fe0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '30px',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      boxShadow: '0 10px 20px rgba(113, 127, 224, 0.2)'
                    }}
                  >
                    ADD TO CART
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
