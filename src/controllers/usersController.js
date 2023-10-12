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

      // Generate a salt
      const salt = await generateSalt(16);

      // Hash the password using bcrypt with the salt
      const hashedPassword = await hashPassword(password, salt);

      // Insert user details into the database
      await knex('users').insert({
        username,
        email,
        password_hash: hashedPassword,
        salt,
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
      const hashedPasswordProvided = await hashPassword(combinedPassword, user.salt);

      console.log('Provided password:', combinedPassword);
      console.log('Stored hashed password:', user.password_hash);
      console.log('Hashed password provided:', hashedPasswordProvided);

      // Compare the hashed password provided with the stored hashed password
      const validPassword = hashedPasswordProvided === user.password_hash;

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

// Function to hash passwords using bcrypt
async function hashPassword(password, salt) {
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

// Replace with your actual salt generation logic
async function generateSalt(length) {
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
