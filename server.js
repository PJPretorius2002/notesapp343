const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { router: notesRouter, authenticateToken: notesAuthenticateToken } = require('./src/controllers/notesController');
const { router: categoriesRouter, authenticateToken: categoriesAuthenticateToken } = require('./src/controllers/categoriesController');
const usersController = require('./src/controllers/usersController');
const { setupWebSocket } = require('./src/controllers/notesController');  // Import the setupWebSocket function
const jwt = require('jsonwebtoken');
const db = require('./config/db.js');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Setup WebSocket for notes
setupWebSocket(io);
console.log('WebSocket setup called');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.use(cors());
app.use(express.json());
app.use('/notes', notesAuthenticateToken, notesRouter);
app.use('/users', usersController);
app.use('/categories', categoriesAuthenticateToken, categoriesRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

const PORT = process.env.PORT || 3000;

// WebSocket event handling
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // Example: Handle collaboration request event and emit notifications
  socket.on('collaborationRequest', (data) => {
    console.log('Received collaboration request:', data);
    io.emit('notification', { type: 'collaborationRequest', data });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// WebSocket event handling
io.of('/notes').on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('userJoinedCollaboration', ({ user_id }) => {
    console.log(`User ${user_id} joined the collaboration.`);
    
    // Send a welcome message to the user who just joined
    socket.emit('welcomeMessage', { message: 'Welcome to the collaboration!' });
    
    // You can add more synchronization logic here as needed
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Use the knex instance for the database connection
db.raw('SELECT 1+1 AS result').then(() => {
  server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Error connecting to the database:', err);
});

module.exports = {
    app,
    io
};
