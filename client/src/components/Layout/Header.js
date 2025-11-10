import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user, logout, loading } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.8)', 
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 1px 0 rgba(0, 0, 0, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
    }}>
      <div className="container">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '14px 0',
          gap: '24px'
        }}>
          {/* Logo */}
          <Link 
            to="/" 
            style={{ 
              fontSize: '22px', 
              fontWeight: 600, 
              color: 'var(--text-primary)',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-primary)'}
          >
            PWA Store
          </Link>

          {/* Search Bar */}
          <form 
            onSubmit={handleSearch}
            style={{ 
              display: 'flex', 
              flex: 1, 
              maxWidth: '480px', 
              position: 'relative'
            }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none'
              }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 44px',
                  border: '1.5px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '15px',
                  backgroundColor: 'var(--background)',
                  transition: 'var(--transition)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.backgroundColor = 'var(--surface)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(0, 113, 227, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-light)';
                  e.target.style.backgroundColor = 'var(--background)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </form>

          {/* Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Desktop Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Link 
                to="/products" 
                style={{ 
                  textDecoration: 'none', 
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontWeight: 500,
                  transition: 'var(--transition-fast)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'var(--primary)';
                  e.target.style.backgroundColor = 'rgba(0, 113, 227, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'var(--text-primary)';
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                Products
              </Link>
              
              <Link 
                to="/cart" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  textDecoration: 'none', 
                  color: 'var(--text-primary)',
                  position: 'relative',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 113, 227, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ShoppingCart size={20} />
                {count > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: 'var(--error)',
                    color: 'white',
                    borderRadius: '10px',
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '0 6px',
                    boxShadow: '0 2px 8px rgba(255, 59, 48, 0.3)'
                  }}>
                    {count}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#333'
                    }}
                  >
                    <User size={20} />
                    <span>{loading ? '...' : (user?.firstName || 'User')}</span>
                  </button>
                  
                  {isMenuOpen && (
                    <div 
                      className="scale-in"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        minWidth: '180px',
                        zIndex: 1000,
                        overflow: 'hidden'
                      }}>
                      <Link 
                        to="/profile" 
                        style={{ 
                          display: 'block', 
                          padding: '14px 18px', 
                          textDecoration: 'none', 
                          color: 'var(--text-primary)',
                          fontSize: '15px',
                          transition: 'var(--transition-fast)',
                          borderBottom: '1px solid var(--border-light)'
                        }}
                        onClick={() => setIsMenuOpen(false)}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(0, 113, 227, 0.05)';
                          e.target.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--text-primary)';
                        }}
                      >
                        Profile
                      </Link>
                      <Link 
                        to="/orders" 
                        style={{ 
                          display: 'block', 
                          padding: '14px 18px', 
                          textDecoration: 'none', 
                          color: 'var(--text-primary)',
                          fontSize: '15px',
                          transition: 'var(--transition-fast)',
                          borderBottom: '1px solid var(--border-light)'
                        }}
                        onClick={() => setIsMenuOpen(false)}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(0, 113, 227, 0.05)';
                          e.target.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--text-primary)';
                        }}
                      >
                        Orders
                      </Link>
                      {user?.email?.includes('admin') && (
                        <Link 
                          to="/admin" 
                          style={{ 
                            display: 'block', 
                            padding: '14px 18px', 
                            textDecoration: 'none', 
                            color: 'var(--primary)',
                            fontSize: '15px',
                            fontWeight: '500',
                            transition: 'var(--transition-fast)',
                            borderBottom: '1px solid var(--border-light)'
                          }}
                          onClick={() => setIsMenuOpen(false)}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(0, 113, 227, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          color: 'var(--error)',
                          fontSize: '15px',
                          transition: 'var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(255, 59, 48, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link to="/login" className="btn btn-outline btn-sm">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              className="mobile-menu-btn"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </nav>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}

export default Header;