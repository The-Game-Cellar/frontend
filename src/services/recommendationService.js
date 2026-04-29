import api from './api';

export const getPersonalized = (limit = 10) =>
  api.get('/api/v1/recommendations/personalized', { params: { limit } });

export const getWildCard = (limit = 10) =>
  api.get('/api/v1/recommendations/wildcard', { params: { limit } });

export const getSimilar = (gameId, limit = 10) =>
  api.get(`/api/v1/recommendations/similar/${gameId}`, { params: { limit } });

export const getBasedOn = (gameId, limit = 10) =>
  api.get(`/api/v1/recommendations/because-you-liked/${gameId}`, { params: { limit } });

export const getDashboard = () =>
  api.get('/api/v1/recommendations/dashboard');
