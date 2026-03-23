const express = require("express");
const router = express.Router();
const {
  getPlans,
  createSubscriptionOrder,
  verifyAndUpgrade,
  upgradeToPremium,
  downgradeToFree,
} = require("../controllers/subscriptionController");
const { protect } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const Razorpay = require("razorpay");

// GET /api/subscription/check-razorpay — diagnostic endpoint to test key validity
router.get("/check-razorpay", protect, asyncHandler(async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const configured = !!(keyId && keySecret && !keyId.includes("YOUR_KEY"));

  if (!configured) {
    return res.json({ success: false, message: "Razorpay keys not set or still using placeholder values.", keyId: keyId ? keyId.substring(0, 12) + "..." : "MISSING" });
  }

  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    // Try creating a minimal order to verify keys work
    const order = await rzp.orders.create({ amount: 100, currency: "INR", receipt: "test_key_check" });
    // Immediately return success — we don't actually need this order
    return res.json({ success: true, message: "Razorpay keys are valid and working!", keyId: keyId.substring(0, 12) + "....", testOrderId: order.id });
  } catch (e) {
    const msg = e?.error?.description || e?.message || String(e);
    return res.json({ success: false, message: `Razorpay error: ${msg}`, keyId: keyId.substring(0, 12) + "...", statusCode: e?.statusCode });
  }
}));

router.get("/plans", protect, getPlans);
router.post("/create-order", protect, createSubscriptionOrder);
router.post("/verify-and-upgrade", protect, verifyAndUpgrade);
router.put("/upgrade", protect, upgradeToPremium);
router.put("/downgrade", protect, downgradeToFree);

module.exports = router;

