const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../../config/db'); // Adjust the path based on your file structure

class UsersController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Ensure the password is a string
      if (typeof password !== 'string') {
        return res.status(400).json({ message: "Invalid password format." });
      }

      // Insert user details into the database
      await knex('users').insert({
        username,
        email,
        password_hash: password,  // Store the password directly (not hashed)
      });

      // Simplified success message
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      // Return a more informative error message
      res.status(400).json({ message: 'User registration failed', error: error.message });
    }
  }

async login(req, res) {
  try {
    const { email, password } = req.body;

    console.log('Login request for:', email, password);

    // Retrieve user from the database by email
    const user = await knex('users').where({ email }).first();

    console.log('Retrieved user:', user);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Compare the provided password directly with the stored hash
    const validPassword = password === user.password_hash;

    console.log('Provided password:', password);
    console.log('Stored hashed password:', user.password_hash);

    console.log('Password comparison result:', validPassword);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ _id: user.id }, "i9P&k6Xn2Rr6u9P2s5v8y/B?E(H+MbQe");

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
 }
}

const usersController = new UsersController();
const router = express.Router();

router.post('/register', usersController.register);
router.post('/login', usersController.login);

module.exports = router;
