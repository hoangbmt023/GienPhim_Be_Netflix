const express = require("express");
const movieController = require("../controllers/movie.controller");
const resultNoData = require("../utils/results/result-nodata");
const resultDTO = require("../utils/results/result.dto");
const resultList = require("../utils/results/result-list");
const { CheckLogin, CheckProfile } = require("../utils/authHandler");
const validateResult = require("../utils/validators/validate-result");
const { SaveHistoryRequestValidator, SaveFavoriteRequestValidator, DeleteFavoritesRequestValidator, DeleteHistoryRequestValidator } = require("../utils/validators/movie.validator");

const router = express.Router();

// Lấy danh sách phim yêu thích
router.get("/favorites", CheckLogin, CheckProfile, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 20;
    const profileId = req.profile.id;

    const result = await movieController.getFavorites(profileId, page, size);
    res.send(resultList.success(result.data, "Lấy danh sách phim yêu thích thành công.", result.pagination));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Lưu phim yêu thích
router.post("/favorites", CheckLogin, CheckProfile, SaveFavoriteRequestValidator, validateResult, async (req, res) => {
  try {
    const { slug } = req.body;

    const favorite = await movieController.saveFavorite(req.profile.id, slug);
    res.send(resultDTO.success(favorite, "Lưu phim yêu thích thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Kiểm tra xem phim đã được lưu vào danh sách yêu thích chưa
router.get("/favorites/check/:slug", CheckLogin, CheckProfile, async (req, res) => {
  try {
    const slug = req.params.slug;
    const profileId = req.profile.id;

    const isFavorited = await movieController.checkFavorite(profileId, slug);
    res.send(resultDTO.success({ isFavorited }, "Kiểm tra phim yêu thích thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Xóa 1 hoặc nhiều phim yêu thích
router.delete("/favorites", CheckLogin, CheckProfile, DeleteFavoritesRequestValidator, validateResult, async (req, res) => {
  try {
    // Expecting either favoriteId (string) or favoriteIds (array of strings) in body
    const { favoriteId, favoriteIds } = req.body;

    if (favoriteIds && Array.isArray(favoriteIds) && favoriteIds.length > 0) {
      await movieController.deleteMultipleFavorites(req.profile.id, favoriteIds);
      res.send(resultNoData.success("Xóa nhiều phim yêu thích thành công."));
    } else if (favoriteId) {
      await movieController.deleteFavorite(req.profile.id, favoriteId);
      res.send(resultNoData.success("Xóa phim yêu thích thành công."));
    }
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Lấy lịch sử xem phim của profile
router.get("/history", CheckLogin, CheckProfile, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 20;
    const profileId = req.profile.id;

    const result = await movieController.getHistory(profileId, page, size);

    res.send(resultList.success(result.data, "Lấy lịch sử xem phim thành công.", result.pagination));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Lưu/cập nhật lịch sử xem phim
router.post("/history", CheckLogin, CheckProfile, SaveHistoryRequestValidator, validateResult, async (req, res) => {
  try {
    const profileId = req.profile.id;
    const { slug, episode, timePos } = req.body;

    if (!slug) {
      return res.status(400).send(resultNoData.fail("Thiếu slug phim."));
    }

    const history = await movieController.saveHistory(profileId, slug, episode, timePos);

    res.send(resultDTO.success(history, "Lưu lịch sử xem phim thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Xóa lịch sử xem phim (1, nhiều, hoặc tất cả)
router.delete("/history", CheckLogin, CheckProfile, DeleteHistoryRequestValidator, validateResult, async (req, res) => {
  try {
    const profileId = req.profile.id;
    const { historyId, historyIds, deleteAll } = req.body;

    if (deleteAll === true) {
      await movieController.deleteAllHistory(profileId);
      res.send(resultNoData.success("Đã xóa tất cả lịch sử xem phim."));
    } else if (historyIds && Array.isArray(historyIds) && historyIds.length > 0) {
      await movieController.deleteMultipleHistories(profileId, historyIds);
      res.send(resultNoData.success("Xóa nhiều lịch sử xem phim thành công."));
    } else if (historyId) {
      await movieController.deleteHistoryItem(profileId, historyId);
      res.send(resultNoData.success("Xóa lịch sử xem phim thành công."));
    }
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

// Lấy thông tin 1 bộ phim theo slug (sẽ tự lưu nếu chưa có trong DB)
router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const movie = await movieController.getMovie(slug);

    res.send(resultDTO.success(movie, "Lấy thông tin phim thành công."));
  } catch (error) {
    res.status(error.status || 500).send(resultNoData.fail(error.message));
  }
});

module.exports = router;
