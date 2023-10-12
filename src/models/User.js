const bcrypt = require('bcrypt');
const db = require('../config/db');

class User {
  constructor(username, email, password_hash) {
    this.username = username;
    this.email = email;
    this.password = password;
  }

  async save() {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);

      await db.none('INSERT INTO users(username, email, password) VALUES($1, $2, $3)', [
        this.username,
        this.email,
        hashedPassword,
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

