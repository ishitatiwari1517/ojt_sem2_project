const { getAlerts } = require("../processing/alertsEngine");
const Alert = require("../models/Alert");
const Warranty = require("../models/Warranty");
const asyncHandler = require("../utils/asyncHandler");

// Helper: days between two dates
const daysDiff = (from, to) =>
  Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));

// GET /api/alerts
const getAllAlerts = asyncHandler(async (req, res) => {
  // Fetch dynamic alerts from engine
  const engineAlerts = await getAlerts();

  // Fetch persisted alerts from DB (unresolved)
  const dbAlerts = await Alert.find({ resolved: false }).sort({ createdAt: -1 }).limit(50);

  // Generate Warranty alerts dynamically
  const warranties = await Warranty.find();
  const now = new Date();
  const warrantyAlerts = [];
  
  warranties.forEach((w) => {
    const daysToEnd = daysDiff(now, w.warrantyEndDate);
    if (daysToEnd < 0) {
      warrantyAlerts.push({ applianceName: w.applianceName, type: "warranty_expired", message: `⚠️ Warranty for ${w.applianceName} expired ${Math.abs(daysToEnd)} days ago`, severity: "high" });
    } else if (daysToEnd <= 30) {
      warrantyAlerts.push({ applianceName: w.applianceName, type: "warranty_expiring", message: `🔔 Warranty for ${w.applianceName} expires in ${daysToEnd} day${daysToEnd === 1 ? "" : "s"}`, severity: daysToEnd <= 7 ? "high" : "medium" });
    }

    if (w.nextServiceDate) {
      const daysToService = daysDiff(now, w.nextServiceDate);
      if (daysToService < 0) {
        warrantyAlerts.push({ applianceName: w.applianceName, type: "service_overdue", message: `🔧 Service overdue for ${w.applianceName} by ${Math.abs(daysToService)} days`, severity: "high" });
      } else if (daysToService <= 14) {
        warrantyAlerts.push({ applianceName: w.applianceName, type: "service_due", message: `🔧 Service due for ${w.applianceName} in ${daysToService} day${daysToService === 1 ? "" : "s"}`, severity: "medium" });
      }
    }
  });

  const allActiveAlerts = [...engineAlerts, ...warrantyAlerts];

  res.json({
    success: true,
    message:
      (allActiveAlerts.length + dbAlerts.length) === 0
        ? "No alerts detected"
        : `${allActiveAlerts.length + dbAlerts.length} alert(s) found`,
    data: {
      activeAlerts: allActiveAlerts,
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
