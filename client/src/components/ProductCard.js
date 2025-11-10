import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';

function ProductCard({ product }) {
  const { addToCart } = useCart();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const result = await addToCart(product.id, 1);
    if (!result.success && result.message) {
      toast.error(result.message);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={14} fill="#ffc107" color="#ffc107" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={14} fill="#ffc107" color="#ffc107" style={{ opacity: 0.5 }} />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={14} color="#ddd" />);
    }

    return stars;
  };

  return (
    <Link 
      to={`/products/${product.id}`}
      className="card hover-lift"
      style={{ 
        textDecoration: 'none', 
        color: 'inherit',
        cursor: 'pointer',
        display: 'block',
        overflow: 'hidden'
      }}
    >
      {/* Product Image */}
      <div style={{ 
        height: '240px', 
        backgroundColor: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transition: 'var(--transition)'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          />
        ) : null}
        <div style={{ 
          display: product.image_url ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          fontSize: '56px',
          color: 'var(--text-tertiary)'
        }}>
          📦
        </div>
        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
          <div className="badge badge-warning" style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            Only {product.stock_quantity} left
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ 
          marginBottom: '6px', 
          fontSize: '17px',
          fontWeight: '600',
          lineHeight: '1.3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em'
        }}>
          {product.name}
        </h3>

        {/* Category */}
        {product.category_name && (
          <p style={{ 
            color: 'var(--text-tertiary)', 
            fontSize: '13px', 
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            fontWeight: 500
          }}>
            {product.category_name}
          </p>
        )}

        {/* Rating */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {renderStars(product.avg_rating)}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            ({product.review_count})
          </span>
        </div>

        {/* Price and Add to Cart */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '16px'
        }}>
          <div>
            <span style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              color: 'var(--primary)',
              letterSpacing: '-0.02em'
            }}>
              {formatPrice(product.price)}
            </span>
          </div>
          
          <button
            onClick={handleAddToCart}
            className="btn btn-primary btn-sm"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '8px 16px'
            }}
          >
            <ShoppingCart size={16} />
            Add
          </button>
        </div>

        {/* Stock Status */}
        {product.stock_quantity === 0 && (
          <div className="badge badge-error" style={{ 
            marginTop: '12px',
            width: '100%',
            justifyContent: 'center'
          }}>
            Out of Stock
          </div>
        )}
      </div>
    </Link>
  );
}

export default ProductCard;