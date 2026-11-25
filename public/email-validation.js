// Validação sintática comum ao navegador e servidor; não confirma titularidade.
(function(root,factory){
 const validar=factory();
 if(typeof module==='object'&&module.exports)module.exports=validar;
 else root.mesaEmailValido=validar;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 return function(email){
  if(typeof email!=='string')return false;
  const s=email.trim();
  if(s.length>254)return false;
  const partes=s.split('@');
  if(partes.length!==2)return false;
  const [local,dominio]=partes;
  if(!local||local.length>64||!dominio||dominio.length>253)return false;
  if(!/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+$/i.test(local)||local.startsWith('.')||local.endsWith('.')||local.includes('..'))return false;
  const labels=dominio.split('.');
  return labels.length>=2&&labels.every(l=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(l))&&/^[a-z][a-z0-9-]{1,62}$/i.test(labels[labels.length-1]);
 };
});
