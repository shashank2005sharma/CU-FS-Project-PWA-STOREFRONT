import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';

function Cart() {
  const { items, total, loading, updateCartItem, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="text-center">
          <ShoppingBag size={64} color="#ccc" style={{ marginBottom: '20px' }} />
          <h2>Please Login</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            You need to be logged in to view your cart
          </p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="text-center">
          <ShoppingBag size={64} color="#ccc" style={{ marginBottom: '20px' }} />
          <h2>Your cart is empty</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Add some products to get started
          </p>
          <Link to="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartItem(cartItemId, newQuantity);
  };

  const handleRemoveItem = async (cartItemId) => {
    if (window.confirm('Remove this item from cart?')) {
      await removeFromCart(cartItemId);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Clear all items from cart?')) {
      await clearCart();
    }
  };

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>Shopping Cart ({items.length} items)</h1>
        <button
          onClick={handleClearCart}
          className="btn btn-outline btn-sm"
          style={{ color: '#dc3545', borderColor: '#dc3545' }}
        >
          Clear Cart
        </button>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Cart Items */}
        <div style={{ flex: 1 }}>
          <div className="card">
            {items.map((item, index) => (
              <div key={item.id}>
                <div style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  padding: '20px',
                  alignItems: 'center'
                }}>
                  {/* Product Image */}
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '24px' }}>📦</span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '8px' }}>
                      <Link 
                        to={`/products/${item.product_id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {item.name}
                      </Link>
                    </h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      {formatPrice(item.price)} each
                    </p>
                    {item.stock_quantity <= 5 && (
                      <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                        Only {item.stock_quantity} left in stock
                      </p>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ 
                        padding: '8px 12px',
                        minWidth: '40px',
                        textAlign: 'center',
                        borderLeft: '1px solid #ddd',
                        borderRight: '1px solid #ddd'
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div style={{ minWidth: '80px', textAlign: 'right' }}>
                      <strong>{formatPrice(item.item_total)}</strong>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        padding: '8px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {index < items.length - 1 && (
                  <hr style={{ margin: 0, borderColor: '#eee' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div className="card">
            <div className="p-3">
              <h3 style={{ marginBottom: '20px' }}>Order Summary</h3>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span>Subtotal ({items.length} items)</span>
                <span>{formatPrice(total)}</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span>Shipping</span>
                <span>Free</span>
              </div>
              
              <hr style={{ margin: '16px 0' }} />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '20px'
              }}>
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              
              <Link 
                to="/checkout" 
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '12px' }}
              >
                Proceed to Checkout
              </Link>
              
              <Link 
                to="/products" 
                className="btn btn-outline"
                style={{ width: '100%' }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;