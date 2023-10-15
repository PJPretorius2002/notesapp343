const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../../config/db'); // Adjust the path based on your file structure

class NotesApi {
  async getNotes() {
    const notes = await db('notes'); // Adjust the table name accordingly
    return notes;
  }

async createNote(req) {
  // Retrieve user from the database by email
  let userId;
  console.log('req.user upper:', req.user); // Log the req.user object
  if (req.user && req.user.id) {
    userId = req.user.id;
    console.log('userId:', userId); // Log the req.user object
  } else {
    // Handle the case where user ID is not available (e.g., user not authenticated)
    console.log('Yes I am the problem'); // Log the req.user object
    return { error: 'User not authenticated' }; // Return an error object
  }

  const note = {
    ...req.body,
    user_id: userId // Associate the note with the user by setting owner_id
  };

  console.log('Note object:', note);  // Log the note object

  try {
    console.log('Attempting to insert note:', note);
    const [newNoteId] = await db('notes').insert(note); // Adjust the table name accordingly
    console.log('Note inserted successfully with ID:', newNoteId);

    const newNote = await db('notes').where('id', newNoteId).first(); // Adjust the table name accordingly
    return newNote;
  } catch (error) {
    console.error('Error inserting note:', error);
    return { error: 'Failed to create note' }; // Return an error object in case of a database error
  }
}


  async updateNote(note) {
    const updatedNote = await db('notes').where('id', note.id).update(note); // Adjust the table name and primary key accordingly
    if (updatedNote) {
      const updatedNote = await db('notes').where('id', note.id).first(); // Adjust the table name and primary key accordingly
      return updatedNote;
    } else {
      return null;
    }
  }

  async deleteNote(id) {
    const deletedNote = await db('notes').where('id', id).del(); // Adjust the table name and primary key accordingly
    return deletedNote;
  }
}

const notesApi = new NotesApi();
const router = express.Router(); // Create a router
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

  next();
};

router.use(authenticateToken);

router.get("/", async (req, res) => {
  const notes = await notesApi.getNotes();
  res.status(200).json(notes);
});

router.post("/", async (req, res) => {
  try {
    const newNote = await notesApi.createNote(req);
    console.log("Before sending response");
    res.status(201).json(newNote);
    console.log("After sending response");
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const note = req.body;
  note.id = id; // Ensure the note ID is set correctly
  const updatedNote = await notesApi.updateNote(note);
  res.status(200).json(updatedNote);
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  await notesApi.deleteNote(id);
  res.status(204).send();
});

module.exports = {
  authenticateToken,
  router
};
