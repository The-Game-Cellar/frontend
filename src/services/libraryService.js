import api from './api';
import {
  invalidatePrefetchedPersonalized,
  prefetchPersonalized,
  invalidateDashboard,
  prefetchDashboard,
} from './recommendationService';

const refreshRecsCache = () => {
  invalidatePrefetchedPersonalized();
  prefetchPersonalized(100);
  invalidateDashboard();
  prefetchDashboard();
};

// Collection
export const getUserGames = (params) =>
  api.get('/api/v1/library/games', { params });

export const getOwnedIgdbIds = () =>
  api.get('/api/v1/library/igdb-ids');

export const addGame = (data) =>
  api.post('/api/v1/library/games', data).then(res => {
    refreshRecsCache();
    return res;
  });

export const updateGame = (gameId, data) =>
  api.put(`/api/v1/library/games/${gameId}`, data).then(res => {
    refreshRecsCache();
    return res;
  });

export const removeGame = (gameId) =>
  api.delete(`/api/v1/library/games/${gameId}`).then(res => {
    refreshRecsCache();
    return res;
  });

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

export const getDustyGames = () =>
  api.get('/api/v1/library/dusty');

export const getLibraryGenres = () =>
  api.get('/api/v1/library/genres');

// Platforms (used in onboarding + recommendations)
export const getUserPlatforms = () =>
  api.get('/api/v1/library/platforms');

export const addPlatform = (data) =>
  api.post('/api/v1/library/platforms', data);

export const removePlatform = (platformId) =>
  api.delete(`/api/v1/library/platforms/${platformId}`);
