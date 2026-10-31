const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const StudyData = require("../models/StudyData");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    joined: user.createdAt,
  };
}

async function register(req, res) {
  try {
    const { name, email, password, role = "student" } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({ message: "Invalid registration role." });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      status: "active",
    });

    await StudyData.insertMany([
      { resource: "tasks", ownerEmail: normalizedEmail, data: [] },
      { resource: "chat", ownerEmail: normalizedEmail, data: [] },
      { resource: "quizHistory", ownerEmail: normalizedEmail, data: [] },
      { resource: "flashcards", ownerEmail: normalizedEmail, data: [] },
      { resource: "planner", ownerEmail: normalizedEmail, data: [] },
      { resource: "settings", ownerEmail: normalizedEmail, data: { notifications: true, compactMode: false } },
    ]);

    return res.status(201).json({
      user: publicUser(user),
      token: signToken(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Unable to create account." });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "This account has been suspended." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    return res.json({
      user: publicUser(user),
      token: signToken(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Unable to sign in." });
  }
}

async function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}

module.exports = { register, login, me };
