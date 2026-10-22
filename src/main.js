import { STEPS, PARTS } from "./steps.js";
import { RadioScene } from "./scene.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduced =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PART_ICON = {
  coil: "i-coil",
  pipe: "i-ruler",
  capacitor: "i-capacitor",
  diode: "i-diode",
  resistor: "i-resistor",
  ceramic: "i-capacitor",
  board: "i-board",
  loop: "i-loop",
  generator: "i-signal",
  scope: "i-scope",
  probe: "i-probe",
  dmm: "i-dmm",
  spool: "i-coil",
  tray: "i-tools",
  tools: "i-tools",
  tank: "i-schematic",
};

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* file:// or private mode: the guide still works, it just forgets. */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

let scene = null;
let stepIndex = 0;
let tuning = 129.5;
let currentL = 291.5;

/* -------------------------------------------------------------------- scene */
function initScene() {
  const canvas = $("#scene-canvas");
  const loading = $("#stageLoading");
  const error = $("#stageError");
  if (!canvas) return;

  try {
    scene = new RadioScene(canvas, {
      onPart: (id) => openInspector(id),
      onReady: () => {
        loading?.classList.add("is-hidden");
      },
    });
    scene.setStep(stepIndex, { instant: true });
    scene.setTuning(tuning);
  } catch (err) {
    console.error("3D scene failed:", err);
    loading?.classList.add("is-hidden");
    if (error) error.hidden = false;
  }

  const fallback = window.setTimeout(() => {
    if (!scene) {
      loading?.classList.add("is-hidden");
      if (error) error.hidden = false;
    }
  }, 12000);
  window.addEventListener("pagehide", () => clearTimeout(fallback), { once: true });
}

/* --------------------------------------------------------------------- step */
function pad2(n) {
  return String(n).padStart(2, "0");
}

function buildDock() {
  const track = $("#dockTrack");
  if (!track) return;
  track.innerHTML = STEPS.map(
    (s, i) => `
    <button type="button" class="dock-card" role="tab" data-step="${i}" aria-selected="${i === 0}" aria-label="Step ${i + 1}: ${s.dockTitle}">
      <span class="dock-num">${pad2(i + 1)}</span>
      <span class="dock-icon"><svg aria-hidden="true"><use href="#${s.icon}"/></svg></span>
      <span class="dock-copy"><strong>${s.dockTitle}</strong><small>${s.dockSub}</small></span>
    </button>`
  ).join("");

  track.querySelectorAll("[data-step]").forEach((btn) => {
    btn.addEventListener("click", () => setStep(Number(btn.dataset.step)));
  });
}

function renderStep(i, { focusPanel = false } = {}) {
  const step = STEPS[i];
  if (!step) return;

  const num = $("#stepNum");
  const time = $("#stepTime");
  const progress = $("#panelProgress");
  const kicker = $("#stepKicker");
  const title = $("#stepTitle");
  const lede = $("#stepLede");
  const tasks = $("#stepTasks");
  const warn = $("#stepWarn");
  const numbers = $("#stepNumbers");
  const focusName = $("#focusName");
  const focusSpec = $("#focusSpec");
  const focusIcon = $(".focus-icon use");
  const tuneCard = $("#tuneCard");

  if (num) num.textContent = `STEP ${pad2(i + 1)} / ${pad2(STEPS.length)}`;
  if (time) time.textContent = step.time;
  if (progress) progress.style.width = `${((i + 1) / STEPS.length) * 100}%`;
  if (kicker) kicker.textContent = step.kicker;
  if (title) title.textContent = step.title;
  if (lede) lede.textContent = step.lede;
  if (tasks) tasks.innerHTML = step.tasks.map((t) => `<li>${t}</li>`).join("");
  if (warn) {
    const p = warn.querySelector("p");
    if (p) p.innerHTML = step.warn;
    warn.hidden = !step.warn;
  }
  if (numbers) {
    numbers.innerHTML = step.numbers
      .map(
        ([label, value, unit]) =>
          `<div><span>${label}</span><strong>${value}${unit ? ` <small>${unit}</small>` : ""}</strong></div>`
      )
      .join("");
  }
  if (focusName) focusName.textContent = step.focus.name;
  if (focusSpec) focusSpec.textContent = step.focus.spec;
  if (focusIcon) focusIcon.setAttribute("href", `#${PART_ICON[step.focus.part] || step.icon}`);

  if (tuneCard) {
    tuneCard.hidden = step.id !== "resonance";
    if (!tuneCard.hidden) {
      const range = $("#tuneRange");
      if (range) range.value = String(tuning);
      updateTuneReadout();
    }
  }

  const prev = $("#prevStep");
  const next = $("#nextStep");
  if (prev) prev.disabled = i === 0;
  if (next) {
    const span = next.querySelector("span");
    if (span) span.textContent = i === STEPS.length - 1 ? "Finish" : "Next";
  }

  const dots = $("#panelDots");
  if (dots) {
    dots.innerHTML = STEPS.map((_, j) => `<span class="${j === i ? "is-active" : ""}"></span>`).join("");
  }

  $$("#dockTrack [data-step]").forEach((btn, j) => {
    const active = j === i;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  const dockTrack = $("#dockTrack");
  const activeCard = dockTrack?.querySelector(".dock-card.is-active");
  if (dockTrack && activeCard) {
    const target = activeCard.offsetLeft - dockTrack.clientWidth / 2 + activeCard.offsetWidth / 2;
    dockTrack.scrollTo({ left: Math.max(0, target), behavior: reduced ? "auto" : "smooth" });
  }

  const dockCount = $("#dockCount");
  if (dockCount) dockCount.textContent = `${pad2(i + 1)} / ${pad2(STEPS.length)}`;
  const panelScroll = $("#panelScroll");
  if (panelScroll && focusPanel) panelScroll.scrollTop = 0;
  closeInspector();
  let details = $("#componentDetails");
  if (!details) {
    details=document.createElement("div");
    details.id="componentDetails";
    details.className="component-details";
    $("#focusCard")?.after(details);
  }
  const ids = i===0 ? ["spool","pipe","capacitor"] : i<=3 ? ["coil","capacitor"] : i===6 ? ["loop","generator","coil"] : i===7 ? ["scope","probe","capacitor"] : i===8 ? ["dmm","diode","ceramic"] : ["diode","resistor","ceramic","board"];
  details.innerHTML='<span>Inspect in 3D</span>'+ids.map(id=>`<button type="button" data-inspect="${id}">${({ceramic:"3.3 nF",resistor:"15 kΩ",diode:"1N60P"})[id]||id}</button>`).join("");
  details.querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>openInspector(button.dataset.inspect)));
}

function setStep(i, options = {}) {
  const next = clamp(i, 0, STEPS.length - 1);
  const changed = next !== stepIndex;
  stepIndex = next;
  renderStep(next, { focusPanel: changed });
  if (scene) scene.setStep(next, { instant: !!options.instant });
  const pause = $("#pauseAnimation");
  if(pause) {pause.textContent="Pause";pause.setAttribute("aria-pressed","false");}
  tuning=129.5;
  applyTuning(tuning);
  if(scene && !options.instant && !reduced) scene.bench.animation.elapsed=0;
  if(changed) {
    const bench=$("#build");
    if(bench && bench.getBoundingClientRect().top<65) bench.scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});
  }
}

/* ---------------------------------------------------------------- inspector */
function openInspector(id) {
  const part = PARTS[id];
  if (!part) return;
  const inspector = $("#inspector");
  if (!inspector) return;
  $("#inspectorTag").textContent = part.tag;
  $("#inspectorTitle").textContent = part.title;
  $("#inspectorSpec").textContent = part.spec;
  $("#inspectorBody").textContent = part.body;
  $("#inspectorTip").textContent = part.tip;
  inspector.hidden = false;
  scene?.focusPart(id);
  $("#componentDetails")?.after(inspector);
  inspector.scrollIntoView({block:"nearest",behavior:reduced?"auto":"smooth"});
}

function closeInspector() {
  const inspector = $("#inspector");
  if (inspector) inspector.hidden = true;
}

/* -------------------------------------------------------------------- tuning */
function frequencyFor(capPF, L = currentL) {
  return 1 / (2 * Math.PI * Math.sqrt(L * 1e-6 * capPF * 1e-12));
}

function freqParts(f) {
  if (f >= 1e6) return { value: (f / 1e6).toFixed(3), unit: "MHz" };
  return { value: (f / 1e3).toFixed(1), unit: "kHz" };
}

function applyTuning(pF, source = null) {
  tuning = clamp(Number(pF) || 20, 20, 280);
  const panelRange = $("#tuneRange");
  const calcRange = $("#tuneCalcC");
  if (panelRange) panelRange.value = String(tuning);
  if (calcRange) calcRange.value = String(tuning);
  const panelCap = $("#tuneCap");
  if (panelCap) panelCap.textContent = `${formatCap(tuning)} pF`;
  const calcCap = $("#tuneCalcCOut");
  if (calcCap) calcCap.textContent = `${formatCap(tuning)} pF`;

  if (scene) { scene.bench.animation.elapsed=scene.bench.animation.duration; scene.setTuning(tuning); }
  updateTuneReadout();
  updateTuneChart();
}

function formatCap(c) {
  return Number.isInteger(c) ? String(c) : c.toFixed(1);
}

function updateTuneReadout() {
  const f = frequencyFor(tuning);
  const p = freqParts(f);
  const freq = $("#tuneFreq");
  if (freq) freq.textContent = `${p.value} ${p.unit}`;
  const calcFreq = $("#tuneCalcFreq");
  if (calcFreq) calcFreq.innerHTML = `${p.value} <small>${p.unit}</small>`;
  const note = $("#tuneCalcNote");
  if (note) {
    const delta = (f - 819000) / 819000;
    let where = "the 819 kHz test signal is at the peak";
    if (delta > 0.012) where = "the peak sits above the 819 kHz test signal";
    else if (delta < -0.012) where = "the peak sits below the 819 kHz test signal";
    note.textContent = `at ${formatCap(tuning)} pF · ${where}`;
  }
}

function tuneChartGeometry() {
  const svg = $("#tankChart");
  if (!svg) return;
  const x0 = 44;
  const x1 = 384;
  const y0 = 20;
  const y1 = 160;
  const fMin = 0.4e6;
  const fMax = 2.4e6;
  const lx = (f) =>
    x0 + (clamp(f,fMin,fMax)-fMin)/(fMax-fMin)*(x1-x0);

  const f0 = frequencyFor(tuning);
  const Q = 40;
  let d = "";
  for (let i = 0; i <= 260; i++) {
    const f = fMin + ((fMax - fMin) * i) / 260;
    const u = f / f0;
    const mag = 1 / Math.sqrt(1 + Math.pow(Q * (u - 1 / u), 2));
    const x = x0 + (i / 260) * (x1 - x0);
    const y = y1 - mag * (y1 - y0);
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  const curve = $("#tankCurve");
  if (curve) curve.setAttribute("d", d.trim());

  const genX = lx(819000);
  const genU = 819000 / f0;
  const genMag = 1 / Math.sqrt(1 + Math.pow(Q * (genU - 1 / genU), 2));
  const genY = y1 - genMag * (y1 - y0);
  const genLine = $("#genLine");
  if (genLine) {
    genLine.setAttribute("x1", genX);
    genLine.setAttribute("x2", genX);
  }
  const genDot = $("#genDot");
  if (genDot) {
    genDot.setAttribute("cx", genX);
    genDot.setAttribute("cy", genY);
  }
  const genLabel = $("#genLabel");
  if (genLabel) {
    genLabel.setAttribute("x", Math.min(genX + 6, 330));
    genLabel.textContent = "819 kHz";
  }

  const peakX = lx(f0);
  const peakLine = $("#peakLine");
  if (peakLine) {
    peakLine.setAttribute("x1", peakX);
    peakLine.setAttribute("x2", peakX);
  }
  const peakLabel = $("#peakLabel");
  if (peakLabel) {
    peakLabel.setAttribute("x", clamp(peakX, 52, 374));
    peakLabel.textContent = "f₀";
  }
}

function updateTuneChart() {
  tuneChartGeometry();
}

/* ---------------------------------------------------------------- calculators */
function initCalculators() {
  const turns = $("#coilTurns");
  const dia = $("#coilDia");
  const len = $("#coilLen");
  if (!turns || !dia || !len) return;

  const updateCoil = () => {
    const n = Number(turns.value);
    const d = Number(dia.value);
    const l = Number(len.value);
    currentL = (d * d * n * n) / (457 * d + 1016 * l);
    const wire = (n * Math.PI * d) / 1000;
    $("#coilTurnsOut").textContent = String(n);
    $("#coilDiaOut").textContent = `${d} mm`;
    $("#coilLenOut").textContent = `${l} mm`;
    $("#coilL").innerHTML = `${currentL.toFixed(1)} <small>µH</small>`;
    $("#coilWire").innerHTML = `${wire.toFixed(2)} <small>m</small>`;
    $("#coilWork").textContent =
      `L ≈ (${d}² × ${n}²) / (457×${d} + 1016×${l}) = ` +
      `${(d * d * n * n).toLocaleString("en-US")} / ${(457 * d + 1016 * l).toLocaleString("en-US")} = ` +
      `${currentL.toFixed(1)} µH`;
    updateTuneReadout();
    updateTuneChart();
  };
  [turns, dia, len].forEach((el) => el.addEventListener("input", updateCoil));

  const calcRange = $("#tuneCalcC");
  if (calcRange) {
    calcRange.addEventListener("input", () => applyTuning(calcRange.value, "calc"));
  }
  $$(".preset-row button").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTuning(Number(btn.dataset.c), "preset");
      const el = $("#tuneCalcC");
      if (el) el.focus({ preventScroll: true });
    });
  });

  const panelRange = $("#tuneRange");
  if (panelRange) {
    panelRange.addEventListener("input", () => applyTuning(panelRange.value, "panel"));
  }

  updateCoil();
  applyTuning(tuning);
}

/* --------------------------------------------------------------------- tables */
function initTables() {
  const t5Ids = ["t5Low", "t5High", "t5F0", "t5Flow", "t5Fhigh"];
  const saved5 = store.get("radio.t5", {});
  t5Ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (saved5[id] != null) el.value = saved5[id];
    el.addEventListener("input", () => {
      const data = {};
      t5Ids.forEach((k) => {
        const f = document.getElementById(k);
        if (f && f.value !== "") data[k] = f.value;
      });
      store.set("radio.t5", data);
      updateQ();
    });
  });

  function updateQ() {
    const f0 = Number(document.getElementById("t5F0")?.value);
    const flow = Number(document.getElementById("t5Flow")?.value);
    const fhigh = Number(document.getElementById("t5Fhigh")?.value);
    const out = document.getElementById("qResult");
    if (!out) return;
    if (!Number.isFinite(f0) || !Number.isFinite(flow) || !Number.isFinite(fhigh) || fhigh <= flow || f0 <= 0) {
      out.textContent = "—";
      return;
    }
    out.textContent = (f0 / (fhigh - flow)).toFixed(1);
  }
  updateQ();

  const t6 = $$("[data-t6]");
  const saved6 = store.get("radio.t6", {});
  t6.forEach((el) => {
    const key = el.dataset.t6;
    if (saved6[key] != null) el.value = saved6[key];
    el.addEventListener("input", () => {
      const data = {};
      $$("[data-t6]").forEach((f) => {
        if (f.value !== "") data[f.dataset.t6] = f.value;
      });
      store.set("radio.t6", data);
    });
  });

  const reset = $("#resetTables");
  if (reset) {
    reset.addEventListener("click", () => {
      t5Ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      t6.forEach((el) => (el.value = ""));
      store.remove("radio.t5");
      store.remove("radio.t6");
      updateQ();
    });
  }
}

/* ------------------------------------------------------------------ checklist */
function initChecklist() {
  const checks = $$("#kitChecks input[type=checkbox]");
  if (!checks.length) return;
  const saved = store.get("radio.checks", []);
  const set = new Set(Array.isArray(saved) ? saved : []);

  checks.forEach((el) => {
    el.checked = set.has(el.dataset.check);
    el.addEventListener("change", () => {
      const active = checks.filter((c) => c.checked).map((c) => c.dataset.check);
      store.set("radio.checks", active);
      update();
    });
  });

  function update() {
    const count = checks.filter((c) => c.checked).length;
    const strong = $("#kitProgress");
    const bar = $("#kitProgressBar");
    if (strong) strong.textContent = `${count} / ${checks.length}`;
    if (bar) bar.style.width = `${(count / checks.length) * 100}%`;
  }

  const reset = $("#resetChecklist");
  if (reset) {
    reset.addEventListener("click", () => {
      checks.forEach((c) => (c.checked = false));
      store.remove("radio.checks");
      update();
    });
  }
  update();
}

/* ------------------------------------------------------------------ controls */
function initViewbar() {
  const buttons = $$("#viewbar [data-view]");
  let labelsOn = true;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view === "reset") {
        scene?.resetView();
        return;
      }
      if (view === "in" || view === "out") {
        scene?.zoom(view === "in" ? 0.82 : 1.22);
        return;
      }
      if (view === "labels") {
        labelsOn = !labelsOn;
        btn.classList.toggle("is-on", labelsOn);
        btn.setAttribute("aria-pressed", String(labelsOn));
        scene?.setLabels(labelsOn);
        return;
      }
      if (view === "schematic") {
        toggleSchematic(btn);
        return;
      }
      if (view === "signal") {
        const on = !btn.classList.contains("is-on");
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-pressed", String(on));
        scene?.setSignal(on);
      }
    });
  });

  const pop = $("#schematicPop");
  const close = $("#closeSchematic");
  close?.addEventListener("click", () => {
    if (pop) pop.hidden = true;
    const btn = $('[data-view="schematic"]');
    btn?.classList.remove("is-on");
    btn?.setAttribute("aria-pressed", "false");
  });

  document.addEventListener("click", (e) => {
    if (!pop || pop.hidden) return;
    if (pop.contains(e.target)) return;
    if (e.target.closest?.('[data-view="schematic"]')) return;
    pop.hidden = true;
    const btn = $('[data-view="schematic"]');
    btn?.classList.remove("is-on");
    btn?.setAttribute("aria-pressed", "false");
  });

  function toggleSchematic(btn) {
    if (!pop) return;
    const willOpen = pop.hidden;
    pop.hidden = !willOpen;
    btn.classList.toggle("is-on", willOpen);
    btn.setAttribute("aria-pressed", String(willOpen));
    if (willOpen) closeInspector();
  }
}

/* ---------------------------------------------------------------------- nav */
function initNav() {
  const toggle = $(".nav-toggle");
  const menu = $("#mainnav-mobile");
  toggle?.addEventListener("click", () => {
    const open = !toggle.getAttribute("aria-expanded") || toggle.getAttribute("aria-expanded") === "false";
    toggle.setAttribute("aria-expanded", String(open));
    if (menu) menu.hidden = !open;
  });
  $$("#mainnav-mobile a").forEach((a) =>
    a.addEventListener("click", () => {
      if (menu) menu.hidden = true;
      toggle?.setAttribute("aria-expanded", "false");
    })
  );

  const ids = ["build", "circuit", "math", "bench", "kit"];
  const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
  let queued = false;

  const update = () => {
    queued = false;
    const probe = window.scrollY + 150;
    let active = "build";
    for (const s of sections) {
      if (s.offsetTop <= probe) active = s.id;
    }
    if (active === "build-notes" || active === "trouble") active = "bench";
    $$(".mainnav a, .rail-btn").forEach((a) => {
      const href = a.getAttribute("href");
      a.classList.toggle("is-active", href === `#${active}`);
    });
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

/* --------------------------------------------------------------------- root */
function init() {
  const annotations=$("#callouts");
  $("#stepTasks")?.parentElement.after(annotations);
  buildDock();
  initCalculators();
  initTables();
  initChecklist();
  initViewbar();
  initNav();

  $("#replayAnimation")?.addEventListener("click",()=>setStep(stepIndex));
  $("#pauseAnimation")?.addEventListener("click",()=>{
    const paused=scene?.togglePause() || false;
    $("#pauseAnimation").textContent=paused?"Resume":"Pause";
    $("#pauseAnimation").setAttribute("aria-pressed",String(paused));
  });
  $("#dockTrack")?.addEventListener("keydown",(e)=>{
    if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key)) return;
    e.preventDefault();
    const i=e.key==="Home"?0:e.key==="End"?STEPS.length-1:clamp(stepIndex+(e.key==="ArrowRight"?1:-1),0,STEPS.length-1);
    setStep(i); $("#dockTrack [data-step='"+i+"']")?.focus();
  });
  $("#prevStep")?.addEventListener("click", () => setStep(stepIndex - 1));
  $("#nextStep")?.addEventListener("click", () => {
    if (stepIndex >= STEPS.length - 1) {
      document.getElementById("circuit")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    } else {
      setStep(stepIndex + 1);
    }
  });
  $("#focusOpen")?.addEventListener("click", () => openInspector(STEPS[stepIndex].focus.part));
  $("#closeInspector")?.addEventListener("click", () => {closeInspector();scene?.resetView();});

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeInspector();
      const pop = $("#schematicPop");
      if (pop) pop.hidden = true;
      const menu = $("#mainnav-mobile");
      if (menu) menu.hidden = true;
      $(".nav-toggle")?.setAttribute("aria-expanded", "false");
      return;
    }
    const tag = (e.target.tagName || "").toLowerCase();
    if (["input", "textarea", "select", "button"].includes(tag)) return;
    const workbench = document.querySelector(".workbench");
    const nearBench = workbench && workbench.getBoundingClientRect().bottom > 80;
    if (!nearBench) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (stepIndex < STEPS.length - 1) setStep(stepIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (stepIndex > 0) setStep(stepIndex - 1);
    }
  });

  const requested=new URLSearchParams(location.search).get('step');
  stepIndex=Math.max(0,STEPS.findIndex(s=>s.id===requested));
  renderStep(stepIndex);
  initScene();

  // A quiet start: the page is useful before WebGL is ready, and the
  // loading plate clears on the first rendered frame.
  const loading = $("#stageLoading");
  if (loading) {
    window.setTimeout(() => {
      if (!scene) loading.classList.add("is-hidden");
    }, 15000);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
