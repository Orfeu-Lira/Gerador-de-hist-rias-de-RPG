// Deterministic regression tests; no external network or user data.
const assert=require('node:assert/strict');
const rules=require('../public/dice-rules.js');
function sequence(values){
 let index=0;
 return faces=>{
  const value=values[index++];
  assert.ok(value>=1&&value<=faces,'Test die must fit '+faces+' faces');
  return value;
 };
}
function test(name,fn){
 try{fn();console.log('OK '+name)}
 catch(e){console.error('FAIL '+name,e.message);process.exitCode=1}
}
const base={tipo:'dano',lados:8,quantidade:1,extraQuantidade:1,extraLados:6,modificador:4};
test('Normal damage 1d8+1d6+4',()=>{
 const r=rules.rolar(base,sequence([5,3]));
 assert.equal(r.total,12);
 assert.deepEqual(r.valores,[5]);assert.deepEqual(r.adicionais,[3]);
 assert.equal(r.expressao,'1d8 + 1d6 + 4');
});
test('Critical damage doubles both sets of dice, but NOT flat bonuses',()=>{
 const r=rules.rolar({...base,critico:true},sequence([5,7,3,2]));
 assert.deepEqual(r.valores,[5,7]);assert.deepEqual(r.adicionais,[3,2]);
 assert.equal(r.total,21);
 assert.equal(r.expressao,'Crítico: 2d8 + 2d6 + 4');
});
test('Negative modifier is applied once even on critical',()=>{
 const r=rules.rolar({tipo:'dano',lados:6,quantidade:2,modificador:-3,critico:true},sequence([6,5,4,3]));
 assert.equal(r.total,15);
});
test('Damage and healing cannot fall below zero',()=>{
 const dano=rules.rolar({tipo:'dano',lados:4,quantidade:1,modificador:-10},sequence([2]));
 const cura=rules.rolar({tipo:'cura',lados:4,quantidade:1,modificador:-10},sequence([2]));
 assert.equal(dano.total,0);assert.equal(cura.total,0);
 assert.equal(dano.bruto,-8);
});
test('Natural 20 is an attack critical (but damage is not rolled here)',()=>{
 const r=rules.rolar({tipo:'ataque',lados:20,quantidade:1,modificador:7},sequence([20]));
 assert.equal(r.total,27);assert.equal(r.natural,20);assert.equal(r.criticoNatural,true);
});
test('Natural 1 is an automatic attack miss',()=>{
 const r=rules.rolar({tipo:'ataque',lados:20,quantidade:1,modificador:9},sequence([1]));
 assert.equal(r.total,10);assert.equal(r.falhaNatural,true);
});
test('Advantage uses the higher of two d20',()=>{
 const r=rules.rolar({tipo:'ataque',lados:20,quantidade:1,modificador:3,vantagem:'vantagem'},sequence([4,17]));
 assert.equal(r.total,20);assert.equal(r.natural,17);
 assert.deepEqual(r.comparacao,{primeiro:4,segundo:17,escolhido:17});
});
test('Disadvantage uses the lower of two d20',()=>{
 const r=rules.rolar({tipo:'teste',lados:20,quantidade:1,modificador:3,vantagem:'desvantagem'},sequence([18,7]));
 assert.equal(r.total,10);assert.equal(r.criticoNatural,false);
});
test('Natural 20 on a skill check is not automatically a critical hit',()=>{
 const r=rules.rolar({tipo:'teste',lados:20,quantidade:1,modificador:2},sequence([20]));
 assert.equal(r.natural,20);assert.equal(r.criticoNatural,false);
});
test('Free rolls retain negative totals and permit bonus dice',()=>{
 const r=rules.rolar({tipo:'livre',lados:12,quantidade:1,modificador:-15,extraQuantidade:1,extraLados:4},sequence([4,1]));
 assert.equal(r.total,-10);
});
test('Prevent malformed inputs and too many dice',()=>{
 assert.throws(()=>rules.rolar({tipo:'dano',lados:6,quantidade:100,modificador:0}));
 assert.throws(()=>rules.rolar({tipo:'ataque',lados:20,quantidade:2,modificador:0,vantagem:'vantagem'}));
 const limite=rules.rolar({tipo:'dano',lados:8,quantidade:20,extraQuantidade:20,extraLados:6,critico:true,modificador:0},()=>1);
 assert.equal(limite.valores.length+limite.adicionais.length,80);
 assert.throws(()=>rules.rolar({tipo:'dano',lados:8,quantidade:20,extraQuantidade:21,extraLados:6,critico:true,modificador:0}));
 assert.throws(()=>rules.rolar({tipo:'dano',lados:8,quantidade:1,modificador:1.5}));
});
