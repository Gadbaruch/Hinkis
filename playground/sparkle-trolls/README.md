# Sparkle Trolls — Crystal Sky Adventure

A little 2D platformer. Blue shiny trolls to rescue, blue shiny crystals,
magic notes that play a tune when you catch them, lots of hearts, and a sky
absolutely full of jewels and diamonds.

## How to play it

Double-click `index.html`. That's it — no installing, no internet, no accounts.
(Or, from the `web/` folder: `npx serve -l 3032 ../sparkle-trolls`.)

## Controls

| Key | What it does |
| --- | --- |
| ← → or A D | walk |
| SPACE (or ↑ / W) | jump — press again in the air for a **double jump** |
| M | music on / off |
| R | start the current place again |
| 1 2 3 | on the title screen, start at that place |

On a tablet or phone there are big touch buttons at the bottom instead.

## The rules

There are no rules. Nobody can lose and nothing can hurt you. Fall down a hole
and you float gently back to where you were standing.

- **Blue crystals** — sprinkled everywhere.
- **Magic notes** — each one plays the next note of a pentatonic scale, so
  a run of them always sounds nice.
- **Hearts** — 46 of them across the three places.
- **Jewels and diamonds** — the reachable ones are collectible; the ones far
  away in the sky are scenery, and there are lots of both.
- **Trolls** — touch one and it joins your parade, following your footsteps
  for the rest of the game. There are 18 in all.

Walk into the rainbow doorway at the end of a place to move on to the next one.

## The three places

1. **Crystal Meadow** — gentle, mostly solid ground, a few small holes.
2. **Jewel Sky** — floating and bobbing ledges, a sky stuffed with jewels.
3. **Rainbow Peak** — a climb up to the top, purple skies, the biggest parade.

## For the grown-up

Two files, no dependencies, no build step: `index.html` and `game.js`.
Everything is drawn with canvas paths (no image files) and the sound is a tiny
built-in WebAudio synth (no audio files), so the whole thing works offline
forever.

Handy while tinkering — the browser console has a `SparkleTrolls` hook:

```js
SparkleTrolls.goToLevel(2)   // jump to Rainbow Peak
SparkleTrolls.tick(1/60)     // step one frame by hand
SparkleTrolls.totals         // what has been collected
```

Levels live in `buildLevel1/2/3`. A `fixReach()` pass runs over every level at
load and pulls any pick-up that floats too high back down into double-jump
range, so it is safe to scatter things freely when adding more.
