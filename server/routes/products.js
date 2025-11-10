const express = require('express');
const { query, body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all products with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category;
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'desc';

    // Build WHERE conditions
    let conditions = ['p.is_active = TRUE'];
    let params = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      conditions.push('p.category_id = ?');
      params.push(parseInt(category));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort parameters
    const validSortColumns = ['name', 'price', 'created_at'];
    const validSortOrders = ['asc', 'desc'];
    
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

    // Get products
    const productsQuery = `
      SELECT 
        p.id, p.name, p.description, p.price, p.category_id,
        p.stock_quantity, p.image_url, p.images, p.created_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${safeSortBy} ${safeSortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [products] = await db.execute(productsQuery, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;

    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;

    // Get ratings for products
    let ratingsMap = {};
    if (products.length > 0) {
      const productIds = products.map(p => p.id);
      const placeholders = productIds.map(() => '?').join(',');
      
      const [ratings] = await db.execute(`
        SELECT 
          product_id,
          AVG(rating) as avg_rating,
          COUNT(*) as review_count
        FROM product_reviews 
        WHERE product_id IN (${placeholders})
        GROUP BY product_id
      `, productIds);
      
      ratings.forEach(rating => {
        ratingsMap[rating.product_id] = {
          avg_rating: parseFloat(rating.avg_rating) || 0,
          review_count: parseInt(rating.review_count) || 0
        };
      });
    }

    res.json({
      products: products.map(product => ({
        ...product,
        images: product.images || [],
        avg_rating: ratingsMap[product.id]?.avg_rating || 0,
        review_count: ratingsMap[product.id]?.review_count || 0
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const [products] = await db.execute(`
      SELECT 
        p.id, p.name, p.description, p.price, p.category_id,
        p.stock_quantity, p.image_url, p.images, p.created_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = TRUE
    `, [productId]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = {
      ...products[0],
      images: products[0].images || [],
      avg_rating: 0,
      review_count: 0
    };

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const [products] = await db.execute(`
      SELECT 
        p.id, p.name, p.description, p.price, p.category_id,
        p.stock_quantity, p.image_url, p.images, p.created_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
      ORDER BY p.created_at DESC
      LIMIT 8
    `);

    res.json({
      products: products.map(product => ({
        ...product,
        images: product.images || [],
        avg_rating: 0,
        review_count: 0
      }))
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new product (Admin only)
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('category_id').isInt({ min: 1 }).withMessage('Valid category is required'),
  body('description').optional().trim(),
  body('image_url').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    const [users] = await db.execute(
      'SELECT email FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0 || !users[0].email.includes('admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, description, price, stock_quantity, category_id, image_url } = req.body;

    // Verify category exists
    const [categories] = await db.execute(
      'SELECT id FROM categories WHERE id = ?',
      [category_id]
    );

    if (categories.length === 0) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Insert product
    const [result] = await db.execute(`
      INSERT INTO products (name, description, price, stock_quantity, category_id, image_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `, [name, description || null, price, stock_quantity, category_id, image_url || null]);

    res.status(201).json({ 
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product (Admin only)
router.put('/:id', [
  auth,
  body('name').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('category_id').optional().isInt({ min: 1 }),
  body('description').optional().trim(),
  body('image_url').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    const [users] = await db.execute(
      'SELECT email FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0 || !users[0].email.includes('admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const productId = parseInt(req.params.id);
    const updates = req.body;

    // Check if product exists
    const [products] = await db.execute(
      'SELECT id FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If category_id is being updated, verify it exists
    if (updates.category_id) {
      const [categories] = await db.execute(
        'SELECT id FROM categories WHERE id = ?',
        [updates.category_id]
      );

      if (categories.length === 0) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updates.description || null);
    }
    if (updates.price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(updates.price);
    }
    if (updates.stock_quantity !== undefined) {
      updateFields.push('stock_quantity = ?');
      updateValues.push(updates.stock_quantity);
    }
    if (updates.category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateValues.push(updates.category_id);
    }
    if (updates.image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(updates.image_url || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(productId);

    await db.execute(`
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;