const User = require("../models/User");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "energylens_secret_key", {
    expiresIn: "7d",
  });

// POST /api/auth/signup
exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields are required.");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters.");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error("An account with this email already exists. Please log in.");
  }

  const user = await User.create({ name, email, password });

  return res.status(201).json({
    success: true,
    message: "Account created successfully!",
    token: generateToken(user._id),
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
      },
    },
  });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error("No account found with this email. Please sign up first.");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Incorrect password. Please try again.");
  }

  return res.status(200).json({
    success: true,
    message: "Login successful!",
    token: generateToken(user._id),
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
      },
    },
  });
});

// GET /api/auth/me — get current user profile
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({
    success: true,
    message: "User profile retrieved",
    data: { user },
  });
});

// POST /api/auth/google — verify Google ID token, find/create user, return JWT
exports.googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error("Google credential is required.");
  }

  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
    res.status(500);
    throw new Error("Google OAuth is not configured on this server. Please set GOOGLE_CLIENT_ID in .env");
  }

  // Verify the Google ID token
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { name, email, picture, sub: googleId } = ticket.getPayload();

  // Find existing user or auto-create from Google profile
  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // New user via Google — no password required
    user = await User.create({
      name,
      email: email.toLowerCase(),
      password: `google_${googleId}_${Date.now()}`, // placeholder, can't be used to log in
      googleId,
      avatar: picture,
    });
  } else if (!user.googleId) {
    // Existing email/password user — link their Google account
    user.googleId = googleId;
    if (!user.avatar) user.avatar = picture;
    await user.save();
  }

  return res.status(200).json({
    success: true,
    message: user.createdAt >= new Date(Date.now() - 5000) ? "Google account created!" : "Google sign-in successful!",
    token: generateToken(user._id),
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || picture,
        subscription: user.subscription,
      },
    },
  });
});
