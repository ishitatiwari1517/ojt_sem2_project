const UsageRecord = require("../models/UsageRecord");
const { startOfMonth, subMonths } = require("date-fns");

/**
 * Aggregate total units + cost per appliance
 */
const getApplianceBreakdown = async () => {
  const result = await UsageRecord.aggregate([
    {
      $group: {
        _id: "$applianceName",
        totalUnits: { $sum: "$units" },
        totalCost: { $sum: "$totalCost" },
        recordCount: { $sum: 1 },
      },
    },
    { $sort: { totalUnits: -1 } },
    {
      $project: {
        _id: 0,
        applianceName: "$_id",
        totalUnits: { $round: ["$totalUnits", 2] },
        totalCost: { $round: ["$totalCost", 2] },
        recordCount: 1,
      },
    },
  ]);
  return result;
};

/**
 * Aggregate monthly usage + cost trend (last 6 months)
 */
const getMonthlyTrend = async () => {
  const sixMonthsAgo = subMonths(new Date(), 6);

  const result = await UsageRecord.aggregate([
    { $match: { date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        totalUnits: { $sum: "$units" },
        totalCost: { $sum: "$totalCost" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            {
              $arrayElemAt: [
                ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                "$_id.month",
              ],
            },
            " ",
            { $toString: "$_id.year" },
          ],
        },
        totalUnits: { $round: ["$totalUnits", 2] },
        totalCost: { $round: ["$totalCost", 2] },
      },
    },
  ]);
  return result;
};

/**
 * Get overall summary totals
 */
const getTotals = async () => {
  const result = await UsageRecord.aggregate([
    {
      $group: {
        _id: null,
        totalUnits: { $sum: "$units" },
        totalCost: { $sum: "$totalCost" },
        recordCount: { $sum: 1 },
      },
    },
  ]);
  return result[0] || { totalUnits: 0, totalCost: 0, recordCount: 0 };
};

module.exports = { getApplianceBreakdown, getMonthlyTrend, getTotals };
