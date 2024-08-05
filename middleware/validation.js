const joi = require("joi");

function registerValidation(data) {
  const schema = joi.object({
    firstName: joi.string().min(4).required(),
    lastName: joi.string().min(4).required(),
    email: joi.string().min(6).email().required(),
    password: joi.string().min(4).required(),
    phone: joi.string().min(11).max(11),
    address: joi.string().min(3).required(),
    imageUrl: joi.string().min(4).required(),
    resetPasswordToken: joi.string().min(6).max(6).allow(null, ''),
    resetPasswordExpires: joi.date()


   });
  return schema.validate(data);
}


function loginValidation(data) {
  const schema = joi.object({
    email: joi.string().min(6).email().required(),
    password: joi.string().min(4).required(),
  });
  return schema.validate(data);
}

module.exports = { registerValidation, loginValidation };
