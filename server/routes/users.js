const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', [
  auth,
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone } = req.body;

    await db.execute(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
      [firstName, lastName, phone || null, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user addresses
router.get('/addresses', auth, async (req, res) => {
  try {
    console.log('Getting addresses for user:', req.user.id);
    const [addresses] = await db.execute(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    console.log('Found addresses:', addresses.length);
    res.json({ addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add user address
router.post('/addresses', [
  auth,
  body('type').isIn(['shipping', 'billing']),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('addressLine1').trim().isLength({ min: 1 }),
  body('city').trim().isLength({ min: 1 }),
  body('state').trim().isLength({ min: 1 }),
  body('postalCode').trim().isLength({ min: 1 }),
  body('country').trim().isLength({ min: 1 }),
  body('isDefault').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      type, firstName, lastName, addressLine1, addressLine2,
      city, state, postalCode, country, isDefault
    } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.execute(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND type = ?',
        [req.user.id, type]
      );
    }

    const [result] = await db.execute(`
      INSERT INTO user_addresses 
      (user_id, type, first_name, last_name, address_line1, address_line2, 
       city, state, postal_code, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, type, firstName, lastName, addressLine1, addressLine2 || null,
      city, state, postalCode, country, isDefault || false
    ]);

    res.status(201).json({
      message: 'Address added successfully',
      addressId: result.insertId
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user address
router.put('/addresses/:id', [
  auth,
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('addressLine1').trim().isLength({ min: 1 }),
  body('city').trim().isLength({ min: 1 }),
  body('state').trim().isLength({ min: 1 }),
  body('postalCode').trim().isLength({ min: 1 }),
  body('country').trim().isLength({ min: 1 }),
  body('isDefault').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const addressId = req.params.id;
    const {
      firstName, lastName, addressLine1, addressLine2,
      city, state, postalCode, country, isDefault
    } = req.body;

    // Check if address belongs to user
    const [addresses] = await db.execute(
      'SELECT type FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.id]
    );

    if (addresses.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.execute(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND type = ?',
        [req.user.id, addresses[0].type]
      );
    }

    await db.execute(`
      UPDATE user_addresses SET
        first_name = ?, last_name = ?, address_line1 = ?, address_line2 = ?,
        city = ?, state = ?, postal_code = ?, country = ?, is_default = ?
      WHERE id = ? AND user_id = ?
    `, [
      firstName, lastName, addressLine1, addressLine2 || null,
      city, state, postalCode, country, isDefault || false,
      addressId, req.user.id
    ]);

    res.json({ message: 'Address updated successfully' });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user address
router.delete('/addresses/:id', auth, async (req, res) => {
  try {
    const addressId = req.params.id;

    const [result] = await db.execute(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;