const db = require('../../config/db');

class Category {
  constructor(name) {
    this.name = name;
  }

  static async getAll() {
    try {
      const categories = await db.any('SELECT * FROM categories');
      return categories;
    } catch (error) {
      throw new Error('Error getting categories: ' + error.message);
    }
  }

  async save() {
    try {
      await db.none('INSERT INTO categories(name) VALUES($1)', [this.name]);
    } catch (error) {
      throw new Error('Error saving category: ' + error.message);
    }
  }
}

module.exports = Category;

