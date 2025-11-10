import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import { CreditCard, MapPin, Package, CheckCircle, Smartphone, Wallet } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';

function Checkout() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Fetch user addresses
  const { data: addressesData } = useQuery(
    'userAddresses',
    () => api.get('/users/addresses').then(res => res.data),
    { enabled: !!isAuthenticated }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      sameAsBilling: true,
      shippingCountry: 'United States',
      billingCountry: 'United States'
    }
  });

  // Auto-fill form with default shipping address when addresses are loaded
  useEffect(() => {
    if (addressesData?.addresses && user && !loading) {
      const defaultAddress = addressesData.addresses.find(addr => 
        addr.type === 'shipping' && addr.is_default
      ) || addressesData.addresses.find(addr => addr.type === 'shipping');

      if (defaultAddress) {
        reset({
          firstName: defaultAddress.first_name,
          lastName: defaultAddress.last_name,
          email: user.email,
          phone: user.phone || '',
          shippingAddress1: defaultAddress.address_line1,
          shippingAddress2: defaultAddress.address_line2 || '',
          shippingCity: defaultAddress.city,
          shippingState: defaultAddress.state,
          shippingPostal: defaultAddress.postal_code,
          shippingCountry: defaultAddress.country,
          sameAsBilling: true,
          billingCountry: 'United States'
        });
      } else {
        // No saved address, use user info
        reset({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          sameAsBilling: true,
          shippingCountry: 'United States',
          billingCountry: 'United States'
        });
      }
    }
  }, [addressesData, user, loading, reset]);

  const sameAsBilling = watch('sameAsBilling');

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="text-center">
          <Package size={64} color="#ccc" style={{ marginBottom: '20px' }} />
          <h2>Your cart is empty</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Add some items to your cart before checkout
          </p>
          <button 
            onClick={() => navigate('/products')} 
            className="btn btn-primary"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setIsProcessing(true);
    
    try {
      // Validate required fields
      if (!data.firstName || !data.lastName || !data.shippingAddress1 || !data.shippingCity || !data.shippingState || !data.shippingPostal) {
        toast.error('Please fill in all required shipping information');
        setIsProcessing(false);
        return;
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const shippingAddress = {
        firstName: data.firstName,
        lastName: data.lastName,
        addressLine1: data.shippingAddress1,
        addressLine2: data.shippingAddress2 || '',
        city: data.shippingCity,
        state: data.shippingState,
        postalCode: data.shippingPostal,
        country: data.shippingCountry || 'United States'
      };

      const billingAddress = sameAsBilling ? null : {
        firstName: data.billingFirstName || data.firstName,
        lastName: data.billingLastName || data.lastName,
        addressLine1: data.billingAddress1 || data.shippingAddress1,
        addressLine2: data.billingAddress2 || data.shippingAddress2 || '',
        city: data.billingCity || data.shippingCity,
        state: data.billingState || data.shippingState,
        postalCode: data.billingPostal || data.shippingPostal,
        country: data.billingCountry || data.shippingCountry || 'United States'
      };

      console.log('Submitting order:', { shippingAddress, billingAddress });

      const response = await api.post('/orders/create', {
        shippingAddress,
        billingAddress
      });

      setOrderId(response.data.order.orderNumber);
      setOrderComplete(true);
      await clearCart();
      toast.success('Order placed successfully!');
      
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="text-center">
          <CheckCircle size={80} color="#28a745" style={{ marginBottom: '20px' }} />
          <h1 style={{ color: '#28a745', marginBottom: '16px' }}>Order Confirmed!</h1>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>
            Thank you for your order
          </p>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Order Number: <strong>{orderId}</strong>
          </p>
          <p style={{ color: '#666', marginBottom: '32px' }}>
            You will receive an email confirmation shortly.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/orders')} 
              className="btn btn-primary"
            >
              View Orders
            </button>
            <button 
              onClick={() => navigate('/products')} 
              className="btn btn-outline"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ marginBottom: '30px' }}>Checkout</h1>
      
      {/* Progress Steps */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '40px',
        gap: '20px'
      }}>
        {[
          { num: 1, label: 'Shipping', icon: MapPin },
          { num: 2, label: 'Payment', icon: CreditCard },
          { num: 3, label: 'Review', icon: Package }
        ].map(({ num, label, icon: Icon }) => (
          <div 
            key={num}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: step >= num ? '#007bff' : '#ccc'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: step >= num ? '#007bff' : '#e9ecef',
              color: step >= num ? 'white' : '#6c757d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {step > num ? '✓' : num}
            </div>
            <span style={{ fontWeight: step >= num ? 'bold' : 'normal' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Main Form */}
        <div style={{ flex: 2 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="card">
                <div className="p-4">
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <MapPin size={20} />
                      Shipping Information
                    </h3>
                    {addressesData?.addresses?.length > 0 && (
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#28a745', 
                        margin: 0,
                        fontWeight: '500'
                      }}>
                        ✓ Using your saved address (you can edit if needed)
                      </p>
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('firstName', { required: 'First name is required' })}
                      />
                      {errors.firstName && <div className="form-error">{errors.firstName.message}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('lastName', { required: 'Last name is required' })}
                      />
                      {errors.lastName && <div className="form-error">{errors.lastName.message}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        {...register('email', { required: 'Email is required' })}
                      />
                      {errors.email && <div className="form-error">{errors.email.message}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-input"
                        {...register('phone', { required: 'Phone is required' })}
                      />
                      {errors.phone && <div className="form-error">{errors.phone.message}</div>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address Line 1</label>
                    <input
                      type="text"
                      className="form-input"
                      {...register('shippingAddress1', { required: 'Address is required' })}
                    />
                    {errors.shippingAddress1 && <div className="form-error">{errors.shippingAddress1.message}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      {...register('shippingAddress2')}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('shippingCity', { required: 'City is required' })}
                      />
                      {errors.shippingCity && <div className="form-error">{errors.shippingCity.message}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('shippingState', { required: 'State is required' })}
                      />
                      {errors.shippingState && <div className="form-error">{errors.shippingState.message}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">ZIP Code</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('shippingPostal', { required: 'ZIP code is required' })}
                      />
                      {errors.shippingPostal && <div className="form-error">{errors.shippingPostal.message}</div>}
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => setStep(2)} 
                    className="btn btn-primary"
                    style={{ marginTop: '20px' }}
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="card">
                <div className="p-4">
                  <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={20} />
                    Payment Method
                  </h3>

                  {/* Payment Method Selection */}
                  <div style={{ marginBottom: '32px' }}>
                    <label className="form-label" style={{ marginBottom: '16px' }}>Select Payment Method</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      {/* Credit/Debit Card */}
                      <div
                        onClick={() => setPaymentMethod('card')}
                        style={{
                          padding: '16px',
                          border: `2px solid ${paymentMethod === 'card' ? 'var(--primary)' : 'var(--border-light)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          backgroundColor: paymentMethod === 'card' ? 'rgba(0, 113, 227, 0.05)' : 'var(--surface)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <CreditCard size={24} color={paymentMethod === 'card' ? 'var(--primary)' : 'var(--text-secondary)'} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Card</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Credit/Debit</div>
                          </div>
                        </div>
                      </div>

                      {/* UPI */}
                      <div
                        onClick={() => setPaymentMethod('upi')}
                        style={{
                          padding: '16px',
                          border: `2px solid ${paymentMethod === 'upi' ? 'var(--primary)' : 'var(--border-light)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          backgroundColor: paymentMethod === 'upi' ? 'rgba(0, 113, 227, 0.05)' : 'var(--surface)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Smartphone size={24} color={paymentMethod === 'upi' ? 'var(--primary)' : 'var(--text-secondary)'} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>UPI</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>PhonePe, GPay</div>
                          </div>
                        </div>
                      </div>

                      {/* Wallets */}
                      <div
                        onClick={() => setPaymentMethod('wallet')}
                        style={{
                          padding: '16px',
                          border: `2px solid ${paymentMethod === 'wallet' ? 'var(--primary)' : 'var(--border-light)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          backgroundColor: paymentMethod === 'wallet' ? 'rgba(0, 113, 227, 0.05)' : 'var(--surface)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Wallet size={24} color={paymentMethod === 'wallet' ? 'var(--primary)' : 'var(--text-secondary)'} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Wallets</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Paytm, Amazon</div>
                          </div>
                        </div>
                      </div>

                      {/* Cash on Delivery */}
                      <div
                        onClick={() => setPaymentMethod('cod')}
                        style={{
                          padding: '16px',
                          border: `2px solid ${paymentMethod === 'cod' ? 'var(--primary)' : 'var(--border-light)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          backgroundColor: paymentMethod === 'cod' ? 'rgba(0, 113, 227, 0.05)' : 'var(--surface)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Package size={24} color={paymentMethod === 'cod' ? 'var(--primary)' : 'var(--text-secondary)'} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>COD</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Cash on Delivery</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details based on selected method */}
                  {paymentMethod === 'card' && (
                    <div style={{ 
                      padding: '20px', 
                      backgroundColor: 'var(--background)', 
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '24px'
                    }}>
                      <div className="form-group">
                        <label className="form-label">Card Number</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="1234 5678 9012 3456"
                          defaultValue="4111 1111 1111 1111"
                          readOnly
                          style={{ backgroundColor: 'var(--surface)' }}
                        />
                        <small style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Demo card number (read-only)</small>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">Expiry Date</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="MM/YY"
                            defaultValue="12/25"
                            readOnly
                            style={{ backgroundColor: 'var(--surface)' }}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">CVV</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="123"
                            defaultValue="123"
                            readOnly
                            style={{ backgroundColor: 'var(--surface)' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div style={{ 
                      padding: '20px', 
                      backgroundColor: 'var(--background)', 
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '24px'
                    }}>
                      <div className="form-group">
                        <label className="form-label">UPI ID</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="yourname@upi"
                          defaultValue="demo@paytm"
                          readOnly
                          style={{ backgroundColor: 'var(--surface)' }}
                        />
                        <small style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Demo UPI ID (read-only)</small>
                      </div>
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: 'rgba(0, 113, 227, 0.05)', 
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}>
                        💡 Supports PhonePe, Google Pay, Paytm, and all UPI apps
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'wallet' && (
                    <div style={{ 
                      padding: '20px', 
                      backgroundColor: 'var(--background)', 
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '24px'
                    }}>
                      <label className="form-label" style={{ marginBottom: '12px' }}>Select Wallet</label>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {['Paytm', 'Amazon Pay', 'PhonePe Wallet', 'Mobikwik'].map(wallet => (
                          <div key={wallet} style={{
                            padding: '12px 16px',
                            border: '1.5px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                            backgroundColor: 'var(--surface)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.backgroundColor = 'rgba(0, 113, 227, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-light)';
                            e.currentTarget.style.backgroundColor = 'var(--surface)';
                          }}>
                            {wallet}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div style={{ 
                      padding: '20px', 
                      backgroundColor: 'var(--background)', 
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '24px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: 'rgba(48, 209, 88, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(48, 209, 88, 0.2)'
                      }}>
                        <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            Cash on Delivery Available
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Pay with cash when your order is delivered. Please keep exact change handy.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        {...register('sameAsBilling')}
                      />
                      Billing address same as shipping
                    </label>
                  </div>

                  {!sameAsBilling && (
                    <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <h4 style={{ marginBottom: '16px' }}>Billing Address</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">First Name</label>
                          <input
                            type="text"
                            className="form-input"
                            {...register('billingFirstName', { required: !sameAsBilling })}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Last Name</label>
                          <input
                            type="text"
                            className="form-input"
                            {...register('billingLastName', { required: !sameAsBilling })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Address Line 1</label>
                        <input
                          type="text"
                          className="form-input"
                          {...register('billingAddress1', { required: !sameAsBilling })}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">City</label>
                          <input
                            type="text"
                            className="form-input"
                            {...register('billingCity', { required: !sameAsBilling })}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">State</label>
                          <input
                            type="text"
                            className="form-input"
                            {...register('billingState', { required: !sameAsBilling })}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">ZIP Code</label>
                          <input
                            type="text"
                            className="form-input"
                            {...register('billingPostal', { required: !sameAsBilling })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="btn btn-outline"
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(3)} 
                      className="btn btn-primary"
                    >
                      Review Order
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="card">
                <div className="p-4">
                  <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={20} />
                    Review Your Order
                  </h3>

                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '12px' }}>Order Items</h4>
                    {items.map(item => (
                      <div key={item.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: '1px solid #eee'
                      }}>
                        <div>
                          <span style={{ fontWeight: '500' }}>{item.name}</span>
                          <span style={{ color: '#666', marginLeft: '8px' }}>x{item.quantity}</span>
                        </div>
                        <span>{formatPrice(item.item_total)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    marginBottom: '24px'
                  }}>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                      This is a demo checkout. No real payment will be processed.
                    </p>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      Your order will be created for demonstration purposes.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => setStep(2)} 
                      className="btn btn-outline"
                      disabled={isProcessing}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isProcessing}
                      style={{ minWidth: '120px' }}
                    >
                      {isProcessing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                          Processing...
                        </div>
                      ) : (
                        'Place Order'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div className="card">
            <div className="p-3">
              <h3 style={{ marginBottom: '20px' }}>Order Summary</h3>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '12px',
                color: 'var(--text-secondary)'
              }}>
                <span>Subtotal ({items.length} items)</span>
                <span>{formatPrice(total)}</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '12px',
                color: 'var(--text-secondary)'
              }}>
                <span>Shipping</span>
                <span style={{ color: 'var(--success)', fontWeight: 500 }}>Free</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '12px',
                color: 'var(--text-secondary)'
              }}>
                <span>Tax (GST 18%)</span>
                <span>{formatPrice(total * 0.18)}</span>
              </div>
              
              <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border-light)' }} />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>{formatPrice(total * 1.18)}</span>
              </div>
              
              {paymentMethod === 'cod' && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 159, 10, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)'
                }}>
                  💰 COD charges may apply
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;