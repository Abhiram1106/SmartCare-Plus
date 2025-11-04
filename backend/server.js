require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  } 
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get('/', (req,res) => res.send('SmartCare+ backend prototype running'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctor'));
app.use('/api/appointments', require('./routes/appointment'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/intents', require('./routes/intent'));
app.use('/api/chatlogs', require('./routes/chatlog'));
app.use('/api/admin', require('./routes/admin'));

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  
  // Chat message handling
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // Appointment notifications
  socket.on('appointment:update', (data) => {
    io.emit('appointment:notification', data);
  });

  // Payment notifications
  socket.on('payment:update', (data) => {
    io.emit('payment:notification', data);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

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
