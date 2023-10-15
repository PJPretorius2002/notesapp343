const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../../config/db'); // Adjust the path based on your file structure

class CategoriesController {

  async getAllCategories(req, res) {
    try {
      const categories = await knex('categories');
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

async createCategory(req, res) {
  try {
    const { name } = req.body;
    const userId = req.user.id;  // Assuming your token includes the user ID

    // Insert category details into the database, associating it with the user
    const [categoryId] = await knex('categories').insert({
      name,
      user_id: userId  // Associate the category with the user
    });

    const category = await knex('categories').where({ category_id: categoryId }).first();

    res.status(201).json([category]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


  // Add other category-related CRUD operations as needed
}

const categoriesController = new CategoriesController();
const router = express.Router();
const secretKey = 'i9P&k6Xn2Rr6u9P2s5v8y/B?E(H+MbQe';

const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('Auth Header:', authHeader);

  const token = authHeader && authHeader.split(' ')[1]; // Extract the token without "Bearer "
  console.log('Extracted Token:', token);

  if (!token) {
    console.log('Token not provided');
    return res.status(401).json({ message: 'Access denied' });
  }

  // Decode the token to inspect its structure
  const decodedToken = jwt.decode(token);
  console.log('Decoded token:', decodedToken);

  try {
    const decoded = jwt.verify(token, secretKey);
    console.log('Decoded token:', decoded);  // Log the decoded token
    req.user = {
      id: decoded.user_id  // Set req.user to an object containing user_id
    };
    console.log('req.user:', req.user);
    next();
  } catch (err) {
    console.log('Error verifying token:', err);
    return res.status(400).json({ message: 'Invalid token' });
  }
};

router.get('/', categoriesController.getAllCategories);
router.post('/', authenticateToken, categoriesController.createCategory); // Use authenticateToken middleware

module.exports = {
  authenticateToken,
  router
};

