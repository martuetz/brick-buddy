# 🧱 Olöf's Lego Girly Mission Control

A fun, free **LEGO® fan app** for kids (and grown-ups): browse sets by theme, keep track of the sets you built, sort loose bricks, find which sets a piece comes in, and write build notes.

It is **one tiny web page** (HTML + CSS + plain JavaScript). No accounts, no tracking, no servers. Everything you save stays **in your own browser** (`localStorage`).

## Look and feel

A bright, cheerful cartoon style: **pastel pink + baby blue**, with **LEGO red / yellow / blue / green** accents, brick-stud patterns, little sparkles ✨, a **red bow** logo, a cute header drawing of a girl with a red bow and round glasses, and a **green baseplate** footer. All the art is original SVG drawn in code (`index.html`, `styles.css`, `favicon.svg`). It is a generic cartoon, not a likeness of a real person, and there are no photo files in this repo.

The **🎨 Studio** tab can repaint everything: Girly pink (the default), Baby blue, Lavender, Baseplate green, Sunny yellow, LEGO red. To change the colours yourself, edit the variables at the top of `styles.css`.

## What's inside

| Tab | What it does |
| --- | --- |
| 🧱 **Sets** | Pick a theme (Architecture, Disney, Botanicals, Star Wars…) → see hand-picked sets → tap **Built / Want to build / Wishlist**. Each set links to BrickLink for details and pictures. 🎲 *Surprise me!* picks a random theme. |
| ⭐ **My Sets** | Your collection with counters, a "next 5 sets" brick stack, favourites, your own sets, and backup / load backup files. |
| 🧩 **Sort** | *One brick. Three moves.* A little ritual: open Brickognize → scan the brick → match the set. Counts the bricks you sorted. |
| 🔎 **Pieces** | Type a BrickLink part number and open BrickLink to see which sets it comes in. Keeps a saved-pieces list. |
| 🎨 **Studio** | Paint the whole app in 6 colour moods, type your name (kept on your device), and make coloured build notes with different fonts. |

## ☁️ Use it on more than one device (sync)

My Sets can follow you from your tablet to your phone and your computer. There are **no accounts**.

**How to use it**
1. On device 1: **My Sets → ☁️ Turn on sync**. You get a secret code like `5S08-RCXA-CGW9-34D1-HBAZ-GAK0-6THP`.
2. On device 2: **My Sets → 🔗 I have a code**, type the code, tap **Link this device**.
3. That's it! A small badge in the header says **☁️ synced ✓**, or **📴 offline** when there is no internet (everything still works and syncs later).

> 🔒 **Treat the code like a password.** Anyone who has it can see and change your sets. Don't post it. (It is not stored in the backup file either.)

**How sync works**
- The app is *offline-first*: everything is saved in your browser (`localStorage`, key `brick-buddy-v1`) first. The cloud copy is just a mirror that keeps devices in step.
- The code is made **in your browser** from 140 random bits. The browser sends only `SHA-256(code)` to the server (`x-sync-key`); the server stores only `SHA-256` of *that*. The raw code never leaves your device and is never stored on the server.
- The server stores **only your sets plus your colour and name** (tiny JSON, under 100 KB). No notes, no pieces, no IP addresses, no accounts, no analytics.
- Sync runs when the page opens, a moment after each change, when the tab comes back, when the internet returns, and every 30 s while open.
- **Merging, not overwriting:** every set has an `updatedAt` time and the newest change to each set wins. Removed sets leave a tiny "deleted" marker (kept 60 days) so other devices remove them too. Two devices therefore never wipe each other's sets.
- If the API is down or you are offline, the app keeps working from `localStorage` and retries.
- The API is `api/sets.js` (one Vercel serverless function). It checks the payload size and shape, refuses cross-site requests (same-origin only, no CORS headers), and rate-limits lightly (per code and per IP, in memory).
- "Start over" in Studio stops syncing on that device but does **not** delete the cloud copy or other devices' sets.

**Setting up your own copy of the database** (only needed if you deploy your own fork)
1. In Vercel, open your project → **Storage** → add a free **Neon** (Postgres) database from the Marketplace and connect it to the project. This adds `DATABASE_URL` as an environment variable. **Never put it in the repo.**
2. Deploy. The function creates its one small table (`sync_boxes`) by itself the first time it runs.
3. Without a database the app still works fine, it just says "offline" for sync.

Run `npm test` for the unit tests of the merge and validation code.

## Where the ideas come from

This app combines four things:

1. a **LEGO Piece Set Finder** app (Grok app) – piece search, saved pieces, building-instruction links;
2. **BrickLink's public set-catalog tree** – the theme and sub-theme *names*;
3. a **Cobalt studio** app (Grok app) – the blue-grid note board, fonts and colours;
4. a **Brick Sorter** app (Grok app) – the "one brick, three moves" ritual.

## Data, attributions and trademarks

- **Data and links from [BrickLink](https://www.bricklink.com/catalogTree.asp?itemType=S).** Theme/sub-theme names follow BrickLink's public *Reference Catalog – Sets* tree. The set list in `data.js` is a **small, hand-typed list** (set number + name). Counts like "about 73 sets" are approximate.
- **No scraping and no copied pictures.** This app does not download or re-host BrickLink data or images. It only **links out** to BrickLink (and to LEGO's building-instructions pages) for details and pictures.
- Brick scanning is done by [Brickognize](https://brickognize.com/) on their own site.
- **LEGO® is a trademark of the LEGO Group. BrickLink™ is a trademark of its owner. This is an unofficial fan app, not affiliated with or endorsed by LEGO or BrickLink.**
- No cookies, no analytics, no ads, no third-party scripts, no web fonts. The only network requests are the app's own files and, if you turn on sync, its own `/api/sets`.

## Run it on your computer

```bash
git clone https://github.com/martuetz/brick-buddy.git
cd brick-buddy
python3 -m http.server 8000   # or: npx serve
# open http://localhost:8000
```

There is nothing to build or install for the app itself. You can also just double-click `index.html` (sync only works on the deployed site, which has the `/api/sets` function).

## 🌈 Remix it! (kid-friendly)

**The easy way – ask the Grok app (with a grown-up for the first time):**

1. Open the Grok app and start a new chat.
2. Say you want to remix **Olöf's Lego Girly Mission Control**, then paste the link to the app, or paste the code from `index.html`, `styles.css`, `data.js` and `app.js`.
3. Tell Grok what you want. Try:
   - *"Make it purple."*
   - *"Add my sets: …"* (type the names and numbers)
   - *"Add a Minecraft page with my favourite sets."*
   - *"Add a button that plays a happy sound when I mark a set as built."*
4. Grok shows you the new version. If you like it, ask Grok how to share or keep it.

> ⚠️ Honest note: this app was made outside the Grok app builder, so it does **not** have a one-tap "Remix" button. Pasting its link or code into a Grok chat is the way to remix it. (The other three Grok apps this one was built from *do* have a Remix button.)

**The grown-up way – your own copy on GitHub + Vercel:**

1. On this GitHub page, click **Fork** (top right) to make your own copy.
2. Go to [vercel.com/new](https://vercel.com/new), pick your fork and click **Deploy**. You get your own web address in about a minute.
3. To change things, edit `data.js` (sets and themes) or `styles.css` (colours – look at the top of the file!), save, and Vercel updates your site.

### Easy things to change

- **Colours:** top of `styles.css` (`--brand`, `--bg`…), or use the 🎨 Studio tab.
- **Add a set:** in `data.js`, copy a line like `{ n: "21019", name: "The Eiffel Tower" }` into a theme.
- **Add a theme:** copy a whole theme block in `data.js` and change the name, emoji and colour.

## Files

```
index.html   the page
sync.js      sync helpers (code, hashing, merge)
api/sets.js  the tiny sync API (Vercel function)
api/_lib.js  API validation + merge (unit-tested)
vercel.json  security headers
styles.css   the look
data.js      themes and sets (hand-typed)
app.js       the app (tabs, saving, notes…)
favicon.svg  the little brick icon
```

## Privacy

Your sets, notes, colour and name are stored in your browser's `localStorage` under the key `brick-buddy-v1`. If you turn on sync, your sets plus colour and name are also kept (under a hashed code) in a small database so your other devices can see them. Use *My Sets → Save a backup file* to keep a copy or move to another device. "Start over" in Studio erases everything.

## Licence

Code: MIT (see `LICENSE`). LEGO®, BrickLink™ and Brickognize belong to their owners.
