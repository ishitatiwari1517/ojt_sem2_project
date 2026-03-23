const express = require("express");
const router = express.Router();
const { getAllAlerts, resolveAlert, createAlert } = require("../controllers/alertsController");
const { protect } = require("../middleware/auth");

router.get("/", getAllAlerts);
router.post("/", protect, createAlert);
router.put("/:id/resolve", protect, resolveAlert);

module.exports = router;
