const mongoose = require("mongoose");

const warrantySchema = new mongoose.Schema(
  {
    applianceName: { type: String, required: true, trim: true },
    brand: { type: String, trim: true, default: "" },
    modelNumber: { type: String, trim: true, default: "" },
    purchaseDate: { type: Date, required: true },
    warrantyEndDate: { type: Date, required: true },
    // Service tracking
    lastServiceDate: { type: Date, default: null },
    nextServiceDate: { type: Date, default: null },
    serviceIntervalMonths: { type: Number, default: 6 }, // how often to service (months)
    // Meta
    notes: { type: String, trim: true, default: "" },
    purchasePrice: { type: Number, default: null },
    // Repair logs
    repairHistory: [
      {
        date: { type: Date, required: true },
        description: { type: String, required: true },
        cost: { type: Number, default: 0 },
        servicedBy: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

// Virtual: computed status
warrantySchema.virtual("status").get(function () {
  const now = new Date();
  const daysToWarrantyEnd = Math.ceil(
    (this.warrantyEndDate - now) / (1000 * 60 * 60 * 24)
  );

  if (daysToWarrantyEnd < 0) return "expired";
  if (daysToWarrantyEnd <= 30) return "expiring_soon";

  if (this.nextServiceDate) {
    const daysToService = Math.ceil(
      (this.nextServiceDate - now) / (1000 * 60 * 60 * 24)
    );
    if (daysToService < 0) return "service_overdue";
    if (daysToService <= 14) return "service_due_soon";
  }

  return "active";
});

warrantySchema.set("toJSON", { virtuals: true });
warrantySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Warranty", warrantySchema);
