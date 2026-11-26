'use strict';const test=require('node:test'),a=require('node:assert/strict'),g=require('./grupo-rpg');
const p={id:1,nome:'Mago',dados:{edicao:'2024',classe:'Mago',nivel:1,notas:'privado',atributos:{con:10},inventario:[{nome:'Adaga',tipo:'Arma',quantidade:1}]},aquisicoes_rpg:{}};
test('compartilha apenas campos autorizados',()=>{a.equal(g.ficha(p,{},'mana',false),null);const f=g.ficha(p,{},'mana',true);a.equal(f.pv,6);a.equal(f.mana,10);a.equal(f.inventario[0].nome,'Adaga');a.equal(f.notas,undefined);a.equal(f.id,undefined);});
test('origem limita dados',()=>{const x=g.origem({conteudo:{titulo:'Jornada',trilha:'Mistério',email:'privado'}});a.equal(x.titulo,'Jornada');a.equal(x.trilha,'Mistério');a.equal(x.email,undefined);});
test('abertura e teste pendente sem recompensa',()=>{const x={narracao:'Uma longa cena começa diante do grupo.',resumo:'Começou',conquista:'combate',efeitos:{pv:-3}};a.equal(g.resultado(x,true).conquista,null);a.equal(g.resultado({...x,testePendente:true},false).efeitos,null);a.equal(g.resultado(x,false).conquista,'combate');});
test('recursos disponíveis',()=>{a.equal(g.opcoes(null,{},'mana').length,0);a.equal(g.opcoes(p,{},'mana')[0].id,'socorro');});
