/* Mesa: regras de rolagem compartilháveis e testáveis, sem DOM ou backend.
   Em D&D 5e/2024, um dano crítico duplica os DADOS (inclusive dados extras
   aplicáveis ao ataque), nunca os modificadores fixos. */
(function(root,factory){
 const rules=factory();
 if(typeof module==='object'&&module.exports)module.exports=rules;
 if(root)root.MesaDiceRules=rules;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const facesPermitidas=[4,6,8,10,12,20,100];
 const inteiro=(v,min,max,nome)=>{
  if(v===''||v===null||v===undefined||!Number.isInteger(Number(v))||Number(v)<min||Number(v)>max)
   throw new Error(nome+' deve ficar entre '+min+' e '+max+'.');
  return Number(v);
 };
 function normalizar(op){
  if(!op||typeof op!=='object')throw new Error('Configuração de dados inválida.');
  const tipo=['livre','dano','cura','ataque','teste'].includes(op.tipo)?op.tipo:'livre';
  const lados=inteiro(op.lados,1,100,'Dado');
  if(!facesPermitidas.includes(lados))throw new Error('Escolha um dado válido.');
  const quantidade=inteiro(op.quantidade,1,20,'Quantidade');
  const modificador=inteiro(op.modificador, -300,300,'Modificador');
  const extraQuantidade=inteiro(op.extraQuantidade??0,0,20,'Quantidade adicional');
  const extraLados=inteiro(op.extraLados??4,4,100,'Dado adicional');
  if(extraQuantidade&&!facesPermitidas.includes(extraLados))throw new Error('Dado adicional inválido.');
  const critico=tipo==='dano'&&op.critico===true;
  const alvo=['ataque','teste'].includes(tipo)&&op.alvo!==''&&op.alvo!==null&&op.alvo!==undefined
   ?inteiro(op.alvo,0,1000,'CA/CD'):null;
  const reducao=tipo==='dano'?inteiro(op.reducao??0,0,300,'Redução fixa de dano'):0;
  const resistencia=tipo==='dano'&&op.resistencia===true;
  const vulnerabilidade=tipo==='dano'&&op.vulnerabilidade===true;
  const imunidade=tipo==='dano'&&op.imunidade===true;
  const vantagem=tipo==='ataque'||tipo==='teste'
   ?(['normal','vantagem','desvantagem'].includes(op.vantagem)?op.vantagem:'normal'):'normal';
  if(vantagem!=='normal'&&(lados!==20||quantidade!==1))
   throw new Error('Vantagem/desvantagem requer uma rolagem de 1d20.');
  if(extraQuantidade&&!['livre','dano','cura'].includes(tipo))
   throw new Error('Dados adicionais disponíveis para dano, cura e rolagem livre.');
  const nRolagens=(quantidade+extraQuantidade)*(critico?2:1)+(vantagem==='normal'?0:1);
  if(nRolagens>80)throw new Error('Máximo de 80 dados por rolagem.');
  return {tipo,lados,quantidade,modificador,extraQuantidade,extraLados,critico,vantagem,alvo,reducao,resistencia,vulnerabilidade,imunidade};
 }
 function rolar(op,gerador){
  const c=normalizar(op);
  const rng=typeof gerador==='function'?gerador:(faces)=>{
   // O navegador oferece fonte aleatória segura para rolagens locais.
   if(typeof crypto!=='undefined'&&crypto.getRandomValues){
    const array=new Uint32Array(1);
    const limite=0x100000000-(0x100000000%faces);
    let n;do{crypto.getRandomValues(array);n=array[0]}while(n>=limite);
    return 1+(n%faces);
   }
   return 1+Math.floor(Math.random()*faces);
  };
  const dado=(faces)=>{
   const v=Number(rng(faces));
   if(!Number.isInteger(v)||v<1||v>faces)throw new Error('Valor do dado fora do intervalo.');
   return v;
  };
  const q=c.quantidade*(c.critico?2:1);
  let valores=Array.from({length:q},()=>dado(c.lados));
  let comparacao=null;
  if(c.vantagem!=='normal'){
   const outro=dado(20),primeiro=valores[0];
   const escolhido=c.vantagem==='vantagem'?Math.max(primeiro,outro):Math.min(primeiro,outro);
   comparacao={primeiro,segundo:outro,escolhido};
   valores=[escolhido];
  }
  const adicionais=Array.from({length:c.extraQuantidade*(c.critico?2:1)},()=>dado(c.extraLados));
  const base=valores.reduce((x,y)=>x+y,0);
  const somaExtras=adicionais.reduce((x,y)=>x+y,0);
  const bruto=base+somaExtras+c.modificador;
  // D&D 2024: primeiro reduções fixas, depois resistência (arredonda
  // para baixo), depois vulnerabilidade. Imunidade zera o tipo de dano.
  const aposReducao=c.tipo==='dano'?Math.max(0,bruto-c.reducao):Math.max(0,bruto);
  const aposResistencia=c.tipo==='dano'&&c.resistencia?Math.floor(aposReducao/2):aposReducao;
  const total=c.tipo==='dano'
   ?(c.imunidade?0:c.vulnerabilidade?aposResistencia*2:aposResistencia)
   :c.tipo==='cura'?Math.max(0,bruto):bruto;
  const natural=(c.lados===20&&c.quantidade===1&&!c.critico&&(c.tipo==='ataque'||c.tipo==='teste'))?valores[0]:null;
  const criticoNatural=c.tipo==='ataque'&&natural===20;
  const falhaNatural=c.tipo==='ataque'&&natural===1;
  const passou=c.tipo==='ataque'
   ?(criticoNatural?true:falhaNatural?false:c.alvo===null?null:total>=c.alvo)
   :c.tipo==='teste'&&c.alvo!==null?total>=c.alvo:null;
  const formato=n=>n>=0?' + '+n:' - '+Math.abs(n);
  const expressao=(c.critico?'Crítico: ':'')+(c.critico?String(c.quantidade*2):String(c.quantidade))+'d'+c.lados+
    (c.extraQuantidade?' + '+(c.critico?c.extraQuantidade*2:c.extraQuantidade)+'d'+c.extraLados:'')+
    (c.modificador?formato(c.modificador):'');
  return {...c,valores,adicionais,base,somaExtras,bruto,aposReducao,aposResistencia,total,natural,criticoNatural,falhaNatural,passou,comparacao,expressao};
 }
 return Object.freeze({normalizar,rolar,facesPermitidas});
});
