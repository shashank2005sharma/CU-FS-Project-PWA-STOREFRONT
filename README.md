# PWA Ecommerce Platform

A complete Progressive Web App ecommerce platform with customer storefront and admin panel, built with React, Node.js/Express, and MySQL.

## 🚀 Features

### Customer Features
- �️ **Prodguct Catalog**: Browse products with categories, search, and pagination
- � **Shoapping Cart**: Add/remove items, quantity management, persistent cart
- � **dUser Accounts**: Registration, login, profile management
- � *a*Order Management**: Place orders, view history, track shipments
- 📍 **Address Book**: Save multiple shipping/billing addresses
- ⭐ **Product Reviews**: Rate and review purchased products (verified purchases only)
- � J**PWA Features**: Offline browsing, installable app, push notifications
- 🔒 **Security**: JWT authentication, secure password hashing

### Admin Features
- 📊 **Dashboard**: Overview statistics, recent orders, revenue analytics
- 🛒 **Order Management**: Update order status, add tracking numbers, view details
- 👥 **User Management**: View customer information, order history, statistics
- 📦 **Product Management**: Add/edit/delete products, manage inventory, toggle status
- 🔍 **Search & Filter**: Advanced search across orders, users, and products
- 📈 **Analytics**: Order status distribution, revenue tracking

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router, React Query, React Hook Form
- **Backend**: Node.js, Express.js, MySQL2, JWT, bcryptjs
- **Database**: MySQL with structured schema
- **PWA**: Service Worker, Web App Manifest, offline caching
- **Security**: Rate limiting, CORS, Helmet, input validation
- **UI/UX**: Responsive design, Lucide React icons, toast notifications

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd pwa-ecommerce
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE pwa_ecommerce;
exit

# Import schema and sample data
mysql -u root -p pwa_ecommerce < server/database/schema.sql
mysql -u root -p pwa_ecommerce < server/database/seeds.sql
```

### 3. Environment Configuration
```bash
# Copy environment template
cp server/.env.example server/.env

# Edit server/.env with your settings:
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pwa_ecommerce
JWT_SECRET=your_super_secret_jwt_key
```

### 4. Start Development Servers
```bash
# Terminal 1 - Start backend server
cd server
npm run dev

# Terminal 2 - Start frontend client
cd client
npm start
```

### 5. Access the Application
- **Customer Storefront**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Server**: http://localhost:5001

## 👤 Default Accounts

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123
- **Access**: Full admin panel access

### Test Customer Account
- **Email**: john@example.com
- **Password**: password123
- **Access**: Customer features only

## 📁 Project Structure

```
pwa-ecommerce/
├── client/                     # React PWA Frontend
│   ├── public/
│   │   ├── manifest.json      # PWA manifest
│   │   └── sw.js             # Service worker
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts (Auth, Cart)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── styles/          # CSS styles
│   └── package.json
├── server/                    # Express.js Backend
│   ├── config/              # Database configuration
│   ├── middleware/          # Custom middleware
│   ├── routes/              # API routes
│   ├── scripts/             # Utility scripts
│   ├── uploads/             # File uploads
│   └── package.json
├── database/                 # Database files
│   ├── schema.sql           # Database structure
│   └── seeds.sql            # Sample data
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products (with search, pagination)
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - List categories

### Cart & Orders
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `POST /api/orders` - Place order
- `GET /api/orders` - Get user's orders

### Reviews
- `GET /api/reviews/product/:id` - Get product reviews
- `POST /api/reviews` - Add review (verified purchases only)
- `PUT /api/reviews/:id` - Update review

### Admin (Protected)
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/orders` - Manage orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/users` - Manage users
- `GET /api/admin/products` - Manage products

## 🎯 Key Features Explained

### Progressive Web App (PWA)
- **Service Worker**: Caches products, images, and API responses for offline browsing
- **App Manifest**: Makes the app installable on mobile devices
- **Offline Support**: Users can browse cached products without internet
- **Push Notifications**: Ready for order updates and promotions

### Review System
- **Verified Purchases**: Only customers who bought products can review them
- **Star Ratings**: 1-5 star rating system with hover effects
- **Review Management**: Users can edit/delete their own reviews
- **Admin Oversight**: Admins can view all reviews and statistics

### Admin Panel
- **Dashboard Analytics**: Real-time statistics and charts
- **Order Fulfillment**: Update order status from pending to delivered
- **Inventory Management**: Control product availability and pricing
- **Customer Support**: View customer details and order history

### Security Features
- **Rate Limiting**: Prevents API abuse (200 API calls, 500 image requests per 15min)
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **Password Security**: bcrypt hashing with salt rounds
- **CORS Protection**: Configured for development and production

## 🧪 Testing the Application

### Test PWA Features
1. Open Chrome DevTools > Application > Service Workers
2. Go offline (Network tab > Offline checkbox)
3. Browse products - they should load from cache
4. Try installing the app (Chrome menu > Install PWA Ecommerce)

### Test Review System
1. Login as customer and place an order
2. Login as admin and mark order as "delivered"
3. Login back as customer and review the purchased product
4. Verify "Verified Purchase" badge appears

### Test Admin Features
1. Login with admin credentials
2. Create test orders using "Create Test Orders" button
3. Update order statuses and add tracking numbers
4. Manage products (activate/deactivate/delete)

## 🚀 Production Deployment

### Environment Variables
```bash
# Production environment
NODE_ENV=production
PORT=5001
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=pwa_ecommerce
JWT_SECRET=your_super_secure_production_jwt_secret
```

### Build for Production
```bash
# Build client
cd client
npm run build

# The build folder contains optimized production files
# Serve these files with your web server (nginx, Apache, etc.)
```

### Database Migration
```bash
# Export development data
mysqldump -u root -p pwa_ecommerce > backup.sql

# Import to production
mysql -u production_user -p production_db < backup.sql
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API endpoints and test with provided accounts

## 🎉 Acknowledgments

- React team for the amazing framework
- Express.js for the robust backend framework
- MySQL for reliable database management
- Lucide React for beautiful icons
- All contributors and testers