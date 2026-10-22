# The Tuner — ELEG103 Lab 2B / M1

Live website: https://ahmadenan.github.io/Electronics-Lab-Radio/

This repository is published with GitHub Pages from the root of the `main` branch. Pushing an updated `index.html`, stylesheet, assets, or rebuilt `app.js` publishes the changes automatically.

Open `index.html` directly, or serve this directory with a static HTTP server. All fonts and Three.js assets are local. The source is in `src/`; `app.js` is the browser bundle actually used by the page.

Rebuild after editing JavaScript:

```powershell
npx --yes esbuild src/main.js --bundle --format=iife --outfile=app.js
```

For local development, run `python -m http.server 8080` from this directory. Visit `http://localhost:8080/`. Direct links support `?step=wind`, `capacitor`, `tank`, `detector`, `connect`, `loop`, `resonance`, and `envelope`.

`qa/verify.html` runs focused WebGL geometry and build-state checks and embeds a 390 px mobile preview. Serve it over HTTP. `qa/results.json` and the screenshots record the verification run.

The prescribed circuit follows Part B on pages 4–6 of `assets/LAB2.pdf`. The 50 mm former, 75-turn coil, detector topology, 20–280 pF range, and 49.5 µs RC are represented. The exact capacitor housing and terminal arrangement are not specified in the brief, so the model is representative; identify the supplied AM terminals with the grader. The scope and generator are miniature contextual models, not dimensions for purchasing equipment. Support cradles are illustrative.

Readings illustrate a tank with Q = 40, a fixed 819 kHz source, and a simplified 0.25 V detector drop. They are not a SPICE simulation or lab measurements. Measured Tables 5 and 6 remain blank for the team's actual results.
