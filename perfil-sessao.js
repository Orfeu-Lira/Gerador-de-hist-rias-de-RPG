'use strict';
const crypto=require('node:crypto');
function chave(secret,sid,userId){return crypto.createHmac('sha256',secret).update(JSON.stringify(['perfil-v1',String(sid),String(userId)])).digest('hex');}
function confere(secret,sid,userId,recebida){if(typeof recebida!=='string'||!/^[a-f0-9]{64}$/.test(recebida))return false;return crypto.timingSafeEqual(Buffer.from(chave(secret,sid,userId),'hex'),Buffer.from(recebida,'hex'));}
module.exports={chave,confere};
