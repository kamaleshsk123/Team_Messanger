// models/User.js
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid"); // Import UUID package

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4, // Auto-generate userId using UUID
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  socketId: {
    type: String,
    default: null, // Store socket ID when user is online
  },
  profileImage: { type: String, default: "" },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
