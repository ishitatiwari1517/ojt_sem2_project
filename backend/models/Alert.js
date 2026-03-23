const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["high_usage", "cost_spike", "appliance_overuse", "budget_exceeded", "prediction_warning", "custom"],
      default: "custom",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    message: {
      type: String,
      required: [true, "Alert message is required"],
      trim: true,
    },
    applianceName: { type: String, trim: true, default: null },
    value: { type: Number, default: null },    // e.g. actual usage units
    threshold: { type: Number, default: null }, // e.g. threshold that was exceeded
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);
