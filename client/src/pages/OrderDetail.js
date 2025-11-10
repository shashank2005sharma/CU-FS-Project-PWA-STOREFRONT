import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, Package, Truck, MapPin, CreditCard, CheckCircle, Clock, XCircle, Star, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ReviewModal from '../components/ReviewModal';
import { formatPrice } from '../utils/currency';

function OrderDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [existingReview, setExistingReview] = useState(null);

  const { data: orderData, isLoading, error } = useQuery(
    ['order', id],
    () => api.get(`/orders/${id}`).then(res => res.data),
    { enabled: !!id && isAuthenticated }
  );

  // Fetch user's reviews for products in this order
  const { data: userReviews } = useQuery(
    ['userReviews', id],
    async () => {
      if (!orderData?.order?.items) return {};
      
      const productIds = orderData.order.items.map(item => item.product_id);
      const reviewsMap = {};
      
      // Fetch reviews for each product
      await Promise.all(
        productIds.map(async (productId) => {
          try {
            const response = await api.get(`/reviews/product/${productId}`);
            const userReview = response.data.reviews?.find(review => review.user_id === orderData.order.user_id);
            if (userReview) {
              reviewsMap[productId] = userReview;
            }
          } catch (error) {
            // Ignore errors for individual products
          }
        })
      );
      
      return reviewsMap;
    },
    { 
      enabled: !!orderData?.order?.items && isAuthenticated,
      retry: 1
    }
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} color="#ffc107" />;
      case 'processing':
        return <Package size={20} color="#007bff" />;
      case 'shipped':
        return <Truck size={20} color="#17a2b8" />;
      case 'delivered':
        return <CheckCircle size={20} color="#28a745" />;
      case 'cancelled':
        return <XCircle size={20} color="#dc3545" />;
      default:
        return <Clock size={20} color="#6c757d" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'processing':
        return '#007bff';
      case 'shipped':
        return '#17a2b8';
      case 'delivered':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  // Mock tracking events for demo
  const getTrackingEvents = (status) => {
    const events = [
      {
        status: 'Order Placed',
        description: 'Your order has been received and is being processed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        completed: true
      },
      {
        status: 'Processing',
        description: 'Your order is being prepared for shipment',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completed: ['processing', 'shipped', 'delivered'].includes(status)
      },
      {
        status: 'Shipped',
        description: 'Your order has been shipped and is on its way',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        completed: ['shipped', 'delivered'].includes(status)
      },
      {
        status: 'Out for Delivery',
        description: 'Your order is out for delivery',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        completed: status === 'delivered'
      },
      {
        status: 'Delivered',
        description: 'Your order has been delivered',
        timestamp: new Date(),
        completed: status === 'delivered'
      }
    ];

    return events.filter(event => event.completed || events.indexOf(event) <= events.findIndex(e => e.completed) + 1);
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="text-center">
          <Package size={64} color="#ccc" style={{ marginBottom: '20px' }} />
          <h2>Please Login</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            You need to be logged in to view order details
          </p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !orderData?.order) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="text-center">
          <h2>Order not found</h2>
          <p>The order you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/orders" className="btn btn-primary">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const order = orderData.order;
  const trackingEvents = getTrackingEvents(order.status);

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link 
          to="/orders" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            textDecoration: 'none', 
            color: '#007bff' 
          }}
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
      </div>

      {/* Order Header */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div className="p-4">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '20px'
          }}>
            <div>
              <h1 style={{ marginBottom: '8px' }}>
                Order #{order.order_number}
              </h1>
              <p style={{ color: '#666', marginBottom: '12px' }}>
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px'
              }}>
                {getStatusIcon(order.status)}
                <span style={{ 
                  color: getStatusColor(order.status),
                  fontWeight: '500',
                  textTransform: 'capitalize',
                  fontSize: '16px'
                }}>
                  {order.status}
                </span>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                {formatPrice(order.total_amount)}
              </div>
              {order.tracking_number && (
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Tracking: <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                    {order.tracking_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Main Content */}
        <div>
          {/* Order Tracking */}
          <div className="card" style={{ marginBottom: '30px' }}>
            <div className="p-4">
              <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} />
                Order Tracking
              </h2>
              
              <div style={{ position: 'relative' }}>
                {trackingEvents.map((event, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    gap: '16px',
                    marginBottom: index < trackingEvents.length - 1 ? '24px' : '0'
                  }}>
                    <div style={{ 
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: event.completed ? '#28a745' : '#e9ecef',
                      color: event.completed ? 'white' : '#6c757d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {event.completed ? '✓' : index + 1}
                    </div>
                    
                    <div style={{ flex: 1, paddingTop: '8px' }}>
                      <h4 style={{ 
                        marginBottom: '4px',
                        color: event.completed ? '#333' : '#6c757d'
                      }}>
                        {event.status}
                      </h4>
                      <p style={{ 
                        color: '#666', 
                        fontSize: '14px',
                        marginBottom: '4px'
                      }}>
                        {event.description}
                      </p>
                      {event.completed && (
                        <p style={{ 
                          color: '#666', 
                          fontSize: '12px'
                        }}>
                          {event.timestamp.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    
                    {index < trackingEvents.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: '19px',
                        top: '40px',
                        width: '2px',
                        height: '24px',
                        backgroundColor: event.completed ? '#28a745' : '#e9ecef'
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <div className="p-4">
              <h2 style={{ marginBottom: '20px' }}>Order Items</h2>
              
              {order.items?.map(item => {
                const existingReview = userReviews?.[item.product_id];
                const canReview = order.status === 'delivered';
                
                return (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    gap: '16px',
                    padding: '16px 0',
                    borderBottom: '1px solid #eee'
                  }}>
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
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ marginBottom: '8px' }}>{item.name}</h4>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                        Quantity: {item.quantity}
                      </p>
                      <p style={{ fontWeight: '500', marginBottom: '12px' }}>
                        {formatPrice(item.price)} each
                      </p>
                      
                      {/* Review Section */}
                      {canReview && (
                        <div>
                          {existingReview ? (
                            <div style={{ 
                              backgroundColor: '#f8f9fa', 
                              padding: '12px', 
                              borderRadius: '4px',
                              marginBottom: '8px'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                marginBottom: '4px'
                              }}>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                      key={star}
                                      size={14}
                                      fill={star <= existingReview.rating ? '#ffc107' : 'none'}
                                      color={star <= existingReview.rating ? '#ffc107' : '#ddd'}
                                    />
                                  ))}
                                </div>
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                  Your Review
                                </span>
                              </div>
                              {existingReview.title && (
                                <p style={{ 
                                  fontWeight: '500', 
                                  fontSize: '14px', 
                                  marginBottom: '4px' 
                                }}>
                                  {existingReview.title}
                                </p>
                              )}
                              {existingReview.comment && (
                                <p style={{ 
                                  fontSize: '14px', 
                                  color: '#666',
                                  marginBottom: '8px'
                                }}>
                                  {existingReview.comment}
                                </p>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedProduct({
                                    id: item.product_id,
                                    name: item.name,
                                    price: item.price,
                                    image_url: item.image_url
                                  });
                                  setExistingReview(existingReview);
                                  setReviewModalOpen(true);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#007bff',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Edit2 size={12} />
                                Edit Review
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedProduct({
                                  id: item.product_id,
                                  name: item.name,
                                  price: item.price,
                                  image_url: item.image_url
                                });
                                setExistingReview(null);
                                setReviewModalOpen(true);
                              }}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '12px' }}
                            >
                              <Star size={12} />
                              Write Review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Shipping Address */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="p-3">
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} />
                Shipping Address
              </h3>
              
              <div style={{ lineHeight: '1.5', fontSize: '14px' }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                  {order.shipping_address.firstName} {order.shipping_address.lastName}
                </div>
                <div style={{ color: '#666' }}>
                  {order.shipping_address.addressLine1}
                  {order.shipping_address.addressLine2 && (
                    <><br />{order.shipping_address.addressLine2}</>
                  )}
                  <br />
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}
                  <br />
                  {order.shipping_address.country}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="p-3">
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={16} />
                Payment Method
              </h3>
              
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={16} />
                  <span>•••• •••• •••• 1111</span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  Demo Payment Method
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="card">
            <div className="p-3">
              <h3 style={{ marginBottom: '16px' }}>Order Summary</h3>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <span>Subtotal</span>
                <span>{formatPrice(order.total_amount / 1.18)}</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <span>Shipping</span>
                <span>Free</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                <span>Tax (GST 18%)</span>
                <span>{formatPrice(order.total_amount * 0.18 / 1.18)}</span>
              </div>
              
              <hr style={{ margin: '12px 0' }} />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedProduct(null);
          setExistingReview(null);
        }}
        product={selectedProduct}
        existingReview={existingReview}
      />
    </div>
  );
}

export default OrderDetail;