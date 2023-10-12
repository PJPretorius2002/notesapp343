const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knex = require('../../config/db'); // Adjust the path based on your file structure

class UsersController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Ensure the password is a string
      if (typeof password !== 'string') {
        return res.status(400).json({ message: "Invalid password format." });
      }

      // Generate a unique salt (you can use your own salt generation logic)
      const salt = generateSalt(16);

      // Combine the salt with the password
      const combinedPassword = password + salt;

      // Hash the combined password and salt using bcrypt
      const hashedPassword = await hashPassword(combinedPassword, salt);

      // Insert user details into the database
      await knex('users').insert({
        username,
        email,
        password_hash: hashedPassword,
        salt: salt, // Store the salt in the database
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

    // Retrieve user from the database by email
    const user = await knex('users').where({ email }).first();

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Combine the provided password with the stored salt
    const combinedPassword = password + user.salt;

    // Hash the combined password and salt
    const hashedPassword = await hashPassword(combinedPassword, user.salt);

    // Compare the resulting hash with the stored hashed password
    const validPassword = hashedPassword === user.password_hash;

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ _id: user.user_id }, "YourSecretKey", { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
 }
}

// Hash the password using bcrypt
async function hashPassword(password, salt) {
  const hashedPassword = await bcrypt.hash(password, 10); // Use appropriate salt rounds
  return hashedPassword;
}

// Replace with your actual salt generation logic
function generateSalt(length) {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return salt;
}

const usersController = new UsersController();
const router = express.Router();

router.post('/register', usersController.register);
router.post('/login', usersController.login);

module.exports = router;
