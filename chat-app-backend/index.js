const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const connectDB = require("./server"); // Import the MongoDB connection function

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

  socket.on("userConnected", (user) => {
    console.log(`User connected: ${user.userName} with ID: ${user.userId}`);
  });

  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
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
