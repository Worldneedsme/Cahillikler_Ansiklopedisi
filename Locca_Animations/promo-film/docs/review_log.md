# Review log

How each round works:
- **Contact sheet**: one frame per beat, at beat + 0.3 s (`review/sheet_beats.png`).
- **Phone test**: 12 frames at 360 px wide (`review/phone_360.png`).
- **Filmstrips**: every transition, at 30–60 fps (`review/strip_*.png`).
- **Audio**: onset analysis against the grid (`review/audio_wave.png`).

Scores are out of 10, and a round passes only when every score is 8 or higher.

---

## Round 1: first full build (contact sheet + filmstrips, no audio yet)

| Criterion | Score | Notes |
|---|---|---|
| Hook in first 2 s | 6 | Dot pops at Ø150 and takes 0.37 s before "Her" starts. The 2.0 s exit is crowded: the map window rises through the leaving type while "Ziyaret Et." enters. |
| Readability on a phone | 7 | Headlines are fine at 360 px. The network map is washed out and its pins are about 20 px. |
| Motion quality | 7 | Springs feel right and the map→QR blur swap is clean. Hop arcs leave the map window. The network ring stays a solid disc before opening. |
| Variety | 7 | Map, QR, pill, map, card, logo. |
| Brand accuracy | 8 | Real screenshots at ≤ 100 %, exactly #FF5B00, Arista Light, DM Sans numerals, real fox lockup. |
| Sound sync | — | Not built yet. |
| Points vs stamps clarity | 7 | Orange pill vs black card is clear. The "spend anywhere" beat is weak. |

### Three worst problems, and the fixes

1. **The network scene doesn't sell "spend anywhere".**
   - The real map now shows at 1:1, toned grey (`grayscale` + light cream veil). This also removes the blue sea and purple POI labels from the palette.
   - Each venue comes back in **full colour** inside a circle, one per beat.
   - The hop arc is lowered (150 px factor) so it stays inside the window.
   - The dot is solid with th = r, so it opens into a ring the moment it lands.
2. **The hook is slow.**
   - The pop is now Ø220 at f = 4.2 Hz.
   - The cursor leaves at 0.14 s and "Her" is readable by about 0.33 s.
   - The hook exits faster (f = 4.5, 25 ms stagger), the window enters at 2.10 s, and "Ziyaret Et." at 2.16 s.
3. **Two near-dead beats, and a muddy colour morph.**
   - Beat 18 (8.5 s): the network map now rises while Kazan exits.
   - Beat 39 (19.0 s): "şimdi." gets an orange colour wipe on the beat.
   - The orange↔black colour springs went from 3 to 6 Hz, so the brown middle lasts about 3 frames.

### Also fixed in round 1

- A thin cream slit appeared on the stamp card at 11.2–11.5 s, and a lingering dot on the QR fill at 5.7–5.9 s.
  - Cause: the evenodd hole never fully closed, because the springs approach th = h/2 asymptotically.
  - Fix: the hole is now dropped once it's under 1.5 px. The QR fill aims past centre (th 340), and the card closes its ring fast (f 6) while it's still near-square.
- Composition rebalanced: pill y 860 → 940, card y 1080 → 1110 and 900×600, stamps Ø124.

**Loop check** (`render.mjs loop`): frame 0 vs frame 1199 gives `differingValues: 0`. **IDENTICAL.**

---

## Round 2: after fixes, with sound

| Criterion | Score | Notes |
|---|---|---|
| Hook in first 2 s | 8 | Ø220 pop on the downbeat. The cursor writes "Her" by 0.33 s, then one word per beat, and "dönsün" swings back from the right with the orange period. Kick on all 4 beats. |
| Readability on a phone | 8 | Headlines at 104–210 px are 35–70 px on a 360 px phone. The supporting line is 19 px. The real activity row is small (real UI at 1:1, about 13 px), so it's proof texture, not the message. |
| Motion quality | 8 | Clean shape continuity. No slit or dot artefacts. UI overshoot ≤ 2.8 %, type critically damped, 4-subframe 180° motion blur. |
| Variety | 8 | Six distinct shape states plus three real screens. Grey/colour map, black card and logo build each look different. |
| Brand accuracy | 9 | All app UI is real pixels. The only treatment is the grey tone on the network map. |
| Sound sync | 8 | Every SFX is sample-accurate from the cue table in `index.html`. Kicks sit on every beat line, and 38/40 beats have a detected onset (the misses are t = 0, a detector edge, and the beat-40 swell). |
| Points vs stamps clarity | 8 | Points stay orange throughout: pill 105 → 155, dot hopping across venues. Stamps are black/cream with no orange. The payoff drink resolves the harmony to D. |

**Result: every score is 8+.** Proceeding to the full render.

Audio: −14.00 LUFS integrated, −4.3 dBTP true peak, loop rendered circularly.

### Final render (`out/final.mp4`)

**File:**
- 1080×1920, 60 fps, 1200 frames, H.264 yuv420p, BT.709, CRF 16, about 2.6 Mb/s.
- Audio is AAC 256k at 48 kHz.
- Measured from the file: −14.0 LUFS integrated, −4.2 dBFS peak.

**Render:** 4 subframes across a 180° shutter, averaged exactly in integer space. Frames are piped straight into ffmpeg (only 4 GB of disk free, so no PNG sequence). Takes about 35 s.

**Loop:**
- At the render level, frame 0 and frame 1199 are **bit-identical**.
- In the encode, both are forced IDR frames with `qcomp=1:mbtree=0`. A residual of at most 14 levels remains inside a 42×32 px box around the 28 px seed dot. That's x264's first-frame rate control and isn't visible.

Contact sheet and 360 px phone sheet pulled from the MP4: `review/final/sheet_from_mp4.png`, `review/final/phone_sheet.png`.

### Accepted, not fixed (and why)

- **The map (scene 2) shows blue sea and purple POI labels.** It's the real app UI. Toning scene 2 grey too would kill the colour contrast that the network scene relies on.
- **The Loccard on the QR screen has a dark brown gradient.** It's real UI, so I left it untouched.
- **Both store badges are English.** The Turkish App Store badge host was unreachable from this machine. Drop `assets/badges/app-store-tr.svg` in to switch both badges to Turkish automatically.

## Fox clip key poses (2026-10-20)
- v1 sheet: the badge covered the fox's ears; the fox floated too high mid-film and crouched too deep before the hero; the `!` was too small; the paws looked like goggles and covered the eyes. All fixed.
- The RU end line overflowed the frame (wider than 1080 px). Added wrapping at 860 px, then moved the cup up so two lines fit above the fox.
- The badge squash was too strong (stretched into an oval). Reduced from 0.6 to 0.25.
