const prisma = require("../config/prisma");
const { sendContactNotifyModEmail, sendContactReplyUserEmail } = require("../utils/email.util");
const { generateId } = require("../utils/uuid.util");

const ContactController = {
  // Người dùng gửi liên hệ
  createTicket: async function (userId, { name, email, subject, message }) {
    const ticket = await prisma.contactTicket.create({
      data: { id: generateId(), userId, name, email, subject, message }
    });

    // Lấy tất cả Moderator đang ACTIVE
    const moderators = await prisma.user.findMany({
      where: { role: "MODERATOR", status: "ACTIVE", isDeleted: false },
      select: { email: true }
    });

    // Gửi mail đến từng Moderator (bất đồng bộ, không block response)
    const createdAt = new Date(ticket.createdAt).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    for (const mod of moderators) {
      sendContactNotifyModEmail(mod.email, {
        ticketId: ticket.id,
        name, email, subject, message, createdAt
      }).catch(err => console.error("❌ Lỗi gửi mail Mod:", err.message));
    }

    return ticket;
  },

  // Lấy danh sách ticket (Moderator/Admin)
  getAllTickets: async function ({ page = 1, limit = 20, status }) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.contactTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
        include: {
          user: { select: { email: true, role: true } }
        }
      }),
      prisma.contactTicket.count({ where })
    ]);

    return { data, pagination: { page: pageNum, limit: limitNum, total } };
  },

  // Lấy chi tiết 1 ticket
  getTicketById: async function (ticketId) {
    return await prisma.contactTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { email: true, role: true } } }
    });
  },

  // Lấy ticket của chính user đang đăng nhập
  getMyTickets: async function (userId, { page = 1, limit = 10 }) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      prisma.contactTicket.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.contactTicket.count({ where: { userId } })
    ]);

    return { data, pagination: { page: pageNum, limit: limitNum, total } };
  },

  // Moderator cập nhật trạng thái (không kèm phản hồi)
  updateStatus: async function (ticketId, status, moderatorId) {
    return await prisma.contactTicket.update({
      where: { id: ticketId },
      data: { status }
    });
  },

  // Moderator phản hồi + đổi status -> REPLIED và gửi mail người dùng
  replyTicket: async function (ticketId, newReplyText, moderatorId) {
    const ticket = await prisma.contactTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error("Ticket không tồn tại");

    // Chỉ lưu nội dung mới nhất thêm vào chuỗi lịch sử
    const existingReply = ticket.reply || '';
    const fullReply = existingReply
      ? `${existingReply}\n\n--- Phản hồi từ Hỗ trợ viên ---\n${newReplyText}`
      : `--- Phản hồi từ Hỗ trợ viên ---\n${newReplyText}`;

    const updated = await prisma.contactTicket.update({
      where: { id: ticketId },
      data: {
        reply: fullReply,
        status: "REPLIED",
        repliedById: moderatorId,
        repliedAt: new Date()
      }
    });

    // Gửi mail chỉ với nội dung mới nhất (không gửi lịch sử cũ)
    sendContactReplyUserEmail(ticket.email, {
      name: ticket.name,
      subject: ticket.subject,
      originalMessage: ticket.message,
      reply: newReplyText
    }).catch(err => console.error("❌ Lỗi gửi mail phản hồi user:", err.message));

    return updated;
  },

  // Moderator đóng ticket
  closeTicket: async function (ticketId, moderatorId) {
    return await prisma.contactTicket.update({
      where: { id: ticketId },
      data: { status: "CLOSED" }
    });
  },

  // Người dùng phản hồi lại ticket - chỉ lưu một đoạn mới và gửi mail cho Mod
  replyTicketByUser: async function (ticketId, userId, message) {
    const ticket = await prisma.contactTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error("Ticket không tồn tại");
    if (ticket.userId !== userId) throw new Error("Không có quyền thực hiện");
    if (ticket.status === "CLOSED") throw new Error("Ticket đã đóng, không thể phản hồi");

    const existingReply = ticket.reply || '';
    const fullReply = existingReply
      ? `${existingReply}\n\n--- Người dùng phản hồi ---\n${message}`
      : `--- Người dùng phản hồi ---\n${message}`;

    const updated = await prisma.contactTicket.update({
      where: { id: ticketId },
      data: {
        reply: fullReply,
        status: "OPEN",
      }
    });

    // Gửi mail cho moderator với chỉ nội dung mới nhất
    const moderators = await prisma.user.findMany({
      where: { role: "MODERATOR", status: "ACTIVE", isDeleted: false },
      select: { email: true }
    });
    const createdAt = new Date().toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
    for (const mod of moderators) {
      sendContactNotifyModEmail(mod.email, {
        ticketId: ticket.id,
        name: ticket.name,
        email: ticket.email,
        subject: `[Phản hồi] ${ticket.subject}`,
        message,
        createdAt
      }).catch(err => console.error("❌ Lỗi gửi mail Mod:", err.message));
    }

    return updated;
  },

  // Người dùng tự đóng ticket
  closeTicketByUser: async function (ticketId, userId) {
    const ticket = await prisma.contactTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error("Ticket không tồn tại");
    if (ticket.userId !== userId) throw new Error("Không có quyền thực hiện");

    return await prisma.contactTicket.update({
      where: { id: ticketId },
      data: { status: "CLOSED" }
    });
  }
};

module.exports = ContactController;
