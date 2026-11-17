// Lucky Frontend router: hash routes for board, bounty, leaderboard, profile.
// Sets window.__shotReady false while a route loads and true once rendered.
import * as api from './api.js';
import { toArr, catsOf, slugOf, timeLeft } from './format.js';
import { loadingHtml, errorHtml, emptyHtml, boardHtml, bountyHtml, leaderboardHtml, profileHtml } from './views.js';

const rootEl = document.getElementById('app');
const state = { q: '', cat: 'All', sort: 'soon', board: null };
const errMsg = (e) => 'The make.fun API could not be reached (' + (e?.message || 'network error') + '). Check your connection and retry.';

function render(html) {
  rootEl.innerHTML = html;
  rootEl.querySelectorAll('img[data-av]').forEach((img) => img.addEventListener('error', () => img.remove()));
  const retry = rootEl.querySelector('[data-retry]');
  if (retry) retry.addEventListener('click', () => route());
  window.__shotReady = true;
}
function fail(e) { render(errorHtml(errMsg(e))); }

function drawBoard() {
  const all = state.board || [];
  const cats = [...new Set(all.flatMap((c) => catsOf(c.category)))].sort();
  let items = all.filter((c) => {
    if (state.cat !== 'All' && !catsOf(c.category).includes(state.cat)) return false;
    if (!state.q) return true;
    const hay = (String(c.title || '') + ' ' + catsOf(c.category).join(' ') + ' ' + toArr(c.skills).join(' ')).toLowerCase();
    return hay.includes(state.q.toLowerCase());
  });
  const by = { soon: (a, b) => (Number(Date.parse(b.deadline) > Date.now()) - Number(Date.parse(a.deadline) > Date.now())) || (Date.parse(a.deadline) || Infinity) - (Date.parse(b.deadline) || Infinity), pot: (a, b) => (b.rewardAmount || 0) - (a.rewardAmount || 0), entries: (a, b) => (b.submissionCount || 0) - (a.submissionCount || 0) };
  items = [...items].sort(by[state.sort]);
  render(boardHtml(items, cats, state));
  const q = rootEl.querySelector('#q'), sort = rootEl.querySelector('#sort');
  if (q) { q.addEventListener('input', () => { state.q = q.value; const pos = q.selectionStart; drawBoard(); const nq = rootEl.querySelector('#q'); nq.focus(); nq.setSelectionRange(pos, pos); }); }
  if (sort) sort.addEventListener('change', () => { state.sort = sort.value; drawBoard(); });
  rootEl.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { state.cat = b.dataset.cat; drawBoard(); }));
  // Progressive pot upgrade: add collected entry fees to each card's pot.
  for (const c of items) { const slug = slugOf(c); if (!slug) continue;
    api.entryFee(slug).then((f) => { const fees = Number(f?.pot?.fees_usd ?? f?.fees_usd ?? 0); if (!fees) return; const el = rootEl.querySelector(`[data-pot="${CSS.escape(slug)}"]`); if (el) el.textContent = '$' + ((Number(c.rewardAmount) || 0) + fees).toLocaleString('en-US'); }).catch(() => {}); }
}
async function showBoard() {
  if (state.board) { drawBoard(); try { const d = await api.board(); state.board = toArr(d?.items ?? d); drawBoard(); } catch { /* keep cached board */ } return; }
  rootEl.innerHTML = loadingHtml('live bounties');
  try { const d = await api.board(); state.board = toArr(d?.items ?? d); if (!state.board.length) return render(emptyHtml('No open bounties right now — check back soon.')); drawBoard(); }
  catch (e) { fail(e); }
}
async function showBounty(slug) {
  rootEl.innerHTML = loadingHtml('bounty');
  try {
    let c = api.cachedBoardItem(slug);
    const [fresh, fee] = await Promise.all([api.bounty(slug).catch(() => null), api.entryFee(slug).catch(() => null)]);
    c = fresh || c; if (!c) throw new Error('bounty not found');
    render(bountyHtml(c, fee));
  } catch (e) { fail(e); }
}
async function showLeaderboard(slug) {
  rootEl.innerHTML = loadingHtml('leaderboard');
  try { render(leaderboardHtml(await api.leaderboard(slug), slug)); } catch (e) { fail(e); }
}
async function showProfile(handle) {
  rootEl.innerHTML = loadingHtml('profile');
  try { const [p, r] = await Promise.all([api.profile(handle), api.rankings(handle).catch(() => null)]); render(profileHtml(p, handle, r)); }
  catch (e) { fail(e); }
}
function route() {
  window.__shotReady = false;
  window.scrollTo(0, 0);
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (!parts.length) return showBoard();
  if (parts[0] === 'bounty' && parts[1] && parts[2] === 'leaderboard') return showLeaderboard(parts[1]);
  if (parts[0] === 'bounty' && parts[1]) return showBounty(parts[1]);
  if (parts[0] === 'u' && parts[1]) return showProfile(parts[1]);
  return showBoard();
}
window.addEventListener('hashchange', route);
setInterval(() => { document.querySelectorAll('[data-dl]').forEach((el) => { el.textContent = timeLeft(el.dataset.dl); }); }, 30000);
route();
