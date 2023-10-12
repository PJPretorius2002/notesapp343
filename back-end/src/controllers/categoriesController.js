const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../config/db'); // Adjust the path based on your file structure

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

      // Insert category details into the database
      const [categoryId] = await knex('categories').insert({
        name,
      });

      const category = await knex('categories').where({ id: categoryId }).first();

      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Add other category-related CRUD operations as needed
}

const categoriesController = new CategoriesController();
const router = express.Router();

router.get('/', categoriesController.getAllCategories);
router.post('/', categoriesController.createCategory);

module.exports = router;

