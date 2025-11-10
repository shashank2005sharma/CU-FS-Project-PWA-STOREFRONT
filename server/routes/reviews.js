const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get product reviews
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [reviews] = await db.execute(`
      SELECT 
        pr.id, pr.product_id, pr.user_id, pr.rating, pr.title, pr.comment, 
        pr.images, pr.is_verified_purchase, pr.created_at,
        u.first_name, u.last_name
      FROM product_reviews pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = ?
      ORDER BY pr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, [productId]);

    // Get total count
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM product_reviews WHERE product_id = ?',
      [productId]
    );

    // Get rating distribution
    const [ratingStats] = await db.execute(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM product_reviews 
      WHERE product_id = ?
      GROUP BY rating
      ORDER BY rating DESC
    `, [productId]);

    res.json({
      reviews: reviews.map(review => ({
        ...review,
        images: review.images || [],
        user_name: `${review.first_name} ${review.last_name.charAt(0)}.`
      })),
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      },
      ratingStats
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add product review
router.post('/', [
  auth,
  body('productId').isInt({ min: 1 }),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').optional().trim().isLength({ max: 255 }),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, rating, title, comment, images } = req.body;

    // Check if product exists
    const [products] = await db.execute(
      'SELECT id FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const [existingReviews] = await db.execute(
      'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    if (existingReviews.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Check if user purchased this product (verified purchase)
    const [purchases] = await db.execute(`
      SELECT oi.id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('delivered', 'processing', 'shipped')
    `, [req.user.id, productId]);

    const isVerifiedPurchase = purchases.length > 0;

    // Only allow reviews for purchased products
    if (!isVerifiedPurchase) {
      return res.status(403).json({ message: 'You can only review products you have purchased' });
    }

    await db.execute(`
      INSERT INTO product_reviews (product_id, user_id, rating, title, comment, images, is_verified_purchase)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      productId, req.user.id, rating, title || null, comment || null,
      images ? JSON.stringify(images) : null, isVerifiedPurchase
    ]);

    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update review
router.put('/:id', [
  auth,
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').optional().trim().isLength({ max: 255 }),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reviewId = req.params.id;
    const { rating, title, comment, images } = req.body;

    // Check if review belongs to user
    const [reviews] = await db.execute(
      'SELECT id FROM product_reviews WHERE id = ? AND user_id = ?',
      [reviewId, req.user.id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await db.execute(`
      UPDATE product_reviews SET
        rating = ?, title = ?, comment = ?, images = ?
      WHERE id = ?
    `, [
      rating, title || null, comment || null,
      images ? JSON.stringify(images) : null, reviewId
    ]);

    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
  try {
    const reviewId = req.params.id;

    const [result] = await db.execute(
      'DELETE FROM product_reviews WHERE id = ? AND user_id = ?',
      [reviewId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reviews
router.get('/user/my-reviews', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [reviews] = await db.execute(`
      SELECT 
        pr.id, pr.product_id, pr.rating, pr.title, pr.comment, 
        pr.images, pr.is_verified_purchase, pr.created_at,
        p.name as product_name, p.image_url as product_image
      FROM product_reviews pr
      JOIN products p ON pr.product_id = p.id
      WHERE pr.user_id = ?
      ORDER BY pr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, [req.user.id]);

    // Get total count
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM product_reviews WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      reviews: reviews.map(review => ({
        ...review,
        images: review.images || []
      })),
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;