/**
 * HR Planner — Portable USB Server
 * Saves data to ./data.json (next to server.js on the USB drive)
 * No dependencies beyond Node.js itself (uses only built-in modules)
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');

const PORT      = 3000;
const ROOT_DIR             = path.join(__dirname, '..');
const DATA_DIR             = path.join(ROOT_DIR, 'data');
const GLOBAL_SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const OLD_DATA_FILE        = path.join(ROOT_DIR, 'data.json');
const DIST_DIR             = path.join(__dirname, '..', 'client', 'dist');

// ── mime types ────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
};

// ── helpers ───────────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, code, data) {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const sseClients = new Set();
let shutdownTimer = null;
let hasConnectedOnce = false;

function scheduleShutdownCheck() {
  if (shutdownTimer) clearTimeout(shutdownTimer);
  shutdownTimer = setTimeout(() => {
    if (hasConnectedOnce && sseClients.size === 0) {
      console.log('\n🛑 All browser tabs closed. Auto shutting down portable server...');
      process.exit(0);
    }
  }, 4000);
}

function apiEvents(req, res) {
  cors(res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('data: {"type":"connected"}\n\n');
  sseClients.add(res);
  hasConnectedOnce = true;
  if (shutdownTimer) clearTimeout(shutdownTimer);

  req.on('close', () => {
    sseClients.delete(res);
    if (sseClients.size === 0) {
      scheduleShutdownCheck();
    }
  });
}

function broadcastUpdate(data) {
  const payload = `data: ${JSON.stringify({ type: 'update', data })}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch { sseClients.delete(client); }
  }
}

// ── Data storage & migration ──────────────────────────────────────────────────
function migrateOldDataIfNeeded() {
  if (!fs.existsSync(OLD_DATA_FILE)) return;
  try {
    console.log('📦 Migrating old data.json to Year/Month directory structure...');
    const raw = fs.readFileSync(OLD_DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    fs.mkdirSync(DATA_DIR, { recursive: true });

    const globalSettings = {
      lastViewMonthKey: data.lastViewMonthKey || null,
      monthlyArchive:   data.monthlyArchive   || [],
      themeMode:        data.themeMode        || 'light'
    };
    fs.writeFileSync(GLOBAL_SETTINGS_FILE, JSON.stringify(globalSettings, null, 2), 'utf8');

    let defaultYear = new Date().getFullYear();
    if (data.lastViewMonthKey) {
      const p = data.lastViewMonthKey.split('-');
      if (p[0] && !isNaN(p[0])) defaultYear = parseInt(p[0], 10);
    }

    const yearDir = path.join(DATA_DIR, String(defaultYear));
    fs.mkdirSync(yearDir, { recursive: true });

    const yearSettings = {
      notes:         data.notes || [],
      customRoutine: data.customRoutine || []
    };
    fs.writeFileSync(path.join(yearDir, 'settings.json'), JSON.stringify(yearSettings, null, 2), 'utf8');

    if (data.monthsData) {
      for (const [key, mData] of Object.entries(data.monthsData)) {
        const parts = key.split('-');
        if (parts.length === 2) {
          const yDir = path.join(DATA_DIR, parts[0]);
          fs.mkdirSync(yDir, { recursive: true });
          const mFile = path.join(yDir, `${parts[1]}.json`);
          fs.writeFileSync(mFile, JSON.stringify(mData, null, 2), 'utf8');
        }
      }
    }

    fs.renameSync(OLD_DATA_FILE, OLD_DATA_FILE + '.migrated_backup');
    console.log('✅ Migration complete! Old data.json backed up.');
  } catch (e) {
    console.error('Migration error:', e);
  }
}

function loadAllData(reqYear = null) {
  migrateOldDataIfNeeded();

  if (!fs.existsSync(GLOBAL_SETTINGS_FILE)) {
    return null; // First run ever!
  }

  let globalSettings = { lastViewMonthKey: null, monthlyArchive: [], themeMode: 'light' };
  try {
    globalSettings = JSON.parse(fs.readFileSync(GLOBAL_SETTINGS_FILE, 'utf8'));
  } catch {}

  let targetYear = reqYear ? parseInt(reqYear, 10) : new Date().getFullYear();
  if (!reqYear && globalSettings.lastViewMonthKey) {
    const p = globalSettings.lastViewMonthKey.split('-');
    if (p[0] && !isNaN(p[0])) targetYear = parseInt(p[0], 10);
  }

  const yearSettingsFile = path.join(DATA_DIR, String(targetYear), 'settings.json');
  let notes = [];
  let customRoutine = [];
  if (fs.existsSync(yearSettingsFile)) {
    try {
      const ys = JSON.parse(fs.readFileSync(yearSettingsFile, 'utf8'));
      notes = ys.notes || [];
      customRoutine = ys.customRoutine || [];
    } catch {}
  }

  const monthsData = {};
  if (fs.existsSync(DATA_DIR)) {
    const years = fs.readdirSync(DATA_DIR).filter(y => /^\d{4}$/.test(y));
    for (const y of years) {
      const yDir = path.join(DATA_DIR, y);
      const files = fs.readdirSync(yDir).filter(f => /^\d{2}\.json$/.test(f));
      for (const f of files) {
        const mm = f.replace('.json', '');
        const key = `${y}-${mm}`;
        try {
          monthsData[key] = JSON.parse(fs.readFileSync(path.join(yDir, f), 'utf8'));
        } catch {}
      }
    }
  }

  return {
    lastViewMonthKey: globalSettings.lastViewMonthKey,
    monthlyArchive:   globalSettings.monthlyArchive || [],
    themeMode:        globalSettings.themeMode        || 'light',
    notes,
    customRoutine,
    monthsData
  };
}

function saveAllData(parsed) {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const globalSettings = {
    lastViewMonthKey: parsed.lastViewMonthKey || null,
    monthlyArchive:   parsed.monthlyArchive   || [],
    themeMode:        parsed.themeMode        || 'light'
  };
  fs.writeFileSync(GLOBAL_SETTINGS_FILE, JSON.stringify(globalSettings, null, 2), 'utf8');

  let activeYear = new Date().getFullYear();
  if (parsed.lastViewMonthKey) {
    const p = parsed.lastViewMonthKey.split('-');
    if (p[0] && !isNaN(p[0])) activeYear = parseInt(p[0], 10);
  }

  const yearDir = path.join(DATA_DIR, String(activeYear));
  fs.mkdirSync(yearDir, { recursive: true });

  const yearSettings = {
    notes:         parsed.notes || [],
    customRoutine: parsed.customRoutine || []
  };
  fs.writeFileSync(path.join(yearDir, 'settings.json'), JSON.stringify(yearSettings, null, 2), 'utf8');

  if (parsed.monthsData) {
    for (const [key, mData] of Object.entries(parsed.monthsData)) {
      const parts = key.split('-');
      if (parts.length === 2) {
        const yDir = path.join(DATA_DIR, parts[0]);
        fs.mkdirSync(yDir, { recursive: true });
        const mFile = path.join(yDir, `${parts[1]}.json`);
        fs.writeFileSync(mFile, JSON.stringify(mData, null, 2), 'utf8');
      }
    }
  }
}

// ── API handlers ──────────────────────────────────────────────────────────────
function apiLoad(req, res) {
  try {
    const query = req.parsedUrl.query ? url.parse(req.url, true).query : {};
    const data = loadAllData(query.year);
    json(res, 200, { ok: true, data });
  } catch (e) {
    json(res, 500, { ok: false, error: String(e) });
  }
}

async function apiSave(req, res) {
  try {
    const body = await readBody(req);
    const parsed = JSON.parse(body);
    saveAllData(parsed);
    json(res, 200, { ok: true, savedAt: new Date().toISOString() });
    broadcastUpdate(parsed);
  } catch (e) {
    json(res, 500, { ok: false, error: String(e) });
  }
}

// ── static file server ────────────────────────────────────────────────────────
function serveStatic(req, res) {
  let filePath = path.join(DIST_DIR, req.parsedUrl.pathname === '/' ? 'index.html' : req.parsedUrl.pathname);

  // SPA fallback
  if (!fs.existsSync(filePath)) filePath = path.join(DIST_DIR, 'index.html');

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    cors(res);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}

// ── main router ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  req.parsedUrl = url.parse(req.url);

  if (req.method === 'OPTIONS') {
    cors(res); res.writeHead(204); res.end(); return;
  }

  if (req.parsedUrl.pathname === '/api/events' && req.method === 'GET') {
    return apiEvents(req, res);
  }
  if (req.parsedUrl.pathname === '/api/load' && req.method === 'GET') {
    return apiLoad(req, res);
  }
  if (req.parsedUrl.pathname === '/api/save' && req.method === 'POST') {
    return apiSave(req, res);
  }
  serveStatic(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n✅ HR Planner running at http://localhost:${PORT}`);
  console.log(`💾 Data folder: ${DATA_DIR}`);
  console.log(`\nPress Ctrl+C or close browser tabs to stop.\n`);

  setTimeout(() => {
    if (!hasConnectedOnce && sseClients.size === 0) {
      console.log('\n🛑 No browser connected within 60 seconds. Auto shutting down...');
      process.exit(0);
    }
  }, 60000);
});
