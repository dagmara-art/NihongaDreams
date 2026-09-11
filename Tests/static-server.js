#!/usr/bin/env node
// Tiny static file server used by the Playwright suite.
// Node's http module is async, so unlike `python3 -m http.server` it handles
// many parallel asset requests without dropping connections.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8765);
const ROOT = path.resolve(__dirname, '..'); // repo root (Tests/ -> ..)
const ROOT_PREFIX = ROOT + path.sep;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
    let pathname;
    try {
        const parsed = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
        pathname = decodeURIComponent(parsed.pathname || '/');
    } catch (_) {
        res.writeHead(400); res.end('Bad Request'); return;
    }
    if (pathname.endsWith('/')) pathname += 'index.html';
    // Resolve to a normalized absolute path, then re-check containment.
    // path.join alone collapses ../ but encoded forms decode after, so we
    // normalize *after* decode and require the resolved path to be inside ROOT.
    const filePath = path.resolve(ROOT, '.' + pathname);
    if (filePath !== ROOT && !filePath.startsWith(ROOT_PREFIX)) {
        res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found: ' + pathname);
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store',
        });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`static-server listening on http://127.0.0.1:${PORT}`);
});
