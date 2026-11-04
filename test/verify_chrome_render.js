import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = path.join('./dist', urlPath);
  if (filePath === 'dist' || filePath === 'dist/' || filePath === 'dist\\') {
    filePath = './dist/index.html';
  }
  if (!fs.existsSync(filePath)) {
    filePath = './dist/index.html';
  }

  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml'
  };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(filePath));
});

server.listen(8085, () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cmd = `"${chromePath}" --headless=new --disable-gpu --virtual-time-budget=3000 --dump-dom http://127.0.0.1:8085/`;

  exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    server.close();
    if (err) {
      console.error('Chrome execution error:', err);
      process.exit(1);
    }
    console.log('DUMP DOM LENGTH:', stdout.length);
    console.log('CONTAINS "Budget":', stdout.includes('Budget'));
    console.log('CONTAINS "Bugünün Durumu":', stdout.includes('Bugünün Durumu'));
    console.log('CONTAINS "IQOS":', stdout.includes('IQOS'));
    console.log('CONTAINS "Yemek Kartı":', stdout.includes('Yemek Kartı'));
    console.log('CONTAINS "Günlük Hak":', stdout.includes('Günlük Hak'));
    if (!stdout.includes('Budget') || !stdout.includes('Bugünün Durumu')) {
      console.error('FAIL: Rendered HTML does not contain expected UI!');
      console.log('OUTPUT:', stdout);
      process.exit(1);
    } else {
      console.log('SUCCESS: Page rendered completely in Chrome without black screen!');
      process.exit(0);
    }
  });
});
