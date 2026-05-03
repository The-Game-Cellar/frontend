import api from './api';

// ─── Recently-shown set (localStorage) ──────────────────────────────────────
// Session-scoped set of IGDB ids the user has been shown on the Recommendations
// page. Sent as `recentlyShownIds` on every /personalized fetch so the backend
// applies a soft score penalty — recently-shown games drop out of MMR top picks
// but resurface if the candidate pool runs dry, so the system never returns
// truly empty. Cleared on logout / deleteAccount; otherwise grows for the
// length of the session. Hard ceiling at 2000 ids as a runaway-guard against
// extreme browse sessions blowing the URL length budget.

const SHOWN_KEY = 'cellar:recs:shown';
const SHOWN_HARD_CAP = 2000;

export const getRecentlyShownIds = () => {
  try {
    const raw = localStorage.getItem(SHOWN_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(n => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
};

export const addRecentlyShownIds = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const fresh = ids.filter(n => Number.isInteger(n));
  if (fresh.length === 0) return;
  const current = getRecentlyShownIds();
  const seen = new Set(current);
  const merged = [...current];
  for (const id of fresh) {
    if (seen.has(id)) continue;
    merged.push(id);
    seen.add(id);
  }
  const trimmed = merged.length > SHOWN_HARD_CAP ? merged.slice(merged.length - SHOWN_HARD_CAP) : merged;
  try {
    localStorage.setItem(SHOWN_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full / disabled — ignore
  }
};

export const clearRecentlyShownIds = () => {
  try {
    localStorage.removeItem(SHOWN_KEY);
  } catch {
    // ignore
  }
};

// POST rather than GET because recentlyShownIds grows uncapped with session activity and
// would blow Tomcat's default 8KB header buffer on the URL path. Body has no such limit.
export const getPersonalized = (limit = 10) => {
  const recentlyShownIds = getRecentlyShownIds();
  return api.post('/api/v1/recommendations/personalized', { limit, recentlyShownIds });
};

// Row-based variant — returns { rows: [{ label, genre, fallback, games[] }], tier, emptyMessage }.
export const getPersonalizedGrouped = () => {
  const recentlyShownIds = getRecentlyShownIds();
  return api.post('/api/v1/recommendations/personalized/grouped', { recentlyShownIds });
};

export const getWildCard = (limit = 10) =>
  api.get('/api/v1/recommendations/wildcard', { params: { limit } });

export const getSimilar = (gameId, limit = 10) =>
  api.get(`/api/v1/recommendations/similar/${gameId}`, { params: { limit } });

export const getBasedOn = (gameId, limit = 10) =>
  api.get(`/api/v1/recommendations/because-you-liked/${gameId}`, { params: { limit } });

export const getDashboard = () =>
  api.get('/api/v1/recommendations/dashboard');

// ─── Prefetch cache for /dashboard ──────────────────────────────────────────
// Two-slot cache mirroring the /personalized pattern: loadedDashboard restores
// the rendered Dashboard payload across navigations; nextDashboardPromise
// holds the in-flight fetch fired right after login so the first Dashboard
// render is instant. Both clear on logout / library mutation.

let loadedDashboard = null;       // dashboard payload | null
let nextDashboardPromise = null;  // Promise<payload> | null

const fetchDashboardPayload = () =>
  getDashboard().then(res => res.data ?? null).catch(() => null);

export const prefetchDashboard = () => {
  if (nextDashboardPromise) return nextDashboardPromise;
  nextDashboardPromise = fetchDashboardPayload();
  return nextDashboardPromise;
};

export const consumePrefetchedDashboard = () => {
  const p = nextDashboardPromise;
  nextDashboardPromise = null;
  return p;
};

export const getLoadedDashboard = () => loadedDashboard;

export const setLoadedDashboard = (payload) => {
  loadedDashboard = payload ?? null;
};

export const invalidateDashboard = () => {
  loadedDashboard = null;
  nextDashboardPromise = null;
};

// ─── Prefetch cache for /personalized ───────────────────────────────────────
// Two-slot module cache that survives SPA navigations:
//   - loadedGames: the currently-rendered list. Restored when the user leaves
//     Recommendations and comes back, so the page is consistent within a session.
//   - nextBatchPromise: the next batch waiting in the wings. Dashboard kicks
//     the first prefetch; Recommendations consumes when no loadedGames exist.
//     fetchMore (last-page boundary) consumes the ready batch + queues another.
// Both slots clear on logout / deleteAccount and on any library mutation.
// Failed HTTP resolves to [] so callers never have to handle reject.

let loadedGames = null;        // Game[] | null
let nextBatchPromise = null;   // Promise<Game[]> | null

const fetchPersonalizedBatch = (limit) =>
  getPersonalized(limit).then(res => Array.isArray(res.data) ? res.data : []);

export const prefetchPersonalized = (limit = 100) => {
  if (nextBatchPromise) return nextBatchPromise;
  nextBatchPromise = fetchPersonalizedBatch(limit).catch(() => []);
  return nextBatchPromise;
};

export const consumePrefetchedPersonalized = () => {
  const p = nextBatchPromise;
  nextBatchPromise = null;
  return p;
};

export const getLoadedPersonalized = () => loadedGames;

export const setLoadedPersonalized = (games) => {
  loadedGames = Array.isArray(games) ? games : null;
};

export const invalidatePrefetchedPersonalized = () => {
  loadedGames = null;
  nextBatchPromise = null;
};
