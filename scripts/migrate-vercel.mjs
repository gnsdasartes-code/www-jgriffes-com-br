import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { put } from '@vercel/blob';
import { sql,initialize } from '../server/database.mjs';

if(!process.env.BLOB_READ_WRITE_TOKEN)throw Error('Configure BLOB_READ_WRITE_TOKEN no ambiente privado.');
await initialize();
const db=new DatabaseSync('storage/store.sqlite',{readOnly:true});
const products=db.prepare('SELECT data FROM products ORDER BY rowid').all().map(row=>JSON.parse(row.data));
const categories=db.prepare('SELECT name FROM categories').all();db.close();
const uploaded=new Map();let inserted=0,skipped=0;
for(const product of products){
 // Never overwrite products edited online when migration is resumed.
 if((await sql('SELECT id FROM products WHERE id=?',[product.id])).rows.length){skipped++;continue;}
 const images=[];
 for(const local of product.images||[]){
  if(!/^(images|uploads)\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/i.test(local))throw Error('Referência de imagem local inválida.');
  if(!uploaded.has(local)){
   const data=await readFile(local),hash=createHash('sha256').update(data).digest('hex'),ext=local.split('.').pop().toLowerCase();
   const blob=await put(`products/migrated-${hash}.${ext}`,data,{access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:ext==='jpg'||ext==='jpeg'?'image/jpeg':`image/${ext}`});
   await sql('INSERT OR IGNORE INTO media VALUES(?)',[blob.url]);uploaded.set(local,blob.url);
  }
  images.push(uploaded.get(local));
 }
 product.images=images;
 await sql('INSERT OR IGNORE INTO products(id,data) VALUES(?,?)',[product.id,JSON.stringify(product)]);inserted++;
}
for(const category of categories)await sql('INSERT OR IGNORE INTO categories VALUES(?)',[category.name]);
console.log(`Migração concluída: ${inserted} produtos transferidos; ${skipped} já existentes preservados.`);
