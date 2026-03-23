const express = require("express");
const router = express.Router();
const {
  getHousehold,
  upsertHousehold,
  updateHousehold,
  deleteHousehold,
} = require("../controllers/householdController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getHousehold);
router.post("/", upsertHousehold);
router.put("/:id", updateHousehold);
router.delete("/:id", deleteHousehold);

module.exports = router;
