const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const notesRouter = require('./src/controllers/notesController');
const usersController = require('./src/controllers/usersController');
const jwt = require('jsonwebtoken');
const db = require('./config/db.js');  // Update this with the correct path
const cors = require('cors'); // Import the cors package

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://notesapp343-front-end-3ef1866fe1d5.herokuapp.com%27/);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, 'i9P&k6Xn2Rr6u9P2s5v8y/B?E(H+MbQe', (err, user) => {
    if (err) return res.status(400).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.use(express.json());

app.use('/notes', authenticateToken, notesRouter);  // Use notesRouter as the notesApi
app.use('/users', usersController);

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  // Listen for note changes
  socket.on('note-changed', async (updatedNote) => {
    // Assuming notesRouter handles the update functionality
    const updatedNoteFromDb = await notesRouter.updateNote(updatedNote);
    io.emit('note-updated', updatedNoteFromDb);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3000;

// Use the knex instance for the database connection
db.raw('SELECT 1+1 AS result').then(() => {
  server.listen(PORT, () => {
    console.log('Server is listening on port ${PORT}');
  });
}).catch((err) => {
  console.error('Error connecting to the database:', err);
});

module.exports = app;