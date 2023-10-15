const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../../config/db'); // Adjust the path based on your file structure

class NotesApi {
  async getNotes() {
    const notes = await db('notes'); // Adjust the table name accordingly
    return notes;
  }

async createNote(req, res) {
  // Retrieve user from the database by email
  let userId;
  console.log('req.user upper:', req.user); // Log the req.user object
  if (req.user && req.user.id) {
    userId = req.user.id;
    console.log('userId:', userId); // Log the req.user object
  } else {
    // Handle the case where user ID is not available (e.g., user not authenticated)
    console.log('Yes I am the problem'); // Log the req.user object
    return res.status(401).json({ error: 'User not authenticated' }); // Return an error response
  }

  const note = {
    title: req.body.title,
    content: req.body.content,
    user_id: userId
  };

  console.log('Note object:', note);  // Log the note object

  try {
    console.log('Attempting to insert note:', note);
    const newNoteIdArray = await db('notes').insert(note, ['note_id']);
    const newNoteId = newNoteIdArray[0]?.note_id; // Extract the note_id as an integer

    if (newNoteId) {
      const newNote = await db('notes').where('note_id', newNoteId).first();
      return res.status(201).json(newNote); // Send a success response
    } else {
      console.error('Error inserting note: newNoteId is undefined or empty');
      return res.status(500).json({ error: 'Failed to create note' }); // Send an error response
    }
  } catch (error) {
    console.error('Error inserting note:', error);
    return res.status(500).json({ error: 'Failed to create note' }); // Send an error response
  }
}


async updateNote(id, updatedNoteData) {
  try {
    const updatedNote = await db('notes')
      .where('note_id', id)
      .update(updatedNoteData);

    if (updatedNote) {
      const updatedNote = await db('notes')
        .where('note_id', id)
        .first();
      return updatedNote;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error updating note:', error);
    throw new Error('Failed to update note');
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
};

router.use(authenticateToken);

router.get("/", async (req, res) => {
  const notes = await notesApi.getNotes();
  res.status(200).json(notes);
});

router.post("/", async (req, res) => {
  try {
    await notesApi.createNote(req, res); // Pass res as the second argument
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});


// Update a note
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const updatedNoteData = req.body; // Updated note data from the request

  try {
    const updatedNote = await notesApi.updateNote(id, updatedNoteData);
    if (updatedNote) {
      res.status(200).json(updatedNote);
    } else {
      res.status(404).json({ error: 'Note not found' });
    }
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
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
