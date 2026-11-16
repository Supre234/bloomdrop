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
  { id: 'heart', name: 'heartbud', c: 1, means: 'big feelings only.', lock: { k: 'sent', n: 3, label: 'send 3 bouquets' } },
  { id: 'moon', name: 'moonflower', c: 4, means: 'thinking of u at 2am.', lock: { k: 'best', n: 7, label: '7-day streak' } },
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

// ───────────── tiny helpers ─────────────
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clampInt = (v, n) => { v = Number.isInteger(v) ? v : 0; return v < 0 || v >= n ? 0 : v; };
const rnd = (n) => Math.floor(Math.random() * n);
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayNum = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };

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
let store = { streak: 0, best: 0, last: '', sent: [], recv: [], dates: [], sentCount: 0, from: '' };
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
    case 'moon':
      for (let i = 0; i < 8; i++) o += `<ellipse cy="-22" rx="8" ry="11" fill="${light}" ${S} transform="rotate(${i * 45})"/>`;
      return o + `<circle r="17" fill="${c}" ${S}/><path d="M5,-11 A12,12 0 1 0 11,7 A9.5,9.5 0 1 1 5,-11Z" fill="#fff8ef" stroke="${INK}" stroke-width="1.5"/>`;
  }
  return '';
}

const flowerIcon = (f, ci) => `<svg viewBox="-36 -44 72 78" aria-hidden="true">${head(f.id, COLORS[ci ?? f.c])}</svg>`;

let uid = 0;
/** Render a bouquet to an SVG string. opts.bg paints a backdrop; opts.popLast animates the newest stem. */
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
    s += `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${rot}) scale(${scale})"><g data-i="${p.i}"${opts.popLast && p.i === n - 1 ? ' class="pop"' : ''}>${head(FLOWERS[t].id, COLORS[c])}</g></g>`;
  });

  if (!n) s += `<text x="200" y="170" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="600" fill="${INK}" opacity=".5">add some blooms ↓</text>`;
  return s + '</svg>';
}

// ───────────── bouquet data / links ─────────────
const blank = () => ({ f: [[0, 1], [5, 0], [2, 6]], w: [0, 0, 0, 0], g: 1, bg: 0, to: '', fr: store.from || '', m: '' });

function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.f) || !Array.isArray(raw.w)) return null;
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  return {
    f: raw.f.slice(0, MAX_STEMS).filter(Array.isArray).map((x) => [clampInt(x[0], FLOWERS.length), clampInt(x[1], COLORS.length)]),
    w: [clampInt(raw.w[0], 2), clampInt(raw.w[1], WRAPS.length), clampInt(raw.w[2], 3), clampInt(raw.w[3], RIBBONS.length)],
    g: raw.g ? 1 : 0,
    bg: clampInt(raw.bg, BGS.length),
    to: str(raw.to, 30), fr: str(raw.fr, 30), m: str(raw.m, 280),
    id: str(raw.id, 16) || Math.random().toString(36).slice(2, 10),
  };
}

function encode(d) {
  const bytes = new TextEncoder().encode(JSON.stringify(d));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decode(s) {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    return sanitize(JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))));
  } catch (e) { return null; }
}
const linkFor = (d) => location.href.split('#')[0] + '#b=' + encode(d);

function savePNG(d) {
  const svg = bouquetSVG(d, { bg: true }).replace('<svg ', '<svg width="800" height="920" ');
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
      a.download = 'bloomdrop-bouquet.png';
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
  cur = { ...blank(), ...JSON.parse(JSON.stringify(d)) };
  delete cur.id;
  if (!keepNames) { cur.to = ''; cur.fr = store.from || ''; }
  go('make');
}

function randomBouquet() {
  const pool = FLOWERS.map((f, i) => i).filter((i) => unlocked(FLOWERS[i]));
  const n = 5 + rnd(5), a = pool[rnd(pool.length)], b = pool[rnd(pool.length)];
  const f = Array.from({ length: n }, () => {
    const t = Math.random() < 0.75 ? (Math.random() < 0.5 ? a : b) : pool[rnd(pool.length)];
    return [t, Math.random() < 0.6 ? FLOWERS[t].c : rnd(COLORS.length)];
  });
  return { f, w: [Math.random() < 0.8 ? 0 : 1, rnd(WRAPS.length), rnd(3), rnd(RIBBONS.length)], g: 1, bg: rnd(BGS.length) };
}

function renderPreview(popLast) {
  $('#preview').innerHTML = bouquetSVG(cur, { popLast });
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
  $('#palette').innerHTML = FLOWERS.map((f, i) => {
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
  $('#msgCount').textContent = `${cur.m.length}/280`;
}

$('#palette').addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]');
  if (!b || b.disabled) return;
  if (cur.f.length >= MAX_STEMS) return toast(`${MAX_STEMS} stems max — it’s a bouquet, not a garden`);
  const t = +b.dataset.add;
  cur.f.push([t, FLOWERS[t].c]);
  renderPreview(true);
});
const cycle = (i) => { cur.f[i][1] = (cur.f[i][1] + 1) % COLORS.length; renderPreview(); };
$('#chips').addEventListener('click', (e) => {
  const rm = e.target.closest('[data-rm]'), cy = e.target.closest('[data-cycle]');
  if (rm) { cur.f.splice(+rm.dataset.rm, 1); renderPreview(); } else if (cy) cycle(+cy.dataset.cycle);
});
$('#preview').addEventListener('click', (e) => {
  const g = e.target.closest('[data-i]');
  if (g) cycle(+g.dataset.i);
});
$('#greenery').addEventListener('change', (e) => { cur.g = e.target.checked ? 1 : 0; renderPreview(); });
$('#toName').addEventListener('input', (e) => { cur.to = e.target.value; });
$('#fromName').addEventListener('input', (e) => { cur.fr = e.target.value; });
$('#msg').addEventListener('input', (e) => { cur.m = e.target.value; $('#msgCount').textContent = `${cur.m.length}/280`; });
$('#shuffleBtn').addEventListener('click', () => { Object.assign(cur, randomBouquet()); renderBuilder(); });
$('#clearBtn').addEventListener('click', () => { cur = { ...blank(), f: [] }; renderBuilder(); });

$('#starters').innerHTML = STARTERS.map((s) => `<button type="button" class="starter">${esc(s)}</button>`).join('');
$('#starters').addEventListener('click', (e) => {
  const b = e.target.closest('.starter');
  if (!b) return;
  const m = $('#msg');
  const text = b.textContent.replace('…', ' ');
  m.value = (m.value && !m.value.endsWith('\n') ? m.value + '\n' : m.value) + text;
  m.value = m.value.slice(0, 280);
  cur.m = m.value;
  $('#msgCount').textContent = `${cur.m.length}/280`;
  m.focus();
});

// ───────────── send ─────────────
let lastSent = null;
const shareText = (d) => `${d.fr ? d.fr + ' sent' : 'someone sent'} you a bouquet 💐 tap to unwrap:`;

function openShare(d) {
  lastSent = d;
  const link = linkFor(d);
  $('#shareLink').value = link;
  $('#waBtn').href = 'https://wa.me/?text=' + encodeURIComponent(shareText(d) + ' ' + link);
  $('#nativeShareBtn').hidden = !navigator.share;
  $('#shareDlg').showModal();
}

$('#sendBtn').addEventListener('click', () => {
  if (!cur.f.length) return toast('add at least one bloom first 🌷');
  if (!cur.m.trim() && !cur.to.trim()) { $('#toName').focus(); return toast('who’s it for? add a name or a note'); }
  const d = sanitize({ ...cur, to: cur.to.trim(), fr: cur.fr.trim(), m: cur.m.trim(), id: '' });
  store.from = d.fr || store.from;
  store.sent.unshift({ d, ts: Date.now() });
  store.sent = store.sent.slice(0, 40);
  const before = FLOWERS.filter(unlocked).length;
  store.sentCount++;
  save();
  openShare(d);
  if (FLOWERS.filter(unlocked).length > before) setTimeout(() => toast('new rare bloom unlocked 🔓 check the palette'), 600);
  refreshChrome();
});

$('#copyBtn').addEventListener('click', async () => {
  const inp = $('#shareLink');
  try { await navigator.clipboard.writeText(inp.value); } catch (e) { inp.select(); document.execCommand('copy'); }
  toast('link copied — go make their day');
});
$('#nativeShareBtn').addEventListener('click', () => {
  navigator.share({ title: 'a bouquet for you', text: shareText(lastSent), url: $('#shareLink').value }).catch(() => {});
});
$('#pngBtn').addEventListener('click', () => savePNG(lastSent));
$('#previewBtn').addEventListener('click', () => { $('#shareDlg').close(); openReceive(lastSent, true); });
$('#shareClose').addEventListener('click', () => $('#shareDlg').close());
$('#shareDlg').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

// ───────────── receive ─────────────
let recvCur = null;

function openReceive(d, isPreview) {
  recvCur = d;
  const el = $('#receive');
  el.style.background = BGS[d.bg];
  $('#giftTo').textContent = d.to ? `${d.to}, you’ve got flowers` : 'you’ve got flowers';
  $('#gift').hidden = false;
  $('#opened').hidden = true;
  $('#confetti').innerHTML = '';
  $('#sendBackBtn').hidden = !!isPreview;
  $('#recvCloseBtn').textContent = isPreview ? 'close preview' : 'my garden';
  el.dataset.preview = isPreview ? '1' : '';
  el.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#unwrapBtn').focus();
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $('#confetti').innerHTML = Array.from({ length: 36 }, () =>
    `<i style="left:${rnd(100)}%;background:${COLORS[rnd(COLORS.length)]};animation-duration:${2.2 + Math.random() * 2.5}s;animation-delay:${Math.random() * 0.8}s"></i>`).join('');
}

$('#unwrapBtn').addEventListener('click', () => {
  const d = recvCur;
  $('#recvArt').innerHTML = bouquetSVG(d);
  $('#noteTo').textContent = d.to ? `dear ${d.to},` : '';
  $('#noteMsg').textContent = d.m;
  $('#noteFrom').textContent = d.fr ? `— ${d.fr}` : '';
  $('#recvNote').hidden = !d.m && !d.to && !d.fr;
  $('#gift').hidden = true;
  $('#opened').hidden = false;
  confetti();
  if (!$('#receive').dataset.preview && !store.recv.some((r) => r.d.id === d.id) && !store.sent.some((r) => r.d.id === d.id)) {
    store.recv.unshift({ d, ts: Date.now() });
    store.recv = store.recv.slice(0, 40);
    save();
  }
});

function closeReceive() {
  $('#receive').hidden = true;
  document.body.style.overflow = '';
  if (location.hash.startsWith('#b=')) history.replaceState(null, '', location.pathname + location.search);
}
$('#recvCloseBtn').addEventListener('click', () => {
  const wasPreview = $('#receive').dataset.preview;
  closeReceive();
  if (wasPreview) $('#shareDlg').showModal(); else go('garden');
});
$('#recvSaveBtn').addEventListener('click', () => savePNG(recvCur));
$('#sendBackBtn').addEventListener('click', () => {
  const to = recvCur.fr;
  closeReceive();
  cur = { ...blank(), to };
  go('make');
  toast(to ? `making one for ${to} 💐` : 'your turn 💐');
});

function checkHash() {
  if (!location.hash.startsWith('#b=')) return false;
  const d = decode(location.hash.slice(3));
  if (!d) { toast('that bouquet link looks broken 🥀'); return false; }
  openReceive(d, false);
  return true;
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

  const base = FLOWERS.filter((f) => !f.lock);
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
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function shelf(el, list, kind) {
  if (!list.length) {
    el.innerHTML = `<p class="empty">${kind === 'sent' ? 'nothing sent yet — someone’s waiting on flowers 👀' : 'nothing here yet. send one first — they tend to come back.'}</p>`;
    return;
  }
  el.innerHTML = list.map((r, i) => {
    const who = kind === 'sent' ? (r.d.to ? 'to ' + r.d.to : 'sent') : (r.d.fr ? 'from ' + r.d.fr : 'from someone');
    const when = new Date(r.ts);
    return `<article class="card shelf-card"><div class="art" style="background:${BGS[r.d.bg]}">${bouquetSVG(r.d)}</div><h3>${esc(who)}</h3><time>${when.getDate()} ${MONTHS[when.getMonth()]}</time>`
      + `<div class="acts">${kind === 'sent'
        ? `<button class="linkbtn" data-act="share" data-i="${i}">share again</button><button class="linkbtn" data-act="remix" data-i="${i}">remix</button>`
        : `<button class="linkbtn" data-act="open" data-i="${i}">open</button><button class="linkbtn" data-act="back" data-i="${i}">send one back</button>`}</div></article>`;
  }).join('');
  el.onclick = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const d = list[+b.dataset.i].d;
    if (b.dataset.act === 'share') openShare(d);
    else if (b.dataset.act === 'remix') loadIntoBuilder(d, true);
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

  shelf($('#recvShelf'), store.recv, 'recv');
  shelf($('#sentShelf'), store.sent, 'sent');
}

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
if (!checkHash() && newDay && store.streak > 1) setTimeout(() => toast(`🔥 ${store.streak}-day streak — keep it blooming`), 500);
const soon = store.dates.find((x) => daysUntil(x.m, x.d) <= 3);
if (soon && !location.hash) setTimeout(() => toast(`heads up: ${soon.n}’s day is ${daysUntil(soon.m, soon.d) === 0 ? 'today' : 'almost here'} 💐`), 3200);
})();
