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
- No cookies, no analytics, no ads, no third-party scripts, no web fonts. The only network requests are the app's own files.

## Run it on your computer

```bash
git clone https://github.com/martuetz/brick-buddy.git
cd brick-buddy
python3 -m http.server 8000   # or: npx serve
# open http://localhost:8000
```

There is nothing to build or install. You can also just double-click `index.html`.

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
styles.css   the look
data.js      themes and sets (hand-typed)
app.js       the app (tabs, saving, notes…)
favicon.svg  the little brick icon
```

## Privacy

Your sets, notes, colour and name are stored only in your browser's `localStorage` under the key `brick-buddy-v1`. Use *My Sets → Save a backup file* to keep a copy or move to another device. "Start over" in Studio erases everything.

## Licence

Code: MIT (see `LICENSE`). LEGO®, BrickLink™ and Brickognize belong to their owners.
