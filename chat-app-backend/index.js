const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const connectDB = require("./server"); // Import the MongoDB connection function
const User = require("./models/User"); // Import User model

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("userConnected", async (user) => {
    console.log(`User connected: ${user.userName} with ID: ${user.userId}`);

    try {
      // Check if user already exists in the database
      let existingUser = await User.findOne({ userId: user.userId });

      if (!existingUser) {
        // If user doesn't exist, save them in DB
        const newUser = new User({
          userId: user.userId,
          username: user.userName,
          email: user.email,
          password: user.password, // 🔴 NOTE: This should be hashed before saving in a real app
          socketId: socket.id, // Save socket ID for tracking
        });

        await newUser.save();
        console.log(`✅ User ${user.userName} saved to database`);
      } else {
        // If user exists, update their socketId
        existingUser.socketId = socket.id;
        await existingUser.save();
        console.log(
          `🔄 User ${user.userName} already exists, updated socketId`
        );
      }
    } catch (error) {
      console.error("❌ Error saving user to database:", error);
    }
  });

  // Handle messages
  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });

  // Typing events
  socket.on("userTyping", (userName) => {
    socket.broadcast.emit("userTyping", userName);
  });

  socket.on("stopTyping", (userName) => {
    socket.broadcast.emit("stopTyping", userName);
  });

  // Handle disconnection
  socket.on("disconnect", async () => {
    console.log("User disconnected");

    try {
      await User.findOneAndUpdate({ socketId: socket.id }, { socketId: null });
      console.log("🔄 User socket ID removed on disconnect");
    } catch (error) {
      console.error("❌ Error updating user on disconnect:", error);
    }
  });
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ message: "An unexpected error occurred." });
});

// Connect to MongoDB and start the server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
