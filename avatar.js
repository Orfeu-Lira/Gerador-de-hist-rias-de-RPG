'use strict';
// Só aceita WebP binário com tamanho e container RIFF coerentes.
function validarAvatar(base64){
 if(typeof base64!=='string'||base64.length<36||base64.length>524288||base64.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))return null;
 const b=Buffer.from(base64,'base64');
 if(b.length<26||b.length>393216||b.toString('base64')!==base64||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP'||b.readUInt32LE(4)!==b.length-8)return null;
 let offset=12,imagem=false;
 while(offset+8<=b.length){
   const tipo=b.toString('ascii',offset,offset+4),n=b.readUInt32LE(offset+4),inicio=offset+8,fim=inicio+n;
   if(fim>b.length||fim+(n%2)>b.length)return null;
   if(tipo==='VP8 '&&n>=10&&b[inicio+3]===0x9d&&b[inicio+4]===1&&b[inicio+5]===0x2a)imagem=true;
   if(tipo==='VP8L'&&n>=5&&b[inicio]===0x2f)imagem=true;
   offset=fim+(n%2);
 }
 return imagem&&offset===b.length?b:null;
}
module.exports={validarAvatar};
