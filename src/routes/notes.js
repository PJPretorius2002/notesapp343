const express = require('express');
const jwt = require('jsonwebtoken');
const NotesApi = require('../controllers/notesController'); // Adjust the path accordingly

const router = express.Router();
const notesApi = new NotesApi();

// Middleware to authenticate users
router.use((req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, fetchSecretKeyBasedOnToken(token));
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
});

// Fetch secret key based on token
function fetchSecretKeyBasedOnToken(token) {
  // Replace this with your logic to fetch the secret key based on the token from your database or other source
  // For simplicity, we'll assume the token itself is the secret key
  return token;
}

// Route to get all notes
router.get('/', async (req, res) => {
  try {
    const notes = await notesApi.getNotes();
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error getting notes', error: error.message });
  }
});

// Route to create a new note
router.post('/', async (req, res) => {
  try {
    const newNote = await notesApi.createNote(req.body);
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Error creating note', error: error.message });
  }
});

// Route to update a note
router.put('/:id', async (req, res) => {
  try {
    const updatedNote = await notesApi.updateNote(req.params.id, req.body);
    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: 'Error updating note', error: error.message });
  }
});

// Route to delete a note
router.delete('/:id', async (req, res) => {
  try {
    await notesApi.deleteNote(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
});

module.exports = router;
