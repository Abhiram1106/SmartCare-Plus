require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const SocketManager = require('./socketManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  } 
});

// Initialize Socket Manager
const socketManager = new SocketManager(io);

// Make io and socketManager available to routes
app.set('io', io);
app.set('socketManager', socketManager);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach socketManager to req object for all routes
app.use((req, res, next) => {
  req.io = io;
  req.socketManager = socketManager;
  next();
});

connectDB();

app.get('/', (req,res) => res.send('SmartCare+ backend prototype running'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctor'));
app.use('/api/appointments', require('./routes/appointment'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/intents', require('./routes/intent'));
app.use('/api/chatlogs', require('./routes/chatlog'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`

  SmartCare+ Backend Server Running...
  
  Port:        ${PORT}                                     
  Environment: ${process.env.NODE_ENV || 'development'}                                       
  Database:    ${process.env.MONGO_URI ? 'MongoDB Atlas Connected' : 'MongoDB Local'}         
  Socket.io:   Enabled                                    

  `);
});
