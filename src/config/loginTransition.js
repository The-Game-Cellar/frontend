const num = (raw, fallback) => {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const MIN_FIRST_MS = num(import.meta.env.VITE_LOGIN_TRANSITION_MIN_MS, 700);
export const MIN_REPEAT_MS = num(import.meta.env.VITE_LOGIN_TRANSITION_MIN_MS_REPEAT, 200);
export const MAX_MS = num(import.meta.env.VITE_LOGIN_TRANSITION_MAX_MS, 1500);

export const FIRST_LOGIN_FLAG = 'cellar:first_login_done';

export const isFirstLogin = () => {
  try {
    return localStorage.getItem(FIRST_LOGIN_FLAG) !== '1';
  } catch {
    return true;
  }
};

export const markFirstLoginDone = () => {
  try {
    localStorage.setItem(FIRST_LOGIN_FLAG, '1');
  } catch {
    // localStorage unavailable — silently skip; user just sees the long version every time
  }
};
