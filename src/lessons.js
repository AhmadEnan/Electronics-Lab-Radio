// M1 follows LAB2, pp. 4–6. Subsequent milestones await their briefs.
export const LESSONS = [
  {
    id: 'wind', scene: 1, name: 'Wind the coil', group: 'Tank',
    title: 'Wind 75 turns on the former.',
    intro: 'The coil and the variable capacitor will select the incoming frequency. Start with a single, even layer of enamelled copper wire.',
    parts: '50 mm PVC pipe · 0.30 mm enamelled copper · tape · abrasive paper',
    steps: [
      'Mark a band approximately 25 mm long on the pipe. Secure the start with tape, leaving a short tail for the capacitor connection.',
      'Wind 75 turns side by side, with no crossings. Count in groups of ten and keep a written tally. Secure the finish before releasing the tension.',
      'Scrape about 10 mm of enamel from each end until clean copper is visible. Leave the insulation on the winding intact.'
    ],
    why: 'More turns increase inductance; spreading the same turns over a longer distance reduces it. The geometry matters as much as the count. Wheeler’s estimate for 75 turns, 50 mm diameter and 25 mm length is 291.5 µH.',
    check: 'Measure resistance between the stripped ends with the coil isolated. Expect a low, finite resistance. An open reading suggests enamel at a contact or a broken wire. This check cannot rule out shorted turns.',
    caution: 'The winding alone needs about 11.78 m of wire, before tails and the wire’s thickness are allowed for. Check the actual spool length before cutting.',
    note: '75 turns · Ø 50 mm · winding length ≈ 25 mm',
    inspect: ['coil', 'pipe'], record: 'Photograph the winding; record turn count, measured diameter, winding length and DC resistance.'
  },
  {
    id: 'capacitor', scene: 2, name: 'Mount the capacitor', group: 'Tank',
    title: 'Identify the AM terminals first.',
    intro: 'The supplied capacitor may have several terminals. The model shows a representative housing; use the AM pair identified for your actual component.',
    parts: 'Variable capacitor, 20–280 pF · tape or glue · capacitance meter if available',
    steps: [
      'Ask the grader to identify the AM terminals. With the capacitor disconnected, check that rotating the shaft changes the capacitance across that pair.',
      'Attach the frame to the pipe with tape or glue. Position the terminals close enough for the coil tails to reach without tension.',
      'Move the shaft through its full travel. Keep adhesive, leads and fingers clear of the moving parts.'
    ],
    why: 'Increasing capacitance lowers the resonant frequency. Half the shaft’s travel does not necessarily mean half the capacitance: the relationship depends on the plate shape.',
    check: 'The frame is secure, the shaft rotates freely and the identified AM pair sweeps approximately 20–280 pF. Subtract or zero the meter leads’ capacitance if your meter supports it.',
    caution: 'Terminal positions in the illustration are not a pinout for your capacitor. Confirm the real part before connecting it.',
    note: 'Representative capacitor housing · verify the actual terminals',
    inspect: ['capacitor', 'coil'], record: 'Photograph the AM terminal pair and record the measured minimum and maximum capacitance.'
  },
  {
    id: 'tank', scene: 3, name: 'Connect the tank', group: 'Tank',
    title: 'Put the coil and capacitor in parallel.',
    intro: 'Both components share the same two nodes. Call one TP1 and the other GND. These labels describe electrical connections, not physical height.',
    parts: 'Wound coil · mounted capacitor · two short connections',
    steps: [
      'Join one stripped coil tail to one AM terminal and the other tail to the second AM terminal. The coil has no required polarity.',
      'Label one joint TP1 and the other GND. These become the signal and return connections to the detector.',
      'Make secure joints using the method agreed with your grader. Support the wires so rotating the dial cannot pull on them.'
    ],
    why: 'Energy exchanges between the coil’s magnetic field and the capacitor’s electric field. Near f₀ = 1 / (2π√LC), their reactive currents cancel and the parallel tank’s impedance is largest. Losses keep the voltage finite.',
    check: 'Trace each node: TP1 must touch one end of both L and C; GND must touch the other ends. A resistance meter reads the coil’s low DC resistance across the assembled tank, which is expected.',
    caution: 'Disconnect one capacitor terminal before measuring its capacitance. Measuring across the assembled LC pair does not isolate C.',
    note: 'L ∥ C · predicted C at 819 kHz ≈ 129.5 pF',
    inspect: ['coil', 'capacitor'], record: 'Save a clear photo of both joints and your inductance and tuning-range predictions.'
  },
  {
    id: 'detector', scene: 4, name: 'Build the detector', group: 'Detector',
    title: 'Keep TP1, TP3 and GND distinct.',
    intro: 'The diode connects TP1 to TP3. The resistor and capacitor each connect TP3 to ground. Use the wiring view to trace the breadboard’s internal connections.',
    parts: '1N60P diode · 15 kΩ resistor · 3.3 nF capacitor (332) · breadboard',
    steps: [
      'Insert the diode from d9 to d17. Put the banded end at d17: this is the cathode, on TP3. The unbanded end at d9 is TP1.',
      'Place the resistor between e17 and g17, across the centre channel. Place the 3.3 nF capacitor between d25 and g25.',
      'Jumper b17 to b25 to join the two TP3 strips. Connect i17 and i25 to the same ground rail. The resistor and capacitor are now in parallel.'
    ],
    why: 'When TP1 rises enough above TP3, the diode conducts and charges the capacitor. Between peaks the diode stops conducting; the capacitor discharges through 15 kΩ. Their time constant is 49.5 µs.',
    check: 'Trace the three nodes in the wiring view. Holes a–e within one numbered strip are connected; f–j form a separate strip. Verify the ground rail’s continuity on your own board.',
    caution: 'Breadboard layouts vary. The listed holes describe this example, while the three-node circuit is the requirement. Isolate a diode lead for a reliable diode test.',
    note: 'Diode band → TP3 · 15 kΩ ∥ 3.3 nF to GND',
    inspect: ['diode', 'resistor', 'ceramic', 'board'], record: 'Photograph the diode band and record the resistance, capacitance and isolated diode-test reading.'
  },
  {
    id: 'connect', scene: 5, name: 'Join tank & detector', group: 'Detector',
    title: 'Make the two connections.',
    intro: 'Connect the tank’s signal node to the diode anode, and its return node to the detector ground rail.',
    parts: 'Completed tank · detector · two short wires',
    steps: [
      'Connect tank TP1 to the strip containing the diode’s unbanded end, strip 9 in this example.',
      'Connect tank GND to the ground rail used by the resistor and capacitor. Verify continuity along the rail rather than assuming it is continuous.',
      'Keep the links short and secure. Trace the full circuit against the schematic before attaching instruments.'
    ],
    why: 'The detector receives the tank voltage between TP1 and GND. A shared return gives both halves the same voltage reference. No separate DC power supply is needed for this passive stage.',
    check: 'TP1 reaches the anode. TP3 reaches the cathode and the top of both load components. GND reaches the other end of both loads and the tank return.',
    caution: 'Do not add a jumper between TP1 and TP3; it would bypass the diode. In-circuit resistance readings can include paths through the coil and load.',
    note: 'Two links: TP1 and GND',
    inspect: ['board', 'diode', 'coil'], record: 'Save an overall wiring photo with the three nodes labelled.'
  },
  {
    id: 'loop', scene: 6, name: 'Couple the test signal', group: 'Measure',
    title: 'Drive the loop, then align the coils.',
    intro: 'The generator drives a separate five-turn test loop. Its changing magnetic field induces a voltage in the 75-turn receiving coil.',
    parts: 'Five-turn test loop · RF-capable generator · oscilloscope and ×10 probe',
    steps: [
      'Connect the generator output and return to the two ends of the test loop. Keep both loop leads separate from the tank.',
      'Place the loop a few centimetres from the receiving coil, with their axes aligned. Start with a sine near 819 kHz and a modest output.',
      'Check the generator’s amplitude convention (Vpp, peak or RMS, and 50 Ω or high-impedance setting). Adjust alignment for a visible TP1 signal; keep the position fixed during a sweep.'
    ],
    why: 'Magnetic coupling transfers the test signal without directly wiring the generator’s output impedance across the tank. Coupling still loads the resonator: moving the loop changes both amplitude and, potentially, bandwidth.',
    check: 'The source reaches the radio band, the two coils share an axis and the loop has no direct wire to TP1. A computer audio output cannot generate the required 0.56–2.1 MHz sine.',
    caution: 'Generator amplitude is not TP1 amplitude. Coil spacing, losses, probe loading and resonance determine the received voltage; measure it.',
    note: '5-turn source loop → magnetic coupling → 75-turn tank',
    inspect: ['loop', 'generator', 'coil'], record: 'Record the source model, output convention, loop diameter, spacing and alignment.'
  },
  {
    id: 'resonance', scene: 7, name: 'Measure resonance', group: 'Measure',
    title: 'Find the peak and its bandwidth.',
    intro: 'Hold the capacitor and coil spacing fixed while sweeping frequency. Use TP1 amplitude to find resonance and the two half-power frequencies.',
    parts: 'Scope on CH1, DC coupling · compensated ×10 probe · generator',
    steps: [
      'Compensate the probe using the scope’s calibration output. Set both the probe and channel to ×10. Connect the tip to TP1 and a short ground lead to GND.',
      'Set the capacitor to half mechanical travel. Sweep the source through the band to find the largest TP1 amplitude; record f₀ and the peak amplitude.',
      'Find f_low and f_high where TP1 amplitude is 0.707 times that peak. Calculate Q = f₀ / (f_high − f_low). Then find resonance at both ends of the capacitor’s travel.'
    ],
    why: 'A narrow response means higher loaded Q. The probe contributes capacitance and resistance, so the measured resonance belongs to the loaded circuit. The signal view lets you compare added probe capacitance.',
    check: 'f_low < f₀ < f_high. Use the same amplitude convention and steady source level throughout. If using TP3 DC, its diode nonlinearity makes the bandwidth estimate approximate.',
    caution: 'Half travel is not guaranteed to tune to 819 kHz. Search the available band. Do not move the loop or touch the tank while measuring the bandwidth.',
    note: '−3 dB = 0.707 × peak amplitude · record Table 5',
    inspect: ['probe', 'scope', 'capacitor'], record: 'Record band limits, f₀, f_low, f_high, loaded Q and a scope image with scales visible.'
  },
  {
    id: 'envelope', scene: 8, name: 'Measure the detector', group: 'Measure',
    title: 'Compare RF peak with DC output.',
    intro: 'At resonance, measure the actual input at TP1 and output at TP3 as you vary the generator level. A steady sine should give a positive, nearly steady detector voltage.',
    parts: 'Scope at TP1 · DMM on DC volts from TP3 to GND',
    steps: [
      'Leave the source at the measured f₀. Put the DMM’s positive lead on TP3 and its common lead on GND.',
      'Use the lab’s six source settings: 0.05, 0.1, 0.2, 0.3, 0.5 and 1 V, within the instrument’s capability. Record its amplitude convention.',
      'At each setting, record TP1 peak on the scope and TP3 DC on the meter. For a centred sine, TP1 peak is Vpp / 2. Plot TP3 DC against measured TP1 peak.'
    ],
    why: 'The detector charges near each positive RF peak and decays between peaks. At 819 kHz the carrier period is about 1.22 µs, much shorter than RC = 49.5 µs. An AM signal instead produces a changing envelope, within the detector’s tracking limits.',
    check: 'With the required diode orientation, TP3 is positive. Look for weak response at low levels and increasing output above it. The diode’s drop is not a universal fixed threshold.',
    caution: 'A small TP3 reading does not prove the tank is mistuned. First check TP1 amplitude, diode orientation, contacts and the RC connections.',
    note: 'TP1: RF peak · TP3: DC mean · record Table 6',
    inspect: ['diode', 'ceramic', 'dmm'], record: 'Record all six TP1/TP3 pairs, low-level behaviour, scope captures and any changes that fixed a fault.'
  }
];

// Deliberately empty: only team-supplied observations belong here.
export const MILESTONE_RECORD = { status: 'Awaiting team observations', difficulties: null, results: null, evidence: [] };
