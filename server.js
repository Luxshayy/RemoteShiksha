const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const roleMiddleware = require('./middleware/roleMiddleware');
const courseRoutes = require('./routes/course');
const lectureRoutes = require('./routes/lecture');
const quizRoutes = require('./routes/quiz');
const resultRoutes = require("./routes/result");
const adminRoutes = require("./routes/admin");

const app = express();
const server = http.createServer(app);

// ================= SOCKET.IO SETUP =================
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {

  // Student/Teacher joins a lecture room
  socket.on('join-lecture', (lectureId) => {
    socket.join(lectureId);
  });

  // Broadcast message to everyone in that lecture room
  socket.on('send-message', ({ lectureId, message, sender, role }) => {
    const msg = {
      message,
      sender,
      role,
      time: new Date().toISOString()
    };
    io.to(lectureId).emit('receive-message', msg);
  });

  socket.on('disconnect', () => {});
});

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= ROOT ROUTE =================
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend/home.html');
});

// ================= STATIC FILES =================
app.use(express.static(__dirname + '/frontend'));

// ================= ROUTES =================
app.use('/api/auth', authRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/lecture', lectureRoutes);
app.use('/api/quiz', quizRoutes);
app.use("/api/result", resultRoutes);
app.use("/api/admin", adminRoutes);

// ================= PROTECTED TEST ROUTES =================
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route",
    user: req.user
  });
});

app.get(
  '/api/teacher',
  authMiddleware,
  roleMiddleware(['teacher']),
  (req, res) => {
    res.json({ message: "Welcome Teacher Dashboard" });
  }
);

app.get(
  '/api/admin',
  authMiddleware,
  roleMiddleware(['admin']),
  (req, res) => {
    res.json({ message: "Welcome Admin Panel" });
  }
);

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.log('MongoDB Connection Error:', err));

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});