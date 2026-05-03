import api from './api';

export const searchGames = (params) =>
  api.get('/api/v1/games/search', { params });

export const getGameById = (igdbId) =>
  api.get(`/api/v1/games/${igdbId}`);

export const getPopularGames = (params) =>
  api.get('/api/v1/games/popular', { params });

export const getUpcomingGames = ({ platforms = [], windowDays = 90, limit = 20, excludeIds = [] } = {}) => {
  const params = { windowDays, limit };
  if (platforms.length > 0) params.platform = platforms.join(',');
  if (excludeIds.length > 0) params.excludeIds = excludeIds.join(',');
  return api.get('/api/v1/games/upcoming', { params });
};

export const getUpcomingPlatforms = () =>
  api.get('/api/v1/games/upcoming/platforms');

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

export const getEditions = igdbId =>
  api.get(`/api/v1/games/${igdbId}/editions`);
