import api from './api';

export const searchGames = (params) =>
  api.get('/api/v1/games/search', { params });

export const getGameById = (rawgId) =>
  api.get(`/api/v1/games/${rawgId}`);

export const getPopularGames = (params) =>
  api.get('/api/v1/games/popular', { params });

export const getUpcomingGames = (platform) =>
  api.get('/api/v1/games/upcoming', { params: { platform } });

export const getGenres = () =>
  api.get('/api/v1/games/genres');

export const getPlatforms = () =>
  api.get('/api/v1/games/platforms');
