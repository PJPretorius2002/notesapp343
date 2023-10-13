const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../../config/db'); // Adjust the path based on your file structure

class NotesApi {
  async getNotes() {
    const notes = await db('notes'); // Adjust the table name accordingly
    return notes;
  }

  async createNote(req, res) {
    try {
      const token = req.header('Authorization');
      const secretKey = fetchSecretKeyBasedOnToken(token);

      jwt.verify(token, secretKey, async (err, user) => {
        if (err) return res.status(400).json({ message: 'Invalid token' });

        const newNote = {
          // Assuming the request body contains the note details
          title: req.body.title,
          content: req.body.content,
          category_id: req.body.categoryId,
          owner_id: user.id // Use the user ID from the token as the owner ID
        };

        const [newNoteId] = await db('notes').insert(newNote);
        const createdNote = await db('notes').where('id', newNoteId).first();

        res.status(201).json(createdNote);
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating note', error: error.message });
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

const secretKey = "i9P&k6Xn2Rr6u9P2s5v8y/B?E(H+MbQe";

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

