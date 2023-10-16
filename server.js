const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { router: notesRouter, authenticateToken: notesAuthenticateToken, setupWebSocket: notesSetupWebSocket, io: notesIo } = require('./src/controllers/notesController');
const { router: categoriesRouter, authenticateToken: categoriesAuthenticateToken } = require('./src/controllers/categoriesController');
const usersController = require('./src/controllers/usersController');
const jwt = require('jsonwebtoken');
const db = require('./config/db.js');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Setup WebSocket for notes
notesSetupWebSocket(server);

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

// Use the knex instance for the database connection
db.raw('SELECT 1+1 AS result').then(() => {
  server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Error connecting to the database:', err);
});

module.exports = app;
