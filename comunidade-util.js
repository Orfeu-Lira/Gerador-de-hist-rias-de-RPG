'use strict';
const termoBusca=v=>typeof v==='string'?v.trim().replace(/^@/,'').trim():'';
const escapeBusca=v=>v.replace(/[!_%]/g,x=>'!'+x);
const cotas=Object.freeze([{prefixo:'usuario',limite:5,nome:'Geração de histórias e NPCs'},{prefixo:'solo',limite:30,nome:'Narrações Solo'},{prefixo:'dnd-ajuda',limite:6,nome:'Tutor D&D'},{prefixo:'musica',limite:4,nome:'Pesquisa musical'},{prefixo:'xp-retro',limite:30,nome:'Revisões de conquistas e XP'}]);
function avisoCota(prefixo,usadasHoje,usadasAntes){const c=cotas.find(x=>x.prefixo===prefixo);return Boolean(c&&Number(usadasHoje)<c.limite&&Number(usadasAntes)>=c.limite);}
module.exports={termoBusca,escapeBusca,cotas,avisoCota};
