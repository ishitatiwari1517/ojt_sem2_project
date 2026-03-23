const express = require("express");
const router = express.Router();
const { getPlans, upgradeToPremium, downgradeToFree } = require("../controllers/subscriptionController");
const { protect } = require("../middleware/auth");

router.get("/plans", protect, getPlans);
router.put("/upgrade", protect, upgradeToPremium);
router.put("/downgrade", protect, downgradeToFree);

module.exports = router;
