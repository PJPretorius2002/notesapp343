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

      // Hash the password using the same method as in the database
      const hashedPassword = hashPassword(password);

      // Insert user details into the database
      await knex('users').insert({
        username,
        email,
        password_hash: hashedPassword,
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

      // Use the same password hashing method as in the database to compare
      const hashedPassword = hashPassword(password);
      const validPassword = hashedPassword === user.password_hash;

      console.log('Provided password:', password);
      console.log('Stored hashed password:', user.password_hash);

      console.log('Password comparison result:', validPassword);

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

// Hash the password using the same method as in the database
function hashPassword(password) {
  const salt = generateSalt(16);
  return hash_password(password, salt);
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

// Function to hash passwords using the same method as in the database
function hash_password(password, salt) {
  return crypt(password, salt);
}

const usersController = new UsersController();
const router = express.Router();

router.post('/register', usersController.register);
router.post('/login', usersController.login);

module.exports = router;
