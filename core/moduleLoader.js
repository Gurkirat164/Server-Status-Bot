const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '..', 'modules');

let loadedModules = [];

/**
 * Scans the /modules directory. Each subfolder is treated as an independent
 * module and must contain a module.json (metadata) and an index.js (entry
 * point exporting { name, commands, onLoad }). Folders missing either file,
 * or with `"enabled": false` in module.json, are skipped.
 */
function loadModules() {
  loadedModules = [];

  if (!fs.existsSync(MODULES_DIR)) {
    console.warn('[moduleLoader] No modules/ directory found.');
    return loadedModules;
  }

  const folders = fs
    .readdirSync(MODULES_DIR)
    .filter(f => fs.statSync(path.join(MODULES_DIR, f)).isDirectory());

  for (const folder of folders) {
    const modulePath = path.join(MODULES_DIR, folder);
    const manifestPath = path.join(modulePath, 'module.json');
    const indexPath = path.join(modulePath, 'index.js');

    if (!fs.existsSync(manifestPath) || !fs.existsSync(indexPath)) {
      console.warn(`[moduleLoader] Skipping "${folder}": missing module.json or index.js`);
      continue;
    }

    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (err) {
      console.error(`[moduleLoader] Skipping "${folder}": invalid module.json (${err.message})`);
      continue;
    }

    if (manifest.enabled === false) {
      console.log(`[moduleLoader] Module "${manifest.name || folder}" is disabled, skipping.`);
      continue;
    }

    try {
      const mod = require(indexPath);

      if (!mod.name || !Array.isArray(mod.commands)) {
        console.error(`[moduleLoader] Skipping "${folder}": index.js must export { name, commands: [] }`);
        continue;
      }

      mod.manifest = manifest;
      loadedModules.push(mod);
      console.log(`[moduleLoader] Loaded module: ${manifest.name || folder} (${mod.commands.length} command(s))`);
    } catch (err) {
      console.error(`[moduleLoader] Failed to load module "${folder}":`, err);
    }
  }

  return loadedModules;
}

function getLoadedModules() {
  return loadedModules;
}

module.exports = { loadModules, getLoadedModules };
