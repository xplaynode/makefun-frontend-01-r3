// Lucky Frontend formatting + defensive normalizers.
// The live API varies field shapes (string vs array vs object vs null),
// so every field passes through one of these helpers before rendering.
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const toStr = (v, d = '') => (typeof v === 'string' ? v : v == null ? d : typeof v === 'number' || typeof v === 'boolean' ? String(v) : d);
export const toNum = (v, d = 0) => { const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN; return Number.isFinite(n) ? n : d; };
export const toArr = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
export const toObj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
export const catsOf = (c) => toArr(c).map((x) => toStr(typeof x === 'object' ? x.name ?? x.label ?? x.slug : x)).filter(Boolean);
export const money = (v) => { const n = toNum(v, NaN); return Number.isFinite(n) ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) : '—'; };
export const feeText = (c) => { const f = toNum(c?.entryFeeUsd ?? c?.entry_fee_usd ?? c?.feeUsd, 0); return f > 0 ? money(f) + ' entry' : 'Free entry'; };
export const slugOf = (c) => toStr(c?.slug ?? c?.id);
export const titleOf = (c) => toStr(c?.title ?? c?.name, 'Untitled bounty');
export const sponsorOf = (c) => { const s = c?.sponsor; return toStr(typeof s === 'object' ? s?.name ?? s?.slug : s, 'make.fun'); };
export function timeLeft(iso, now = Date.now()) {
  const t = Date.parse(toStr(iso)); if (!Number.isFinite(t)) return 'No deadline';
  const ms = t - now; if (ms <= 0) return 'Closed';
  const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
  return d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m % 60}m left` : `${m}m left`;
}
export const dateText = (iso) => { const t = Date.parse(toStr(iso)); return Number.isFinite(t) ? new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; };
export const isOpen = (c, now = Date.now()) => { const t = Date.parse(toStr(c?.deadline)); return !Number.isFinite(t) || t > now; };
export const scoreText = (e) => {
  const micro = toNum(e?.judge_win_rate_micro ?? e?.values?.judge ?? e?.values?.judge_win_rate_micro, NaN);
  if (Number.isFinite(micro)) return (micro / 10000).toFixed(1) + '% win rate';
  for (const k of ['score', 'win_rate', 'winRate', 'rate', 'points']) { const n = toNum(e?.[k], NaN); if (Number.isFinite(n)) return k === 'win_rate' || k === 'winRate' ? (n <= 1 ? (n * 100).toFixed(1) + '%' : String(n)) : String(n); }
  return '—';
};
export const nameOf = (e) => toStr(e?.handle ?? e?.entrant ?? e?.username ?? e?.name ?? e?.user?.handle, 'anonymous');
