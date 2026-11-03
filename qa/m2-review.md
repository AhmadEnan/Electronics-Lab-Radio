# M2 wiring and coil refinement verification

Scope: M2 physical wiring clarity and an interactive wiring guide matching M1’s teaching approach. No publication or physical bench validation performed.

- Shared plan: `src/m2-circuit.js` supplies the 3D geometry, SVG board map, component references, terminal descriptions, occupied holes, nodes and jumpers.
- 52 browser checks passed, zero runtime errors. Includes all eight steps, scrubbing, individual component selection, connected-lead emphasis, transistor E/B/C labels, keyboard map selection, retained selection between 2D and 3D, node tracing, coil gap/blue colour, as-wound restoration, calculation/readout and record persistence checks, five widths (390–1920 px), internally scrolling enlargement, and M1 loading plus wiring controls.
- Connection checks passed across 19 components and 15 jumpers: no conflicting strip assignments or occupied-hole collisions. Independent assertions check protection order, feedback resistor destinations, diode band direction, LEVEL/OUT separation, link destinations and Q1-base/Q2-collector row separation.
- Existing M1 numerical physics checks passed. This is focused verification, not a repository-wide release audit.
- Captures inspected: `m2-desktop.png`, `m2-transistor.png`, `m2-link.png`, `m2-mobile.png`, `m2-wiring.png`, `m2-wiring-mobile.png`. Earlier captures were replaced after correcting lost selection during panel resizing and improving the coil viewing angle.
- Default L1/L2 view deliberately separates the copper primary and blue secondary along the former for explanation. As wound restores actual overlap over the grounded end; display notes and build instructions say so explicitly.
- The detector ran in degraded regex mode with no findings; computed contrast was not assessed by that tool.
- No measured gain, RF stability or reception is established by this software verification. Team measurements remain unfilled.
