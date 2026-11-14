import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Não usa API externa nem credenciais.
const names=execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n');
assert(!names.some(p=>/(^|\/)\.env(?:\.|$)/.test(p)&&p!=='.env.example'),'Arquivo de ambiente versionado');
assert(!names.some(p=>/\.(pem|p12|pfx|key)$/i.test(p)),'Possível certificado privado versionado');
const server=readFileSync('server.js','utf8');
const html=readFileSync('public/index.html','utf8');
assert(server.includes("bcrypt.compare("),'Verificação de senha ausente');
assert(server.includes("exigeAdmin"),'Middleware de administrador ausente');
assert(server.includes("'/api/conta/excluir'"),'Exclusão de conta ausente');
assert(server.includes("'/api/conta/meus-dados'"),'Exportação de conta ausente');
assert(server.includes("res.set('Cache-Control','no-store')"),'Cache privado não bloqueado');
assert(html.includes('id="mesa-exclusao-form"'),'Formulário de exclusão ausente');
assert(html.includes('id="mesa-exportar-btn"'),'Exportação ausente');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'IDs HTML duplicados');
const env=names.filter(p=>p.startsWith('public/')||p==='index.html'||p==='app.js'||p==='config.js');
for(const path of env){
 if(!existsSync(path)||!(/\.js$|\.html$|\.json$/.test(path)))continue;
 const data=readFileSync(path,'utf8');
 assert(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(data),`Chave privada em ${path}`);
 assert(!/sb_secret_[a-zA-Z0-9]{16,}/.test(data),`Supabase secret exposto em ${path}`);
}
console.log('Mesa: verificações estáticas de segurança concluídas.');
