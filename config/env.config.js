const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 8080,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "30d",
  JWT_PROFILE_EXPIRES_IN: process.env.JWT_PROFILE_EXPIRES_IN || "30d",
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,

  // COOKIE
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  COOKIE_REFRESH_MAX_AGE: parseInt(process.env.COOKIE_REFRESH_MAX_AGE) || 30 * 24 * 60 * 60 * 1000,
  COOKIE_PROFILE_MAX_AGE: parseInt(process.env.COOKIE_PROFILE_MAX_AGE) || 30 * 24 * 60 * 60 * 1000,

  // CLIENT
  CLIENT_URL: process.env.CLIENT_URL || "https://gienphim.site",

  // CLOUDINARY
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
  CLOUDINARY_KEY: process.env.CLOUDINARY_KEY,
  CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET,

  // SMTP
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
};

module.exports = ENV;
