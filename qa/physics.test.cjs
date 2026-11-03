const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
  const p=await import('data:text/javascript;base64,'+readFileSync(require('node:path').join(__dirname,'../src/physics.js')).toString('base64'));
  const near=(actual,expected,tol=1e-9)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} ≠ ${expected}`);
  const L=p.inductanceUH();near(L,14062500/48250);
  const C=p.capacitancePF(L,819000);near(p.resonanceHz(L,C),819000,1e-6);
  assert.ok(p.resonanceHz(L,20)>2e6&&p.resonanceHz(L,280)<560000);
  assert.ok(p.resonanceHz(L,C+100)<p.resonanceHz(L,C+10));
  for(const q of [10,40,100]){
    const b=p.bandwidth(819000,q);near(b.high-b.low,819000/q,1e-7);
    near(p.response(b.low,819000,q).magnitude,Math.SQRT1_2);
    near(p.response(b.high,819000,q).magnitude,Math.SQRT1_2);
    near(p.response(819000,819000,q).magnitude,1);
  }
  const zero=p.detectorTrace({amplitude:0});near(zero.mean,0);
  const blocked=p.detectorTrace({amplitude:.1,drop:.25});near(blocked.mean,0);
  const regular=p.detectorTrace({amplitude:.8,drop:.25});
  near(regular.tau,49.5e-6);assert.ok(regular.mean>.53&&regular.mean<.55);
  assert.ok(regular.points.every(v=>v.output>=0&&v.output<=.55000001));
  const highResolution=p.detectorTrace({amplitude:.8,drop:.25,samplesPerCycle:128});
  assert.ok(Math.abs(highResolution.mean-regular.mean)/regular.mean<.002,'Steady detector timestep convergence');
  const shortRC=p.detectorTrace({cNF:.33});assert.ok(shortRC.ripple>regular.ripple,'Shorter RC increases carrier ripple');
  const am=p.detectorTrace({depth:.6});
  const amFine=p.detectorTrace({depth:.6,samplesPerCycle:128});
  assert.ok(Math.abs(amFine.mean-am.mean)/am.mean<.003,'AM timestep convergence');
  assert.ok(am.ripple>.5&&am.points.every(v=>Number.isFinite(v.output+v.envelope)));
  const detuned=p.detectorTrace({f0:1100000,amplitude:.8});assert.ok(detuned.mean<regular.mean);
  console.log(JSON.stringify({status:'passed',checks:'Wheeler estimate, inverse resonance, loading direction, 3 Q bandwidths, zero/threshold limits, RC ripple, steady and AM timestep convergence, detuning',L_uH:L,C_pF:C,mean_V:regular.mean,ripple_V:regular.ripple},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
