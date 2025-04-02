const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this to your frontend's origin in production
  },
});

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Import and use API routes
const userRoutes = require("./UserRoutes");
app.use("/api/users", userRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("userConnected", (user) => {
    console.log(`User connected: ${user.userName} with ID: ${user.userId}`);
    // Store user information as needed
  });

  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});
app.use(express.json());
// Start the server
server.listen(5000, () => console.log("Server running on port 5000"));
