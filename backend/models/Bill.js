const mongoose = require("mongoose");

const slabBreakdownItemSchema = new mongoose.Schema(
  {
    minUnits: Number,
    maxUnits: Number,
    ratePerUnit: Number,
    unitsConsumed: Number,
    slabCost: Number,
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Household",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalUnits: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    fixedCharges: { type: Number, default: 0 },
    grandTotal: { type: Number },
    slabBreakdown: [slabBreakdownItemSchema],
    tariffSlabId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TariffSlab",
    },
    tariffName: { type: String, default: "Default" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Auto-calculate grandTotal before saving
billSchema.pre("save", function () {
  this.grandTotal = parseFloat(
    ((this.totalCost || 0) + (this.fixedCharges || 0)).toFixed(2)
  );
});

module.exports = mongoose.model("Bill", billSchema);
