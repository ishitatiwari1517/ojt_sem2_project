const UsageRecord = require("../models/UsageRecord");
const { subDays } = require("date-fns");

const COST_PER_UNIT = 8; // ₹8/unit default

/**
 * Predict next month's usage using moving average of last N days
 * @param {number} days - number of past days to average over
 */
const predictNextMonth = async (days = 90) => {
  const since = subDays(new Date(), days);

  const records = await UsageRecord.find({ date: { $gte: since } });

  if (records.length === 0) {
    return {
      predictedUnits: 0,
      predictedCost: 0,
      confidence: "low",
      basedOnDays: 0,
      message: "Not enough data to generate prediction. Please add usage records.",
    };
  }

  // Daily buckets
  const dailyMap = {};
  records.forEach((r) => {
    const key = r.date.toISOString().split("T")[0];
    dailyMap[key] = (dailyMap[key] || 0) + r.units;
  });

  const dailyValues = Object.values(dailyMap);
  const avgDailyUnits = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
  const predictedUnits = parseFloat((avgDailyUnits * 30).toFixed(2));

  // Get avg cost per unit from records
  const avgCostPerUnit =
    records.reduce((acc, r) => acc + (r.costPerUnit || COST_PER_UNIT), 0) / records.length;
  const predictedCost = parseFloat((predictedUnits * avgCostPerUnit).toFixed(2));

  const confidence =
    dailyValues.length >= 60 ? "high" : dailyValues.length >= 30 ? "medium" : "low";

  return {
    predictedUnits,
    predictedCost,
    avgDailyUnits: parseFloat(avgDailyUnits.toFixed(2)),
    confidence,
    basedOnDays: dailyValues.length,
    message: `Prediction based on ${dailyValues.length} days of data (${days}-day window)`,
  };
};

module.exports = { predictNextMonth };
