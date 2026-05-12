const jwt = require("jsonwebtoken");
const ApiError = require("../errors/api-error");

const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    },
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      sub: userId,
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || "15d",
    },
  );
};

const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
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
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  );
};
const getUserIdFromToken = (token, isRefresh = false) => {
  const secret = isRefresh
    ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    : process.env.JWT_SECRET;

  const decoded = jwt.verify(token, secret, {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  });

  return decoded.sub;
};

const generateProfileToken = (profileId) => {
  return jwt.sign(
    { profileId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_PROFILE_EXPIRES_IN || "30d" }
  );
};

const verifyProfileToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
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
