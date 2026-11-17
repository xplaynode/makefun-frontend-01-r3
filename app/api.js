// Lucky Frontend API layer: GET-only access to make.fun's public API.
// In-memory cache, ETag revalidation (tags turn over each minute) and
// de-duplication of concurrent identical requests keep views cheap.
const BASE = 'https://make.fun';
const cache = new Map();
const flying = new Map();
export function get(path, { soft404 = false } = {}) {
  if (flying.has(path)) return flying.get(path);
  const hit = cache.get(path);
  const p = (async () => {
    try {
      const headers = hit?.etag ? { 'If-None-Match': hit.etag } : {};
      const r = await fetch(BASE + path, { headers });
      if (r.status === 304 && hit) return hit.data;
      if (r.status === 404 && soft404) return null;
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      cache.set(path, { data, etag: r.headers.get('etag') });
      return data;
    } finally { flying.delete(path); }
  })();
  flying.set(path, p);
  return p;
}
export const board = () => get('/api/competitions?status=open');
export const bounty = (slug) => get('/api/competitions/' + encodeURIComponent(slug));
export const entryFee = (slug) => get('/api/competitions/' + encodeURIComponent(slug) + '/entry-fee', { soft404: true });
export const leaderboard = (slug) => get('/api/competitions/' + encodeURIComponent(slug) + '/leaderboard');
export const profile = (handle) => get('/api/profiles/' + encodeURIComponent(handle), { soft404: true });
export const rankings = (handle) => get('/api/rankings/' + encodeURIComponent(handle), { soft404: true });
export function cachedBoardItem(slug) {
  const hit = cache.get('/api/competitions?status=open');
  const items = Array.isArray(hit?.data?.items) ? hit.data.items : Array.isArray(hit?.data) ? hit.data : [];
  return items.find((c) => (c?.slug ?? c?.id) === slug) ?? null;
}
