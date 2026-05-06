const { body, param, query } = require("express-validator");

const UserRegisterRequestValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng"),
  body("password")
    .notEmpty()
    .withMessage("Mật khẩu không được để trống")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
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
