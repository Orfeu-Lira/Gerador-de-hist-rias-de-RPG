'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),r=require('./resgate-rpg');
const p={nome:'Herói',dados:{edicao:'narrativa',inventario:[],habilidades:[]},aquisicoes_rpg:{itens:[],habilidades:[]}};
const s=r.progresso({},4),c=[{numero:1,narracao:'Você recebeu uma espada antiga.'},{numero:2,narracao:'Você recebeu uma poção de cura.'},{numero:3,narracao:'A poção de cura foi consumida.'}];
const ev=[{numero:1,tipo:'item',nome:'Espada',descricao:'Espada antiga',acao:'ganho',evidencia:'recebeu uma espada antiga'},{numero:2,tipo:'item',nome:'Poção',descricao:'Poção de cura',acao:'ganho',evidencia:'recebeu uma poção de cura'},{numero:3,tipo:'item',nome:'Poção',acao:'perda',evidencia:'poção de cura foi consumida'}];
test('revisa ganho e perda antes de conceder',()=>{const a={...s,pendentes:r.revisar(s,c,ev)},x=r.aplicar(p,{},a,[],1,'mana');assert.equal(x.aquisicoes.itens.length,1);assert.equal(x.aquisicoes.itens[0].nome,'Espada');assert.equal(x.resultado[1].status,'consumido ou perdido');});
test('não duplica item existente nem ressuscita item consumido registrado',()=>{const a={...s,pendentes:r.revisar(s,c,ev)},x=r.aplicar(p,{},a,[{recursos_evento:['Consumido: Espada']}],1,'mana');assert.equal(x.aquisicoes.itens.length,0);assert.equal(x.resultado[0].status,'já registrado');});
test('evidência inventada não concede recompensa',()=>{assert.equal(r.revisar(s,c,[{...ev[0],evidencia:'trecho que não existe'}]).length,0);});
test('inclui abertura e ignora teste pendente e ajustes',()=>{assert.equal(r.candidatos([{numero:0,papel:'mestre',texto:'Você recebe um mapa.'},{numero:1,papel:'mestre',texto:'Teste',teste:{}},{numero:2,papel:'mestre',tipo:'ajuste',texto:'Ajuste'}]).length,1);});
