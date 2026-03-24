const express = require("express");
const router = express.Router();
const { signup, login, getMe, googleAuth } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { INDIAN_STATES } = require("../utils/constants");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/google", googleAuth);

// GET /api/auth/states — return all available states
router.get("/states", (req, res) => {
  res.json({
    success: true,
    message: "Available states",
    data: INDIAN_STATES,
  });
});

module.exports = router;
