const { body } = require("express-validator");

const ProfileRequestValidator = [
  body("name")
    .notEmpty()
    .withMessage("Tên tài khoản con không được để trống")
    .isLength({ max: 50 })
    .withMessage("Tên không được vượt quá 50 ký tự"),
  body("pin")
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage("Mã PIN phải bao gồm 4 chữ số")
    .isNumeric()
    .withMessage("Mã PIN chỉ được chứa số"),
];

const SwitchProfileRequestValidator = [
  body("pin")
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage("Mã PIN phải bao gồm 4 chữ số")
    .isNumeric()
    .withMessage("Mã PIN chỉ được chứa số"),
];

module.exports = {
  ProfileRequestValidator,
  SwitchProfileRequestValidator,
};
