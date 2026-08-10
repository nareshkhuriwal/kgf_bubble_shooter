# Bubble Kingdom

A bubble-shooter game for Android, built with Expo / React Native, shipped to
Google Play. This file is loaded automatically by Claude Code — it holds the
things that are not obvious from reading the code, and the traps that have
already cost real debugging time.

For the narrative of how the project got here, see [docs/HANDOFF.md](docs/HANDOFF.md).

---

## Identity

| | |
|---|---|
| Package | `com.khuriwalgroup.kgfbubblekingdom` |
| Version | `1.0.4`, versionCode `9` |
| EAS project | `@kgf-mobile-app/bubble-shooter`, id `6765a13c-621d-444e-9428-8d1e3c339141` |
| Repo | `github.com/nareshkhuriwal/kgf_bubble_shooter` (private) |

The app was originally `com.khuriwalgroup.bubblekingdom`. That package is
abandoned — see [Release signing](#release-signing).

---

## Traps

Each of these looks like a bug in a different file than the one that causes it.
They are listed because each one has already burned time.

### 1. The board is an offset hex grid — never shift rows by an odd number

`getBubblePosition()` and `getNeighbors()` in `src/utils/gridUtils.ts` **both
branch on `row % 2`**, because odd rows sit half a bubble diameter to the right
and therefore have a different neighbour offset table.

Moving bubbles by one row inverts the parity of the whole board. That is not a
translation: alternate rows slide sideways by half a diameter and the adjacency
graph is rebuilt under the opposite table. Measured on a four-row board, a
single one-row drop **lost 9 adjacencies, invented 8 that never existed, and
moved bubbles 22px sideways**.

Because `findFloatingBubbles()` walks that same graph, the visible symptom was
bubbles hanging in mid-air with gaps torn through the board — which looks like a
rendering or floating-detection bug, and invites a fix in the wrong file.

`dropGrid()` therefore shifts **two** rows. Run `npm run check:grid` after
touching `dropGrid`, `getNeighbors`, `getBubblePosition` or
`findFloatingBubbles`; it fails if a drop loses or invents a single adjacency.

Also note: `findFloatingBubbles()` seeds only from row 0, so an empty top row
means every bubble on the board counts as floating.

### 2. A match must persist on **both** outcomes

`saveLevel()` is the only code that persists anything. It is reached through
`onMatchEnd`, which fires on victory *and* defeat (defeat reports `stars = 0`,
which banks the high score and score-based coins without unlocking anything).

This used to fire only on victory, so losing silently discarded the score, the
coins and the high score — while the defeat overlay still announced
"NEW RECORD" off the engine's in-memory `highScore`, which dies with the screen.
If you add another way for a match to end, it has to report too.

### 3. The splash artwork is fit to width, not cover-cropped

`HomeScreen` renders `assets/kgf-orbito-splash-master.png` (941×1672) full-bleed.

- `resizeMode="cover"` **mis-scales this asset** — roughly 2× too large, clipping
  the wordmark. The image is sized explicitly instead.
- It is fit to **width** deliberately. The logo lockup spans nearly the whole
  painting, so filling the height slices the wordmark off at 320pt. The vertical
  shortfall is continued with a gradient sampled from the art's own bottom edge
  (`#3e1e45`); on typical handsets the controls cover it.

Both look like redundant complexity. They are not.

### 4. The Expo **web** preview fakes layout bugs below 400pt

The web wrapper renders a **fixed 400×780 container** regardless of viewport,
while `SCREEN_WIDTH` (`Dimensions.get('window')`, capped at `GAME_MAX_WIDTH` in
`src/constants/gameConfig.ts`) reports the *real* viewport. Below 400 the two
disagree, so absolutely-positioned edge elements measure as hanging off-screen —
a `left: 16` chip measured `left: -22` at a 320 viewport.

**This does not happen on a real Android device.** Don't "fix" it. Verify UI at
390×844, not at contrived narrow widths.

### 5. Screenshot the app at its native 400×780

Setting the browser viewport to a target aspect ratio (e.g. 400×711 for 9:16)
makes the frame lookup match an inner container rather than the app root, which
silently slices the HUD off the top and the nav bar off the bottom. Capture at
400×780 and compose afterwards.

---

## Release signing

The **original upload key was lost** in about May 2026 and the Play Console
upload-key reset was never completed — it needs account-owner permission that
the developer working on this does not have.

Rather than wait on that, the app was **relaunched under a new package**,
`com.khuriwalgroup.kgfbubblekingdom`. A new package is a new app to Google Play,
with no previously registered key, so the current keystore becomes the trusted
one from a clean slate. The old package (~2 installs) is abandoned.

| | |
|---|---|
| Keystore | `android/app/bubble-kingdom-release.keystore` (committed) |
| Alias | `a8b41bf21533662dfeb4345901ad001f` |
| SHA-1 | `A6:E7:3D:F2:98:30:B5:63:46:B4:C6:48:8F:B5:67:95:3B:C0:77:F6` |
| Credentials | `android/gradle.properties` (`BUBBLE_KINGDOM_UPLOAD_*`) and EAS secrets |
| Backup | `C:\Users\rohan\keystore-backups\bubble-kingdom\` |

- **Never regenerate this keystore.** `expo prebuild --clean` wipes `android/`,
  including the keystore file and the `BUBBLE_KINGDOM_UPLOAD_*` properties —
  restore both from backup afterwards.
- `eas.json`'s production profile uses `credentialsSource: "local"`, which needs
  a `credentials.json` at the repo root. It is gitignored, so it must be
  recreated on a fresh clone or every cloud build fails before it starts.
- Passwords are currently committed in plaintext in `android/gradle.properties`.
  The repo is private, but this should move to EAS secrets only.

---

## Commands

```bash
npm run web          # Expo web dev server on :8081 — the fastest way to see changes
npm run typecheck    # also what `npm test` runs
npm run check:grid   # asserts a ceiling drop preserves the hex lattice
npm run android:bundle:eas   # EAS cloud build (production profile, .aab)
npm run android:submit:eas   # EAS submit to Play Console
```

There is no unit-test framework. `npm test` is a typecheck. `check:grid` is the
only behavioural test; it compiles the real `gridUtils` and runs it in plain
Node, using the react-native stub in `scripts/.gridcheck/`.

---

## Conventions

- **UI work is done screen by screen**, one screen fully finished before moving
  on, and reported with a summary table of what changed.
- Palette: gold `#FFD700`, crimson `#C0392B` / `#7B0000`, dark castle
  `#050210` → `#2d0d10`.
- `scripts/gen_store_assets.py` still generates the *old* procedural feature
  graphic and will overwrite `assets/feature-graphic.png` if re-run.
- `scripts/test-and-build-android.sh` builds a local `.aab`, but the machine it
  was last used on had only Java 8 and no `ANDROID_HOME`; RN 0.76 needs JDK 17+.
  The EAS cloud path is the verified one.
