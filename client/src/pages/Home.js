import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ShoppingBag, Truck, Shield, Smartphone } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

function Home() {
  const { data: featuredProducts, isLoading } = useQuery(
    'featuredProducts',
    () => api.get('/products/featured/list').then(res => res.data),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: categories } = useQuery(
    'categories',
    () => api.get('/categories').then(res => res.data),
    { staleTime: 10 * 60 * 1000 }
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="fade-in" style={{ 
        background: 'linear-gradient(135deg, var(--primary) 0%, #0051a8 100%)',
        color: 'white',
        padding: '120px 0 100px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: '64px', 
            marginBottom: '24px', 
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1
          }}>
            Shop Anywhere,<br />Anytime
          </h1>
          <p style={{ 
            fontSize: '24px', 
            marginBottom: '40px', 
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto 40px',
            fontWeight: 400,
            lineHeight: 1.5
          }}>
            Experience seamless shopping with our Progressive Web App. 
            Browse products offline and sync when you're back online.
          </p>
          <Link to="/products" className="btn btn-lg" style={{ 
            backgroundColor: 'white', 
            color: 'var(--primary)',
            fontWeight: 600,
            padding: '16px 40px',
            fontSize: '18px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          }}>
            Start Shopping
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '100px 0', backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <h2 className="text-center" style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)'
          }}>
            Why Choose PWA Store?
          </h2>
          <p className="text-center" style={{
            fontSize: '20px',
            color: 'var(--text-secondary)',
            marginBottom: '60px',
            maxWidth: '600px',
            margin: '0 auto 60px'
          }}>
            Experience the future of online shopping with cutting-edge technology
          </p>
          <div className="grid grid-4" style={{ gap: '32px' }}>
            <div className="text-center p-3 hover-lift" style={{ 
              transition: 'var(--transition)',
              cursor: 'default'
            }}>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.1) 0%, rgba(0, 113, 227, 0.05) 100%)',
                borderRadius: 'var(--radius-xl)', 
                width: '88px', 
                height: '88px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '1px solid rgba(0, 113, 227, 0.1)'
              }}>
                <Smartphone size={44} color="var(--primary)" strokeWidth={1.5} />
              </div>
              <h3 style={{ 
                marginBottom: '12px',
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>PWA Technology</h3>
              <p style={{ 
                color: 'var(--text-secondary)',
                fontSize: '15px',
                lineHeight: 1.6
              }}>
                Install our app on your device and shop like a native mobile app
              </p>
            </div>
            
            <div className="text-center p-3 hover-lift" style={{ 
              transition: 'var(--transition)',
              cursor: 'default'
            }}>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(48, 209, 88, 0.1) 0%, rgba(48, 209, 88, 0.05) 100%)',
                borderRadius: 'var(--radius-xl)', 
                width: '88px', 
                height: '88px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <ShoppingBag size={40} color="#28a745" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Offline Shopping</h3>
              <p style={{ color: '#666' }}>
                Browse products and manage your cart even when you're offline
              </p>
            </div>
            
            <div className="text-center p-3">
              <div style={{ 
                backgroundColor: '#fff3cd', 
                borderRadius: '50%', 
                width: '80px', 
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <Truck size={40} color="#ffc107" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Fast Delivery</h3>
              <p style={{ color: '#666' }}>
                Quick and reliable shipping to your doorstep
              </p>
            </div>
            
            <div className="text-center p-3">
              <div style={{ 
                backgroundColor: '#f8d7da', 
                borderRadius: '50%', 
                width: '80px', 
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <Shield size={40} color="#dc3545" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Secure Shopping</h3>
              <p style={{ color: '#666' }}>
                Your data and payments are protected with enterprise-grade security
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories && (
        <section style={{ padding: '60px 0', backgroundColor: '#f8f9fa' }}>
          <div className="container">
            <h2 className="text-center mb-4" style={{ fontSize: '36px', marginBottom: '50px' }}>
              Shop by Category
            </h2>
            <div className="grid grid-3">
              {categories.categories.slice(0, 6).map(category => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="card"
                  style={{ 
                    textDecoration: 'none', 
                    color: 'inherit',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <div style={{ 
                    height: '200px', 
                    backgroundColor: '#e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px'
                  }}>
                    📦
                  </div>
                  <div className="p-3">
                    <h3 style={{ marginBottom: '8px' }}>{category.name}</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      {category.product_count} products
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section style={{ padding: '60px 0', backgroundColor: 'white' }}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '50px'
          }}>
            <h2 style={{ fontSize: '36px' }}>Featured Products</h2>
            <Link to="/products" className="btn btn-outline">
              View All Products
            </Link>
          </div>
          
          {isLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid grid-4">
              {featuredProducts?.products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;