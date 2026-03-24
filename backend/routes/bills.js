const express = require("express");
const router = express.Router();
const {
  getTariffs,
  calculateBillForRange,
  getBills,
  getBillById,
  deleteBill,
  reseedTariffs,
} = require("../controllers/billController");
const { protect } = require("../middleware/auth");
const { requirePremium } = require("../middleware/subscription");
const { validateBillInput } = require("../middleware/validation");

// Admin endpoint to reseed all tariffs (no auth required - can be called once to populate DB)
router.post("/admin/reseed-tariffs", reseedTariffs);

// Tariff list is accessible to all authenticated users
router.get("/tariffs", protect, getTariffs);

// Bill history and calculation are premium-only
router.get("/", protect, requirePremium, getBills);
router.post("/calculate", protect, requirePremium, validateBillInput, calculateBillForRange);
router.get("/:id", protect, requirePremium, getBillById);
router.delete("/:id", protect, requirePremium, deleteBill);

module.exports = router;
