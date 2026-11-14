let ready;
export function resetDatabaseConnection(){ready=undefined;}
export async function sql(statement,args=[]){
 const raw=process.env.TURSO_DATABASE_URL;
 if(!raw||!process.env.TURSO_AUTH_TOKEN)throw new Error('Database is not configured');
 const url=new URL(raw.replace(/^libsql:/,'https:'));
 if(url.protocol!=='https:')throw new Error('Database requires HTTPS');
 const encode=value=>value===null?{type:'null'}:typeof value==='number'?{type:Number.isInteger(value)?'integer':'float',value:Number.isInteger(value)?String(value):value}:{type:'text',value:String(value)};
 const response=await fetch(new URL('/v2/pipeline',url),{method:'POST',headers:{Authorization:`Bearer ${process.env.TURSO_AUTH_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({requests:[{type:'execute',stmt:{sql:statement,args:args.map(encode),want_rows:true}},{type:'close'}]}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error(`Database HTTP ${response.status}`);
 const payload=await response.json(),result=payload.results?.[0];
 if(result?.type!=='ok'||result.response?.type!=='execute')throw new Error('Database query failed');
 const data=result.response.result;
 return {rows:(data.rows||[]).map(row=>Object.fromEntries(row.map((value,i)=>[data.cols[i].name,value.type==='null'?null:value.type==='integer'||value.type==='float'?Number(value.value):value.value]))),affected:Number(data.affected_row_count||0)};
}
export async function initialize(){
 if(!ready)ready=(async()=>{
  for(const statement of [
   'CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,data TEXT NOT NULL)',
   'CREATE TABLE IF NOT EXISTS categories(name TEXT PRIMARY KEY)',
   'CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,email TEXT NOT NULL,csrf TEXT NOT NULL,expires INTEGER NOT NULL)',
   'CREATE TABLE IF NOT EXISTS attempts(ip TEXT PRIMARY KEY,count INTEGER NOT NULL,started INTEGER NOT NULL)',
   'CREATE TABLE IF NOT EXISTS media(url TEXT PRIMARY KEY)',
   "INSERT OR IGNORE INTO categories VALUES('Geral'),('Camisetas'),('Calças')"
  ])await sql(statement);
 })().catch(error=>{ready=undefined;throw error;});
 await ready;
}
