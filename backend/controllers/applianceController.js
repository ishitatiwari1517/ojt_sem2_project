const asyncHandler = require("../utils/asyncHandler");
const Appliance = require("../models/Appliance");

// GET /api/appliances
const getAppliances = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.active !== undefined)
    filter.isActive = req.query.active === "true";

  const appliances = await Appliance.find(filter).sort({ name: 1 });
  res.json({
    success: true,
    message: appliances.length === 0 ? "No appliances found" : "Appliances retrieved",
    data: appliances,
  });
});

// POST /api/appliances
const addAppliance = asyncHandler(async (req, res) => {
  const { name, category, wattage, avgDailyHours, householdId, notes } = req.body;
  const appliance = await Appliance.create({
    name,
    category,
    wattage,
    avgDailyHours,
    householdId,
    notes,
  });
  res.status(201).json({
    success: true,
    message: "Appliance added successfully",
    data: appliance,
  });
});

// PUT /api/appliances/:id
const updateAppliance = asyncHandler(async (req, res) => {
  const appliance = await Appliance.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!appliance) {
    res.status(404);
    throw new Error("Appliance not found");
  }
  res.json({ success: true, message: "Appliance updated", data: appliance });
});

// DELETE /api/appliances/:id
const deleteAppliance = asyncHandler(async (req, res) => {
  const appliance = await Appliance.findByIdAndDelete(req.params.id);
  if (!appliance) {
    res.status(404);
    throw new Error("Appliance not found");
  }
  res.json({ success: true, message: "Appliance deleted", data: appliance });
});

module.exports = { getAppliances, addAppliance, updateAppliance, deleteAppliance };
