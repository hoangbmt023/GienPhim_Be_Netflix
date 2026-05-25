const { body } = require("express-validator");

const VALID_TYPES    = ["INFO", "WARNING", "DANGER", "SUCCESS"];
const VALID_DISPLAYS = ["BAR", "BOX"];
const VALID_SCOPES   = ["SYSTEM", "CONTENT", "MARKETING"];

const CreateAnnouncementValidator = [
  body("title")
    .trim()
    .notEmpty().withMessage("Tên thông báo (title) không được để trống")
    .isLength({ max: 200 }).withMessage("Title tối đa 200 ký tự"),
  body("badge")
    .trim()
    .notEmpty().withMessage("Badge không được để trống")
    .isLength({ max: 50 }).withMessage("Badge tối đa 50 ký tự"),
  body("text")
    .trim()
    .notEmpty().withMessage("Nội dung thông báo không được để trống")
    .isLength({ max: 5000 }).withMessage("Nội dung tối đa 5000 ký tự"),
  body("link")
    .optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage("Link không hợp lệ"),
  body("type")
    .optional()
    .isIn(VALID_TYPES).withMessage(`Loại thông báo phải là một trong: ${VALID_TYPES.join(", ")}`),
  body("display")
    .optional()
    .isIn(VALID_DISPLAYS).withMessage(`Kiểu hiển thị phải là một trong: ${VALID_DISPLAYS.join(", ")}`),
  body("scope")
    .optional()
    .isIn(VALID_SCOPES).withMessage(`Scope phải là một trong: ${VALID_SCOPES.join(", ")}`),
  body("startAt")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage("startAt phải là định dạng ISO8601"),
  body("endAt")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage("endAt phải là định dạng ISO8601"),
];

const UpdateAnnouncementValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage("Title 1–200 ký tự"),
  body("badge")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage("Badge 1–50 ký tự"),
  body("text")
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage("Nội dung 1–5000 ký tự"),
  body("link")
    .optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage("Link không hợp lệ"),
  body("type")
    .optional()
    .isIn(VALID_TYPES).withMessage(`Loại thông báo phải là một trong: ${VALID_TYPES.join(", ")}`),
  body("display")
    .optional()
    .isIn(VALID_DISPLAYS).withMessage(`Kiểu hiển thị phải là một trong: ${VALID_DISPLAYS.join(", ")}`),
  body("scope")
    .optional()
    .isIn(VALID_SCOPES).withMessage(`Scope phải là một trong: ${VALID_SCOPES.join(", ")}`),
  body("startAt")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage("startAt phải là định dạng ISO8601"),
  body("endAt")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage("endAt phải là định dạng ISO8601"),
];

module.exports = { CreateAnnouncementValidator, UpdateAnnouncementValidator };
