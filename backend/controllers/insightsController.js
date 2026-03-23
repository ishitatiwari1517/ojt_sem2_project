const asyncHandler = require("../utils/asyncHandler");
const { getRecommendations } = require("../processing/recommendationsEngine");

// GET /api/insights/recommendations
const getInsights = asyncHandler(async (req, res) => {
  const data = await getRecommendations();
  res.json({
    success: true,
    message: `${data.recommendations.length} recommendations generated`,
    data,
  });
});

module.exports = { getInsights };
