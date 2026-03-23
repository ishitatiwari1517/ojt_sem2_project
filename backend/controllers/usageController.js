const UsageRecord = require("../models/UsageRecord");
const { validateUsage } = require("../processing/validationEngine");
const { parseAndStoreCSV } = require("../processing/csvParser");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/usage - Add a manual usage record
const addUsage = asyncHandler(async (req, res) => {
  const { error, value } = validateUsage(req.body);
  if (error) {
    res.status(400);
    throw new Error(
      `Validation failed: ${error.details.map((d) => d.message).join(", ")}`
    );
  }
  const record = new UsageRecord(value);
  await record.save();
  res.status(201).json({
    success: true,
    message: "Usage record added successfully",
    data: record,
  });
});

// GET /api/usage - Retrieve usage records with optional filters + pagination
const getUsage = asyncHandler(async (req, res) => {
  const { appliance, startDate, endDate, category, limit = 50, page = 1 } = req.query;
  const filter = {};

  if (appliance) filter.applianceName = { $regex: appliance, $options: "i" };
  if (category) filter.category = { $regex: category, $options: "i" };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await UsageRecord.countDocuments(filter);
  const records = await UsageRecord.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    message: records.length === 0 ? "No records found" : "Usage records retrieved",
    data: records,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/usage/:id - Get a single usage record by ID
const getUsageById = asyncHandler(async (req, res) => {
  const record = await UsageRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Usage record not found.");
  }
  res.json({ success: true, message: "Usage record retrieved", data: record });
});

// PUT /api/usage/:id - Update a usage record
const updateUsage = asyncHandler(async (req, res) => {
  const { applianceName, date, units, durationHours, costPerUnit, category } = req.body;

  const record = await UsageRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Usage record not found.");
  }

  // Update fields
  if (applianceName !== undefined) record.applianceName = applianceName;
  if (date !== undefined) record.date = new Date(date);
  if (units !== undefined) record.units = parseFloat(units);
  if (durationHours !== undefined) record.durationHours = parseFloat(durationHours);
  if (costPerUnit !== undefined) record.costPerUnit = parseFloat(costPerUnit);
  if (category !== undefined) record.category = category;

  // Recalculate total cost
  record.totalCost = record.units * record.costPerUnit;

  await record.save();
  res.json({ success: true, message: "Usage record updated", data: record });
});

// POST /api/usage/upload-csv - Upload and process a CSV file
const uploadCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No CSV file uploaded. Please attach a .csv file.");
  }
  const result = await parseAndStoreCSV(req.file.path);
  res.json({
    success: true,
    message: `CSV processed: ${result.inserted} inserted, ${result.failed} failed`,
    data: result,
  });
});

// DELETE /api/usage/:id - Delete a usage record
const deleteUsage = asyncHandler(async (req, res) => {
  const record = await UsageRecord.findByIdAndDelete(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Record not found");
  }
  res.json({ success: true, message: "Record deleted", data: record });
});

module.exports = { addUsage, getUsage, getUsageById, updateUsage, uploadCSV, deleteUsage };
