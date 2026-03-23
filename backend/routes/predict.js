const express = require("express");
const router = express.Router();
const { getPrediction } = require("../controllers/predictController");

router.get("/", getPrediction);

module.exports = router;
