// Same cache key as the <script> tag, so viewer.js can't go stale on its own.
const ASSET_V = new URL(import.meta.url).searchParams.get('v') ?? '';

const grid = document.getElementById('grid');
const filterBar = document.getElementById('filters');
const rail = document.getElementById('rail');
const scrim = document.getElementById('scrim');

let PROJECTS = [];
let active = null;
let disposeViewer = null;

const STATUS = {
  published: { label: 'Published', cls: 'ok' },
  'in-review': { label: 'In review', cls: 'wait' },
  source: { label: 'Source available', cls: 'src' },
  local: { label: 'Unreleased', cls: 'idle' },
};

const KIND = { 'Fabric Mod': 'fabric', 'Paper Plugin': 'paper', Tool: 'tool', '3D Art': 'art' };

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

function card(p) {
  const st = STATUS[p.status] ?? STATUS.local;
  const el = document.createElement('button');
  el.className = 'card';
  el.type = 'button';
  el.dataset.kind = p.kind;
  el.dataset.id = p.id;
  el.setAttribute('aria-label', `${p.name} — open details`);
  el.innerHTML = `
    <span class="slot" aria-hidden="true">${esc(p.icon)}</span>
    <span class="card-body">
      <span class="card-head">
        <span class="card-name">${esc(p.name)}</span>
        <span class="dot ${st.cls}" title="${st.label}"></span>
      </span>
      <span class="card-blurb">${esc(p.blurb)}</span>
      <span class="card-foot">
        <span class="chip ${KIND[p.kind] ?? 'tool'}">${esc(p.kind)}</span>
        ${p.version ? `<span class="ver">v${esc(p.version)}</span>` : ''}
        ${p.downloads ? `<span class="dl">${p.downloads.toLocaleString()}&nbsp;↓</span>` : ''}
      </span>
    </span>`;
  el.addEventListener('click', () => open(p.id));
  return el;
}

function row(k, v) {
  return v == null || v === '' ? '' : `<div class="row"><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
}

function open(id) {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return;
  active = id;
  const st = STATUS[p.status] ?? STATUS.local;
  const links = [
    p.modrinth &&
      `<a href="https://modrinth.com/${p.modrinth_type ?? 'mod'}/${esc(p.modrinth)}" target="_blank" rel="noopener">Modrinth</a>`,
    p.github && `<a href="${esc(p.github)}" target="_blank" rel="noopener">Source</a>`,
  ]
    .filter(Boolean)
    .join('');

  rail.innerHTML = `
    <div class="rail-top">
      <span class="slot big" aria-hidden="true">${esc(p.icon)}</span>
      <div>
        <h3>${esc(p.name)}</h3>
        <span class="chip ${KIND[p.kind] ?? 'tool'}">${esc(p.kind)}</span>
      </div>
      <button class="close" aria-label="Close details">&times;</button>
    </div>
    <p class="lead">${esc(p.blurb)}</p>
    <p class="body">${esc(p.detail)}</p>
    <dl class="manifest">
      ${row('Status', `<span class="state ${st.cls}">${st.label}</span>`)}
      ${row('Version', p.version ? `v${esc(p.version)}` : '<span class="muted">unreleased</span>')}
      ${row('Target', esc(p.mc))}
      ${row('Downloads', p.downloads ? p.downloads.toLocaleString() : null)}
    </dl>
    ${p.models?.length ? viewerMarkup(p.models) : ''}
    ${links ? `<div class="rail-links">${links}</div>` : ''}`;

  rail.querySelector('.close').addEventListener('click', close);
  if (p.models?.length) initViewer(p.models);
  document.body.classList.add('rail-open');
  rail.hidden = false;
  requestAnimationFrame(() => rail.classList.add('in'));
  [...grid.children].forEach((c) => c.classList.toggle('sel', c.dataset.id === id));
  rail.querySelector('.close').focus();
}

function viewerMarkup(models) {
  return `
    <div class="viewer">
      <canvas id="stage" aria-label="3D model preview"></canvas>
      <div class="viewer-tabs" role="tablist">
        ${models
          .map(
            (m, i) =>
              `<button role="tab" class="vt${i === 0 ? ' on' : ''}" data-file="${esc(m.file)}"
                 aria-selected="${i === 0}">${esc(m.name)}</button>`
          )
          .join('')}
      </div>
      <p class="viewer-hint">Drag to rotate</p>
    </div>`;
}

async function initViewer(models) {
  const canvas = rail.querySelector('#stage');
  const tabs = [...rail.querySelectorAll('.vt')];
  let mod;
  try {
    mod = await import(`./viewer.js${ASSET_V ? `?v=${ASSET_V}` : ''}`);
  } catch {
    canvas.closest('.viewer').innerHTML = '<p class="viewer-fail">3D preview unavailable.</p>';
    return;
  }
  const load = async (file) => {
    disposeViewer?.();
    disposeViewer = null;
    try {
      disposeViewer = await mod.mount(canvas, file);
    } catch (err) {
      canvas.closest('.viewer').innerHTML = `<p class="viewer-fail">Could not load model.</p>`;
    }
  };
  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      tabs.forEach((x) => {
        x.classList.toggle('on', x === t);
        x.setAttribute('aria-selected', x === t);
      });
      load(t.dataset.file);
    })
  );
  load(tabs[0].dataset.file);
}

function close() {
  disposeViewer?.();
  disposeViewer = null;
  active = null;
  rail.classList.remove('in');
  document.body.classList.remove('rail-open');
  [...grid.children].forEach((c) => c.classList.remove('sel'));
  setTimeout(() => {
    if (!active) rail.hidden = true;
  }, 220);
}

function render(kind = 'all') {
  grid.replaceChildren();
  const list = PROJECTS.filter((p) => kind === 'all' || p.kind === kind);
  list.forEach((p, i) => {
    const el = card(p);
    el.style.setProperty('--i', i);
    grid.append(el);
  });
  grid.classList.toggle('empty', !list.length);
}

filterBar.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter');
  if (!btn) return;
  filterBar.querySelectorAll('.filter').forEach((f) => {
    f.classList.toggle('active', f === btn);
    f.setAttribute('aria-pressed', f === btn);
  });
  close();
  render(btn.dataset.tag);
});

scrim.addEventListener('click', close);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && active) close();
});

fetch('projects.json')
  .then((r) => r.json())
  .then((d) => {
    PROJECTS = d.projects;
    render();
    document.getElementById('count').textContent = PROJECTS.length;
  })
  .catch(() => {
    grid.innerHTML = '<p class="load-fail">Could not load projects. Try a refresh.</p>';
  });
