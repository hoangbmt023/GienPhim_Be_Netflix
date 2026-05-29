const jwt = require("jsonwebtoken");
const ApiError = require("../errors/api-error");
const ENV = require("../../config/env.config");

const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    },
    ENV.JWT_SECRET,
    {
      expiresIn: ENV.JWT_EXPIRES_IN,
      issuer: ENV.JWT_ISSUER,
      audience: ENV.JWT_AUDIENCE,
    },
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      sub: userId,
    },
    ENV.JWT_REFRESH_SECRET,
    {
      expiresIn: ENV.JWT_REFRESH_EXPIRES,
    },
  );
};

const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET, {
      issuer: ENV.JWT_ISSUER,
      audience: ENV.JWT_AUDIENCE,
    });

    return {
      valid: true,
      decoded,
    };
  } catch (err) {
    return ApiError.unauthorized(err.message)
  }
};

const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    ENV.JWT_REFRESH_SECRET,
  );
};
const getUserIdFromToken = (token, isRefresh = false) => {
  const secret = isRefresh
    ? ENV.JWT_REFRESH_SECRET
    : ENV.JWT_SECRET;

  const decoded = jwt.verify(token, secret, {
    issuer: ENV.JWT_ISSUER,
    audience: ENV.JWT_AUDIENCE,
  });

  return decoded.sub;
};

const generateProfileToken = (profileId) => {
  return jwt.sign(
    { profileId },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_PROFILE_EXPIRES_IN }
  );
};

const verifyProfileToken = (token) => {
  try {
    return jwt.verify(token, ENV.JWT_SECRET);
  } catch (err) {
    throw ApiError.unauthorized("Profile token không hợp lệ hoặc đã hết hạn.");
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getUserIdFromToken,
  generateProfileToken,
  verifyProfileToken,
};
