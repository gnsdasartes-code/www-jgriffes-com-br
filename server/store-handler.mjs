import { randomBytes, createHash, createHmac, timingSafeEqual, pbkdf2 } from 'node:crypto';
import { promisify } from 'node:util';
import { fileTypeFromBuffer } from 'file-type';
import { imageSize } from 'image-size';

const derive=promisify(pbkdf2),MAX_IMAGE=4*1024*1024;
const id=()=>randomBytes(20).toString('hex');
const digest=value=>createHash('sha256').update(value).digest('hex');
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(message,status=422)=>{throw new HttpError(status,message);};
const text=(value,max)=>{if(typeof value!=='string'||[...value.trim()].length>max)fail('Texto inválido ou muito longo.');return value.trim();};
const money=value=>{if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>9999999)fail('Preço inválido.');return Math.round(value*100)/100;};
const integer=(value,max)=>{if(!Number.isInteger(value)||value<0||value>max)fail('Quantidade inválida.');return value;};
const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const left=Buffer.from(a),right=Buffer.from(b);return left.length===right.length&&timingSafeEqual(left,right);};
const sign=value=>createHmac('sha256',process.env.SESSION_SECRET).update(value).digest('hex');
export async function verifyPassword(password,hash){
 if(typeof password!=='string'||password.length>1024)return false;
 const parts=/^pbkdf2_sha256:600000:([a-f0-9]{64}):([a-f0-9]{64})$/.exec(hash||'');
 if(!parts)return false;
 const result=await derive(password,Buffer.from(parts[1],'hex'),600000,32,'sha256');return equal(result.toString('hex'),parts[2]);
}
async function rawBody(req,max){
 let buffer;
 if(Buffer.isBuffer(req.body))buffer=req.body;
 else if(typeof req.body==='string')buffer=Buffer.from(req.body);
 else if(req.body&&typeof req.body==='object')buffer=Buffer.from(JSON.stringify(req.body));
 else {const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>max)fail('Arquivo ou solicitação muito grande.',413);chunks.push(chunk);}buffer=Buffer.concat(chunks);}
 if(buffer.length>max)fail('Arquivo ou solicitação muito grande.',413);return buffer;
}
async function json(req){try{const value=JSON.parse((await rawBody(req,65536)).toString());if(!value||Array.isArray(value)||typeof value!=='object')throw Error();return value;}catch(error){if(error instanceof HttpError)throw error;fail('Dados inválidos.',400);}}
export function createHandler({sql,initialize,put}){
 return async function handler(req,res){
  const reply=(value,status=200)=>{res.statusCode=status;res.end(JSON.stringify(value));};
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const secure=process.env.VERCEL?' Secure;':'';
  const cookie=(token,age)=>res.setHeader('Set-Cookie',`jg_cloud=${token}; Path=/; HttpOnly;${secure} SameSite=Strict; Max-Age=${age}`);
  try{
   if(!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD_HASH||!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)throw new HttpError(503,'Configure o acesso administrativo no servidor.');
   await initialize();const now=Math.floor(Date.now()/1000),url=new URL(req.url,'http://localhost'),action=url.searchParams.get('action')||'products',method=req.method;
   if(method!=='GET'&&req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)fail('Origem não autorizada.',403);}
   let session=null;
   const token=/(?:^|;\s*)jg_cloud=([a-f0-9]{40})\.([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'');
   if(token&&equal(sign(token[1]),token[2])){
    const result=await sql('SELECT email,csrf,expires FROM sessions WHERE id=? AND expires>?',[digest(token[1]),now]);
    session=result.rows[0]||null;
    if(session?.email!==process.env.ADMIN_EMAIL.toLowerCase())session=null;
   }
   if(action==='session'&&method==='GET')return reply({email:session?.email||null,csrf:session?.csrf||''});
   if(action==='products'&&method==='GET'){
    const result=await sql('SELECT data FROM products ORDER BY rowid DESC');const products=result.rows.map(row=>JSON.parse(row.data));return reply(session?products:products.filter(p=>p.active));
   }
   if(action==='login'&&method==='POST'){
    const body=await json(req),email=text(body.email??'',254).toLowerCase();
    const ip=String(req.headers['x-real-ip']||req.socket?.remoteAddress||'unknown');const key=sign(ip);
    // Atomic counter limits concurrent requests as well as sequential attempts.
    const rate=await sql('INSERT INTO attempts(ip,count,started) VALUES(?,1,?) ON CONFLICT(ip) DO UPDATE SET count=CASE WHEN started<=? THEN 1 ELSE count+1 END,started=CASE WHEN started<=? THEN excluded.started ELSE started END RETURNING count',[key,now,now-900,now-900]);
    if(Number(rate.rows[0].count)>8)fail('Muitas tentativas. Aguarde 15 minutos.',429);
    const valid=await verifyPassword(body.password,process.env.ADMIN_PASSWORD_HASH);
    if(!valid||email!==process.env.ADMIN_EMAIL.toLowerCase())fail('E-mail ou senha inválidos.',401);
    if(token)await sql('DELETE FROM sessions WHERE id=?',[digest(token[1])]);
    const sessionToken=id(),csrf=id();await sql('INSERT INTO sessions VALUES(?,?,?,?)',[digest(sessionToken),email,csrf,now+3600]);
    await sql('DELETE FROM attempts WHERE ip=?',[key]);await sql('DELETE FROM sessions WHERE expires<=?',[now]);
    cookie(`${sessionToken}.${sign(sessionToken)}`,3600);return reply({ok:true});
   }
   if(!session)fail('Faça login para continuar.',401);
   if(method!=='GET'&&!equal(session.csrf,req.headers['x-csrf-token']))fail('Sessão inválida. Atualize a página.',403);
   if(action==='logout'&&method==='POST'){await sql('DELETE FROM sessions WHERE id=?',[digest(token[1])]);cookie('',0);return reply({ok:true});}
   if(action==='categories'){
    if(method==='POST'){const body=await json(req),name=text(body.name??'',100);if(!name)fail('Informe a categoria.');await sql('INSERT OR IGNORE INTO categories VALUES(?)',[name]);}
    else if(method!=='GET')fail('Método inválido.',405);
    return reply((await sql('SELECT name FROM categories ORDER BY name')).rows.map(row=>row.name));
   }
   if(action==='upload'&&method==='POST'){
    if(!process.env.BLOB_READ_WRITE_TOKEN)fail('Configure o armazenamento de imagens no servidor.',503);
    let form;try{form=await new Response(await rawBody(req,MAX_IMAGE+65536),{headers:{'Content-Type':req.headers['content-type']||''}}).formData();}catch(error){if(error instanceof HttpError)throw error;fail('Imagem inválida.');}
    const file=form.get('image');if(!file||typeof file.arrayBuffer!=='function'||file.size>MAX_IMAGE)fail('Envie uma imagem de até 4 MB.');
    const buffer=Buffer.from(await file.arrayBuffer());let type,size;
    try{type=await fileTypeFromBuffer(buffer);size=imageSize(buffer);}catch{fail('Imagem inválida.');}
    if(!type||!['image/jpeg','image/png','image/webp'].includes(type.mime)||!size?.width||!size.height||size.width>10000||size.height>10000)fail('Use uma imagem JPG, PNG ou WebP válida.');
    const blob=await put(`products/${id()}.${type.ext}`,buffer,{access:'public',contentType:type.mime,addRandomSuffix:false});
    await sql('INSERT OR IGNORE INTO media VALUES(?)',[blob.url]);return reply({path:blob.url});
   }
   if(action==='product-status'&&method==='POST'){
    const body=await json(req);if(typeof body.id!=='string'||typeof body.active!=='boolean')fail('Produto ou situação inválida.');
    const result=await sql("UPDATE products SET data=json_set(data,'$.active',json(?)) WHERE id=? RETURNING data",[JSON.stringify(body.active),body.id]);
    if(!result.rows.length)fail('Produto não encontrado.',404);return reply(JSON.parse(result.rows[0].data));
   }
   if(action==='products'&&method==='DELETE'){
    const body=await json(req);if(typeof body.id!=='string')fail('Produto inválido.');await sql('DELETE FROM products WHERE id=?',[body.id]);return reply({ok:true});
   }
   if((action==='products'||action==='import-product')&&method==='POST'){
    const body=await json(req),importing=action==='import-product',fresh=!body.id,productId=body.id||randomBytes(10).toString('hex');
    if(importing&&!body.id)fail('A importação exige o ID original do produto.');
    if(typeof productId!=='string'||!/^[a-f0-9]{20}$/.test(productId))fail('Produto inválido.');
    const oldResult=await sql('SELECT data FROM products WHERE id=?',[productId]),old=oldResult.rows[0]?JSON.parse(oldResult.rows[0].data):{};
    if(importing&&old.id)return reply(old);
    if(!importing&&!fresh&&!old.id)fail('Produto não encontrado.',404);
    const name=text(body.name??'',200),description=text(body.description??'',10000),category=text(body.category??'Geral',100);
    if(!name||!category)fail('Informe nome e categoria.');
    const price=money(body.price),stock=integer(!importing&&fresh&&(!body.stock||body.stock<0)?1:body.stock,1000000),active=!importing&&fresh?true:body.active;
    if(typeof active!=='boolean')fail('Situação inválida.');
    const images=body.images??[];if(!Array.isArray(images)||images.length>10)fail('Limite de 10 imagens.');
    for(const image of images){
     if(typeof image!=='string')fail('Imagem inválida.');
     if(/^images\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/i.test(image))continue;
     if(!(await sql('SELECT url FROM media WHERE url=?',[image])).rows.length)fail('Envie a imagem pelo painel.');
    }
    const rawSizes=body.sizes??old.sizes??[];if(!Array.isArray(rawSizes)||rawSizes.length>30)fail('Informe até 30 tamanhos.');
    const sizes=[...new Set(rawSizes.map(value=>text(value,30).toLocaleUpperCase('pt-BR')))];if(sizes.includes(''))fail('Tamanho inválido.');
    const compare=body.comparePrice===undefined?old.comparePrice:body.comparePrice,comparePrice=compare==null||compare===''?null:money(compare);
    const installmentCount=integer(body.installmentCount??old.installmentCount??0,24);
    const installmentValue=installmentCount?money(body.installmentValue??old.installmentValue):null;
    if(installmentCount&&(!installmentValue||installmentValue*installmentCount+0.01<price))fail('Revise o valor das parcelas.');
    const product={id:productId,name,description,category,price,stock,active,images,sizes,comparePrice,installmentCount,installmentValue,originalUrl:old.originalUrl||''};
    await sql(importing?'INSERT OR IGNORE INTO products(id,data) VALUES(?,?)':'INSERT INTO products(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',[productId,JSON.stringify(product)]);
    if(importing){const saved=await sql('SELECT data FROM products WHERE id=?',[productId]);return reply(JSON.parse(saved.rows[0].data));}
    await sql('INSERT OR IGNORE INTO categories VALUES(?)',[category]);return reply(product);
   }
   fail('Operação não encontrada.',404);
  }catch(error){if(!(error instanceof HttpError))console.error('Store API failed:',error.message);reply({error:error instanceof HttpError?error.message:'Não foi possível concluir. Verifique a configuração do servidor.'},error.status||500);}
 };
}
