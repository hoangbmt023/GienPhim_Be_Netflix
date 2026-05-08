const { body, param, query } = require("express-validator");

const UserRegisterRequestValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng"),
  body("password")
    .notEmpty()
    .withMessage("password khong duoc rong")
    .bail()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    })
    .withMessage("Mật khẩu phải có chữ hoa, chữ thường và số"),
];

const UpdateRoleRequestValidator = [
  param("userId").notEmpty().withMessage("UserId không được để trống"),
  body("role")
    .notEmpty()
    .withMessage("Role không được để trống")
    .isIn(["USER", "MODERATOR", "ADMIN"])
    .withMessage("Role không hợp lệ (USER, MODERATOR, ADMIN)"),
];

module.exports = {
  UserRegisterRequestValidator,
  UpdateRoleRequestValidator,
};
