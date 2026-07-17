// Zero-dependency static server for the read-only MedTrack demo.
// Serves this folder on http://localhost:5180 ; "/" -> index.html
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 5180;
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

http
  .createServer((req, res) => {
    // read-only: refuse anything that isn't a GET/HEAD
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405).end('read-only demo');
      return;
    }
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') url = '/index.html';
    const file = path.join(ROOT, path.normalize(url));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'text/plain' });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`medtrack-demo on http://localhost:${PORT}`));
