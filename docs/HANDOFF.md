# Handoff — August 2026

A record of what was done, why, and what is still open. Written so the work can
be picked up by someone (or some assistant) with no memory of the sessions.

The durable, still-relevant rules extracted from all of this live in
[../CLAUDE.md](../CLAUDE.md). This file is the history and the open items.

---

## 1. The lost upload key, and the relaunch

**The problem.** Google Play had a registered upload key whose private half
nobody had any more. It was lost around May 2026. A replacement keystore was
generated on 25 May and committed on 30 May, but the Play Console side of the
job — *Request upload key reset* — was never completed, so Google still expected
the old key. Any upload signed with the new keystore would have been rejected.

Confirmed by comparing fingerprints directly:

| | SHA-1 |
|---|---|
| Registered with Play | `5E:43:06:C7:34:A0:04:8E:7A:CC:1D:A1:DF:24:AA:48:9F:9C:F6:AF` |
| Keystore in the repo | `A6:E7:3D:F2:98:30:B5:63:46:B4:C6:48:8F:B5:67:95:3B:C0:77:F6` |

**Why it stayed stuck.** The reset needs account-owner permission in Play
Console. App-level "Admin (all permissions)" is not enough — this is one of a
small set of actions Google restricts to the account owner, so that a
compromised admin cannot change which key is trusted. Access here is app-scoped
only.

**The fix.** Relaunch under a **new package**, `com.khuriwalgroup.kgfbubblekingdom`.
A new package is a new app with no previously registered key, so the current
keystore becomes trusted from scratch and no reset is needed. The old package
(~2 installs) is abandoned.

`android/` was regenerated with `expo prebuild --clean` so the package name
propagated into `build.gradle`, `AndroidManifest.xml` and the Kotlin package
path. The keystore and signing properties were restored from backup afterwards,
since prebuild wipes both.

**Verified end to end.** A real EAS production build was run
(`31176ffc-edcc-49a2-8b38-57a24f5d5e2a`) and the resulting APK's signing
certificate was extracted and compared against the local keystore — byte-for-byte
identical. (`keytool` cannot read modern v2/v3 APK signatures; the certificate
was parsed out of the APK Signing Block directly.)

**Also fixed along the way**

- The `BUBBLE_KINGDOM_UPLOAD_KEY_ALIAS` EAS secret was wrong — `bubble-kingdom`
  instead of the keystore's real alias `a8b41bf21533662dfeb4345901ad001f`. Local
  builds would have signed correctly and cloud builds would not.
- `credentials.json` did not exist, despite `eas.json` setting
  `credentialsSource: "local"`. Every cloud build failed before starting. It is
  gitignored, so it must be recreated on a fresh clone.
- `eas.json` built `apk`; Google requires `.aab` for new apps.
- `scripts/test-and-build-android.sh` still checked for pre-rename
  `KGF_ORBITO_*` property names and would have failed with a misleading
  "missing signing properties" error.
- `android.permission.RECORD_AUDIO` was declared but never used anywhere in the
  codebase, and contradicted the app's own privacy policy. Removing it from
  `app.json` was not enough — `expo-av` re-injects it — so it is now listed in
  `blockedPermissions`.

**Account moves.** The EAS project was transferred from Naresh's personal Expo
account into a `kgf-mobile-app` organisation, keeping the same project id and
signing secrets. `app.json`'s `owner` was updated to match.

---

## 2. Home screen rebuild

The old home screen stacked a large logo bitmap, a glory card, three menu cards
and a battle guide inside a `ScrollView`, on top of roughly 340 lines of
procedural SVG scenery (starfield, towers, torch flicker, falling particles).
Content overflowed — the battle guide was clipped off-screen — and the scenery
underneath was almost entirely hidden anyway.

It is now the painted splash artwork full-bleed, with a minimal HUD, one BATTLE
button and a bottom nav. **861 → 365 lines.**

Two non-obvious constraints came out of this and are recorded in CLAUDE.md:
`resizeMode="cover"` mis-scales the artwork, and it is fit to width rather than
cover-cropped so the wordmark survives on narrow handsets.

The navigation previously had **five icons of which three did nothing**. It now
has five that are honest: Castle is the current tab, Map and Treasury work, and
Trophies and Settings report that they are coming soon. There are no Trophies or
Settings screens yet — that is the remaining work behind those two.

`isDailyRewardAvailable()` was added to `src/systems/rewards.ts` so the nav can
show an unclaimed-reward dot without calling `claimDailyReward()`, which claims
as a side effect.

---

## 3. Gameplay bugs

Found by scripting an actual playthrough against the dev server rather than
reading code, then tracing what the engine persisted.

### Losing a match discarded everything

`saveLevel()` was reached only via `onLevelComplete`, which fires solely on
victory. The defeat branch played a sound and nothing else. So a loss threw away
the score, the coins and the high score — while the defeat overlay announced
"🏆 NEW RECORD!" from the engine's in-memory `highScore`, which dies with the
screen. **The game congratulated the player on a record it then deleted.**

Measured before the fix: scored 1935, persisted 0. After: scored 540,
persisted 540.

The two effects are now one that reports on either outcome, and the prop is
named `onMatchEnd` to say so.

### The progress bar was pinned at 0%

It read `1 - bubblesRemaining / initialBubbleCount`, clamped at zero. The ceiling
drop adds rows, so `bubblesRemaining` passes the starting count within a few
shots and the value goes negative for the rest of the match. It now measures
against `peakBubbleCount`, the board's high-water mark.

### Level 1 was close to unwinnable

Winning requires clearing *every* bubble, but the drop interval was a flat 8
shots — so level 1's 36 shots bought four extra rows (~32 bubbles) on top of a
~33 bubble board. An automated run went 33 → 54 bubbles and never dipped below
the starting count.

`shotsPerDrop` is now per-level in `src/data/levels.ts`: **no drop at all for
levels 1–4**, then tightening. The HUD's drop countdown also read the global
constant, so on a drop-free level it counted down and stuck at "1 DROP",
warning of a drop that never came; it now takes the level's value and hides
itself.

> The level 1–4 balance is a judgement call, not something measured against real
> players. It is one line in `levels.ts` if it needs tuning.

### The ceiling drop tore the board apart

Reported as clusters hanging in mid-air with gaps. The cause is geometric and is
documented as trap #1 in CLAUDE.md: a one-row shift inverts the hex grid's
parity. Fixed by shifting two rows, with drop intervals doubled to keep the
pressure unchanged, and guarded by `npm run check:grid`.

**A note on how this was missed.** The first round of gameplay fixes was
declared done after verifying only level 1 — which, after the balance change,
has no ceiling drop at all, so the lattice bug was structurally invisible there.
The report came from level 6. Verify across levels either side of the level 4
boundary.

---

## 4. Store assets

- **Feature graphic** rebuilt from the circular badge art. The previous one was
  procedurally generated and read as a small logo lost on an empty starfield.
- **All 12 screenshots recaptured** from the current build — 4 shots (home,
  gameplay, combo, kingdom map) × phone / 7" / 10". Verified at exact required
  dimensions and under the 8MB cap.
- The old `screenshot_3_powerups` was **never a real capture** — a placeholder
  mockup whose icons rendered as broken-image glyphs, listing power-up names the
  game does not use. Retired, along with `4_worlds`.

These are captured from the Expo **web** build. They are the real UI but not a
real device; pixel-true shots would need an emulator or a phone.

---

## Open items

1. **Push the commits.** Seven were sitting unpushed at the end of the last
   session (`git push origin main`).
2. **Play Console listing** for the new package is partly done: app created,
   category Puzzle, tags set, 9 of 11 content declarations complete. Still to do:
   category + contact details, store listing copy (short 80 chars, full 4000),
   and uploading the assets above.
3. **Privacy policy needs public hosting.** `assets/privacy-policy.html` exists
   but Play Console needs a URL. GitHub Pages is the obvious route.
4. **Build a `.aab` and upload to Internal testing** before production.
5. **Trophies and Settings screens** do not exist; the nav currently says
   "coming soon" for both.
6. **Move signing passwords out of `android/gradle.properties`** into EAS
   secrets only, and scrub them from git history.
7. **Verify gameplay on a real device.** Everything above was verified against
   the Expo web build.
