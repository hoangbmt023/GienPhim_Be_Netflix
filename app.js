var express = require("express");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var createError = require("http-errors");
const cors = require("cors");
const prisma = require("./config/prisma");

var app = express();

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].filter(Boolean); // Lọc bỏ nếu CLIENT_URL chưa có

app.use(
    cors({
        origin: function(origin, callback) {
            // Cho phép nếu không có origin (mobile app, postman, curl) 
            // hoặc origin nằm trong danh sách allowedOrigins
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }),
);

app.use(logger("dev"));
app.use(express.json()); // Parse Json body
app.use(express.urlencoded({ extended: false })); // Parse form data
app.use(cookieParser()); // Dọc cookie từ request

// Api Routing
app.use("/", require("./routes/index"));
app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/users", require("./routes/user.route"));
app.use("/api/profiles", require("./routes/profile.route"));
app.use("/api/movies", require("./routes/movie.route"));

// Check DB Connection
console.log("Prisma Client v6 initialized (Native Engine).");
// Prisma 6 Native Engine tự động quản lý kết nối hiệu quả.

// error handler
app.use(function (err, req, res, next) {
  console.error("❌ API ERROR:", err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === 'develop' ? err.stack : undefined
  });
});

module.exports = app;
