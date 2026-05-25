var express = require("express");
const { CheckLogin, CheckRole } = require("../utils/authHandler");
const validateResult = require("../utils/validators/validate-result");
const {
  CreateAnnouncementValidator,
  UpdateAnnouncementValidator,
} = require("../utils/validators/announcement.validator");
const AnnouncementController = require("../controllers/announcement.controller");
const resultDTO = require("../utils/results/result.dto");
const resultNoData = require("../utils/results/result-nodata");
const resultList = require("../utils/results/result-list");

var router = express.Router();

// ── PUBLIC: Lấy thông báo đang active (FE dùng) ─────────
router.get("/active", async function (req, res) {
  try {
    const data = await AnnouncementController.getActive();
    res.send(resultDTO.success(data, "Lấy danh sách thông báo thành công"));
  } catch (err) {
    res.status(err.status || 500).send(resultNoData.fail(err.message));
  }
});

// ── ADMIN + MODERATOR: Lấy tất cả (có filter/paging) ────
router.get(
  "/",
  CheckLogin,
  CheckRole("ADMIN", "MODERATOR"),
  async function (req, res) {
    try {
      const result = await AnnouncementController.getAll(req.query);
      res.send(
        resultList.success(result.data, "Lấy danh sách thông báo thành công", result.pagination)
      );
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── ADMIN + MODERATOR: Chi tiết ─────────────────────────
router.get(
  "/:id",
  CheckLogin,
  CheckRole("ADMIN", "MODERATOR"),
  async function (req, res) {
    try {
      const ann = await AnnouncementController.getById(req.params.id);
      res.send(resultDTO.success(ann, "Lấy chi tiết thông báo thành công"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── ADMIN + MODERATOR: Tạo mới ──────────────────────────
router.post(
  "/",
  CheckLogin,
  CheckRole("ADMIN", "MODERATOR"),
  CreateAnnouncementValidator,
  validateResult,
  async function (req, res) {
    try {
      const ann = await AnnouncementController.create(
        req.user.id,
        req.user.role,
        req.body
      );
      res.status(201).send(resultDTO.success(ann, "Tạo thông báo thành công"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── ADMIN + MODERATOR: Cập nhật ─────────────────────────
router.put(
  "/:id",
  CheckLogin,
  CheckRole("ADMIN", "MODERATOR"),
  UpdateAnnouncementValidator,
  validateResult,
  async function (req, res) {
    try {
      const ann = await AnnouncementController.update(
        req.params.id,
        req.user.id,
        req.user.role,
        req.body
      );
      res.send(resultDTO.success(ann, "Cập nhật thông báo thành công"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── ADMIN + MODERATOR (MARKETING/CONTENT): Publish ──────
router.patch(
  "/:id/publish",
  CheckLogin,
  CheckRole("ADMIN", "MODERATOR"),
  async function (req, res) {
    try {
      const ann = await AnnouncementController.publish(req.params.id, req.user.role);
      res.send(resultDTO.success(ann, "Đã publish thông báo"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── Chỉ ADMIN: Unpublish ────────────────────────────────
router.patch(
  "/:id/unpublish",
  CheckLogin,
  CheckRole("ADMIN"),
  async function (req, res) {
    try {
      const ann = await AnnouncementController.unpublish(req.params.id);
      res.send(resultDTO.success(ann, "Đã unpublish thông báo"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── Chỉ ADMIN: Xóa ─────────────────────────────────────
router.delete(
  "/:id",
  CheckLogin,
  CheckRole("ADMIN"),
  async function (req, res) {
    try {
      await AnnouncementController.remove(req.params.id);
      res.send(resultNoData.success("Xóa thông báo thành công"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

module.exports = router;
