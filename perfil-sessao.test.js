'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),p=require('./perfil-sessao');
const secret='segredo-exclusivo-de-teste-nao-usado-em-producao';
test('chave só aceita a mesma sessão e usuário',()=>{const a=p.chave(secret,'sessao-a',1);assert.equal(p.confere(secret,'sessao-a',1,a),true);assert.equal(p.confere(secret,'sessao-b',1,a),false);assert.equal(p.confere(secret,'sessao-a',2,a),false);});
test('requisições sem chave ou adulteradas são rejeitadas',()=>{for(const v of [undefined,null,'','x','0'.repeat(64),{},[]])assert.equal(p.confere(secret,'a',1,v),false);});
