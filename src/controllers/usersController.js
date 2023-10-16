const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knex = require('../../config/db'); // Adjust the path based on your file structure
const { authenticateToken: categoriesAuthenticateToken } = require('../controllers/categoriesController');

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

      res.status(201).json({ message: 'User registered successfully', username});
    } catch (error) {
      res.status(400).json({ message: 'User registration failed', error: error.message });
    }
  }

  async sendCollaborationRequest(req, res) {
    try {
      const { targetUsername } = req.body;
      const { user_id: requesterUserId } = req.user; // Assuming you have middleware to get user_id

      // Check if the target username exists
      const targetUser = await knex('users').where('username', targetUsername).first();

      if (!targetUser) {
        return res.status(400).json({ message: 'Target user not found.' });
      }

      // Update the requester's collaboration requests
      await knex('users')
        .where('user_id', requesterUserId)
        .update({
          collaboration_requests: knex.raw('array_append(collaboration_requests, ?)', [targetUsername])
        });

      res.status(200).json({ message: 'Collaboration request sent successfully.' });
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      res.status(500).json({ message: 'Failed to send collaboration request.', error: error.message });
    }
  }

  async acceptCollaborationRequest(req, res) {
    try {
      const { request_id } = req.params;
      const { user_id } = req.user; // Assuming you have middleware to get user_id
  
      // Check if the collaboration request exists and is for the current user
      const collaborationRequest = await knex('collaboration_requests')
        .where('request_id', request_id)
        .andWhere('receiver_user_id', user_id)
        .first();
  
      if (!collaborationRequest) {
        return res.status(400).json({ message: 'Collaboration request not found or not for the current user.' });
      }
  
      // Update the collaboration request status to accepted
      await knex('collaboration_requests')
        .where('request_id', request_id)
        .update({ status: 'accepted' });
  
      // You can add more logic here as needed for your application
  
      res.status(200).json({ message: 'Collaboration request accepted successfully.' });
    } catch (error) {
      console.error('Error accepting collaboration request:', error);
      res.status(500).json({ message: 'Failed to accept collaboration request.', error: error.message });
    }
  }  

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, password } = req.body;

      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      await knex('users')
        .where({ user_id: id })
        .update({
          username,
          email,
          password_hash: hashedPassword,
        });

      res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
      res.status(400).json({ message: 'Failed to update user', error: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      await knex('users')
        .where({ user_id: id })
        .del();

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(400).json({ message: 'Failed to delete user', error: error.message });
    }
  }

async login(req, res) {
  try {
    const { email, password, rememberMe } = req.body;

    // Retrieve user from the database by email
    const user = await knex('users').where({ email }).first();

    const tokenExpiration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000;

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    console.log('User retrieved from the database:', user); // Log the user object

    // Compare the provided email with the stored email
    const validEmail = email === user.email;

    // Compare the provided password with the hashed password in the database
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        throw err;
      }

      if (validEmail && isMatch) {
        console.log('User is authenticated.');
        // Password is valid, create a JWT token
        const payload = {
          user_id: user.user_id,
          username: user.username,
        };
        const token = jwt.sign(payload, 'i9P&k6Xn2Rr6u9P2s5v8y/B?E(H+MbQe', { noTimestamp:true, expiresIn: tokenExpiration });
        res.cookie('jwt', token, {
          httpOnly: true,
          maxAge: tokenExpiration
        });
	      console.log('Generated token:', token);
        res.status(200).json({ token , username: user.username, userId: user_id });
      } else {
        console.log('Invalid email or password.');
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
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);
router.post('/collaborate/request', categoriesAuthenticateToken, usersController.sendCollaborationRequest);
router.put('/collaborate/accept/:request_id', categoriesAuthenticateToken, usersController.acceptCollaborationRequest);

module.exports = router;
