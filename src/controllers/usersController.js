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
        return res.status(400).json({ message: 'Invalid password format.' });
      }

      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate a salt for logging purposes (not for storage)
      const salt = await bcrypt.genSalt(10);

      // Insert user details into the database
      await knex('users').insert({
        username,
        email,
        password_hash: hashedPassword,
        salt: salt,  // Include the salt for logging purposes
      });

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      res.status(400).json({ message: 'User registration failed', error: error.message });
    }
  }

async login(req, res) {
  try {
    const { email, password } = req.body;

    // Retrieve user from the database by email
    const user = await knex('users').where({ email }).first();

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Log the salt for this user
    console.log('Stored salt:', user.salt);

    // Compare the provided password with the hashed password in the database
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        throw err;
      }

      if (isMatch) {
        console.log('Password is correct. User is authenticated.');
        // Password is valid, create a JWT token
        const token = jwt.sign({ _id: user.user_id }, 'YourSecretKey', { expiresIn: '1h' });
        res.status(200).json({ token });
      } else {
        console.log('Password is wrong');
        return res.status(400).json({ message: 'Invalid email or password.' });
      }
    });
  } catch (error) {
    console.log('Login error:', error);
    res.status(400).json({ message: error.message });
  }
 }
}

const usersController = new UsersController();
const router = express.Router();

router.post('/register', usersController.register);
router.post('/login', usersController.login);

module.exports = router;
