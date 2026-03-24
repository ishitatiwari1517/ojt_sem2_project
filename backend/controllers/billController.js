const asyncHandler = require("../utils/asyncHandler");
const Bill = require("../models/Bill");
const TariffSlab = require("../models/TariffSlab");
const {
  calculateBill,
  getTotalUnitsInRange,
  getDefaultTariff,
  getTariffByState,
  seedDefaultTariffs,
} = require("../processing/billingEngine");

// GET /api/bills/tariffs — list available tariff slabs
const getTariffs = asyncHandler(async (req, res) => {
  const tariffs = await TariffSlab.find().sort({ isDefault: -1, name: 1 });
  res.json({
    success: true,
    message: "Tariff slabs retrieved",
    data: tariffs,
  });
});

// POST /api/bills/calculate — calculate bill for a date range (PREMIUM)
const calculateBillForRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, tariffSlabId } = req.body;

  // Get tariff slab
  let tariff;
  if (tariffSlabId) {
    tariff = await TariffSlab.findById(tariffSlabId);
    if (!tariff) {
      res.status(404);
      throw new Error("Tariff slab not found.");
    }
  } else {
    // Use user's state to get tariff, fallback to default if state not set or no tariff for that state
    if (req.user.state) {
      tariff = await getTariffByState(req.user.state);
    } else {
      tariff = await getDefaultTariff();
    }
    if (!tariff) {
      res.status(404);
      throw new Error(
        "No tariff slabs configured. Please create one first."
      );
    }
  }

  // Aggregate units in range
  const totalUnits = await getTotalUnitsInRange(startDate, endDate);

  // Calculate bill
  const result = calculateBill(totalUnits, tariff.slabs, tariff.fixedCharges);

  // Save bill to DB
  const start = new Date(startDate);
  const bill = await Bill.create({
    userId: req.user._id,
    month: start.getMonth() + 1,
    year: start.getFullYear(),
    startDate: start,
    endDate: new Date(endDate),
    totalUnits,
    totalCost: result.totalCost,
    fixedCharges: result.fixedCharges,
    grandTotal: result.grandTotal,
    slabBreakdown: result.slabBreakdown,
    tariffSlabId: tariff._id,
    tariffName: tariff.name,
  });

  res.status(201).json({
    success: true,
    message: "Bill calculated and saved successfully",
    data: bill,
  });
});

// GET /api/bills — list saved bills for the user (PREMIUM)
const getBills = asyncHandler(async (req, res) => {
  const { year, month, limit = 12, page = 1 } = req.query;
  const filter = { userId: req.user._id };
  if (year) filter.year = parseInt(year);
  if (month) filter.month = parseInt(month);

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Bill.countDocuments(filter);
  const bills = await Bill.find(filter)
    .sort({ year: -1, month: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    message: bills.length === 0 ? "No bills found" : "Bills retrieved",
    data: bills,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/bills/:id — get specific bill
const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, userId: req.user._id });
  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }
  res.json({ success: true, message: "Bill retrieved", data: bill });
});

// DELETE /api/bills/:id
const deleteBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }
  res.json({ success: true, message: "Bill deleted", data: bill });
});

// POST /api/bills/admin/reseed-tariffs — Admin endpoint to reseed all state-wise tariffs
const reseedTariffs = asyncHandler(async (req, res) => {
  // Delete all existing tariffs
  await TariffSlab.deleteMany({});
  
  // Reseed all tariffs
  await seedDefaultTariffs();
  
  // Get count of seeded tariffs
  const count = await TariffSlab.countDocuments();
  
  res.json({
    success: true,
    message: `Successfully reseeded all tariff slabs. Total: ${count} tariffs`,
    data: { count },
  });
});

module.exports = { getTariffs, calculateBillForRange, getBills, getBillById, deleteBill, reseedTariffs };
