const express = require("express");
const profileController = require("../controllers/profile.controller");
const resultNoData = require("../utils/results/result-nodata");
const resultDTO = require("../utils/results/result.dto");
const { CheckLogin } = require("../utils/authHandler");
const validateResult = require("../utils/validators/validate-result");
const { ProfileRequestValidator, SwitchProfileRequestValidator } = require("../utils/validators/profile.validator");
const multer = require("multer");

const router = express.Router();
const uploadMem = multer({ storage: multer.memoryStorage() });

// Get all profiles for the logged-in user
router.get("/", CheckLogin, async (req, res) => {
  try {
    const userId = req.user.id;
    const profiles = await profileController.getProfilesByUser(userId);
    res.send(resultDTO.success(profiles, "Lấy danh sách tài khoản con thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Create a new profile
router.post("/", CheckLogin, uploadMem.single("avatarFile"), ProfileRequestValidator, validateResult, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, pin } = req.body;
    const avatar = req.body.avatar; // Optional string URL fallback
    const avatarFile = req.file;
    
    if (!name) {
      return res.status(400).send(resultNoData.fail("Tên tài khoản không được để trống."));
    }

    const profile = await profileController.createProfile(userId, { name, avatar, pin, avatarFile });
    
    res.send(resultDTO.success({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      hasPin: !!profile.pin,
      notifMuteDays: profile.notifMuteDays,
      notifMutedForever: profile.notifMutedForever
    }, "Tạo tài khoản con thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Update an existing profile
router.put("/:profileId", CheckLogin, uploadMem.single("avatarFile"), ProfileRequestValidator, validateResult, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const { name, pin, oldPin } = req.body;
    const avatar = req.body.avatar; // Optional string URL fallback
    const avatarFile = req.file;

    const profile = await profileController.updateProfile(userId, profileId, { name, avatar, pin, oldPin, avatarFile });

    res.send(resultDTO.success({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      hasPin: !!profile.pin,
      notifMuteDays: profile.notifMuteDays,
      notifMutedForever: profile.notifMutedForever
    }, "Cập nhật tài khoản con thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Delete a profile
router.delete("/:profileId", CheckLogin, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const { pin } = req.body;

    await profileController.deleteProfile(userId, profileId, pin);
    res.send(resultNoData.success("Xóa tài khoản con thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Switch/Activate a profile (check PIN and issue Profile Token)
router.post("/:profileId/switch", CheckLogin, SwitchProfileRequestValidator, validateResult, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const { pin } = req.body; // Optional, required if profile has PIN

    const profile = await profileController.switchProfile(userId, profileId, pin);
    res.send(resultDTO.success(profile, "Chuyển tài khoản con thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Reset PIN using account password
router.post("/:profileId/reset-pin", CheckLogin, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const { password, newPin } = req.body;

    if (!password) {
      return res.status(400).send(resultNoData.fail("Vui lòng nhập mật khẩu tài khoản."));
    }

    await profileController.resetPinWithPassword(userId, profileId, password, newPin);
    res.send(resultNoData.success("Đặt lại mã PIN thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Update notification mute settings
router.patch("/:profileId/notification-settings", CheckLogin, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const { notifMuteDays, notifMutedForever } = req.body;

    const updated = await profileController.updateNotifSettings(userId, profileId, {
      notifMuteDays,
      notifMutedForever,
    });
    res.send(resultDTO.success(updated, "Cập nhật cài đặt thông báo thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

module.exports = router;
