const db = require('../../config/db');

class User {
  constructor(username, email, password) {
    this.username = username;
    this.email = email;
    this.password = password;
  }

  async save() {
    try {
      await db.none('INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3)', [
        this.username,
        this.email,
        this.password,  // Store the password directly (not hashed)
      ]);
    } catch (error) {
      throw new Error('Error saving user: ' + error.message);
    }
  }

  static async getByEmail(email) {
    try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', email);
      return user;
    } catch (error) {
      throw new Error('Error getting user by email: ' + error.message);
    }
  }
}

module.exports = User;
