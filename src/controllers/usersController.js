const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knex = require('../../config/db'); // Adjust the path based on your file structure
const { authenticateToken: categoriesAuthenticateToken } = require('../controllers/categoriesController');
const sendEmail = require('./emailService');
const crypto = require('crypto');


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

      //await sendActivationEmail(email);

      res.status(201).json({ message: 'User registered successfully', username});
    } catch (error) {
      res.status(400).json({ message: 'User registration failed', error: error.message });
    }
  }

  // Helper function to generate a random 4-letter sequence
  generateRandomSequence() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async sendActivationEmail(email) {
  const activationCode = generateRandomSequence(); // Generate a random 4-letter sequence
  const subject = 'Activate Your Account';
  const html = `<p>Your activation code is: <strong>${activationCode}</strong></p>`;

  await sendEmail(email, subject, html);
  return activationCode; // Return the activation code
}

  async sendPasswordResetEmail(email) {
    const subject = 'Password Reset Request';
    const html = `<p>Click <a href="https://your-password-reset-url">here</a> to reset your password.</p>`;
  
    await sendEmail(email, subject, html);
  }

  async sendCollaborationRequest(req, res) {
    try {
      const { targetUsername, requestText } = req.body;
      const { user_id: senderUserId } = req.user;
  
      const targetUser = await knex('users').where('username', targetUsername).first();
  
      if (!targetUser) {
        return res.status(400).json({ message: 'Target user not found.' });
      }
  
      // Insert a record for the collaboration request
      await knex('collaboration_requests').insert({
        sender_user_id: senderUserId,
        receiver_user_id: targetUser.user_id,
        request_text: requestText,
        status: 'pending'
      });
  
      res.status(200).json({ message: 'Collaboration request sent successfully.' });
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      res.status(500).json({ message: 'Failed to send collaboration request.', error: error.message });
    }
  }
  
  async getCollaborationRequests(req, res) {
    try {
      const { user_id } = req.user; // Assuming you have middleware to get user_id
  
      // Retrieve collaboration requests for the user
      const collaborationRequests = await knex('collaboration_requests')
        .where('receiver_user_id', user_id)
        .andWhere('status', 'pending')
        .select('*');
  
      res.status(200).json({ collaborationRequests });
    } catch (error) {
      console.error('Error getting collaboration requests:', error);
      res.status(500).json({ message: 'Failed to get collaboration requests.', error: error.message });
    }
  }

  async rejectCollaborationRequest(req, res) {
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

      // Update the collaboration request status to rejected
      await knex('collaboration_requests')
        .where('request_id', request_id)
        .update({ status: 'rejected' });

      // You can add more logic here as needed for your application

      res.status(200).json({ message: 'Collaboration request rejected successfully.' });
    } catch (error) {
      console.error('Error rejecting collaboration request:', error);
      res.status(500).json({ message: 'Failed to reject collaboration request.', error: error.message });
    }
  }

  async acceptCollaborationRequest(req, res) {
    try {
      const { request_id } = req.params;
      const { user_id } = req.user;
  
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
  
      // Join a Socket.io room with a unique name (using request_id here as an example)
      const roomName = `collaborationRoom_${request_id}`;
      req.app.get('io').of('/notes').to(roomName).emit('userJoinedCollaboration', { user_id });
  
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

    //FIX REMEMBER ME TIME BOOLEAN
    const tokenExpiration = rememberMe ? 6000000000000000000000000000000000 : '1h';  // Set null if rememberMe is true, else set to 1 hour

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
          maxAge: tokenExpiration ? null : 3600000  // Set maxAge to null if rememberMe is true, else set to 1 hour
        });
	      console.log('Generated token:', token);
        res.status(200).json({ token , username: user.username, userId: user.user_id });
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
router.put('/collaborate/reject/:request_id', categoriesAuthenticateToken, usersController.rejectCollaborationRequest);
router.get('/collaborate/requests', categoriesAuthenticateToken, usersController.getCollaborationRequests);
router.post('/activate', async (req, res) => {
  try {
    const { email, activationCode } = req.body;

    // Retrieve the user based on the provided email
    const user = await knex('users').where('email', email).first();

    // Check if the user and activation code match
    if (!user || user.activation_code !== activationCode) {
      return res.status(400).json({ message: 'Invalid activation code.' });
    }

    // Update the user's status to activated
    await knex('users').where('email', email).update({ status: 'activated' });

    res.status(200).json({ message: 'Account activated successfully.' });
  } catch (error) {
    res.status(400).json({ message: 'Account activation failed.', error: error.message });
  }
});


module.exports = router;
