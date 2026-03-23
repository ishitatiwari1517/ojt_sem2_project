const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Protect middleware — verifies JWT and attaches req.user to the request.
 *
 * Usage:
 *   router.get('/protected', protect, handler);
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized — no token provided.");
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "energylens_secret_key"
  );

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    res.status(401);
    throw new Error("Not authorized — user no longer exists.");
  }

  req.user = user;
  next();
});

module.exports = { protect };
