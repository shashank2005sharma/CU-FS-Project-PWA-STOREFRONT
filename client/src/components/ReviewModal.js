import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { Star, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';

function ReviewModal({ isOpen, onClose, product, existingReview = null }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const queryClient = useQueryClient();

  const reviewMutation = useMutation(
    (reviewData) => {
      if (existingReview) {
        return api.put(`/reviews/${existingReview.id}`, reviewData);
      } else {
        return api.post('/reviews', reviewData);
      }
    },
    {
      onSuccess: () => {
        toast.success(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        queryClient.invalidateQueries(['reviews', product.id]);
        queryClient.invalidateQueries(['product', product.id]);
        queryClient.invalidateQueries('orders');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit review');
      }
    }
  );

  const resetForm = () => {
    setRating(0);
    setTitle('');
    setComment('');
    setHoveredRating(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    reviewMutation.mutate({
      productId: product.id,
      rating,
      title: title.trim() || null,
      comment: comment.trim() || null
    });
  };

  const handleClose = () => {
    onClose();
    if (!existingReview) {
      resetForm();
    }
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
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #eee'
        }}>
          <h2 style={{ margin: 0 }}>
            {existingReview ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#666'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Product Info */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
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
                <span style={{ fontSize: '20px' }}>📦</span>
              )}
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0' }}>{product.name}</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                {formatPrice(product.price)}
              </p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Rating */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500' 
            }}>
              Rating *
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Star
                    size={24}
                    fill={star <= (hoveredRating || rating) ? '#ffc107' : 'none'}
                    color={star <= (hoveredRating || rating) ? '#ffc107' : '#ddd'}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p style={{ 
                margin: '8px 0 0 0', 
                fontSize: '14px', 
                color: '#666' 
              }}>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500' 
            }}>
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your review in a few words"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              maxLength={255}
            />
          </div>

          {/* Comment */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500' 
            }}>
              Your Review (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this product"
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '100px'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end' 
          }}>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={reviewMutation.isLoading || rating === 0}
            >
              {reviewMutation.isLoading 
                ? 'Submitting...' 
                : existingReview 
                  ? 'Update Review' 
                  : 'Submit Review'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;