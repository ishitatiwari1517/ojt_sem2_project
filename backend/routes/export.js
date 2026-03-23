const express = require("express");
const router = express.Router();
const { exportUsageCSV, exportBillsCSV } = require("../controllers/exportController");
const { protect } = require("../middleware/auth");

router.get("/usage", exportUsageCSV);
router.get("/bills", protect, exportBillsCSV);

module.exports = router;
