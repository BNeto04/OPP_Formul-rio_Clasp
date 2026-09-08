/**
 * Syntheon Agentic Layer - Router Status Script
 */

const http = require('http');

const req = http.get('http://127.0.0.1:4000/health', { timeout: 2000 }, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log(`[STATUS_ROUTER] HTTP ${res.statusCode}`);
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', err => {
  console.log(`[STATUS_ROUTER] Router inativo ou inacessivel (${err.message}).`);
  process.exit(1);
});