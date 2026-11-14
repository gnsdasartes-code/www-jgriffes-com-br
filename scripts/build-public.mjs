import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Only explicitly public assets enter the deployment output.
const output=resolve('public');
await mkdir(`${output}/admin`,{recursive:true});
for(const file of ['index.html','cadastro.html','produtos.html','produto.html','carrinho.html','categorias.html','atendimento.html','sobre.html','como-comprar.html','privacidade.html','trocas.html'])await cp(file,`${output}/${file}`);
for(const dir of ['css','js','images','videos'])await cp(dir,`${output}/${dir}`,{recursive:true});
for(const file of ['admin.css','admin.js'])await cp(`admin/${file}`,`${output}/admin/${file}`);
let html=await readFile('admin/index.html','utf8');
html=html.replace(/(name="password"[^>]*?)\svalue="[^"]*"/g,'$1');
await writeFile(`${output}/admin/index.html`,html);
console.log('Site e admin preparados. PHP, banco local e credenciais não são arquivos públicos.');
