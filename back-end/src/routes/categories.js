const express = require('express');
const jwt = require('jsonwebtoken');
const CategoriesApi = require('../controllers/categoriesController'); // Adjust the path accordingly

const router = express.Router();
const categoriesApi = new CategoriesApi();

// Middleware to authenticate users
router.use((req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, 'i9P&k6Xn2Rr6u9P2s5v8y/B?E(H+MbQe'); // Change this to your actual secret key
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
});

// Route to get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await categoriesApi.getCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error getting categories', error: error.message });
  }
});

// Route to create a new category
router.post('/', async (req, res) => {
  try {
    const newCategory = await categoriesApi.createCategory(req.body);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
});

// Route to update a category
router.put('/:id', async (req, res) => {
  try {
    const updatedCategory = await categoriesApi.updateCategory(req.params.id, req.body);
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
});

// Route to delete a category
router.delete('/:id', async (req, res) => {
  try {
    await categoriesApi.deleteCategory(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

module.exports = router;

