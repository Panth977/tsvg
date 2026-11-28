# Formats — one document, three screens

`tsvg:tech` ships three layouts, and one document plays in all of them:

| Layout | Size | Where it goes | Caption |
|---|---|---|---|
| `landscape` (default) | 1920×1080 | YouTube, docs, slides, a website, the TSVG player | y = H − 105, 50 px, up to 78% of the width |
| `portrait` | 1080×1920 | Instagram Reels, YouTube Shorts, TikTok | y = 1500, 60 px, 820 px wide (2 lines) |
| `square` | 1080×1080 | LinkedIn, X, Instagram feed | y = H − 105, 50 px |

The player picks the layout closest to the screen; the viewer can switch. For a video meant for **one** format only, put your own `<layouts>` in the document (it replaces the library's), e.g. `<layouts><layout id="portrait" w="1080" h="1920"/></layouts>`.

## The stage

You write every beat once, in **stage coordinates**: the portrait frame's own space, 1080 wide, visual zone **y 250–1300**, centre line x = 540.

- **portrait:** the stage is the frame (scale 1).
- **landscape / square:** the stage is scaled to fit between y 30 and the caption (scale (H − 210)/1050 ≈ 0.83 at 1080 high) and centred horizontally.

So the composition is portrait-first. Keep every element inside x 60–1020, y 250–1300 and it is safe everywhere.

### Using the extra width in landscape

In landscape the stage shows canvas x from about −620 to 1700. Spread a composition out for 16:9 with **layout variants on the use** (`x.landscape`): portrait and square keep the base value.

```xml
<tx:beat id="f1" say="Your laptop asks the server, / and the answer comes back.">
  <tx:tile x="220" x.landscape="-200" y="760" icon="laptop" label="You" at="0.1"/>
  <tx:tile x="860" x.landscape="1280" y="760" icon="server" label="Server" at="0.2"/>
  <tx:wire d="M305 760 L775 760" d.landscape="M-115 760 L1195 760" at="=cue('f1.0') + 0.3"/>
</tx:beat>
```

Rules of thumb for 16:9: put the two ends of a flow, a versus, or a hub's ring further apart; keep the focus thing at x 540; never put text beyond x −560 or 1640.

### Safe zones on social apps

Reels / Shorts / TikTok draw their own buttons over the video: the right edge (x > 960) from y 1000 down, and the bottom ~280 px. The portrait caption (y 1500) and the stage (to y 1300) already avoid the bottom band; don't park a label in the lower-right corner.

## Exporting for each platform

The `.tsvgz` plays in the TSVG player with every layout inside. For platforms that need an mp4:

```sh
$TSVG export video.tsvg --layout portrait  --fps 30 -o reel.mp4        # Reels / Shorts / TikTok
$TSVG export video.tsvg --layout landscape --fps 30 -o youtube.mp4     # YouTube
$TSVG export video.tsvg --layout square    --fps 30 -o linkedin.mp4    # LinkedIn / X
```

Don't add `--captions`: this style already burns its captions into the picture. In the TSVG player, tell viewers to leave CC off (or they'll see the caption twice).

## Check every format

`$TSVG make` writes one contact sheet per layout (`*.preview-landscape.png`, `*.preview-portrait.png`, `*.preview-square.png`). Read all three. Square is the tightest (the stage is scaled ~0.83 and the caption sits close under it): if something collides there, it is too low on the stage.
