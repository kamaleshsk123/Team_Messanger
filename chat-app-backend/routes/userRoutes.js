const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Joi = require("joi");

const router = express.Router();

const userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Register route
// Register route
router.post("/register", async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    // Validate the request body
    await userSchema.validateAsync(req.body);

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash the password and create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    // Send the success response
    res.status(201).json({
      message: "User registered successfully",
      userId: newUser.userId,
    });
  } catch (err) {
    console.error("Error during registration:", err); // Log the error
    next(err); // Pass the error to the next middleware
  }
});

const authenticateUser = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      "662e75eafd0f160fe7fb35703b01f6af16ac8e603f3ad0692c1e9fc39737f9da"
    ); // Replace with your secret key
    req.user = decoded; // Attach user details to request
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
};

// ✅ API to get user details by userId
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Login route
router.post("/login", async (req, res, next) => {
  const { identifier, password } = req.body; // Accepts both email and username

  try {
    // Find the user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) return res.status(400).json({ message: "User not found" });

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate a token
    const token = jwt.sign(
      { userId: user._id },
      "662e75eafd0f160fe7fb35703b01f6af16ac8e603f3ad0692c1e9fc39737f9da",
      {
        expiresIn: "1h",
      }
    );

    res.json({ token, user });
  } catch (err) {
    console.error("Error during login:", err);
    next(err); // Pass the error to the next middleware
  }
});

module.exports = router;
