const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knex = require('../config/db'); // Adjust the path accordingly

const router = express.Router();
const saltRounds = 10;

// Route to register a new user
router.post('/register', async (req, res) => {
  // Extract user data from request body
  const { username, email, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user details into the database
    const [userId] = await knex('users').insert({
      username,
      email,
      password: hashedPassword,
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

module.exports = router;

