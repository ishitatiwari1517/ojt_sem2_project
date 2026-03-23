const asyncHandler = require("../utils/asyncHandler");
const UsageRecord = require("../models/UsageRecord");
const Bill = require("../models/Bill");
const { Parser } = require("json2csv");

/**
 * GET /api/export/usage  — export all usage records as CSV
 * GET /api/export/bills  — export all bills as CSV
 */

// GET /api/export/usage
const exportUsageCSV = asyncHandler(async (req, res) => {
  const { startDate, endDate, appliance } = req.query;
  const filter = {};

  if (appliance) filter.applianceName = { $regex: appliance, $options: "i" };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const records = await UsageRecord.find(filter).sort({ date: -1 }).lean();

  if (records.length === 0) {
    return res.status(404).json({ success: false, message: "No records found to export." });
  }

  const fields = [
    { label: "Date", value: (r) => new Date(r.date).toLocaleDateString("en-IN") },
    { label: "Appliance", value: "applianceName" },
    { label: "Category", value: "category" },
    { label: "Units (kWh)", value: "units" },
    { label: "Duration (hrs)", value: "durationHours" },
    { label: "Cost/Unit (₹)", value: "costPerUnit" },
    { label: "Total Cost (₹)", value: "totalCost" },
  ];

  const parser = new Parser({ fields });
  const csv = parser.parse(records);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="energylens_usage_${Date.now()}.csv"`
  );
  res.send(csv);
});

// GET /api/export/bills
const exportBillsCSV = asyncHandler(async (req, res) => {
  const filter = req.user ? { userId: req.user._id } : {};
  const bills = await Bill.find(filter).sort({ year: -1, month: -1 }).lean();

  if (bills.length === 0) {
    return res.status(404).json({ success: false, message: "No bills found to export." });
  }

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const fields = [
    { label: "Period", value: (b) => `${monthNames[b.month]} ${b.year}` },
    { label: "Start Date", value: (b) => new Date(b.startDate).toLocaleDateString("en-IN") },
    { label: "End Date", value: (b) => new Date(b.endDate).toLocaleDateString("en-IN") },
    { label: "Total Units (kWh)", value: "totalUnits" },
    { label: "Energy Cost (₹)", value: "totalCost" },
    { label: "Fixed Charges (₹)", value: "fixedCharges" },
    { label: "Grand Total (₹)", value: "grandTotal" },
    { label: "Tariff Plan", value: "tariffName" },
  ];

  const parser = new Parser({ fields });
  const csv = parser.parse(bills);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="energylens_bills_${Date.now()}.csv"`
  );
  res.send(csv);
});

module.exports = { exportUsageCSV, exportBillsCSV };
