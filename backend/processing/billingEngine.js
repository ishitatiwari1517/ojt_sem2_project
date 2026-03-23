const UsageRecord = require("../models/UsageRecord");
const TariffSlab = require("../models/TariffSlab");
const Bill = require("../models/Bill");

/**
 * Calculate the electricity bill given total units and a tariff slab structure.
 *
 * @param {number} units - Total kWh units consumed
 * @param {Array}  slabs - Array of { minUnits, maxUnits, ratePerUnit }
 * @param {number} fixedCharges - Monthly fixed charges
 * @returns {{ slabBreakdown, totalCost, fixedCharges, grandTotal }}
 */
const calculateBill = (units, slabs, fixedCharges = 0) => {
  let remaining = units;
  let totalCost = 0;
  const slabBreakdown = [];

  for (const slab of slabs) {
    if (remaining <= 0) break;

    const slabMax = slab.maxUnits !== null ? slab.maxUnits : Infinity;
    const slabRange = slabMax - slab.minUnits;
    const unitsInSlab = Math.min(remaining, slabRange);

    if (unitsInSlab <= 0) continue;

    const slabCost = parseFloat((unitsInSlab * slab.ratePerUnit).toFixed(2));
    totalCost += slabCost;
    remaining -= unitsInSlab;

    slabBreakdown.push({
      minUnits: slab.minUnits,
      maxUnits: slab.maxUnits,
      ratePerUnit: slab.ratePerUnit,
      unitsConsumed: parseFloat(unitsInSlab.toFixed(2)),
      slabCost,
    });
  }

  totalCost = parseFloat(totalCost.toFixed(2));
  const grandTotal = parseFloat((totalCost + fixedCharges).toFixed(2));

  return { slabBreakdown, totalCost, fixedCharges, grandTotal };
};

/**
 * Get total units consumed within a date range from UsageRecord.
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {number} total units
 */
const getTotalUnitsInRange = async (startDate, endDate) => {
  const result = await UsageRecord.aggregate([
    { $match: { date: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
    { $group: { _id: null, totalUnits: { $sum: "$units" } } },
  ]);
  return result[0]?.totalUnits || 0;
};

/**
 * Get the default tariff slab, or first available.
 */
const getDefaultTariff = async () => {
  let tariff = await TariffSlab.findOne({ isDefault: true });
  if (!tariff) tariff = await TariffSlab.findOne();
  return tariff;
};

/**
 * Seed default tariff slabs if none exist.
 * Called once on server startup.
 */
const seedDefaultTariffs = async () => {
  const count = await TariffSlab.countDocuments();
  if (count > 0) return;

  await TariffSlab.insertMany([
    {
      name: "Default Indian Residential Tariff",
      state: "General",
      isDefault: true,
      fixedCharges: 50,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.5, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 5.0, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.5, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 8.0, description: "Above 500 units" },
      ],
    },
    {
      name: "Flat Rate ₹8/unit",
      state: "General",
      isDefault: false,
      fixedCharges: 0,
      slabs: [
        { minUnits: 0, maxUnits: null, ratePerUnit: 8.0, description: "Flat rate" },
      ],
    },
  ]);
};

module.exports = { calculateBill, getTotalUnitsInRange, getDefaultTariff, seedDefaultTariffs };
