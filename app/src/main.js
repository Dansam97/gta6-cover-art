// Vice Frame studio wiring: load photos, assign them to panels, drag and
// zoom each one, pick a layout / size / grade, edit the caption, export PNG.
// Photos are read with object URLs on this machine only — nothing uploads.
import { drawCoverArt, LAYOUTS, EXPORT_SIZES, panelAt } from './cover.js';
import { parseShotQuery, shotPhotoUrl, markShotReady } from './shots.js';

const canvas = document.getElementById('posterCanvas');
const statusLine = document.getElementById('statusLine');
const titleInput = document.getElementById('titleInput');
const subtitleInput = document.getElementById('subtitleInput');
const badgeInput = document.getElementById('badgeInput');
const zoomRange = document.getElementById('zoomRange');
const panXRange = document.getElementById('panXRange');
const panYRange = document.getElementById('panYRange');
const gradeRange = document.getElementById('gradeRange');
const thumbStrip = document.getElementById('thumbStrip');
const selectedName = document.getElementById('selectedName');

const state = {
  layout: 'classic',
  theme: 'sunset',
  size: '1080x1080',
  title: titleInput.value,
  subtitle: subtitleInput.value,
  badge: badgeInput.value,
  grade: 72,
  grain: true,
  slots: [],
  photos: [],
  selected: 0,
};

function blankSlots() {
  const count = LAYOUTS[state.layout].panels.length;
  const old = state.slots;
  state.slots = Array.from({ length: count }, (_, i) => old[i] ?? { img: null, zoom: 100, panX: 0, panY: 0 });
  if (state.selected >= count) state.selected = 0;
}

export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function say(text) { statusLine.textContent = text; }

function redraw() {
  drawCoverArt(canvas, state, { highlight: document.body.classList.contains('shot-cover') ? -1 : state.selected });
  syncPanelControls();
}

function syncPanelControls() {
  const slot = state.slots[state.selected];
  if (!slot) return;
  selectedName.textContent = `Panel ${state.selected + 1} of ${state.slots.length}${slot.img ? '' : ' (scenery)'}`;
  zoomRange.value = slot.zoom; panXRange.value = slot.panX; panYRange.value = slot.panY;
  document.getElementById('zoomVal').textContent = `${slot.zoom}%`;
  document.getElementById('panXVal').textContent = slot.panX;
  document.getElementById('panYVal').textContent = slot.panY;
  document.getElementById('gradeVal').textContent = `${state.grade}%`;
}

function renderThumbs() {
  thumbStrip.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb' + (state.slots[state.selected]?.img === photo.img ? ' on' : '');
    btn.title = `${photo.name} — click to put it in panel ${state.selected + 1}`;
    const img = document.createElement('img');
    img.src = photo.url; img.alt = photo.name;
    btn.appendChild(img);
    btn.addEventListener('click', () => assignPhoto(i, state.selected));
    thumbStrip.appendChild(btn);
  });
}

function assignPhoto(photoIndex, panelIndex) {
  const photo = state.photos[photoIndex];
  if (!photo) return;
  state.slots[panelIndex] = { ...state.slots[panelIndex], img: photo.img };
  say(`“${photo.name}” is in panel ${panelIndex + 1}. Drag on the poster to position it.`);
  redraw(); renderThumbs();
}

async function addPhotoFile(file) {
  const url = URL.createObjectURL(file);
  const img = await loadImageFromUrl(url);
  state.photos.push({ name: file.name.replace(/\.[^.]+$/, ''), url, img });
  const empty = state.slots.findIndex((s) => !s.img);
  assignPhoto(state.photos.length - 1, empty >= 0 ? empty : state.selected);
  if (empty >= 0) state.selected = empty;
  redraw(); renderThumbs();
  return img;
}

async function addSample(name) {
  const url = `samples/${name}.jpg`;
  const existing = state.photos.find((p) => p.url === url);
  if (existing) { assignPhoto(state.photos.indexOf(existing), state.selected); return existing.img; }
  const img = await loadImageFromUrl(url);
  state.photos.push({ name, url, img });
  const empty = state.slots.findIndex((s) => !s.img);
  assignPhoto(state.photos.length - 1, empty >= 0 ? empty : state.selected);
  if (empty >= 0) state.selected = empty;
  redraw(); renderThumbs();
  return img;
}

function setLayout(key) {
  if (!LAYOUTS[key]) return;
  state.layout = key;
  blankSlots();
  document.querySelectorAll('#layoutSeg button').forEach((b) => b.classList.toggle('on', b.dataset.layout === key));
  redraw(); renderThumbs();
}

function setSize(key) {
  if (!EXPORT_SIZES[key]) return;
  state.size = key;
  const { w, h } = EXPORT_SIZES[key];
  canvas.width = w; canvas.height = h;
  document.querySelectorAll('#sizeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.size === key));
  document.getElementById('exportBtn').textContent = `⬇ Export PNG ${w}×${h}`;
  redraw();
}

function setTheme(key) {
  state.theme = key;
  document.querySelectorAll('#themeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.theme === key));
  redraw();
}

function exportPng() {
  const { w, h } = EXPORT_SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCoverArt(off, state, { highlight: -1 });
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-frame-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    say(`Saved vice-frame-${state.size}.png (${w}×${h}) — ready to post.`);
  }, 'image/png');
}

// ---- controls -------------------------------------------------------------
const photoInput = document.getElementById('photoInput');
photoInput.addEventListener('change', async (e) => {
  for (const file of e.target.files) await addPhotoFile(file);
  photoInput.value = '';
});
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
dropZone.addEventListener('drop', async (e) => {
  e.preventDefault(); dropZone.classList.remove('over');
  for (const file of e.dataTransfer.files) if (file.type.startsWith('image/')) await addPhotoFile(file);
});
document.getElementById('samplePier').addEventListener('click', () => addSample('pier'));
document.getElementById('sampleBlvd').addEventListener('click', () => addSample('boulevard'));
document.getElementById('fillAll').addEventListener('click', () => {
  if (!state.photos.length) { say('Add a photo first, then Fill all panels spreads it across the poster.'); return; }
  const photo = state.photos[state.photos.length - 1];
  state.slots.forEach((s, i) => { state.slots[i] = { ...s, img: photo.img }; });
  say(`Every panel now shows “${photo.name}”. Select panels to swap in other photos.`);
  redraw(); renderThumbs();
});
zoomRange.addEventListener('input', () => { state.slots[state.selected].zoom = Number(zoomRange.value); redraw(); });
panXRange.addEventListener('input', () => { state.slots[state.selected].panX = Number(panXRange.value); redraw(); });
panYRange.addEventListener('input', () => { state.slots[state.selected].panY = Number(panYRange.value); redraw(); });
document.getElementById('centerBtn').addEventListener('click', () => {
  Object.assign(state.slots[state.selected], { zoom: 100, panX: 0, panY: 0 }); redraw();
});
document.getElementById('clearBtn').addEventListener('click', () => {
  state.slots[state.selected].img = null; say(`Panel ${state.selected + 1} cleared back to neon scenery.`); redraw(); renderThumbs();
});
document.getElementById('swapBtn').addEventListener('click', () => {
  const next = (state.selected + 1) % state.slots.length;
  [state.slots[state.selected], state.slots[next]] = [state.slots[next], state.slots[state.selected]];
  say(`Swapped panels ${state.selected + 1} and ${next + 1}.`); redraw(); renderThumbs();
});
document.querySelectorAll('#layoutSeg button').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));
document.querySelectorAll('#sizeSeg button').forEach((b) => b.addEventListener('click', () => setSize(b.dataset.size)));
document.querySelectorAll('#themeSeg button').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.theme)));
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
badgeInput.addEventListener('input', () => { state.badge = badgeInput.value; redraw(); });
gradeRange.addEventListener('input', () => { state.grade = Number(gradeRange.value); redraw(); });
document.getElementById('grainToggle').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
document.getElementById('exportBtn').addEventListener('click', exportPng);

// Drag on the poster repositions the selected panel's photo; click selects.
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height };
}
canvas.addEventListener('pointerdown', (e) => {
  const { nx, ny } = canvasPoint(e);
  const hit = panelAt(state.layout, nx, ny);
  if (hit >= 0) state.selected = hit;
  drag = { x: e.clientX, y: e.clientY, panX: state.slots[state.selected]?.panX ?? 0, panY: state.slots[state.selected]?.panY ?? 0 };
  canvas.setPointerCapture(e.pointerId);
  redraw(); renderThumbs();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const slot = state.slots[state.selected];
  if (!slot?.img) return;
  slot.panX = Math.max(-100, Math.min(100, Math.round(drag.panX + ((e.clientX - drag.x) / r.width) * 220)));
  slot.panY = Math.max(-100, Math.min(100, Math.round(drag.panY + ((e.clientY - drag.y) / r.height) * 220)));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  const slot = state.slots[state.selected];
  if (!slot?.img) return;
  e.preventDefault();
  slot.zoom = Math.max(100, Math.min(320, slot.zoom + (e.deltaY < 0 ? 10 : -10)));
  redraw();
}, { passive: false });

// ---- start: screenshot scene or a friendly pre-filled studio ---------------
async function start() {
  blankSlots();
  const shot = parseShotQuery(location.search);
  if (shot) {
    document.body.classList.add(shot.mode === 'cover' ? 'shot-cover' : 'shot-editor');
    state.title = shot.title; state.subtitle = shot.subtitle; state.badge = shot.badge;
    titleInput.value = shot.title; subtitleInput.value = shot.subtitle; badgeInput.value = shot.badge;
    state.grade = shot.grade; gradeRange.value = shot.grade;
    setTheme(shot.theme);
    setLayout(shot.layout);
    setSize(shot.size);
    state.selected = Math.min(shot.selected, state.slots.length - 1);
    for (let i = 0; i < state.slots.length; i++) {
      const name = shot.photos[i % shot.photos.length];
      const url = shotPhotoUrl(name);
      if (!url) continue;
      const img = await loadImageFromUrl(url);
      state.photos.push({ name, url, img });
      state.slots[i] = { ...state.slots[i], img, zoom: 100 + (i % 2) * 8, panX: i % 2 ? 6 : -4, panY: i % 3 === 0 ? -4 : 2 };
    }
    redraw(); renderThumbs();
    markShotReady();
    return;
  }
  await addSample('pier');
  await addSample('boulevard');
  state.selected = 0;
  say('Samples loaded — swap in your own photos, drag them into place, then Export PNG.');
  redraw(); renderThumbs();
}

start();
