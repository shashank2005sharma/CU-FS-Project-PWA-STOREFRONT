import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Star, ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';

function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();

  const { data: productData, isLoading, error } = useQuery(
    ['product', id],
    () => api.get(`/products/${id}`).then(res => res.data),
    { enabled: !!id }
  );

  const { data: reviewsData } = useQuery(
    ['reviews', id],
    () => api.get(`/reviews/product/${id}`).then(res => res.data),
    { 
      enabled: !!id,
      retry: 1,
      onError: (error) => {
        console.log('Reviews fetch error:', error);
      }
    }
  );

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !productData?.product) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="text-center">
          <h2>Product not found</h2>
          <p>The product you're looking for doesn't exist.</p>
          <Link to="/products" className="btn btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const product = productData.product;
  const reviews = reviewsData?.reviews || [];
  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.image_url].filter(Boolean);

  const handleAddToCart = async () => {
    const result = await addToCart(product.id, quantity);
    if (!result.success && result.message) {
      toast.error(result.message);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} fill="#ffc107" color="#ffc107" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} fill="#ffc107" color="#ffc107" style={{ opacity: 0.5 }} />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} color="#ddd" />);
    }

    return stars;
  };

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link 
          to="/products" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            textDecoration: 'none', 
            color: '#007bff' 
          }}
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div style={{ 
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '16px',
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {images.length > 0 ? (
              <img 
                src={images[selectedImage]} 
                alt={product.name}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{ 
              display: images.length > 0 ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              fontSize: '64px',
              color: '#ccc'
            }}>
              📦
            </div>
          </div>

          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f8f9fa',
                    border: selectedImage === index ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  <img 
                    src={image} 
                    alt={`${product.name} ${index + 1}`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>
            {product.name}
          </h1>

          {/* Category */}
          {product.category_name && (
            <p style={{ 
              color: '#666', 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {product.category_name}
            </p>
          )}

          {/* Rating */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {renderStars(product.avg_rating)}
            </div>
            <span style={{ color: '#666' }}>
              {product.avg_rating.toFixed(1)} ({product.review_count} reviews)
            </span>
          </div>

          {/* Price */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: 'var(--primary)',
              letterSpacing: '-0.02em'
            }}>
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Stock Status */}
          <div style={{ marginBottom: '24px' }}>
            {product.stock_quantity > 0 ? (
              <span style={{ color: '#28a745', fontWeight: '500' }}>
                ✓ In Stock ({product.stock_quantity} available)
              </span>
            ) : (
              <span style={{ color: '#dc3545', fontWeight: '500' }}>
                ✗ Out of Stock
              </span>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          {product.stock_quantity > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                marginBottom: '16px'
              }}>
                <label style={{ fontWeight: '500' }}>Quantity:</label>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ 
                    padding: '12px 16px',
                    minWidth: '60px',
                    textAlign: 'center',
                    borderLeft: '1px solid #ddd',
                    borderRight: '1px solid #ddd'
                  }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                <ShoppingCart size={20} />
                Add to Cart - {formatPrice(product.price * quantity)}
              </button>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 style={{ marginBottom: '12px' }}>Description</h3>
            <p style={{ lineHeight: '1.6', color: '#666' }}>
              {product.description || 'No description available.'}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2>Customer Reviews</h2>
          {reviewsData?.pagination?.total > 0 && (
            <div style={{ fontSize: '14px', color: '#666' }}>
              {reviewsData.pagination.total} review{reviewsData.pagination.total !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Rating Summary */}
        {reviewsData?.ratingStats && reviewsData.ratingStats.length > 0 && (
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {product.avg_rating.toFixed(1)}
                </div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                  {renderStars(product.avg_rating)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {product.review_count} reviews
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map(rating => {
                  const ratingData = reviewsData.ratingStats.find(r => r.rating === rating);
                  const count = ratingData?.count || 0;
                  const percentage = product.review_count > 0 ? (count / product.review_count) * 100 : 0;
                  
                  return (
                    <div key={rating} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '14px', minWidth: '20px' }}>{rating}</span>
                      <Star size={14} fill="#ffc107" color="#ffc107" />
                      <div style={{ 
                        flex: 1, 
                        height: '8px', 
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          backgroundColor: '#ffc107'
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#666', minWidth: '30px' }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {reviews.length > 0 ? (
          <div className="grid grid-1" style={{ gap: '20px' }}>
            {reviews.map(review => (
              <div key={review.id} className="card">
                <div className="p-3">
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                        {renderStars(review.rating)}
                      </div>
                      <p style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {review.user_name}
                        {review.is_verified_purchase && (
                          <span style={{ 
                            backgroundColor: '#e8f5e8',
                            color: '#2e7d32',
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            marginLeft: '8px'
                          }}>
                            ✓ Verified Purchase
                          </span>
                        )}
                      </p>
                    </div>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {review.title && (
                    <h4 style={{ marginBottom: '8px', fontSize: '16px' }}>{review.title}</h4>
                  )}
                  
                  {review.comment && (
                    <p style={{ color: '#666', lineHeight: '1.5' }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center" style={{ padding: '40px' }}>
            <Star size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <h3>No reviews yet</h3>
            <p style={{ color: '#666' }}>Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;