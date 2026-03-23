const express = require("express");
const router = express.Router();
const { getAppliances, addAppliance, updateAppliance, deleteAppliance } = require("../controllers/applianceController");
const { protect } = require("../middleware/auth");
const { validateApplianceInput } = require("../middleware/validation");

router.use(protect);

router.get("/", getAppliances);
router.post("/", validateApplianceInput, addAppliance);
router.put("/:id", updateAppliance);
router.delete("/:id", deleteAppliance);

module.exports = router;
