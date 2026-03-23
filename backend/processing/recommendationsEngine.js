const UsageRecord = require("../models/UsageRecord");
const { subMonths } = require("date-fns");

/**
 * Rule-based recommendations engine.
 * Analyses usage patterns and generates actionable energy-saving tips.
 */

const RULES = [
  {
    id: "ac_heavy_use",
    check: (data) => {
      const ac = data.byAppliance.find((a) =>
        /air.?cond|ac\b/i.test(a.applianceName)
      );
      return ac && ac.totalUnits > 60;
    },
    recommendation: {
      category: "cooling",
      priority: "high",
      title: "Air Conditioner is your top energy consumer",
      description:
        "Your AC accounts for a significant share of your bill. Set the thermostat to 24°C instead of 18°C — each degree saves ~6% energy.",
      potentialSaving: "10-20%",
      icon: "❄️",
    },
  },
  {
    id: "high_overnight",
    check: (data) => data.totalUnits > 100 && data.avgDailyUnits > 4,
    recommendation: {
      category: "general",
      priority: "medium",
      title: "High daily average usage detected",
      description:
        "Your daily average exceeds 4 kWh. Identify appliances left on standby overnight — TVs, set-top boxes, and chargers can consume 5-10% even when idle.",
      potentialSaving: "5-10%",
      icon: "🌙",
    },
  },
  {
    id: "peak_month",
    check: (data) => {
      if (data.monthlyTrend.length < 2) return false;
      const latest = data.monthlyTrend[data.monthlyTrend.length - 1];
      const prev = data.monthlyTrend[data.monthlyTrend.length - 2];
      return latest.totalUnits > prev.totalUnits * 1.3;
    },
    recommendation: {
      category: "trends",
      priority: "high",
      title: "Usage spiked 30%+ this month",
      description:
        "Your electricity consumption jumped significantly compared to last month. Check if a new appliance was added or if existing ones are running longer.",
      potentialSaving: "Up to 30% if spike is addressed",
      icon: "📈",
    },
  },
  {
    id: "lighting_upgrade",
    check: (data) => {
      const lighting = data.byAppliance.find((a) =>
        /light|lamp|bulb/i.test(a.applianceName)
      );
      return lighting && lighting.totalUnits > 20;
    },
    recommendation: {
      category: "lighting",
      priority: "low",
      title: "Switch to LED lighting",
      description:
        "Your lighting usage is notable. Replacing CFL/incandescent bulbs with LED equivalents reduces lighting energy use by up to 75%.",
      potentialSaving: "5-15%",
      icon: "💡",
    },
  },
  {
    id: "washing_machine",
    check: (data) => {
      const wm = data.byAppliance.find((a) =>
        /wash|laundry/i.test(a.applianceName)
      );
      return wm && wm.recordCount > 15;
    },
    recommendation: {
      category: "kitchen",
      priority: "low",
      title: "Optimise washing machine usage",
      description:
        "You're running the washing machine frequently. Use cold water cycles and full loads only — this can reduce washing energy use by 40%.",
      potentialSaving: "3-8%",
      icon: "🫧",
    },
  },
  {
    id: "diversify_appliances",
    check: (data) => {
      if (data.byAppliance.length === 0) return false;
      const top = data.byAppliance[0];
      const total = data.totalUnits;
      return total > 0 && top.totalUnits / total > 0.6;
    },
    recommendation: {
      category: "general",
      priority: "medium",
      title: "One appliance dominates your usage",
      description:
        "A single appliance accounts for over 60% of your energy use. Stagger high-power activities across the day and avoid peak tariff hours (6–10 PM).",
      potentialSaving: "5-15%",
      icon: "⚡",
    },
  },
  {
    id: "low_data",
    check: (data) => data.totalRecords < 5,
    recommendation: {
      category: "general",
      priority: "info",
      title: "Add more usage data for better insights",
      description:
        "You have fewer than 5 records. Log your appliances daily or upload a CSV to unlock personalised recommendations and accurate predictions.",
      potentialSaving: "N/A",
      icon: "📊",
    },
  },
];

const GENERAL_TIPS = [
  {
    category: "habits",
    title: "Unplug chargers when not in use",
    description: "Phone and laptop chargers draw phantom power. Unplugging saves ~1-2% annually.",
    potentialSaving: "1-2%",
    icon: "🔌",
    priority: "low",
  },
  {
    category: "habits",
    title: "Use natural light during the day",
    description: "Open blinds and curtains during daylight hours to reduce artificial lighting needs.",
    potentialSaving: "2-5%",
    icon: "☀️",
    priority: "low",
  },
  {
    category: "cooling",
    title: "Use fans before turning on AC",
    description: "Ceiling fans use ~10x less energy than ACs. Use fans first and raise AC thermostat by 4°C.",
    potentialSaving: "5-10%",
    icon: "🌀",
    priority: "medium",
  },
  {
    category: "kitchen",
    title: "Defrost refrigerator regularly",
    description: "A fridge with ice buildup uses 20-30% more energy. Defrost every 3-6 months.",
    potentialSaving: "3-5%",
    icon: "🧊",
    priority: "low",
  },
];

const getRecommendations = async () => {
  const threeMonthsAgo = subMonths(new Date(), 3);

  const [byAppliance, monthly, totalsArr] = await Promise.all([
    UsageRecord.aggregate([
      { $match: { date: { $gte: threeMonthsAgo } } },
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
    ]),
    UsageRecord.aggregate([
      { $match: { date: { $gte: threeMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          totalUnits: { $sum: "$units" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    UsageRecord.aggregate([
      { $group: { _id: null, totalUnits: { $sum: "$units" }, recordCount: { $sum: 1 } } },
    ]),
  ]);

  const totals = totalsArr[0] || { totalUnits: 0, recordCount: 0 };
  const data = {
    byAppliance,
    monthlyTrend: monthly,
    totalUnits: totals.totalUnits,
    totalRecords: totals.recordCount,
    avgDailyUnits: parseFloat((totals.totalUnits / 90).toFixed(2)),
  };

  // Run all rules
  const triggered = RULES.filter((rule) => rule.check(data)).map((r) => r.recommendation);

  // Always include general tips
  const allTips = [...triggered, ...GENERAL_TIPS];

  // Sort by priority: high → medium → low → info
  const order = { high: 0, medium: 1, low: 2, info: 3 };
  allTips.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));

  return {
    recommendations: allTips,
    stats: {
      totalUnits: parseFloat(totals.totalUnits.toFixed(2)),
      totalRecords: totals.recordCount,
      avgDailyUnits: data.avgDailyUnits,
      topAppliance: byAppliance[0]?.applianceName || null,
      applianceCount: byAppliance.length,
    },
    generatedAt: new Date().toISOString(),
  };
};

module.exports = { getRecommendations };
