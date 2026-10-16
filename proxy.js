// Local helper for the Interview Prep app.
//   * Serves the app itself (so the browser origin is http://localhost, not file://)
//   * Proxies /v1/* to OpenCode Zen (or any OpenAI-compatible gateway), adding CORS.
//
// Node 18+ (uses global fetch). No dependencies.
//
// Usage (PowerShell):
//   $env:OPENCODE_API_KEY = "sk-..."      # optional; can also paste key in the app
//   node proxy.js
//   -> open http://localhost:8787/   (NOT the file directly)
//
// In the app: Provider = "OpenAI-compatible chat", Base URL = http://localhost:8787/v1
//             Model = big-pickle, API key = your Zen key (or leave blank if env var set)
//
// Optional env vars: PORT (8787), ZEN_BASE (https://opencode.ai/zen/v1), OPENCODE_API_KEY

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0"; // 0.0.0.0 = reachable from your phone on the same Wi-Fi
const ZEN_BASE = (process.env.ZEN_BASE || "https://opencode.ai/zen/v1").replace(/\/+$/, "");
const ENV_KEY = process.env.OPENCODE_API_KEY || "";
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function setCors(res, origin) {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "authorization,content-type,x-zen-key");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
}

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel === "/" || rel === "") rel = "/index.html";
  const filePath = path.join(ROOT, path.normalize(rel).replace(/^([/\\])+/, ""));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end("Forbidden"); return; }
  fs.readFile(filePath, function (err, buf) {
    if (err) { res.writeHead(404, { "content-type": "text/plain" }); res.end("Not found: " + rel); return; }
    res.writeHead(200, {
      "content-type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store, must-revalidate"
    });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  setCors(res, req.headers.origin);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (!req.url.startsWith("/v1")) { serveStatic(req, res, req.url); return; }

  let sub = req.url.replace(/^\/v1/, "");
  if (!sub.startsWith("/")) sub = "/" + sub;
  const url = ZEN_BASE + sub;

  const incomingAuth = req.headers["authorization"];
  const key = req.headers["x-zen-key"] || ENV_KEY;
  const headers = { "content-type": req.headers["content-type"] || "application/json" };
  if (key) headers["authorization"] = "Bearer " + key;
  else if (incomingAuth) headers["authorization"] = incomingAuth;

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: headers,
      body: (req.method === "GET" || req.method === "HEAD") ? undefined : body
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      "content-type": upstream.headers.get("content-type") || "application/json"
    });
    res.end(buf);
    console.log(req.method + " /v1" + sub + " -> " + upstream.status);
  } catch (err) {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: { message: String((err && err.message) || err) } }));
    console.error("proxy error:", err && err.message);
  }
});

function lanAddresses() {
  const out = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const a of ifaces[name] || []) {
      if (a.family === "IPv4" && !a.internal) out.push(a.address);
    }
  }
  return out;
}

server.listen(PORT, HOST, () => {
  console.log("Interview Prep app + Zen proxy running on " + HOST + ":" + PORT);
  console.log("  This computer:  http://localhost:" + PORT + "/");
  lanAddresses().forEach(function (ip) {
    console.log("  Phone / LAN:    http://" + ip + ":" + PORT + "/   (same Wi-Fi)");
  });
  console.log("  Base URL in app: /v1   ->  " + ZEN_BASE);
  console.log(ENV_KEY
    ? "  API key: loaded from OPENCODE_API_KEY (the server adds it automatically)"
    : "  API key: not set here - paste your Zen key into the app's API key box.");
  console.log("  Security: listening on all interfaces. Use only on a trusted Wi-Fi; set HOST=127.0.0.1 to restrict to this PC.");
});
