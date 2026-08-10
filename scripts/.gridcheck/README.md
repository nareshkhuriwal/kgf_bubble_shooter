Support files for `npm run check:grid`.

`grid-drop-check.ts` imports the real `src/utils/gridUtils`, which transitively
imports `react-native` for screen dimensions. This directory holds a stub of
that module plus the compiled output, so the geometry can be verified in plain
Node. Resolution works because Node searches upward from the compiled file, and
finds this `node_modules` before the project's real one.
