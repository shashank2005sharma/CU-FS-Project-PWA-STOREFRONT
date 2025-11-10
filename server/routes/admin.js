const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Admin middleware - check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    
    const [users] = await db.execute(
      'SELECT email, first_name, last_name FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0 || !users[0].email.includes('admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.admin = users[0];
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin dashboard stats
router.get('/dashboard', [auth, adminAuth], async (req, res) => {
  try {
    // Get total counts
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [orderCount] = await db.execute('SELECT COUNT(*) as count FROM orders');
    const [productCount] = await db.execute('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');
    const [reviewCount] = await db.execute('SELECT COUNT(*) as count FROM product_reviews');

    // Get recent orders
    const [recentOrders] = await db.execute(`
      SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
             u.first_name, u.last_name, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    
    const [orderStats] = await db.execute(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);

    
    const [revenueStats] = await db.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);

    res.json({
      stats: {
        users: userCount[0].count,
        orders: orderCount[0].count,
        products: productCount[0].count,
        reviews: reviewCount[0].count
      },
      recentOrders,
      orderStats,
      revenueStats
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders with pagination
router.get('/orders', [auth, adminAuth], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause += ' WHERE o.status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' (o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [orders] = await db.execute(`
      SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, o.tracking_number,
             u.id as user_id, u.first_name, u.last_name, u.email,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    // Get total count
    const [countResult] = await db.execute(`
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${whereClause}
    `, params);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.put('/orders/:id/status', [
  auth,
  adminAuth,
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderId = req.params.id;
    const { status, trackingNumber } = req.body;

    let updateQuery = 'UPDATE orders SET status = ?';
    let params = [status];

    if (trackingNumber) {
      updateQuery += ', tracking_number = ?';
      params.push(trackingNumber);
    }

    updateQuery += ' WHERE id = ?';
    params.push(orderId);

    const [result] = await db.execute(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination
router.get('/users', [auth, adminAuth], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = ' WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const [users] = await db.execute(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.created_at,
             COUNT(DISTINCT o.id) as order_count,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    // Get total count
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, params);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details
router.get('/users/:id', [auth, adminAuth], async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user info
    const [users] = await db.execute(`
      SELECT id, email, first_name, last_name, phone, created_at
      FROM users WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user orders
    const [orders] = await db.execute(`
      SELECT id, order_number, status, total_amount, created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);

    // Get user addresses
    const [addresses] = await db.execute(`
      SELECT * FROM user_addresses WHERE user_id = ?
    `, [userId]);

    res.json({
      user: users[0],
      orders,
      addresses
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all products with pagination
router.get('/products', [auth, adminAuth], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const category = req.query.category;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = ' WHERE (p.name LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (category) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' p.category_id = ?';
      params.push(category);
    }

    const [products] = await db.execute(`
      SELECT p.id, p.name, p.description, p.price, p.stock_quantity, p.is_active, p.created_at,
             c.name as category_name,
             COALESCE(AVG(pr.rating), 0) as avg_rating,
             COUNT(pr.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    // Get total count
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total FROM products p ${whereClause}
    `, params);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product
router.delete('/products/:id', [auth, adminAuth], async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if product exists in any orders
    const [orderItems] = await db.execute(
      'SELECT id FROM order_items WHERE product_id = ? LIMIT 1',
      [productId]
    );

    if (orderItems.length > 0) {
      // Don't delete, just deactivate
      await db.execute(
        'UPDATE products SET is_active = FALSE WHERE id = ?',
        [productId]
      );
      return res.json({ message: 'Product deactivated (has order history)' });
    }

    // Safe to delete
    const [result] = await db.execute(
      'DELETE FROM products WHERE id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle product active status
router.put('/products/:id/toggle', [auth, adminAuth], async (req, res) => {
  try {
    const productId = req.params.id;

    const [result] = await db.execute(
      'UPDATE products SET is_active = NOT is_active WHERE id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product status updated successfully' });
  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [productCount] = await db.execute('SELECT COUNT(*) as count FROM products');
    const [orderCount] = await db.execute('SELECT COUNT(*) as count FROM orders');
    const [reviewCount] = await db.execute('SELECT COUNT(*) as count FROM product_reviews');
    const [orderItemCount] = await db.execute('SELECT COUNT(*) as count FROM order_items');
    const [cartItemCount] = await db.execute('SELECT COUNT(*) as count FROM cart_items');

    res.json({
      users: userCount[0].count,
      products: productCount[0].count,
      orders: orderCount[0].count,
      reviews: reviewCount[0].count,
      orderItems: orderItemCount[0].count,
      cartItems: cartItemCount[0].count
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all products
router.post('/clear-products', async (req, res) => {
  try {
    console.log('Starting clear products operation...');
    
    // Disable foreign key checks temporarily
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Foreign key checks disabled');
    
    // Delete in correct order to respect foreign keys
    // Since orders reference products, we need to delete orders too
    const [reviewResult] = await db.execute('DELETE FROM product_reviews');
    console.log(`Deleted ${reviewResult.affectedRows} product reviews`);
    
    const [cartResult] = await db.execute('DELETE FROM cart_items');
    console.log(`Deleted ${cartResult.affectedRows} cart items`);
    
    const [orderItemsResult] = await db.execute('DELETE FROM order_items');
    console.log(`Deleted ${orderItemsResult.affectedRows} order items`);
    
    const [ordersResult] = await db.execute('DELETE FROM orders');
    console.log(`Deleted ${ordersResult.affectedRows} orders`);
    
    const [productsResult] = await db.execute('DELETE FROM products');
    console.log(`Deleted ${productsResult.affectedRows} products`);
    
    // Re-enable foreign key checks
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Foreign key checks re-enabled');

    res.json({ 
      message: 'All products, orders, reviews, and cart items have been cleared successfully',
      deleted: {
        products: productsResult.affectedRows,
        orders: ordersResult.affectedRows,
        orderItems: orderItemsResult.affectedRows,
        reviews: reviewResult.affectedRows,
        cartItems: cartResult.affectedRows
      }
    });
  } catch (error) {
    console.error('Clear products error:', error);
    // Make sure to re-enable foreign key checks even on error
    try {
      await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      console.error('Failed to re-enable foreign key checks:', e);
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Clear all orders
router.post('/clear-orders', async (req, res) => {
  try {
    console.log('Starting clear orders operation...');
    
    // Disable foreign key checks temporarily
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Foreign key checks disabled');
    
    // Delete order items first, then orders
    const [orderItemsResult] = await db.execute('DELETE FROM order_items');
    console.log(`Deleted ${orderItemsResult.affectedRows} order items`);
    
    const [ordersResult] = await db.execute('DELETE FROM orders');
    console.log(`Deleted ${ordersResult.affectedRows} orders`);
    
    // Re-enable foreign key checks
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Foreign key checks re-enabled');

    res.json({ 
      message: 'All orders have been cleared successfully',
      deleted: {
        orders: ordersResult.affectedRows,
        orderItems: orderItemsResult.affectedRows
      }
    });
  } catch (error) {
    console.error('Clear orders error:', error);
    // Make sure to re-enable foreign key checks even on error
    try {
      await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      console.error('Failed to re-enable foreign key checks:', e);
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Clear everything except users
router.post('/clear-all-except-users', async (req, res) => {
  try {
    console.log('Starting clear all except users operation...');
    
    // Disable foreign key checks temporarily
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Foreign key checks disabled');
    
    // Delete everything except users and categories
    const [reviewResult] = await db.execute('DELETE FROM product_reviews');
    console.log(`Deleted ${reviewResult.affectedRows} product reviews`);
    
    const [cartResult] = await db.execute('DELETE FROM cart_items');
    console.log(`Deleted ${cartResult.affectedRows} cart items`);
    
    const [orderItemsResult] = await db.execute('DELETE FROM order_items');
    console.log(`Deleted ${orderItemsResult.affectedRows} order items`);
    
    const [ordersResult] = await db.execute('DELETE FROM orders');
    console.log(`Deleted ${ordersResult.affectedRows} orders`);
    
    const [productsResult] = await db.execute('DELETE FROM products');
    console.log(`Deleted ${productsResult.affectedRows} products`);
    
    const [addressResult] = await db.execute('DELETE FROM user_addresses');
    console.log(`Deleted ${addressResult.affectedRows} user addresses`);
    
    // Re-enable foreign key checks
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Foreign key checks re-enabled');

    res.json({ 
      message: 'All data cleared successfully (users and categories preserved)',
      deleted: {
        products: productsResult.affectedRows,
        orders: ordersResult.affectedRows,
        orderItems: orderItemsResult.affectedRows,
        reviews: reviewResult.affectedRows,
        cartItems: cartResult.affectedRows,
        addresses: addressResult.affectedRows
      }
    });
  } catch (error) {
    console.error('Clear all error:', error);
    // Make sure to re-enable foreign key checks even on error
    try {
      await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      console.error('Failed to re-enable foreign key checks:', e);
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Populate sample products
router.post('/populate-products', async (req, res) => {
  try {
    // Check if products already exist
    const [existing] = await db.execute('SELECT COUNT(*) as count FROM products');
    if (existing[0].count > 0) {
      return res.status(400).json({ 
        message: 'Products already exist. Clear them first.',
        existingCount: existing[0].count 
      });
    }

    // Get categories
    const [categories] = await db.execute('SELECT id, name FROM categories');
    
    if (categories.length === 0) {
      return res.status(400).json({ message: 'No categories found. Please create categories first.' });
    }

    const products = [
      // Electronics
      { name: 'Wireless Headphones', description: 'Premium noise-cancelling wireless headphones with 30-hour battery life', price: 4999, stock: 50, category: 'Electronics' },
      { name: 'Smart Watch', description: 'Fitness tracking smartwatch with heart rate monitor', price: 8999, stock: 30, category: 'Electronics' },
      { name: 'Bluetooth Speaker', description: 'Portable waterproof speaker with amazing sound quality', price: 2999, stock: 45, category: 'Electronics' },
      { name: 'Laptop Stand', description: 'Ergonomic aluminum laptop stand for better posture', price: 1499, stock: 60, category: 'Electronics' },
      { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse with precision tracking', price: 899, stock: 80, category: 'Electronics' },
      { name: 'USB-C Hub', description: '7-in-1 USB-C hub with HDMI and card readers', price: 1999, stock: 40, category: 'Electronics' },
      { name: 'Phone Case', description: 'Protective phone case with military-grade protection', price: 599, stock: 100, category: 'Electronics' },
      { name: 'Screen Protector', description: 'Tempered glass screen protector', price: 299, stock: 150, category: 'Electronics' },
      { name: 'Power Bank', description: '20000mAh fast charging power bank', price: 1799, stock: 55, category: 'Electronics' },
      { name: 'Webcam', description: '1080p HD webcam with auto-focus', price: 3499, stock: 25, category: 'Electronics' },
      
      // Clothing
      { name: 'Cotton T-Shirt', description: 'Comfortable 100% cotton t-shirt', price: 499, stock: 200, category: 'Clothing' },
      { name: 'Denim Jeans', description: 'Classic fit denim jeans', price: 1999, stock: 80, category: 'Clothing' },
      { name: 'Hoodie', description: 'Warm and cozy pullover hoodie', price: 1499, stock: 60, category: 'Clothing' },
      { name: 'Sneakers', description: 'Comfortable running sneakers', price: 2999, stock: 50, category: 'Clothing' },
      { name: 'Formal Shirt', description: 'Professional formal shirt', price: 1299, stock: 70, category: 'Clothing' },
      { name: 'Jacket', description: 'Stylish winter jacket', price: 3499, stock: 40, category: 'Clothing' },
      { name: 'Shorts', description: 'Comfortable cotton shorts', price: 799, stock: 90, category: 'Clothing' },
      { name: 'Socks Pack', description: 'Pack of 5 cotton socks', price: 399, stock: 150, category: 'Clothing' },
      { name: 'Cap', description: 'Adjustable baseball cap', price: 499, stock: 100, category: 'Clothing' },
      { name: 'Belt', description: 'Genuine leather belt', price: 899, stock: 75, category: 'Clothing' },
      
      // Home & Kitchen
      { name: 'Coffee Maker', description: 'Automatic drip coffee maker', price: 2499, stock: 35, category: 'Home & Kitchen' },
      { name: 'Blender', description: 'High-speed blender for smoothies', price: 1999, stock: 40, category: 'Home & Kitchen' },
      { name: 'Cookware Set', description: 'Non-stick cookware set of 5 pieces', price: 3999, stock: 25, category: 'Home & Kitchen' },
      { name: 'Knife Set', description: 'Professional chef knife set', price: 2499, stock: 30, category: 'Home & Kitchen' },
      { name: 'Cutting Board', description: 'Bamboo cutting board', price: 599, stock: 80, category: 'Home & Kitchen' },
      { name: 'Storage Containers', description: 'Set of 10 airtight containers', price: 1299, stock: 60, category: 'Home & Kitchen' },
      { name: 'Dish Rack', description: 'Stainless steel dish drying rack', price: 899, stock: 50, category: 'Home & Kitchen' },
      { name: 'Trash Can', description: 'Touchless automatic trash can', price: 1999, stock: 35, category: 'Home & Kitchen' },
      { name: 'Vacuum Cleaner', description: 'Powerful bagless vacuum cleaner', price: 4999, stock: 20, category: 'Home & Kitchen' },
      { name: 'Iron', description: 'Steam iron with auto shut-off', price: 1499, stock: 45, category: 'Home & Kitchen' },
      
      // Books
      { name: 'Fiction Novel', description: 'Bestselling fiction novel', price: 399, stock: 100, category: 'Books' },
      { name: 'Self-Help Book', description: 'Motivational self-help guide', price: 499, stock: 80, category: 'Books' },
      { name: 'Cookbook', description: 'Healthy recipes cookbook', price: 599, stock: 60, category: 'Books' },
      { name: 'Biography', description: 'Inspiring biography', price: 449, stock: 70, category: 'Books' },
      { name: 'Programming Book', description: 'Learn programming fundamentals', price: 799, stock: 50, category: 'Books' },
      { name: 'Travel Guide', description: 'Complete travel guide', price: 549, stock: 40, category: 'Books' },
      { name: 'Children Book', description: 'Illustrated children story book', price: 299, stock: 90, category: 'Books' },
      { name: 'Magazine Subscription', description: '1-year magazine subscription', price: 999, stock: 200, category: 'Books' },
      
      // Sports
      { name: 'Yoga Mat', description: 'Non-slip exercise yoga mat', price: 799, stock: 70, category: 'Sports' },
      { name: 'Dumbbells Set', description: 'Adjustable dumbbells set', price: 2999, stock: 30, category: 'Sports' },
      { name: 'Resistance Bands', description: 'Set of 5 resistance bands', price: 599, stock: 80, category: 'Sports' },
      { name: 'Jump Rope', description: 'Speed jump rope for cardio', price: 299, stock: 100, category: 'Sports' },
      { name: 'Water Bottle', description: 'Insulated stainless steel bottle', price: 499, stock: 120, category: 'Sports' },
      { name: 'Gym Bag', description: 'Spacious sports gym bag', price: 1299, stock: 50, category: 'Sports' }
    ];

    let addedCount = 0;
    for (const product of products) {
      const category = categories.find(c => c.name === product.category);
      if (category) {
        await db.execute(
          'INSERT INTO products (name, description, price, stock_quantity, category_id, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
          [product.name, product.description, product.price, product.stock, category.id]
        );
        addedCount++;
      }
    }

    res.json({ message: `Successfully added ${addedCount} sample products` });
  } catch (error) {
    console.error('Populate products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Populate sample orders
router.post('/populate-orders', async (req, res) => {
  try {
    // Get users and products
    const [users] = await db.execute('SELECT id FROM users LIMIT 5');
    const [products] = await db.execute('SELECT id, price FROM products WHERE is_active = TRUE LIMIT 20');

    if (users.length === 0) {
      return res.status(400).json({ message: 'No users found. Please create users first.' });
    }

    if (products.length === 0) {
      return res.status(400).json({ message: 'No products found. Please add products first.' });
    }

    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    let ordersCreated = 0;

    for (let i = 0; i < 10; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const orderNumber = `ORD-${Date.now()}-${i}`;
      
      // Calculate total
      const numItems = Math.floor(Math.random() * 3) + 1;
      let totalAmount = 0;
      const orderItems = [];

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        totalAmount += parseFloat(product.price) * quantity;
        orderItems.push({ productId: product.id, quantity, price: product.price });
      }

      // Add GST 18%
      totalAmount = totalAmount * 1.18;

      // Create order
      const [orderResult] = await db.execute(`
        INSERT INTO orders (user_id, order_number, status, total_amount, shipping_address, billing_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        orderNumber,
        status,
        totalAmount.toFixed(2),
        JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        }),
        JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        })
      ]);

      // Add order items
      for (const item of orderItems) {
        await db.execute(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [orderResult.insertId, item.productId, item.quantity, item.price]);
      }

      ordersCreated++;
    }

    res.json({ message: `Successfully created ${ordersCreated} sample orders` });
  } catch (error) {
    console.error('Populate orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create test orders (for demo purposes)
router.post('/create-test-data', [auth, adminAuth], async (req, res) => {
  try {
    // Get some users and products
    const [users] = await db.execute('SELECT id FROM users LIMIT 3');
    const [products] = await db.execute('SELECT id, price FROM products WHERE is_active = TRUE LIMIT 5');

    if (users.length === 0 || products.length === 0) {
      return res.status(400).json({ message: 'No users or products found' });
    }

    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    
    for (let i = 0; i < 5; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const orderNumber = `ORD-${Date.now()}-${i}`;
      
      // Create order
      const [orderResult] = await db.execute(`
        INSERT INTO orders (user_id, order_number, status, total_amount, shipping_address, billing_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        orderNumber,
        status,
        (Math.random() * 200 + 50).toFixed(2),
        JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'United States'
        }),
        JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'United States'
        })
      ]);

      // Add order items
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        await db.execute(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [orderResult.insertId, product.id, quantity, product.price]);
      }
    }

    res.json({ message: 'Test orders created successfully' });
  } catch (error) {
    console.error('Create test data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;