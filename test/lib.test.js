"use strict";
const assert = require("assert");
const L = require("../api/_lib");
const now = 1800000000000;
const s = (id, extra) => Object.assign({ id: id, num: "1", name: "X " + id, theme: "", status: "built", fav: false, demo: false, updatedAt: now }, extra || {});

// validate
assert.throws(() => L.validate(null), /object/);
assert.throws(() => L.validate({ sets: "no" }), /list/);
assert.throws(() => L.validate({ sets: [{ id: "a", status: "built", name: "x" }] }), /id/);
assert.throws(() => L.validate({ sets: [s("abcd", { status: "nope" })] }), /status/);
assert.throws(() => L.validate({ sets: [s("abcd"), s("abcd")] }), /Duplicate/);
assert.throws(() => L.validate({ sets: [s("abcd", { name: "  " })] }), /name/);
assert.throws(() => L.validate({ sets: [], prefs: { theme: "hotpink" } }), /theme/);
assert.throws(() => L.validate({ sets: new Array(501).fill(0).map((_, i) => s("id" + i + "xx")) }), /Too many/);
const ok = L.validate({ sets: [s("abcd", { name: "A".repeat(200), evil: "<script>" }), { id: "gone1", deleted: true, updatedAt: now, name: "ignored" }], prefs: { name: "Mia", theme: "blue", updatedAt: now } }, now);
assert.strictEqual(ok.sets[0].name.length, 80); assert.ok(!("evil" in ok.sets[0])); assert.deepStrictEqual(ok.sets[1], { id: "gone1", deleted: true, updatedAt: now });
assert.strictEqual(L.validate({ sets: [s("abcd", { updatedAt: now + 1e12 })] }, now).sets[0].updatedAt, now + 600000);

// merge: two devices never wipe each other
const A = { sets: [s("aaaa", { updatedAt: 10, status: "want" }), s("bbbb", { updatedAt: 5 })], prefs: { name: "", theme: "pink", updatedAt: 1 } };
const B = { sets: [s("aaaa", { updatedAt: 20, status: "built" }), s("cccc", { updatedAt: 7 })], prefs: { name: "", theme: "blue", updatedAt: 2 } };
const m = L.merge(A, B, 100);
assert.deepStrictEqual(m.sets.map(x => x.id).sort(), ["aaaa", "bbbb", "cccc"]);
assert.strictEqual(m.sets.find(x => x.id === "aaaa").status, "built"); assert.strictEqual(m.prefs.theme, "blue");
assert.deepStrictEqual(L.merge(A, B, 100), L.merge(B, A, 100)); // commutative
assert.deepStrictEqual(L.merge(m, B, 100), m);                  // idempotent
// delete wins when newer, loses when older
const del = { sets: [{ id: "bbbb", deleted: true, updatedAt: 9 }] };
assert.ok(L.merge(A, del, 100).sets.find(x => x.id === "bbbb").deleted);
assert.ok(!L.merge(A, { sets: [{ id: "bbbb", deleted: true, updatedAt: 2 }] }, 100).sets.find(x => x.id === "bbbb").deleted);
// old tombstones are dropped
assert.strictEqual(L.merge({ sets: [{ id: "oldd", deleted: true, updatedAt: 1 }] }, null, now).sets.length, 0);

// same-origin
assert.ok(L.sameOrigin({ host: "a.vercel.app", origin: "https://a.vercel.app", "sec-fetch-site": "same-origin" }));
assert.ok(L.sameOrigin({ host: "a.vercel.app" }));
assert.ok(!L.sameOrigin({ host: "a.vercel.app", origin: "https://evil.example" }));
assert.ok(!L.sameOrigin({ host: "a.vercel.app", "sec-fetch-site": "cross-site" }));
// key + hashing
assert.ok(L.KEY_RE.test(L.sha256hex("x"))); assert.ok(!L.KEY_RE.test("short"));
// rate limiter
let limited = false; for (let i = 0; i < 70; i++) limited = L.ipLimited("1.2.3.4", 60, now) || limited; assert.ok(limited);
console.log("lib tests passed");
