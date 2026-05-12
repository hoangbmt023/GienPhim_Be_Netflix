const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const ApiError = require("../utils/errors/api-error");
const { generateProfileToken } = require("../utils/jwt/jwt.util");
const mediaUtil = require("../utils/media.util");

const MAX_PROFILES = 5;

const ProfileController = {
  createProfile: async function (userId, data) {
    const count = await prisma.profile.count({ where: { userId, isDeleted: false } });
    if (count >= MAX_PROFILES) {
      throw ApiError.badRequest(`Bạn chỉ có thể tạo tối đa ${MAX_PROFILES} tài khoản con.`);
    }

    let avatarUrl = data.avatar || null;

    if (data.avatarFile) {
      avatarUrl = await mediaUtil.upload(data.avatarFile, `profiles/${userId}`);
    }

    const profile = await prisma.profile.create({
      data: {
        userId: userId,
        name: data.name,
        avatar: avatarUrl,
        pin: data.pin || null,
      }
    });

    return profile;
  },

  getProfilesByUser: async function (userId) {
    const profiles = await prisma.profile.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'asc' }
    });
    
    // Map to remove 'pin', 'userId', 'createdAt', 'updatedAt' and add 'hasPin'
    return profiles.map(profile => {
      return {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        hasPin: !!profile.pin
      };
    });
  },

  switchProfile: async function (userId, profileId, inputPin) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId, isDeleted: false }
    });

    if (!profile) {
      throw ApiError.notFound("Không tìm thấy tài khoản con.");
    }

    // Check PIN if profile has one
    if (profile.pin) {
      if (!inputPin || inputPin !== profile.pin) {
        throw ApiError.unauthorized("Mã PIN không chính xác.");
      }
    }

    // We no longer change isDefault here because isDefault is only for the "Main" profile.
    // Instead, we issue a secure Profile Token to prove this device has unlocked the profile.
    const profileToken = generateProfileToken(profileId);

    return {
      profile: {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        hasPin: !!profile.pin
      },
      profileToken
    };
  },

  updateProfile: async function (userId, profileId, data) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId, isDeleted: false }
    });

    if (!profile) {
      throw ApiError.notFound("Không tìm thấy tài khoản con.");
    }

    if (profile.pin) {
      if (!data.oldPin || data.oldPin !== profile.pin) {
        throw ApiError.unauthorized("Mã PIN hiện tại không chính xác.");
      }
    }

    let avatarUrl = profile.avatar; // Default to existing avatar

    if (data.avatarFile) {
      // 1. If a new file is uploaded, upload it
      avatarUrl = await mediaUtil.upload(data.avatarFile, `profiles/${userId}`);
      
      // Delete old avatar if it exists
      if (profile.avatar) {
        try {
          await mediaUtil.deleteByUrl(profile.avatar);
        } catch (error) {
          console.error("Failed to delete old avatar from Cloudinary:", error);
        }
      }
    } else if (data.avatar && data.avatar !== "null" && data.avatar !== profile.avatar) {
      // 2. If a string URL is provided, and it's different from the DB
      avatarUrl = data.avatar;

      // Delete old avatar if it exists (since we are replacing it with a new link)
      if (profile.avatar) {
        try {
          await mediaUtil.deleteByUrl(profile.avatar);
        } catch (error) {
          console.error("Failed to delete old avatar from Cloudinary:", error);
        }
      }
    }
    // 3. If data.avatar is null, empty, or matches DB, it falls through and keeps profile.avatar

    let finalPin = profile.pin;
    if (data.pin !== undefined) {
      finalPin = data.pin === '' ? null : data.pin;
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        name: data.name || profile.name,
        avatar: avatarUrl,
        pin: finalPin,
      }
    });

    return updatedProfile;
  },

  deleteProfile: async function (userId, profileId, inputPin) {
    // Check total active profiles
    const activeCount = await prisma.profile.count({
      where: { userId, isDeleted: false }
    });

    if (activeCount <= 1) {
      throw ApiError.badRequest("Không thể xóa tài khoản con. Phải có ít nhất 1 tài khoản hoạt động.");
    }

    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId, isDeleted: false }
    });

    if (!profile) {
      throw ApiError.notFound("Không tìm thấy tài khoản con.");
    }

    if (profile.pin) {
      if (!inputPin || inputPin !== profile.pin) {
        throw ApiError.unauthorized("Mã PIN không chính xác.");
      }
    }

    // Soft delete instead of hard delete
    await prisma.profile.update({
      where: { id: profileId },
      data: { isDeleted: true }
    });
  },

  resetPinWithPassword: async function (userId, profileId, accountPassword, newPin) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isDeleted) {
      throw ApiError.unauthorized("Tài khoản không hợp lệ.");
    }

    // Verify parent account password
    const isMatch = await bcrypt.compare(accountPassword, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized("Mật khẩu tài khoản không chính xác.");
    }

    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId, isDeleted: false }
    });

    if (!profile) {
      throw ApiError.notFound("Không tìm thấy hồ sơ.");
    }

    // Update with new PIN (or remove if newPin is empty)
    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: { pin: newPin || null }
    });

    return updatedProfile;
  }
};

module.exports = ProfileController;
