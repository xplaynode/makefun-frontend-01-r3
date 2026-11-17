// Lucky Frontend views: board, bounty, leaderboard and profile renderers.
// Every value is escaped and normalized; each view ships loading, error
// and empty states so no API shape can leave a blank or broken surface.
import { esc, toArr, toStr, toNum, toObj, catsOf, money, feeText, slugOf, titleOf, sponsorOf, timeLeft, dateText, isOpen, scoreText, nameOf } from './format.js';

export const loadingHtml = (label) => `<section class="panel" aria-busy="true"><p class="muted">Loading ${esc(label)}…</p><div class="skel"></div><div class="skel short"></div></section>`;
export const errorHtml = (msg) => `<section class="panel"><h2>Something went wrong</h2><p class="muted">${esc(msg)}</p><button class="btn" data-retry type="button">Retry</button></section>`;
export const emptyHtml = (label) => `<section class="panel"><h2>Nothing here yet</h2><p class="muted">${esc(label)}</p></section>`;
const chips = (list) => toArr(list).map((x) => `<span class="chip">${esc(toStr(typeof x === 'object' ? x.name ?? x.label : x))}</span>`).join('');

export function cardHtml(c, pot) {
  const slug = slugOf(c), cats = catsOf(c.category);
  const shown = pot != null ? pot : toNum(c.rewardAmount ?? c.reward_usd, NaN);
  return `<article class="card">
    <h3><a href="#/bounty/${esc(encodeURIComponent(slug))}">${esc(titleOf(c))}</a></h3>
    <p class="meta">${esc(cats.join(' · ') || 'Open bounty')} · by ${esc(sponsorOf(c))}</p>
    <p class="stats"><strong data-pot="${esc(slug)}">${Number.isFinite(shown) ? money(shown) : '—'}</strong> pot · ${esc(feeText(c))}</p>
    <p class="stats"><span data-dl="${esc(toStr(c.deadline))}">${esc(timeLeft(c.deadline))}</span> · ${toNum(c.submissionCount ?? c.submissions ?? c.entries, 0)} entries</p>
    <p class="meta">${isOpen(c) ? 'Accepting entries' : 'Deadline passed'}</p></article>`;
}
export function boardHtml(items, cats, state) {
  const chipRow = ['All', ...cats].map((c) => `<button type="button" class="fchip${state.cat === c ? ' on' : ''}" data-cat="${esc(c)}" aria-pressed="${state.cat === c}">${esc(c)}</button>`).join('');
  const cards = items.length ? items.map((c) => cardHtml(c)).join('') : '<p class="muted">No bounties match your filters.</p>';
  return `<section><h2>Live bounties</h2>
  <div class="controls" role="search"><label class="sr" for="q">Search bounties</label><input id="q" type="search" placeholder="Search title, category, skills…" value="${esc(state.q)}">
  <label class="sr" for="sort">Sort bounties</label><select id="sort"><option value="soon"${state.sort === 'soon' ? ' selected' : ''}>Ending soon</option><option value="pot"${state.sort === 'pot' ? ' selected' : ''}>Biggest pot</option><option value="entries"${state.sort === 'entries' ? ' selected' : ''}>Most entries</option></select></div>
  <div class="chips" aria-label="Filter by category">${chipRow}</div>
  <div class="grid">${cards}</div></section>`;
}
export function descHtml(raw) {
  const text = toStr(raw); if (!text) return '<p class="muted">No description published.</p>';
  return text.split(/\n{2,}/).map((block) => {
    const lines = block.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!lines.length) return '';
    if (lines.every((l) => l.startsWith('- '))) return '<ul>' + lines.map((l) => `<li>${esc(l.slice(2))}</li>`).join('') + '</ul>';
    return lines.map((l) => l.startsWith('## ') ? `<h3>${esc(l.slice(3))}</h3>` : l.startsWith('# ') ? `<h3>${esc(l.slice(2))}</h3>` : `<p>${esc(l)}</p>`).join('');
  }).join('');
}
export function bountyHtml(c, fee) {
  const slug = slugOf(c);
  const pot = toNum(c.rewardAmount ?? c.reward_usd, 0) + toNum(fee?.pot?.fees_usd ?? fee?.fees_usd, 0);
  const rewards = toObj(c.rewards ?? c.reward_table);
  const rows = Object.entries(rewards).map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(typeof v === 'object' ? money(v.amount ?? v.usd) : money(v))}</td></tr>`).join('');
  return `<article><p class="meta"><a href="#/">← All bounties</a></p><h2>${esc(titleOf(c))}</h2>
  <p class="stats"><strong>${money(pot)}</strong> live pot · ${esc(feeText(c))} · <span data-dl="${esc(toStr(c.deadline))}">${esc(timeLeft(c.deadline))}</span>${c.deadline ? ' (ends ' + esc(dateText(c.deadline)) + ')' : ''} · ${toNum(c.submissionCount ?? c.submissions, 0)} entries</p>
  <p class="meta">Sponsored by ${esc(sponsorOf(c))} · ${isOpen(c) ? 'Accepting entries' : 'Deadline passed'}</p>
  <p>${chips(catsOf(c.category))} ${chips(toArr(c.skills))}</p>
  <div class="actions"><a class="btn" href="#/bounty/${esc(encodeURIComponent(slug))}/leaderboard">Leaderboard</a> <a class="btn ghost" href="https://make.fun/bounty/${esc(encodeURIComponent(slug))}">Open on make.fun</a></div>
  ${rows ? `<h3>Rewards</h3><table><tbody>${rows}</tbody></table>` : ''}
  <h3>About this bounty</h3><div class="desc">${descHtml(c.description ?? c.summary)}</div></article>`;
}
export function leaderboardHtml(data, slug) {
  const comp = toObj(data?.competition), entries = toArr(data?.entries ?? data?.rows);
  const paid = toNum(data?.paid_places ?? data?.paidPlaces, 0);
  const held = data?.phase?.placements_held ?? data?.placements_held;
  if (!entries.length) return `<article><p class="meta"><a href="#/bounty/${esc(encodeURIComponent(slug))}">← Bounty</a></p><h2>Leaderboard</h2>${emptyHtml('No entries have been ranked for this bounty yet.')}</article>`;
  const rows = entries.map((e, i) => { const name = nameOf(e); const rank = toNum(e?.rank ?? e?.prize_rank, i + 1); const isPaid = paid > 0 ? rank <= paid : e?.prize_eligible === true;
    return `<tr${isPaid ? ' class="paid"' : ''}><td>${rank}${isPaid ? ' <span class="tag">paid</span>' : ''}</td><td><a href="#/u/${esc(encodeURIComponent(name))}">${esc(name)}</a></td><td>${esc(scoreText(e))}</td><td>${esc(toStr(e?.stage ?? e?.status, '—'))}</td></tr>`; }).join('');
  return `<article><p class="meta"><a href="#/bounty/${esc(encodeURIComponent(slug))}">← ${esc(titleOf(comp) || 'Bounty')}</a></p><h2>Leaderboard</h2>
  ${held ? '<p class="muted">Placements are provisional while judging finishes.</p>' : ''}
  <table><thead><tr><th scope="col">Rank</th><th scope="col">Entrant</th><th scope="col">Score</th><th scope="col">Stage</th></tr></thead><tbody>${rows}</tbody></table></article>`;
}
export function profileHtml(p, handle, ranking) {
  if (!p) return emptyHtml('This profile could not be found on make.fun.');
  const name = toStr(p.displayName ?? p.display_name ?? p.name, handle);
  const stats = [];
  for (const [label, v] of [['Entries', p.entries ?? p.entryCount ?? p.submissions], ['Wins', p.wins ?? p.winCount], ['Earnings', p.earnings ?? p.totalEarned]]) if (v != null) stats.push(`<p class="stats"><strong>${esc(typeof v === 'number' ? v.toLocaleString('en-US') : toStr(v))}</strong> ${label.toLowerCase()}</p>`);
  const rk = toObj(ranking); if (rk.rank != null || rk.rating != null) stats.push(`<p class="stats"><strong>${esc(toStr(rk.rank ?? rk.rating))}</strong> ranking</p>`);
  const recent = toArr(p.recentEntries ?? p.entries_list ?? p.recent);
  const list = recent.slice(0, 8).map((e) => { const s = slugOf(e); return s ? `<li><a href="#/bounty/${esc(encodeURIComponent(s))}">${esc(titleOf(e))}</a></li>` : `<li>${esc(nameOf(e))}</li>`; }).join('');
  return `<article><div class="profile"><span class="avatar" aria-hidden="true">${esc(toStr(handle).slice(0, 1).toUpperCase() || '?')}</span><img class="avatar-img" data-av crossorigin="anonymous" alt="" src="https://make.fun/api/profiles/${esc(encodeURIComponent(handle))}/picture.png"><div><h2>${esc(name)}</h2><p class="meta">@${esc(handle)}${(p.joined ?? p.createdAt) ? ' · joined ' + esc(dateText(p.joined ?? p.createdAt)) : ''}</p></div></div>
  ${p.bio ? `<p>${esc(toStr(p.bio))}</p>` : '<p class="muted">No bio published.</p>'}${stats.join('')}
  ${list ? `<h3>Recent entries</h3><ul>${list}</ul>` : ''}</article>`;
}
