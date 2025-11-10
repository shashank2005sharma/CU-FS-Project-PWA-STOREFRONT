const db = require('../config/database');

async function createTestOrders() {
  try {
    // Get some users and products
    const [users] = await db.execute('SELECT id FROM users LIMIT 3');
    const [products] = await db.execute('SELECT id, price FROM products WHERE is_active = TRUE LIMIT 5');

    if (users.length === 0 || products.length === 0) {
      console.log('No users or products found');
      return;
    }

    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    
    for (let i = 0; i < 10; i++) {
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
        (Math.random() * 200 + 50).toFixed(2), // Random amount between 50-250
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
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
        
        await db.execute(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [orderResult.insertId, product.id, quantity, product.price]);
      }
    }

    console.log('Test orders created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test orders:', error);
    process.exit(1);
  }
}

createTestOrders();