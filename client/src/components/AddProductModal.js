import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { X, Upload } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

function AddProductModal({ isOpen, onClose, editProduct = null }) {
  const [formData, setFormData] = useState({
    name: editProduct?.name || '',
    description: editProduct?.description || '',
    price: editProduct?.price || '',
    stock_quantity: editProduct?.stock_quantity || '',
    category_id: editProduct?.category_id || '',
    image_url: editProduct?.image_url || ''
  });

  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categoriesData } = useQuery(
    'categories',
    () => api.get('/categories').then(res => res.data),
    { enabled: isOpen }
  );

  // Add/Update product mutation
  const productMutation = useMutation(
    (data) => {
      if (editProduct) {
        return api.put(`/products/${editProduct.id}`, data);
      } else {
        return api.post('/products', data);
      }
    },
    {
      onSuccess: () => {
        toast.success(editProduct ? 'Product updated successfully!' : 'Product added successfully!');
        queryClient.invalidateQueries('adminProducts');
        queryClient.invalidateQueries('products');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save product');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      category_id: '',
      image_url: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock_quantity || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    productMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
      category_id: parseInt(formData.category_id)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

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
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
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
            {editProduct ? 'Edit Product' : 'Add New Product'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter product description"
              rows={4}
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="form-input"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock Quantity *</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a category</option>
              {categoriesData?.categories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="form-input"
              placeholder="https://example.com/image.jpg"
            />
            {formData.image_url && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px',
                backgroundColor: 'var(--background)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '200px',
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <p style={{ 
                  display: 'none', 
                  color: 'var(--text-tertiary)',
                  fontSize: '14px'
                }}>
                  Invalid image URL
                </p>
              </div>
            )}
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
              disabled={productMutation.isLoading}
            >
              {productMutation.isLoading 
                ? 'Saving...' 
                : editProduct 
                  ? 'Update Product' 
                  : 'Add Product'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductModal;
