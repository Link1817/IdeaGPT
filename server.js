const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const publicDir = path.join(__dirname, 'public');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const requestedPath = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(requestedPath).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

async function handleGenerate(req, res) {
  if (!OPENAI_API_KEY) {
    sendJson(res, 500, {
      error:
        'Server is missing OPENAI_API_KEY. Add it to your environment and restart the server.',
    });
    return;
  }

  let prompt = '';
  let size = '1024x1024';

  try {
    const body = await readJsonBody(req);
    prompt = (body.prompt || '').trim();
    size = body.size || size;
  } catch (error) {
    sendJson(res, 400, { error: 'Invalid JSON body.' });
    return;
  }

  if (!prompt) {
    sendJson(res, 400, { error: 'Prompt is required.' });
    return;
  }

  try {
    const apiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size,
      }),
    });

    const result = await apiResponse.json();

    if (!apiResponse.ok) {
      const message = result?.error?.message || 'Image generation failed.';
      sendJson(res, 400, { error: message });
      return;
    }

    const encoded = result?.data?.[0]?.b64_json;
    if (!encoded) {
      sendJson(res, 500, { error: 'No image data returned.' });
      return;
    }

    sendJson(res, 200, {
      imageDataUrl: `data:image/png;base64,${encoded}`,
    });
  } catch (error) {
    sendJson(res, 500, { error: 'Unexpected server error while generating image.' });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/generate') {
    handleGenerate(req, res);
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Image creator running on http://localhost:${PORT}`);
});
