// Teste autenticado de isolamento de DUAS contas fictícias, somente em homologação.
// Não cria, modifica ou apaga dados. Requer campanhas preparadas no banco isolado.
// Node >= 22:
//   MESA_STAGING_URL=https://preview-isolado.vercel.app \
//   MESA_TEST_A_EMAIL=... MESA_TEST_A_PASSWORD=... MESA_TEST_A_CAMPAIGN_ID=... \
//   MESA_TEST_B_EMAIL=... MESA_TEST_B_PASSWORD=... MESA_TEST_B_CAMPAIGN_ID=... \
//   node tests/security-two-accounts.mjs
import assert from 'node:assert/strict';

const base=(process.env.MESA_STAGING_URL||'').replace(/\/+$/,'');
const u=/^https:\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)*)\.vercel\.app$/i.exec(base);
if(!u)throw new Error('Use apenas deployment HTTPS de homologação *.vercel.app.');
const hostname=u[1]+'.vercel.app';
if([
 'historiasrpg.vercel.app',
 'gerador-de-hist-rias-de-rpg.vercel.app',
 'gerador-de-hist-rias-de-rpg-orfeu-liras-projects.vercel.app'
].includes(hostname))throw new Error('Proibido testar contra domínio de produção conhecido.');
if(process.env.MESA_STAGING_DB_ISOLATED!=='yes')throw new Error('Confirme que o Preview usa banco independente com MESA_STAGING_DB_ISOLATED=yes.');

const testUsers=['A','B'].map(label=>({
 label,
 email:process.env['MESA_TEST_'+label+'_EMAIL'],
 senha:process.env['MESA_TEST_'+label+'_PASSWORD'],
 campanha:Number(process.env['MESA_TEST_'+label+'_CAMPAIGN_ID'])
}));
for(const u of testUsers){
 if(!u.email||!u.senha||!Number.isSafeInteger(u.campanha)||u.campanha<1)
  throw new Error('Informe credenciais e ID de campanha fictícia para as contas A e B.');
}
assert.notEqual(testUsers[0].email.toLowerCase(),testUsers[1].email.toLowerCase(),'Contas A e B precisam ser diferentes.');
assert.notEqual(testUsers[0].campanha,testUsers[1].campanha,'Cada conta deve ter campanha distinta.');

async function call(path,opts={}){
 const r=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(15000),...opts});
 return r;
}
async function login(u){
 const response=await call('/api/login',{method:'POST',
  headers:{'Content-Type':'application/json','Origin':base},
  body:JSON.stringify({email:u.email,senha:u.senha,manterConectado:false})});
 assert.equal(response.status,200,'Falha no login de '+u.label+' (código '+response.status+').');
 const cookie=response.headers.get('set-cookie');
 assert(cookie?.includes('mesa.sid='),'Sessão não recebida no login de '+u.label);
 u.cookie=cookie.split(';',1)[0];
 const atual=await call('/api/eu',{headers:{Cookie:u.cookie}});
 assert.equal(atual.status,200);
 const data=await atual.json();
 assert.equal(data.email?.toLowerCase(),u.email.toLowerCase(),'Identidade inesperada');
 assert.equal(data.logado,true);
}
async function status(path,cookie,esperado,rotulo){
 const r=await call(path,{headers:cookie?{Cookie:cookie}:{}});
 assert.equal(r.status,esperado,rotulo+': '+r.status+' em vez de '+esperado);
 assert.match(r.headers.get('cache-control')||'',/no-store/,'Resposta privada não deve ser cacheável');
 console.log('OK: '+rotulo+' ('+r.status+')');
 return r;
}
// Sem sessão: nenhuma campanha visível.
await status('/api/solo/campanhas/'+testUsers[0].campanha,null,401,'Visitante sem sessão');
await login(testUsers[0]);
await login(testUsers[1]);
for(const a of testUsers){
 const outra=testUsers.find(u=>u!==a);
 await status('/api/solo/campanhas/'+a.campanha,a.cookie,200,'Titular '+a.label+' lê sua campanha');
 await status('/api/solo/campanhas/'+outra.campanha,a.cookie,404,'Titular '+a.label+' não lê campanha alheia');
 await status('/api/conta/meus-dados',a.cookie,200,'Titular '+a.label+' acessa exportação');
 const r=await call('/api/aventuras',{headers:{Cookie:a.cookie}});
 assert.equal(r.status,200,'Listagem de aventuras '+a.label);
 assert(Array.isArray(await r.json()),'Histórico com formato inesperado');
}
console.log('PASSOU: isolamento por usuário nas rotas verificadas com duas contas fictícias.');
