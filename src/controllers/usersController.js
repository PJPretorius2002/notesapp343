const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knex = require('../../config/db'); // Adjust the path based on your file structure

// Function to generate a valid bcrypt salt
async function generateSalt() {
  const saltRounds = 10; // You can adjust the number of salt rounds as needed
  const salt = await bcrypt.genSalt(saltRounds);
  return salt;
}

// Function to hash the password using bcrypt with the provided salt
async function hashPassword(password, salt) {
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

class UsersController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Ensure the password is a string
      if (typeof password !== 'string') {
        return res.status(400).json({ message: "Invalid password format." });
      }

      // Generate a valid bcrypt salt
      const salt = await generateSalt();

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
      console.log('No user found for email:', email);
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Hash the provided password with the stored salt
    const hashedPassword = await hashPassword(password, user.salt);

    console.log('Provided password:', password);
    console.log('Stored salt:', user.salt);
    console.log('Combined password:', password + user.salt);
    console.log('Hashed password:', hashedPassword);
    console.log('Stored hashed password:', user.password_hash);

    // Compare the resulting hash with the stored hashed password
    const validPassword = hashedPassword === user.password_hash;

    if (!validPassword) {
      console.log('Password comparison failed.');
      return res.status(400).json({ message: "Invalid email or password." });
    }

    console.log('Password comparison successful.');

    const token = jwt.sign({ _id: user.user_id }, "YourSecretKey", { expiresIn: '1h' });

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
