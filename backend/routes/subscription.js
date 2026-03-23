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

router.get("/plans", protect, getPlans);
router.post("/create-order", protect, createSubscriptionOrder);
router.post("/verify-and-upgrade", protect, verifyAndUpgrade);
router.put("/upgrade", protect, upgradeToPremium);
router.put("/downgrade", protect, downgradeToFree);

module.exports = router;
