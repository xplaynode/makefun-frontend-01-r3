// Lucky Frontend local dev server (Node 22, standard library only).
// Serves app/ at http://localhost:8080, or --port <n> for another port.
// Refuses paths outside app/ and sends plain MIME types; dev use only.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const argv = process.argv.slice(2);
const at = argv.indexOf('--port');
const wanted = at >= 0 ? Number(argv[at + 1]) : 8080;
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

createServer((req, res) => {
  let path: string;
  try { path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname); }
  catch { res.writeHead(400).end('bad request'); return; }
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(join(appRoot, normalize(path)));
  if (file !== appRoot && !file.startsWith(appRoot + sep)) { res.writeHead(403).end('forbidden'); return; }
  let len: number;
  try { const st = statSync(file); if (!st.isFile()) throw new Error('dir'); len = st.size; }
  catch { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', 'content-length': len, 'cache-control': 'no-store' });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log('serving app/ at http://localhost:' + port));
