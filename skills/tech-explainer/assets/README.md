# Examples — look before you build, then make it your own

Open these with the Read tool (images) before writing scenes, `boards/` first. They show the **range** of the style:
how varied the pictures are inside one consistent look. They are **inspiration, not templates**:
don't copy a frame, and don't limit yourself to what's here. Every topic deserves its own pictures;
invent new ones whenever the subject calls for it (see "Beyond the recipes — invent" in
`../references/scenes.md`).

## boards/ — the range of the style, made with tsvg:tech (start here)

Seven boards of six portrait scenes each, one technique per board, all original scenes built with this library
(sources in `boards/src/board-N.tsvg`; open one to see how a scene is drawn — rooms, devices, towns, crowds, people
are plain TSVG paths on isometric planes). They are the quality bar to aim for.

| Board | Scenes |
|---|---|
| `board-1-devices-and-screens.jpg` | a laptop's battery window running off the frame · a TV mid-update on a cabinet · a sideways phone map · a person at a CRT dialling in · a phone with permission rays · a tilted settings screen over a room |
| `board-2-isometric-worlds.jpg` | an apartment cutaway with Wi-Fi rings · a kitchen with signal lines and a microwave · a city block with a data center · a full-bleed map of chargers · a town to every edge · one calm rack of servers |
| `board-3-diagrams.jpg` | one tile + gear pill · a CPU hub with spokes · a file list becoming a tree · a mail graph (good / spam) · a tiny model with a score gauge · a row of devices with chips |
| `board-4-ui-code-documents.jpg` | a hex viewer with a signature label · a code window with the bug row · terms with lime quotes beside a camera phone · a voice-history window · sensor cards + a CSV row · a warranty line struck and rewritten |
| `board-5-numbers-and-scale.jpg` | an exploded board with "120×" · a cube of tiny cells for 1 TB · coins falling into a counter · a map route with "3.2 km" · RAW vs JPG files then bars · a quiet bedroom with a chart |
| `board-6-people-and-story.jpg` | a person at a desk from behind · a long cable to a printer · a crowd of 2,400 on a slab · an old laptop under a desk · a patent, keys, a typewriter chip · 1971 + name @ computer tokens |
| `board-7-endings.jpg` | the follow card · on a laptop screen · above a phone · on a CRT · a floating phone · the opening person again (bookend) |

To change or add a board: edit `boards/gen/boardN.mjs` (helpers for iso boxes, houses, trees, rooms, people in
`boards/gen/gen.mjs`) and run `boards/gen/run.sh N` — it rewrites the source, checks it and renders the montage.

## own/ — made with tsvg:tech (safe to share)

| File | What it shows |
|---|---|
| `scene-recipes-portrait.jpg` | all 22 recipes of `references/scenes.md` + the follow card, rendered in 9:16 (each tile = that beat's middle moment and its caption) |
| `scene-recipes-landscape.jpg` · `scene-recipes-square.jpg` | the same document in 16:9 and 1:1: the stage scales, nothing is re-laid out |
| `example-url-video-*.jpg` | `examples/styles/tech-explainer.tsvg` ("What happens when you type a URL?") in all three formats |

These show what the library does out of the box. The references below show how much further
hand-drawn scenes go; aim between the two.

## reference/ — the original style (local only, may be absent)

Frames and short clips from the creator's reels this style was studied from. They are someone
else's work: **study them, never copy them into a video, and never commit or publish them**
(`reference/` is git-ignored). If the folder is missing, the notes below still describe what's in it.

Boards (6 frames each, from different reels, one technique per board):

| Board | Look for |
|---|---|
| `board-1-devices-and-screens.jpg` | the device is the stage: a laptop's disk window, a TV mid-download, a CRT, a phone settings page; real UI words; heavy crop, the device bleeds off the frame |
| `board-2-isometric-worlds.jpg` | room cutaways with a person in them, a city block, a game map, a city of houses, a server farm; full-bleed, cropped by the frame edges |
| `board-3-diagrams.jpg` | engine pills under logos, a hub of browsers, a DOM tree on an isometric plate, a link graph (green good / red fake), a neural lattice, a row of routers with chips |
| `board-4-ui-code-documents.jpg` | a debugger with green/red rows and a leader-line label, a policy page with lime quotes beside a phone, a chat window, a tracker table, a help page being rewritten |
| `board-5-numbers-and-scale.jpg` | "60×" over a chip, a cube of 1,000 maker GB, a coin trail from AWS to "$3,135,000", "$391.5M · 40 states" on a map, 60 KB vs 3 MB files, a signal chart over a bedroom |
| `board-6-people-and-story.jpg` | a recurring character at a desk, a packet stopped at a barrier, a crowd of 161 people, a desk for two founders, paper → tokens ("The bot won because it trained") with year chips |
| `board-7-endings.jpg` | the follow card on whatever device the story used (browser, laptop, phone, CRT, the character's monitor) and a closing callback ("GG,") |

Clips (8–11 s each, 540 px, with sound, to feel the pacing and motion):

| Clip | Watch for |
|---|---|
| `clips/1-families-then-money-flow.mp4` | context dims and slides away; a new fact ("≈ $500M a year") lands as a label exactly on its word |
| `clips/2-debugger-highlight-crack.mp4` | rows highlight on the word, a label drops in with a leader, a window slides over to show the result |
| `clips/3-room-cutaway-multipath.mp4` | a full-bleed room with a person; radio paths bounce; a chart appears for "echoes" |
| `clips/4-versus-two-ways-to-count.mp4` | two identical stacks, then the difference label grows (+2.4% → +7.4%) at each step |
| `clips/5-paper-to-tokens-timeline.mp4` | a year chip + a paper, then the words become chips and attention arcs connect them |
| `clips/6-file-wall-then-ending-on-device.mp4` | a full-bleed wall of files, then the follow card on the story's own CRT, the button gets clicked |

What to take from them: **sync** (everything lands on its word), **restraint** (one green thing),
**specificity** (real names, real numbers, real UI words) and **variety** (no two neighbouring
beats look alike). What not to take: their channel name, logo, characters or any frame.
