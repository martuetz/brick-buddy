# Grok Build prompt: Olöf's Lego Girly Mission Control

Paste PART 1 and then PART 2 (one message, PART 1 first) into Grok Build mode on grok.com.
Then see the follow-up remix prompts at the bottom.

## PART 1: prompt

Build me a kid-friendly web app called "Olöf's Lego Girly Mission Control" (spell it exactly, with the ö). It is a Lego set browser and collection tracker for a girl who loves LEGO. Use React + Tailwind, run fully in the browser, no login, no tracking, no real photos or personal data. Make it mobile-first (must fit a 390px phone with no sideways scrolling) and also nice on desktop.

LOOK
Pastel pink (#fff0f6 background, #d6337a main) plus baby blue (#c6e9f7 header). Cheerful LEGO accents: red #e3000b, yellow #ffd500, blue #0055bf, green #237841. Rounded, bubbly cards and buttons (big radius, soft shadows, chunky friendly font). Header: a red bow logo (draw it as inline SVG), the app name (the words "Mission Control" in pink), a cute original SVG cartoon girl with a red bow and round glasses (generic, not a likeness), twinkling sparkle stars, and a row of LEGO studs. Footer: a green LEGO baseplate strip with studs and a few loose coloured bricks on top. Bottom tab bar with 5 big tabs and emoji icons. Large readable text, good colour contrast, big tap targets.

TABS AND FEATURES
1) Sets: a grid of colourful theme tiles (data block below). Tap a theme to see its starter sets, each with set number, name, and buttons Built / Want to build / Wishlist (toggle), plus a "BrickLink" link out. Each theme page also has "See all on BrickLink" (https://www.bricklink.com/catalogList.asp?catType=S&catString=<id>) and the set link is https://www.bricklink.com/v2/catalog/catalogitem.page?S=<number>-1. Include a search box that filters themes and sets. Themes with no starter sets just show the BrickLink link.
2) My Sets: her collection. Three counters at top (Built, Want to build, Wishlist). A brick-stack progress bar towards the next multiple of 5 built sets with a little celebration (confetti/sparkles) when she hits one. Filter chips: All, Built, To build, Wishlist, Favourites. Star to favourite a set. Change status or remove a set. "Add my own set" form (name, optional number, status) for custom sets, each with a "Search BrickLink" link (https://www.bricklink.com/v2/search.page?q=<name>). Start with two example sets (21019 The Eiffel Tower = Want to build, and "iPhone Duo set" = Wishlist) marked as examples. Buttons "Save a backup file" (download JSON) and "Load a backup" (import JSON, validate it, never crash on bad files).
3) Sort: a fun "sorting ritual" for tidying bricks in 3 easy steps ("One brick. Three moves."): pick up one brick, decide colour/shape/size pile, put it away, with a Next button, a tiny celebration at the end, and a link to https://brickognize.com/ (identify a brick from a photo; just a link).
4) Pieces (Piece Finder): type a BrickLink part number (e.g. 3001) to open https://www.bricklink.com/v2/catalog/catalogitem.page?P=<id>#T=S in a new tab, and keep a small saved-pieces list (add note, remove, tap to open again).
5) Studio: 6 colour moods (Pink default, Blue, Purple, Green, Yellow, Red) that re-colour the whole app via CSS variables with cute colour names; a "Her name" text field that personalises the greeting in the header ("Hi <name>!"); a notes board where she can write notes with 4 fonts and 5 text colours; a "Start over" button with a confirm.

STORAGE
Save everything in the browser's localStorage under one key (brick-buddy-v1): sets, statuses, favourites, custom sets, pieces, notes, colour mood, name. Everything must survive reload. If the Grok app builder offers a per-app database or cloud storage, use it for My Sets so the same sets show on all her devices (keep localStorage as an offline cache); otherwise use localStorage only and say so in a small note.

NOTES TO SHOW (small, in the footer)
"Data and links from BrickLink. LEGO® and BrickLink™ are trademarks of their owners. This is a fan-made app and is not affiliated with or endorsed by the LEGO Group or BrickLink. Brick scanning by Brickognize. No accounts, no tracking: your stuff is saved only in this browser." Do not scrape BrickLink, do not fetch from BrickLink, and do not use BrickLink or LEGO images or logos: only the hand-written data below, emoji, and your own SVG/CSS art. Give each theme tile its own emoji and colour.

DATA
Use the DATA BLOCK pasted after this prompt (themes as BrickLink category-id=name, and starter sets by theme).

WHEN DONE
Test every tab, fix any errors, then publish with anyone-with-the-link access and Allow forking/Remix ON.

## PART 2: data block (paste right after part 1)

DATA BLOCK (hand-typed; BrickLink category id = theme name)
THEMES (39): 629=Architecture | 1068=Icons | 1122=Botanicals | 878=Disney | 171=Creator | 771=Friends | 227=Harry Potter | 65=Star Wars | 1095=Super Mario | 801=Minecraft | 759=NINJAGO | 36=Technic | 842=Speed Champions | 67=Town | 850=Jurassic World | 1272=Art | 817=LEGO Ideas | 903=BrickHeadz | 1076=Dots | 1268=DREAMZzz | 746=Collectible Minifigures | 34=Space | 9=Castle | 61=Pirates | 167=DUPLO | 423=Classic | 390=Holiday & Event | 768=Super Heroes | 1332=Bluey | 1203=Sonic the Hedgehog | 1369=Pokémon | 1285=Animal Crossing | 1266=Gabby's Dollhouse | 1305=Wicked | 1312=Wednesday | 843=Elves | 1042=Hidden Side | 273=BIONICLE | 1070=Despicable Me & Minions

STARTER SETS (set number name), by theme:
Architecture: 21019 The Eiffel Tower; 21044 Paris; 21061 Notre-Dame de Paris; 21028 New York City; 21034 London; 21058 Great Pyramid of Giza
Icons: 10307 Eiffel Tower; 10497 Galaxy Explorer; 10300 Back to the Future Time Machine; 10316 The Lord of the Rings: Rivendell
Botanicals: 40524 Botanical Collection – Sunflowers; 40588 Flowerpot; 10280 Flower Bouquet; 10281 Bonsai Tree; 10311 Orchid
Disney: 43222 Disney Castle; 43248 Inside Out 2 Mood Cubes
Creator: 31147 Retro Camera; 31120 Medieval Castle; 31109 Pirate Ship
Harry Potter: 71043 Hogwarts Castle; 76391 Hogwarts Icons – Collectors' Edition; 76419 Hogwarts Castle and Grounds
Star Wars: 75192 Millennium Falcon; 75331 The Razor Crest; 75290 Mos Eisley Cantina
Super Mario: 71360 Adventures with Mario Starter Course; 71411 The Mighty Bowser
Minecraft: 21128 The Village
NINJAGO: 71741 NINJAGO City Gardens
Technic: 42115 Lamborghini Sián FKP 37; 42143 Ferrari Daytona SP3; 42083 Bugatti Chiron
Speed Champions: 76895 Ferrari F8 Tributo
Town: 60198 Cargo Train; 60337 Express Passenger Train
Jurassic World: 76956 T. rex Breakout
Art: 31208 Hokusai – The Great Wave
LEGO Ideas: 21333 Vincent van Gogh – The Starry Night; 21318 Tree House
Space: 6990 Monorail Transport System
Classic: 10698 Classic Large Creative Brick Box
Holiday & Event: 40816 Decorative Easter Egg

## Follow-up remix prompts for Ólöf

1. Add my sets: "Add these to My Sets as Built: <number name>, <number name>, <number name>."
2. Make it purple: "Make the whole app purple and sparkly instead of pink, keep the baby blue header and the LEGO colours."
3. Add something new: "Add a Wishlist birthday tab with a countdown, and a button that makes a shopping list of my Wishlist sets I can copy."
