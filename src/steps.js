/* Content for the nine-step build. Each step also carries the camera
   framing and the two floating bench notes used by the 3D scene. */

export const STEPS = [
  {
    id: "kit",
    kicker: "KIT CHECK",
    title: "Lay out the two halves.",
    time: "5 min",
    icon: "i-tools",
    dockTitle: "Kit check",
    dockSub: "12 parts · no ICs",
    lede:
      "Put everything on the bench before you cut a single centimetre of wire. The build has two halves: the tank on the pipe, and the detector on the breadboard. They meet at exactly two wires.",
    tasks: [
      "Check the <b>12 m wire spool</b>, the <b>50 mm PVC offcut</b>, and the <b>AM tuning capacitor</b>.",
      "Find the <b>1N60P</b> (glass, black band), the <b>15 kΩ resistor</b>, and the <b>3.3 nF ceramic</b>.",
      "Lay out the breadboard, the five-turn test loop, the scope with its ×10 probe, and the DMM.",
      "Ask your grader which two lugs on the capacitor are the <b>AM section</b> before you solder anything.",
    ],
    warn:
      "The spool is only just long enough. 75 turns on a 50 mm former already use 11.78 m, so every long tail is stolen from the winding.",
    numbers: [
      ["Kit", "12", "parts"],
      ["Silicon", "0", "ICs"],
      ["Supply", "0", "rails"],
    ],
    focus: { part: "coil", name: "75-turn coil", spec: "291.5 µH predicted" },
    camera: { pos: [29, 25, 34], target: [0, 4.2, 0.5] },
    callouts: [
      {
        slot: "tl",
        kicker: "Start here",
        title: "One spool, one chance.",
        body: "0.30 mm enamelled copper. 75 close turns will take almost all of it.",
        anchor: "spool",
      },
      {
        slot: "br",
        kicker: "Two halves",
        title: "Tank left. Detector right.",
        body: "They meet only at TP1 and ground. Everything else stays magnetic.",
        anchor: "tray",
      },
    ],
  },
  {
    id: "wind",
    kicker: "WIND THE COIL",
    title: "Seventy-five turns. No more.",
    time: "35 min",
    icon: "i-coil",
    dockTitle: "Wind the coil",
    dockSub: "75 T · 25 mm",
    lede:
      "This is the only part of M1 you cannot rush. Count in tens, keep every turn touching its neighbour, and leave two short tails. The winding length sets the inductance.",
    tasks: [
      "Tape the wire to the pipe, then wind <b>75 turns</b> over a <b>25 mm</b> band. Count in groups of ten.",
      "Keep the turns <b>close-wound</b>: no gaps, no overlaps and no crossed wire.",
      "Anchor the finish with tape and check the count before trimming anything.",
      "Strip about <b>1 cm</b> of enamel from each tail until the copper shines.",
    ],
    warn:
      "Do not stretch the finished coil. Tension while winding is fine; pulling afterwards can crack the enamel and loosen the winding.",
    numbers: [
      ["Turns", "75", "exact"],
      ["Wire", "11.78", "m"],
      ["Length", "25", "mm"],
    ],
    focus: { part: "coil", name: "Copper winding", spec: "0.30 mm · 75 turns · 25 mm" },
    camera: { pos: [2, 10, 16], target: [-7.4, 4.5, -1] },
    callouts: [
      {
        slot: "tl",
        kicker: "The winding",
        title: "75 turns, counted.",
        body: "A 0.30 mm wire gives 75 turns in about 25 mm. Keep the band tight.",
        anchor: "coil",
      },
      {
        slot: "br",
        kicker: "The budget",
        title: "11.78 m of 12 m.",
        body: "Two 8 cm tails leave very little spare. Do not add a long leader.",
        anchor: "coil",
      },
    ],
  },
  {
    id: "capacitor",
    kicker: "FIT THE CAPACITOR",
    title: "Mount the dial.",
    time: "15 min",
    icon: "i-capacitor",
    dockTitle: "Fit capacitor",
    dockSub: "20–280 pF · AM pair",
    lede:
      "The capacitor is the other half of the tank. Tape its frame — never its shaft — to the pipe, with the lugs toward the coil and the dial reachable by a finger.",
    tasks: [
      "Confirm the <b>AM lug pair</b> with your grader, then check it in capacitance mode: the reading must sweep roughly <b>20 → 280 pF</b>.",
      "Tape or glue the <b>frame</b> to the pipe. Leave the shaft and dial completely free.",
      "Point the lugs toward the coil so both tails can reach without stretching.",
      "Turn the shaft through its full travel once. Nothing should rub, short or pull.",
    ],
    warn:
      "The frame is thin plastic and soft metal. A long soldering dwell will melt it or shift the plates. Tin separately, then make one quick joint — or ask before soldering.",
    numbers: [
      ["Range", "20–280", "pF"],
      ["Lugs", "AM", "verify pair"],
      ["Mount", "tape", "frame only"],
    ],
    focus: { part: "capacitor", name: "AM tuning capacitor", spec: "20–280 pF · verify AM pair" },
    camera: { pos: [0.5, 12, 16], target: [-7.4, 7.2, -0.4] },
    callouts: [
      {
        slot: "tl",
        kicker: "The dial",
        title: "Find the AM pair.",
        body: "One pair sweeps 20–280 pF. The others are the FM or trimmer section.",
        anchor: "capKnob",
      },
      {
        slot: "br",
        kicker: "The mount",
        title: "Tape the frame, not the shaft.",
        body: "The shaft must turn freely through the whole band. Keep the lugs accessible.",
        anchor: "capFrame",
      },
    ],
  },
  {
    id: "tank",
    kicker: "FORM THE TANK",
    title: "Close the loop.",
    time: "10 min",
    icon: "i-schematic",
    dockTitle: "Form the tank",
    dockSub: "TP1 · ground",
    lede:
      "Solder one coil tail to each AM lug. The coil and capacitor are now in parallel: one node at the top (TP1), one at the bottom (ground). Polarity does not matter.",
    tasks: [
      "Solder or twist one <b>coil tail</b> to each of the two AM lugs. Either tail can go to either lug.",
      "Keep both leads <b>short</b> and tape them to the pipe so they cannot flex.",
      "Label the top node <b>TP1</b> and the bottom node <b>GND</b>.",
      "Check each tail-to-lug joint. The assembled tank reads the coil’s low DC resistance; isolate one capacitor lug to test it separately.",
    ],
    warn:
      "Long leads add stray inductance and capacitance, and hand capacitance will move the peak. Keep the tank compact and rigid.",
    numbers: [
      ["L", "291.5", "µH"],
      ["C @ 819", "130", "pF"],
      ["Top", "TP1", "node"],
    ],
    focus: { part: "capacitor", name: "Parallel tank", spec: "L ∥ C · TP1 to ground" },
    camera: { pos: [10, 13, 21], target: [-6.4, 5.4, -0.6] },
    callouts: [
      {
        slot: "tl",
        kicker: "Top node",
        title: "TP1 is born.",
        body: "Coil top and one AM lug. This is the high-impedance node you will probe.",
        anchor: "tankTop",
      },
      {
        slot: "br",
        kicker: "Bottom node",
        title: "Ground is the other half.",
        body: "Coil bottom and the second AM lug. The tank is now a closed parallel circuit.",
        anchor: "tankBottom",
      },
    ],
  },
  {
    id: "detector",
    kicker: "BUILD THE DETECTOR",
    title: "Install the one-way door.",
    time: "20 min",
    icon: "i-diode",
    dockTitle: "Install detector",
    dockSub: "1N60P · 15 kΩ · 3.3 nF",
    lede:
      "On the breadboard, the diode runs from TP1 to TP3 with its black band facing TP3. The 15 kΩ resistor and the 3.3 nF capacitor sit in parallel from TP3 to ground.",
    tasks: [
      "Insert the <b>1N60P</b> between strips 9 and 17 on the a–e half. Its band faces <b>TP3</b> at strip 17.",
      "Bridge a–e to f–j with the resistor at strip 17 and the capacitor at strip 25. Link their a–e ends together for <b>TP3</b>; jumper both f–j ends to the blue <b>ground rail</b>.",
      "Check the band again: cathode (band) → TP3, anode (no band) → TP1.",
      "Diode-test it: about <b>0.2–0.3 V</b> one way, open the other, red lead on the anode.",
    ],
    warn:
      "A reversed diode can still rectify, but gives a negative output at TP3. The black band must face TP3, away from the tank.",
    numbers: [
      ["Diode", "1N60P", "detector"],
      ["τ", "49.5", "µs"],
      ["Band", "→ TP3", "cathode"],
    ],
    focus: { part: "diode", name: "1N60P detector", spec: "band → TP3 · ≈0.25 V drop" },
    camera: { pos: [14, 12, 17], target: [4.6, 2.2, 1.0] },
    callouts: [
      {
        slot: "tl",
        kicker: "Direction",
        title: "The band is the cathode.",
        body: "Black band toward TP3. The unbanded anode faces the tank at TP1.",
        anchor: "diodeBand",
      },
      {
        slot: "br",
        kicker: "The load",
        title: "One leak, one bucket.",
        body: "15 kΩ × 3.3 nF = 49.5 µs. Both parts run from TP3 to ground, in parallel.",
        anchor: "load",
      },
    ],
  },
  {
    id: "connect",
    kicker: "JOIN THE HALVES",
    title: "Tank to detector.",
    time: "10 min",
    icon: "i-board",
    dockTitle: "Join the halves",
    dockSub: "TP1 + GND",
    lede:
      "Run exactly two links: tank top to TP1, tank bottom to the breadboard ground rail. There is no power wire and no third connection.",
    tasks: [
      "Connect the tank's <b>TP1</b> node to the breadboard's TP1 node — the diode anode side.",
      "Connect the tank's <b>ground</b> to the breadboard's <b>ground rail</b>.",
      "Keep the leads short and route them away from the coil. Tape them down.",
      "Check the three nodes against the wiring map. With the RC load and coil connected, TP1 to TP3 also has a path through ground and 15 kΩ; isolate a diode lead for its diode test.",
    ],
    warn:
      "TP1 and TP3 are different nodes. Their only bridge is the 1N60P. A stray jumper across the breadboard centre channel will destroy the detector.",
    numbers: [
      ["Links", "2", "only"],
      ["TP1", "anode", "side"],
      ["GND", "rail", "return"],
    ],
    focus: { part: "board", name: "TP1 / ground links", spec: "two wires · no third connection" },
    camera: { pos: [16, 15, 24], target: [0.8, 3.4, 0.6] },
    callouts: [
      {
        slot: "tl",
        kicker: "Signal link",
        title: "TP1 meets TP1.",
        body: "Tank top to diode anode. This is the only path the RF takes into the detector.",
        anchor: "tp1",
      },
      {
        slot: "br",
        kicker: "Return link",
        title: "Ground is the way back.",
        body: "Tank bottom to the breadboard ground rail. Both the resistor and capacitor return here.",
        anchor: "groundRail",
      },
    ],
  },
  {
    id: "loop",
    kicker: "ADD THE TEST LOOP",
    title: "Bring in the field.",
    time: "10 min",
    icon: "i-loop",
    dockTitle: "Add test loop",
    dockSub: "5 T · magnetic only",
    lede:
      "The generator drives a five-turn loop, not the tank. Put the loop on the same axis as the coil, 3–5 cm away, and leave both loop terminals isolated from the tank.",
    tasks: [
      "Stand the <b>five-turn loop</b> coaxially with the coil, about <b>3–5 cm</b> from its end.",
      "Connect the loop only to the <b>generator output</b>. Never to the tank.",
      "Set the generator to <b>sine</b>, around <b>819 kHz</b>, and start near 0.5 V.",
      "Rotate or slide the loop for the largest TP1 signal — that is the coupling sweet spot.",
    ],
    warn:
      "There is no electrical connection between loop and tank. Wiring the generator across the tank would load it, detune it and defeat the whole measurement.",
    numbers: [
      ["Turns", "5", "loop"],
      ["Gap", "3–5", "cm"],
      ["Link", "field", "no wire"],
    ],
    focus: { part: "loop", name: "Five-turn test loop", spec: "magnetic coupling only" },
    camera: { pos: [8, 10, 18], target: [-2.4, 4.2, -0.6] },
    callouts: [
      {
        slot: "tl",
        kicker: "Coupling",
        title: "Same axis. No wire.",
        body: "The loop drives a changing field through the coil. A few centimetres is plenty.",
        anchor: "loop",
      },
      {
        slot: "br",
        kicker: "Drive",
        title: "Sine, 819 kHz.",
        body: "The generator is a stand-in transmitter. Its output goes to the loop and nowhere else.",
        anchor: "generator",
      },
    ],
  },
  {
    id: "resonance",
    kicker: "FIND RESONANCE",
    title: "Find the peak.",
    time: "25 min",
    icon: "i-wave",
    dockTitle: "Find resonance",
    dockSub: "TP1 · ×10 probe",
    lede:
      "Set the capacitor to half travel, put the ×10 probe on TP1, and sweep the generator. The tank answers with its largest voltage at one frequency: f₀.",
    tasks: [
      "Set the capacitor to <b>half mechanical travel</b>. Do not hunt for a number yet.",
      "Scope on <b>CH1, DC, ×10</b>. Ground clip to tank ground, hook tip to <b>TP1</b>.",
      "Sweep around 819 kHz and narrow the span until the peak is centred. Record <b>f₀</b>.",
      "Find the two <b>0.707</b> points. Q = f₀ / (f<sub>high</sub> − f<sub>low</sub>).",
    ],
    warn:
      "A ×1 probe adds about 100 pF across the tank — as much as the tuning capacitor. Use ×10 and compensate the probe before you trust any reading.",
    numbers: [
      ["Probe", "×10", "≈10 pF"],
      ["−3 dB", "0.707", "peak"],
      ["Band", "0.56–2.08", "MHz"],
    ],
    focus: { part: "probe", name: "×10 scope probe", spec: "CH1 · DC · TP1" },
    camera: { pos: [13, 11, 18], target: [3.2, 3.0, -0.4] },
    callouts: [
      {
        slot: "tl",
        kicker: "The probe",
        title: "×10, not ×1.",
        body: "Switch and channel both on ×10. Compensate on the scope's 1 kHz output first.",
        anchor: "probeTip",
      },
      {
        slot: "br",
        kicker: "The answer",
        title: "Largest TP1 wins.",
        body: "At resonance the parallel tank is at maximum impedance. That peak is f₀.",
        anchor: "tp1",
      },
    ],
  },
  {
    id: "envelope",
    kicker: "READ THE DETECTOR",
    title: "From RF to DC.",
    time: "20 min",
    icon: "i-dmm",
    dockTitle: "Read detector",
    dockSub: "TP3 · DMM DC",
    lede:
      "Leave the probe on TP1 and put the DMM on TP3, DC volts. As you raise the generator, the detector diode conducts and TP3 follows the peak — minus its drop.",
    tasks: [
      "Keep the generator at <b>f₀</b>. Put the DMM on <b>TP3, DC volts</b> — never AC volts.",
      "Step the source through <b>0.05, 0.1, 0.2, 0.3, 0.5 and 1.0 V</b>. Record TP1 peak and TP3 DC.",
      "Find the <b>dead zone</b>: below roughly 0.2–0.3 V of TP1 peak, TP3 barely moves.",
      "Above it, TP3 tracks TP1 roughly linearly, offset by the diode drop. Fill <b>Table 6</b>.",
    ],
    warn:
      "TP3 is a rectified envelope, not an AC signal. An AC meter reads near zero and tells you nothing. Use DC volts.",
    numbers: [
      ["TP1", "scope", "peak"],
      ["TP3", "DMM", "DC"],
      ["Drop", "0.2–0.3", "V"],
    ],
    focus: { part: "dmm", name: "Digital multimeter", spec: "DC V · TP3 to ground" },
    camera: { pos: [14, 12, 19], target: [5.6, 2.4, 2.2] },
    callouts: [
      {
        slot: "tl",
        kicker: "The output",
        title: "DC volts, not AC.",
        body: "The 3.3 nF holds each positive peak. TP3 sits at a steady DC level for a steady sine.",
        anchor: "tp3",
      },
      {
        slot: "br",
        kicker: "The dead zone",
        title: "Look for the low-level dead zone.",
        body: "At low input the diode conducts weakly. Its apparent dead zone depends on current, loading and the specific part.",
        anchor: "diodeBand",
      },
    ],
  },
];

export const PARTS = {
  coil: {
    tag: "The tank · L",
    title: "75-turn coil",
    spec: "291.5 µH predicted · 0.30 mm wire",
    body:
      "75 close-wound turns on a 50 mm PVC former, about 25 mm long. Wheeler's formula gives 291.5 µH. Every turn matters: one missing turn moves the band, and a loose winding changes the length l.",
    tip: "Count in tens and keep the turns touching. The 12 m spool leaves almost no spare wire.",
  },
  pipe: {
    tag: "The former",
    title: "PVC pipe",
    spec: "50 mm outside diameter · insulating",
    body:
      "An offcut of 50 mm PVC pipe. It sets the coil diameter and gives the capacitor a rigid place to live. PVC is an insulator, so it does not affect the magnetic field.",
    tip: "Keep the pipe dry and clean. Tape the coil tails down so they cannot flex at the joints.",
  },
  capacitor: {
    tag: "The tank · C",
    title: "AM tuning capacitor",
    spec: "20–280 pF · verify AM terminals",
    body:
      "A representative variable tuning capacitor. The AM section sweeps roughly 20–280 pF; the frame may also carry an FM section or a small trimmer. The tank uses one pair of lugs only.",
    tip: "Confirm the AM pair with your grader, then verify the sweep with the DMM's capacitance mode before soldering.",
  },
  diode: {
    tag: "The detector",
    title: "1N60P detector diode",
    spec: "Glass axial body · forward drop depends on current",
    body:
      "A low-forward-voltage detector diode; verify the supplied manufacturer’s datasheet. It conducts on the positive half of the tank waveform and blocks the negative half, charging the 3.3 nF toward the peak. The black band is the cathode.",
    tip: "Band toward TP3. A reversed diode can give negative DC; the required orientation gives positive DC at TP3.",
  },
  resistor: {
    tag: "The load",
    title: "15 kΩ resistor",
    spec: "1/4 W · 5 % · brown-green-orange-gold",
    body:
      "The resistor bleeds the detector capacitor between RF peaks. With 3.3 nF it sets τ = 49.5 µs, long enough to smooth 819 kHz and short enough to follow audio.",
    tip: "It must be in parallel with the 3.3 nF, from TP3 to ground — not in series with the signal.",
  },
  ceramic: {
    tag: "The load",
    title: "3.3 nF ceramic capacitor",
    spec: "332 marking · ceramic disc",
    body:
      "The peak-holding bucket. The diode charges it on each positive peak; the 15 kΩ lets it decay. With the resistor it forms the detector's low-pass load and holds TP3 at the envelope voltage.",
    tip: "Marked 332: 33 × 10² pF = 3.3 nF. Fit it across the 15 kΩ, from TP3 to ground.",
  },
  board: {
    tag: "The bench",
    title: "Breadboard",
    spec: "400 tie points · central channel",
    body:
      "A compact solderless breadboard. Each column half (a–e and f–j) is one node; the centre channel separates the two halves. The long red and blue rails are the power/ground buses.",
    tip: "Use one ground rail for the tank return, the resistor and the capacitor. Keep TP1 and TP3 on different columns.",
  },
  loop: {
    tag: "The source",
    title: "Five-turn test loop",
    spec: "≈6 cm across · magnetic coupling only",
    body:
      "Five turns of insulated wire driven by the generator. It stands on the same axis as the coil, 3–5 cm away, and couples by its changing magnetic field. It is never wired to the tank.",
    tip: "Closer is not always better: too close loads the tank and broadens the peak. Start at 4–5 cm.",
  },
  generator: {
    tag: "The bench",
    title: "Function generator",
    spec: "sine · 0.56–2.1 MHz · up to ≈1 V",
    body:
      "The stand-in transmitter. It drives the five-turn loop with a sine wave. Its amplitude and frequency are the two knobs that matter; it is not a power supply for the detector.",
    tip: "Verify the output on the scope before blaming the tank. Some generators lose amplitude above 1 MHz.",
  },
  scope: {
    tag: "The bench",
    title: "Oscilloscope",
    spec: "CH1 · DC coupling · ×10 probe",
    body:
      "Used to see the RF peak at TP1 and find the −3 dB points. DC coupling keeps the waveform's true position; AC coupling would hide the detector's DC level.",
    tip: "Compensate the probe on the 1 kHz square output. Keep the ground clip short and on tank ground.",
  },
  probe: {
    tag: "The bench",
    title: "×10 oscilloscope probe",
    spec: "≈10 pF · 10:1",
    body:
      "A ×10 probe divides the signal by ten at the scope but presents only about 10 pF to the tank. A ×1 probe presents roughly 100 pF — enough to detune the circuit you are measuring.",
    tip: "Probe switch on ×10 and channel on ×10. If the two disagree, every amplitude is wrong by a decade.",
  },
  dmm: {
    tag: "The bench",
    title: "Digital multimeter",
    spec: "DC volts · 10 MΩ input",
    body:
      "Reads the detector's rectified output at TP3. Use DC volts; AC volts would block the very level you are trying to measure. The 10 MΩ input barely loads the 15 kΩ load.",
    tip: "If TP3 reads high with no signal, short it to ground briefly. The 3.3 nF may simply be holding charge.",
  },
  spool: {
    tag: "The kit",
    title: "Enamelled copper wire",
    spec: "0.30 mm · ≈12 m",
    body:
      "About 12 m of enamelled copper. 75 turns on a 50 mm former use 11.78 m, so the tails must stay short. The enamel is the insulation; scrape it off only where you need electrical contact.",
    tip: "Do not kink the wire. A sharp bend cracks the enamel and creates a hidden open circuit.",
  },
  tray: {
    tag: "The kit",
    title: "Detector parts",
    spec: "1N60P · 15 kΩ · 3.3 nF",
    body:
      "The three non-tuning parts. The diode rectifies, the resistor leaks, and the ceramic capacitor holds the peak. Together they turn the tank's RF envelope into a DC voltage at TP3.",
    tip: "Keep the diode in its bag until the tank is finished. Glass bodies and eager elbows do not mix.",
  },
  tools: {
    tag: "The bench",
    title: "Tape, blade, ruler",
    spec: "for the winding and the mount",
    body:
      "Masking or electrical tape anchors the winding and the capacitor frame. A blade or sandpaper strips enamel. A ruler checks the 25 mm winding length.",
    tip: "Ask before soldering. A quick tinned joint beats a long dwell on plastic.",
  },
  tank: {
    tag: "The tank",
    title: "Parallel LC tank",
    spec: "291.5 µH ∥ 20–280 pF",
    body:
      "At resonance the coil and capacitor exchange energy, their reactances cancel, and the parallel combination presents a high impedance. The voltage across it peaks at f₀ = 1 / 2π√(LC).",
    tip: "The tank has no polarity. Either coil tail can go to either AM lug.",
  },
};
