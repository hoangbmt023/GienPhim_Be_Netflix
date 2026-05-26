const prisma = require("../config/prisma");
const ApiError = require("../utils/errors/api-error");
const axios = require("axios");
const { generateId } = require("../utils/uuid.util");

const MovieController = {
  checkAndSaveMovie: async function (slug) {
    // Check if it already exists in DB
    let movie = await prisma.movie.findUnique({ where: { slug } });
    
    if (movie) {
      return movie; // Already saved
    }

    // Fetch from API to check existence
    try {
      const response = await axios.get(`https://ophim1.com/v1/api/phim/${slug}`);
      const data = response.data;

      if (data.status === false || !data.data || !data.data.item) {
        throw ApiError.notFound("Không tìm thấy phim trên hệ thống OPhim.");
      }

      const item = data.data.item;

      // Only save basic info to manage history/watch later
      movie = await prisma.movie.create({
        data: {
          id: generateId(),
          slug: item.slug,
        }
      });

      return movie;
    } catch (error) {
      if (error.status) throw error;
      throw ApiError.internal("Lỗi khi kiểm tra phim từ API OPhim: " + error.message);
    }
  },

  getMovie: async function (slug) {
    const movie = await prisma.movie.findUnique({ where: { slug } });
    if (!movie) {
      // If not in DB, try to fetch and save it
      return await this.checkAndSaveMovie(slug);
    }

    return movie;
  },

  getFavorites: async function (profileId, page = 1, size = 20) {
    const skip = (page - 1) * size;
    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { profileId },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          movie: {
            select: {
              id: true,
              slug: true
            }
          }
        }
      }),
      prisma.favorite.count({ where: { profileId } })
    ]);

    return {
      data: favorites.map(f => ({
        id: f.id,
        favoriteId: f.id,
        movieId: f.movie.id,
        slug: f.movie.slug,
        createdAt: f.createdAt
      })),
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size)
      }
    };
  },

  saveFavorite: async function (profileId, slug) {
    let movie = await prisma.movie.findUnique({ where: { slug } });
    if (!movie) {
      movie = await this.checkAndSaveMovie(slug);
    }

    // Check if already in favorites
    const existing = await prisma.favorite.findUnique({
      where: {
        profileId_movieId: {
          profileId: profileId,
          movieId: movie.id
        }
      }
    });

    if (existing) {
      throw ApiError.badRequest("Phim này đã có trong danh sách yêu thích.");
    }

    const favorite = await prisma.favorite.create({
      data: {
        id: generateId(),
        profileId: profileId,
        movieId: movie.id
      }
    });

    return favorite;
  },

  checkFavorite: async function (profileId, slug) {
    const movie = await prisma.movie.findUnique({ where: { slug } });
    if (!movie) {
      return false; // If movie is not in DB, it can't be in favorites
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        profileId_movieId: {
          profileId: profileId,
          movieId: movie.id
        }
      }
    });

    return {
      isFavorited: !!existing,
      favoriteId: existing ? existing.id : null
    };
  },

  deleteFavorite: async function (profileId, favoriteId) {
    return await prisma.favorite.deleteMany({
      where: {
        id: favoriteId,
        profileId: profileId // Ensures profile owns the favorite
      }
    });
  },

  deleteMultipleFavorites: async function (profileId, favoriteIds) {
    return await prisma.favorite.deleteMany({
      where: {
        id: { in: favoriteIds },
        profileId: profileId
      }
    });
  },

  saveHistory: async function (profileId, slug, episode, episodeSlug, server, timePos) {
    let movie = await prisma.movie.findUnique({ where: { slug } });
    if (!movie) {
      movie = await this.checkAndSaveMovie(slug);
    }

    const tPos = timePos ? parseInt(timePos) : 0;
    const serverIdx = (server !== undefined && server !== null) ? parseInt(server) : 0;

    const history = await prisma.history.upsert({
      where: {
        profileId_movieId: {
          profileId: profileId,
          movieId: movie.id
        }
      },
      update: {
        episode: episode,
        episodeSlug: episodeSlug,
        server: serverIdx,
        timePos: tPos,
        updatedAt: new Date()
      },
      create: {
        id: generateId(),
        profileId: profileId,
        movieId: movie.id,
        episode: episode,
        episodeSlug: episodeSlug,
        server: serverIdx,
        timePos: tPos
      }
    });

    return history;
  },

  getHistory: async function (profileId, page = 1, size = 20) {
    const skip = (page - 1) * size;
    const [histories, total] = await Promise.all([
      prisma.history.findMany({
        where: { profileId },
        skip,
        take: size,
        include: {
          movie: {
            select: {
              id: true,
              slug: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.history.count({ where: { profileId } })
    ]);

    return {
      data: histories.map(h => ({
        id: h.movie.id,
        historyId: h.id,
        slug: h.movie.slug,
        timePos: h.timePos,
        updatedAt: h.updatedAt,
        episode: {
          name: h.episode,
          slug: h.episodeSlug,
          server: h.server ?? 0
        }
      })),
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size)
      }
    };
  },

  deleteHistoryItem: async function (profileId, historyId) {
    return await prisma.history.deleteMany({
      where: {
        id: historyId,
        profileId: profileId // Ensures profile owns the history
      }
    });
  },

  deleteMultipleHistories: async function (profileId, historyIds) {
    return await prisma.history.deleteMany({
      where: {
        id: { in: historyIds },
        profileId: profileId
      }
    });
  },

  deleteAllHistory: async function (profileId) {
    return await prisma.history.deleteMany({
      where: { profileId }
    });
  }
};

module.exports = MovieController;
