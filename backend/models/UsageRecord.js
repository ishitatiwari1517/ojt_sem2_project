const mongoose = require("mongoose");

const usageRecordSchema = new mongoose.Schema(
  {
    applianceName: {
      type: String,
      required: [true, "Appliance name is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    units: {
      type: Number,
      required: [true, "Units consumed is required"],
      min: [0, "Units cannot be negative"],
    },
    durationHours: {
      type: Number,
      required: [true, "Duration in hours is required"],
      min: [0, "Duration cannot be negative"],
    },
    costPerUnit: {
      type: Number,
      default: 8, // default ₹8/unit
      min: [0, "Cost per unit cannot be negative"],
    },
    totalCost: {
      type: Number,
    },
    category: {
      type: String,
      enum: ["cooling", "heating", "lighting", "entertainment", "kitchen", "other"],
      default: "other",
    },
  },
  { timestamps: true }
);

// Auto-calculate totalCost before saving
usageRecordSchema.pre("save", async function () {
  this.totalCost = parseFloat((this.units * this.costPerUnit).toFixed(2));
});

module.exports = mongoose.model("UsageRecord", usageRecordSchema);
