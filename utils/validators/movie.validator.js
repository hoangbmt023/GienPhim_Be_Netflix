const { body } = require("express-validator");

const SaveHistoryRequestValidator = [

  body("slug")
    .notEmpty()
    .withMessage("Slug phim không được để trống"),
  body("episode")
    .optional()
    .isString()
    .withMessage("Tập phim phải là chuỗi"),
  body("timePos")
    .optional()
    .isNumeric()
    .withMessage("Thời gian xem phải là số"),
];

const SaveFavoriteRequestValidator = [
  body("slug")
    .notEmpty()
    .withMessage("Slug phim không được để trống"),
];

const DeleteFavoritesRequestValidator = [
  body()
    .custom((value) => {
      if (!value.favoriteId && (!value.favoriteIds || value.favoriteIds.length === 0)) {
        throw new Error("Vui lòng cung cấp favoriteId hoặc favoriteIds");
      }
      return true;
    }),
];

const DeleteHistoryRequestValidator = [
  body()
    .custom((value) => {
      if (!value.historyId && (!value.historyIds || value.historyIds.length === 0) && value.deleteAll !== true) {
        throw new Error("Vui lòng cung cấp historyId, historyIds hoặc deleteAll=true");
      }
      return true;
    }),
];

module.exports = {
  SaveHistoryRequestValidator,
  SaveFavoriteRequestValidator,
  DeleteFavoritesRequestValidator,
  DeleteHistoryRequestValidator,
};
