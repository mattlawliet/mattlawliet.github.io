// Renders the project grid and the project pages from projects.json.
//
// projects.json stays the only source of truth for what appears here; nothing about a
// project is written into this file or into index.html. Everything a published project
// says about itself beyond that — stats, gallery, description, versions — is fetched
// live from Modrinth when its page is opened.

// Same cache key as the <script> tag, so mc.js can't go stale on its own.
const ASSET_V = new URL(import.meta.url).searchParams.get('v') ?? '';

const grid = document.getElementById('grid');
const tip = document.getElementById('tip');
const detail = document.getElementById('detail');

const API = 'https://api.modrinth.com/v2';
const apiCache = new Map();

let PROJECTS = [];
let top = null;
let stage = null;
let detailArt = null;

const STATUS = {
  published: 'Published',
  'in-review': 'In review',
  source: 'Source available',
  local: 'Unreleased',
};

// Tiers come straight from `status`; there is no separate field, and the three
// "local" projects happen to be exactly the ones that are not Minecraft mods.
const TIERS = [
  { label: 'Published', match: (p) => p.status === 'published' || p.status === 'in-review' },
  { label: 'Source available', match: (p) => p.status === 'source' },
  { label: 'In the workshop', match: (p) => true },
];

// Live download count decides an item's rarity, which drives both its colour and how
// much room its tile gets. Unreleased projects have no count and stay common.
const RARITY = (d) =>
  d == null ? 'common' : d >= 200 ? 'epic' : d >= 100 ? 'rare' : d >= 25 ? 'uncommon' : 'common';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

const num = (n) => (n == null ? '—' : n.toLocaleString());
const date = (s) =>
  s ? new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const range = (a) => (!a?.length ? '—' : a.length === 1 ? a[0] : `${a[0]} – ${a[a.length - 1]}`);

const status = (p) => STATUS[p.status] ?? 'Unreleased';

// One shared promise for the renderer: a deep link opens a page before the grid has
// finished mounting, and both paths need the same stage rather than racing to make one.
let stageReady = null;
function ensureStage() {
  stageReady ??= import(`/mc.js${ASSET_V ? `?v=${ASSET_V}` : ''}`).then((lib) => {
    stage ??= lib.createStage(document.getElementById('gl'));
    return lib;
  });
  return stageReady;
}

/* ── grid ─────────────────────────────────────────── */

function tile(p) {
  const r = RARITY(p.downloads);
  const size = r === 'epic' ? 'big' : r === 'rare' ? 'wide' : '';
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `tile ${size} ${p.downloads == null ? 'unreleased' : ''}`.trim();
  el.dataset.id = p.id;
  el.dataset.r = r;
  el.setAttribute('aria-label', `${p.name} — ${p.kind}, ${status(p)}`);
  el.innerHTML = `
    ${p.id === top ? '<span class="glint-tag">most downloaded</span>' : ''}
    <span class="art"></span>
    ${p.id === 'wtf' ? '<span class="cursor-compass"></span>' : ''}
    <span class="nm r-${r}">${esc(p.name)}</span>
    <span class="bl">${esc(p.blurb)}</span>
    <span class="dl">${p.downloads != null ? `${p.downloads.toLocaleString()} downloads` : esc(status(p))}</span>`;
  return el;
}

function render() {
  const left = [...PROJECTS].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  const sections = [];
  for (const t of TIERS) {
    const mine = left.filter(t.match);
    if (!mine.length) continue;
    mine.forEach((p) => left.splice(left.indexOf(p), 1));
    const sec = document.createElement('section');
    sec.className = 'tier';
    sec.innerHTML = `<h3 class="tier-h">${esc(t.label)}<span>${mine.length}</span></h3>`;
    const g = document.createElement('div');
    g.className = 'tier-grid';
    g.append(...mine.map(tile));
    sec.append(g);
    sections.push(sec);
  }
  grid.replaceChildren(...sections);
  document.getElementById('count').textContent = PROJECTS.length;

  // Summed from projects.json rather than fetched: sync.py already keeps those counts
  // current, and the alternative is eight API calls before the page can say anything.
  const published = PROJECTS.filter((p) => p.downloads != null);
  const total = published.reduce((n, p) => n + p.downloads, 0);
  document.getElementById('tally').innerHTML =
    `<b>${total.toLocaleString()}</b> downloads · ${published.length} published · ${PROJECTS.length} projects`;
}

/* ── the models behind the grid ───────────────────── */

async function mountModels() {
  const lib = await ensureStage();
  stage.showAll(!document.body.classList.contains('detail-open'));
  stage.clear();

  // the hero mask: Matt's own model, same renderer, same cursor-follow as the tiles
  const hero = document.getElementById('heroArt');
  if (hero) {
    lib.loadItem('models')
      .then((item) => {
        item.yaw = Math.PI;   // face-on, not the three-quarter inventory pose blocks use
        item.tilt = 0;        // and level, since it reads as a portrait rather than an item
        item.holder.rotation.set(0, item.yaw, 0);
        stage.add(hero, item, { scale: 0.72 });
      })
      .catch(() => {});
    hero.addEventListener('pointerenter', () => stage.hot(hero, true));
    hero.addEventListener('pointerleave', () => stage.hot(hero, false));
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      stage.point(hero, ((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    });
  }

  const wtf = grid.querySelector('.tile[data-id="wtf"]');
  const puck = wtf?.querySelector('.cursor-compass');
  if (puck) lib.loadItem('wtf-compass').then((i) => stage.add(puck, i, { mode: 'compass', scale: 1.15 }));

  for (const t of grid.querySelectorAll('.tile')) {
    const art = t.querySelector('.art');
    lib.loadItem(t.dataset.id)
      .then((item) => stage.add(art, item, { scale: t.classList.contains('big') ? 0.68 : 1 }))
      .catch(() => {});

    t.addEventListener('pointerenter', () => stage.hot(art, true));
    t.addEventListener('pointerleave', () => {
      stage.hot(art, false);
      if (puck && t === wtf) stage.show(puck, false);
    });
    t.addEventListener('pointermove', (e) => {
      const r = art.getBoundingClientRect();
      stage.point(art, ((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      if (!puck || t !== wtf) return;
      // the compass rides the cursor and keeps its needle on the shulker box
      const tr = wtf.getBoundingClientRect();
      puck.style.transform = `translate(${e.clientX - tr.left - 38}px, ${e.clientY - tr.top - 38}px)`;
      stage.aim(puck, Math.atan2(-(r.left + r.width / 2 - e.clientX), -(r.top + r.height / 2 - e.clientY)));
      stage.show(puck, true);
    });
  }
}

/* ── tooltip ──────────────────────────────────────── */

// Checked per event, not once: a hybrid laptop has both a trackpad and a touchscreen,
// and which one is in use can change between interactions.
const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
const fine = () => finePointer.matches;

function showTip(el) {
  const p = PROJECTS.find((x) => x.id === el.dataset.id);
  if (!p) return;
  const r = RARITY(p.downloads);
  const stats = [
    p.version && `v${esc(p.version)}`,
    p.downloads != null && `${p.downloads.toLocaleString()} downloads`,
    p.mc && esc(p.mc),
  ].filter(Boolean);
  tip.innerHTML = `
    <div class="t-name r-${r}">${esc(p.name)}</div>
    <div class="t-kind">${esc(p.kind)}</div>
    <div class="t-lore">${esc(p.blurb)}</div>
    ${stats.map((s) => `<div class="t-stat">${s}</div>`).join('')}
    ${p.id === top ? '<div class="t-foot t-glint">Most downloaded</div>' : ''}
    <div class="t-foot">${esc(status(p))}</div>`;
  tip.classList.add('show');
  tip.setAttribute('aria-hidden', 'false');
  place(el);
}

function hideTip() {
  tip.classList.remove('show');
  tip.setAttribute('aria-hidden', 'true');
}

function place(el) {
  const r = el.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  let x = r.right + 12;
  let y = r.top - 6;
  if (x + t.width > innerWidth - 8) x = Math.max(8, r.left - t.width - 12);
  if (y + t.height > innerHeight - 8) y = Math.max(8, innerHeight - t.height - 8);
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}

const target = (e) => e.target.closest('.tile');

// The tooltip is a pointer affordance and stays one. On touch it does not appear at
// all: a tap opens the project page, which carries everything the tooltip showed and
// the whole public record besides. Keyboard focus still summons it.
grid.addEventListener('pointerover', (e) => { if (fine()) { const t = target(e); if (t) showTip(t); } });
grid.addEventListener('pointerout', (e) => {
  const t = target(e);
  if (fine() && t && !t.contains(e.relatedTarget)) hideTip();
});
grid.addEventListener('focusin', (e) => { const t = target(e); if (t) showTip(t); });
grid.addEventListener('focusout', hideTip);
grid.addEventListener('click', (e) => {
  const t = target(e);
  if (!t) return;
  hideTip();
  openProject(t.dataset.id);
});
addEventListener('scroll', hideTip, { passive: true });

/* ── project pages ────────────────────────────────── */

// Modrinth bodies are plain markdown, so escape first and transform after: nothing from
// the API reaches the DOM as HTML.
function md(src) {
  const inline = (t) =>
    t
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  const out = [];
  let para = [];
  let list = [];
  const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushL = () => {
    if (list.length) { out.push(`<ul>${list.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`); list = []; }
  };
  for (const raw of esc(src).split('\n')) {
    const l = raw.trim();
    if (!l) { flushL(); flushP(); continue; }
    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushL(); flushP(); const n = h[1].length <= 2 ? 3 : 4; out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; }
    const li = l.match(/^[-*]\s+(.*)$/);
    if (li) { flushP(); list.push(li[1]); continue; }
    flushL();
    para.push(l);
  }
  flushL();
  flushP();
  return out.join('');
}

function modrinth(slug) {
  if (!apiCache.has(slug)) {
    apiCache.set(slug, Promise.all([
      fetch(`${API}/project/${slug}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API}/project/${slug}/version`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([proj, vers]) => ({ proj, vers })).catch(() => ({ proj: null, vers: [] })));
  }
  return apiCache.get(slug);
}

const statRow = (pairs) =>
  `<dl class="d-stats">${pairs
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `<div class="d-stat"><dt>${esc(k)}</dt><dd>${v}</dd></div>`)
    .join('')}</dl>`;

async function openProject(id, push = true) {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return;
  if (push && routedId() !== id) history.pushState(null, '', `/p/${id}/`);
  const r = RARITY(p.downloads);
  const many = p.models?.length > 1;

  detail.innerHTML = `
    <div class="d-wrap">
      <button class="d-back">← All projects</button>
      <div class="d-top${p.models?.length ? ' stacked' : ''}">
        <div>
          <div class="d-art${p.models?.length ? ' carousel' : ''}"></div>
          ${many ? `
            <div class="d-carousel-ctl">
              <button class="c-prev" aria-label="Previous model">←</button>
              <span class="d-cname">${esc(p.models[0].name)}</span>
              <button class="c-next" aria-label="Next model">→</button>
            </div>
            <div class="d-dots">${p.models
              .map((m, i) => `<button class="d-dot${i ? '' : ' on'}" data-i="${i}" aria-label="${esc(m.name)}"></button>`)
              .join('')}</div>` : ''}
        </div>
        <div>
          <h2 class="d-name r-${r}">${esc(p.name)}</h2>
          <p class="d-kind">${esc(p.kind)} · ${esc(status(p))} · ${r}</p>
          <p class="d-desc">${esc(p.detail || p.blurb)}</p>
          <div class="d-links"></div>
        </div>
      </div>
      <div class="d-rest"><p class="d-note">Loading public data…</p></div>
    </div>`;

  document.body.classList.add('detail-open');
  detail.querySelector('.d-back').addEventListener('click', closeProject);
  detail.scrollTop = 0;

  // the page takes the shared canvas over from the grid
  if (detailArt) stage?.remove(detailArt);
  detailArt = detail.querySelector('.d-art');
  ensureStage().then((lib) => {
    stage.showAll(false);
    if (detailArt !== detail.querySelector('.d-art')) return;   // a later page won the race
    if (p.models?.length) {
      lib.loadCarousel(p.models)
        .then((item) => { stage.add(detailArt, item, { mode: 'detail' }); if (many) wireCarousel(p); })
        .catch(() => {});
    } else {
      lib.loadItem(p.id).then((item) => stage.add(detailArt, item, { scale: 0.85, mode: 'detail' })).catch(() => {});
    }
  });

  const rest = detail.querySelector('.d-rest');
  const links = detail.querySelector('.d-links');

  if (!p.modrinth) {
    links.innerHTML = p.github ? `<a href="${esc(p.github)}" target="_blank" rel="noopener">Source on GitHub</a>` : '';
    rest.innerHTML =
      statRow([
        ['Version', p.version ? `v${esc(p.version)}` : '—'],
        ['Target', esc(p.mc)],
        ['Status', esc(status(p))],
      ]) +
      `<p class="d-note">Not published on Modrinth, so there is no public record to pull.
       Everything here comes from this site's own data.</p>`;
    return;
  }

  const { proj, vers } = await modrinth(p.modrinth);
  if (routedId() !== id) return; // navigated away while fetching
  if (!proj) { rest.innerHTML = '<p class="d-note">Could not reach Modrinth just now.</p>'; return; }

  links.innerHTML = [
    `<a href="https://modrinth.com/${proj.project_type}/${esc(proj.slug)}" target="_blank" rel="noopener">Modrinth</a>`,
    proj.source_url && `<a href="${esc(proj.source_url)}" target="_blank" rel="noopener">Source</a>`,
    proj.issues_url && `<a href="${esc(proj.issues_url)}" target="_blank" rel="noopener">Issues</a>`,
    proj.wiki_url && `<a href="${esc(proj.wiki_url)}" target="_blank" rel="noopener">Wiki</a>`,
    proj.discord_url && `<a href="${esc(proj.discord_url)}" target="_blank" rel="noopener">Discord</a>`,
  ].filter(Boolean).join('');

  const gallery = (proj.gallery ?? []).slice().sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0));
  rest.innerHTML =
    statRow([
      ['Downloads', num(proj.downloads)],
      ['Followers', num(proj.followers)],
      ['Latest', vers[0] ? `v${esc(vers[0].version_number)}` : '—'],
      ['Releases', num(vers.length)],
      ['Minecraft', esc(range(proj.game_versions))],
      ['Loaders', esc((proj.loaders ?? []).join(', ') || '—')],
      ['Environment', esc(
        proj.server_side === 'unsupported' ? 'Client only'
          : proj.client_side === 'unsupported' ? 'Server only' : 'Client & server')],
      ['License', esc(proj.license?.id ?? '—')],
      ['Published', date(proj.published)],
      ['Updated', date(proj.updated)],
    ]) +
    (gallery.length
      ? `<h3 class="d-h">Gallery</h3><div class="d-gal">${gallery
          .map((g) => `<figure class="d-shot">
            <img src="${esc(g.url)}" alt="${esc(g.title ?? '')}" loading="lazy">
            ${g.title ? `<figcaption>${esc(g.title)}</figcaption>` : ''}</figure>`)
          .join('')}</div>`
      : '') +
    (proj.body ? `<h3 class="d-h">About</h3><div class="d-body">${md(proj.body)}</div>` : '') +
    (vers.length
      ? `<h3 class="d-h">Versions</h3><div class="d-vers-wrap"><table class="d-vers">
          <tr><th>Version</th><th>Minecraft</th><th>Loaders</th><th>Downloads</th><th>Published</th></tr>
          ${vers.slice(0, 10).map((v) => `<tr>
            <td>v${esc(v.version_number)}</td><td>${esc(range(v.game_versions))}</td>
            <td>${esc((v.loaders ?? []).join(', '))}</td><td>${num(v.downloads)}</td>
            <td>${date(v.date_published)}</td></tr>`).join('')}
        </table></div>`
      : '');
}

function wireCarousel(p) {
  const label = detail.querySelector('.d-cname');
  const dots = [...detail.querySelectorAll('.d-dot')];
  let i = 0;
  const go = (n) => {
    i = (n + p.models.length) % p.models.length;
    stage.index(detailArt, i);
    label.textContent = p.models[i].name;
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
  };
  detail.querySelector('.c-prev').addEventListener('click', () => go(i - 1));
  detail.querySelector('.c-next').addEventListener('click', () => go(i + 1));
  dots.forEach((d) => d.addEventListener('click', () => go(+d.dataset.i)));
}

function closeProject() {
  if (routedId()) history.pushState(null, '', '/');
  document.body.classList.remove('detail-open');
  if (detailArt) { stage?.remove(detailArt); detailArt = null; }
  stage?.showAll(true);
}

// A project page is a real URL — /p/wtf/ — so a pasted link can carry its own preview.
// The old #/wtf form still resolves, for links shared before this existed.
function routedId() {
  const m = location.pathname.match(/^\/p\/([^/]+)\/?$/);
  return m ? m[1] : location.hash.replace(/^#\//, '');
}

function route() {
  const id = routedId();
  if (id && PROJECTS.some((x) => x.id === id)) openProject(id, false);
  else closeProject();
}

addEventListener('popstate', route);
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.body.classList.contains('detail-open')) closeProject();
  else hideTip();
});

/* ── boot ─────────────────────────────────────────── */

fetch('/projects.json')
  .then((r) => r.json())
  .then((d) => {
    PROJECTS = d.projects;
    top = [...PROJECTS].sort((a, b) => (b.downloads || 0) - (a.downloads || 0))[0]?.id;
    render();
    mountModels().catch(() => {});
    route();
  })
  .catch(() => {
    grid.innerHTML = '<p class="load-fail">Could not load projects. Try a refresh.</p>';
  });
