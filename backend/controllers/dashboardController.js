const {
  getApplianceBreakdown,
  getMonthlyTrend,
  getTotals,
} = require("../processing/analysisEngine");
const asyncHandler = require("../utils/asyncHandler");
const UsageRecord = require("../models/UsageRecord");
const {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
} = require("date-fns");

// GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [totals, monthlyTrend, applianceBreakdown, thisMonth, lastMonth, todayData, hourlyData] =
    await Promise.all([
      getTotals(),
      getMonthlyTrend(),
      getApplianceBreakdown(),

      // This month aggregation
      UsageRecord.aggregate([
        { $match: { date: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: "$units" },
            totalCost: { $sum: "$totalCost" },
          },
        },
      ]),

      // Last month aggregation
      UsageRecord.aggregate([
        { $match: { date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: "$units" },
            totalCost: { $sum: "$totalCost" },
          },
        },
      ]),

      // Today's usage
      UsageRecord.aggregate([
        { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: "$units" },
            totalCost: { $sum: "$totalCost" },
          },
        },
      ]),

      // Hourly distribution (using durationHours as proxy for usage time)
      // Group by hour of createdAt to find peak logging/usage hours
      UsageRecord.aggregate([
        {
          $group: {
            _id: { $hour: "$date" },
            totalUnits: { $sum: "$units" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalUnits: -1 } },
      ]),
    ]);

  // Peak hour calculation
  const peakHourData = hourlyData[0] || null;
  let peakHour = null;
  if (peakHourData) {
    const h = peakHourData._id;
    const suffix = h >= 12 ? "PM" : "AM";
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    peakHour = `${displayH}:00 ${suffix}`;
  }

  // Month-over-month change
  const thisMonthUnits = thisMonth[0]?.totalUnits || 0;
  const lastMonthUnits = lastMonth[0]?.totalUnits || 0;
  const momChange =
    lastMonthUnits > 0
      ? parseFloat(
          (((thisMonthUnits - lastMonthUnits) / lastMonthUnits) * 100).toFixed(1)
        )
      : null;

  // Top appliance
  const topAppliance = applianceBreakdown[0]?.applianceName || null;

  // Average daily units (based on days with data in last 90 days)
  const daysWithData = monthlyTrend.length > 0 ? Math.min(monthlyTrend.length * 30, 90) : 1;
  const avgDailyUnits =
    totals.totalUnits > 0
      ? parseFloat((totals.totalUnits / Math.max(daysWithData, 1)).toFixed(2))
      : 0;

  res.json({
    success: true,
    message: "Dashboard data retrieved",
    data: {
      // Core totals
      totalUnits: totals.totalUnits || 0,
      totalCost: totals.totalCost || 0,
      recordCount: totals.recordCount || 0,

      // Enhanced stats
      thisMonthUnits: parseFloat((thisMonthUnits).toFixed(2)),
      thisMonthCost: parseFloat((thisMonth[0]?.totalCost || 0).toFixed(2)),
      lastMonthUnits: parseFloat((lastMonthUnits).toFixed(2)),
      momChange, // % change month-over-month, null if no last-month data
      todayUnits: parseFloat((todayData[0]?.totalUnits || 0).toFixed(2)),
      todayCost: parseFloat((todayData[0]?.totalCost || 0).toFixed(2)),
      peakHour,
      topAppliance,
      avgDailyUnits,

      // Charts
      monthlyTrend,
      applianceBreakdown,
    },
  });
});

module.exports = { getDashboard };
