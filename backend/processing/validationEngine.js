const Joi = require("joi");

const usageSchema = Joi.object({
  applianceName: Joi.string().trim().min(1).max(100).required(),
  date: Joi.date().iso().optional(),
  units: Joi.number().min(0).required(),
  durationHours: Joi.number().min(0).required(),
  costPerUnit: Joi.number().min(0).optional(),
  category: Joi.string()
    .valid("cooling", "heating", "lighting", "entertainment", "kitchen", "other")
    .optional(),
});

const validateUsage = (data) => {
  return usageSchema.validate(data, { abortEarly: false });
};

const validateCSVRow = (row) => {
  const csvRowSchema = Joi.object({
    applianceName: Joi.string().trim().min(1).required(),
    date: Joi.alternatives()
      .try(Joi.date().iso(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/))
      .required(),
    units: Joi.alternatives()
      .try(Joi.number().min(0), Joi.string().pattern(/^\d+(\.\d+)?$/))
      .required(),
    durationHours: Joi.alternatives()
      .try(Joi.number().min(0), Joi.string().pattern(/^\d+(\.\d+)?$/))
      .required(),
    costPerUnit: Joi.alternatives()
      .try(Joi.number().min(0), Joi.string().pattern(/^\d+(\.\d+)?$/))
      .optional(),
    category: Joi.string()
      .valid("cooling", "heating", "lighting", "entertainment", "kitchen", "other")
      .optional(),
  });
  return csvRowSchema.validate(row, { abortEarly: false });
};

module.exports = { validateUsage, validateCSVRow };
