const asyncHandler = require("../utils/asyncHandler");
const { getSeasonalAnalysis } = require("../processing/seasonalEngine");
const { getApplianceBreakdown } = require("../processing/analysisEngine");
const UsageRecord = require("../models/UsageRecord");

// GET /api/analysis/appliance
const getApplianceAnalysis = asyncHandler(async (req, res) => {
  const breakdown = await getApplianceBreakdown();
  res.json({
    success: true,
    message: breakdown.length === 0 ? "No appliance data found" : "Appliance analysis retrieved",
    data: breakdown,
  });
});

// GET /api/analysis/seasonal
const getSeasonalData = asyncHandler(async (req, res) => {
  const data = await getSeasonalAnalysis();
  res.json({
    success: true,
    message: data.seasons.length === 0 ? "No seasonal data found" : "Seasonal analysis retrieved",
    data,
  });
});

// GET /api/analysis/summary — financial + usage summary
const getAnalysisSummary = asyncHandler(async (req, res) => {
  const [totals, topAppliance, recent] = await Promise.all([
    UsageRecord.aggregate([
      {
        $group: {
          _id: null,
          totalUnits: { $sum: "$units" },
          totalCost: { $sum: "$totalCost" },
          recordCount: { $sum: 1 },
        },
      },
    ]),
    UsageRecord.aggregate([
      { $group: { _id: "$applianceName", totalUnits: { $sum: "$units" } } },
      { $sort: { totalUnits: -1 } },
      { $limit: 1 },
    ]),
    UsageRecord.find().sort({ date: -1 }).limit(5).lean(),
  ]);

  const summary = totals[0] || { totalUnits: 0, totalCost: 0, recordCount: 0 };
  const avgDailyUnits = summary.recordCount > 0
    ? parseFloat((summary.totalUnits / 90).toFixed(2))
    : 0;

  res.json({
    success: true,
    message: "Analysis summary retrieved",
    data: {
      totalUnits: parseFloat(summary.totalUnits.toFixed(2)),
      totalCost: parseFloat(summary.totalCost.toFixed(2)),
      recordCount: summary.recordCount,
      avgDailyUnits,
      topAppliance: topAppliance[0]?._id || null,
      recentRecords: recent,
    },
  });
});

module.exports = { getApplianceAnalysis, getSeasonalData, getAnalysisSummary };
