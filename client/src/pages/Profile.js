import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { User, MapPin, Plus, Edit2, Trash2, Package, Eye, Clock, CheckCircle, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';

// Orders Preview Component
function OrdersPreview() {
  const { data: ordersData, isLoading } = useQuery(
    'recentOrders',
    () => api.get('/orders?page=1&limit=3').then(res => res.data),
    { retry: 1 }
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} color="#ffc107" />;
      case 'processing':
        return <Package size={14} color="#007bff" />;
      case 'shipped':
        return <Truck size={14} color="#17a2b8" />;
      case 'delivered':
        return <CheckCircle size={14} color="#28a745" />;
      default:
        return <Clock size={14} color="#6c757d" />;
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const orders = ordersData?.orders || [];

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Package size={48} color="#ccc" style={{ marginBottom: '16px' }} />
        <h3>No orders yet</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          When you place orders, they will appear here
        </p>
        <Link to="/products" className="btn btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      {orders.map(order => (
        <div key={order.id} className="card" style={{ marginBottom: '16px' }}>
          <div className="p-3">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ marginBottom: '4px' }}>
                  Order #{order.order_number}
                </h4>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  {getStatusIcon(order.status)}
                  <span style={{ 
                    fontSize: '14px',
                    textTransform: 'capitalize'
                  }}>
                    {order.status}
                  </span>
                </div>
                <p style={{ color: '#666', fontSize: '12px' }}>
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {formatPrice(order.total_amount)}
                </div>
                <Link 
                  to={`/orders/${order.id}`}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  <Eye size={12} />
                  View
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Profile() {
  const [activeTab, setActiveTab] = useState('profile');
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const { user, loadUser, loading } = useAuth();
  const queryClient = useQueryClient();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfileForm
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || ''
    }
  });

  // Update form when user data changes
  React.useEffect(() => {
    if (user && !loading) {
      resetProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
    }
  }, [user, loading, resetProfileForm]);

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    formState: { errors: addressErrors },
    reset: resetAddressForm
  } = useForm();

  // Fetch user addresses
  const { data: addressesData } = useQuery(
    'userAddresses',
    () => api.get('/users/addresses').then(res => res.data),
    { enabled: !!user }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data) => api.put('/users/profile', data),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully');
        loadUser();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  // Add address mutation
  const addAddressMutation = useMutation(
    (data) => api.post('/users/addresses', data),
    {
      onSuccess: () => {
        toast.success('Address added successfully');
        queryClient.invalidateQueries('userAddresses');
        setShowAddressForm(false);
        resetAddressForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add address');
      }
    }
  );

  // Update address mutation
  const updateAddressMutation = useMutation(
    ({ id, data }) => api.put(`/users/addresses/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Address updated successfully');
        queryClient.invalidateQueries('userAddresses');
        setEditingAddress(null);
        resetAddressForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update address');
      }
    }
  );

  // Delete address mutation
  const deleteAddressMutation = useMutation(
    (id) => api.delete(`/users/addresses/${id}`),
    {
      onSuccess: () => {
        toast.success('Address deleted successfully');
        queryClient.invalidateQueries('userAddresses');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete address');
      }
    }
  );

  const onProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const onAddressSubmit = (data) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data });
    } else {
      addAddressMutation.mutate(data);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
    resetAddressForm({
      type: address.type,
      firstName: address.first_name,
      lastName: address.last_name,
      addressLine1: address.address_line1,
      addressLine2: address.address_line2,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
      isDefault: address.is_default
    });
  };

  const handleDeleteAddress = (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      deleteAddressMutation.mutate(id);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'orders', label: 'Orders', icon: Package }
  ];

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ marginBottom: '30px' }}>My Account</h1>

      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Sidebar */}
        <div style={{ width: '250px', flexShrink: 0 }}>
          <div className="card">
            <div className="p-3">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  margin: '0 auto 12px'
                }}>
                  {loading ? '...' : `${user?.firstName?.charAt(0) || 'U'}${user?.lastName?.charAt(0) || 'U'}`}
                </div>
                <h3 style={{ marginBottom: '4px' }}>
                  {loading ? 'Loading...' : `${user?.firstName || ''} ${user?.lastName || ''}`}
                </h3>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  {loading ? 'Loading...' : (user?.email || '')}
                </p>
              </div>

              <nav>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        backgroundColor: activeTab === tab.id ? '#e3f2fd' : 'transparent',
                        color: activeTab === tab.id ? '#007bff' : '#333',
                        textAlign: 'left',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {activeTab === 'profile' && (
            <div className="card">
              <div className="p-4">
                <h2 style={{ marginBottom: '24px' }}>Profile Information</h2>
                
                <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-input"
                        {...registerProfile('firstName', { required: 'First name is required' })}
                      />
                      {profileErrors.firstName && (
                        <div className="form-error">{profileErrors.firstName.message}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-input"
                        {...registerProfile('lastName', { required: 'Last name is required' })}
                      />
                      {profileErrors.lastName && (
                        <div className="form-error">{profileErrors.lastName.message}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ''}
                      disabled
                      style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                    />
                    <small style={{ color: '#666' }}>Email cannot be changed</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      {...registerProfile('phone')}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={updateProfileMutation.isLoading}
                  >
                    {updateProfileMutation.isLoading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2>Saved Addresses</h2>
                <button 
                  onClick={() => {
                    setShowAddressForm(true);
                    setEditingAddress(null);
                    resetAddressForm();
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={16} />
                  Add Address
                </button>
              </div>

              {showAddressForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                  <div className="p-4">
                    <h3 style={{ marginBottom: '20px' }}>
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    
                    <form onSubmit={handleAddressSubmit(onAddressSubmit)}>
                      <div className="form-group">
                        <label className="form-label">Address Type</label>
                        <select 
                          className="form-input"
                          {...registerAddress('type', { required: 'Type is required' })}
                        >
                          <option value="shipping">Shipping</option>
                          <option value="billing">Billing</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">First Name</label>
                          <input
                            type="text"
                            className="form-input"
                            {...registerAddress('firstName', { required: 'First name is required' })}
                          />
                          {addressErrors.firstName && (
                            <div className="form-error">{addressErrors.firstName.message}</div>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Last Name</label>
                          <input
                            type="text"
                            className="form-input"
                            {...registerAddress('lastName', { required: 'Last name is required' })}
                          />
                          {addressErrors.lastName && (
                            <div className="form-error">{addressErrors.lastName.message}</div>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Address Line 1</label>
                        <input
                          type="text"
                          className="form-input"
                          {...registerAddress('addressLine1', { required: 'Address is required' })}
                        />
                        {addressErrors.addressLine1 && (
                          <div className="form-error">{addressErrors.addressLine1.message}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          {...registerAddress('addressLine2')}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">City</label>
                          <input
                            type="text"
                            className="form-input"
                            {...registerAddress('city', { required: 'City is required' })}
                          />
                          {addressErrors.city && (
                            <div className="form-error">{addressErrors.city.message}</div>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">State</label>
                          <input
                            type="text"
                            className="form-input"
                            {...registerAddress('state', { required: 'State is required' })}
                          />
                          {addressErrors.state && (
                            <div className="form-error">{addressErrors.state.message}</div>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">ZIP Code</label>
                          <input
                            type="text"
                            className="form-input"
                            {...registerAddress('postalCode', { required: 'ZIP code is required' })}
                          />
                          {addressErrors.postalCode && (
                            <div className="form-error">{addressErrors.postalCode.message}</div>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Country</label>
                        <input
                          type="text"
                          className="form-input"
                          defaultValue="United States"
                          {...registerAddress('country', { required: 'Country is required' })}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            {...registerAddress('isDefault')}
                          />
                          Set as default address
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={addAddressMutation.isLoading || updateAddressMutation.isLoading}
                        >
                          {editingAddress ? 'Update Address' : 'Add Address'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                            resetAddressForm();
                          }}
                          className="btn btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="grid grid-2">
                {addressesData?.addresses?.map(address => (
                  <div key={address.id} className="card">
                    <div className="p-3">
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <span style={{ 
                            backgroundColor: address.type === 'shipping' ? '#e3f2fd' : '#fff3e0',
                            color: address.type === 'shipping' ? '#1976d2' : '#f57c00',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            fontWeight: '500'
                          }}>
                            {address.type}
                          </span>
                          {address.is_default && (
                            <span style={{ 
                              backgroundColor: '#e8f5e8',
                              color: '#2e7d32',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              marginLeft: '8px'
                            }}>
                              Default
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEditAddress(address)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#007bff',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc3545',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ lineHeight: '1.5' }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                          {address.first_name} {address.last_name}
                        </div>
                        <div style={{ color: '#666', fontSize: '14px' }}>
                          {address.address_line1}
                          {address.address_line2 && <><br />{address.address_line2}</>}
                          <br />
                          {address.city}, {address.state} {address.postal_code}
                          <br />
                          {address.country}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {addressesData?.addresses?.length === 0 && (
                <div className="text-center" style={{ padding: '40px' }}>
                  <MapPin size={48} color="#ccc" style={{ marginBottom: '16px' }} />
                  <h3>No addresses saved</h3>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    Add your first address to make checkout faster
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2>Recent Orders</h2>
                <Link to="/orders" className="btn btn-outline btn-sm">
                  View All Orders
                </Link>
              </div>
              
              <OrdersPreview />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;