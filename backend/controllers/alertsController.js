const { getAlerts } = require("../processing/alertsEngine");
const Alert = require("../models/Alert");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/alerts
const getAllAlerts = asyncHandler(async (req, res) => {
  // Fetch dynamic alerts from engine
  const engineAlerts = await getAlerts();

  // Fetch persisted alerts from DB (unresolved)
  const dbAlerts = await Alert.find({ resolved: false }).sort({ createdAt: -1 }).limit(50);

  res.json({
    success: true,
    message:
      (engineAlerts.length + dbAlerts.length) === 0
        ? "No alerts detected"
        : `${engineAlerts.length + dbAlerts.length} alert(s) found`,
    data: {
      activeAlerts: engineAlerts,
      savedAlerts: dbAlerts,
    },
  });
});

// PUT /api/alerts/:id/resolve
const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { resolved: true, resolvedAt: new Date() },
    { new: true }
  );
  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }
  res.json({ success: true, message: "Alert resolved", data: alert });
});

// POST /api/alerts - create a custom alert
const createAlert = asyncHandler(async (req, res) => {
  const { type, severity, message, applianceName, value, threshold } = req.body;
  if (!message) {
    res.status(400);
    throw new Error("Alert message is required.");
  }
  const alert = await Alert.create({
    type: type || "custom",
    severity: severity || "medium",
    message,
    applianceName,
    value,
    threshold,
    userId: req.user?._id,
  });
  res.status(201).json({ success: true, message: "Alert created", data: alert });
});

module.exports = { getAllAlerts, resolveAlert, createAlert };
