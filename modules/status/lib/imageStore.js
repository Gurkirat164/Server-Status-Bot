const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'storage', 'images');

/**
 * Downloads a Discord attachment and saves it to local disk as
 * "<type>.<ext>" (type is "thumbnail" or "banner"), replacing any
 * previous file of that type (even if the extension changed).
 */
async function saveImage(attachment, type) {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const ext = path.extname(attachment.name || '') || '.png';
  const filename = `${type}${ext}`;
  const filePath = path.join(IMAGES_DIR, filename);

  // Remove any previously stored file of this type, regardless of extension.
  for (const existing of fs.readdirSync(IMAGES_DIR)) {
    if (existing.startsWith(`${type}.`)) {
      fs.unlinkSync(path.join(IMAGES_DIR, existing));
    }
  }

  const res = await fetch(attachment.url);
  if (!res.ok) throw new Error(`Failed to download attachment (HTTP ${res.status})`);

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return { filename, filePath };
}

module.exports = { saveImage, IMAGES_DIR };
