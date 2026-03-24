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
 * Get tariff slab for a specific state, or default if not found.
 * @param {string} state - User's state
 */
const getTariffByState = async (state) => {
  let tariff = await TariffSlab.findOne({ state: state });
  if (!tariff) {
    // Fallback to default if state-specific tariff not found
    tariff = await TariffSlab.findOne({ isDefault: true });
  }
  return tariff;
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

  const stateTariffs = [
    {
      name: "Andhra Pradesh Residential",
      state: "Andhra Pradesh",
      isDefault: false,
      fixedCharges: 45,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.85, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.35, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.95, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.65, description: "Above 500 units" },
      ],
    },
    {
      name: "Maharashtra Residential",
      state: "Maharashtra",
      isDefault: false,
      fixedCharges: 55,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.0, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.8, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.2, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 8.2, description: "Above 500 units" },
      ],
    },
    {
      name: "Tamil Nadu Residential",
      state: "Tamil Nadu",
      isDefault: false,
      fixedCharges: 50,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.75, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.25, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.8, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.5, description: "Above 500 units" },
      ],
    },
    {
      name: "Karnataka Residential",
      state: "Karnataka",
      isDefault: false,
      fixedCharges: 48,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.15, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.65, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.15, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.85, description: "Above 500 units" },
      ],
    },
    {
      name: "Gujarat Residential",
      state: "Gujarat",
      isDefault: false,
      fixedCharges: 52,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.95, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.55, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.05, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.75, description: "Above 500 units" },
      ],
    },
    {
      name: "Telangana Residential",
      state: "Telangana",
      isDefault: false,
      fixedCharges: 43,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.7, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.1, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.7, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.4, description: "Above 500 units" },
      ],
    },
    {
      name: "Uttar Pradesh Residential",
      state: "Uttar Pradesh",
      isDefault: false,
      fixedCharges: 50,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.1, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.6, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.1, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.8, description: "Above 500 units" },
      ],
    },
    {
      name: "Delhi Residential",
      state: "Delhi",
      isDefault: false,
      fixedCharges: 60,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 4.0, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 5.5, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 7.0, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 8.5, description: "Above 500 units" },
      ],
    },
    {
      name: "Punjab Residential",
      state: "Punjab",
      isDefault: false,
      fixedCharges: 48,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.05, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.55, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.05, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.75, description: "Above 500 units" },
      ],
    },
    {
      name: "Haryana Residential",
      state: "Haryana",
      isDefault: false,
      fixedCharges: 54,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.2, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.7, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.2, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.9, description: "Above 500 units" },
      ],
    },
    {
      name: "Rajasthan Residential",
      state: "Rajasthan",
      isDefault: false,
      fixedCharges: 46,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.9, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.4, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.9, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.6, description: "Above 500 units" },
      ],
    },
    {
      name: "Kerala Residential",
      state: "Kerala",
      isDefault: false,
      fixedCharges: 58,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.3, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.9, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.4, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 8.1, description: "Above 500 units" },
      ],
    },
    {
      name: "West Bengal Residential",
      state: "West Bengal",
      isDefault: false,
      fixedCharges: 51,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.05, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.5, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.0, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.7, description: "Above 500 units" },
      ],
    },
    {
      name: "Madhya Pradesh Residential",
      state: "Madhya Pradesh",
      isDefault: false,
      fixedCharges: 47,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.85, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.35, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.85, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.55, description: "Above 500 units" },
      ],
    },
    {
      name: "Jharkhand Residential",
      state: "Jharkhand",
      isDefault: false,
      fixedCharges: 49,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.95, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.4, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.9, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.6, description: "Above 500 units" },
      ],
    },
    {
      name: "Chhattisgarh Residential",
      state: "Chhattisgarh",
      isDefault: false,
      fixedCharges: 44,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.75, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.15, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.65, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.35, description: "Above 500 units" },
      ],
    },
    {
      name: "Bihar Residential",
      state: "Bihar",
      isDefault: false,
      fixedCharges: 50,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.9, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.3, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.8, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.5, description: "Above 500 units" },
      ],
    },
    {
      name: "Odisha Residential",
      state: "Odisha",
      isDefault: false,
      fixedCharges: 46,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.8, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.2, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.7, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.4, description: "Above 500 units" },
      ],
    },
    {
      name: "Assam Residential",
      state: "Assam",
      isDefault: false,
      fixedCharges: 48,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.75, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.15, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.65, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.35, description: "Above 500 units" },
      ],
    },
    {
      name: "Himachal Pradesh Residential",
      state: "Himachal Pradesh",
      isDefault: false,
      fixedCharges: 52,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.85, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.25, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.75, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.45, description: "Above 500 units" },
      ],
    },
    {
      name: "Goa Residential",
      state: "Goa",
      isDefault: false,
      fixedCharges: 56,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.25, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.75, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.25, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.95, description: "Above 500 units" },
      ],
    },
    {
      name: "Uttarakhand Residential",
      state: "Uttarakhand",
      isDefault: false,
      fixedCharges: 53,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.1, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.6, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.1, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.8, description: "Above 500 units" },
      ],
    },
    {
      name: "Puducherry Residential",
      state: "Puducherry",
      isDefault: false,
      fixedCharges: 50,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.0, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.5, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.0, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.7, description: "Above 500 units" },
      ],
    },
    {
      name: "Chandigarh Residential",
      state: "Chandigarh",
      isDefault: false,
      fixedCharges: 55,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.25, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.75, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.25, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.95, description: "Above 500 units" },
      ],
    },
    {
      name: "Arunachal Pradesh Residential",
      state: "Arunachal Pradesh",
      isDefault: false,
      fixedCharges: 45,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.7, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.1, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.6, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.3, description: "Above 500 units" },
      ],
    },
    {
      name: "Manipur Residential",
      state: "Manipur",
      isDefault: false,
      fixedCharges: 42,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.65, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.05, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.55, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.25, description: "Above 500 units" },
      ],
    },
    {
      name: "Meghalaya Residential",
      state: "Meghalaya",
      isDefault: false,
      fixedCharges: 44,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.7, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.1, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.6, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.3, description: "Above 500 units" },
      ],
    },
    {
      name: "Mizoram Residential",
      state: "Mizoram",
      isDefault: false,
      fixedCharges: 43,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.68, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.08, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.58, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.28, description: "Above 500 units" },
      ],
    },
    {
      name: "Nagaland Residential",
      state: "Nagaland",
      isDefault: false,
      fixedCharges: 45,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.72, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.12, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.62, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.32, description: "Above 500 units" },
      ],
    },
    {
      name: "Sikkim Residential",
      state: "Sikkim",
      isDefault: false,
      fixedCharges: 50,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.9, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.3, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.8, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.5, description: "Above 500 units" },
      ],
    },
    {
      name: "Tripura Residential",
      state: "Tripura",
      isDefault: false,
      fixedCharges: 46,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.75, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.15, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.65, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.35, description: "Above 500 units" },
      ],
    },
    {
      name: "Andaman and Nicobar Islands Residential",
      state: "Andaman and Nicobar Islands",
      isDefault: false,
      fixedCharges: 60,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.5, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 5.0, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.5, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 8.0, description: "Above 500 units" },
      ],
    },
    {
      name: "Lakshadweep Residential",
      state: "Lakshadweep",
      isDefault: false,
      fixedCharges: 65,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 3.75, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 5.25, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 6.75, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 8.25, description: "Above 500 units" },
      ],
    },
    {
      name: "Dadra and Nagar Haveli and Daman and Diu Residential",
      state: "Dadra and Nagar Haveli and Daman and Diu",
      isDefault: false,
      fixedCharges: 48,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 2.95, description: "First 100 units" },
        { minUnits: 100, maxUnits: 200, ratePerUnit: 4.45, description: "101-200 units" },
        { minUnits: 200, maxUnits: 500, ratePerUnit: 5.95, description: "201-500 units" },
        { minUnits: 500, maxUnits: null, ratePerUnit: 7.65, description: "Above 500 units" },
      ],
    },
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
  ];

  await TariffSlab.insertMany(stateTariffs);
};

module.exports = { calculateBill, getTotalUnitsInRange, getDefaultTariff, getTariffByState, seedDefaultTariffs };
