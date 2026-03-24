const express = require("express");
const router = express.Router();
const {
  getApplianceAnalysis,
  getAnalysisSummary,
} = require("../controllers/analysisController");

router.get("/summary", getAnalysisSummary);
router.get("/appliance", getApplianceAnalysis);


module.exports = router;
