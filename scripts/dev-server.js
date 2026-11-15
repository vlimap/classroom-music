import { createServer } from 'node:http';
import socialApi from '../api/social.js';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createGzip } from 'node:zlib';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

createServer(async (req, res) => {
  if (new URL(req.url, 'http://127.0.0.1:4173').pathname === '/api/social') {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.writeHead(405, {Allow:'GET, POST'}).end();
      return;
    }
    let body;
    if (req.method === 'POST') {
      const chunks=[];
      let size=0;
      for await (const chunk of req) {
        size+=chunk.length;
        if(size>512){res.writeHead(413).end();return;}
        chunks.push(chunk);
      }
      body=Buffer.concat(chunks);
    }
    const host=req.headers.host || '127.0.0.1:4173';
    const response=await socialApi.fetch(new Request('http://' + host + '/api/social',{
      method:req.method,headers:req.headers,body
    }));
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(await response.text());
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(`${root.replace(/[\\/]$/, '')}${sep}`)) {
      res.writeHead(403).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');

    const headers = {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Cache-Control': pathname === '/' || pathname === '/index.html'
        ? 'no-cache'
        : /\/(covers|assets)\//.test(pathname)
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
    };
    let start = 0;
    let end = info.size - 1;
    let status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) {
        res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
        return;
      }
      if (match[1]) {
        start = Number(match[1]);
        if (match[2]) end = Math.min(Number(match[2]), end);
      } else {
        start = Math.max(info.size - Number(match[2]), 0);
      }
      if (start > end || start >= info.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
        return;
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    const isRange = status === 206;
    const canCompress = !isRange
      && req.method !== 'HEAD'
      && /^(text\/|application\/(javascript|json|xml))/.test(headers['Content-Type'])
      && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    if (canCompress) {
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
    } else {
      headers['Content-Length'] = Math.max(0, end - start + 1);
    }
    res.writeHead(status, headers);
    if (req.method === 'HEAD' || info.size === 0) res.end();
    else {
      const stream = createReadStream(file, { start, end }).on('error', () => res.destroy());
      if (canCompress) stream.pipe(createGzip()).pipe(res);
      else stream.pipe(res);
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Arquivo não encontrado');
  }
}).listen(4173, '127.0.0.1', () => {
  console.log('Foco.dev disponível em http://localhost:4173');
});
