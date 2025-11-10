-- Sample data for PWA Ecommerce

USE pwa_ecommerce;

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