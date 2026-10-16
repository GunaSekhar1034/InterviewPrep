// Cloudflare Worker: CORS proxy for OpenCode Zen (works 24/7 with your PC off).
//
// Deploy (free):
//   1. https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker
//   2. Paste this file over the default code, Deploy.
//   3. Worker -> Settings -> Variables and Secrets -> add SECRET "ZEN_KEY"
//      = your OpenCode Zen API key  (or skip and paste the key in the app).
//   4. Copy the worker URL, e.g. https://zen-proxy.you.workers.dev
//
// In the app -> AI settings:  Provider "OpenAI-compatible chat",
//   Base URL = https://zen-proxy.you.workers.dev/v1   Model = big-pickle
// Or set it once in config.js (base) and re-deploy the app.

const ZEN_BASE = "https://opencode.ai/zen/v1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,content-type,x-zen-key",
  "Access-Control-Allow-Private-Network": "true",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith("/v1")) {
      return json({ error: { message: "Use /v1/* (forwarded to " + ZEN_BASE + ")" } }, 404);
    }

    const target = ZEN_BASE + url.pathname.slice(3) + url.search;

    const headers = new Headers(request.headers);
    headers.delete("origin");
    headers.delete("referer");
    headers.delete("host");
    const key = request.headers.get("x-zen-key") || env.ZEN_KEY;
    if (key) headers.set("authorization", "Bearer " + key);

    const init = { method: request.method, headers };
    if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;

    let upstream;
    try {
      upstream = await fetch(target, init);
    } catch (e) {
      return json({ error: { message: "Proxy error: " + e.message } }, 502);
    }

    const out = new Response(upstream.body, upstream);
    for (const k of Object.keys(CORS)) out.headers.set(k, CORS[k]);
    return out;
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ "content-type": "application/json" }, CORS)
  });
}
