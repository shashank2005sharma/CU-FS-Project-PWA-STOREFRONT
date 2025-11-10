import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Package, Eye, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatPrice } from '../utils/currency';

function Orders() {
  const [page, setPage] = useState(1);
  const { isAuthenticated } = useAuth();

  const { data: ordersData, isLoading, error } = useQuery(
    ['orders', page],
    () => api.get(`/orders?page=${page}&limit=10`).then(res => res.data),
    { 
      enabled: isAuthenticated,
      retry: 1,
      onError: (error) => {
        console.log('Orders fetch error:', error);
      }
    }
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#ffc107" />;
      case 'processing':
        return <Package size={16} color="#007bff" />;
      case 'shipped':
        return <Truck size={16} color="#17a2b8" />;
      case 'delivered':
        return <CheckCircle size={16} color="#28a745" />;
      case 'cancelled':
        return <XCircle size={16} color="#dc3545" />;
      default:
        return <Clock size={16} color="#6c757d" />;
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

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="text-center">
          <Package size={64} color="#ccc" style={{ marginBottom: '20px' }} />
          <h2>Please Login</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            You need to be logged in to view your orders
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

  if (error) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="text-center">
          <h2>Error loading orders</h2>
          <p>Please try again later.</p>
        </div>
      </div>
    );
  }

  const orders = ordersData?.orders || [];

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>My Orders</h1>
        <Link to="/products" className="btn btn-outline">
          Continue Shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center" style={{ padding: '60px 20px' }}>
          <Package size={64} color="#ccc" style={{ marginBottom: '20px' }} />
          <h2>No orders yet</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            When you place orders, they will appear here
          </p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '30px' }}>
            {orders.map(order => (
              <div key={order.id} className="card" style={{ marginBottom: '20px' }}>
                <div className="p-4">
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <h3 style={{ marginBottom: '8px' }}>
                        Order #{order.order_number}
                      </h3>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
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
                          textTransform: 'capitalize'
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        marginBottom: '8px'
                      }}>
                        {formatPrice(order.total_amount)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {order.item_count} item{order.item_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid #eee'
                  }}>
                    <div>
                      {order.tracking_number && (
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          Tracking: <span style={{ fontFamily: 'monospace' }}>{order.tracking_number}</span>
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Link 
                        to={`/orders/${order.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        <Eye size={14} />
                        View Details
                      </Link>
                      
                      {order.status === 'delivered' && (
                        <button className="btn btn-primary btn-sm">
                          Reorder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {ordersData?.pagination?.pages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '8px',
              marginTop: '40px'
            }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="btn btn-outline btn-sm"
              >
                Previous
              </button>
              
              {Array.from({ length: ordersData.pagination.pages }, (_, i) => i + 1)
                .filter(pageNum => 
                  pageNum === 1 || 
                  pageNum === ordersData.pagination.pages || 
                  Math.abs(pageNum - page) <= 2
                )
                .map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`btn btn-sm ${
                      pageNum === page ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= ordersData.pagination.pages}
                className="btn btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Orders;