-- Reset database script
DROP DATABASE IF EXISTS pwa_ecommerce;
CREATE DATABASE pwa_ecommerce;
USE pwa_ecommerce;

-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INT,
  stock_quantity INT DEFAULT 0,
  image_url VARCHAR(255),
  images JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- User addresses
CREATE TABLE user_addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('shipping', 'billing') DEFAULT 'shipping',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Shopping cart
CREATE TABLE cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id)
);

-- Orders
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSON NOT NULL,
  billing_address JSON,
  tracking_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Product reviews
CREATE TABLE product_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  images JSON,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product_review (user_id, product_id)
);

-- Indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_rating ON product_reviews(rating);

-- Insert categories
INSERT INTO categories (name, description, image_url) VALUES
('Electronics', 'Latest gadgets and electronic devices', '/images/categories/electronics.jpg'),
('Clothing', 'Fashion and apparel for all ages', '/images/categories/clothing.jpg'),
('Books', 'Books, magazines, and educational materials', '/images/categories/books.jpg'),
('Home & Garden', 'Home improvement and garden supplies', '/images/categories/home-garden.jpg'),
('Sports', 'Sports equipment and fitness gear', '/images/categories/sports.jpg');

-- Insert sample products
INSERT INTO products (name, description, price, category_id, stock_quantity, image_url, images) VALUES
('Smartphone Pro Max', 'Latest flagship smartphone with advanced camera system', 999.99, 1, 50, '/images/products/phone1.jpg', JSON_ARRAY('/images/products/phone1-1.jpg', '/images/products/phone1-2.jpg', '/images/products/phone1-3.jpg')),
('Wireless Headphones', 'Premium noise-cancelling wireless headphones', 299.99, 1, 75, '/images/products/headphones1.jpg', JSON_ARRAY('/images/products/headphones1-1.jpg', '/images/products/headphones1-2.jpg')),
('Laptop Ultra', 'Lightweight laptop for professionals', 1299.99, 1, 30, '/images/products/laptop1.jpg', JSON_ARRAY('/images/products/laptop1-1.jpg', '/images/products/laptop1-2.jpg', '/images/products/laptop1-3.jpg')),
('Cotton T-Shirt', 'Comfortable 100% cotton t-shirt', 24.99, 2, 100, '/images/products/tshirt1.jpg', JSON_ARRAY('/images/products/tshirt1-1.jpg', '/images/products/tshirt1-2.jpg')),
('Denim Jeans', 'Classic fit denim jeans', 79.99, 2, 60, '/images/products/jeans1.jpg', JSON_ARRAY('/images/products/jeans1-1.jpg', '/images/products/jeans1-2.jpg')),
('Programming Book', 'Learn modern web development', 49.99, 3, 40, '/images/products/book1.jpg', JSON_ARRAY('/images/products/book1-1.jpg')),
('Coffee Maker', 'Automatic drip coffee maker', 89.99, 4, 25, '/images/products/coffee1.jpg', JSON_ARRAY('/images/products/coffee1-1.jpg', '/images/products/coffee1-2.jpg')),
('Running Shoes', 'Professional running shoes', 129.99, 5, 80, '/images/products/shoes1.jpg', JSON_ARRAY('/images/products/shoes1-1.jpg', '/images/products/shoes1-2.jpg', '/images/products/shoes1-3.jpg')),
('Yoga Mat', 'Non-slip exercise yoga mat', 39.99, 5, 45, '/images/products/yoga1.jpg', JSON_ARRAY('/images/products/yoga1-1.jpg')),
('Smart Watch', 'Fitness tracking smart watch', 249.99, 1, 35, '/images/products/watch1.jpg', JSON_ARRAY('/images/products/watch1-1.jpg', '/images/products/watch1-2.jpg'));

-- Insert sample user (password: 'password123' hashed)
INSERT INTO users (email, password, first_name, last_name, phone) VALUES
('demo@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'User', '+1234567890');

-- Insert sample reviews
INSERT INTO product_reviews (product_id, user_id, rating, title, comment, images, is_verified_purchase) VALUES
(1, 1, 5, 'Amazing phone!', 'Great camera quality and battery life. Highly recommended!', NULL, TRUE),
(2, 1, 4, 'Good headphones', 'Sound quality is excellent, but could be more comfortable for long use.', NULL, TRUE),
(8, 1, 5, 'Perfect for running', 'Very comfortable and great support. Best running shoes I have owned.', NULL, TRUE);