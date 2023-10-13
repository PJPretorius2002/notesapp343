const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../../config/db'); // Adjust the path based on your file structure

class NotesApi {
  async getNotes() {
    const notes = await db('notes'); // Adjust the table name accordingly
    return notes;
  }

  async createNote(req) {
    const userId = req.user.id; // Get the user ID from the request (set during authentication)
    const note = {
      ...req.body,
      owner_id: userId // Associate the note with the user by setting owner_id
    };

    const [newNoteId] = await db('notes').insert(note); // Adjust the table name accordingly
    const newNote = await db('notes').where('id', newNoteId).first(); // Adjust the table name accordingly
    return newNote;
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

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(400).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

router.use(authenticateToken);

router.get("/", async (req, res) => {
  const notes = await notesApi.getNotes();
  res.status(200).json(notes);
});

router.post("/", async (req, res) => {
  const note = req.body;

  // Log the received token
  console.log("Received token:", req.header('Authorization'));

  const newNote = await notesApi.createNote(note);
  res.status(201).json(newNote);
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

module.exports = router; // Export the router for use in other files
