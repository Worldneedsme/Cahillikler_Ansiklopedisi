# Locca Animations: cloud session setup (instructions for Claude)

You are working in the repo **https://github.com/Worldneedsme/Locca_Animations-** (private, branch `main`). It holds all of Locca's promo animations, sticker assets and a copy of the lemo-opuscar film library. Locca is a Turkish local loyalty app: customers collect **points** or **stamps** at venues and spend them in one wallet (the "Loccard"). Its mascot is a fox.

Do the setup below first, verify it with step 6, then ask the user what to work on. Do not push to `main` unless the user asks.

## 1. System packages (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y git ffmpeg python3 python3-venv python3-pip fonts-noto-color-emoji
```

Node 20+ is required. If `node -v` shows an older version, or Node is missing:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2. Clone

```bash
cd ~ && git clone https://github.com/Worldneedsme/Locca_Animations-.git
cd ~/Locca_Animations-
```

If the session already started inside a checkout of this repo, use that checkout and skip the clone. Below, `REPO` means the repo root.

## 3. lemo-opuscar library

All scripts expect the library at `~/lemo-opuscar`. You can override this with `LIB=...` or `LEMO_OPUSCAR_HOME=...`.

```bash
ln -sfn "$REPO/lemo-opuscar" ~/lemo-opuscar
cd ~/lemo-opuscar
npm install
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt -r requirements-music.txt
```

The instrument sample packs are not in git (about 1.1 GB). Download the four the Locca films use:

```bash
cd ~/lemo-opuscar
for l in freepats vcsl karoryfer vsco2ce; do sh tools/fetch.sh instruments $l; done
```

Some library docs/preview images are missing from this copy. The upstream repo has them: https://github.com/lemomo-ai/lemo-opuscar (MIT). Read `~/lemo-opuscar/README.md`, `DIRECTOR.md` and the chosen style's `DEMO.md` before building a new lemo-opuscar film.

## 4. promo-film dependencies

```bash
cd "$REPO/promo-film"
npm install
npx playwright install --with-deps chromium chrome
```

`tools/render_business.mjs` launches real Google Chrome (`channel: 'chrome'`). HyperFrames needs no install: it is run as `npx hyperframes@0.8.181` (keep that exact version).

## 5. Repo map

| Path | What it is |
|---|---|
| `promo-film/business.html`, `tools/render_business.mjs`, `tools/audio_business.mjs` | 47 s merchant film (final: `out/Locca_Business_A_final.mp4`) |
| `promo-film/index.html`, `tools/render.mjs`, `tools/audio.mjs` | original customer film engine |
| `promo-film/hf/fox-route/` | 52 s fox-route customer film, TR/EN/RU, ElevenLabs voice (HyperFrames) |
| `promo-film/hf/fox-intro/` | 4 s language-select carousel intro |
| `promo-film/hf/scattered-loyalty/` | 8 s "Dağınık sadakat" clip, risograph WebGL look |
| `promo-film/opuscar/locca-planet/` | 15 s low-poly Alanya planet film (lemo-opuscar) |
| `promo-film/opuscar/locca-orbit/` | 16 s satellite "Yörüngeden sokağa" film (lemo-opuscar) |
| `promo-film/opuscar/locca-microgame/` | 41 s "5 saniyede kazan" game-show film (lemo-opuscar) |
| `promo-film/audio/` | scores, SFX, voice-over WAV/MP3 |
| `promo-film/out/` | rendered films |
| `promo-film/review/` | review frames/contact sheets |
| `promo-film/docs/` | storyboards, ElevenLabs scripts (`elevenlabs-voiceover.md`) |
| `promo-film/assets/fox`, `assets/fox-clean` | 17 fox sticker poses |
| `promo-film/assets/business`, `assets/screens` | app screenshots used in films |
| `app-stickers/` | the customer app's assets: splash fox + logo letters, reward fox, QR ears, map pins, Rive onboarding (`rive/*.riv`), icons |
| `sunra/fox-loop/` | fox idle loops (4 s, 12 s) |
| `lemo-opuscar/` | film library (see step 3) |

## 6. Verify the setup

```bash
cd "$REPO/promo-film/opuscar/locca-microgame" && sh build.sh
```

This should produce `locca-microgame_tr.mp4` (1080×1920, ~41 s) in about a minute. If it does, tell the user the setup works.

## 7. Rebuild commands

- **lemo-opuscar films** (planet / orbit / microgame): `sh build.sh` in the project folder. For other languages: `LANG_CODE=en sh build.sh` (microgame has EN/RU strings in `strings.js`, which haven't been reviewed yet).
- **Fox route:**
  1. `node tools/audio_route.mjs`
  2. In `hf/fox-route`, render each language: `npx hyperframes@0.8.181 render --variables '{"lang":"tr"}' -o ../../out/Locca_FoxRoute_story_tr.mp4`
  3. `node tools/vo_route.mjs audio/vo/<lang>/<file>.mp3 <lang>`

  Rendering wipes the voice, so always rerun `vo_route` after a render. Current voice files: `tr/dialogue_v2.mp3`, `en/dialogue.mp3`, `ru/dialogue_v4.mp3`.
- **Scattered loyalty:**
  1. Score: `~/lemo-opuscar/.venv/bin/python tools/score_scattered_riso.py`
  2. Render: `cd hf/scattered-loyalty && npx hyperframes@0.8.181 render -f 60 -q high -w 4 -o ../../out/Locca_Scattered_story_tr.mp4`
  3. Remux the WAV with ffmpeg at -0.7 dB, AAC 256k.
- **Business film:** `node tools/render_business.mjs video --v a --pages 4 --fps 60 --sub 4 --preset slow --crf 16 --out name.mp4`

## 8. Brand and content rules (must follow)

- The brand orange is exactly **#FF5B00**. Never use #FE4E02.
- Screenshots and UI must show the user name **"John Doe"** and **never an email address**.
- A venue gives **points OR a stamp, never both**. The demo venues are Kale Sofrası (+45 points), a second restaurant or coffee shop (+60 points) and Palm & Bean (stamp, 7/8 → 8/8). The Loccard total is 105.
- **Bakeries are not Locca venues**: they don't earn points or stamps. Use restaurants and coffee shops only (older films still show Şeker Fırın; don't reuse it).
- Turkish motto: **"Yereli keşfet, ödülleri kazan"**.
- Use the full-body fox and bold concepts.
- **Avoid sameness:** the user feels the films look and sound alike. Each new piece gets a new sound palette and a new background world. Don't reuse a lemo-opuscar demo's story.
- The music should sit quietly under the voice but stay audible on a phone. Leave 0.6–0.8 s breaths between voice lines, and finish each line before its scene changes. Master to about −14 LUFS with true peak ≤ −1.2 dB.
- Points scenes are orange; stamp scenes are black/cream.
- For new languages, wait until the user approves the Turkish version.

## 9. What is not available here

- **Arista font:** it is on the user's Mac only. Films that use it fall back to another font.
- **ElevenLabs:** new voice lines need the user's account. The voice files already made are in `promo-film/audio`.
- **Raw screenshots and the original song:** these are on the user's Mac (`~/Desktop/App Promo/`). Only the copies in `promo-film/assets` are here.
- **Audio:** you can't hear the mix. Measure loudness with ffmpeg (`loudnorm`/`ebur128`) and ask the user to listen.
