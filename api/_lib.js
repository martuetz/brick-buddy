"use strict";
// Pure helpers for the sync API (no network, easy to test). Files starting with "_" are not routes.
const crypto = require("crypto");

const MAX_BYTES = 100 * 1024;      // payload limit
const MAX_ENTRIES = 500;           // sets + deleted-markers per box
const TOMBSTONE_MS = 60 * 24 * 3600 * 1000;
const STATUSES = ["built", "want", "wish"];
const THEMES = ["pink", "blue", "purple", "green", "yellow", "red"];
const ID_RE = /^[A-Za-z0-9_-]{4,40}$/;
const KEY_RE = /^[0-9a-f]{64}$/;

function sha256hex(s) { return crypto.createHash("sha256").update(s).digest("hex"); }
function str(v, max) { return typeof v === "string" ? v.slice(0, max) : ""; }
function ts(v, now) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, now + 10 * 60 * 1000); // no far-future timestamps
}
function fail(msg) { const e = new Error(msg); e.status = 400; return e; }

// Checks the shape of a payload and returns a clean copy. Throws (status 400) when it is wrong.
function validate(body, now) {
  now = now || Date.now();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw fail("Body must be an object");
  if (!Array.isArray(body.sets)) throw fail("sets must be a list");
  if (body.sets.length > MAX_ENTRIES) throw fail("Too many sets");
  const seen = new Set();
  const sets = body.sets.map(function (x) {
    if (!x || typeof x !== "object" || typeof x.id !== "string" || !ID_RE.test(x.id)) throw fail("Bad set id");
    if (seen.has(x.id)) throw fail("Duplicate set id");
    seen.add(x.id);
    const updatedAt = ts(x.updatedAt, now);
    if (x.deleted === true) return { id: x.id, deleted: true, updatedAt: updatedAt };
    if (STATUSES.indexOf(x.status) < 0) throw fail("Bad status");
    const name = str(x.name, 80).trim();
    if (!name) throw fail("Set needs a name");
    return { id: x.id, num: str(x.num, 20), name: name, theme: str(x.theme, 40), status: x.status,
      fav: x.fav === true, demo: x.demo === true, updatedAt: updatedAt };
  });
  let prefs = null;
  if (body.prefs != null) {
    if (typeof body.prefs !== "object" || Array.isArray(body.prefs)) throw fail("Bad prefs");
    if (THEMES.indexOf(body.prefs.theme) < 0) throw fail("Bad theme");
    prefs = { name: str(body.prefs.name, 30), theme: body.prefs.theme, updatedAt: ts(body.prefs.updatedAt, now) };
  }
  return { sets: sets, prefs: prefs };
}

// Last-write-wins per set (newest updatedAt wins; ties are broken the same way on every device).
function pick(a, b) {
  if (!a) return b; if (!b) return a;
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  if (!!a.deleted !== !!b.deleted) return a.deleted ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}
function merge(a, b, now) {
  now = now || Date.now();
  const map = {};
  [a, b].forEach(function (side) {
    if (!side || !Array.isArray(side.sets)) return;
    side.sets.forEach(function (s) { map[s.id] = pick(map[s.id], s); });
  });
  const sets = Object.keys(map).map(function (k) { return map[k]; })
    .filter(function (s) { return !(s.deleted && now - s.updatedAt > TOMBSTONE_MS); })
    .sort(function (x, y) { return y.updatedAt - x.updatedAt || (x.id < y.id ? -1 : 1); })
    .slice(0, MAX_ENTRIES);
  const pa = a && a.prefs, pb = b && b.prefs;
  const prefs = !pa ? (pb || null) : !pb ? pa : (pb.updatedAt > pa.updatedAt ? pb : pa);
  return { sets: sets, prefs: prefs };
}

// Same-origin only: browsers send Origin / Sec-Fetch-Site; anything cross-site is refused.
function sameOrigin(headers) {
  const host = headers.host || "";
  const origin = headers.origin;
  if (origin) {
    let o; try { o = new URL(origin); } catch (e) { return false; }
    if (o.host !== host) return false;
  }
  const site = headers["sec-fetch-site"];
  if (site && site !== "same-origin" && site !== "none") return false;
  return true;
}

// Very light per-IP limiter kept in memory (never stored, resets on cold start).
const hits = new Map();
function ipLimited(ip, limit, now) {
  now = now || Date.now();
  const w = Math.floor(now / 60000), k = ip || "?";
  const h = hits.get(k);
  if (!h || h.w !== w) { if (hits.size > 5000) hits.clear(); hits.set(k, { w: w, n: 1 }); return false; }
  h.n++; return h.n > limit;
}

module.exports = { MAX_BYTES, MAX_ENTRIES, KEY_RE, sha256hex, validate, merge, sameOrigin, ipLimited };
