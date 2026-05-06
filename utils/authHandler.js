const { verifyAccessToken, verifyProfileToken } = require("./jwt/jwt.util");
const prisma = require("../config/prisma");
const resultNoData = require("./results/result-nodata");

module.exports = {
  CheckLogin: async function (req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send(resultNoData.fail("Chưa đăng nhập"));
      }

      const token = authHeader.split(" ")[1];

      const {decoded} = verifyAccessToken(token);

      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

      if (!user || user.isDeleted) {
        return res.status(401).send(resultNoData.fail("User không tồn tại hoặc đã bị xóa"));
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).send(resultNoData.fail("Token không hợp lệ"));
    }
  },

  CheckRole: function (...requiredRole) {
    return function (req, res, next) {
      const user = req.user;

      if (!user) {
        return res.status(401).send(resultNoData.fail("Chưa đăng nhập"));
      }

      // In GienPhim, role is a single string (enum), not an array
      const hasRole = requiredRole.includes(user.role);

      if (hasRole) {  
        return next();
      }

      return res.status(403).send(resultNoData.fail("Không có quyền truy cập"));
    };
  },

  CheckProfile: async function (req, res, next) {
    try {
      const profileToken = req.headers["x-profile-token"];
      
      if (!profileToken) {
        return res.status(401).send(resultNoData.fail("Thiếu x-profile-token. Vui lòng xác thực tài khoản con qua API switch để lấy token."));
      }

      // Verify the profile token
      const decoded = verifyProfileToken(profileToken);
      const profileId = decoded.profileId;

      const profile = await prisma.profile.findUnique({
        where: { id: profileId }
      });

      if (!profile || profile.isDeleted) {
        return res.status(404).send(resultNoData.fail("Profile không tồn tại hoặc đã bị xóa."));
      }

      if (profile.userId !== req.user.id) {
        return res.status(403).send(resultNoData.fail("Profile không thuộc quyền sở hữu của bạn."));
      }

      req.profile = profile;
      next();
    } catch (error) {
      // Return 401 for token errors
      if (error.status === 401) {
        return res.status(401).send(resultNoData.fail(error.message));
      }
      return res.status(500).send(resultNoData.fail("Lỗi khi kiểm tra profile: " + error.message));
    }
  }
};
