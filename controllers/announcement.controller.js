const prisma = require("../config/prisma");
const ApiError = require("../utils/errors/api-error");

// ── Helpers ───────────────────────────────────────────────
const buildPaging = (query) => {
  const page = parseInt(query.page) || 1;
  const size = parseInt(query.size) || 10;
  const skip = (page - 1) * size;
  return { page, size, skip };
};

const createPagination = ({ page, size, total }) => ({
  page,
  size,
  total,
  totalPages: Math.ceil(total / size),
});

/**
 * Kiểm tra quyền theo scope:
 *   SYSTEM   → chỉ ADMIN
 *   CONTENT  → ADMIN + MODERATOR
 *   MARKETING→ ADMIN + MODERATOR
 */
const canManageScope = (role, scope) => {
  if (role === "ADMIN") return true;
  if (role === "MODERATOR" && scope !== "SYSTEM") return true;
  return false;
};

// ── Controller ────────────────────────────────────────────
const AnnouncementController = {
  /**
   * GET /api/announcements/active  (Public)
   * Trả về các thông báo đang active & trong thời gian hiệu lực
   */
  getActive: async function () {
    const now = new Date();
    const list = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        badge: true,
        text: true,
        link: true,
        type: true,
        display: true,
        scope: true,
        startAt: true,
        endAt: true,
      },
    });
    return list;
  },

  /**
   * GET /api/announcements  (ADMIN + MODERATOR)
   */
  getAll: async function (query) {
    const { page, size, skip } = buildPaging(query);

    const filter = {};
    if (query.type) filter.type = query.type.toUpperCase();
    if (query.display) filter.display = query.display.toUpperCase();
    if (query.scope) filter.scope = query.scope.toUpperCase();
    if (query.isActive !== undefined) filter.isActive = query.isActive === "true";

    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where: filter,
        skip,
        take: size,
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { id: true, email: true, role: true } } },
      }),
      prisma.announcement.count({ where: filter }),
    ]);

    return { data, pagination: createPagination({ page, size, total }) };
  },

  /**
   * GET /api/announcements/:id  (ADMIN + MODERATOR)
   */
  getById: async function (id) {
    const ann = await prisma.announcement.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, email: true, role: true } } },
    });
    if (!ann) throw ApiError.notFound("Thông báo không tồn tại.");
    return ann;
  },

  /**
   * POST /api/announcements  (ADMIN + MODERATOR)
   */
  create: async function (userId, role, data) {
    const scope = (data.scope || "MARKETING").toUpperCase();
    if (!canManageScope(role, scope)) {
      throw ApiError.forbidden(
        `Bạn không có quyền tạo thông báo với scope '${scope}'. Chỉ ADMIN mới được tạo thông báo hệ thống.`
      );
    }

    const ann = await prisma.announcement.create({
      data: {
        title: data.title,
        badge: data.badge,
        text: data.text,
        link: data.link || null,
        type: (data.type || "INFO").toUpperCase(),
        display: (data.display || "BAR").toUpperCase(),
        scope,
        isActive: false, // Mặc định draft, cần ADMIN publish
        startAt: data.startAt ? new Date(data.startAt) : null,
        endAt: data.endAt ? new Date(data.endAt) : null,
        createdById: userId,
        updatedById: userId,
      },
    });
    return ann;
  },

  /**
   * PUT /api/announcements/:id  (ADMIN + MODERATOR)
   */
  update: async function (id, userId, role, data) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Thông báo không tồn tại.");

    const scope = (data.scope || existing.scope).toUpperCase();
    if (!canManageScope(role, scope)) {
      throw ApiError.forbidden(
        `Bạn không có quyền chỉnh sửa thông báo với scope '${scope}'.`
      );
    }

    const ann = await prisma.announcement.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        badge: data.badge ?? existing.badge,
        text: data.text ?? existing.text,
        link: data.link !== undefined ? data.link || null : existing.link,
        type: data.type ? data.type.toUpperCase() : existing.type,
        display: data.display ? data.display.toUpperCase() : existing.display,
        scope,
        startAt: data.startAt !== undefined ? (data.startAt ? new Date(data.startAt) : null) : existing.startAt,
        endAt: data.endAt !== undefined ? (data.endAt ? new Date(data.endAt) : null) : existing.endAt,
        updatedById: userId,
      },
    });
    return ann;
  },

  /**
   * PATCH /api/announcements/:id/publish  (Chỉ ADMIN)
   * Moderator tạo MARKETING được publish luôn
   */
  publish: async function (id, role) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Thông báo không tồn tại.");

    // MODERATOR chỉ publish được MARKETING scope
    if (role === "MODERATOR" && existing.scope === "SYSTEM") {
      throw ApiError.forbidden("Chỉ ADMIN mới có thể publish thông báo hệ thống.");
    }

    return prisma.announcement.update({
      where: { id },
      data: { isActive: true },
    });
  },

  /**
   * PATCH /api/announcements/:id/unpublish  (ADMIN)
   */
  unpublish: async function (id) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Thông báo không tồn tại.");

    return prisma.announcement.update({
      where: { id },
      data: { isActive: false },
    });
  },

  /**
   * DELETE /api/announcements/:id  (Chỉ ADMIN)
   */
  remove: async function (id) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Thông báo không tồn tại.");

    await prisma.announcement.delete({ where: { id } });
  },
};

module.exports = AnnouncementController;
