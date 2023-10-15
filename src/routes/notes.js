const express = require('express');
const jwt = require('jsonwebtoken');
const NotesApi = require('../controllers/notesController'); // Adjust the path accordingly

const router = express.Router();
const notesApi = new NotesApi();

// Route to get all notes
router.get('/', async (req, res) => {
  try {
    const notes = await notesApi.getNotes();
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error getting notes', error: error.message });
  }
});


// Route to update a note
router.put('/:id', async (req, res) => {
  try {
    const updatedNote = await notesApi.updateNote({
      ...req.body,
      id: req.params.id,
      ownerId: req.user._id, // Ensure the ownerId is set to the user's id from the decoded token
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
