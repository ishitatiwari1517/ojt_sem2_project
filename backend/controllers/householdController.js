const asyncHandler = require("../utils/asyncHandler");
const Household = require("../models/Household");

// GET /api/household — get user's household
const getHousehold = asyncHandler(async (req, res) => {
  const household = await Household.findOne({ userId: req.user._id });
  if (!household) {
    return res.status(404).json({
      success: false,
      message: "No household found. Please create one.",
    });
  }
  res.json({ success: true, message: "Household retrieved", data: household });
});

// POST /api/household — create or upsert household
const upsertHousehold = asyncHandler(async (req, res) => {
  const { name, location, monthlyBudget, members } = req.body;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error("Household name is required.");
  }

  const household = await Household.findOneAndUpdate(
    { userId: req.user._id },
    { name, location, monthlyBudget, members, userId: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(201).json({
    success: true,
    message: "Household saved successfully",
    data: household,
  });
});

// PUT /api/household/:id — update a specific household by ID
const updateHousehold = asyncHandler(async (req, res) => {
  const { name, location, monthlyBudget, members } = req.body;

  const household = await Household.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { name, location, monthlyBudget, members },
    { new: true, runValidators: true }
  );

  if (!household) {
    res.status(404);
    throw new Error("Household not found or not authorized.");
  }

  res.json({ success: true, message: "Household updated", data: household });
});

// DELETE /api/household/:id — delete a specific household by ID
const deleteHousehold = asyncHandler(async (req, res) => {
  const household = await Household.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!household) {
    res.status(404);
    throw new Error("Household not found or not authorized.");
  }

  res.json({ success: true, message: "Household deleted", data: household });
});

module.exports = { getHousehold, upsertHousehold, updateHousehold, deleteHousehold };
