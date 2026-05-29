var express = require("express");
const ENV = require("./config/env.config");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var createError = require("http-errors");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const prisma = require("./config/prisma");

var app = express();

const allowedOrigins = [
    ENV.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].filter(Boolean); // Lọc bỏ nếu CLIENT_URL chưa có

app.use(
    cors({
        origin: function (origin, callback) {
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

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased to 500 for better user experience on movie sites
    message: { success: false, message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Stricter limit for login/register/contact creation
    message: { success: false, message: "Thao tác quá nhanh hoặc đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});

const actionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit for all Create/Update/Delete actions
    message: { success: false, message: "Bạn đang thực hiện thao tác quá nhanh. Vui lòng đợi một lát." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 1. Apply strict rate limit to sensitive routes (Auth & Contact Creation), except refresh-token and logout
app.use("/api/auth", (req, res, next) => {
    if (req.path === '/refresh-token' || req.path === '/logout') {
        return next();
    }
    return authLimiter(req, res, next);
});

// 2. Apply action rate limit to all other non-GET /api routes (Create/Update/Delete)
app.use("/api", (req, res, next) => {
    if (req.method !== 'GET') {
        return actionLimiter(req, res, next);
    }
    next();
});

// 3. Apply general rate limit to all /api routes (mainly for GET requests)
app.use("/api", generalLimiter);

// Api Routing
app.use("/", require("./routes/index"));
app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/users", require("./routes/user.route"));
app.use("/api/profiles", require("./routes/profile.route"));
app.use("/api/movies", require("./routes/movie.route"));
app.use("/api/contact", require("./routes/contact.route"));
app.use("/api/announcements", require("./routes/announcement.route"));

// Check DB Connection
console.log("Prisma Client v6 initialized (Native Engine).");
// Prisma 6 Native Engine tự động quản lý kết nối hiệu quả.

// error handler
app.use(function (err, req, res, next) {
    console.error("❌ API ERROR:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: ENV.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = app;
