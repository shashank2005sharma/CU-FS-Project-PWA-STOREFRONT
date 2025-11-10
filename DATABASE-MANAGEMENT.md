# Database Management Tool

## Overview
The Database Management tool (`reset-data.html`) provides a user-friendly interface to manage your PWA Store's database. It allows you to clear and repopulate products and orders while preserving user data.

## Access
Open `reset-data.html` in your browser:
```
file:///path/to/your/project/reset-data.html
```

Or simply double-click the file to open it in your default browser.

## Features

### 📊 Database Statistics
- Real-time view of:
  - Total Users
  - Total Products
  - Total Orders
  - Total Reviews
- Refresh button to update stats

### 🗑️ Clear Data Operations

#### Clear All Products
- Removes all products from the database
- Also clears:
  - Product reviews
  - Cart items
  - Order items (products from orders)
- **Preserves**: User accounts and order records

#### Clear All Orders
- Removes all orders and order items
- **Preserves**: User accounts, products, and reviews

#### Clear Products & Orders
- Combines both clear operations
- Complete data wipe except users

### 🔄 Repopulate Data

#### Add Sample Products (44 items)
- Adds 44 diverse products across categories:
  - Electronics (10 items)
  - Clothing (10 items)
  - Home & Kitchen (10 items)
  - Books (8 items)
  - Sports (6 items)
- Each product includes:
  - Name and description
  - Price in ₹ (Indian Rupees)
  - Stock quantity
  - Category assignment

#### Add Sample Orders (10 orders)
- Creates 10 random orders with:
  - Random users from database
  - 1-3 products per order
  - Random status (pending, processing, shipped, delivered)
  - Proper order numbers
  - Indian addresses (Mumbai, Maharashtra)
  - GST 18% included in total

#### Full Reset
- Performs complete reset:
  1. Clears all products
  2. Clears all orders
  3. Adds 44 sample products
  4. Creates 10 sample orders
- Perfect for starting fresh with demo data

## API Endpoints

All endpoints are available at `http://localhost:5001/api/admin/`

### GET /stats
Returns current database statistics
```json
{
  "users": 5,
  "products": 44,
  "orders": 10,
  "reviews": 15
}
```

### POST /clear-products
Clears all products, reviews, and cart items

### POST /clear-orders
Clears all orders and order items

### POST /populate-products
Adds 44 sample products to the database

### POST /populate-orders
Creates 10 sample orders with random data

## Safety Features

- ⚠️ Confirmation dialogs before destructive operations
- 🔒 User data is always preserved
- ✅ Success/error messages for all operations
- 🔄 Automatic stats refresh after operations
- 🚫 Prevents duplicate product population

## Use Cases

1. **Development Testing**
   - Clear and repopulate data for testing
   - Generate fresh sample orders

2. **Demo Preparation**
   - Reset database to clean state
   - Add professional-looking sample data

3. **Database Cleanup**
   - Remove test orders
   - Clear old products before adding new ones

4. **Training/Presentation**
   - Quick reset to known state
   - Consistent demo data

## Notes

- All operations are **irreversible** - use with caution
- User accounts are **never deleted** by this tool
- Products must be cleared before repopulating
- Orders require existing users and products
- All prices are in Indian Rupees (₹)
- GST 18% is automatically applied to orders

## Troubleshooting

**"Products already exist" error**
- Clear products first before repopulating

**"No users found" error**
- Create at least one user account first
- Register through the main application

**"No products found" error**
- Add products before creating sample orders

**Connection errors**
- Ensure backend server is running on port 5001
- Check database connection in server logs
