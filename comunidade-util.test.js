'use strict';
const test=require('node:test'),a=require('node:assert/strict'),c=require('./comunidade-util');
test('normaliza @ e espaços, escapa curingas SQL',()=>{a.equal(c.termoBusca(' @Hero_1 '),'Hero_1');a.equal(c.escapeBusca('a_b%!!'),'a!_b!%!!!!');a.equal(c.termoBusca({}),'');});
test('cota só renova quando antes esgotada e agora disponível',()=>{a.equal(c.avisoCota('usuario',0,5),true);a.equal(c.avisoCota('usuario',5,5),false);a.equal(c.avisoCota('usuario',0,4),false);a.equal(c.avisoCota('solo',1,30),true);a.equal(c.avisoCota('inexistente',0,10),false);});