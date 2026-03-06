/**
 * Resolves the base URL of the Hono/Cloudflare Worker API.
 *
 * Priority:
 *  1. VITE_API_URL env var (explicit override, e.g. for staging environments)
 *  2. localhost:8787  — local Wrangler dev server (Vite runs on a different port)
 *  3. window.location.origin — deployed Worker serves both the SPA and /api/* on the same domain
 */
export const API_URL: string =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:8787');
