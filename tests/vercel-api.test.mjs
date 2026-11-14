import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { pbkdf2Sync } from 'node:crypto';
import { createHandler } from '../server/store-handler.mjs';

const password='integration-test-only-password',salt=Buffer.alloc(32,7);
process.env.ADMIN_EMAIL='admin@example.test';
process.env.ADMIN_PASSWORD_HASH=`pbkdf2_sha256:600000:${salt.toString('hex')}:${pbkdf2Sync(password,salt,600000,32,'sha256').toString('hex')}`;
process.env.SESSION_SECRET='integration-test-only-secret-32-characters';
process.env.BLOB_READ_WRITE_TOKEN='test-only';
async function fixture(t){
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE products(id TEXT PRIMARY KEY,data TEXT);CREATE TABLE categories(name TEXT PRIMARY KEY);CREATE TABLE sessions(id TEXT PRIMARY KEY,email TEXT,csrf TEXT,expires INTEGER);CREATE TABLE attempts(ip TEXT PRIMARY KEY,count INTEGER,started INTEGER);CREATE TABLE media(url TEXT PRIMARY KEY);');
 const sql=async(statement,args=[])=>{const query=db.prepare(statement);if(query.columns().length)return {rows:query.all(...args)};const result=query.run(...args);return {rows:[],affected:result.changes};};
 let uploads=0;
 const app=createHandler({sql,initialize:async()=>{},put:async(path)=>{uploads++;return {url:`https://test.public.blob.vercel-storage.com/${path}`};}});
 const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/index.php?action=`;
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));db.close();});
 let cookie='',csrf='';
 const request=async(action,{method='GET',data,headers={},body,auth=true}={})=>{
  const r=await fetch(base+action,{method,headers:{...(auth?{Cookie:cookie,'X-CSRF-Token':csrf}:{}),...(data?{'Content-Type':'application/json'}:{}),...headers},body:data?JSON.stringify(data):body});
  return {response:r,value:await r.json()};
 };
 async function login(){const result=await request('login',{method:'POST',data:{email:'admin@example.test',password}});assert.equal(result.response.status,200);cookie=result.response.headers.get('set-cookie').split(';')[0];assert.match(result.response.headers.get('set-cookie'),/HttpOnly/);csrf=(await request('session')).value.csrf;}
 return {request,login,sql,get uploads(){return uploads;}};
}
const product={name:'Camiseta de teste',description:'Algodão',category:'Camisetas',price:64.9,stock:0,active:false,images:[],sizes:['p','M','p'],comparePrice:79.9,installmentCount:12,installmentValue:6.68};

test('cadastro persiste, normaliza tamanhos e publica com estoque; status altera a vitrine',async t=>{
 const f=await fixture(t);await f.login();
 const created=await f.request('products',{method:'POST',data:product});assert.equal(created.response.status,200);
 assert.equal(created.value.stock,1);assert.equal(created.value.active,true);assert.deepEqual(created.value.sizes,['P','M']);assert.equal(created.value.installmentValue,6.68);
 const id=created.value.id;
 assert.equal((await f.request('products',{auth:false})).value.length,1);
 await f.request('product-status',{method:'POST',data:{id,active:false}});
 assert.equal((await f.request('products',{auth:false})).value.length,0);
 assert.equal((await f.request('products')).value.length,1);
 assert.equal((await f.request('products')).value[0].stock,1);
 await f.request('product-status',{method:'POST',data:{id,active:true}});
 const edited=await f.request('products',{method:'POST',data:{...created.value,price:60}});assert.equal(edited.value.price,60);
 await f.request('products',{method:'DELETE',data:{id}});assert.equal((await f.request('products',{auth:false})).value.length,0);
});
test('autenticação, CSRF, expiração e logout protegem alterações',async t=>{
 const f=await fixture(t);
 assert.equal((await f.request('products',{method:'POST',data:product})).response.status,401);
 await f.login();
 assert.equal((await f.request('products',{method:'POST',data:product,headers:{'X-CSRF-Token':'bad'}})).response.status,403);
 assert.equal((await f.request('products',{method:'POST',data:product,headers:{Origin:'https://evil.example'}})).response.status,403);
 assert.equal((await f.request('logout',{method:'POST',data:{}})).response.status,200);
 assert.equal((await f.request('products',{method:'POST',data:product})).response.status,401);
 await f.login();await f.sql('UPDATE sessions SET expires=0');
 assert.equal((await f.request('categories')).response.status,401);
});
test('bloqueia tentativas de login depois do limite persistente',async t=>{
 const f=await fixture(t);
 for(let i=0;i<8;i++)assert.equal((await f.request('login',{method:'POST',data:{email:'admin@example.test',password:'wrong'}})).response.status,401);
 assert.equal((await f.request('login',{method:'POST',data:{email:'admin@example.test',password}})).response.status,429);
});
test('rejeita parcelas inválidas e referências de imagens não cadastradas',async t=>{
 const f=await fixture(t);await f.login();
 assert.equal((await f.request('products',{method:'POST',data:{...product,installmentValue:1}})).response.status,422);
 assert.equal((await f.request('products',{method:'POST',data:{...product,images:['https://evil.example/x.jpg']}})).response.status,422);
 assert.equal((await f.request('products',{method:'POST',data:{...product,images:['images/../../secret.jpg']}})).response.status,422);
 assert.equal((await f.request('products',{method:'POST',data:{...product,sizes:['']}})).response.status,422);
});
test('valida conteúdo do upload e registra a imagem antes de permitir seu uso',async t=>{
 const f=await fixture(t);await f.login();
 const bad=new FormData();bad.append('image',new Blob(['<svg></svg>'],{type:'image/png'}),'fake.png');
 assert.equal((await f.request('upload',{method:'POST',body:bad})).response.status,422);assert.equal(f.uploads,0);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/G3sAAAAASUVORK5CYII=','base64');
 const form=new FormData();form.append('image',new Blob([png],{type:'image/png'}),'photo.png');
 const uploaded=await f.request('upload',{method:'POST',body:form});assert.equal(uploaded.response.status,200);assert.equal(f.uploads,1);
 const saved=await f.request('products',{method:'POST',data:{...product,images:[uploaded.value.path]}});assert.equal(saved.response.status,200);
});
test('importação autenticada mantém IDs, estoque e produtos já editados online',async t=>{
 const f=await fixture(t),data={...product,id:'1234567890abcdef1234',stock:0,active:false};
 assert.equal((await f.request('import-product',{method:'POST',data})).response.status,401);
 await f.login();const first=await f.request('import-product',{method:'POST',data});assert.equal(first.response.status,200);assert.equal(first.value.id,data.id);assert.equal(first.value.stock,0);assert.equal(first.value.active,false);
 const second=await f.request('import-product',{method:'POST',data:{...data,name:'Não sobrescrever'}});assert.equal(second.value.name,data.name);assert.equal((await f.request('products')).value.length,1);
});
