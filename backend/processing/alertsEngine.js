const UsageRecord = require("../models/UsageRecord");
const Alert = require("../models/Alert");
const { subDays, startOfMonth, endOfMonth } = require("date-fns");

const MONTHLY_THRESHOLD_UNITS = 300; // alert if monthly usage exceeds this
const SPIKE_MULTIPLIER = 2.0; // alert if daily reading is 2x avg

/**
 * Run threshold-based alert detection and persist new alerts
 */
const runAlertCheck = async () => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Monthly threshold check
  const monthlyAgg = await UsageRecord.aggregate([
    { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: null, totalUnits: { $sum: "$units" } } },
  ]);

  const monthlyUnits = monthlyAgg[0]?.totalUnits || 0;

  if (monthlyUnits > MONTHLY_THRESHOLD_UNITS) {
    const existing = await Alert.findOne({
      type: "threshold_exceeded",
      date: { $gte: monthStart },
    });
    if (!existing) {
      await Alert.create({
        type: "threshold_exceeded",
        message: `⚠️ Monthly usage of ${monthlyUnits.toFixed(1)} kWh exceeds threshold of ${MONTHLY_THRESHOLD_UNITS} kWh`,
        threshold: MONTHLY_THRESHOLD_UNITS,
        actualValue: monthlyUnits,
        severity: monthlyUnits > MONTHLY_THRESHOLD_UNITS * 1.5 ? "high" : "medium",
      });
    }
  }

  // Spike detection - compare last 3 days vs previous 30-day avg
  const last3Days = subDays(now, 3);
  const prev30Days = subDays(now, 33);

  const recentAgg = await UsageRecord.aggregate([
    { $match: { date: { $gte: last3Days } } },
    { $group: { _id: null, avg: { $avg: "$units" } } },
  ]);
  const historicalAgg = await UsageRecord.aggregate([
    { $match: { date: { $gte: prev30Days, $lt: last3Days } } },
    { $group: { _id: null, avg: { $avg: "$units" } } },
  ]);

  const recentAvg = recentAgg[0]?.avg || 0;
  const historicalAvg = historicalAgg[0]?.avg || 0;

  if (historicalAvg > 0 && recentAvg > historicalAvg * SPIKE_MULTIPLIER) {
    const existing = await Alert.findOne({
      type: "spike_detected",
      date: { $gte: last3Days },
    });
    if (!existing) {
      await Alert.create({
        type: "spike_detected",
        message: `🔺 Usage spike detected! Recent avg ${recentAvg.toFixed(1)} kWh vs historical ${historicalAvg.toFixed(1)} kWh per record`,
        threshold: historicalAvg * SPIKE_MULTIPLIER,
        actualValue: recentAvg,
        severity: "high",
      });
    }
  }
};

/**
 * Get all active alerts
 */
const getAlerts = async () => {
  await runAlertCheck();
  return await Alert.find().sort({ createdAt: -1 }).limit(20);
};

module.exports = { getAlerts, runAlertCheck };
