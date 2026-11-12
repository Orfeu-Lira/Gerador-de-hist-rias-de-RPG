// Verificações não destrutivas, executáveis com Node >= 22.
// MESA_BASE_URL=https://historiasrpg.vercel.app node tests/security-smoke.mjs
import assert from 'node:assert/strict';
const base=(process.env.MESA_BASE_URL||'').replace(/\/+$/,'');
if(!/^https:\/\/[a-z0-9.-]+$/i.test(base))throw new Error('Informe uma URL HTTPS válida em MESA_BASE_URL.');
const checks=[];
async function request(path,options={}){
 const r=await fetch(base+path,{redirect:'manual',...options});
 return r;
}
async function check(label,run){try{await run();checks.push({label,ok:true});}catch(e){checks.push({label,ok:false,error:e.message});}}
await check('Cabeçalhos de segurança',async()=>{
 const r=await request('/');
 assert.equal(r.status,200);
 assert.match(r.headers.get('content-security-policy')||'',/default-src 'self'/);
 assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 assert.equal(r.headers.get('x-frame-options'),'DENY');
});
for(const [name,path] of [
 ['Aventuras','/api/aventuras'],
 ['Personagens','/api/personagens'],
 ['NPCs','/api/npcs'],
 ['Campanhas solo','/api/solo/campanhas'],
 ['Exportação LGPD','/api/conta/meus-dados'],
 ['Painel administrativo','/api/admin/dashboard']
]){
 await check(name+' sem autenticação',async()=>{
  const r=await request(path);
  assert.equal(r.status,401);
  assert.match(r.headers.get('cache-control')||'',/no-store/);
 });
}
await check('Bloqueio CORS de origem estranha',async()=>{
 const r=await request('/api/eu',{headers:{Origin:'https://outro-site.invalid'}});
 assert.equal(r.status,403);
 assert.notEqual(r.headers.get('access-control-allow-origin'),'https://outro-site.invalid');
});
for(const c of checks)console.log((c.ok?'OK ':'FALHA ')+c.label+(c.error?' — '+c.error:''));
if(checks.some(c=>!c.ok))process.exitCode=1;
