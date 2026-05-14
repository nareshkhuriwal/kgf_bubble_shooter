# Bubble Kingdom

Bubble Kingdom is a React Native/Expo casual bubble shooter prepared for Android release as `com.khuriwalgroup`.

## What Changed

- Added 32 levels across 4 worlds: Easy, Medium, Hard, and Expert.
- Added level metadata for difficulty, target score, obstacle rate, moving-row flags, rotating-layout flags, and powerup rate.
- Added obstacle bubble support for stone, locked, ice, hidden, and blocker bubble kinds.
- Added scalable powerups: bomb, rainbow, fire, lightning, freeze, and rocket.
- Added a richer HUD with level progress, combo tier labels, next bubble/powerup preview, coin rewards, score, best score, shots, and pause.
- Added coin, achievement, daily reward, and persistent progress scaffolding.
- Added web-safe audio hooks for shoot, pop, combo, explosion, victory, game over, and button sounds.
- Improved visual treatment for powerup bubbles and obstacles while preserving the existing neon/emoji style.
- Reworked level select into world sections with per-world star progress.

## Architecture

- `src/data/levels.ts` owns world and level progression data.
- `src/systems/powerups.ts` resolves reusable powerup effects.
- `src/systems/rewards.ts` owns daily reward and achievement rules.
- `src/systems/storage.ts` provides guarded persistence.
- `src/systems/audio.ts` provides best-effort audio playback and settings state.
- `src/hooks/useGameEngine.ts` remains the core reducer-driven gameplay engine.

## Notes

- Gameplay was enhanced incrementally rather than rebuilt. The original aiming, shooting, grid snapping, matching, falling-bubble detection, score, star, and overlay flow remain intact.
- Web progress persists with `localStorage`. Native persistence is guarded as a no-op until an AsyncStorage dependency is added.
- Audio currently uses lightweight generated tones on web so the app does not require bundled audio assets.

## Verify

```bash
npx tsc --noEmit
npm run web
```

## Android Play Store Build

The production Android package name is:

```text
com.khuriwalgroup
```

The Play Store app display name is:

```text
Bubble Kingdom
```

Before building locally, create the upload keystore and add the local Gradle signing properties described in [android/PLAYSTORE_SIGNING.md](android/PLAYSTORE_SIGNING.md).

Then run:

```bash
npm run android:bundle
```

This runs TypeScript validation and builds the Play Store Android App Bundle:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

You can also build with EAS:

```bash
npm run android:bundle:eas
```

And submit with EAS after Play Console API setup:

```bash
npm run android:submit:eas
```

## Google Play Deployment Steps

1. Open Google Play Console and create a new app.
2. Set app name to `Bubble Kingdom`.
3. Choose app type `Game`.
4. Choose free or paid.
5. Complete App content: privacy policy, ads declaration, data safety, content rating, target audience, and app access.
6. Go to Production, Testing, or Internal testing and create a release.
7. Upload `android/app/build/outputs/bundle/release/app-release.aab`.
8. Let Play Console validate signing, package name, SDK target, and permissions.
9. Add store listing: short description, full description, screenshots, feature graphic, icon, category, contact email, and privacy policy URL.
10. Roll out first to Internal testing, verify install/gameplay, then promote to Production.

## Details Needed From You

- Google Play app type: free or paid.
- Support email for the store listing.
- Privacy policy URL.
- Whether the game shows ads or uses analytics.
- Store listing text, screenshots, app icon, and feature graphic.
- Whether you want local Gradle signing or EAS-managed signing.
