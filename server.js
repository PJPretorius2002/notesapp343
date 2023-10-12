const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const notesRouter = require('./src/controllers/notesController');
const usersController = require('./src/controllers/usersController');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

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
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;

