const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const User = require('./models/User');
const Chat = require('./models/Chat');

require('dotenv').config(); 

const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN, 
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// --- REST ROUTES ---

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashed });

    const token = jwt.sign({ id: newUser._id, email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ success: true, message: 'Registered successfully', token, user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ success: true, message: 'Login successful', token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add Friend & Create Chat
app.post('/api/add-friend', async (req, res) => {
  const { userEmail, friendEmail, friendName } = req.body;

  try {
    const user = await User.findOne({ email: userEmail });
    let friend = await User.findOne({ email: friendEmail });

    if (!friend) {
      friend = await User.create({
        name: friendName,
        email: friendEmail,
        password: await bcrypt.hash('default123', 10),
      });
    }

    const existingChat = await Chat.findOne({
      members: { $all: [user._id, friend._id] }
    });

    if (existingChat) {
      return res.json({ message: 'Already friends', chatId: existingChat._id });
    }

    const newChat = await Chat.create({
      members: [user._id, friend._id],
      messages: [],
    });

    user.friends.push({ friendId: friend._id, chatId: newChat._id });
    friend.friends.push({ friendId: user._id, chatId: newChat._id });

    await user.save();
    await friend.save();

    res.json({ message: 'Friend added', chatId: newChat._id });
  } catch (err) {
    console.error('Add friend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get chat messages by chatId
app.post('/api/get-chat-messages', async (req, res) => {
  const { chatId } = req.body;

  try {
    const chat = await Chat.findById(chatId).populate('messages.sender', 'email');
    if (!chat) return res.json({ messages: [] });

    const formattedMessages = chat.messages.map(msg => ({
      from: msg.sender.email,
      message: msg.text,
      timestamp: msg.timestamp,
    }));

    res.json({ messages: formattedMessages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's friends list
app.post('/api/get-friends', async (req, res) => {
  const { userEmail } = req.body;

  try {
    const user = await User.findOne({ email: userEmail }).populate({
      path: 'friends.friendId friends.chatId',
      select: 'name email',
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const friends = user.friends.map(f => ({
      name: f.friendId.name,
      email: f.friendId.email,
      chatId: f.chatId._id,
    }));

    res.json({ friends });
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- SOCKET.IO AUTH ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    next(new Error('Unauthorized'));
  }
});

// --- SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.user.email);

  socket.on('send-message', async ({ from, to, message }) => {
    try {
      const senderUser = await User.findOne({ email: from });
      const receiverUser = await User.findOne({ email: to });

      if (!senderUser || !receiverUser) {
        console.error('Sender or receiver not found in DB:', { from, to });
        return;
      }

      const senderId = senderUser._id;
      const receiverId = receiverUser._id;

      // Find existing chat
      let chat = await Chat.findOne({
        members: { $all: [senderId, receiverId], $size: 2 },
      });

      if (!chat) {
        chat = await Chat.create({ members: [senderId, receiverId], messages: [] });
        senderUser.friends.push({ friendId: receiverId, chatId: chat._id });
        receiverUser.friends.push({ friendId: senderId, chatId: chat._id });
        await senderUser.save();
        await receiverUser.save();
      }

      // Save message to database
      const newMsg = { 
        sender: senderId, 
        text: message, 
        timestamp: new Date() 
      };
      chat.messages.push(newMsg);
      await chat.save();

      // 🔥 KEY FIX: Include chatId in the socket emission
      io.emit('receive-message', { 
        from, 
        to, 
        message, 
        chatId: chat._id.toString(),
        timestamp: newMsg.timestamp
      });

      console.log(`Message sent from ${from} to ${to} in chat ${chat._id}`);

    } catch (err) {
      console.error('Error sending message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.user.email);
  });
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});