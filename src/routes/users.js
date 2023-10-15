const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../../config/db'); // Adjust the path accordingly

const router = express.Router();

// Route to register a new user
router.post('/register', async (req, res) => {
  // Extract user data from request body
  const { username, email, password } = req.body;

  try {
    // Insert user details into the database
    const [userId] = await knex('users').insert({
      username,
      email,
      password,  // Store the password directly (not hashed)
    });

    // Create a JWT token
    const token = jwt.sign({ userId }, 'i9P&k6Xn2Rr6u9P2s5v8y/B?E(H+MbQe', {
      expiresIn: '1h',
    });

    res.status(201).json({ message: 'Registration successful', token });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed', error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Retrieve user data from the database
    const user = await knex('users').select('username', 'email').where('id', userId).first();

    if (user) {
      res.status(200).json({ user });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve user data', error: error.message });
  }
});

module.exports = router;
