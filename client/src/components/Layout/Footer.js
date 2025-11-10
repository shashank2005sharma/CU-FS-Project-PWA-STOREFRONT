import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer style={{ 
      backgroundColor: '#333', 
      color: 'white', 
      padding: '40px 0 20px',
      marginTop: '60px'
    }}>
      <div className="container">
        <div className="grid grid-4" style={{ marginBottom: '30px' }}>
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>PWA Store</h3>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              Your trusted online shopping destination with offline capabilities. 
              Shop anytime, anywhere with our Progressive Web App.
            </p>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none' }}>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/products" style={{ color: '#ccc', textDecoration: 'none' }}>
                  All Products
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/cart" style={{ color: '#ccc', textDecoration: 'none' }}>
                  Shopping Cart
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/orders" style={{ color: '#ccc', textDecoration: 'none' }}>
                  Order History
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>Account</h4>
            <ul style={{ listStyle: 'none' }}>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/profile" style={{ color: '#ccc', textDecoration: 'none' }}>
                  My Profile
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/login" style={{ color: '#ccc', textDecoration: 'none' }}>
                  Login
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/register" style={{ color: '#ccc', textDecoration: 'none' }}>
                  Register
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>Support</h4>
            <ul style={{ listStyle: 'none' }}>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#ccc' }}>Help Center</span>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#ccc' }}>Contact Us</span>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#ccc' }}>Shipping Info</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div style={{ 
          borderTop: '1px solid #555', 
          paddingTop: '20px', 
          textAlign: 'center',
          color: '#ccc'
        }}>
          <p>&copy; 2024 PWA Ecommerce Store. Built for Semester Project.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;