const csv = require("csv-parser");
const fs = require("fs");
const { validateCSVRow } = require("./validationEngine");
const UsageRecord = require("../models/UsageRecord");

/**
 * Parse a CSV file, validate each row, and bulk insert into MongoDB
 * Expected CSV columns: applianceName, date, units, durationHours, costPerUnit (optional), category (optional)
 */
const parseAndStoreCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const { error, value } = validateCSVRow(row);
        if (error) {
          errors.push({
            row,
            message: error.details.map((d) => d.message).join(", "),
          });
        } else {
          results.push({
            applianceName: value.applianceName,
            date: new Date(value.date),
            units: parseFloat(value.units),
            durationHours: parseFloat(value.durationHours),
            costPerUnit: value.costPerUnit ? parseFloat(value.costPerUnit) : 8,
            category: value.category || "other",
            totalCost: parseFloat(value.units) * (value.costPerUnit ? parseFloat(value.costPerUnit) : 8),
          });
        }
      })
      .on("end", async () => {
        // Delete temp file
        try { fs.unlinkSync(filePath); } catch (_) {}

        if (results.length === 0 && errors.length > 0) {
          return reject(new Error(`All ${errors.length} rows failed validation.`));
        }

        try {
          const inserted = await UsageRecord.insertMany(results);
          resolve({
            inserted: inserted.length,
            failed: errors.length,
            errors,
          });
        } catch (dbErr) {
          reject(dbErr);
        }
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

module.exports = { parseAndStoreCSV };
