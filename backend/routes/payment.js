const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment, getConfig } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.get("/config", protect, getConfig);
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

module.exports = router;
