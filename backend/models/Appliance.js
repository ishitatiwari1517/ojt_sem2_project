const mongoose = require("mongoose");

const applianceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Appliance name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["cooling", "heating", "lighting", "entertainment", "kitchen", "other"],
      default: "other",
    },
    wattage: {
      type: Number,
      required: [true, "Wattage is required"],
      min: [0, "Wattage cannot be negative"],
    },
    avgDailyHours: {
      type: Number,
      default: 0,
      min: [0, "Average daily hours cannot be negative"],
    },
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Household",
    },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// Virtual: estimated daily kWh
applianceSchema.virtual("dailyKWh").get(function () {
  return parseFloat(((this.wattage * this.avgDailyHours) / 1000).toFixed(3));
});

// Virtual: estimated monthly kWh (30 days)
applianceSchema.virtual("monthlyKWh").get(function () {
  return parseFloat(((this.wattage * this.avgDailyHours * 30) / 1000).toFixed(2));
});

applianceSchema.set("toJSON", { virtuals: true });
applianceSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Appliance", applianceSchema);
