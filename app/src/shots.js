// Fixed scenes for screenshots, driven by query parameters so the same URL
// always paints the same cover:
//   ?shot=cover&layout=classic&theme=sunset&photos=pier,boulevard&title=..&subtitle=..
//   ?shot=editor&...  shows the full studio with a photo loaded.
// photos is a comma list of sample names (samples/<name>.jpg) or "scene"
// for the built-in vector scenery. window.__shotReady flips once painted.

export function parseShotQuery(search) {
  const q = new URLSearchParams(search);
  if (!q.get('shot')) return null;
  return {
    mode: q.get('shot'),
    layout: q.get('layout') || 'classic',
    theme: q.get('theme') || 'sunset',
    size: q.get('size') || '1080x1080',
    photos: (q.get('photos') || 'pier,boulevard').split(',').map((s) => s.trim()).filter(Boolean),
    title: q.get('title') || 'VICE HEAT',
    subtitle: q.get('subtitle') || 'SUNSET CITY STORIES',
    badge: q.get('badge') || 'EST. 2026 ★ NEON',
    grade: Number(q.get('grade') || 72),
    selected: Number(q.get('selected') || 0),
  };
}

export function shotPhotoUrl(name) {
  return name === 'scene' ? null : `samples/${name}.jpg`;
}

export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
