import {inductanceUH,resonanceHz,capacitancePF,response,bandwidth,detectorTrace} from './physics.js';
const $=s=>document.querySelector(s);
const ink='#28302e',copper='#a44d29',grid='#d8dcd1',muted='#687162';
const txt=(x,y,t,extra='')=>`<text x="${x}" y="${y}" ${extra}>${t}</text>`;
const line=(x1,y1,x2,y2,color=grid,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
const curve=(points,x,y)=>points.map((p,i)=>`${i?'L':'M'}${x(p).toFixed(2)},${y(p).toFixed(2)}`).join(' ');
const range=(id,label,min,max,step,value,unit)=>`<div class="control"><label for="model-${id}">${label}</label><output id="out-${id}" for="model-${id}">${value} ${unit}</output><input id="model-${id}" data-model="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
const select=(id,label,options,value)=>`<div class="control"><label for="model-${id}">${label}</label><select id="model-${id}" data-model="${id}">${options.map(([v,t])=>`<option value="${v}" ${v==value?'selected':''}>${t}</option>`).join('')}</select></div>`;
const reading=(name,value,unit)=>`<div><small>${name}</small><strong>${value}<span>${unit}</span></strong></div>`;
export class SignalLab {
  constructor(onChange=()=>{}){this.mode='resonance';this.state={c:129.5,frequency:819,q:40,probe:0,amplitude:.8,drop:.25,load:3.3,depth:0};this.onChange=onChange;this.renderControls();}
  get f0(){return resonanceHz(inductanceUH(),this.state.c+this.state.probe);}
  setMode(mode){this.mode=mode;document.querySelectorAll('[data-plot]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.plot===mode));this.renderControls();this.draw();}
  renderControls(){
    const s=this.state;
    $('#signal-controls').innerHTML=this.mode==='resonance'?
      range('c','Tuning capacitance',20,280,.1,s.c,'pF')+range('frequency','Test frequency',400,2400,1,s.frequency,'kHz')+range('q','Assumed loaded Q',10,100,1,s.q,'')+select('probe','Added probe capacitance',[[0,'None · ideal baseline'],[10,'10 pF · typical ×10'],[100,'100 pF · typical ×1']],s.probe)+`<button class="signal-action" data-match>Match C to test frequency →</button><button class="signal-action" data-reset-model>Reset model</button>`:
      range('amplitude','Resonant TP1 peak scale',.05,2,.05,s.amplitude,'V')+range('drop','Assumed diode drop',0,.5,.01,s.drop,'V')+select('load','Detector capacitor',[[.33,'0.33 nF · compare'],[3.3,'3.3 nF · lab value'],[33,'33 nF · compare']],s.load)+select('depth','Signal applied to tank',[[0,'Steady sine'],[.6,'AM · 1 kHz, 60% depth']],s.depth)+`<button class="signal-action" data-resonate>Set tank to resonance →</button><button class="signal-action" data-reset-model>Reset model</button>`;
    $('#signal-controls').querySelectorAll('[data-model]').forEach(el=>el.addEventListener('input',()=>{
      this.state[el.dataset.model]=Number(el.value);this.updateOutputs();this.draw();this.onChange(this.state);
    }));
    $('[data-match]')?.addEventListener('click',()=>{
      const needed=capacitancePF(inductanceUH(),s.frequency*1000)-s.probe;
      s.c=Math.max(20,Math.min(280,needed));this.renderControls();this.draw();this.onChange(s);
      if(needed<20||needed>280)$('#model-equations').insertAdjacentHTML('afterbegin','<p>Matching this frequency needs a capacitance outside 20–280 pF. The control has stopped at the nearest endpoint.</p>');
    });
    $('[data-resonate]')?.addEventListener('click',()=>{s.frequency=this.f0/1000;this.draw();this.onChange(s);});
    $('[data-reset-model]').addEventListener('click',()=>{Object.assign(s,{c:129.5,frequency:819,q:40,probe:0,amplitude:.8,drop:.25,load:3.3,depth:0});this.renderControls();this.draw();this.onChange(s);});
    this.updateOutputs();
  }
  updateOutputs(){const units={c:'pF',frequency:'kHz',q:'',amplitude:'V',drop:'V'};for(const id of Object.keys(units)){const out=$(`#out-${id}`);if(out)out.textContent=`${Number(this.state[id].toFixed(id==='c'?1:id==='frequency'?1:2))} ${units[id]}`;}}
  draw(){if(this.mode==='resonance')this.drawResonance();else this.drawDetector();}
  svg(title,content){
    // SVG coordinates stay stable while labels retain a readable screen size.
    const fontSize=Math.max(13,11.5*680/Math.max(300,$('#plot').clientWidth-12));
    $('#plot').innerHTML=`<svg class="plot-svg" viewBox="0 0 680 295" role="img" aria-label="${title}"><g font-family="Barlow,Arial,sans-serif" font-size="${fontSize}" fill="${muted}">${content}</g></svg>`;
  }
  drawResonance(){
    const s=this.state,f0=this.f0,bw=bandwidth(f0,s.q),baseline=resonanceHz(inductanceUH(),s.c);
    const x=f=>55+(f-400000)/2000000*596,y=a=>234-a*178;
    const freqs=Array.from({length:1001},(_,i)=>400000+i*2000);
    // Add exact peak and half-power points so high Q is not lost to sampling.
    for(const f of [f0,bw.low,bw.high,baseline])if(f>=400000&&f<=2400000)freqs.push(f);
    freqs.sort((a,b)=>a-b);
    let plot=txt(55,22,'Relative TP1 amplitude')+txt(651,22,`L = ${inductanceUH().toFixed(1)} µH`,'text-anchor="end"');
    for(const level of [0,.5,1])plot+=line(55,y(level),651,y(level))+txt(45,y(level)+4,level.toFixed(1),'text-anchor="end"');
    for(const f of [.4,.8,1.2,1.6,2,2.4])plot+=line(x(f*1e6),56,x(f*1e6),234)+txt(x(f*1e6),256,f.toFixed(1),'text-anchor="middle"');
    plot+=txt(651,281,'Frequency / MHz','text-anchor="end"');
    plot+=line(55,y(Math.SQRT1_2),651,y(Math.SQRT1_2),'#a6ad9f','stroke-dasharray="4 5"')+txt(64,y(Math.SQRT1_2)-8,'0.707 / −3 dB');
    if(s.probe)plot+=`<path d="${curve(freqs,f=>x(f),f=>y(response(f,baseline,s.q).magnitude))}" fill="none" stroke="#a6ad9f" stroke-width="2" stroke-dasharray="5 4"/>`;
    plot+=`<path d="${curve(freqs,f=>x(f),f=>y(response(f,f0,s.q).magnitude))}" fill="none" stroke="${copper}" stroke-width="2.5"/>`;
    const f=s.frequency*1000,ratio=response(f,f0,s.q).magnitude;
    plot+=line(x(f),47,x(f),234,ink,'stroke-dasharray="3 4"')+`<circle cx="${x(f)}" cy="${y(ratio)}" r="4" fill="${ink}"/>`;
    plot+=txt(Math.max(110,Math.min(590,x(f))),43,`${s.frequency.toFixed(1)} kHz`,'text-anchor="middle" fill="#28302e"');
    this.svg(`Normalized resonance: peak ${(f0/1000).toFixed(1)} kilohertz, bandwidth ${(bw.width/1000).toFixed(1)} kilohertz; test amplitude ${(ratio*100).toFixed(1)} percent`,plot);
    $('#plot-readout').innerHTML=reading('Resonance f₀',(f0/1000).toFixed(1),'kHz')+reading('Bandwidth',(bw.width/1000).toFixed(1),'kHz')+reading('At test frequency',(ratio*100).toFixed(1),'%');
    $('#model-equations').innerHTML=`<p class="equation">L = d²N² / (457d + 1016l) = ${inductanceUH().toFixed(2)} µH<br>f₀ = 1 / (2π√(L(C + Cprobe)))<br>|H(f)| = [1 + Q²(f/f₀ − f₀/f)²]⁻½</p><p>Half-power points: ${(bw.low/1000).toFixed(2)} and ${(bw.high/1000).toFixed(2)} kHz. Loaded Q is an assumption, not a measurement. Probe presets add capacitance only; their resistive loss, diode loading, coil self-capacitance and coupling changes are not solved. ${s.probe?'The dashed curve is the same tank without added probe capacitance.':''}</p><p>The amplitude is normalized. This does not predict volts from generator output; the coil coupling and source impedance have not been measured.</p>`;
  }
  drawDetector(){
    const s=this.state;
    const result=detectorTrace({carrier:s.frequency*1000,f0:this.f0,q:s.q,amplitude:s.amplitude,drop:s.drop,cNF:s.load,depth:s.depth});
    this.lastTrace=result;
    const maxV=Math.max(.5,s.amplitude*(1+s.depth)*1.12),minV=s.depth?0:-maxV;
    const x=t=>55+t/result.duration*596,y=v=>234-(v-minV)/(maxV-minV)*178;
    const timeUnit=s.depth?'ms':'µs',factor=s.depth?1e3:1e6;
    let plot=txt(55,22,'Voltage / V')+txt(651,22,`${s.frequency.toFixed(1)} kHz`,'text-anchor="end"');
    for(const v of s.depth?[0,maxV/2,maxV]:[-maxV,0,maxV])plot+=line(55,y(v),651,y(v))+txt(45,y(v)+4,v.toFixed(1),'text-anchor="end"');
    for(let i=0;i<=4;i++){const t=i/4*result.duration;plot+=line(x(t),56,x(t),234)+txt(x(t),256,(t*factor).toFixed(s.depth?1:0),'text-anchor="middle"');}
    plot+=txt(651,281,`Time / ${timeUnit}`,'text-anchor="end"');
    const inputKey=s.depth?'envelope':'input';
    plot+=`<path d="${curve(result.points,p=>x(p.t),p=>y(p[inputKey]))}" stroke="#8b9486" fill="none" stroke-width="1.4" ${s.depth?'stroke-dasharray="5 4"':''}/>`;
    plot+=`<path d="${curve(result.points,p=>x(p.t),p=>y(p.output))}" stroke="${copper}" fill="none" stroke-width="2.2"/>`;
    plot+=line(75,39,95,39,'#8b9486','stroke-width="2"')+txt(102,43,s.depth?'TP1 envelope':'TP1 RF');
    plot+=line(258,39,278,39,copper,'stroke-width="2"')+txt(285,43,'TP3 output');
    this.svg(`Detector model. Mean output ${result.mean.toFixed(3)} volts. Time constant ${(result.tau*1e6).toFixed(2)} microseconds.`,plot);
    $('#plot-readout').innerHTML=reading('RC time constant',(result.tau*1e6).toFixed(1),'µs')+reading('TP3 mean',result.mean.toFixed(3),'V')+reading(s.depth?'TP3 swing':'RF ripple',(result.ripple*1000).toFixed(1),'mVpp');
    $('#model-equations').innerHTML=`<p class="equation">τ = 15 kΩ × ${s.load} nF = ${(result.tau*1e6).toFixed(1)} µs<br>Vout[n] = max(0, Vin[n] − Vd,<br>Vout[n−1] × exp(−Δt/τ))</p><p>Resonance settings carry over: C ${s.c.toFixed(1)} pF + ${s.probe} pF, Q ${s.q}, f₀ ${(this.f0/1000).toFixed(1)} kHz. The peak scale is the assumed resonant TP1 carrier amplitude, not generator voltage. ${s.depth?'The carrier and both AM sidebands pass through the complex tank response. The envelope is shown instead of undersampling the RF carrier.':'The graph resolves individual RF cycles and the discharge between peaks.'}</p><p>A constant-drop diode recharges the capacitor instantly from an ideal voltage source. The calculation uses 64 samples per carrier cycle, after settling for at least 12 RC. It omits diode I–V behaviour, junction capacitance, reverse leakage, charging resistance and detector feedback on the tank. Use it to compare trends, not to predict bench readings.</p>`;
  }
}
