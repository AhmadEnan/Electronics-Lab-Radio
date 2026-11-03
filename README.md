# Radio lab notebook — M1 & M2

A static, locally bundled guide to ELEG103 LAB2 Part B (M1, pp. 4–6) and LAB3 Part B (M2, pp. 5–8). Each milestone has eight build steps with assembly, wiring and calculation views. The complete circuit remains below the guide. The team's observations and measurements are deliberately unfilled.

The existing GitHub Pages site is https://ahmadenan.github.io/Electronics-Lab-Radio/. Local edits are not published until pushed to the Pages source branch.

## Run and build

Serve this folder with any static HTTP server, for example `python -m http.server 8080`. Open http://localhost:8080/. `index.html` also runs directly from disk, but HTTP avoids browser font-preload restrictions. All runtime fonts, scripts and geometry dependencies are local.

```sh
npm install
npm run build
npm test
npm run test:browser
```

The browser check uses installed Chrome on Windows by default. Set `CHROME_PATH` for a different Chrome executable. It starts and closes its own temporary loopback server. `NODE_PATH` may point to an existing Playwright installation. The generated `app.js` is committed source output, so deployment does not require Node.

Links retain the existing `?step=wind`, `capacitor`, `tank`, `detector`, `connect`, `loop`, `resonance` and `envelope` identifiers. Browser Back restores the preceding build step. `?debug=1` exposes the scene and signal model for verification; normal visits do not expose this inspection object.

## What owns what

- `src/lessons.js`: build instructions and per-step evidence prompts. M2 content is in `src/m2-lessons.js` and follows LAB3 Part B only.
- `src/main.js`: navigation, accessible controls, part descriptions and state coordination.
- `src/models.js` and `src/lib.js`: physical geometry and materials.
- `src/scene.js`: framing, picking, labels, scrubbing and rendering only when needed. Assembly playback is user initiated; there is no automatic animation.
- `src/wiring.js`: node-highlighted coil/capacitor and breadboard drawings. Enlarge a drawing for small-screen inspection.
- `src/physics.js`: independently testable calculations.
- `src/signals.js`: linked resonance and detector plots, controls and visible assumptions.
- `assets/circuit.svg`: the original circuit, retained with the notebook's colours.

## Capacitor and grounds

The enclosed capacitor model follows the user's supplied product image: approximately 21 × 21 × 17 mm body, threaded brass shaft, four rear trimmers and seven terminal tabs. Positions of the tabs and internal sections are representative. The image does **not** establish a verified AM/common pinout. Instructions, labels and wiring views say to identify the pair on the supplied part. Both coil wires and receiver links use the same two terminal coordinates, checked in browser QA.

The generator's two leads connect only to the separate five-turn loop. Its return is not wired to receiver GND. The LC tank and detector share receiver GND, as in the lab schematic. Real bench instruments can share protective earth internally; the model does not represent instrument grounding internals.

## Numerical model

Wheeler's single-layer estimate uses 75 turns, 50 mm diameter and 25 mm length: 291.4508 µH. The resonator is a normalized second-order parallel response with adjustable loaded Q and added probe capacitance. Probe presets model capacitance only, not their resistance. No generator-to-tank transfer ratio is claimed.

The detector solves a constant-drop peak-hold recurrence at 64 samples per carrier cycle after a settling interval. It includes exponential RC discharge. The AM example applies the complex tank response to the carrier and both 1 kHz sidebands, then detects the resulting waveform. At audio time scale, the graph draws the RF envelope rather than an aliased carrier. It omits nonlinear diode I–V, reverse leakage, junction capacitance, finite source/charging resistance and detector loading of the tank. This is a teaching model, not SPICE or measured results.

## Checks and evidence

`qa/physics.test.cjs` checks resonance inverses, half-power frequencies, loading, detector limits, ripple and numerical convergence at twice the sampling rate. `qa/browser.test.cjs` checks all steps, seven viewport widths, wire endpoints, playback, keyboard use, reduced motion, idle/off-screen rendering, history and no-WebGL fallback. Current results are in `qa/redesign-results.json`; current screenshots use the `redesign-` prefix. Older screenshots and `qa/results.json` predate the redesign.

## Design decisions

The single visual idea is an engineering notebook: the drawing and explanation share a working spread. Warm paper and graphite form the base; copper from the coil is the sole UI accent. Barlow is the reading face and JetBrains Mono identifies measurements and figure numbers. The scale is restrained and fluid; there is no hero or landing-page content. Motion is limited to deliberate assembly playback and camera input, with no off-screen loop or scroll effects.

When the team provides its build history, replace the three empty record entries with dated observations, actual readings and supporting photos. Keep predictions, calculated examples and measured results labelled separately.

## Milestone 2

`m2.html` is the separate M2 tab. It follows LAB3 Part B, pp. 5–8 only: board 1′, protected supply, both collector-feedback 2N3904 stages, six-turn link, detector and Tables 4–7. Part A and supplementary history are outside the guide. The original Figure 3 is cropped from LAB3 p. 6 into `assets/m2-circuit.png`; it is sourced artwork, not a newly generated circuit. All predicted and measured results are labelled separately.

`src/m2-circuit.js` owns the shared component terminals, node colours and jumper plan used by both the 3D bench and live vector map. `src/m2-models.js` owns the full-size, 2.54 mm-pitch board, component geometry and sample row plan. `src/scene.js` accepts optional bench, camera bounds and annotation definitions; M1 keeps its defaults. M2’s 75-turn primary uses a 50 mm former, with six separate insulated link turns. Its board begins over 15 cm from the tank. The capacitor and component packages are representative; the source schematic and verified real-part pinouts remain authoritative. Each component has its own reference/value and selectable terminals. Selection emphasizes that part and its connected nodes while fading unrelated geometry. The node trace also highlights the actual connected breadboard strips.

`src/m2-lab.js` contains the brief’s fixed-rail hand bias and nominal 1/1001 test-divider calculations. The bias calculator omits the detector’s DC load and RF parasitics; it does not claim full-circuit RF gain. Tables 4–7 accept actual results; they save locally when browser storage is available and can be exported as JSON. No team evidence is prefilled.

Build M2 with `npm run build:m2`; the checked-in `m2-app.js` also works from disk. Run its focused browser checks with `npm run test:m2`. `qa/m2-results.json` records lesson navigation, scrubbing, five widths, node highlighting, calculations, saved records and runtime errors. `qa/m2-desktop.png`, `qa/m2-mobile.png`, `qa/m2-link.png` and `qa/m2-transistor.png` are the visual evidence. Local changes require publication before the existing GitHub Pages site updates.

### M2 wiring interaction update

The Wiring view is a live SVG breadboard, with clickable/keyboard-selectable components, section zoom, enlargement and shared node tracing. The part list shows each exact reference and value, plus terminal names, node names and occupied holes. Locate in 3D and Trace on breadboard retain the chosen part between views. Supply bypass capacitors occupy compact lower-strip positions; the connection plan was revised consistently in both views.

L1 uses copper, L2 blue insulation. The default separated teaching view shows an axial gap so both windings are distinct. As wound restores the brief’s six turns over the primary’s grounded end. The explanatory note and unchanged build steps distinguish the display separation from actual construction. The tank return and secondary return share board GND, following Figure 3.

Run `npm run test:m2:connections` for strip-short and occupied-hole checks plus polarity/topology assertions. The latest browser suite reports 52 passing checks including exact part selection, three transistor terminals, 2D/3D handoff, keyboard selection, five responsive widths, enclosed diagram scrolling, coil spacing/colour, as-wound restoration, record persistence and M1 loading/wiring. These are focused software checks, not physical RF validation. `qa/m2-wiring.png` and `qa/m2-wiring-mobile.png` supplement the 3D screenshots.
