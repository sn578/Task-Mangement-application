const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks')(io));

io.on('connection', (socket) => {
    console.log('A user connected via WebSocket:', socket.id);
    socket.on('disconnect', () => console.log('User disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));