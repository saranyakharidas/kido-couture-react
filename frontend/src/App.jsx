import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import Navbar from './components/Navbar'
import ProductCard from './components/ProductCard'
import ProductModal from './components/ProductModal'
import Wishlist from './components/Wishlist'
import ProductDetails from './components/ProductDetails'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import UserProfile from './components/UserProfile'
import AuthForms from './components/AuthForms'
import Popup from './components/Popup'
import './index.css'

// Force relative path in development to ensure everything goes through the Vite proxy (handles CORS and IPv4/IPv6 mismatches)
const getApiBaseUrl = () => {
  return '';
};

const API_BASE_URL = getApiBaseUrl();

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/media/')) {
    const baseUrl = API_BASE_URL || window.location.origin;
    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${url}`;
  }
  const baseUrl = API_BASE_URL || window.location.origin;
  return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/media/${url}`;
}

function App({ initialView = 'shop', initialAuthType = 'login' }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(0)
  const [error, setError] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [price, setPrice] = useState('all')
  const [view, setView] = useState(initialView || 'shop') // 'shop', 'wishlist', 'product-details', 'cart'
  const [authType, setAuthType] = useState(initialAuthType || 'login')

  const [currentProductSlug, setCurrentProductSlug] = useState(null)
  const [popup, setPopup] = useState({
    isOpen: false,
    message: '',
    type: 'info',
    onConfirm: () => { },
    onCancel: () => { },
    isConfirm: false
  })

  const triggerPopup = (message, type = 'info', onConfirm = null, isConfirm = false) => {
    setPopup({
      isOpen: true,
      message,
      type,
      onConfirm: () => {
        setPopup(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => setPopup(prev => ({ ...prev, isOpen: false })),
      isConfirm
    });
  };

  const fetchCategories = () => {
    fetch(`${API_BASE_URL}/api/categories/`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories([{ id: 0, name: 'All Products' }, ...data])
        } else {
          setCategories([{ id: 0, name: 'All Products' }])
        }
      })
      .catch(err => console.error('Error fetching categories:', err))
  }

  const fetchProducts = () => {
    setLoading(true)
    setError(null)
    const url = `${API_BASE_URL}/api/shop/${activeCategory}?search=${search}&sort=${sort}&price=${price}`

    fetch(url, { credentials: 'include' })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data)
        } else {
          setProducts([])
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching products:', error)
        setError(error.message)
        setProducts([])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchCategories();
    console.log('Razorpay available:', !!window.Razorpay);
  }, [])

  useEffect(() => {
    if (view === 'shop') {
      const timer = setTimeout(() => {
        fetchProducts()
      }, search ? 500 : 0)
      return () => clearTimeout(timer)
    }
  }, [search, sort, price, activeCategory, view])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  }

  const handleQuickView = (product) => {
    setSelectedProduct(product)
    setShowModal(true)
  }

  const handleProductClick = (slug) => {
    setCurrentProductSlug(slug)
    setView('product-details')
  }

  const handleAddToCart = async (variantId, quantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/add-to-cart/${variantId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1] || ''
        },
        credentials: 'include',
        body: JSON.stringify({ quantity })
      });

      const data = await response.json();
      if (data.success) {
        // Trigger navbar refresh
        window.dispatchEvent(new Event('user-login-success'));
        setShowModal(false);
        triggerPopup(
          'Added to cart! Would you like to view your cart?',
          'success',
          () => setView('cart'),
          true
        );
        return true;
      } else {
        if (response.status === 403) {
          window.location.href = '/signin';
        } else {
          triggerPopup(data.error || 'Failed to add to cart', 'error');
        }
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      triggerPopup('Network error.', 'error');
      return false;
    }
  }

  useEffect(() => {
    const handleNavigation = (e) => setView(e.detail);
    window.addEventListener('navigate', handleNavigation);
    return () => window.removeEventListener('navigate', handleNavigation);
  }, []);

  return (
    <div className="app-root">
      <Navbar
        onViewChange={setView}
        onAuthChange={(type) => { setAuthType(type); setView('auth'); }}
        currentView={view}
      />
      <main className={`premium-container ${view === 'profile' ? 'p-t-20' : ''}`}>
        {error && (
          <div style={{ padding: '20px', background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '12px', marginBottom: '30px', color: '#cf1322', textAlign: 'center' }}>
            <p><strong>Fetch Error:</strong> {error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="header-section text-center">
                <h1 className="section-title">Exclusive Collection</h1>
                <p className="section-subtitle">DISCOVER OUR PREMIUM APPAREL LINE</p>
              </div>

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

              <div className="filter-panel" style={{
                display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center',
                marginBottom: '50px', padding: '30px', background: 'white',
                borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.03)'
              }}>
                <div className="search-wrap" style={{ position: 'relative', flex: '1 1 300px' }}>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '16px 25px 16px 55px', borderRadius: '40px',
                      border: '1px solid #f5f5f5', outline: 'none', background: '#fafafa',
                    }}
                  />
                  <Search size={20} style={{ position: 'absolute', left: '22px', top: '16px', color: '#aaa' }} />
                </div>

                <div className="dropdowns" style={{ display: 'flex', gap: '15px' }}>
                  <select value={sort} onChange={(e) => setSort(e.target.value)} className="custom-select">
                    <option value="default">Default Sorting</option>
                    <option value="newness">Newness</option>
                    <option value="price_low_to_high">Price: Low to High</option>
                    <option value="price_high_to_low">Price: High to Low</option>
                  </select>
                  <select value={price} onChange={(e) => setPrice(e.target.value)} className="custom-select">
                    <option value="all">All Prices</option>
                    <option value="0-500">₹0 - ₹500</option>
                    <option value="500-1000">₹500 - ₹1000</option>
                    <option value="1000-2000">₹1000 - ₹2000</option>
                    <option value="2000-3000">₹2000 - ₹3000</option>
                    <option value="3000+">₹3000+</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="product-grid">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="product-card skeleton" style={{ height: '400px', borderRadius: '24px' }} />
                  ))}
                </div>
              ) : (
                <motion.div className="product-grid" variants={containerVariants} initial="hidden" animate="visible">
                  <AnimatePresence mode="popLayout">
                    {products.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', color: '#999' }}>
                        <p>No products found.</p>
                      </motion.div>
                    ) : products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        getImageUrl={getImageUrl}
                        hoveredId={hoveredId}
                        setHoveredId={setHoveredId}
                        onQuickView={handleQuickView}
                        onAddToCart={handleAddToCart}
                        onClick={handleProductClick}
                        triggerPopup={triggerPopup}
                        variants={itemVariants}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}

          {view === 'wishlist' && (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Wishlist
                API_BASE_URL={API_BASE_URL}
                getImageUrl={getImageUrl}
                onBackToShop={() => setView('shop')}
                triggerPopup={triggerPopup}
              />
            </motion.div>
          )}

          {view === 'product-details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <ProductDetails
                productSlug={currentProductSlug}
                API_BASE_URL={API_BASE_URL}
                getImageUrl={getImageUrl}
                onBack={() => setView('shop')}
                onProductChange={setCurrentProductSlug}
                triggerPopup={triggerPopup}
              />
            </motion.div>
          )}

          {view === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              <Cart
                API_BASE_URL={API_BASE_URL}
                getImageUrl={getImageUrl}
                onBackToShop={() => setView('shop')}
                triggerPopup={triggerPopup}
              />
            </motion.div>
          )}

          {view === 'checkout' && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              <Checkout
                API_BASE_URL={API_BASE_URL}
                getImageUrl={getImageUrl}
                onBackToCart={() => setView('cart')}
                onOrderSuccess={(orderId) => {
                  triggerPopup(`Success! Order #${orderId} has been placed. Your invoice is now available.`, 'success', () => setView('profile'), false, 'View Invoice');
                }}
                triggerPopup={triggerPopup}
              />
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <UserProfile
                API_BASE_URL={API_BASE_URL}
                getImageUrl={getImageUrl}
                onBackToShop={() => setView('shop')}
                triggerPopup={triggerPopup}
              />
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              <AuthForms
                API_BASE_URL={API_BASE_URL}
                onViewChange={setView}
                initialView={authType}
                onLoginSuccess={() => {
                  window.dispatchEvent(new Event('user-login-success'));
                  setView('shop');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <ProductModal
          isOpen={showModal}
          product={selectedProduct}
          getImageUrl={getImageUrl}
          onClose={() => setShowModal(false)}
          onAddToCart={handleAddToCart}
        />

        <Popup
          isOpen={popup.isOpen}
          message={popup.message}
          type={popup.type}
          onConfirm={popup.onConfirm}
          onCancel={popup.onCancel}
          isConfirm={popup.isConfirm}
        />
      </main>
    </div>
  )
}

export default App
