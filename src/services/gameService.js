import api from './api';

export const searchGames = (params) =>
  api.get('/api/v1/games/search', { params });

export const getGameById = (igdbId) =>
  api.get(`/api/v1/games/${igdbId}`);

export const getPopularGames = (params) =>
  api.get('/api/v1/games/popular', { params });

export const getUpcomingGames = (platform) =>
  api.get('/api/v1/games/upcoming', { params: { platform } });

export const getGenres = () =>
  api.get('/api/v1/games/genres');

export const getPlatforms = () =>
  api.get('/api/v1/games/platforms');

export const getByFranchise = (name, limit = 20, excludeIgdbId) =>
  api.get(`/api/v1/games/by-franchise/${encodeURIComponent(name)}`, {
    params: { limit, ...(excludeIgdbId ? { excludeIgdbId } : {}) },
  });

export const getByCollection = (name, limit = 20, excludeIgdbId) =>
  api.get(`/api/v1/games/by-collection/${encodeURIComponent(name)}`, {
    params: { limit, ...(excludeIgdbId ? { excludeIgdbId } : {}) },
  });
