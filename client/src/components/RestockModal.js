import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { X, Package } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';

function RestockModal({ isOpen, onClose, product }) {
  const [quantity, setQuantity] = useState('');
  const queryClient = useQueryClient();

  const restockMutation = useMutation(
    (newStock) => api.put(`/products/${product.id}`, {
      stock_quantity: newStock
    }),
    {
      onSuccess: () => {
        toast.success('Product restocked successfully!');
        queryClient.invalidateQueries('adminProducts');
        queryClient.invalidateQueries('products');
        onClose();
        setQuantity('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to restock product');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const addQuantity = parseInt(quantity);
    if (isNaN(addQuantity) || addQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const newStock = product.stock_quantity + addQuantity;
    restockMutation.mutate(newStock);
  };

  if (!isOpen || !product) return null;

  return (
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
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="scale-in" style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: '450px',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 28px',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            Restock Product
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-md)',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--background)';
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Product Info */}
        <div style={{ 
          padding: '24px 28px',
          backgroundColor: 'var(--background)',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid var(--border-light)'
            }}>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <Package size={32} color="var(--text-tertiary)" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: '0 0 6px 0',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                {product.name}
              </h3>
              <p style={{ 
                margin: '0 0 4px 0',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}>
                {product.category_name}
              </p>
              <p style={{ 
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--primary)'
              }}>
                {formatPrice(product.price)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--background)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Stock:</span>
              <span style={{ 
                fontWeight: 600,
                color: product.stock_quantity < 10 ? 'var(--warning)' : 'var(--success)'
              }}>
                {product.stock_quantity} units
              </span>
            </div>
            {quantity && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-light)'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>New Stock:</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                  {product.stock_quantity + parseInt(quantity || 0)} units
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Add Quantity *</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="form-input"
              placeholder="Enter quantity to add"
              min="1"
              required
              autoFocus
            />
            <small style={{ 
              color: 'var(--text-tertiary)',
              fontSize: '13px',
              marginTop: '6px',
              display: 'block'
            }}>
              Enter the number of units to add to current stock
            </small>
          </div>

          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end',
            marginTop: '24px'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={restockMutation.isLoading}
            >
              {restockMutation.isLoading ? 'Restocking...' : 'Restock Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RestockModal;
