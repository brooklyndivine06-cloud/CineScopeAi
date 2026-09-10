/* Copies the static export (out/) into the repo root so GitHub Pages
   (deploy-from-branch: main) serves the built site. Run after `npm run build`. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'out');

if (!fs.existsSync(out)) {
  console.error('out/ not found — run `npm run build` first.');
  process.exit(1);
}

for (const f of fs.readdirSync(out)) {
  const src = path.join(out, f);
  const dest = path.join(root, f);
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log('synced  /' + f);
}
console.log('done — commit the new files and push to main to publish.');
