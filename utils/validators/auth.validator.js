const { body } = require("express-validator");

module.exports = {
  UserLoginRequestValidator: [
    body("email")
      .notEmpty()
      .withMessage("email không được rỗng")
      .bail()
      .isEmail()
      .withMessage("email sai định dạng")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("password không được rỗng"),
  ],
  RefreshTokenRequestValidator: [],

  LogoutRequestValidator: [],

  RevokeTokenRequestValidator: [
    body("refreshToken")
      .notEmpty()
      .withMessage("Refresh Token không được để trống"),
  ],

  SendActivateOtpRequestValidator: [
    body("email")
      .notEmpty()
      .withMessage("email không được rỗng")
      .bail()
      .isEmail()
      .withMessage("email sai địng dạng")
      .normalizeEmail(),
  ],
  ActivateAccountRequestValidator: [
    body("email")
      .notEmpty()
      .withMessage("email không được rỗng")
      .bail()
      .isEmail()
      .withMessage("email sai địng dạng")
      .normalizeEmail(),
    body("otp")
      .notEmpty()
      .withMessage("Mã OTP không được để trống")
      .bail()
      .isLength({ min: 6, max: 6 })
      .withMessage("Mã OTP phải có đúng 6 ký tự")
      .bail()
      .matches(/^[a-zA-Z0-9]{6}$/)
      .withMessage("Mã OTP phải là chuỗi gồm 6 ký tự chữ hoặc số"),
  ],
  ForgotPasswordRequestValidator: [
    body("email")
      .notEmpty()
      .withMessage("email không được rỗng")
      .bail()
      .isEmail()
      .withMessage("email sai địng dạng")
      .normalizeEmail(),
  ],
  VerifyForgotPasswordRequestValidator: [
    body("email")
      .notEmpty()
      .withMessage("email không được rỗng")
      .bail()
      .isEmail()
      .withMessage("email sai địng dạng")
      .normalizeEmail(),
    body("otp")
      .notEmpty()
      .withMessage("Mã OTP không được để trống")
      .bail()
      .isLength({ min: 6, max: 6 })
      .withMessage("Mã OTP phải có đúng 6 ký tự")
      .bail()
      .matches(/^[a-zA-Z0-9]{6}$/)
      .withMessage("Mã OTP phải là chuỗi gồm 6 ký tự chữ hoặc số"),
  ],
  ResetPasswordRequestValidator: [
    body("email")
      .notEmpty()
      .withMessage("email không được rỗng")
      .bail()
      .isEmail()
      .withMessage("email sai địng dạng")
      .normalizeEmail(),
    body("otp")
      .notEmpty()
      .withMessage("Mã OTP không được để trống")
      .bail()
      .isLength({ min: 6, max: 6 })
      .withMessage("Mã OTP phải có đúng 6 ký tự")
      .bail()
      .matches(/^[a-zA-Z0-9]{6}$/)
      .withMessage("Mã OTP phải là chuỗi gồm 6 ký tự chữ hoặc số"),
    body("newPassword")
      .notEmpty()
      .withMessage("password không được rỗng")
      .bail()
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 1,
        minUppercase: 1,
      })
      .withMessage("Mật khẩu phải có chữ hoa, chữ thường và số"),
    body("logoutAllDevices")
      .optional()
      .isBoolean()
      .withMessage("logoutAllDevices phải là boolean"),
  ],
};

