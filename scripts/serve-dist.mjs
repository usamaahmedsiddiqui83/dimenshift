// Serves dist/ the way the production .htaccess does: /services → services.html, unknown paths → 404.html
// with a 404 status. Use it to check the pre-rendered build locally: `node scripts/serve-dist.mjs [port]`.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.argv[2] || 4174);
const pages = ['services', 'contact', 'privacy-policy', 'terms-and-conditions'];
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json',
};

const isFile = (p) => stat(p).then((s) => s.isFile(), () => false);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path === '/' ? 'index.html' : pages.includes(path.slice(1)) ? `${path.slice(1)}.html` : path.slice(1);
  let status = 200;
  const full = normalize(join(root, file));
  if (!full.startsWith(root) || !(await isFile(full))) {
    file = '404.html';
    status = 404;
  }
  const body = await readFile(join(root, file));
  res.writeHead(status, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(body);
}).listen(port, () => console.log(`dist/ served like production at http://localhost:${port}`));
