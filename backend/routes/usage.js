const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  addUsage,
  getUsage,
  getUsageById,
  updateUsage,
  uploadCSV,
  deleteUsage,
} = require("../controllers/usageController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

router.get("/", getUsage);
router.post("/", addUsage);
router.post("/upload-csv", upload.single("file"), uploadCSV);
router.get("/:id", getUsageById);
router.put("/:id", updateUsage);
router.delete("/:id", deleteUsage);

module.exports = router;
