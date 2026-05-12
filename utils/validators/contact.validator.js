const { body } = require("express-validator");

const CreateContactValidator = [
  body("name").trim().notEmpty().withMessage("Họ tên không được để trống"),
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("subject").trim().notEmpty().withMessage("Chủ đề không được để trống"),
  body("message")
    .trim()
    .notEmpty().withMessage("Nội dung không được để trống")
    .isLength({ max: 3000 }).withMessage("Nội dung tối đa 3000 ký tự"),
];

const ReplyContactValidator = [
  body("reply")
    .trim()
    .notEmpty().withMessage("Nội dung phản hồi không được để trống")
    .isLength({ max: 5000 }).withMessage("Phản hồi tối đa 5000 ký tự"),
];

const UpdateStatusValidator = [
  body("status")
    .isIn(["OPEN", "IN_PROGRESS", "REPLIED", "CLOSED"])
    .withMessage("Trạng thái không hợp lệ"),
];

module.exports = { CreateContactValidator, ReplyContactValidator, UpdateStatusValidator };
