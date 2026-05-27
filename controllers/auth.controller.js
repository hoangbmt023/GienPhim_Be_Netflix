const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/errors/api-error");
const {
  generateToken,
  generateRefreshToken,
} = require("../utils/jwt/jwt.util");
const { generateId } = require("../utils/uuid.util");

const MAX_REFRESH_TOKEN = 5;

const AuthController = {
  login: async function (email, password) {
    email = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted) {
      throw ApiError.unauthorized("Tài khoản hoặc mật khẩu không đúng");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized("Tài khoản hoặc mật khẩu không đúng");
    }

    if (user.status === "BANNED") {
      throw ApiError.forbidden("Tài khoản đã bị khóa");
    }

    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden("Tài khoản chưa được kích hoạt");
    }

    const token = generateToken(user);
    return token;
  },

  createRefreshToken: async function (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted) {
      throw ApiError.notFound("Email không tồn tại hoặc đã bị xóa");
    }

    const token = generateRefreshToken(user.id);

    const decoded = jwt.decode(token);
    const expiryDate = new Date(decoded.exp * 1000);

    const count = await prisma.refreshToken.count({ where: { userId: user.id } });

    if (count >= MAX_REFRESH_TOKEN) {
      const oldest = await prisma.refreshToken.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" }
      });

      if (oldest) {
        await prisma.refreshToken.delete({ where: { id: oldest.id } });
      }
    }

    await prisma.refreshToken.create({
      data: {
        id: generateId(),
        userId: user.id,
        token: token,
        expiryDate: expiryDate,
      }
    });

    return token;
  },

  findRefreshTokenByToken: async function (token) {
    return await prisma.refreshToken.findUnique({ where: { token } });
  },

  deleteOneRefreshToken: async function (tokenId) {
    await prisma.refreshToken.delete({ where: { id: tokenId } });
  },

  deleteAllRefreshByUserId: async function (userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },
};

module.exports = AuthController;
