const express = require("express");
const router = express.Router();
const {
  getApplianceAnalysis,
  getSeasonalData,
  getAnalysisSummary,
} = require("../controllers/analysisController");

router.get("/summary", getAnalysisSummary);
router.get("/appliance", getApplianceAnalysis);
router.get("/seasonal", getSeasonalData);

module.exports = router;
