const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../../config/db'); // Adjust the path based on your file structure

class CategoriesApi {
  async getCategories() {
    const categories = await db('categories'); // Adjust the table name accordingly
    return categories;
  }

  async createCategory(req, res) {
    let userId;
    if (req.user && req.user.id) {
      userId = req.user.id;
    } else {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const category = {
      name: req.body.name,
      user_id: userId
    };

    try {
      const newCategoryIdArray = await db('categories').insert(category, ['category_id']);
      const newCategoryId = newCategoryIdArray[0]?.category_id;

      if (newCategoryId) {
        const newCategory = await db('categories').where('category_id', newCategoryId).first();
        return res.status(201).json(newCategory);
      } else {
        return res.status(500).json({ error: 'Failed to create category' });
      }
    } catch (error) {
      console.error('Error inserting category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  }

async updateCategory(req, res) {
    const categoryId = req.params.id; // Get category id from request params
    const { name } = req.body;

    try {
      const updatedRows = await db('categories')
        .where('category_id', categoryId)
        .update({ name });

      if (updatedRows > 0) {
        const updatedCategory = await db('categories')
          .where('category_id', categoryId)
          .first();
        return res.status(200).json(updatedCategory);
      } else {
        return res.status(404).json({ error: 'Category not found' });
      }
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ error: 'Failed to update category' });
    }
  }

  async deleteCategory(req, res) {
    const categoryId = req.params.id; // Get category id from request params

    try {
      const deletedRows = await db('categories')
        .where('category_id', categoryId)
        .del();

      if (deletedRows > 0) {
        return res.status(204).send(); // Successfully deleted
      } else {
        return res.status(404).json({ error: 'Category not found' });
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ error: 'Failed to delete category' });
    }
  } 
}

const categoriesApi = new CategoriesApi();
const router = express.Router(); // Create a router

const secretKey = 'i9P&k6Xn2Rr6u9P2s5v8y/B?E(H+MbQe';

const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  const decodedToken = jwt.decode(token);

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = {
      id: decoded.user_id
    };
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Invalid token' });
  }
};

router.use(authenticateToken);

router.get("/", async (req, res) => {
  const categories = await categoriesApi.getCategories();
  res.status(200).json(categories);
});

router.post("/", async (req, res) => {
  try {
    await categoriesApi.createCategory(req, res);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put("/:id", async (req, res) => {
  try {
    await categoriesApi.updateCategory(req, res);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await categoriesApi.deleteCategory(req, res);
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});


module.exports = {
  authenticateToken,
  router
};
