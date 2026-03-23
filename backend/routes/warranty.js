const express = require("express");
const router = express.Router();
const {
  getWarranties,
  addWarranty,
  updateWarranty,
  deleteWarranty,
  addRepair,
  getWarrantyAlerts,
} = require("../controllers/warrantyController");

router.get("/alerts", getWarrantyAlerts);
router.get("/", getWarranties);
router.post("/", addWarranty);
router.put("/:id", updateWarranty);
router.delete("/:id", deleteWarranty);
router.post("/:id/repair", addRepair);

module.exports = router;
