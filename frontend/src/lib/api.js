/*
 * Where the optimisation API lives.
 *
 * Set VITE_API_URL at build time to point the deployed frontend at the
 * deployed backend. Vite inlines it, so it must be present when `npm run
 * build` runs, not at runtime. Falls back to the local Flask dev server.
 */
const RAW = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:5000";

/* Trailing slashes would double up when joined with a path. */
export const API_BASE = RAW.replace(/\/+$/, "");

export const apiUrl = (path) =>
  `${API_BASE}/${String(path).replace(/^\/+/, "")}`;
