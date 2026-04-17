import api from './api';

// Collection
export const getUserGames = (params) =>
  api.get('/api/v1/library/games', { params });

export const addGame = (data) =>
  api.post('/api/v1/library/games', data);

export const updateGame = (gameId, data) =>
  api.put(`/api/v1/library/games/${gameId}`, data);

export const removeGame = (gameId) =>
  api.delete(`/api/v1/library/games/${gameId}`);

// Filtered views
export const getBacklog = () =>
  api.get('/api/v1/library/backlog');

export const getWishlist = () =>
  api.get('/api/v1/library/wishlist');

export const getPlaying = () =>
  api.get('/api/v1/library/playing');

export const getCompleted = () =>
  api.get('/api/v1/library/completed');

// Special
export const getStats = () =>
  api.get('/api/v1/library/stats');

export const getDustyGames = (days = 90) =>
  api.get('/api/v1/library/dusty', { params: { days } });

// Platforms (used in onboarding + recommendations)
export const getUserPlatforms = () =>
  api.get('/api/v1/library/platforms');

export const addPlatform = (data) =>
  api.post('/api/v1/library/platforms', data);
