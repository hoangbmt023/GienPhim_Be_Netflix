const cloudinary = require("cloudinary").v2;
const ENV = require("./env.config");

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_NAME,
  api_key: ENV.CLOUDINARY_KEY,
  api_secret: ENV.CLOUDINARY_SECRET,
});

module.exports = cloudinary;