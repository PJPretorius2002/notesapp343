const db = require('../config/db');

class Note {
  constructor(title, content, categoryId, ownerId) {
    this.title = title;
    this.content = content;
    this.categoryId = categoryId;
    this.ownerId = ownerId;
  }

  static async getAll() {
    try {
      const notes = await db.any('SELECT * FROM notes');
      return notes;
    } catch (error) {
      throw new Error('Error getting notes: ' + error.message);
    }
  }

  async save() {
    try {
      // Ensure ownerId is set correctly
      if (!this.ownerId) {
        throw new Error('Note must have an owner.');
      }

      await db.none('INSERT INTO notes(title, content, category_id, owner_id) VALUES($1, $2, $3, $4)', [
        this.title,
        this.content,
        this.categoryId,
        this.ownerId,
      ]);
    } catch (error) {
      throw new Error('Error saving note: ' + error.message);
    }
  }
}

module.exports = Note;
