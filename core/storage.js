const fs = require('fs');
const path = require('path');

/**
 * Reads a JSON file, returning `fallback` if it doesn't exist or fails to parse.
 */
function readJSON(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[storage] Failed to read JSON at ${filePath}:`, err.message);
    return fallback;
  }
}

/**
 * Writes a JSON file atomically (write to temp file, then rename)
 * so a crash mid-write can never corrupt the real file.
 */
function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

module.exports = { readJSON, writeJSON };
