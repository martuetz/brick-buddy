"use strict";
// GET /api/sets  -> your saved sets   (404 if the sync code is unknown)
// PUT /api/sets  -> merge your sets into the box and get the merged result back
// The browser sends  x-sync-key = SHA-256(sync code). The server never sees the code itself and
// stores only SHA-256(x-sync-key). Only sets + name/colour prefs are stored. No accounts, no IPs.
const { neon } = require("@neondatabase/serverless");
const L = require("./_lib");

const KEY_RATE_PER_MIN = 90;     // per sync box
const IP_RATE_PER_MIN = 60;      // per IP, per server instance, memory only
const MAX_BOXES = 5000;          // keep the free database small

let sql = null, ready = null;
function db() {
  if (!sql) sql = neon(process.env.DATABASE_URL);
  if (!ready) ready = sql`CREATE TABLE IF NOT EXISTS sync_boxes (
      key text PRIMARY KEY, data jsonb NOT NULL, rev integer NOT NULL DEFAULT 0,
      win bigint NOT NULL DEFAULT 0, n integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
  return ready.then(function () { return sql; }, function (e) { ready = null; throw e; });
}
function send(res, code, obj) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.status(code).send(JSON.stringify(obj));
}
// Reads the box and counts this request against the per-box rate limit in one statement.
async function touch(q, key) {
  const win = Math.floor(Date.now() / 60000);
  const rows = await q`UPDATE sync_boxes SET n = CASE WHEN win = ${win} THEN n + 1 ELSE 1 END, win = ${win}
                       WHERE key = ${key} RETURNING data, rev, n`;
  return rows[0] || null;
}

module.exports = async function handler(req, res) {
  try {
    if (!L.sameOrigin(req.headers)) return send(res, 403, { error: "same-origin only" });
    if (req.method !== "GET" && req.method !== "PUT") { res.setHeader("Allow", "GET, PUT"); return send(res, 405, { error: "method not allowed" }); }
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (L.ipLimited(ip, IP_RATE_PER_MIN)) return send(res, 429, { error: "slow down" });
    const clientKey = String(req.headers["x-sync-key"] || "");
    if (!L.KEY_RE.test(clientKey)) return send(res, 400, { error: "bad sync key" });
    const key = L.sha256hex(clientKey);
    const q = await db();

    if (req.method === "GET") {
      const row = await touch(q, key);
      if (!row) return send(res, 404, { error: "unknown code" });
      if (row.n > KEY_RATE_PER_MIN) return send(res, 429, { error: "slow down" });
      return send(res, 200, row.data);
    }

    // PUT
    const len = Number(req.headers["content-length"] || 0);
    if (len > L.MAX_BYTES) return send(res, 413, { error: "too big" });
    let body = req.body;
    if (typeof body === "string") { if (body.length > L.MAX_BYTES) return send(res, 413, { error: "too big" }); try { body = JSON.parse(body); } catch (e) { return send(res, 400, { error: "bad json" }); } }
    if (JSON.stringify(body || {}).length > L.MAX_BYTES) return send(res, 413, { error: "too big" });
    const create = !!(body && body.create === true);
    const incoming = L.validate(body);

    for (let attempt = 0; attempt < 4; attempt++) {
      const row = await touch(q, key);
      if (row && row.n > KEY_RATE_PER_MIN) return send(res, 429, { error: "slow down" });
      if (!row) {
        if (!create) return send(res, 404, { error: "unknown code" });
        const c = await q`SELECT count(*)::int AS c FROM sync_boxes`;
        if (c[0].c >= MAX_BOXES) return send(res, 503, { error: "full" });
        const data = L.merge(null, incoming);
        const ins = await q`INSERT INTO sync_boxes (key, data, rev, win, n) VALUES (${key}, ${JSON.stringify(data)}::jsonb, 1, ${Math.floor(Date.now() / 60000)}, 1)
                            ON CONFLICT (key) DO NOTHING RETURNING rev`;
        if (ins.length) return send(res, 200, data);
        continue; // someone created it at the same moment: merge into it instead
      }
      const merged = L.merge(row.data, incoming);
      if (JSON.stringify(merged) === JSON.stringify(row.data)) return send(res, 200, merged);
      const upd = await q`UPDATE sync_boxes SET data = ${JSON.stringify(merged)}::jsonb, rev = rev + 1, updated_at = now()
                          WHERE key = ${key} AND rev = ${row.rev} RETURNING rev`;
      if (upd.length) {
        if (Math.random() < 0.01) await q`DELETE FROM sync_boxes WHERE updated_at < now() - interval '400 days'`;
        return send(res, 200, merged);
      }
    }
    return send(res, 409, { error: "busy, try again" });
  } catch (e) {
    if (e && e.status === 400) return send(res, 400, { error: e.message });
    console.error("sync error", e && e.message); // never log keys or payloads
    return send(res, 500, { error: "server error" });
  }
};
