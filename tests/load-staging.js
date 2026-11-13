// k6: teste de carga controlado para o Mesa em HOMOLOGAÇÃO.
// Executar APENAS em um deployment autorizado, isolado e com dados fictícios.
// k6 run -e BASE_URL=https://SEU-DEPLOYMENT-DE-HOMOLOGACAO -e MESA_LOAD_TEST_APPROVED=yes tests/load-staging.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const raw=__ENV.BASE_URL||'';
let host='';
try{
 const url=new URL(raw);
 if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash)throw Error('URL HTTPS exigida');
 host=url.hostname.toLowerCase();
}catch{throw Error('Informe BASE_URL como URL HTTPS válida da homologação.');}
if(__ENV.MESA_LOAD_TEST_APPROVED!=='yes')throw Error('Confirme o teste com MESA_LOAD_TEST_APPROVED=yes.');
if(host==='historiasrpg.vercel.app'||host==='gerador-de-hist-rias-de-rpg.vercel.app'||
   host==='orfeu-lira.github.io'||host==='localhost'||host==='127.0.0.1'||
   host.endsWith('.github.io')||!host.endsWith('.vercel.app')){
 throw Error('Proteção: use apenas URL de preview/homologação *.vercel.app, jamais a produção ou host arbitrário.');
}
const base=raw.replace(/\/$/,'');
const errors=new Rate('mesa_failed_requests');
const timings=new Trend('mesa_endpoint_ms');
export const options={
 scenarios:{
  leitura_controlada:{
   executor:'ramping-vus',
   startVUs:0,
   stages:[
    {duration:'1m',target:10},{duration:'2m',target:10},
    {duration:'1m',target:30},{duration:'2m',target:30},
    {duration:'1m',target:100},{duration:'2m',target:100},
    {duration:'1m',target:0}
   ],
   gracefulRampDown:'20s'
  }
 },
 thresholds:{
  http_req_failed:['rate<0.02'],
  http_req_duration:['p(95)<1500'],
  mesa_failed_requests:['rate<0.02']
 },
 discardResponseBodies:true,
 userAgent:'MesaLoadTest/1.0 authorized-staging-only'
};
const paginas=['/api/health','/api/publico/informacoes'];
export default function(){
 const path=paginas[Math.floor(Math.random()*paginas.length)];
 const resposta=http.get(base+path,{timeout:'10s',tags:{endpoint:path}});
 const ok=check(resposta,{'HTTP 200':r=>r.status===200});
 errors.add(!ok);
 timings.add(resposta.timings.duration,{endpoint:path});
 sleep(1.5+Math.random()*2);
}
// O script não envia credenciais, não cria contas, não modifica dados,
// não utiliza endpoints de IA e não atinge URLs de produção conhecidas.
// A confirmação MESA_LOAD_TEST_APPROVED é intencionalmente explícita.
