import { DatabaseSync } from 'node:sqlite';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const state=JSON.parse(await readFile('.runtime/deployment-progress.json','utf8'));
const credentials=JSON.parse(await readFile('.runtime/vercel-credentials.json','utf8'));
const base=new URL(state.productionUrl);
if(base.protocol!=='https:'||base.hostname!=='www-jgriffes-com-br-f3bb.vercel.app')throw Error('Projeto de destino não confirmado.');
let cookie='',csrf='';
async function api(action,method='GET',body){
 const response=await fetch(new URL(`/api/index.php?action=${action}`,base),{method,headers:{Cookie:cookie,'X-CSRF-Token':csrf,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});
 let value;try{value=await response.json();}catch{throw Error(`API ${action}: resposta não JSON, HTTP ${response.status}`);}
 if(!response.ok)throw Error(`API ${action}: HTTP ${response.status} — ${value.error||'falha'}`);
 const setCookie=response.headers.get('set-cookie');if(setCookie)cookie=setCookie.split(';')[0];return value;
}
await api('login','POST',{email:credentials.environment.ADMIN_EMAIL,password:credentials.password});
csrf=(await api('session')).csrf;
try{
 const existing=new Set((await api('products')).map(p=>p.id));
 const db=new DatabaseSync('storage/store.sqlite',{readOnly:true});
 const products=db.prepare('SELECT data FROM products ORDER BY rowid').all().map(row=>JSON.parse(row.data));
 const categories=db.prepare('SELECT name FROM categories').all();db.close();
 const cacheFile='.runtime/migration-photo-map.json';let uploaded={};try{uploaded=JSON.parse(await readFile(cacheFile,'utf8'));}catch{}
 let imported=0,skipped=0;
 for(const {name} of categories)await api('categories','POST',{name});
 for(const p of products){
  if(existing.has(p.id)){skipped++;continue;}
  const images=[];
  for(const path of p.images||[]){
   if(!/^(images|uploads)\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/i.test(path))throw Error(`Imagem local inválida no produto ${p.id}`);
   if(!uploaded[path]){
    const data=await readFile(resolve(path));if(data.length>4*1024*1024)throw Error(`Imagem do produto ${p.id} ultrapassa 4 MB.`);
    const ext=path.split('.').pop().toLowerCase(),mime=ext==='jpg'||ext==='jpeg'?'image/jpeg':`image/${ext}`;
    const form=new FormData();form.append('image',new Blob([data],{type:mime}),path.split('/').pop());
    uploaded[path]=(await api('upload','POST',form)).path;
    await writeFile(cacheFile,JSON.stringify(uploaded,null,2),{mode:0o600});
   }
   images.push(uploaded[path]);
  }
  await api('import-product','POST',{...p,images});imported++;console.log(`Produto transferido: ${imported} de ${products.length-skipped}`);
 }
 const remote=await api('products'),missing=products.filter(p=>!remote.some(r=>r.id===p.id));
 if(missing.length)throw Error(`${missing.length} produtos ainda não foram transferidos.`);
 state.databaseConnected=true;state.migrationVerified=true;state.productsMigrated=products.length;
 await writeFile('.runtime/deployment-progress.json',JSON.stringify(state,null,2));
 console.log(`Migração verificada: ${products.length} produtos locais presentes na hospedagem; ${skipped} já existentes preservados.`);
}finally{await api('logout','POST',{}).catch(()=>{});}
