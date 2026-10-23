/* Olöf's Lego Girly Mission Control – plain JavaScript, no frameworks, no servers.
   Everything you save lives in this browser's localStorage. */
(function () {
  "use strict";

  var KEY = "brick-buddy-v1";
  var BL_SET = "https://www.bricklink.com/v2/catalog/catalogitem.page?S=";
  var BL_CAT = "https://www.bricklink.com/catalogList.asp?catType=S&catString=";
  var BL_TREE = "https://www.bricklink.com/catalogTree.asp?itemType=S";
  var LEGO_HELP = "https://www.lego.com/en-us/service/buildinginstructions/";
  var BRICKOGNIZE = "https://brickognize.com/";
  var THEMES = window.BB_THEMES || [];
  var COLORS = { pink: "#ff8fb8", blue: "#8fd3ee", purple: "#b78cf0", green: "#2fa84f", yellow: "#ffd23f", red: "#e3342f" };
  var COLOR_NAMES = { pink: "Girly pink (the original look)", blue: "Baby blue", purple: "Lavender", green: "Baseplate green", yellow: "Sunny yellow", red: "LEGO red" };
  var NOTE_COLORS = ["#f6e7a2", "#ffd0e1", "#cfe2ff", "#cdeed8", "#e6d5ff"];
  var STATUSES = [["built", "✅ Built"], ["want", "🔨 Want to build"], ["wish", "💖 Wishlist"]];

  // ---------- storage ----------
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function okId(v) { return typeof v === "string" && /^[A-Za-z0-9_-]{4,40}$/.test(v); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function defaults() {
    return {
      v: 1, name: "", theme: "pink", prefsAt: 0, gone: [],
      // Two plain example sets to start with. Delete or change them any time!
      sets: [
        { id: uid(), num: "21019", name: "The Eiffel Tower", theme: "Architecture", status: "want", fav: true, demo: true, updatedAt: 0 },
        { id: uid(), num: "", name: "iPhone Duo set", theme: "", status: "wish", fav: false, demo: true, updatedAt: 0 }
      ],
      notes: [{ id: uid(), text: "My next build: the Eiffel Tower! 🗼", color: NOTE_COLORS[0], font: "hand" }],
      pieces: [], sorted: { total: 0, byDay: {} }
    };
  }
  function clean(d) {
    var base = defaults();
    if (!d || typeof d !== "object") return base;
    var s = {
      v: 1, prefsAt: Math.max(0, parseInt(d.prefsAt, 10) || 0), gone: [],
      name: typeof d.name === "string" ? d.name.slice(0, 30) : "",
      theme: COLORS[d.theme] ? d.theme : "pink",
      sets: Array.isArray(d.sets) ? d.sets.filter(function (x) { return x && typeof x === "object"; }).slice(0, 2000).map(function (x) {
        return { id: okId(x.id) ? String(x.id) : uid(), num: String(x.num || "").slice(0, 20), name: String(x.name || "").slice(0, 80),
          theme: String(x.theme || "").slice(0, 40), status: ["built", "want", "wish"].indexOf(x.status) > -1 ? x.status : "want",
          fav: !!x.fav, demo: !!x.demo, updatedAt: Math.max(0, Math.floor(Number(x.updatedAt)) || 0) };
      }) : base.sets,
      notes: Array.isArray(d.notes) ? d.notes.filter(function (x) { return x && typeof x === "object"; }).slice(0, 200).map(function (x) {
        return { id: String(x.id || uid()), text: String(x.text || "").slice(0, 2000),
          color: NOTE_COLORS.indexOf(x.color) > -1 ? x.color : NOTE_COLORS[0],
          font: ["rounded", "hand", "serif", "bold"].indexOf(x.font) > -1 ? x.font : "rounded" };
      }) : base.notes,
      pieces: Array.isArray(d.pieces) ? d.pieces.filter(function (x) { return x && typeof x === "object"; }).slice(0, 200).map(function (x) {
        return { id: String(x.id || uid()), part: String(x.part || "").slice(0, 40), name: String(x.name || "").slice(0, 80), colour: String(x.colour || "").slice(0, 40) };
      }) : [],
      sorted: { total: 0, byDay: {} }
    };
    if (Array.isArray(d.gone)) s.gone = d.gone.filter(function (x) { return x && okId(x.id); }).slice(0, 400).map(function (x) { return { id: String(x.id), deleted: true, updatedAt: Math.max(0, Math.floor(Number(x.updatedAt)) || 0) }; });
    if (d.sorted && typeof d.sorted === "object") {
      s.sorted.total = Math.max(0, parseInt(d.sorted.total, 10) || 0);
      if (d.sorted.byDay && typeof d.sorted.byDay === "object") {
        Object.keys(d.sorted.byDay).slice(-60).forEach(function (k) { s.sorted.byDay[k] = Math.max(0, parseInt(d.sorted.byDay[k], 10) || 0); });
      }
    }
    return s;
  }
  var state;
  try { var raw = localStorage.getItem(KEY); state = raw ? clean(JSON.parse(raw)) : defaults(); } catch (e) { state = defaults(); }
  var canSave = true;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { canSave = false; } }
  save();

  // ---------- helpers ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  var app = document.getElementById("app");
  function setTheme() { document.documentElement.setAttribute("data-theme", state.theme);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", COLORS[state.theme]); }
  function hello() { document.getElementById("hello").textContent = state.name ? "Hi " + state.name + "! 👋" : ""; }
  function findSet(num) { return num ? state.sets.filter(function (s) { return s.num === num; })[0] : null; }
  function count(st) { return state.sets.filter(function (s) { return s.status === st; }).length; }
  function setStatus(set, theme, st) {
    var ex = findSet(set.n);
    if (ex && ex.status === st) { removeSet(ex); }
    else if (ex) { ex.status = st; ex.demo = false; ex.updatedAt = Date.now(); }
    else state.sets.unshift({ id: uid(), num: set.n, name: set.name, theme: theme, status: st, fav: false, demo: false, updatedAt: Date.now() });
    changed();
  }
  // Removing a set leaves a tiny "deleted" marker so other devices remove it too.
  function removeSet(s) { state.sets = state.sets.filter(function (x) { return x !== s; }); state.gone.unshift({ id: s.id, deleted: true, updatedAt: Date.now() }); state.gone = state.gone.slice(0, 400); }
  function changed() { save(); scheduleSync(); }
  function statusPills(num, key) {
    var ex = findSet(num);
    return '<div class="status" role="group" aria-label="Add to my sets">' + STATUSES.map(function (s) {
      return '<button class="pill" data-act="status" data-key="' + esc(key) + '" data-st="' + s[0] + '" aria-pressed="' + (!!ex && ex.status === s[0]) + '">' + s[1] + "</button>";
    }).join("") + "</div>";
  }

  // ---------- views ----------
  function viewBrowse(themeSlug, q) {
    var t = themeSlug ? THEMES.filter(function (x) { return slug(x.name) === themeSlug; })[0] : null;
    if (t) return viewTheme(t);
    q = (q || "").toLowerCase();
    var list = THEMES.filter(function (x) {
      if (!q) return true;
      return x.name.toLowerCase().indexOf(q) > -1 || x.sub.join(" ").toLowerCase().indexOf(q) > -1 ||
        x.sets.some(function (s) { return (s.name + " " + s.n).toLowerCase().indexOf(q) > -1; });
    });
    var h = '<h1 class="page-title">Pick a theme! 🧱✨</h1><p class="lead">Browse LEGO® themes, find sets, and add them to your collection.</p>' +
      '<div class="row"><div class="grow"><label class="f" for="q">Search themes or sets</label><input id="q" type="search" placeholder="Try: Eiffel, Disney, Mario…" value="' + esc(q) + '" autocomplete="off"></div>' +
      '<button class="btn" data-act="random" style="align-self:flex-end">🎲 Surprise me!</button></div>';
    h += list.length ? '<div class="tiles">' + list.map(function (x) {
      return '<a class="tile" style="--c:' + x.color + '" href="#/browse/' + slug(x.name) + '"><span class="em" aria-hidden="true">' + x.emoji + "</span><b>" + esc(x.name) + "</b><small>about " + x.about + " sets</small></a>";
    }).join("") + "</div>" : '<div class="empty" style="margin-top:18px">No themes match “' + esc(q) + '”. Try another word, or <a href="' + BL_TREE + '" target="_blank" rel="noopener noreferrer">look at the full list on BrickLink</a>.</div>';
    h += '<p class="lead" style="margin-top:22px">Want the whole list? <a href="' + BL_TREE + '" target="_blank" rel="noopener noreferrer">See every theme on BrickLink ↗</a></p>';
    return h;
  }
  function setCard(set, t) {
    var ex = findSet(set.n);
    return '<article class="card set"><div><h3><span class="num">' + esc(set.n) + "</span> " + esc(set.name) + '</h3><div class="meta">' + esc(t.name) + (ex ? " · in my sets ✔" : "") + "</div></div>" +
      statusPills(set.n, t.id + "|" + set.n) +
      '<div class="links"><a href="' + BL_SET + encodeURIComponent(set.n) + '-1" target="_blank" rel="noopener noreferrer">Details &amp; pictures on BrickLink ↗</a>' +
      '<a href="' + LEGO_HELP + encodeURIComponent(set.n) + '" target="_blank" rel="noopener noreferrer">Building instructions ↗</a></div></article>';
  }
  function viewTheme(t) {
    var h = '<p class="crumbs"><a href="#/browse">← All themes</a></p><h1 class="page-title">' + t.emoji + " " + esc(t.name) + '</h1><p class="lead">About ' + t.about + ' sets on BrickLink.</p>' +
      '<div class="row"><a class="btn" href="' + BL_CAT + t.id + '" target="_blank" rel="noopener noreferrer">See all ' + esc(t.name) + ' sets on BrickLink ↗</a></div>';
    if (t.sub.length) h += '<p class="f" style="margin:14px 0 0;font-weight:800">Sub-themes you can find there:</p><div class="subs">' + t.sub.map(function (s) { return '<span class="chip">' + esc(s) + "</span>"; }).join("") + "</div>";
    h += t.sets.length ? '<div class="sets">' + t.sets.map(function (s) { return setCard(s, t); }).join("") + "</div>"
      : '<div class="empty" style="margin-top:14px">No hand-picked sets here yet. Open BrickLink above to explore, then add your own in <a href="#/mine">My Sets</a>!<br>(Remix tip: ask to add some of your favourites.)</div>';
    h += '<p class="demo" style="margin-top:12px">Starter picks chosen by hand. Check BrickLink for the full, up-to-date details.</p>';
    return h;
  }

  var mineFilter = "all";

  // ---------- sync between devices (see README: "How sync works") ----------
  var SYNC_KEY = "brick-buddy-sync-v1"; // the sync code lives here, NOT in the backup file
  var sync = { code: "", created: false, last: 0 };
  try { var sraw = JSON.parse(localStorage.getItem(SYNC_KEY) || "null"); if (sraw && typeof sraw.code === "string" && window.BBSync && BBSync.normalize(sraw.code)) sync = { code: sraw.code, created: !!sraw.created, last: Number(sraw.last) || 0 }; } catch (e) {}
  var syncState = sync.code ? "idle" : "off"; // off | idle | syncing | ok | offline | error
  var syncUi = "", syncMsg = "", syncTimer = null, inflight = false, again = false;
  function saveSync() { try { if (sync.code) localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); else localStorage.removeItem(SYNC_KEY); } catch (e) {} }
  function payload(create) {
    var p = { sets: state.sets.map(function (x) { return { id: x.id, num: x.num, name: x.name, theme: x.theme, status: x.status, fav: !!x.fav, demo: !!x.demo, updatedAt: x.updatedAt }; })
        .concat(state.gone.map(function (g) { return { id: g.id, deleted: true, updatedAt: g.updatedAt }; })),
      prefs: { name: state.name, theme: state.theme, updatedAt: state.prefsAt } };
    if (create) p.create = true;
    return p;
  }
  function stampAll(skipPrefs) { var n = Date.now(); state.sets.forEach(function (x) { if (!x.updatedAt) x.updatedAt = n; }); if (!skipPrefs && !state.prefsAt) state.prefsAt = n; }
  function userIsTyping() { var a = document.activeElement; return !!a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName); }
  // Mixes what the server sent with what is on this device right now (nothing local is lost).
  function applyRemote(remote) {
    var m = BBSync.merge({ sets: payload().sets, prefs: payload().prefs }, remote);
    var before = JSON.stringify([state.sets, state.theme, state.name]);
    state.sets = m.sets.filter(function (x) { return !x.deleted; }).map(function (x) { return { id: x.id, num: x.num, name: x.name, theme: x.theme, status: x.status, fav: !!x.fav, demo: !!x.demo, updatedAt: x.updatedAt }; });
    state.gone = m.sets.filter(function (x) { return x.deleted; }).slice(0, 400).map(function (x) { return { id: x.id, deleted: true, updatedAt: x.updatedAt }; });
    if (m.prefs && m.prefs.updatedAt >= state.prefsAt && (m.prefs.theme !== state.theme || m.prefs.name !== state.name)) { state.theme = m.prefs.theme; state.name = m.prefs.name; state.prefsAt = m.prefs.updatedAt; }
    save();
    setTheme(); hello();
    if (before !== JSON.stringify([state.sets, state.theme, state.name]) && !userIsTyping()) render();
  }
  function setSyncState(st, msg) { syncState = st; if (msg !== undefined) syncMsg = msg; updateSyncUi(); }
  function ago(t) { var s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 10 ? "just now" : s < 60 ? s + "s ago" : s < 3600 ? Math.round(s / 60) + " min ago" : Math.round(s / 3600) + " h ago"; }
  function syncLabel() {
    return { off: "", idle: "☁️ sync on", syncing: "☁️ syncing…", ok: "☁️ synced ✓", offline: "📴 offline – saved here, will sync later", error: "⚠️ sync needs a look" }[syncState] || "";
  }
  function updateSyncUi() {
    var pill = document.getElementById("syncpill");
    if (pill) { pill.textContent = syncLabel(); pill.hidden = !sync.code; pill.setAttribute("data-state", syncState); }
    var st = document.getElementById("syncstatus");
    if (st) st.textContent = syncLabel() + (syncState === "ok" && sync.last ? " · " + ago(sync.last) : "") + (syncState === "error" && syncMsg ? " – " + syncMsg : "");
  }
  function scheduleSync(delay) { if (!sync.code) return; clearTimeout(syncTimer); syncTimer = setTimeout(function () { syncNow(); }, delay == null ? 1200 : delay); }
  async function syncNow() {
    if (!sync.code || !window.BBSync) return;
    if (inflight) { again = true; return; }
    inflight = true; setSyncState("syncing");
    try {
      var key = await BBSync.keyFor(BBSync.normalize(sync.code));
      var res = await BBSync.request("PUT", key, payload(!sync.created));
      if (res.status === 200 && res.data && Array.isArray(res.data.sets)) { sync.created = true; sync.last = Date.now(); saveSync(); applyRemote(res.data); setSyncState("ok"); }
      else if (res.status === 404) setSyncState("error", "the server doesn’t know this code");
      else if (res.status === 429 || res.status === 409) setSyncState("offline");
      else if (res.status === 400 || res.status === 413) setSyncState("error", "too many sets to sync");
      else setSyncState("offline");
    } catch (e) { setSyncState("offline"); }
    inflight = false;
    if (again) { again = false; scheduleSync(300); }
  }
  async function enableSync() {
    if (!window.BBSync || !BBSync.supported()) { syncMsg = "Sync needs a newer browser."; syncUi = "join"; render(); return; }
    sync = { code: BBSync.newCode(), created: false, last: 0 };
    stampAll(); save(); saveSync(); syncUi = "code"; syncMsg = ""; syncState = "idle"; render();
    syncNow();
  }
  async function joinSync(input) {
    var norm = window.BBSync && BBSync.normalize(input);
    if (!window.BBSync || !BBSync.supported()) { syncMsg = "Sync needs a newer browser."; render(); return; }
    if (!norm) { syncMsg = "That doesn’t look like a code. It has 28 letters and numbers, like ABCD-EFGH-…"; render(); return; }
    syncMsg = "Looking for your code…"; updateJoinMsg();
    try {
      var key = await BBSync.keyFor(norm), res = await BBSync.request("GET", key);
      if (res.status === 404) { syncMsg = "We can’t find that code. Check it and try again."; render(); return; }
      if (res.status !== 200 || !res.data || !Array.isArray(res.data.sets)) { syncMsg = res.status === 429 ? "Too many tries. Wait a minute." : "Something went wrong. Try again."; render(); return; }
      // Joining an existing box: untouched example sets would only be noise.
      state.sets = state.sets.filter(function (x) { return !(x.demo && !x.updatedAt); });
      sync = { code: BBSync.pretty(norm), created: true, last: Date.now() }; saveSync();
      stampAll(true); applyRemote(res.data); syncUi = ""; syncMsg = ""; setSyncState("ok"); render(); scheduleSync(200);
    } catch (e) { syncMsg = "We can’t reach the server. Are you online?"; render(); }
  }
  function updateJoinMsg() { var m = document.getElementById("syncjoinmsg"); if (m) m.textContent = syncMsg; }
  function unlink(silent) { sync = { code: "", created: false, last: 0 }; saveSync(); clearTimeout(syncTimer); syncState = "off"; syncUi = ""; syncMsg = ""; updateSyncUi(); }
  function copyCode(btn) {
    var c = sync.code, done = function () { btn.textContent = "Copied! ✓"; setTimeout(function () { btn.textContent = "📋 Copy code"; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(done, function () { btn.textContent = "Select it and copy"; });
    else btn.textContent = "Select it and copy";
  }
  function syncCard() {
    var h = '<section class="card sync" aria-labelledby="synch"><h2 id="synch">☁️ Use on more than one device</h2>';
    if (!window.BBSync || !BBSync.supported()) return h + "<p>Sync needs a newer browser. Your sets are still saved on this device.</p></section>";
    if (!sync.code) {
      if (syncUi === "join") {
        return h + '<form id="syncjoin" autocomplete="off"><p>Type the sync code from your other device.</p><label class="f" for="jc">Sync code</label>' +
          '<input id="jc" type="text" maxlength="40" placeholder="ABCD-EFGH-JKMN-PQRS-TVWX-YZ01-2345" autocapitalize="characters" autocorrect="off" spellcheck="false" inputmode="text">' +
          '<p class="demo" id="syncjoinmsg" role="status">' + esc(syncMsg) + '</p><div class="row"><button class="btn" type="submit">Link this device ✨</button><button class="btn ghost" type="button" data-act="sync-cancel">Cancel</button></div></form></section>';
      }
      return h + "<p>See the same sets on your phone, tablet and computer. No account needed: you get a secret code.</p>" +
        '<div class="row"><button class="btn" data-act="sync-on">☁️ Turn on sync</button><button class="btn ghost" data-act="sync-join">🔗 I have a code</button></div></section>';
    }
    h += '<p class="syncline"><b id="syncstatus" role="status"></b></p>';
    if (syncUi === "code") {
      h += '<p>Your secret sync code. Type it on your other device (My Sets → “I have a code”).</p><p class="code" id="synccode" aria-label="Your sync code">' + sync.code.split("-").map(function (g) { return "<span>" + esc(g) + "</span>"; }).join("-<wbr>") + '</p>' +
        '<p class="warn">🔒 Anyone who has this code can see and change your sets. Keep it secret, like a password. Don’t post it anywhere.</p>' +
        '<div class="row"><button class="btn" data-act="sync-copy">📋 Copy code</button><button class="btn ghost" data-act="sync-done">Done</button></div>';
    } else {
      h += '<div class="row"><button class="btn small" data-act="sync-now">🔄 Sync now</button><button class="btn ghost small" data-act="sync-show">🔑 Show my code</button><button class="btn danger small" data-act="sync-off">Stop syncing here</button></div>';
    }
    return h + "</section>";
  }

  function viewMine() {
    var built = count("built"), n5 = Math.max(5, Math.ceil((built + 1) / 5) * 5);
    var stack = ""; for (var i = 0; i < n5; i++) stack += '<i class="' + (i < built ? "" : "off") + '"></i>';
    var shown = state.sets.filter(function (s) { return mineFilter === "all" || (mineFilter === "fav" ? s.fav : s.status === mineFilter); });
    var h = '<h1 class="page-title">My Sets ⭐✨</h1><p class="lead">Your own LEGO® collection. Saved on this device' + (sync.code ? " and shared with the devices you linked." : ".") + '</p>' + syncCard() +
      '<div class="stats"><div class="card stat"><b>' + built + "</b><span>✅ Built</span></div><div class=\"card stat\"><b>" + count("want") + "</b><span>🔨 To build</span></div><div class=\"card stat\"><b>" + count("wish") + "</b><span>💖 Wishlist</span></div></div>" +
      '<div class="card"><b>' + built + " built! " + (n5 - built) + ' more to reach ' + n5 + ' 🎉</b><div class="stack" aria-hidden="true">' + stack + "</div>" +
      '<form id="addset" class="row" autocomplete="off"><div class="grow"><label class="f" for="sn">Set name</label><input id="sn" type="text" maxlength="80" required placeholder="e.g. Flower Bouquet"></div>' +
      '<div style="flex:0 1 120px"><label class="f" for="sno">Number (optional)</label><input id="sno" type="text" inputmode="numeric" maxlength="12" placeholder="10280"></div>' +
      '<div style="flex:0 1 190px"><label class="f" for="sst">Status</label><select id="sst">' + STATUSES.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + "</option>"; }).join("") + "</select></div>" +
      '<button class="btn" type="submit" style="align-self:flex-end">➕ Add</button></form></div>' +
      '<div class="seg" role="group" aria-label="Show">' + [["all", "All"], ["built", "✅ Built"], ["want", "🔨 To build"], ["wish", "💖 Wishlist"], ["fav", "⭐ Favourites"]].map(function (f) {
        return '<button data-act="filter" data-f="' + f[0] + '" aria-pressed="' + (mineFilter === f[0]) + '">' + f[1] + "</button>"; }).join("") + "</div>";
    h += shown.length ? '<div class="sets">' + shown.map(function (s) {
      var link = s.num ? '<a href="' + BL_SET + encodeURIComponent(s.num) + '-1" target="_blank" rel="noopener noreferrer">BrickLink ↗</a>' :
        '<a href="https://www.bricklink.com/v2/search.page?q=' + encodeURIComponent(s.name) + '" target="_blank" rel="noopener noreferrer">Search BrickLink ↗</a>';
      return '<article class="card set"><div class="set-top"><div><h3>' + (s.num ? '<span class="num">' + esc(s.num) + "</span> " : "") + esc(s.name) + '</h3><div class="meta">' + esc(s.theme || "My own set") + (s.demo ? ' · <span class="demo">example – change or delete me</span>' : "") + "</div></div>" +
        '<button class="fav" data-act="fav" data-id="' + s.id + '" aria-label="' + (s.fav ? "Remove favourite" : "Make favourite") + '" aria-pressed="' + s.fav + '">' + (s.fav ? "⭐" : "☆") + "</button></div>" +
        '<div class="status" role="group" aria-label="Status of ' + esc(s.name) + '">' + STATUSES.map(function (st) { return '<button class="pill" data-act="mystatus" data-id="' + s.id + '" data-st="' + st[0] + '" aria-pressed="' + (s.status === st[0]) + '">' + st[1] + "</button>"; }).join("") + "</div>" +
        '<div class="links">' + link + '<button class="btn danger small" data-act="del" data-id="' + s.id + '" aria-label="Remove ' + esc(s.name) + '">🗑 Remove</button></div></article>';
    }).join("") + "</div>" : '<div class="empty">Nothing here yet! Add a set above, or find one in <a href="#/browse">Sets</a>.</div>';
    h += '<div class="row" style="margin-top:18px"><button class="btn ghost small" data-act="export">⬇️ Save a backup file</button><label class="btn ghost small" for="imp" style="cursor:pointer">⬆️ Load a backup</label><input id="imp" type="file" accept="application/json,.json" hidden></div>';
    if (!canSave) h += '<p class="demo">Heads up: this browser is not letting us save, so your sets will disappear when you close the page.</p>';
    return h;
  }

  var sortStep = 0;
  function viewSort() {
    var steps = [
      ["FIRST BRICK", "Open<br>Brickognize", "Lay one mystery brick on a clear surface, then open the scanner.", '<a class="btn" href="' + BRICKOGNIZE + '" target="_blank" rel="noopener noreferrer" data-act="next">Open Brickognize ↗</a>'],
      ["SECOND MOVE", "Scan<br>the brick", "Keep the brick sharp and well lit. Scan until the closest match appears.", '<button class="btn" data-act="next">I scanned it ✓</button>'],
      ["THIRD MOVE", "Match the<br>right set", "Use the result to find its set, then place the brick with that build.", '<a class="btn" href="#/pieces" data-act="next">Find its sets 🔎</a>']
    ];
    var d = state.sorted.byDay[today()] || 0;
    var h = '<p class="kicker" style="font-weight:900;letter-spacing:.12em;font-size:.75rem;margin:10px 0 0">TODAY’S BRICK</p>';
    if (sortStep >= 3) {
      return h + '<div class="poster card" style="margin-top:6px"><h2>Nicely<br>sorted!</h2></div><div class="step-card s3"><span class="burst" aria-hidden="true">🎉</span><h3>That brick is home</h3><p>That loose piece is back where it belongs. Ready for another?</p><button class="btn" data-act="again">Sort another brick</button></div>' + sortStats(d);
    }
    var s = steps[sortStep];
    h += '<div class="poster card" style="margin-top:6px"><h2>One brick.<br>Three moves.</h2></div>' +
      '<article class="step-card s' + sortStep + '"><div class="kicker">0' + (sortStep + 1) + " · " + s[0] + "</div><h3>" + s[1] + "</h3><p>" + s[2] + "</p>" + s[3] + "</article>" +
      '<ol class="steps">' + ["Open Brickognize", "Scan the brick", "Match the right set"].map(function (t, i) {
        var cls = i < sortStep ? "done" : i === sortStep ? "now" : "dim";
        return '<li class="' + cls + '"><span class="n">' + (i < sortStep ? "✓" : i + 1) + "</span><span>" + t + '</span><span class="tag">' + (i < sortStep ? "DONE" : i === sortStep ? "NOW" : "NEXT") + "</span></li>"; }).join("") + "</ol>";
    if (sortStep > 0) h += '<p><button class="btn ghost small" data-act="back">← Back</button></p>';
    return h + sortStats(d);
  }
  function sortStats(d) { return '<p class="lead" style="margin-top:14px">Bricks sorted today: <b>' + d + "</b> · Total: <b>" + state.sorted.total + "</b></p>"; }

  function viewPieces() {
    var h = '<h1 class="page-title">Piece Finder 🔎✨</h1><p class="lead">Found a piece? Type its BrickLink number and we’ll open BrickLink so you can see which sets it comes in.</p>' +
      '<form id="pieceform" class="card" autocomplete="off"><div class="row">' +
      '<div class="grow"><label class="f" for="pp">BrickLink ID / code</label><input id="pp" type="text" required maxlength="40" placeholder="e.g. 35044" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '<div class="grow"><label class="f" for="pn">Piece name (optional)</label><input id="pn" type="text" maxlength="80" placeholder="e.g. Plate 1 x 2"></div>' +
      '<div class="grow"><label class="f" for="pc">Colour (optional)</label><input id="pc" type="text" maxlength="40" placeholder="e.g. Bright Light Blue"></div></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn" type="submit">Find the sets! 🔎</button><a class="btn ghost" href="' + BRICKOGNIZE + '" target="_blank" rel="noopener noreferrer">📷 Scan a photo (Brickognize) ↗</a></div></form>' +
      '<h2 style="margin:20px 0 4px">📚 Saved pieces</h2><div class="pieces">';
    h += state.pieces.length ? state.pieces.map(function (p) {
      return '<div class="card piece"><div><b>' + esc(p.part) + "</b> " + esc(p.name) + (p.colour ? ' <span class="chip">' + esc(p.colour) + "</span>" : "") + '</div><div class="row"><a class="btn small" href="' + pieceUrl(p.part) + '" target="_blank" rel="noopener noreferrer">Open ↗</a><button class="btn danger small" data-act="delpiece" data-id="' + p.id + '" aria-label="Remove piece ' + esc(p.part) + '">🗑</button></div></div>'; }).join("")
      : '<div class="empty">No saved pieces yet. Search for one above!</div>';
    h += "</div>";
    if (state.pieces.length) h += '<p><button class="btn ghost small" data-act="clearpieces" style="margin-top:12px">Clear history</button></p>';
    return h;
  }
  function pieceUrl(part) { return "https://www.bricklink.com/v2/catalog/catalogitem.page?P=" + encodeURIComponent(part) + "#T=S"; }

  var FONTS = [["rounded", "Round"], ["hand", "Handwriting"], ["serif", "Fancy"], ["bold", "Bold"]];
  function viewStudio() {
    var h = '<h1 class="page-title">Studio 🎨✨</h1><p class="lead">Make this app yours: pick a colour, say your name, and write build notes.</p>' +
      '<div class="card"><h2 style="font-size:1.2rem">🎨 Paint the app ✨</h2><div class="themes" role="group" aria-label="App colour">' + Object.keys(COLORS).map(function (c) {
        return '<button class="swatch" style="--sw:' + COLORS[c] + '" data-act="paint" data-c="' + c + '" title="' + COLOR_NAMES[c] + '" aria-label="' + COLOR_NAMES[c] + '" aria-pressed="' + (state.theme === c) + '"></button>'; }).join("") + "</div>" +
      '<div style="margin-top:14px;max-width:360px"><label class="f" for="nm">What should we call you? (saved on this device, and shared only with devices you link)</label><input id="nm" type="text" maxlength="30" placeholder="Your name" value="' + esc(state.name) + '"></div></div>' +
      '<div class="blue-grid" style="margin-top:18px"><h2>📝 My build notes</h2><p>Plans, ideas and lists. Pick a colour and a font for each note.</p><button class="btn" data-act="addnote" style="background:#f4f8ff;color:#241f22">➕ New note</button>' +
      '<div class="notes">' + (state.notes.length ? state.notes.map(function (n) {
        return '<div class="note" style="--nc:' + n.color + '"><textarea class="f-' + n.font + '" data-note="' + n.id + '" maxlength="2000" aria-label="Note text" placeholder="Write something…">' + esc(n.text) + '</textarea><div class="row">' +
          '<div class="swatches" role="group" aria-label="Note colour">' + NOTE_COLORS.map(function (c) { return '<button class="swatch" style="--sw:' + c + '" data-act="ncolor" data-id="' + n.id + '" data-c="' + c + '" aria-label="Colour ' + c + '" aria-pressed="' + (n.color === c) + '"></button>'; }).join("") + "</div>" +
          '<select data-act="nfont" data-id="' + n.id + '" aria-label="Font">' + FONTS.map(function (f) { return '<option value="' + f[0] + '"' + (n.font === f[0] ? " selected" : "") + ">" + f[1] + "</option>"; }).join("") + "</select>" +
          '<button class="btn danger small" data-act="delnote" data-id="' + n.id + '" aria-label="Delete note">🗑</button></div></div>'; }).join("") : '<div class="empty" style="grid-column:1/-1;color:#241f22">No notes yet.</div>') + "</div></div>" +
      '<div class="card" style="margin-top:18px"><h2 style="font-size:1.2rem">About</h2><p style="margin:6px 0 0">This is a free fan app. Theme names and set links come from <a href="' + BL_TREE + '" target="_blank" rel="noopener noreferrer">BrickLink</a>; pictures and details stay on BrickLink. LEGO® and BrickLink™ belong to their owners. No accounts, no tracking. <button class="btn danger small" data-act="reset" style="margin-left:6px">Start over</button></p></div>';
    return h;
  }

  // ---------- router ----------
  var qVal = "";
  function render() {
    var parts = (location.hash || "#/browse").replace(/^#\/?/, "").split("/");
    var tab = parts[0] || "browse", h;
    if (tab === "mine") h = viewMine();
    else if (tab === "sort") h = viewSort();
    else if (tab === "pieces") h = viewPieces();
    else if (tab === "studio") h = viewStudio();
    else { tab = "browse"; h = viewBrowse(parts[1], qVal); }
    app.innerHTML = h;
    Array.prototype.forEach.call(document.querySelectorAll(".tabs a"), function (a) {
      var on = a.getAttribute("data-tab") === tab; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    setTheme(); hello(); updateSyncUi();
  }
  function go() { window.scrollTo(0, 0); render(); }
  window.addEventListener("hashchange", go);

  // ---------- events ----------
  app.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || b.tagName === "SELECT") return;
    var act = b.getAttribute("data-act"), id = b.getAttribute("data-id");
    var s;
    if (act === "status") {
      var k = b.getAttribute("data-key").split("|"), t = THEMES.filter(function (x) { return String(x.id) === k[0]; })[0];
      var set = t && t.sets.filter(function (x) { return x.n === k[1]; })[0];
      if (set) { setStatus(set, t.name, b.getAttribute("data-st")); render(); }
    } else if (act === "random") {
      var all = []; THEMES.forEach(function (t) { t.sets.forEach(function (x) { all.push(slug(t.name)); }); });
      if (all.length) location.hash = "#/browse/" + all[Math.floor(Math.random() * all.length)];
    } else if (act === "filter") { mineFilter = b.getAttribute("data-f"); render(); }
    else if (act === "fav") { s = state.sets.filter(function (x) { return x.id === id; })[0]; if (s) { s.fav = !s.fav; s.updatedAt = Date.now(); changed(); render(); } }
    else if (act === "mystatus") { s = state.sets.filter(function (x) { return x.id === id; })[0]; if (s) { s.status = b.getAttribute("data-st"); s.demo = false; s.updatedAt = Date.now(); changed(); render(); } }
    else if (act === "del") { if (confirm("Remove this set from My Sets?")) { var ds = state.sets.filter(function (x) { return x.id === id; })[0]; if (ds) removeSet(ds); changed(); render(); } }
    else if (act === "export") { exportData(); }
    else if (act === "next") {
      if (sortStep === 2) { var dd = today(); state.sorted.total++; state.sorted.byDay[dd] = (state.sorted.byDay[dd] || 0) + 1; save(); }
      sortStep = Math.min(3, sortStep + 1);
      if (b.tagName === "A") setTimeout(render, 0); else render(); // links keep their normal action
    }
    else if (act === "back") { sortStep = Math.max(0, sortStep - 1); render(); }
    else if (act === "again") { sortStep = 0; render(); }
    else if (act === "delpiece") { state.pieces = state.pieces.filter(function (x) { return x.id !== id; }); save(); render(); }
    else if (act === "clearpieces") { if (confirm("Clear all saved pieces?")) { state.pieces = []; save(); render(); } }
    else if (act === "paint") { state.theme = b.getAttribute("data-c"); state.prefsAt = Date.now(); changed(); render(); }
    else if (act === "addnote") { state.notes.unshift({ id: uid(), text: "", color: NOTE_COLORS[state.notes.length % NOTE_COLORS.length], font: "hand" }); save(); render(); }
    else if (act === "delnote") { if (confirm("Delete this note?")) { state.notes = state.notes.filter(function (x) { return x.id !== id; }); save(); render(); } }
    else if (act === "ncolor") { var n = state.notes.filter(function (x) { return x.id === id; })[0]; if (n) { n.color = b.getAttribute("data-c"); save(); render(); } }
    else if (act === "reset") { if (confirm("Start over? This removes your sets, notes and pieces from this device" + (sync.code ? " and stops syncing here (your other devices keep their sets)." : "."))) { state = defaults(); save(); unlink(true); sortStep = 0; render(); } }
    else if (act === "sync-on") { enableSync(); }
    else if (act === "sync-join") { syncUi = "join"; syncMsg = ""; render(); }
    else if (act === "sync-cancel" || act === "sync-done") { syncUi = ""; syncMsg = ""; render(); }
    else if (act === "sync-show") { syncUi = "code"; render(); }
    else if (act === "sync-copy") { copyCode(b); }
    else if (act === "sync-now") { syncNow(); }
    else if (act === "sync-off") { if (confirm("Stop syncing on this device? Your sets stay here. Your other devices keep their sets too.")) { unlink(); render(); } }
  });
  app.addEventListener("change", function (e) {
    var t = e.target;
    if (t.getAttribute("data-act") === "nfont") { var n = state.notes.filter(function (x) { return x.id === t.getAttribute("data-id"); })[0]; if (n) { n.font = t.value; save(); render(); } }
    else if (t.id === "imp" && t.files && t.files[0]) importData(t.files[0]);
  });
  app.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "q") { qVal = t.value; var pos = t.selectionStart; render(); var q = document.getElementById("q"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} } }
    else if (t.id === "nm") { state.name = t.value.slice(0, 30); state.prefsAt = Date.now(); changed(); hello(); }
    else if (t.hasAttribute("data-note")) { var n = state.notes.filter(function (x) { return x.id === t.getAttribute("data-note"); })[0]; if (n) { n.text = t.value; save(); } }
  });
  app.addEventListener("submit", function (e) {
    e.preventDefault();
    if (e.target.id === "addset") {
      var name = document.getElementById("sn").value.trim(); if (!name) return;
      var num = document.getElementById("sno").value.trim().replace(/-\d+$/, "");
      var known = null; THEMES.forEach(function (t) { t.sets.forEach(function (s) { if (num && s.n === num) known = t.name; }); });
      state.sets.unshift({ id: uid(), num: num, name: name, theme: known || "", status: document.getElementById("sst").value, fav: false, demo: false, updatedAt: Date.now() });
      changed(); render();
    } else if (e.target.id === "syncjoin") {
      joinSync(document.getElementById("jc").value);
    } else if (e.target.id === "pieceform") {
      var part = document.getElementById("pp").value.trim(); if (!part) return;
      state.pieces.unshift({ id: uid(), part: part, name: document.getElementById("pn").value.trim(), colour: document.getElementById("pc").value.trim() });
      state.pieces = state.pieces.slice(0, 100); save();
      window.open(pieceUrl(part), "_blank", "noopener,noreferrer"); render();
    }
  });

  function exportData() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "olofs-mission-control-backup.json";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importData(file) {
    var r = new FileReader();
    r.onload = function () {
      try { var d = JSON.parse(r.result); if (!d || typeof d !== "object" || !Array.isArray(d.sets)) throw new Error("bad"); var nowT = Date.now(), imp = clean(d), ids = {};
        imp.sets.forEach(function (x) { ids[x.id] = 1; x.updatedAt = nowT; });
        state.sets.forEach(function (x) { if (!ids[x.id]) state.gone.unshift({ id: x.id, deleted: true, updatedAt: nowT }); });
        imp.gone = state.gone.filter(function (g) { return !ids[g.id]; }).slice(0, 400);
        imp.prefsAt = nowT; state = imp; changed(); render(); alert("Your backup is loaded! 🎉"); }
      catch (err) { alert("Hmm, that file doesn’t look like a Mission Control backup."); }
    };
    r.readAsText(file);
  }

  // keep devices in step: on load, when the tab comes back, when the network returns, and every 30 s while open
  if (sync.code) scheduleSync(400);
  window.addEventListener("online", function () { scheduleSync(200); });
  window.addEventListener("offline", function () { if (sync.code) setSyncState("offline"); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) scheduleSync(300); });
  setInterval(function () { if (sync.code && !document.hidden) syncNow(); }, 30000);

  render();
})();
