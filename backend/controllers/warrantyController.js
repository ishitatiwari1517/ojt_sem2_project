const asyncHandler = require("../utils/asyncHandler");
const Warranty = require("../models/Warranty");

// Helper: days between two dates
const daysDiff = (from, to) =>
  Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));

// GET /api/warranty — list all warranty records with status
const getWarranties = asyncHandler(async (req, res) => {
  const warranties = await Warranty.find().sort({ warrantyEndDate: 1 });

  // Enrich with alert info
  const now = new Date();
  const enriched = warranties.map((w) => {
    const obj = w.toJSON();
    obj.daysToWarrantyEnd = daysDiff(now, w.warrantyEndDate);
    obj.daysToNextService = w.nextServiceDate
      ? daysDiff(now, w.nextServiceDate)
      : null;
    return obj;
  });

  res.json({
    success: true,
    message: warranties.length === 0 ? "No warranty records found" : "Warranties retrieved",
    data: enriched,
  });
});

// POST /api/warranty — add a new warranty record
const addWarranty = asyncHandler(async (req, res) => {
  const {
    applianceName, brand, modelNumber, purchaseDate, warrantyEndDate,
    lastServiceDate, serviceIntervalMonths, notes, purchasePrice,
  } = req.body;

  if (!applianceName || !purchaseDate || !warrantyEndDate) {
    res.status(400);
    throw new Error("Appliance name, purchase date, and warranty end date are required.");
  }

  // Auto-calculate next service date if last service given
  let nextServiceDate = null;
  if (lastServiceDate && serviceIntervalMonths) {
    const d = new Date(lastServiceDate);
    d.setMonth(d.getMonth() + Number(serviceIntervalMonths));
    nextServiceDate = d;
  }

  const warranty = await Warranty.create({
    applianceName,
    brand,
    modelNumber,
    purchaseDate: new Date(purchaseDate),
    warrantyEndDate: new Date(warrantyEndDate),
    lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
    nextServiceDate,
    serviceIntervalMonths: serviceIntervalMonths || 6,
    notes,
    purchasePrice,
  });

  res.status(201).json({
    success: true,
    message: "Warranty record added successfully",
    data: warranty.toJSON(),
  });
});

// PUT /api/warranty/:id — update a warranty record
const updateWarranty = asyncHandler(async (req, res) => {
  const warranty = await Warranty.findById(req.params.id);
  if (!warranty) {
    res.status(404);
    throw new Error("Warranty record not found.");
  }

  const fields = [
    "applianceName", "brand", "modelNumber", "purchaseDate", "warrantyEndDate",
    "lastServiceDate", "serviceIntervalMonths", "notes", "purchasePrice",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) warranty[f] = req.body[f];
  });

  // Recalculate next service date
  if (warranty.lastServiceDate && warranty.serviceIntervalMonths) {
    const d = new Date(warranty.lastServiceDate);
    d.setMonth(d.getMonth() + Number(warranty.serviceIntervalMonths));
    warranty.nextServiceDate = d;
  }

  await warranty.save();
  res.json({ success: true, message: "Warranty updated", data: warranty.toJSON() });
});

// DELETE /api/warranty/:id
const deleteWarranty = asyncHandler(async (req, res) => {
  const warranty = await Warranty.findByIdAndDelete(req.params.id);
  if (!warranty) {
    res.status(404);
    throw new Error("Warranty record not found.");
  }
  res.json({ success: true, message: "Warranty record deleted", data: warranty });
});

// POST /api/warranty/:id/repair — log a repair entry
const addRepair = asyncHandler(async (req, res) => {
  const { date, description, cost, servicedBy } = req.body;
  if (!date || !description) {
    res.status(400);
    throw new Error("Date and description are required for a repair log.");
  }

  const warranty = await Warranty.findById(req.params.id);
  if (!warranty) {
    res.status(404);
    throw new Error("Warranty record not found.");
  }

  warranty.repairHistory.push({ date: new Date(date), description, cost: cost || 0, servicedBy: servicedBy || "" });

  // Update last service date and recalculate next
  warranty.lastServiceDate = new Date(date);
  const d = new Date(date);
  d.setMonth(d.getMonth() + Number(warranty.serviceIntervalMonths));
  warranty.nextServiceDate = d;

  await warranty.save();
  res.json({ success: true, message: "Repair log added", data: warranty.toJSON() });
});

// GET /api/warranty/alerts — get all items with warnings
const getWarrantyAlerts = asyncHandler(async (req, res) => {
  const all = await Warranty.find();
  const now = new Date();
  const alerts = [];

  all.forEach((w) => {
    const daysToEnd = daysDiff(now, w.warrantyEndDate);
    if (daysToEnd < 0) {
      alerts.push({ id: w._id, applianceName: w.applianceName, type: "warranty_expired", message: `⚠️ Warranty for ${w.applianceName} expired ${Math.abs(daysToEnd)} days ago`, severity: "high" });
    } else if (daysToEnd <= 30) {
      alerts.push({ id: w._id, applianceName: w.applianceName, type: "warranty_expiring", message: `🔔 Warranty for ${w.applianceName} expires in ${daysToEnd} day${daysToEnd === 1 ? "" : "s"}`, severity: daysToEnd <= 7 ? "high" : "medium" });
    }

    if (w.nextServiceDate) {
      const daysToService = daysDiff(now, w.nextServiceDate);
      if (daysToService < 0) {
        alerts.push({ id: w._id, applianceName: w.applianceName, type: "service_overdue", message: `🔧 Service overdue for ${w.applianceName} by ${Math.abs(daysToService)} days`, severity: "high" });
      } else if (daysToService <= 14) {
        alerts.push({ id: w._id, applianceName: w.applianceName, type: "service_due", message: `🔧 Service due for ${w.applianceName} in ${daysToService} day${daysToService === 1 ? "" : "s"}`, severity: "medium" });
      }
    }
  });

  res.json({ success: true, message: `${alerts.length} warranty alerts`, data: alerts });
});

module.exports = { getWarranties, addWarranty, updateWarranty, deleteWarranty, addRepair, getWarrantyAlerts };
