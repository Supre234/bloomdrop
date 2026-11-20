/* bloomdrop — no backend: a bouquet is encoded into the share link itself. */
(() => {
'use strict';

// ───────────── data ─────────────
// Order of these arrays is part of the share-link format: only ever append.
const INK = '#1b1420';
const COLORS = ['#ff7eb6', '#ff4d5e', '#ff9b54', '#ffd23f', '#b79cff', '#6ec5ff', '#fff8ef', '#e84fd0'];
const WRAPS = ['#f3d9b1', '#ffc2dc', '#cfc0ff', '#bfe8ff', '#d9f99d', '#fff8ef', '#2b2330'];
const RIBBONS = ['#ff4d5e', '#ff7eb6', '#b79cff', '#ffd23f', '#6ec5ff', '#fff8ef', '#1b1420'];
const BGS = ['#ffe3ef', '#e4dbff', '#e6fab5', '#fff1b8', '#d6efff', '#fff6ea'];
const MAX_STEMS = 12;
// Secret lotus petal colours as [tip, base]. Part of the link format: only ever append.
const LOTUS_COLORS = [['#ff4f93', '#fff0f6'], ['#ffb3cf', '#ffffff'], ['#9d7bff', '#f5f0ff'], ['#ff8a4c', '#fff3e8'], ['#ffc83d', '#fffbea']];

const FLOWERS = [
  { id: 'rose', name: 'rose', c: 1, means: 'i love u, no notes.' },
  { id: 'tulip', name: 'tulip', c: 0, means: 'fresh start energy.' },
  { id: 'daisy', name: 'daisy', c: 6, means: 'pure bestie behaviour.' },
  { id: 'sunflower', name: 'sunflower', c: 3, means: 'u light up every room.' },
  { id: 'lavender', name: 'lavender', c: 4, means: 'breathe. i got u.' },
  { id: 'blossom', name: 'blossom', c: 0, means: 'soft era, activated.' },
  { id: 'lily', name: 'lily', c: 2, means: 'so, so proud of u.' },
  { id: 'baby', name: "baby's breath", c: 6, means: 'the forever kind.' },
  { id: 'star', name: 'starbloom', c: 3, means: 'ur literally a star.', lock: { k: 'best', n: 3, label: '3-day streak' } },
  // Temporarily unlocked for everyone. To re-lock, add back: lock: { k: 'sent', n: 3, label: 'send 3 bouquets' }
  { id: 'heart', name: 'heartbud', c: 1, means: 'big feelings only.' },
  { id: 'moon', name: 'moonflower', c: 4, means: 'thinking of u at 2am.', lock: { k: 'best', n: 7, label: '7-day streak' } },
  // Legacy lotus-in-a-bouquet, kept only so older links still render. The lotus is now its own gift: see lotusSVG.
  { id: 'lotus', name: 'lotus', c: 0, means: 'rising through everything, for u.', hidden: true },
];

const PRESETS = [
  { title: 'soft launch', sub: 'for the crush u keep mentioning', f: [[0, 0], [0, 0], [5, 6], [7, 6], [0, 1], [7, 6], [5, 0]], w: [0, 1, 0, 0], g: 1, bg: 0, m: "ok so i've been thinking about u a normal amount (a lot)." },
  { title: 'main character', sub: 'hype for someone who ate', f: [[3, 3], [3, 3], [2, 6], [3, 3], [6, 2], [2, 6]], w: [0, 0, 2, 3], g: 1, bg: 3, m: 'u did THAT. so proud of u it’s actually embarrassing.' },
  { title: 'sorry bestie', sub: 'when u were the problem', f: [[1, 0], [1, 4], [2, 6], [1, 7], [7, 6], [1, 0]], w: [0, 5, 1, 2], g: 1, bg: 1, m: 'i was wrong and i hate it. forgive me? i’ll bring snacks.' },
  { title: 'bday behaviour', sub: 'another lap around the sun', f: [[5, 0], [3, 3], [1, 7], [2, 6], [6, 2], [0, 1], [4, 4], [5, 5]], w: [0, 2, 1, 3], g: 1, bg: 4, m: 'happy birthday!! the world got way better the day u showed up.' },
  { title: 'touch grass', sub: 'for the stressed & overbooked', f: [[4, 4], [4, 4], [7, 6], [2, 6], [4, 4], [7, 6]], w: [1, 0, 0, 2], g: 1, bg: 2, m: 'u are doing so much. pls drink water and take a nap. love u.' },
  { title: 'just because', sub: 'no reason. that’s the reason.', f: [[6, 2], [5, 0], [0, 0], [6, 7], [5, 6], [7, 6], [1, 2]], w: [0, 3, 0, 1], g: 1, bg: 5, m: 'saw flowers, thought of u. that’s it. that’s the message.' },
];

const PROMPTS = [
  'who made today 1% easier?',
  'who would u call if u got amazing news right now?',
  'who haven’t u texted in way too long?',
  'who showed up for u when it was inconvenient?',
  'who laughs at ur worst jokes?',
  'who deserves a “proud of u” today?',
  'who made u feel seen this week?',
  'who are u lowkey missing right now?',
  'who believed in u before u did?',
  'who’s having a rough week and won’t say it?',
  'who taught u something u still use?',
  'who’s ur 2am person?',
  'who do u owe an apology (or a thank u)?',
  'who makes boring errands fun?',
];

const STARTERS = ['thinking of u bc…', 'proud of u for…', 'thank u for…', 'sorry about…', 'remember when…', 'no reason, just…'];

// Part of the reaction-link format: only ever append.
const REACTS = [['😭', 'crying'], ['🥹', 'ily'], ['🫶', 'obsessed'], ['😂', 'lmaooo'], ['🙏', 'ur forgiven'], ['🌷', 'thank u']];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// ───────────── tiny helpers ─────────────
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clampInt = (v, n) => { v = Number.isInteger(v) ? v : 0; return v < 0 || v >= n ? 0 : v; };
const rnd = (n) => Math.floor(Math.random() * n);
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayNum = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
/** A bouquet with `at` stays sealed until local midnight of that date. */
const isSealed = (d) => !!d.at && d.at > dayKey();
function fmtDate(at) {
  const [y, m, day] = at.split('-').map(Number);
  return `${day} ${MONTHS[m - 1]}${y !== new Date().getFullYear() ? ' ' + y : ''}`;
}

function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

// ───────────── storage ─────────────
const KEY = 'bloomdrop.v1';
let store = { streak: 0, best: 0, last: '', sent: [], recv: [], waiting: [], dates: [], sentCount: 0, from: '' };
try { Object.assign(store, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* private mode etc. */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } };

function tickStreak() {
  const today = dayKey();
  if (store.last === today) return false;
  const y = new Date(); y.setDate(y.getDate() - 1);
  store.streak = store.last === dayKey(y) ? store.streak + 1 : 1;
  store.best = Math.max(store.best, store.streak);
  store.last = today;
  save();
  return true;
}

const progress = (lock) => Math.min(lock.k === 'best' ? store.best : store.sentCount, lock.n);
const unlocked = (f) => !f.lock || progress(f.lock) >= f.lock.n;

// ───────────── drawing ─────────────
const S = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;

function head(type, c) {
  const dark = mix(c, INK, 0.3), light = mix(c, '#ffffff', 0.45);
  const centre = c === '#ffd23f' ? '#ff9b54' : '#ffd23f';
  let o = '';
  switch (type) {
    case 'rose':
      return `<circle r="25" fill="${c}" ${S}/><path d="M-14,-6 C-8,-20 12,-18 15,-4 C17,8 4,16 -6,11 C-13,7 -10,-4 -2,-5 C4,-5 6,2 1,4" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`;
    case 'tulip':
      return `<path d="M-20,-6 C-20,26 20,26 20,-6 L20,-24 L9,-11 L0,-28 L-9,-11 L-20,-24 Z" fill="${c}" ${S}/><path d="M-8,-4 Q-6,10 0,17 M8,-4 Q6,10 0,17" fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>`;
    case 'daisy':
      for (let i = 0; i < 10; i++) o += `<ellipse cy="-17" rx="6.5" ry="13" fill="${c}" ${S} transform="rotate(${i * 36})"/>`;
      return o + `<circle r="9" fill="${centre}" ${S}/>`;
    case 'sunflower':
      for (let i = 0; i < 14; i++) o += `<path d="M0,-31 Q8,-17 0,-8 Q-8,-17 0,-31Z" fill="${c}" ${S} transform="rotate(${i * 25.7})"/>`;
      return o + `<circle r="13" fill="#7a4a2b" ${S}/><circle cx="-4" cy="-3" r="1.8" fill="${INK}"/><circle cx="4" cy="-2" r="1.8" fill="${INK}"/><circle cx="0" cy="5" r="1.8" fill="${INK}"/>`;
    case 'lavender':
      for (let k = 5; k >= 0; k--) {
        const y = -30 + k * 9;
        o += `<ellipse cx="-7" cy="${y}" rx="7" ry="5.5" fill="${c}" ${S} transform="rotate(-25 -7 ${y})"/><ellipse cx="7" cy="${y}" rx="7" ry="5.5" fill="${c}" ${S} transform="rotate(25 7 ${y})"/>`;
      }
      return o + `<ellipse cy="-38" rx="6" ry="7" fill="${light}" ${S}/>`;
    case 'blossom':
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        o += `<circle cx="${(Math.cos(a) * 14).toFixed(1)}" cy="${(Math.sin(a) * 14).toFixed(1)}" r="12.5" fill="${c}" ${S}/>`;
      }
      return o + `<circle r="7" fill="${centre}" ${S}/>`;
    case 'lily':
      for (let i = 0; i < 6; i++) o += `<path d="M0,-33 Q13,-14 0,0 Q-13,-14 0,-33Z" fill="${i % 2 ? light : c}" ${S} transform="rotate(${i * 60})"/>`;
      return o + `<circle cx="-4" cy="-3" r="2.5" fill="${dark}"/><circle cx="4" cy="-3" r="2.5" fill="${dark}"/><circle cx="0" cy="4" r="2.5" fill="${dark}"/>`;
    case 'baby': {
      const pts = [[-18, -8], [-6, -22], [10, -20], [20, -4], [-10, 4], [6, 0], [0, -10]];
      o = pts.map(([x, y]) => `<path d="M0,18 L${x},${y}" stroke="#2f7d4a" stroke-width="2" fill="none"/>`).join('');
      return o + pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${c}" ${S}/>`).join('');
    }
    case 'star': {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 14 : 30, a = (i * 36 - 90) * Math.PI / 180;
        d += `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
      }
      return `<path d="${d}Z" fill="${c}" ${S}/><circle cx="-6" cy="-2" r="2.4" fill="${INK}"/><circle cx="6" cy="-2" r="2.4" fill="${INK}"/><path d="M-5,6 Q0,11 5,6" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
    }
    case 'heart':
      return `<path d="M0,26 C-40,0 -26,-30 0,-12 C26,-30 40,0 0,26Z" fill="${c}" ${S}/><path d="M-17,-9 Q-12,-15 -6,-12" fill="none" stroke="${light}" stroke-width="4" stroke-linecap="round"/>`;
    case 'lotus': {
      const P = 'M0,10 C-11,-4 -9,-24 0,-34 C9,-24 11,-4 0,10Z';
      const pet = (a, f) => `<path d="${P}" fill="${f}" ${S} transform="rotate(${a} 0 10)"/>`;
      return pet(-68, light) + pet(68, light) + pet(-36, c) + pet(36, c) + pet(0, c)
        + `<ellipse cy="-1" rx="7" ry="3.5" fill="#ffd23f" ${S}/>`
        + `<path d="M0,14 C-12,12 -24,4 -30,-6 C-16,-8 -6,0 0,14Z" fill="${light}" ${S}/><path d="M0,14 C12,12 24,4 30,-6 C16,-8 6,0 0,14Z" fill="${light}" ${S}/>`;
    }
    case 'moon':
      for (let i = 0; i < 8; i++) o += `<ellipse cy="-22" rx="8" ry="11" fill="${light}" ${S} transform="rotate(${i * 45})"/>`;
      return o + `<circle r="17" fill="${c}" ${S}/><path d="M5,-11 A12,12 0 1 0 11,7 A9.5,9.5 0 1 1 5,-11Z" fill="#fff8ef" stroke="${INK}" stroke-width="1.5"/>`;
  }
  return '';
}

const flowerIcon = (f, ci) => `<svg viewBox="-36 -44 72 78" aria-hidden="true">${head(f.id, COLORS[ci ?? f.c])}</svg>`;

let uid = 0;
/** Render a bouquet to an SVG string. opts.bg paints a backdrop; opts.pop animates that stem. */
function bouquetSVG(d, opts = {}) {
  const id = ++uid, n = d.f.length;
  const [wStyle, wCol, wPat, rib] = d.w;
  const paper = WRAPS[wCol], ribbon = RIBBONS[rib];
  const tieY = wStyle === 0 ? 384 : 352;
  const scale = n <= 5 ? 1.25 : n <= 8 ? 1.12 : 1;

  const pos = d.f.map((_, i) => {
    const r = n === 1 ? 0 : Math.sqrt(i / (n - 1)), a = (i * 137.5 - 90) * Math.PI / 180;
    return { i, x: 200 + Math.cos(a) * 104 * r, y: 152 + Math.sin(a) * 76 * r };
  });

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 460" role="img" aria-label="${n} flower bouquet">`;
  s += `<defs><pattern id="p${id}" width="22" height="22" patternUnits="userSpaceOnUse"${wPat === 2 ? ' patternTransform="rotate(35)"' : ''}>`
    + (wPat === 1 ? '<circle cx="7" cy="7" r="3.6" fill="#fff" fill-opacity=".6"/>' : wPat === 2 ? '<rect width="7" height="22" fill="#fff" fill-opacity=".45"/>' : '')
    + '</pattern></defs>';
  if (opts.bg) s += `<rect width="400" height="460" fill="${BGS[d.bg]}"/>`;

  // back sheet of paper
  if (wStyle === 0) s += `<path d="M70,178 L200,150 L330,178 L224,436 L176,436Z" fill="${mix(paper, INK, 0.18)}" ${S}/>`;

  // greenery
  if (d.g) {
    const leaf = 'M0,0 Q-19,-34 0,-70 Q19,-34 0,0Z';
    [[104, 214, -58], [296, 214, 58], [138, 118, -24], [264, 114, 24], [200, 96, 0]].forEach(([x, y, r]) => {
      s += `<g transform="translate(${x} ${y}) rotate(${r})"><path d="${leaf}" fill="#63bf7a" ${S}/><path d="M0,-6 L0,-56" stroke="#2f7d4a" stroke-width="2"/></g>`;
    });
  }

  // stems
  pos.forEach((p) => {
    s += `<path d="M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${(200 + (p.x - 200) * 0.62).toFixed(1)},285 200,${tieY - 30}" fill="none" stroke="#2f7d4a" stroke-width="5" stroke-linecap="round"/>`;
  });
  if (wStyle === 1) {
    const k = Math.max(n, 3);
    for (let i = 0; i < k; i++) {
      const x = 200 + (i - (k - 1) / 2) * (44 / k);
      s += `<path d="M200,${tieY - 32} L${x.toFixed(1)},${tieY} L${(200 + (x - 200) * 2.4).toFixed(1)},442" fill="none" stroke="#2f7d4a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  } else {
    const flapL = 'M70,178 L222,300 L224,436 L176,436Z', flapR = 'M330,178 L178,300 L176,436 L224,436Z';
    s += `<path d="${flapL}" fill="${paper}" ${S}/>` + (wPat ? `<path d="${flapL}" fill="url(#p${id})"/>` : '');
    s += `<path d="${flapR}" fill="${mix(paper, '#ffffff', 0.25)}" ${S}/>` + (wPat ? `<path d="${flapR}" fill="url(#p${id})"/>` : '');
  }

  // bow
  const loop = 'M0,0 C-12,-24 -46,-22 -42,0 C-46,20 -12,18 0,0Z', tail = 'M-3,4 L-22,44 L-11,38 L-4,48 L2,6Z';
  s += `<g transform="translate(200 ${tieY})"><path d="${tail}" fill="${ribbon}" ${S}/><path d="${tail}" fill="${ribbon}" ${S} transform="scale(-1 1)"/>`
    + `<path d="${loop}" fill="${ribbon}" ${S}/><path d="${loop}" fill="${ribbon}" ${S} transform="scale(-1 1)"/><circle r="8.5" fill="${mix(ribbon, INK, 0.15)}" ${S}/></g>`;

  // heads, back to front
  [...pos].sort((a, b) => a.y - b.y).forEach((p) => {
    const [t, c] = d.f[p.i];
    const rot = ((p.i * 47) % 30) - 15;
    s += `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${rot}) scale(${scale})"><g data-i="${p.i}"${opts.pop === p.i ? ' class="pop"' : ''}>${head(FLOWERS[t].id, COLORS[c])}</g></g>`;
  });

  if (!n) s += `<text x="200" y="170" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="600" fill="${INK}" opacity=".5">add some blooms ↓</text>`;
  return s + '</svg>';
}

// ───────────── the secret lotus ─────────────
const petalPath = (H, W) => {
  const f = (v) => v.toFixed(1);
  return `M0,0 C${f(-W)},${f(-H * 0.22)} ${f(-W * 0.78)},${f(-H * 0.7)} 0,${f(-H)} C${f(W * 0.78)},${f(-H * 0.7)} ${f(W)},${f(-H * 0.22)} 0,0Z`;
};
function lilyPad(cx, cy, rx, ry, rot) {
  const pt = (a) => `${(cx + rx * Math.cos(a + rot)).toFixed(1)},${(cy + ry * Math.sin(a + rot)).toFixed(1)}`;
  return `<path d="M${cx},${cy} L${pt(0.28)} A${rx},${ry} 0 1 1 ${pt(-0.28)} Z" fill="#4fae6c" ${S}/>`
    + `<ellipse cx="${cx - rx * 0.18}" cy="${cy - ry * 0.25}" rx="${rx * 0.45}" ry="${ry * 0.3}" fill="#86d695" opacity=".55"/>`;
}

/**
 * One lotus on a pond at dusk. Renders closed; adding class "bloomed" to the <svg> opens it
 * (petals unfold outer layer first, then the seed pod rises). opts.open renders it already
 * open using plain SVG transforms, so it also works as a standalone image (thumbnails, PNG).
 */
function lotusSVG(ci, opts = {}) {
  const id = ++uid, [tip, base] = LOTUS_COLORS[ci] || LOTUS_COLORS[0];
  const mid = mix(base, tip, 0.45);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 460" class="lotus-scene${opts.open ? ' bloomed' : ''}" role="img" aria-label="a lotus on a pond">`
    + `<defs>`
    + `<linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241c4a"/><stop offset=".6" stop-color="#7a4f9c"/><stop offset="1" stop-color="#ffa8c8"/></linearGradient>`
    + `<linearGradient id="sea${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c8fb3"/><stop offset="1" stop-color="#1c3656"/></linearGradient>`
    + `<linearGradient id="pa${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${base}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${tip}"/></linearGradient>`
    + `<linearGradient id="pb${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="${base}"/><stop offset="1" stop-color="${mid}"/></linearGradient>`
    + `<radialGradient id="gl${id}"><stop offset="0" stop-color="${mix(tip, '#ffffff', 0.55)}" stop-opacity=".9"/><stop offset="1" stop-color="${tip}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="mg${id}"><stop offset="0" stop-color="#fff6d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient>`
    + `</defs>`;

  // sky, stars, moon
  s += `<rect width="400" height="300" fill="url(#sky${id})"/>`;
  [[30, 40], [82, 92], [140, 28], [192, 66], [248, 22], [372, 160], [58, 172], [112, 138], [226, 118], [358, 26], [22, 236], [388, 232], [168, 196], [290, 190]]
    .forEach(([x, y], i) => { s += `<circle class="star" cx="${x}" cy="${y}" r="${i % 3 ? 1.3 : 2.1}" fill="#fff" style="animation-delay:${((i * 0.37) % 2.5).toFixed(2)}s"/>`; });
  s += `<circle cx="318" cy="84" r="72" fill="url(#mg${id})"/><circle cx="318" cy="84" r="24" fill="#fff6d6"/><circle cx="309" cy="78" r="4" fill="#f1e4b8"/><circle cx="326" cy="92" r="2.6" fill="#f1e4b8"/>`;

  // water, moon shimmer, lily pads, ripples, glow
  s += `<rect y="300" width="400" height="160" fill="url(#sea${id})"/>`;
  [[340, 44], [356, 32], [374, 22], [394, 12]].forEach(([y, w], i) => { s += `<rect class="shim" x="${318 - w / 2}" y="${y - 30}" width="${w}" height="3" rx="1.5" fill="#fff6d6" opacity="${(0.6 - i * 0.12).toFixed(2)}" style="animation-delay:${i * 0.4}s"/>`; });
  s += lilyPad(74, 392, 62, 16, 2.6) + lilyPad(334, 420, 54, 14, 0.5) + lilyPad(148, 446, 40, 10, 1.3);
  s += [0, 1, 2].map((i) => `<ellipse class="rip" cx="200" cy="324" rx="104" ry="22" fill="none" stroke="#dff3ff" stroke-width="2" style="animation-delay:${i * 1.4}s"/>`).join('');
  s += lilyPad(200, 324, 98, 22, 1.9);
  s += `<circle class="glow" cx="200" cy="236" r="160" fill="url(#gl${id})"/>`;

  // the flower — base at (200, 318); every petal is drawn pointing up from its base and rotated into place
  const petal = (a, closed, H, W, fill, dl) =>
    `<g class="pt" style="--a:${a}deg;--c:${closed.toFixed(1)}deg;--dl:${dl.toFixed(2)}s" transform="rotate(${opts.open ? a : closed.toFixed(1)})">`
    + `<path d="${petalPath(H, W)}" fill="url(#${fill}${id})" ${S}/>`
    + `<path d="M0,-6 Q${a < 0 ? -2 : 2},${(-H * 0.5).toFixed(1)} 0,${(-H * 0.86).toFixed(1)}" fill="none" stroke="${tip}" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/></g>`;
  const sym = (list) => list.flatMap((a) => (a ? [-a, a] : [0]));

  s += `<g transform="translate(200 318) scale(1.12)"><g class="sway">`;
  // back ring: centre petal at the very back, outer petals overlap inward; outer layer opens first
  sym([0, 22, 44, 66, 88]).forEach((a) => { s += petal(a, a * 0.06, 132 - Math.abs(a) * 0.36, 31, 'pa', 0.5 - Math.abs(a) / 88 * 0.5); });
  // seed pod and stamens
  s += `<g transform="translate(0 -14)"><g class="pod">`;
  for (let k = 0; k <= 16; k++) {
    const x0 = -14 + k * 1.75, x1 = x0 * 1.7, y1 = -50 + Math.abs(x0) * 0.5;
    s += `<path d="M${x0.toFixed(1)},-16 L${x1.toFixed(1)},${y1.toFixed(1)}" stroke="#f7c531" stroke-width="2" stroke-linecap="round"/><circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="2.3" fill="#ffd23f" stroke="${INK}" stroke-width="1"/>`;
  }
  s += `<path d="M-17,-40 L17,-40 L11,-12 L-11,-12Z" fill="#d9cf44" ${S}/><ellipse cy="-40" rx="17" ry="5.5" fill="#efe36a" ${S}/>`;
  [[-9, -40], [0, -41.5], [9, -40], [-4.5, -38.5], [4.5, -38.5]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="1.9" fill="#8f7f18"/>`; });
  s += `</g></g>`;
  // front ring: whiter, shorter cup petals; the lowest pair lies out on the water
  sym([112]).forEach((a) => { s += petal(a, a * 0.12, 60, 24, 'pb', 0.15); });
  sym([84, 60, 36]).forEach((a) => { s += petal(a, a * 0.1, 80 - Math.abs(a) * 0.1, 28, 'pb', 0.35 + (84 - Math.abs(a)) / 84 * 0.4); });
  s += `</g></g>`;

  // fireflies drift up once it has bloomed
  for (let i = 0; i < 12; i++) {
    s += `<circle class="fly" cx="${118 + ((i * 53) % 170)}" cy="${200 + ((i * 37) % 100)}" r="${i % 2 ? 2 : 2.8}" fill="#fff3a6" style="animation-delay:${(i * 0.42).toFixed(2)}s"/>`;
  }
  return s + '</svg>';
}

/** Whatever this gift is — a bouquet or the secret lotus — as a finished picture. */
const giftSVG = (d, opts = {}) => (d.lt ? lotusSVG(d.lc, { open: true }) : bouquetSVG(d, opts));

// ───────────── bouquet data / links ─────────────
// at/lock/pw/h are builder-only extras; pw never leaves the device.
const blank = () => ({ f: [[0, 1], [5, 0], [2, 6]], w: [0, 0, 0, 0], g: 1, bg: 0, to: '', fr: store.from || '', m: '', at: '', lock: false, pw: '', h: '', lt: 0, lc: 0 });

/** Link payload fields: f w g bg to fr m id, plus optional at (seal date), x (encrypted {m, fr}) and h (passcode hint). */
function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.f) || !Array.isArray(raw.w)) return null;
  const d = {
    f: raw.f.slice(0, MAX_STEMS).filter(Array.isArray).map((x) => [clampInt(x[0], FLOWERS.length), clampInt(x[1], COLORS.length)]),
    w: [clampInt(raw.w[0], 2), clampInt(raw.w[1], WRAPS.length), clampInt(raw.w[2], 3), clampInt(raw.w[3], RIBBONS.length)],
    g: raw.g ? 1 : 0,
    bg: clampInt(raw.bg, BGS.length),
    to: str(raw.to, 30), fr: str(raw.fr, 30), m: str(raw.m, 560),
    id: str(raw.id, 16) || Math.random().toString(36).slice(2, 10),
  };
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.at)) d.at = raw.at;
  if (/^[\w-]{40,8000}$/.test(raw.x)) { d.x = raw.x; d.h = str(raw.h, 40); }
  if (raw.lt) { d.lt = 1; d.lc = clampInt(raw.lc, LOTUS_COLORS.length); }
  return d;
}

function sanitizeReaction(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return { e: clampInt(raw.e, REACTS.length), t: str(raw.t, 80), fr: str(raw.fr, 30), to: str(raw.to, 30), ref: str(raw.ref, 16) };
}

const te = new TextEncoder(), td = new TextDecoder();
function b64u(bytes) {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const encodeObj = (o) => b64u(te.encode(JSON.stringify(o)));
function decodeObj(s) {
  try { return JSON.parse(td.decode(unb64u(s))); } catch (e) { return null; }
}

// Passcode notes: PBKDF2-SHA256 → AES-GCM. The link carries salt|iv|ciphertext only.
const canLock = () => !!(window.crypto && crypto.subtle);
async function noteKey(pass, salt) {
  const raw = await crypto.subtle.importKey('raw', te.encode(pass.trim().toLowerCase()), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptNote(obj, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await noteKey(pass, salt), te.encode(JSON.stringify(obj))));
  const out = new Uint8Array(28 + ct.length);
  out.set(salt);
  out.set(iv, 16);
  out.set(ct, 28);
  return b64u(out);
}
async function decryptNote(x, pass) {
  const b = unb64u(x);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(16, 28) }, await noteKey(pass, b.slice(0, 16)), b.slice(28));
  return JSON.parse(td.decode(pt));
}

function savePNG(d) {
  const svg = giftSVG(d, { bg: true }).replace('<svg ', '<svg width="800" height="920" ');
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = 800; cv.height = 920;
    cv.getContext('2d').drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    cv.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = d.lt ? 'bloomdrop-lotus.png' : 'bloomdrop-bouquet.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('saved to downloads 📸');
    });
  };
  img.onerror = () => toast('couldn’t save the pic on this browser');
  img.src = url;
}

// ───────────── views ─────────────
function go(view) {
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + view));
  document.querySelectorAll('.tab').forEach((t) => (t.dataset.go === view ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current')));
  if (view === 'garden') renderGarden();
  if (view === 'make') renderBuilder();
  window.scrollTo(0, 0);
}
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-go]');
  if (el) { e.preventDefault(); go(el.dataset.go); }
});

// ───────────── builder ─────────────
let cur = blank();

function loadIntoBuilder(d, keepNames) {
  cur = { ...blank(), ...JSON.parse(JSON.stringify(d)), at: '', lock: false, pw: '', h: '' };
  delete cur.id;
  delete cur.x;
  if (!keepNames) { cur.to = ''; cur.fr = store.from || ''; }
  go('make');
}

function randomBouquet() {
  const pool = FLOWERS.map((f, i) => i).filter((i) => unlocked(FLOWERS[i]) && !FLOWERS[i].hidden);
  const n = 5 + rnd(5), a = pool[rnd(pool.length)], b = pool[rnd(pool.length)];
  const f = Array.from({ length: n }, () => {
    const t = Math.random() < 0.75 ? (Math.random() < 0.5 ? a : b) : pool[rnd(pool.length)];
    return [t, Math.random() < 0.6 ? FLOWERS[t].c : rnd(COLORS.length)];
  });
  return { f, w: [Math.random() < 0.8 ? 0 : 1, rnd(WRAPS.length), rnd(3), rnd(RIBBONS.length)], g: 1, bg: rnd(BGS.length), lt: 0 };
}

/** pop: index of a stem to animate in, or 'bloom' to play the lotus opening. */
function renderPreview(pop) {
  const lotus = !!cur.lt;
  $('#chips').hidden = $('#stageActions').hidden = lotus;
  $('#stageHint').textContent = lotus ? 'tap the lotus to watch it bloom again' : 'tap a flower to change its colour';
  if (lotus) {
    $('#preview').innerHTML = lotusSVG(cur.lc, { open: pop !== 'bloom' });
    $('#stage').style.background = '#e4dbff';
    if (pop === 'bloom') requestAnimationFrame(() => requestAnimationFrame(() => $('#preview .lotus-scene').classList.add('bloomed')));
    return;
  }
  $('#preview').innerHTML = bouquetSVG(cur, { pop });
  $('#stage').style.background = BGS[cur.bg];
  $('#stemCount').textContent = `${cur.f.length}/${MAX_STEMS} stems`;
  $('#chips').innerHTML = cur.f.map(([t, c], i) =>
    `<span class="chip"><button data-cycle="${i}" title="Change colour" aria-label="Change ${esc(FLOWERS[t].name)} colour">${flowerIcon(FLOWERS[t], c)}</button><button class="x" data-rm="${i}" aria-label="Remove ${esc(FLOWERS[t].name)}">×</button></span>`).join('');
}

function swatches(el, list, get, set) {
  el.innerHTML = list.map((c, i) => `<button class="sw" data-v="${i}" style="background:${c}" aria-label="Colour ${i + 1}" aria-pressed="${get() === i}"></button>`).join('');
  el.onclick = (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    set(+b.dataset.v);
    renderBuilder();
  };
}
function seg(el, get, set) {
  el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === get())));
  el.onclick = (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    set(+b.dataset.v);
    renderBuilder();
  };
}

function renderBuilder() {
  renderPreview();
  $('#bloomPanel').hidden = $('#wrapPanel').hidden = !!cur.lt;
  $('#lotusPanel').hidden = !cur.lt;
  swatches($('#lotusColor'), LOTUS_COLORS.map(([t, b]) => `linear-gradient(to top, ${b}, ${t})`), () => cur.lc, (v) => { cur.lc = v; });
  $('#palette').innerHTML = FLOWERS.map((f, i) => {
    if (f.hidden) return '';
    const ok = unlocked(f);
    return `<button class="bloom" data-add="${i}" ${ok ? '' : 'disabled'} title="${esc(f.means)}">${flowerIcon(f)}<span>${esc(f.name)}</span>${ok ? '' : `<span class="lock">🔒 ${esc(f.lock.label)}</span>`}</button>`;
  }).join('');
  $('#greenery').checked = !!cur.g;
  seg($('#wrapStyle'), () => cur.w[0], (v) => { cur.w[0] = v; });
  seg($('#wrapPat'), () => cur.w[2], (v) => { cur.w[2] = v; });
  swatches($('#wrapColor'), WRAPS, () => cur.w[1], (v) => { cur.w[1] = v; });
  swatches($('#ribbonColor'), RIBBONS, () => cur.w[3], (v) => { cur.w[3] = v; });
  swatches($('#bgColor'), BGS, () => cur.bg, (v) => { cur.bg = v; });
  $('#wrapColorRow').hidden = $('#wrapPatRow').hidden = cur.w[0] === 1;
  $('#toName').value = cur.to;
  $('#fromName').value = cur.fr;
  $('#msg').value = cur.m;
  $('#msgCount').textContent = `${cur.m.length}/560`;
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  $('#atDate').min = dayKey(tmr);
  $('#atDate').value = cur.at || '';
  $('#lockOn').checked = !!cur.lock;
  $('#lockFields').hidden = !cur.lock;
  $('#pw').value = cur.pw || '';
  $('#hint').value = cur.h || '';
}

$('#palette').addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]');
  if (!b || b.disabled) return;
  if (cur.f.length >= MAX_STEMS) return toast(`${MAX_STEMS} stems max — it’s a bouquet, not a garden`);
  const t = +b.dataset.add;
  cur.f.push([t, FLOWERS[t].c]);
  renderPreview(cur.f.length - 1);
});
let tapI = -1, tapN = 0, tapT = 0;
/** A tap cycles the colour; the 3rd quick tap on the same heartbud reveals the secret lotus gift. */
function tapFlower(i) {
  const now = Date.now();
  tapN = i === tapI && now - tapT < 800 ? tapN + 1 : 1;
  tapI = i;
  tapT = now;
  if (FLOWERS[cur.f[i][0]].id === 'heart' && tapN >= 3) {
    tapN = 0;
    cur.lt = 1;
    cur.lc = 0;
    renderBuilder();
    renderPreview('bloom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return toast('🪷 you found the secret lotus');
  }
  cur.f[i][1] = (cur.f[i][1] + 1) % COLORS.length;
  renderPreview();
}
$('#chips').addEventListener('click', (e) => {
  const rm = e.target.closest('[data-rm]'), cy = e.target.closest('[data-cycle]');
  if (rm) { cur.f.splice(+rm.dataset.rm, 1); renderPreview(); } else if (cy) tapFlower(+cy.dataset.cycle);
});
$('#preview').addEventListener('click', (e) => {
  if (cur.lt) {
    const sv = $('#preview .lotus-scene');
    sv.classList.remove('bloomed');
    setTimeout(() => sv.classList.add('bloomed'), 1200);
    return;
  }
  const g = e.target.closest('[data-i]');
  if (g) tapFlower(+g.dataset.i);
});
$('#greenery').addEventListener('change', (e) => { cur.g = e.target.checked ? 1 : 0; renderPreview(); });
$('#toName').addEventListener('input', (e) => { cur.to = e.target.value; });
$('#fromName').addEventListener('input', (e) => { cur.fr = e.target.value; });
$('#msg').addEventListener('input', (e) => { cur.m = e.target.value; $('#msgCount').textContent = `${cur.m.length}/560`; });
$('#lotusExit').addEventListener('click', () => { cur.lt = 0; renderBuilder(); });
$('#atDate').addEventListener('input', (e) => { cur.at = e.target.value; });
$('#atClear').addEventListener('click', () => { cur.at = ''; $('#atDate').value = ''; });
$('#lockOn').addEventListener('change', (e) => {
  cur.lock = e.target.checked;
  $('#lockFields').hidden = !cur.lock;
  if (cur.lock) $('#pw').focus();
});
$('#pw').addEventListener('input', (e) => { cur.pw = e.target.value; });
$('#hint').addEventListener('input', (e) => { cur.h = e.target.value; });
$('#shuffleBtn').addEventListener('click', () => { Object.assign(cur, randomBouquet()); renderBuilder(); });
$('#clearBtn').addEventListener('click', () => { cur = { ...blank(), f: [] }; renderBuilder(); });

$('#starters').innerHTML = STARTERS.map((s) => `<button type="button" class="starter">${esc(s)}</button>`).join('');
$('#starters').addEventListener('click', (e) => {
  const b = e.target.closest('.starter');
  if (!b) return;
  const m = $('#msg');
  const text = b.textContent.replace('…', ' ');
  m.value = (m.value && !m.value.endsWith('\n') ? m.value + '\n' : m.value) + text;
  m.value = m.value.slice(0, 560);
  cur.m = m.value;
  $('#msgCount').textContent = `${cur.m.length}/560`;
  m.focus();
});

// ───────────── send ─────────────
let lastSent = null, shareTextCur = '';
const base = () => location.href.split('#')[0];
const linkFor = (d) => base() + '#b=' + encodeObj(d);
const shareText = (d) => `${d.fr ? d.fr + ' sent' : 'someone sent'} you ${d.lt ? 'something special 🪷' : 'a bouquet 💐'} tap to unwrap:`;

function showShareDlg({ title, sub, link, text, notes = [], pic = false }) {
  $('#shareTitle').textContent = title;
  $('#shareSub').textContent = sub;
  $('#shareLink').value = link;
  shareTextCur = text;
  $('#shareNotes').innerHTML = notes.map((n) => `<li>${esc(n)}</li>`).join('');
  $('#shareNotes').hidden = !notes.length;
  $('#waBtn').href = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + link);
  $('#nativeShareBtn').hidden = !navigator.share;
  $('#pngBtn').hidden = $('#previewBtn').hidden = !pic;
  if (!$('#shareDlg').open) $('#shareDlg').showModal();
}

function openShare(d) {
  lastSent = d;
  const notes = [];
  if (d.x) notes.push('🔐 the note is locked. send the passcode separately (another chat, or just tell them) — we can’t recover it.');
  if (isSealed(d)) notes.push(`📅 sealed until ${fmtDate(d.at)}. they’ll see a countdown till then.`);
  showShareDlg({ title: 'it’s wrapped 🎀', sub: 'send this link — they’ll unwrap it when they open it.', link: linkFor(d), text: shareText(d), notes, pic: true });
}

$('#sendBtn').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  if (!cur.lt && !cur.f.length) return toast('add at least one bloom first 🌷');
  if (!cur.m.trim() && !cur.to.trim()) { $('#toName').focus(); return toast('who’s it for? add a name or a note'); }
  if (cur.lock) {
    if (!cur.m.trim()) { $('#msg').focus(); return toast('write a note first — that’s what the passcode locks'); }
    if (!cur.pw.trim()) { $('#pw').focus(); return toast('add a passcode (or untick the lock)'); }
    if (!canLock()) return toast('this browser can’t lock notes — try chrome or safari');
  }
  const d = sanitize({ ...cur, f: cur.lt ? [] : cur.f, to: cur.to.trim(), fr: cur.fr.trim(), m: cur.m.trim(), x: '', id: '' });
  let shared = d;
  if (cur.lock) {
    btn.disabled = true;
    try {
      shared = { ...d, m: '', fr: '', x: await encryptNote({ m: d.m, fr: d.fr }, cur.pw), h: cur.h.trim().slice(0, 40) };
    } catch (err) {
      return toast('couldn’t lock the note, try again');
    } finally {
      btn.disabled = false;
    }
  }
  store.from = d.fr || store.from;
  // p keeps the plaintext locally so the sender can still read and remix their own locked note.
  store.sent.unshift({ d: shared, p: shared.x ? { m: d.m, fr: d.fr } : undefined, ts: Date.now() });
  store.sent = store.sent.slice(0, 40);
  const before = FLOWERS.filter(unlocked).length;
  store.sentCount++;
  save();
  openShare(shared);
  if (FLOWERS.filter(unlocked).length > before) setTimeout(() => toast('new rare bloom unlocked 🔓 check the palette'), 600);
  refreshChrome();
});

$('#copyBtn').addEventListener('click', async () => {
  const inp = $('#shareLink');
  try { await navigator.clipboard.writeText(inp.value); } catch (e) { inp.select(); document.execCommand('copy'); }
  toast('link copied — go make their day');
});
$('#nativeShareBtn').addEventListener('click', () => {
  navigator.share({ title: 'bloomdrop', text: shareTextCur, url: $('#shareLink').value }).catch(() => {});
});
$('#pngBtn').addEventListener('click', () => savePNG(lastSent));
$('#previewBtn').addEventListener('click', () => { $('#shareDlg').close(); openReceive(lastSent, true); });
$('#shareClose').addEventListener('click', () => $('#shareDlg').close());
$('#shareDlg').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

// ───────────── receive ─────────────
// Stages: sealed (countdown) → gift (envelope) → lockbox (passcode) → opened. "reaction" is the screen for #r= links.
let recvCur = null, recvPreview = false, cdT;
const STAGES = ['sealed', 'gift', 'lockbox', 'opened', 'reaction'];
const stage = (name) => STAGES.forEach((s) => { $('#' + s).hidden = s !== name; });
const known = (id) => [store.waiting, store.recv, store.sent].some((l) => l.some((r) => r.d.id === id));

function showOverlay(bg, night) {
  const el = $('#receive');
  clearInterval(cdT);
  el.classList.toggle('night', !!night);
  el.style.background = bg;
  $('#confetti').innerHTML = '';
  el.hidden = false;
  el.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function openReceive(d, isPreview) {
  recvCur = d;
  recvPreview = !!isPreview;
  showOverlay(d.lt ? '#241c4a' : BGS[d.bg], d.lt);
  const what = d.lt ? 'this one’s just for you' : 'you’ve got flowers';
  $('#giftTo').textContent = d.to ? `${d.to}, ${what}` : what;
  $('#sendBackBtn').hidden = $('#reactBox').hidden = recvPreview;
  $('#peekBtn').hidden = !recvPreview;
  $('#recvCloseBtn').textContent = recvPreview ? 'close preview' : 'my garden';
  $('#sealedOkBtn').textContent = recvPreview ? 'close preview' : 'ok, i’ll come back';
  if (isSealed(d)) {
    $('#sealedTo').textContent = d.to ? `${d.to}, something’s on its way` : 'something’s on its way';
    $('#sealedDate').textContent = fmtDate(d.at);
    stage('sealed');
    startCountdown(d.at);
    if (!recvPreview && !known(d.id)) {
      store.waiting.unshift({ d, ts: Date.now() });
      store.waiting = store.waiting.slice(0, 20);
      save();
    }
    $('#sealedOkBtn').focus();
  } else {
    stage('gift');
    $('#unwrapBtn').focus();
  }
}

function startCountdown(at) {
  const [y, m, day] = at.split('-').map(Number);
  const target = new Date(y, m - 1, day).getTime();
  const tick = () => {
    const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    if (!s) { clearInterval(cdT); stage('gift'); return; }
    $('#countdown').innerHTML = [[Math.floor(s / 86400), 'days'], [Math.floor(s / 3600) % 24, 'hrs'], [Math.floor(s / 60) % 60, 'min'], [s % 60, 'sec']]
      .map(([v, l]) => `<div><b>${pad(v)}</b><span>${l}</span></div>`).join('');
  };
  tick();
  cdT = setInterval(tick, 1000);
}

function confetti(colors = COLORS) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $('#confetti').innerHTML = Array.from({ length: 36 }, () =>
    `<i style="left:${rnd(100)}%;background:${colors[rnd(colors.length)]};animation-duration:${2.2 + Math.random() * 2.5}s;animation-delay:${Math.random() * 0.8}s"></i>`).join('');
}

/** Recipient taps the closed lotus: it opens, and the note appears only after the bloom finishes. */
function bloomLotus() {
  const sv = $('#recvArt .lotus-scene'), art = $('#recvArt');
  if (!sv || sv.classList.contains('bloomed')) return;
  sv.classList.add('bloomed');
  art.removeAttribute('role');
  art.removeAttribute('tabindex');
  art.removeAttribute('aria-label');
  const hint = $('#lotusHint');
  hint.textContent = recvCur.to ? `it bloomed for you, ${recvCur.to} 🪷` : 'it bloomed for you 🪷';
  hint.classList.add('done');
  const [tip, base] = LOTUS_COLORS[recvCur.lc] || LOTUS_COLORS[0];
  setTimeout(() => confetti([tip, base, mix(base, tip, 0.5), '#fff3a6']), 1500);
  setTimeout(() => {
    $('#opened').classList.remove('lotus-wait');
    $('#recvNote').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 2600);
}
$('#recvArt').addEventListener('click', bloomLotus);
$('#recvArt').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bloomLotus(); }
});

function reveal() {
  const d = recvCur;
  const art = $('#recvArt'), hint = $('#lotusHint');
  art.innerHTML = d.lt ? lotusSVG(d.lc) : bouquetSVG(d);
  $('#opened').classList.toggle('lotus-wait', !!d.lt);
  hint.hidden = !d.lt;
  hint.classList.remove('done');
  hint.textContent = 'tap the lotus 🪷';
  if (d.lt) {
    art.setAttribute('role', 'button');
    art.setAttribute('tabindex', '0');
    art.setAttribute('aria-label', 'Closed lotus. Tap to make it bloom');
  }
  $('#noteTo').textContent = d.to ? `dear ${d.to},` : '';
  $('#noteMsg').textContent = d.m;
  $('#noteMsg').classList.toggle('long', d.m.length > 280);
  $('#noteFrom').textContent = d.fr ? `— ${d.fr}` : '';
  $('#recvNote').hidden = !d.m && !d.to && !d.fr;
  $('#reactForm').hidden = true;
  $('#reactText').value = '';
  $('#reactRow').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  stage('opened');
  if (d.lt) art.focus({ preventScroll: true }); else confetti();
  if (recvPreview) return;
  // Received copies are stored already unlocked, on this device only.
  store.waiting = store.waiting.filter((r) => r.d.id !== d.id);
  if (!store.recv.some((r) => r.d.id === d.id) && !store.sent.some((r) => r.d.id === d.id)) {
    store.recv.unshift({ d, ts: Date.now() });
    store.recv = store.recv.slice(0, 40);
  }
  save();
}

$('#unwrapBtn').addEventListener('click', () => {
  if (!recvCur.x) return reveal();
  $('#hintText').textContent = recvCur.h ? `hint: ${recvCur.h}` : '';
  $('#passIn').value = '';
  stage('lockbox');
  $('#passIn').focus();
});

$('#lockbox').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#lockbox button'), inp = $('#passIn');
  if (!canLock()) return toast('this browser can’t unlock notes — try chrome or safari');
  btn.disabled = true;
  try {
    const plain = await decryptNote(recvCur.x, inp.value);
    const { x, h, ...rest } = recvCur;
    recvCur = sanitize({ ...rest, m: plain.m, fr: plain.fr });
    reveal();
  } catch (err) {
    inp.classList.remove('shake');
    void inp.offsetWidth;
    inp.classList.add('shake');
    toast('nope, wrong passcode 🙈');
  } finally {
    btn.disabled = false;
  }
});

// reactions: recipient → sender, as another link
let reactPick = 0;
$('#reactRow').innerHTML = REACTS.map(([emo, label], i) =>
  `<button type="button" class="react-btn" data-r="${i}" aria-pressed="false"><span>${emo}</span>${esc(label)}</button>`).join('');
$('#reactRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-r]');
  if (!b) return;
  reactPick = +b.dataset.r;
  $('#reactRow').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $('#reactForm').hidden = false;
  $('#reactText').focus();
});
$('#reactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const r = { e: reactPick, t: $('#reactText').value.trim().slice(0, 80), fr: recvCur.to, to: recvCur.fr, ref: recvCur.id };
  const [emo, label] = REACTS[r.e];
  showShareDlg({
    title: `${emo} reaction ready`,
    sub: recvCur.fr ? `send this back to ${recvCur.fr}.` : 'send this back to whoever sent you the bouquet.',
    link: base() + '#r=' + encodeObj(r),
    text: `${r.fr || 'someone'} reacted “${label}” to your bouquet ${emo}`,
  });
});

function openReaction(r) {
  recvCur = null;
  recvPreview = false;
  showOverlay(BGS[1], false);
  const [emo, label] = REACTS[r.e];
  $('#rxEmoji').textContent = emo;
  $('#rxTitle').textContent = `${r.fr || 'someone'} said “${label}”`;
  $('#rxText').textContent = r.t ? `“${r.t}”` : '';
  $('#rxText').hidden = !r.t;
  const ent = store.sent.find((s) => s.d.id === r.ref);
  $('#rxArt').innerHTML = ent ? giftSVG(ent.d) : '';
  if (ent) { ent.r = { e: r.e, t: r.t, fr: r.fr }; save(); }
  $('#rxBackBtn').onclick = () => { closeReceive(); cur = { ...blank(), to: r.fr }; go('make'); };
  stage('reaction');
  confetti();
}

function closeReceive() {
  clearInterval(cdT);
  $('#receive').hidden = true;
  document.body.style.overflow = '';
  if (/^#[br]=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
}
function leaveReceive() {
  const wasPreview = recvPreview;
  closeReceive();
  if (wasPreview) $('#shareDlg').showModal(); else go('garden');
}
$('#recvCloseBtn').addEventListener('click', leaveReceive);
$('#sealedOkBtn').addEventListener('click', leaveReceive);
$('#rxGardenBtn').addEventListener('click', () => { closeReceive(); go('garden'); });
$('#peekBtn').addEventListener('click', () => { clearInterval(cdT); stage('gift'); });
$('#recvSaveBtn').addEventListener('click', () => savePNG(recvCur));
$('#sendBackBtn').addEventListener('click', () => {
  const to = recvCur.fr;
  closeReceive();
  cur = { ...blank(), to };
  go('make');
  toast(to ? `making one for ${to} 💐` : 'your turn 💐');
});

function checkHash() {
  const h = location.hash;
  if (h.startsWith('#b=')) {
    const d = sanitize(decodeObj(h.slice(3)));
    if (!d) { toast('that bouquet link looks broken 🥀'); return false; }
    openReceive(d, false);
    return true;
  }
  if (h.startsWith('#r=')) {
    const r = sanitizeReaction(decodeObj(h.slice(3)));
    if (!r) { toast('that reaction link looks broken 🥀'); return false; }
    openReaction(r);
    return true;
  }
  return false;
}
window.addEventListener('hashchange', checkHash);

// ───────────── home ─────────────
function nextUnlockText() {
  const next = FLOWERS.filter((f) => f.lock && !unlocked(f)).sort((a, b) => (a.lock.n - progress(a.lock)) - (b.lock.n - progress(b.lock)))[0];
  if (!next) return 'every rare bloom unlocked. iconic.';
  const left = next.lock.n - progress(next.lock);
  return next.lock.k === 'best'
    ? `${left} more day${left > 1 ? 's' : ''} to unlock ${next.name}`
    : `send ${left} more to unlock ${next.name}`;
}

function refreshChrome() {
  $('#streakNum').textContent = store.streak;
  $('#streakBig').textContent = store.streak;
  $('#streakS').textContent = store.streak === 1 ? '' : 's';
  $('#nextUnlock').textContent = nextUnlockText();
}

function renderHome() {
  $('#heroArt').innerHTML = bouquetSVG(PRESETS[3]);

  const base = FLOWERS.filter((f) => !f.lock && !f.hidden);
  const bloom = base[dayNum() % base.length], bloomIdx = FLOWERS.indexOf(bloom);
  $('#dailyBloomArt').innerHTML = flowerIcon(bloom);
  $('#dailyBloomName').textContent = bloom.name;
  $('#dailyBloomMeans').textContent = bloom.means;
  $('#dailyBloomBtn').onclick = () => {
    const alt = (bloom.c + 4) % COLORS.length;
    loadIntoBuilder({ f: [[bloomIdx, bloom.c], [bloomIdx, alt], [bloomIdx, bloom.c], [7, 6], [bloomIdx, alt]], w: [0, dayNum() % WRAPS.length, 0, 0], g: 1, bg: dayNum() % BGS.length });
  };

  const prompt = PROMPTS[dayNum() % PROMPTS.length];
  $('#dailyPrompt').textContent = prompt;
  $('#dailyPromptBtn').onclick = () => { cur = { ...blank(), ...randomBouquet() }; go('make'); $('#toName').focus(); toast(prompt); };

  $('#presets').innerHTML = PRESETS.map((p, i) =>
    `<button class="card preset" data-preset="${i}"><div class="art" style="background:${BGS[p.bg]}">${bouquetSVG(p)}</div><h3>${esc(p.title)}</h3><p>${esc(p.sub)}</p></button>`).join('');
  $('#presets').onclick = (e) => {
    const b = e.target.closest('[data-preset]');
    if (b) loadIntoBuilder(PRESETS[+b.dataset.preset]);
  };
  $('#surpriseHome').onclick = () => { cur = { ...blank(), ...randomBouquet() }; go('make'); };
  refreshChrome();
}

// ───────────── garden ─────────────
function daysUntil(m, d) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next < now) next = new Date(now.getFullYear() + 1, m - 1, d);
  return Math.round((next - now) / 864e5);
}
function shelf(el, list, kind) {
  if (!list.length) {
    el.innerHTML = `<p class="empty">${kind === 'sent' ? 'nothing sent yet — someone’s waiting on flowers 👀' : 'nothing here yet. send one first — they tend to come back.'}</p>`;
    return;
  }
  el.innerHTML = list.map((r, i) => {
    const who = kind === 'sent'
      ? (r.d.to ? 'to ' + r.d.to : 'sent') + (r.d.x ? ' 🔐' : '') + (r.d.at ? ' 📅' : '')
      : (r.d.fr ? 'from ' + r.d.fr : 'from someone');
    const when = new Date(r.ts);
    const badge = r.r ? `<p class="react-badge">${REACTS[r.r.e][0]} ${esc(r.r.fr || 'they')} said “${esc(REACTS[r.r.e][1])}”${r.r.t ? ': ' + esc(r.r.t) : ''}</p>` : '';
    return `<article class="card shelf-card"><div class="art" style="background:${BGS[r.d.bg]}">${giftSVG(r.d)}</div><h3>${esc(who)}</h3><time>${when.getDate()} ${MONTHS[when.getMonth()]}</time>${badge}`
      + `<div class="acts">${kind === 'sent'
        ? `<button class="linkbtn" data-act="share" data-i="${i}">share again</button><button class="linkbtn" data-act="remix" data-i="${i}">remix</button>`
        : `<button class="linkbtn" data-act="open" data-i="${i}">open</button><button class="linkbtn" data-act="back" data-i="${i}">send one back</button>`}</div></article>`;
  }).join('');
  el.onclick = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const ent = list[+b.dataset.i], d = ent.d;
    if (b.dataset.act === 'share') openShare(d);
    else if (b.dataset.act === 'remix') loadIntoBuilder({ ...d, ...(ent.p || {}) }, true);
    else if (b.dataset.act === 'open') openReceive(d, false);
    else { cur = { ...blank(), to: d.fr }; go('make'); }
  };
}

function renderGarden() {
  $('#gStreak').textContent = store.streak;
  $('#gSent').textContent = store.sentCount;
  $('#gRecv').textContent = store.recv.length;

  $('#unlocks').innerHTML = FLOWERS.filter((f) => f.lock).map((f) => {
    const p = progress(f.lock), ok = unlocked(f);
    return `<article class="card unlock ${ok ? '' : 'locked'}">${flowerIcon(f)}<div style="flex:1"><h3>${esc(f.name)} ${ok ? '✅' : '🔒'}</h3><p>${ok ? esc(f.means) : esc(f.lock.label) + ` · ${p}/${f.lock.n}`}</p>${ok ? '' : `<div class="bar"><i style="width:${(p / f.lock.n) * 100}%"></i></div>`}</div></article>`;
  }).join('');

  const dates = store.dates.map((x, i) => ({ ...x, i, left: daysUntil(x.m, x.d) })).sort((a, b) => a.left - b.left);
  $('#dates').innerHTML = dates.length
    ? dates.map((x) => `<li><span class="who">${esc(x.n)}</span><span class="when ${x.left <= 7 ? 'soon' : ''}">${x.left === 0 ? 'today!!' : x.left === 1 ? 'tomorrow' : `in ${x.left} days`} · ${x.d} ${MONTHS[x.m - 1]}</span><button class="linkbtn" data-mk="${x.i}">make bouquet</button><button class="linkbtn" data-del="${x.i}" aria-label="Remove ${esc(x.n)}">remove</button></li>`).join('')
    : '<li style="border-style:dashed;color:var(--muted)">add a birthday or anniversary and we’ll count down to it.</li>';

  $('#waitWrap').hidden = !store.waiting.length;
  $('#waitShelf').innerHTML = store.waiting.map((r, i) => {
    const ready = !isSealed(r.d);
    return `<article class="card shelf-card"><div class="art sealed-art" style="background:${BGS[r.d.bg]}"><span>💌</span></div><h3>${esc(r.d.fr ? 'from ' + r.d.fr : 'from someone')}</h3>`
      + `<time>${ready ? 'ready to open!' : 'opens ' + esc(fmtDate(r.d.at))}</time><div class="acts"><button class="linkbtn" data-wi="${i}">${ready ? 'unwrap now' : 'see countdown'}</button></div></article>`;
  }).join('');

  shelf($('#recvShelf'), store.recv, 'recv');
  shelf($('#sentShelf'), store.sent, 'sent');
}
$('#waitShelf').addEventListener('click', (e) => {
  const b = e.target.closest('[data-wi]');
  if (b) openReceive(store.waiting[+b.dataset.wi].d, false);
});

$('#dateForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const n = $('#dateName').value.trim(), v = $('#dateWhen').value;
  if (!n || !v) return;
  const [, m, d] = v.split('-').map(Number);
  store.dates.push({ n, m, d });
  store.dates = store.dates.slice(-30);
  save();
  e.target.reset();
  renderGarden();
});
$('#dates').addEventListener('click', (e) => {
  const mk = e.target.closest('[data-mk]'), del = e.target.closest('[data-del]');
  if (mk) { cur = { ...blank(), ...PRESETS[3], to: store.dates[+mk.dataset.mk].n, fr: store.from || '' }; go('make'); }
  if (del) { store.dates.splice(+del.dataset.del, 1); save(); renderGarden(); }
});

// ───────────── boot ─────────────
const newDay = tickStreak();
renderHome();
go('home');
if (!checkHash()) {
  const msgs = [];
  if (newDay && store.streak > 1) msgs.push(`🔥 ${store.streak}-day streak — keep it blooming`);
  if (store.waiting.some((r) => !isSealed(r.d))) msgs.push('a sealed bouquet is ready to open 💌 check ur garden');
  const soon = store.dates.find((x) => daysUntil(x.m, x.d) <= 3);
  if (soon) msgs.push(`heads up: ${soon.n}’s day is ${daysUntil(soon.m, soon.d) === 0 ? 'today' : 'almost here'} 💐`);
  msgs.forEach((m, i) => setTimeout(() => toast(m), 500 + i * 2600));
}
})();
