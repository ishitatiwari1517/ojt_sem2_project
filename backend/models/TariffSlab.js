const mongoose = require("mongoose");

const slabSchema = new mongoose.Schema(
  {
    minUnits: { type: Number, required: true, min: 0 },
    maxUnits: { type: Number, default: null }, // null means unlimited
    ratePerUnit: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const tariffSlabSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tariff name is required"],
      trim: true,
    },
    state: { type: String, trim: true, default: "General" },
    slabs: {
      type: [slabSchema],
      validate: {
        validator: (arr) => arr && arr.length > 0,
        message: "At least one slab is required.",
      },
    },
    isDefault: { type: Boolean, default: false },
    fixedCharges: { type: Number, default: 0 }, // monthly fixed fee
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TariffSlab", tariffSlabSchema);
