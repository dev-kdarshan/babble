// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friends: [
    {
      friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
