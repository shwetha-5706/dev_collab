/** API base URL — empty string uses same-origin `/api` (Vite proxy in dev, Express in prod). */
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Socket.IO server URL — empty string uses same origin. */
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? '';

export function apiUrl(path: string) {
  const base = API_BASE.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : `/api${p}`;
}
