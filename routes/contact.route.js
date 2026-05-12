var express = require("express");
const { CheckLogin, CheckRole } = require("../utils/authHandler");
const validateResult = require("../utils/validators/validate-result");
const { CreateContactValidator, ReplyContactValidator, UpdateStatusValidator } = require("../utils/validators/contact.validator");
const ContactController = require("../controllers/contact.controller");
const resultDTO = require("../utils/results/result.dto");
const resultNoData = require("../utils/results/result-nodata");
const resultList = require("../utils/results/result-list");
const ApiError = require("../utils/errors/api-error");

var router = express.Router();

// ── USER: Gửi liên hệ (phải đăng nhập)
router.post(
  "/",
  CheckLogin,
  CreateContactValidator,
  validateResult,
  async function (req, res) {
    try {
      const { name, email, subject, message } = req.body;
      const ticket = await ContactController.createTicket(req.user.id, { name, email, subject, message });
      res.status(201).send(resultDTO.success(
        { id: ticket.id, status: ticket.status },
        "Gửi liên hệ thành công. Đội ngũ hỗ trợ sẽ phản hồi sớm nhất có thể."
      ));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── USER: Xem danh sách ticket của chính mình
router.get(
  "/my",
  CheckLogin,
  async function (req, res) {
    try {
      const result = await ContactController.getMyTickets(req.user.id, req.query);
      res.send(resultList.success(result.data, "Lấy danh sách ticket thành công", result.pagination));
    } catch (err) {
      res.status(500).send(resultNoData.fail(err.message));
    }
  }
);

// ── MODERATOR / ADMIN: Lấy tất cả ticket
router.get(
  "/",
  CheckLogin,
  CheckRole("MODERATOR", "ADMIN"),
  async function (req, res) {
    try {
      const result = await ContactController.getAllTickets(req.query);
      res.send(resultList.success(result.data, "Lấy danh sách ticket thành công", result.pagination));
    } catch (err) {
      res.status(500).send(resultNoData.fail(err.message));
    }
  }
);

// ── MODERATOR / ADMIN: Xem chi tiết 1 ticket
router.get(
  "/:ticketId",
  CheckLogin,
  CheckRole("MODERATOR", "ADMIN"),
  async function (req, res) {
    try {
      const ticket = await ContactController.getTicketById(req.params.ticketId);
      if (!ticket) throw ApiError.notFound("Ticket không tồn tại");
      res.send(resultDTO.success(ticket, "Lấy chi tiết ticket thành công"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── MODERATOR / ADMIN: Cập nhật trạng thái
router.patch(
  "/:ticketId/status",
  CheckLogin,
  CheckRole("MODERATOR", "ADMIN"),
  UpdateStatusValidator,
  validateResult,
  async function (req, res) {
    try {
      const updated = await ContactController.updateStatus(req.params.ticketId, req.body.status, req.user.id);
      res.send(resultDTO.success(updated, "Cập nhật trạng thái thành công"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── MODERATOR / ADMIN: Phản hồi ticket (tự động gửi mail + đổi status REPLIED)
router.post(
  "/:ticketId/reply",
  CheckLogin,
  CheckRole("MODERATOR", "ADMIN"),
  ReplyContactValidator,
  validateResult,
  async function (req, res) {
    try {
      const updated = await ContactController.replyTicket(req.params.ticketId, req.body.reply, req.user.id);
      res.send(resultDTO.success(updated, "Phản hồi đã được gửi đến người dùng"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── MODERATOR / ADMIN: Đóng ticket
router.patch(
  "/:ticketId/close",
  CheckLogin,
  CheckRole("MODERATOR", "ADMIN"),
  async function (req, res) {
    try {
      const updated = await ContactController.closeTicket(req.params.ticketId, req.user.id);
      res.send(resultDTO.success(updated, "Đóng ticket thành công"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── USER: Phản hồi lại ticket
router.post(
  "/:ticketId/user-reply",
  CheckLogin,
  async function (req, res) {
    try {
      const message = req.body.message;
      if (!message || !message.trim()) {
        throw ApiError.badRequest("Nội dung phản hồi không được để trống");
      }
      const updated = await ContactController.replyTicketByUser(req.params.ticketId, req.user.id, message);
      res.send(resultDTO.success(updated, "Đã gửi phản hồi"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

// ── USER: Tự đóng ticket
router.patch(
  "/:ticketId/user-close",
  CheckLogin,
  async function (req, res) {
    try {
      const updated = await ContactController.closeTicketByUser(req.params.ticketId, req.user.id);
      res.send(resultDTO.success(updated, "Đã đóng yêu cầu hỗ trợ"));
    } catch (err) {
      res.status(err.status || 500).send(resultNoData.fail(err.message));
    }
  }
);

module.exports = router;
