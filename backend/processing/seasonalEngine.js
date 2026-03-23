const UsageRecord = require("../models/UsageRecord");

/**
 * Seasonal Analysis Engine
 * Groups electricity usage by season and returns insights.
 *
 * Seasons (India-centric):
 *  Summer  → March – June    (months 3-6)
 *  Monsoon → July – September (months 7-9)
 *  Autumn  → October – November (months 10-11)
 *  Winter  → December – February (months 12,1,2)
 */

const SEASON_MAP = {
  1: "Winter", 2: "Winter",
  3: "Summer", 4: "Summer", 5: "Summer", 6: "Summer",
  7: "Monsoon", 8: "Monsoon", 9: "Monsoon",
  10: "Autumn", 11: "Autumn",
  12: "Winter",
};

const SEASON_COLORS = {
  Summer: "#f97316",
  Monsoon: "#3b82f6",
  Autumn: "#a78bfa",
  Winter: "#06b6d4",
};

const getSeasonalAnalysis = async () => {
  const result = await UsageRecord.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        totalUnits: { $sum: "$units" },
        totalCost: { $sum: "$totalCost" },
        recordCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Aggregate into seasons
  const seasonData = {};
  for (const { _id, totalUnits, totalCost, recordCount } of result) {
    const season = SEASON_MAP[_id.month] || "Other";
    if (!seasonData[season]) {
      seasonData[season] = { season, totalUnits: 0, totalCost: 0, recordCount: 0, months: 0 };
    }
    seasonData[season].totalUnits += totalUnits;
    seasonData[season].totalCost += totalCost;
    seasonData[season].recordCount += recordCount;
    seasonData[season].months += 1;
  }

  const seasons = Object.values(seasonData).map((s) => ({
    season: s.season,
    color: SEASON_COLORS[s.season] || "#9aa0ac",
    totalUnits: parseFloat(s.totalUnits.toFixed(2)),
    totalCost: parseFloat(s.totalCost.toFixed(2)),
    avgMonthlyUnits: s.months > 0 ? parseFloat((s.totalUnits / s.months).toFixed(2)) : 0,
    recordCount: s.recordCount,
  }));

  // Sort by totalUnits descending
  seasons.sort((a, b) => b.totalUnits - a.totalUnits);

  // Month-by-month for chart
  const monthly = result.map(({ _id, totalUnits, totalCost }) => {
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      label: `${monthNames[_id.month]} ${_id.year}`,
      month: _id.month,
      year: _id.year,
      season: SEASON_MAP[_id.month] || "Other",
      color: SEASON_COLORS[SEASON_MAP[_id.month]] || "#9aa0ac",
      totalUnits: parseFloat(totalUnits.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
    };
  });

  const peakSeason = seasons[0] || null;
  const lowSeason = seasons[seasons.length - 1] || null;

  return {
    seasons,
    monthly,
    insight: peakSeason
      ? `${peakSeason.season} is your highest consumption season (${peakSeason.totalUnits} kWh total). ${
          peakSeason.season === "Summer"
            ? "AC usage is likely the main driver."
            : peakSeason.season === "Winter"
            ? "Heating appliances are the main driver."
            : "Monitor usage spikes during this period."
        }`
      : "Add more usage data to unlock seasonal insights.",
  };
};

module.exports = { getSeasonalAnalysis };
