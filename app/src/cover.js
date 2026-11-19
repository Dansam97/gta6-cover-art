// Vice Frame cover renderer: multi-panel poster art with a Vice City colour
// grade, original vector scenery for empty panels, and bold stacked lettering.
// Everything is drawn with Canvas 2D from the user's own photos — no assets,
// no network, no borrowed artwork or lettering.

export const THEMES = {
  sunset: {
    label: 'Sunset Vice',
    sky: ['#2b1055', '#7b1e5e', '#ff5e3a', '#ffb347'],
    sun: '#ffd23f', accent: '#ff2e88', glow: 'rgba(255,94,58,.55)',
    title: ['#ffffff', '#ffd23f', '#ff2e88'], band: 'rgba(16,4,28,.82)',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#05001a', '#1b0650', '#7a1fd0', '#00e5ff'],
    sun: '#7df9ff', accent: '#00e5ff', glow: 'rgba(0,229,255,.5)',
    title: ['#ffffff', '#7df9ff', '#b537ff'], band: 'rgba(2,0,20,.85)',
  },
  miami: {
    label: 'Miami Day',
    sky: ['#0b4f6c', '#1590b8', '#5fd3c6', '#ffe9a3'],
    sun: '#fff3b0', accent: '#00c2a8', glow: 'rgba(255,210,63,.45)',
    title: ['#ffffff', '#ffe45e', '#00c2a8'], band: 'rgba(3,32,44,.82)',
  },
  noir: {
    label: 'Noir Heat',
    sky: ['#12060a', '#3d0c16', '#a4133c', '#ff8c42'],
    sun: '#ffcf6e', accent: '#e63946', glow: 'rgba(230,57,70,.5)',
    title: ['#ffffff', '#ffcf6e', '#e63946'], band: 'rgba(14,2,6,.88)',
  },
};

export const EXPORT_SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080×1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080×1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide 1920×1080' },
};

// Panel tilings as normalised rectangles [x, y, w, h]. Every layout fills the
// whole poster so the collage reads edge-to-edge like a game cover.
export const LAYOUTS = {
  classic: {
    label: 'Classic 6',
    panels: [
      [0, 0, 0.48, 0.62], [0.48, 0, 0.52, 0.40], [0.48, 0.40, 0.26, 0.32],
      [0.74, 0.40, 0.26, 0.32], [0, 0.62, 0.48, 0.38], [0.48, 0.72, 0.52, 0.28],
    ],
  },
  hero: {
    label: 'Hero + Trio',
    panels: [
      [0, 0, 0.67, 1], [0.67, 0, 0.33, 0.34], [0.67, 0.34, 0.33, 0.33], [0.67, 0.67, 0.33, 0.33],
    ],
  },
  strips: {
    label: 'Neon Strips',
    panels: [
      [0, 0, 0.2, 1], [0.2, 0, 0.2, 1], [0.4, 0, 0.2, 1], [0.6, 0, 0.2, 1], [0.8, 0, 0.2, 1],
    ],
  },
  quad: {
    label: 'Quad Grid',
    panels: [
      [0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5],
    ],
  },
};

/** Small deterministic random generator so grain looks the same every render. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A panel outline: a rectangle with two corners cut diagonally for that angular poster feel. */
export function panelPolygon(x, y, w, h, cut) {
  return [
    [x + cut, y], [x + w, y], [x + w, y + h - cut], [x + w - cut, y + h],
    [x, y + h], [x, y + cut],
  ];
}

function tracePath(ctx, points) {
  ctx.beginPath();
  points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
}

/** Original vector scenery — gradient sky, banded sun, skyline and a palm — for panels with no photo yet. */
export function drawScenePanel(ctx, x, y, w, h, theme, seed) {
  const rnd = seededRandom(seed * 977 + 13);
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  theme.sky.forEach((c, i) => sky.addColorStop(i / (theme.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  const sunR = Math.min(w, h) * (0.26 + rnd() * 0.1);
  const sunX = x + w * (0.3 + rnd() * 0.4);
  const sunY = y + h * 0.42;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = theme.sun;
  ctx.globalAlpha = 0.92;
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = theme.sky[1];
  for (let i = 0; i < 4; i++) ctx.fillRect(x, sunY + sunR * (0.12 + i * 0.2), w, sunR * 0.055);
  ctx.fillStyle = 'rgba(8,2,18,.88)';
  const base = y + h;
  ctx.beginPath(); ctx.moveTo(x, base);
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.08 + rnd() * 0.12);
    const bh = h * (0.14 + rnd() * 0.26);
    ctx.lineTo(bx, base - bh); ctx.lineTo(bx + bw, base - bh); ctx.lineTo(bx + bw, base);
    bx += bw + w * 0.015;
  }
  ctx.lineTo(x + w, base); ctx.closePath(); ctx.fill();
  drawPalm(ctx, x + w * (0.16 + rnd() * 0.6), base, h * 0.52, theme);
  ctx.restore();
}

/** A simple original palm silhouette drawn from curved fronds. */
export function drawPalm(ctx, x, baseY, height, theme) {
  ctx.save();
  ctx.strokeStyle = 'rgba(5,1,12,.92)';
  ctx.fillStyle = 'rgba(5,1,12,.92)';
  ctx.lineWidth = Math.max(3, height * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + height * 0.06, baseY - height * 0.6, x + height * 0.2, baseY - height);
  ctx.stroke();
  const topX = x + height * 0.2;
  const topY = baseY - height;
  for (let i = 0; i < 7; i++) {
    const ang = Math.PI * (0.08 + i * 0.14);
    const len = height * (0.34 + (i % 3) * 0.05);
    ctx.lineWidth = Math.max(2, height * 0.028);
    ctx.beginPath(); ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(ang) * len * 0.6, topY - Math.sin(ang) * len * 0.55 - height * 0.05,
      topX + Math.cos(ang) * len, topY - Math.sin(ang) * len * 0.25 + height * 0.1,
    );
    ctx.stroke();
  }
  ctx.restore();
  void theme;
}

/** Draws one photo into a panel rect with cover-crop, pan and zoom from its slot settings. */
export function drawPhotoInPanel(ctx, img, x, y, w, h, slot) {
  const zoom = (slot?.zoom ?? 100) / 100;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const maxPanX = Math.max(0, (dw - w) / 2);
  const maxPanY = Math.max(0, (dh - h) / 2);
  const dx = x + (w - dw) / 2 + ((slot?.panX ?? 0) / 100) * maxPanX;
  const dy = y + (h - dh) / 2 + ((slot?.panY ?? 0) / 100) * maxPanY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Applies the colour grade inside the current clip: warm light from below, teal shadows, soft glow. */
export function applyGrade(ctx, x, y, w, h, theme, strength) {
  const s = strength / 100;
  if (s <= 0) return;
  const grad = ctx.createLinearGradient(0, y + h, 0, y);
  grad.addColorStop(0, theme.sky[3]);
  grad.addColorStop(0.45, theme.sky[2]);
  grad.addColorStop(1, theme.sky[0]);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.5 * s;
  ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.65 * s;
  ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.16 * s;
  const hot = ctx.createRadialGradient(x + w / 2, y + h, 4, x + w / 2, y + h, Math.max(w, h));
  hot.addColorStop(0, theme.glow); hot.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hot; ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function fitFontSize(ctx, text, maxWidth, startSize, weight = 900) {
  let size = startSize;
  const set = () => { ctx.font = `${weight} ${size}px "Arial Narrow", Impact, "Helvetica Neue", sans-serif`; };
  set();
  while (ctx.measureText(text).width > maxWidth && size > 14) { size -= 3; set(); }
  return size;
}

/** A soft dark scrim behind the headline so lettering stays readable over bright photos. */
export function drawTitleScrim(ctx, w, h, theme) {
  const scrim = ctx.createLinearGradient(0, 0, 0, h * 0.34);
  scrim.addColorStop(0, 'rgba(8,1,20,.52)');
  scrim.addColorStop(0.7, 'rgba(8,1,20,.18)');
  scrim.addColorStop(1, 'rgba(8,1,20,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h * 0.34);
  ctx.fillStyle = theme.glow;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, 0, w, Math.max(3, h * 0.006));
  ctx.globalAlpha = 1;
}

/** Bold stacked title with gradient fill, heavy outline and a hard offset shadow — the poster's headline. */
export function drawTitle(ctx, w, h, title, theme) {
  const text = (title || '').trim().toUpperCase();
  if (!text) return;
  drawTitleScrim(ctx, w, h, theme);
  const words = text.split(/\s+/);
  const lines = words.length > 1 && text.length > 9 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [text];
  ctx.save();
  ctx.translate(w / 2, h * 0.035);
  ctx.rotate(-0.018);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let size = fitFontSize(ctx, lines[0], w * 0.88, h * 0.145);
  if (lines[1]) size = Math.min(size, fitFontSize(ctx, lines[1], w * 0.88, h * 0.145));
  ctx.font = `900 ${size}px "Arial Narrow", Impact, "Helvetica Neue", sans-serif`;
  try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
  lines.forEach((line, i) => {
    const ly = i * size * 0.94;
    const grad = ctx.createLinearGradient(0, ly, 0, ly + size);
    grad.addColorStop(0, theme.title[0]); grad.addColorStop(0.55, theme.title[1]); grad.addColorStop(1, theme.title[2]);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0d0218';
    ctx.lineWidth = size * 0.16;
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 0; ctx.shadowOffsetX = size * 0.06; ctx.shadowOffsetY = size * 0.09;
    ctx.strokeText(line, 0, ly);
    ctx.shadowColor = 'transparent'; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = grad;
    ctx.fillText(line, 0, ly);
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = Math.max(1.5, size * 0.022);
    ctx.strokeText(line, 0, ly);
  });
  ctx.restore();
}

/** Bottom band with the subtitle in spaced capitals plus a small badge pill near the top corner. */
export function drawCaptionBand(ctx, w, h, subtitle, badge, theme) {
  ctx.save();
  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const bandH = h * 0.085;
    ctx.fillStyle = theme.band;
    ctx.fillRect(0, h - bandH, w, bandH);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, h - bandH, w, Math.max(3, h * 0.006));
    const size = fitFontSize(ctx, sub, w * 0.9, bandH * 0.52, 800);
    ctx.font = `800 ${size}px "Arial Narrow", "Helvetica Neue", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.3)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = theme.glow; ctx.shadowBlur = size * 0.5;
    ctx.fillText(sub, w / 2, h - bandH / 2 + 1);
    ctx.shadowBlur = 0;
  }
  const badgeText = (badge || '').trim().toUpperCase();
  if (badgeText) {
    ctx.font = `800 ${Math.round(h * 0.021)}px system-ui, sans-serif`;
    const tw = ctx.measureText(badgeText).width;
    const bw = tw + h * 0.036;
    const bh = h * 0.042;
    // Sit the badge just above the caption band on the right, clear of the headline.
    const bx = w - bw - w * 0.025;
    const by = h - h * 0.085 - bh - h * 0.018;
    ctx.fillStyle = theme.band;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill();
    ctx.strokeStyle = theme.accent; ctx.lineWidth = Math.max(1.5, h * 0.002); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, bx + bw / 2, by + bh / 2 + 1);
  }
  ctx.restore();
}

/** Film grain and a vignette, drawn from a seeded pattern so exports stay stable. */
export function drawFinish(ctx, w, h, theme) {
  const rnd = seededRandom(4242);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  const dots = Math.round((w * h) / 9000);
  for (let i = 0; i < dots; i++) ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
  ctx.globalAlpha = 0.045;
  ctx.fillStyle = '#000000';
  for (let i = 0; i < dots; i++) ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
  ctx.globalAlpha = 1;
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(5,0,14,.42)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);
  const shine = ctx.createLinearGradient(0, 0, w, h);
  shine.addColorStop(0, 'rgba(255,255,255,.10)');
  shine.addColorStop(0.28, 'rgba(255,255,255,0)');
  shine.addColorStop(1, 'rgba(0,0,0,.08)');
  ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h);
  void theme;
  ctx.restore();
}

/**
 * Draws the full cover onto a canvas at its own pixel size.
 * state: { layout, theme, title, subtitle, badge, grade, grain, slots }
 * slots[i]: { img|null, zoom, panX, panY } — one per panel of the layout.
 * options.highlight: panel index to outline (editor only, never exported).
 */
export function drawCoverArt(canvas, state, options = {}) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const theme = THEMES[state.theme] ?? THEMES.sunset;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.classic;
  ctx.fillStyle = theme.sky[0];
  ctx.fillRect(0, 0, w, h);
  const gap = Math.max(4, Math.round(w * 0.007));
  const cut = Math.min(46, w * 0.035);
  layout.panels.forEach(([nx, ny, nw, nh], i) => {
    const x = nx * w; const y = ny * h; const pw = nw * w; const ph = nh * h;
    const poly = panelPolygon(x + gap / 2, y + gap / 2, pw - gap, ph - gap, Math.min(cut, pw * 0.22, ph * 0.22));
    ctx.save();
    tracePath(ctx, poly);
    ctx.clip();
    const slot = state.slots[i];
    if (slot?.img) drawPhotoInPanel(ctx, slot.img, x, y, pw, ph, slot);
    else drawScenePanel(ctx, x, y, pw, ph, theme, i + 1);
    applyGrade(ctx, x, y, pw, ph, theme, state.grade);
    ctx.restore();
    tracePath(ctx, poly);
    ctx.strokeStyle = '#0a0214';
    ctx.lineWidth = gap + 3;
    ctx.stroke();
    tracePath(ctx, poly);
    ctx.strokeStyle = 'rgba(255,255,255,.92)';
    ctx.lineWidth = Math.max(2, gap * 0.42);
    ctx.stroke();
    if (options.highlight === i) {
      tracePath(ctx, poly);
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = Math.max(4, gap * 0.9);
      ctx.setLineDash([18, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
  drawTitle(ctx, w, h, state.title, theme);
  drawCaptionBand(ctx, w, h, state.subtitle, state.badge, theme);
  if (state.grain) drawFinish(ctx, w, h, theme);
  return canvas;
}

/** Returns which panel (index) contains a normalised point, or -1. */
export function panelAt(layoutKey, nx, ny) {
  const layout = LAYOUTS[layoutKey] ?? LAYOUTS.classic;
  return layout.panels.findIndex(([x, y, w, h]) => nx >= x && nx < x + w && ny >= y && ny < y + h);
}
