import assert from 'node:assert/strict';
import {COMPONENTS,JUMPERS,component} from '../src/m2-circuit.js';

// A five-hole strip must never be assigned two different electrical nodes.
const strips=new Map(),occupied=new Map();
function add(p,node,source){
 if(!p)return;
 const strip=p.rail||`${p.row}-${p.col<5?'a-e':'f-j'}`;
 assert(!strips.has(strip)||strips.get(strip)===node,`${source}: ${strip} shorts ${strips.get(strip)} to ${node}`);
 strips.set(strip,node);
 if(!p.rail){const hole=`${p.row}-${p.col}`;assert(!occupied.has(hole),`${source} reuses occupied hole ${hole}: ${occupied.get(hole)}`);occupied.set(hole,source);}
}
for(const c of COMPONENTS)for(const t of c.terminals)add(t.p,t.node,c.ref+' '+t.name);
for(const [node,a,b] of JUMPERS){add(a,node,'jumper start');add(b,node,'jumper end');}
const nodes=id=>component(id).terminals.map(t=>t.node);
assert.deepEqual(nodes('d1'),['vplus','protected']);
assert.deepEqual(nodes('r0'),['protected','vr']);
assert.deepEqual(nodes('c0'),['vr','gnd']);
assert.deepEqual(nodes('rf1'),['c1','b1']);
assert.deepEqual(nodes('rf2'),['tp2','b2']);
assert.deepEqual(nodes('d2'),['tp2','tp3']);
assert.deepEqual(nodes('cout'),['tp3','out']);
assert.deepEqual(nodes('link'),['in','gnd']);
assert(component('q2').terminals[2].p.row-component('q1').terminals[1].p.row>=10);
assert.equal(COMPONENTS.filter(c=>c.value==='10 nF').length,2);
console.log(`Connection checks passed: ${COMPONENTS.length} components, ${JUMPERS.length} jumpers, no shared-hole collisions or strip shorts.`);
