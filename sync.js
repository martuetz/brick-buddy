/* Sync helpers for "My Sets" on more than one device.
   - The sync code is made in the browser (140 random bits) and never sent anywhere as-is.
   - What the browser sends is SHA-256 of the code; the server only stores a hash of that.
   - Merging is "last write wins" per set, so two devices never wipe each other. */
window.BBSync = (function () {
  "use strict";
  var ALPHA = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32: no I, L, O, U
  var LEN = 28;                                   // 28 x 5 bits = 140 bits
  var TOMBSTONE_MS = 60 * 24 * 3600 * 1000;

  function supported() { return !!(window.crypto && crypto.subtle && crypto.getRandomValues && window.fetch); }
  function pretty(s) { return s.match(/.{1,4}/g).join("-"); }
  function newCode() {
    var b = new Uint8Array(LEN); crypto.getRandomValues(b);
    var s = ""; for (var i = 0; i < LEN; i++) s += ALPHA.charAt(b[i] & 31); // 256 % 32 == 0, so no bias
    return pretty(s);
  }
  // Accepts lower case, spaces, dashes, and the usual mix-ups (O->0, I/L->1). Returns null if it is not a code.
  function normalize(input) {
    var s = String(input || "").toUpperCase().replace(/[\s\-_.]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
    return s.length === LEN && /^[0-9A-HJKMNP-TV-Z]+$/.test(s) ? s : null;
  }
  function keyFor(norm) {
    var data = new TextEncoder().encode("brick-buddy-sync-v1:" + norm);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
    });
  }
  // One request to our own server. Resolves { status, data }; rejects when the network fails.
  function request(method, key, body) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 12000);
    return fetch("/api/sets", {
      method: method, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer",
      headers: { "x-sync-key": key, "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined, signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      return r.text().then(function (t) { var d = null; try { d = JSON.parse(t); } catch (e) {} return { status: r.status, data: d }; });
    }, function (e) { clearTimeout(timer); throw e; });
  }
  // Same rules as the server (api/_lib.js): newest change wins for every set.
  function pick(a, b) {
    if (!a) return b; if (!b) return a;
    if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
    if (!!a.deleted !== !!b.deleted) return a.deleted ? a : b;
    return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
  }
  function merge(a, b, now) {
    now = now || Date.now();
    var map = {};
    [a, b].forEach(function (side) {
      if (!side || !Array.isArray(side.sets)) return;
      side.sets.forEach(function (s) { map[s.id] = pick(map[s.id], s); });
    });
    var sets = Object.keys(map).map(function (k) { return map[k]; })
      .filter(function (s) { return !(s.deleted && now - s.updatedAt > TOMBSTONE_MS); })
      .sort(function (x, y) { return y.updatedAt - x.updatedAt || (x.id < y.id ? -1 : 1); }).slice(0, 500);
    var pa = a && a.prefs, pb = b && b.prefs;
    return { sets: sets, prefs: !pa ? (pb || null) : !pb ? pa : (pb.updatedAt > pa.updatedAt ? pb : pa) };
  }
  return { supported: supported, newCode: newCode, normalize: normalize, pretty: pretty, keyFor: keyFor, request: request, merge: merge };
})();
