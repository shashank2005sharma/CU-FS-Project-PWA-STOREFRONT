const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp.slice(-6)}${random}`;
};

// Generate tracking number
const generateTrackingNumber = () => {
  const prefix = 'TRK';
  const random = Math.random().toString(36).substring(2, 15).toUpperCase();
  return `${prefix}${random}`;
};

// Create order
router.post('/create', [
  auth,
  body('shippingAddress').isObject()
], async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      await connection.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('Creating order for user:', req.user.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { shippingAddress, billingAddress } = req.body;

    // Validate shipping address has required fields
    if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName || 
        !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || 
        !shippingAddress.postalCode) {
      await connection.rollback();
      return res.status(400).json({ 
        message: 'Missing required shipping address fields',
        required: ['firstName', 'lastName', 'addressLine1', 'city', 'state', 'postalCode']
      });
    }

    // Get cart items
    const [cartItems] = await connection.execute(`
      SELECT 
        ci.product_id,
        ci.quantity,
        p.price,
        p.stock_quantity,
        p.name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND p.is_active = TRUE
    `, [req.user.id]);

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Check stock availability
    for (const item of cartItems) {
      if (item.quantity > item.stock_quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.name}` 
        });
      }
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => 
      sum + (parseFloat(item.price) * item.quantity), 0
    );

    // Create order
    const orderNumber = generateOrderNumber();
    const trackingNumber = generateTrackingNumber();
    const [orderResult] = await connection.execute(`
      INSERT INTO orders (user_id, order_number, total_amount, shipping_address, billing_address, tracking_number, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      orderNumber,
      totalAmount,
      JSON.stringify(shippingAddress),
      billingAddress ? JSON.stringify(billingAddress) : null,
      trackingNumber,
      'processing'
    ]);

    const orderId = orderResult.insertId;

    // Create order items and update stock
    for (const item of cartItems) {
      // Add order item
      await connection.execute(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [orderId, item.product_id, item.quantity, item.price]);

      // Update product stock
      await connection.execute(`
        UPDATE products SET stock_quantity = stock_quantity - ?
        WHERE id = ?
      `, [item.quantity, item.product_id]);
    }

    // Clear cart
    await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    await connection.commit();

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: orderId,
        orderNumber,
        totalAmount,
        status: 'pending'
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

// Get user orders
router.get('/', auth, async (req, res) => {
  try {
    console.log('Getting orders for user:', req.user.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get orders first
    const [orders] = await db.execute(`
      SELECT 
        id, user_id, order_number, status, total_amount, 
        shipping_address, billing_address, tracking_number, 
        created_at, updated_at
      FROM orders 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, [req.user.id]);

    // Get item counts for each order
    let orderItemCounts = {};
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const placeholders = orderIds.map(() => '?').join(',');
      
      const [itemCounts] = await db.execute(`
        SELECT order_id, COUNT(*) as item_count
        FROM order_items 
        WHERE order_id IN (${placeholders})
        GROUP BY order_id
      `, orderIds);
      
      itemCounts.forEach(item => {
        orderItemCounts[item.order_id] = item.item_count;
      });
    }

    // Get total count
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      orders: orders.map(order => {
        let shippingAddress = order.shipping_address;
        let billingAddress = order.billing_address;
        
        // Parse JSON if it's a string, otherwise use as-is
        try {
          if (typeof shippingAddress === 'string') {
            shippingAddress = JSON.parse(shippingAddress);
          }
        } catch (e) {
          console.log('Error parsing shipping address:', e);
          shippingAddress = null;
        }
        
        try {
          if (typeof billingAddress === 'string') {
            billingAddress = JSON.parse(billingAddress);
          }
        } catch (e) {
          console.log('Error parsing billing address:', e);
          billingAddress = null;
        }
        
        return {
          ...order,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          item_count: orderItemCounts[order.id] || 0
        };
      }),
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order details
router.get('/:id', auth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    // Get order
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Get order items
    const [orderItems] = await db.execute(`
      SELECT 
        oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price, oi.created_at,
        p.name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    let shippingAddress = order.shipping_address;
    let billingAddress = order.billing_address;
    
    // Parse JSON if it's a string, otherwise use as-is
    try {
      if (typeof shippingAddress === 'string') {
        shippingAddress = JSON.parse(shippingAddress);
      }
    } catch (e) {
      console.log('Error parsing shipping address:', e);
      shippingAddress = null;
    }
    
    try {
      if (typeof billingAddress === 'string') {
        billingAddress = JSON.parse(billingAddress);
      }
    } catch (e) {
      console.log('Error parsing billing address:', e);
      billingAddress = null;
    }

    res.json({
      order: {
        ...order,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        items: orderItems
      }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;