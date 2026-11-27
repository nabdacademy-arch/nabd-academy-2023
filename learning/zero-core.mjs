/* NABD ZERO: public pack definitions and device-only practice transfer. No account data. */
export const PRACTICE_KEY = 'nabd-learning-practice-v1';
export const BACKUP_SCHEMA = 'nabd-zero-practice/v1';
export const PACKS = Object.freeze({
  learning: {
    cache: 'nabd-learning-public-v9',
    scope: './',
    assets: ['./','./index.html','./zero.html','./zero.css','./zero.mjs','./zero-core.mjs','./styles.css','./visuals.css','./knowledge.css','./app.mjs','./crisis-tracks.mjs','./crisis-evidence.html','./crisis-evidence.mjs','./crisis-observations.json','./knowledge-data.mjs','./knowledge-atlas.mjs','./medical-visuals.mjs','./anatomy-lightbox.mjs','./heart-studio.mjs','./heart-webgl.mjs','./heart-simulator.mjs','./tutor-format.mjs','./core.mjs','./content.mjs','./icon.svg','./manifest.webmanifest']
  },
  atlas: {
    cache: 'nabd-atlas-foundation-v8',
    scope: '../atlas/',
    assets: ['./','./index.html','./heart-lab.html','./clinical-hub.html','./hospital-3d.html','./hospital-3d.css','./hospital-3d.mjs','./styles.css','./clinical-hub.css','./app.mjs','./clinical-hub.mjs','./clinical-cases.mjs','./clinical-authoring.mjs','./cases-critical.mjs','./cases-general.mjs','./cases-specialist.mjs','./cases-injury.mjs','./clinical-engine.mjs','./scenario-data.mjs','./manifest.webmanifest','./icon.svg','./sw.js','./images/hero.webp','./images/emergency.webp','./images/pediatrics.webp','./images/simulation.webp']
  }
});
export function readiness(expected, present) {
  const available = new Set(present);
  const missing = expected.filter(file => !available.has(file));
  return { ready: missing.length === 0, saved: expected.length - missing.length,
    total: expected.length, missing };
}
function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function cleanPractice(catalog, value, strict = false) {
  if (!plainObject(value)) throw Error('Invalid practice data');
  const allowed = new Map(catalog.map(lesson => [lesson.id, lesson.quiz.length]));
  const clean = Object.create(null);
  for (const [id, progress] of Object.entries(value)) {
    if (!allowed.has(id) || !plainObject(progress) ||
      (progress.completed !== undefined && typeof progress.completed !== 'boolean') ||
      (progress.score !== undefined && (!Number.isInteger(progress.score) || progress.score < 0 || progress.score > allowed.get(id)))) {
      if (strict) throw Error('Invalid lesson record');
      continue;
    }
    clean[id] = {completed: progress.completed === true, score: progress.score ?? 0};
  }
  return clean;
}
export function createBackup(catalog, progress, date = new Date()) {
  const lessons = cleanPractice(catalog, progress);
  return JSON.stringify({schema: BACKUP_SCHEMA, exportedAt: date.toISOString(), lessons}, null, 2);
}
export function mergeBackup(catalog, existing, json) {
  if (typeof json !== 'string' || json.length > 65536) throw Error('Backup too large or invalid');
  const data = JSON.parse(json);
  if (!plainObject(data) || data.schema !== BACKUP_SCHEMA || !plainObject(data.lessons)) throw Error('Unknown backup format');
  const imported = cleanPractice(catalog, data.lessons, true);
  const current = cleanPractice(catalog, existing);
  for (const [id, row] of Object.entries(imported)) {
    current[id] = {completed: Boolean(current[id]?.completed || row.completed),
      score: Math.max(current[id]?.score ?? 0, row.score)};
  }
  return {progress:current, imported: Object.keys(imported).length};
}
