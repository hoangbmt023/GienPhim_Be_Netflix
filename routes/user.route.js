var express = require("express");
const validateResult = require("../utils/validators/validate-result");
const userController = require("../controllers/user.controller");
const profileController = require("../controllers/profile.controller");
const resultNoData = require("../utils/results/result-nodata");
const resultDTO = require("../utils/results/result.dto");
const resultList = require("../utils/results/result-list");
const { CheckLogin, CheckRole } = require("../utils/authHandler");
const ApiError = require("../utils/errors/api-error");
const { UserRegisterRequestValidator, UpdateRoleRequestValidator } = require("../utils/validators/user.validator");

var router = express.Router();

router.post(
  "/register",
  UserRegisterRequestValidator,
  validateResult,
  async function (req, res, next) {
    try {
      let { email, password } = req.body;

      if (!email || !password) {
        throw ApiError.badRequest("Vui lòng cung cấp email và password");
      }

      let user = await userController.register(email, password);

      // Create a default profile (sub-account)
      await profileController.createProfile(user.id, {
        name: "Người dùng mới"
      });

      res.send(resultNoData.success("Tài khoản đã được đăng ký thành công."));
    } catch (error) {
      return res
        .status(error.status || 500)
        .send(resultNoData.fail(error.message));
    }
  },
);

router.get(
  "/",
  CheckLogin,
  CheckRole("ADMIN", "MODERATOR"),
  async function (req, res, next) {
    try {
      let result = await userController.getAllUser(req.query);

      return res.send(
        resultList.success(
          result.data,
          "Lấy danh sách người dùng thành công",
          result.pagination,
        ),
      );
    } catch (error) {
      return res.status(400).send(resultNoData.fail(error.message));
    }
  },
);

router.put(
  "/:userId/ban",
  CheckLogin,
  CheckRole("ADMIN"),
  async function (req, res, next) {
    try {
      const userId = req.params.userId;
      await userController.banUser(userId);

      return res.send(resultNoData.success("Khóa người dùng thành công"));
    } catch (error) {
      return res.status(400).send(resultNoData.fail(error.message));
    }
  },
);

router.put(
  "/:userId/unban",
  CheckLogin,
  CheckRole("ADMIN"),
  async function (req, res, next) {
    try {
      const userId = req.params.userId;
      await userController.unBanUser(userId);

      return res.send(resultNoData.success("Mở khóa người dùng thành công"));
    } catch (error) {
      return res.status(400).send(resultNoData.fail(error.message));
    }
  },
);

router.put(
  "/:userId/roles",
  CheckLogin,
  CheckRole("ADMIN"),
  UpdateRoleRequestValidator,
  validateResult,
  async function (req, res, next) {
    try {
      const userId = req.params.userId;
      const role = req.body.role;

      if (!role || !["USER", "MODERATOR", "ADMIN"].includes(role.toUpperCase())) {
        throw ApiError.badRequest("Role không hợp lệ");
      }

      await userController.updateRole(userId, role);

      return res.send(
        resultNoData.success("Update roles người dùng thành công"),
      );
    } catch (error) {
      return res.status(400).send(resultNoData.fail(error.message));
    }
  },
);

router.delete(
  "/:userId",
  CheckLogin,
  CheckRole("ADMIN"),
  async function (req, res, next) {
    try {
      const userId = req.params.userId;
      await userController.deleteUser(userId);

      return res.send(resultNoData.success("Xóa người dùng thành công"));
    } catch (error) {
      return res.status(400).send(resultNoData.fail(error.message));
    }
  },
);

module.exports = router;
