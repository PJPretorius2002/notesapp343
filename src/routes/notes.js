const express = require('express');
const jwt = require('jsonwebtoken');
const NotesApi = require('../controllers/notesController'); // Adjust the path accordingly

const router = express.Router();
const notesApi = new NotesApi();

// Middleware to authenticate users
router.use((req, res, next) => {
  const token = req.header('Authorization');
  console.log("Received token in notes.js:", token);
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, 'i9P&k6Xn2Rr6u9P2s5v8y/B?E(H+MbQe'); // Change this to your actual secret key
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
});

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
router.post("/", async (req, res) => {
  const note = req.body;
  const result = await notesApi.createNote(note);

  if (result.error) {
    return res.status(401).json({ message: result.error });
  }

  res.status(201).json(result); // Successful response
});


// Route to update a note
router.put('/:id', async (req, res) => {
  try {
    // Ensure the ownerId is set to the user's id from the decoded token
    const updatedNote = await notesApi.updateNote({
      ...req.body,
      id: req.params.id,
      ownerId: req.user._id,
    });
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
