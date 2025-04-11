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
    origin: "http://localhost:4200",
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/users", userRoutes);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("userConnected", async (user) => {
    console.log("📥 Received user data:", user); // ✅ Log this

    if (!user.userId || !user.userName || !user.email || !user.password) {
      console.error("❌ Missing required fields:", user);
      return;
    }

    try {
      let existingUser = await User.findOne({ userId: user.userId });

      if (!existingUser) {
        const newUser = new User({
          userId: user.userId,
          username: user.userName,
          email: user.email,
          password: user.password,
          socketId: socket.id,
          isOnline: true,
        });

        await newUser.save();
        console.log(`✅ User ${user.userName} saved to database`);
      } else {
        existingUser.socketId = socket.id;
        existingUser.isOnline = true; // ✅ Mark as online
        await existingUser.save();
        console.log(`🔄 User ${user.userName} updated socketId`);
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
      const user = await User.findOne({ socketId: socket.id });

      if (user) {
        user.socketId = null;
        user.isOnline = false; // ✅ Mark as offline
        await user.save();
        console.log(`🔄 User ${user.username} marked offline`);
      }
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
// Clear all users on server start
connectDB().then(async () => {
  await User.updateMany({}, { isOnline: false }); // reset all
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
