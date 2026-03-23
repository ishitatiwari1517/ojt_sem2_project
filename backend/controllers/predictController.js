const { predictNextMonth } = require("../processing/forecastingEngine");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/predict
const getPrediction = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const prediction = await predictNextMonth(days);
  res.json({
    success: true,
    message: prediction.message,
    data: prediction,
  });
});

module.exports = { getPrediction };
