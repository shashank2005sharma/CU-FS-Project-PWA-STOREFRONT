import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, Package, ShoppingCart, Star, TrendingUp, 
  Edit2, Trash2, Search, Plus, RefreshCw,
  CheckCircle, Clock, Truck, XCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';
import AddProductModal from '../components/AddProductModal';
import RestockModal from '../components/RestockModal';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user is admin (simple check for demo)
  const isAdmin = user?.email?.includes('admin');

  // Dashboard stats
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'adminDashboard',
    () => api.get('/admin/dashboard').then(res => res.data),
    { enabled: isAdmin, retry: 1 }
  );

  // Orders data
  const { data: ordersData, isLoading: ordersLoading } = useQuery(
    ['adminOrders', orderSearch, orderStatus],
    () => api.get('/admin/orders', {
      params: { search: orderSearch, status: orderStatus, limit: 50 }
    }).then(res => res.data),
    { enabled: isAdmin && activeTab === 'orders', retry: 1 }
  );

  // Users data
  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['adminUsers', userSearch],
    () => api.get('/admin/users', {
      params: { search: userSearch, limit: 50 }
    }).then(res => res.data),
    { enabled: isAdmin && activeTab === 'users', retry: 1 }
  );

  // Products data
  const { data: productsData, isLoading: productsLoading } = useQuery(
    ['adminProducts', productSearch],
    () => api.get('/admin/products', {
      params: { search: productSearch, limit: 50 }
    }).then(res => res.data),
    { enabled: isAdmin && activeTab === 'products', retry: 1 }
  );

  // Update order status mutation
  const updateOrderMutation = useMutation(
    ({ orderId, status, trackingNumber }) => 
      api.put(`/admin/orders/${orderId}/status`, { status, trackingNumber }),
    {
      onSuccess: () => {
        toast.success('Order status updated successfully');
        queryClient.invalidateQueries('adminOrders');
        setSelectedOrder(null);
        setNewStatus('');
        setTrackingNumber('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order');
      }
    }
  );

  // Delete product mutation
  const deleteProductMutation = useMutation(
    (productId) => api.delete(`/admin/products/${productId}`),
    {
      onSuccess: () => {
        toast.success('Product deleted successfully');
        queryClient.invalidateQueries('adminProducts');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete product');
      }
    }
  );

  // Toggle product status mutation
  const toggleProductMutation = useMutation(
    (productId) => api.put(`/admin/products/${productId}/toggle`),
    {
      onSuccess: () => {
        toast.success('Product status updated');
        queryClient.invalidateQueries('adminProducts');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update product');
      }
    }
  );

  // Create test data mutation
  const createTestDataMutation = useMutation(
    () => api.post('/admin/create-test-data'),
    {
      onSuccess: () => {
        toast.success('Test data created successfully');
        queryClient.invalidateQueries(['adminDashboard', 'adminOrders']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create test data');
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
      case 'pending': return '#ffc107';
      case 'processing': return '#007bff';
      case 'shipped': return '#17a2b8';
      case 'delivered': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="text-center">
          <AlertCircle size={64} color="#dc3545" style={{ marginBottom: '20px' }} />
          <h2>Access Denied</h2>
          <p style={{ color: '#666' }}>You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Products', icon: Package }
  ];

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>Admin Panel</h1>
        <button
          onClick={() => createTestDataMutation.mutate()}
          className="btn btn-outline btn-sm"
          disabled={createTestDataMutation.isLoading}
        >
          {createTestDataMutation.isLoading ? 'Creating...' : 'Create Test Orders'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '30px',
        borderBottom: '1px solid #eee',
        paddingBottom: '16px'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#666',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          {dashboardLoading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-4" style={{ gap: '20px', marginBottom: '30px' }}>
                <div className="card">
                  <div className="p-3" style={{ textAlign: 'center' }}>
                    <Users size={32} color="#007bff" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '24px', marginBottom: '4px' }}>
                      {dashboardData?.stats?.users || 0}
                    </h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>Total Users</p>
                  </div>
                </div>

                <div className="card">
                  <div className="p-3" style={{ textAlign: 'center' }}>
                    <ShoppingCart size={32} color="#28a745" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '24px', marginBottom: '4px' }}>
                      {dashboardData?.stats?.orders || 0}
                    </h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>Total Orders</p>
                  </div>
                </div>

                <div className="card">
                  <div className="p-3" style={{ textAlign: 'center' }}>
                    <Package size={32} color="#ffc107" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '24px', marginBottom: '4px' }}>
                      {dashboardData?.stats?.products || 0}
                    </h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>Active Products</p>
                  </div>
                </div>

                <div className="card">
                  <div className="p-3" style={{ textAlign: 'center' }}>
                    <Star size={32} color="#17a2b8" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '24px', marginBottom: '4px' }}>
                      {dashboardData?.stats?.reviews || 0}
                    </h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>Total Reviews</p>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="card">
                <div className="p-4">
                  <h2 style={{ marginBottom: '20px' }}>Recent Orders</h2>
                  {dashboardData?.recentOrders?.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #eee' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Order</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.recentOrders.map(order => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                              <td style={{ padding: '12px' }}>#{order.order_number}</td>
                              <td style={{ padding: '12px' }}>
                                {order.first_name} {order.last_name}
                                <br />
                                <small style={{ color: '#666' }}>{order.email}</small>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {getStatusIcon(order.status)}
                                  <span style={{ 
                                    color: getStatusColor(order.status),
                                    textTransform: 'capitalize'
                                  }}>
                                    {order.status}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '12px', fontWeight: '500' }}>
                                {formatPrice(order.total_amount)}
                              </td>
                              <td style={{ padding: '12px', color: '#666' }}>
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                      No orders yet
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {/* Search and Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '20px',
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#666'
              }} />
              <input
                type="text"
                placeholder="Search orders..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
            </div>
            
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                minWidth: '150px'
              }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Orders Table */}
          <div className="card">
            <div className="p-4">
              <h2 style={{ marginBottom: '20px' }}>Orders Management</h2>
              
              {ordersLoading ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : ordersData?.orders?.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Order</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Items</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersData.orders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                          <td style={{ padding: '12px' }}>
                            #{order.order_number}
                            {order.tracking_number && (
                              <>
                                <br />
                                <small style={{ color: '#666' }}>
                                  Track: {order.tracking_number}
                                </small>
                              </>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {order.first_name} {order.last_name}
                            <br />
                            <small style={{ color: '#666' }}>{order.email}</small>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {getStatusIcon(order.status)}
                              <span style={{ 
                                color: getStatusColor(order.status),
                                textTransform: 'capitalize'
                              }}>
                                {order.status}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '500' }}>
                            {formatPrice(order.total_amount)}
                          </td>
                          <td style={{ padding: '12px' }}>{order.item_count}</td>
                          <td style={{ padding: '12px', color: '#666' }}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus(order.status);
                                setTrackingNumber(order.tracking_number || '');
                              }}
                              className="btn btn-outline btn-sm"
                            >
                              <Edit2 size={12} />
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                  No orders found
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Order Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginBottom: '20px' }}>
              Update Order #{selectedOrder.order_number}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Tracking Number (Optional)
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => updateOrderMutation.mutate({
                  orderId: selectedOrder.id,
                  status: newStatus,
                  trackingNumber: trackingNumber || null
                })}
                className="btn btn-primary"
                disabled={updateOrderMutation.isLoading}
              >
                {updateOrderMutation.isLoading ? 'Updating...' : 'Update Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {/* Search */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#666'
              }} />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="card">
            <div className="p-4">
              <h2 style={{ marginBottom: '20px' }}>Users Management</h2>
              
              {usersLoading ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : usersData?.users?.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Orders</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Total Spent</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData.users.map(user => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#007bff',
                              color: 'white',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              marginRight: '12px'
                            }}>
                              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                            </div>
                            {user.first_name} {user.last_name}
                            {user.phone && (
                              <>
                                <br />
                                <small style={{ color: '#666' }}>{user.phone}</small>
                              </>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>{user.email}</td>
                          <td style={{ padding: '12px' }}>{user.order_count}</td>
                          <td style={{ padding: '12px', fontWeight: '500' }}>
                            {formatPrice(user.total_spent)}
                          </td>
                          <td style={{ padding: '12px', color: '#666' }}>
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                  No users found
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          {/* Search and Add Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            gap: '16px'
          }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)'
              }} />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="form-input"
                style={{
                  paddingLeft: '40px'
                }}
              />
            </div>
            <button
              onClick={() => {
                setEditProduct(null);
                setAddProductModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>

          {/* Products Table */}
          <div className="card">
            <div className="p-4">
              <h2 style={{ marginBottom: '20px' }}>Products Management</h2>
              
              {productsLoading ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : productsData?.products?.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Price</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Stock</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Rating</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsData.products.map(product => (
                        <tr key={product.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                              {product.name}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {product.description}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>{product.category_name}</td>
                          <td style={{ padding: '12px', fontWeight: '500' }}>
                            {formatPrice(product.price)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                color: product.stock_quantity > 10 ? 'var(--success)' : 
                                       product.stock_quantity > 0 ? 'var(--warning)' : 'var(--error)',
                                fontWeight: 500
                              }}>
                                {product.stock_quantity}
                              </span>
                              {product.stock_quantity < 20 && (
                                <button
                                  onClick={() => {
                                    setRestockProduct(product);
                                    setRestockModalOpen(true);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: 'var(--radius-sm)',
                                    transition: 'var(--transition-fast)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'rgba(0, 113, 227, 0.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                  title="Restock"
                                >
                                  <RefreshCw size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Star size={14} fill="#ffc107" color="#ffc107" />
                              <span>{parseFloat(product.avg_rating).toFixed(1)}</span>
                              <span style={{ color: '#666', fontSize: '12px' }}>
                                ({product.review_count})
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              backgroundColor: product.is_active ? '#e8f5e8' : '#f8f9fa',
                              color: product.is_active ? '#2e7d32' : '#666'
                            }}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => {
                                  setEditProduct(product);
                                  setAddProductModalOpen(true);
                                }}
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '12px' }}
                              >
                                <Edit2 size={12} />
                                Edit
                              </button>
                              <button
                                onClick={() => toggleProductMutation.mutate(product.id)}
                                className="btn btn-outline btn-sm"
                                disabled={toggleProductMutation.isLoading}
                                style={{ fontSize: '12px' }}
                              >
                                {product.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this product?')) {
                                    deleteProductMutation.mutate(product.id);
                                  }
                                }}
                                className="btn btn-outline btn-sm"
                                style={{ color: 'var(--error)', borderColor: 'var(--error)', fontSize: '12px' }}
                                disabled={deleteProductMutation.isLoading}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                  No products found
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit Product Modal */}
      <AddProductModal
        isOpen={addProductModalOpen}
        onClose={() => {
          setAddProductModalOpen(false);
          setEditProduct(null);
        }}
        editProduct={editProduct}
      />

      {/* Restock Modal */}
      <RestockModal
        isOpen={restockModalOpen}
        onClose={() => {
          setRestockModalOpen(false);
          setRestockProduct(null);
        }}
        product={restockProduct}
      />
    </div>
  );
}

export default AdminDashboard;