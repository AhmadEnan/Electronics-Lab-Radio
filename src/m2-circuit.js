// Shared connection plan for the 3D bench, interactive board and terminal lists.
export const NODES={
 vplus:{name:'V+ / 4.5 V',color:'#ad4337',description:'Cell positive, before reverse-polarity protection.'},
 protected:{name:'After D1',color:'#a35c44',description:'1N5819 cathode to the 220 Ω series resistor.'},
 vr:{name:'VR / filtered rail',color:'#ad4337',description:'After 220 Ω; powers both 2 kΩ collector resistors. Bypassed by 10 µF and 100 nF.'},
 gnd:{name:'GND',color:'#394643',description:'Common board return: emitters, pot low end, link return and capacitor/load returns.'},
 in:{name:'IN / link live',color:'#246b99',description:'Six-turn secondary live lead and gain-pot high end. Not connected directly to TP1.'},
 wiper:{name:'Pot wiper',color:'#367d91',description:'Adjustable share of IN, coupled to Q1 base through C1.'},
 b1:{name:'Q1 base',color:'#367d91',description:'Q1 B, C1 output and RF1. Row 15 a–e.'},
 c1:{name:'Q1 collector',color:'#765c97',description:'Q1 C, RC1, RF1 and interstage capacitor C2. Row 16 a–e.'},
 b2:{name:'Q2 base',color:'#367d91',description:'Q2 B, C2 output and RF2. Row 38 a–e.'},
 tp2:{name:'TP2 / Q2 collector',color:'#a44d29',description:'Amplified RF: Q2 C, RC2, RF2 and D2 anode. Row 39 a–e.'},
 tp3:{name:'TP3 / LEVEL',color:'#37754d',description:'D2 cathode, 15 kΩ, 3.3 nF and the positive side of 1 µF. Measure rise above resting DC.'},
 out:{name:'OUT / audio',color:'#8b681d',description:'After the 1 µF coupling capacitor. To a powered input, not a bare earphone.'},
 tp1:{name:'TP1 / tank top',color:'#a44d29',description:'75-turn primary and tuning capacitor. The secondary is coupled magnetically, not wired to TP1.'}
};
export const hole=(row,col)=>({row,col});
export const rail=(row,ground=false)=>({row,rail:ground?'gnd':'vr'});
export function point(p){return [-7.874+(p.row-1)*.254,.47,p.rail?(p.rail==='gnd'?2.35:-2.35):[-1.4,-1.146,-.892,-.638,-.384,.384,.638,.892,1.146,1.4][p.col]];}
export function location(p){return p.rail?(p.rail==='gnd'?'GND rail':'VR rail'):`${'abcdefghij'[p.col]}${p.row} (strip ${p.row} ${p.col<5?'a–e':'f–j'})`;}
const t=(name,node,p)=>({name,node,p});
export const COMPONENTS=[
 {id:'d1',ref:'D1',value:'1N5819',type:'diode',from:2,section:'Supply',terminals:[t('Anode','vplus',hole(2,0)),t('Cathode · band','protected',hole(5,0))],why:'Blocks reversed cells. The band faces the 220 Ω resistor.'},
 {id:'r0',ref:'R0',value:'220 Ω',type:'resistor',from:2,section:'Supply',terminals:[t('From D1','protected',hole(5,2)),t('To rail','vr',hole(10,2))],bands:[0xb52d23,0xb52d23,0x683e24,0xc8a04f],why:'Filters the supply together with C0 and Cb. VR is after this resistor.'},
 {id:'c0',ref:'C0',value:'10 µF',type:'electrolytic',from:2,section:'Supply',terminals:[t('+','vr',hole(11,7)),t('− · stripe','gnd',hole(12,7))],why:'Supply reservoir. Negative stripe goes to GND.'},
 {id:'cb',ref:'Cb',value:'100 nF',type:'capacitor',from:2,section:'Supply',terminals:[t('Rail','vr',hole(18,7)),t('Return','gnd',hole(19,7))],why:'Nonpolar RF supply bypass. Placed close to the supply entry.'},
 {id:'pot',ref:'P1',value:'1 kΩ pot',type:'pot',from:3,section:'Input',terminals:[t('High','in',hole(6,8)),t('Wiper','wiper',hole(7,8)),t('Low','gnd',hole(8,8))],why:'Outer terminals span IN and GND. Wiper sets RF input to Q1.'},
 {id:'cin',ref:'C1',value:'10 nF',type:'capacitor',from:3,section:'Q1',terminals:[t('From wiper','wiper',hole(7,6)),t('To Q1 B','b1',hole(15,4))],why:'Passes RF from the pot wiper while blocking Q1’s DC base voltage.'},
 {id:'q1',ref:'Q1',value:'2N3904',type:'transistor',from:3,section:'Q1',terminals:[t('E','gnd',hole(14,3)),t('B','b1',hole(15,3)),t('C','c1',hole(16,3))],why:'First common-emitter stage. Flat face towards you, leads down: E–B–C, as in the brief; verify your supplied part.'},
 {id:'rc1',ref:'RC1',value:'2 kΩ',type:'resistor',from:3,section:'Q1',terminals:[t('Collector','c1',hole(16,0)),t('Supply','vr',rail(16))],bands:[0xb52d23,0x151515,0xb52d23,0xc8a04f],why:'Q1 collector load, from VR to Q1 C.'},
 {id:'rf1',ref:'RF1',value:'100 kΩ',type:'resistor',from:3,section:'Q1',terminals:[t('Collector','c1',hole(16,1)),t('Base','b1',hole(15,0))],bands:[0x683e24,0x151515,0xd59d28,0xc8a04f],why:'Collector-to-base feedback bias. It does not go from VR to base.'},
 {id:'c12',ref:'C2',value:'10 nF',type:'capacitor',from:3,section:'Q2',terminals:[t('Q1 C','c1',hole(16,4)),t('Q2 B','b2',hole(38,4))],why:'Couples the first collector to the second base without joining their DC bias voltages.'},
 {id:'q2',ref:'Q2',value:'2N3904',type:'transistor',from:3,section:'Q2',terminals:[t('E','gnd',hole(37,3)),t('B','b2',hole(38,3)),t('C / TP2','tp2',hole(39,3))],why:'Second common-emitter stage. Collector is TP2; probe with ×10 tip here and ground at GND.'},
 {id:'rc2',ref:'RC2',value:'2 kΩ',type:'resistor',from:3,section:'Q2',terminals:[t('Collector','tp2',hole(39,0)),t('Supply','vr',rail(39))],bands:[0xb52d23,0x151515,0xb52d23,0xc8a04f],why:'Q2 collector load from VR to TP2.'},
 {id:'rf2',ref:'RF2',value:'100 kΩ',type:'resistor',from:3,section:'Q2',terminals:[t('Collector','tp2',hole(39,1)),t('Base','b2',hole(38,0))],bands:[0x683e24,0x151515,0xd59d28,0xc8a04f],why:'Q2’s own collector-to-base bias resistor.'},
 {id:'d2',ref:'D2',value:'1N4148',type:'diode',from:4,section:'Detector',terminals:[t('Anode','tp2',hole(39,2)),t('Cathode · band','tp3',hole(45,2))],why:'Detector diode. Band points towards TP3 / LEVEL.'},
 {id:'rl',ref:'RL',value:'15 kΩ',type:'resistor',from:4,section:'Detector',terminals:[t('LEVEL','tp3',hole(45,3)),t('Return','gnd',hole(45,6))],bands:[0x683e24,0x276747,0xd46c26,0xc8a04f],why:'Detector discharge path; parallel with Cd between TP3 and GND.'},
 {id:'cd',ref:'Cd',value:'3.3 nF',type:'capacitor',from:4,section:'Detector',terminals:[t('LEVEL','tp3',hole(48,3)),t('Return','gnd',hole(49,3))],why:'Detector smoothing capacitor, nonpolar. Shares TP3 and GND with 15 kΩ.'},
 {id:'cout',ref:'Co',value:'1 µF',type:'electrolytic',from:4,section:'Output',terminals:[t('+ / LEVEL','tp3',hole(52,1)),t('− / OUT','out',hole(56,1))],why:'Blocks detector DC from OUT. For a ground-referenced external input, + faces LEVEL.'},
 {id:'coil',ref:'L1',value:'75 turns',type:'coil',from:5,section:'Tank',terminals:[t('Tank top','tp1',null),t('Tank return','gnd',null)],why:'Primary tank winding and variable capacitor. No direct wire from TP1 to IN.'},
 {id:'link',ref:'L2',value:'6 turns',type:'coil',from:5,section:'Tank',terminals:[t('Link live','in',hole(3,6)),t('Link return','gnd',rail(3,true))],why:'Blue insulated secondary. Shown axially separated for clarity; use As wound to see its required position over L1’s grounded end. Twist tails to IN and GND.'}
];
export const JUMPERS=[
 ['vr',hole(10,0),rail(10),2],['vr',rail(11),hole(11,5),2],['gnd',hole(12,9),rail(12,true),2],['vr',rail(18),hole(18,5),2],['gnd',hole(19,9),rail(19,true),2],
 ['vr',rail(30),rail(34),2],['gnd',rail(30,true),rail(34,true),2],
 ['in',hole(3,5),hole(6,5),3],['gnd',hole(8,9),rail(8,true),3],['gnd',hole(14,4),rail(14,true),3],['gnd',hole(37,4),rail(37,true),3],
 ['tp3',hole(45,4),hole(48,4),4],['tp3',hole(48,0),hole(52,0),4],['gnd',hole(45,9),rail(45,true),4],['gnd',hole(49,4),rail(49,true),4]
];
export const component=id=>COMPONENTS.find(c=>c.id===id);
export const available=step=>COMPONENTS.filter(c=>c.from<=step);
