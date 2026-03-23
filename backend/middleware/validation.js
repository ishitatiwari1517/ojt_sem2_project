/**
 * Validation Middleware
 * Route-level middleware to validate request body fields.
 * Returns 400 with a descriptive message on failure.
 */

/**
 * Validate usage record input.
 * Required: applianceName, units, durationHours
 */
const validateUsageInput = (req, res, next) => {
  const { applianceName, units, durationHours } = req.body;
  const errors = [];

  if (!applianceName || typeof applianceName !== "string" || !applianceName.trim()) {
    errors.push("'applianceName' is required and must be a non-empty string.");
  }

  if (units === undefined || units === null || units === "") {
    errors.push("'units' is required.");
  } else if (isNaN(Number(units)) || Number(units) <= 0) {
    errors.push("'units' must be a number greater than 0.");
  }

  if (durationHours === undefined || durationHours === null || durationHours === "") {
    errors.push("'durationHours' is required.");
  } else if (isNaN(Number(durationHours)) || Number(durationHours) < 0) {
    errors.push("'durationHours' must be a non-negative number.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

/**
 * Validate appliance input.
 * Required: name, wattage
 */
const validateApplianceInput = (req, res, next) => {
  const { name, wattage } = req.body;
  const errors = [];

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("'name' is required and must be a non-empty string.");
  }

  if (wattage === undefined || wattage === null || wattage === "") {
    errors.push("'wattage' is required.");
  } else if (isNaN(Number(wattage)) || Number(wattage) <= 0) {
    errors.push("'wattage' must be a number greater than 0.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

/**
 * Validate bill calculation input.
 * Required: startDate, endDate
 */
const validateBillInput = (req, res, next) => {
  const { startDate, endDate } = req.body;
  const errors = [];

  if (!startDate) errors.push("'startDate' is required.");
  if (!endDate) errors.push("'endDate' is required.");

  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push("'startDate' must be a valid date string.");
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push("'endDate' must be a valid date string.");
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push("'startDate' must be before 'endDate'.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

module.exports = { validateUsageInput, validateApplianceInput, validateBillInput };
