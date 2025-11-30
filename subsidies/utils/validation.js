// utils/validation.js
const Joi = require('joi');

const applicationSchema = Joi.object({
  schemeId: Joi.string().hex().length(24).required(),
  applicantData: Joi.object({
    fullName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      district: Joi.string().required(),
      state: Joi.string().required(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).required()
    }).required()
  }).required()
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};