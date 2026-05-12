const prisma = require("../config/prisma");
const ApiError = require("../utils/errors/api-error");
const bcrypt = require("bcrypt");

const buildPaging = (query) => {
  const page = parseInt(query.page) || 1;
  const size = parseInt(query.size) || 10;
  const skip = (page - 1) * size;
  return { page, size, skip };
};

const createPagination = ({ page, size, total }) => {
  return {
    page,
    size,
    total,
    totalPages: Math.ceil(total / size),
  };
};

const otpGenerator = require("../utils/otp/otp-generator.util");
const otpUtil = require("../utils/otp/otp.util");
const otpMemory = require("../utils/cache/otp-memory-store");
const otpRateLimiter = require("../utils/otp/otp-rate-limiter");
const emailUtil = require("../utils/email.util");

const UserController = {
  register: async function (email, password) {
    console.log("DEBUG: UserController.register called with email:", email);
    email = email.toLowerCase().trim();
    
    if (await isEmailExists(email)) {
      throw ApiError.duplicate("Email '" + email + "' đã tồn tại");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        status: "PENDING",
      }
    });

    // Generate and send OTP for account activation
    const otpCode = otpGenerator.generateOtp(6);
    const otp = otpUtil.createOtp(otpCode, 300); // 5 minutes TTL
    
    otpMemory.save(email, otp);
    otpRateLimiter.recordSend(email);

    // Send email synchronously (Wait for it to finish)
    try {
      await emailUtil.sendOtpEmail(email, otpCode);
    } catch (err) {
      console.error(`❌ Registration Email Error for ${email}:`, err.message);
      // Optional: You might want to delete the user if email fails, 
      // but usually, it's better to just throw so the user knows.
      throw ApiError.internal("Đăng ký thành công nhưng không thể gửi email kích hoạt. Vui lòng thử lại hoặc yêu cầu gửi lại mã.");
    }

    return user;
  },

  getAllUser: async function (query) {
    const { page, size, skip } = buildPaging(query);
    let filter = { isDeleted: false };

    if (query.email) {
      filter.email = { contains: query.email };
    }

    if (query.status) {
      filter.status = query.status.toUpperCase();
    }

    if (query.role) {
      filter.role = query.role.toUpperCase();
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where: filter,
        skip: skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where: filter })
    ]);

    return {
      data,
      pagination: createPagination({ page, size, total }),
    };
  },

  findById: async function (id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.isDeleted) {
      throw ApiError.badRequest("Tài khoản không tồn tại.");
    }
    return user;
  },

  findByEmail: async function (email) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || user.isDeleted) {
      throw ApiError.badRequest("Tài khoản không tồn tại.");
    }
    return user;
  },

  saveUser: async function (userId, data) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw ApiError.badRequest("Tài khoản không tồn tại.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: data
    });

    return updatedUser;
  },

  changePassword: async function (userId, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return user;
  },

  deleteUser: async function (userId) {
    // Soft delete user
    await prisma.user.update({ where: { id: userId }, data: { isDeleted: true } });
    
    // Soft delete all profiles of this user
    await prisma.profile.updateMany({
      where: { userId: userId },
      data: { isDeleted: true }
    });
  },

  banUser: async function (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "BANNED" }
    });
  },

  unBanUser: async function (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" }
    });
  },

  updateRole: async function (userId, role) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: role.toUpperCase() }
    });
  },

  activateAccount: async function (email, otp) {
    const user = await this.findByEmail(email);
    
    if (user.status === "ACTIVE") {
      throw ApiError.badRequest("Tài khoản đã được kích hoạt.");
    }

    if (user.status === "BANNED") {
      throw ApiError.forbidden("Tài khoản đang bị khóa.");
    }

    const otpLocal = otpMemory.get(email.toLowerCase().trim());
    if (!otpLocal) {
      throw ApiError.badRequest("OTP không hợp lệ hoặc đã hết hạn");
    }

    otpUtil.verifyOtp(otpLocal, otp);
    otpMemory.remove(email);

    await prisma.user.update({
      where: { id: user.id },
      data: { status: "ACTIVE" }
    });

    return true;
  },

  resendActivateOtp: async function (email) {
    const user = await this.findByEmail(email);
    
    if (user.status !== "PENDING") {
      throw ApiError.badRequest("Chỉ tài khoản đang chờ kích hoạt mới có thể gửi lại OTP.");
    }

    if (!otpRateLimiter.canSend(email)) {
      throw ApiError.badRequest("Vui lòng đợi 60 giây trước khi gửi lại OTP");
    }

    const otpCode = otpGenerator.generateOtp(6);
    const otp = otpUtil.createOtp(otpCode, 300);
    
    otpMemory.save(email, otp);
    otpRateLimiter.recordSend(email);
    
    await emailUtil.sendOtpEmail(email, otpCode);
    return true;
  },
};

const isEmailExists = async (email) => {
  console.log("DEBUG: Checking if email exists:", email);
  const count = await prisma.user.count({ where: { email } });
  console.log("DEBUG: Email count result:", count);
  return count > 0;
};

module.exports = UserController;
