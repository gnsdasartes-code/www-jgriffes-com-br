import { readFile,writeFile } from 'node:fs/promises';
let html=await readFile('index.html','utf8');
const map={
 '/':'index.html','/produtos/':'produtos.html','/contato/':'atendimento.html',
 '/camiseta/':'produtos.html?categoria=camisetas','/calca-jeans/':'produtos.html?categoria=calcas',
 '/bermuda-jeans/':'produtos.html?categoria=bermudas','/bermuda-jordan/':'produtos.html?categoria=bermudas',
 '/conjunto/':'produtos.html?categoria=conjuntos','/moletom/':'produtos.html?categoria=moletons',
 '/sueter/':'produtos.html?categoria=sueteres','/tenis/':'produtos.html?categoria=tenis',
 '/polo/':'produtos.html?categoria=polos','/acessorios/':'produtos.html?categoria=acessorios',
 '/politica-de-privacidade/':'privacidade.html','/como-comprar/':'como-comprar.html',
 '/quem-somos/':'sobre.html','/trocas-e-devolucoes/':'trocas.html'
};
html=html.replace(/<a\b[^>]*>/g,tag=>{
 const match=/href="([^"]*)"/.exec(tag);if(!match)return tag;
 const original=match[1];let href=original;
 if(/^https?:\/\/(?:www\.)?jgriffes\.com(?:\.br)?(?:\/|$)/.test(href)){const url=new URL(href);href=map[url.pathname]||'produtos.html';}
 else if(map[href])href=map[href];
 if(tag.includes('data-toggle="#nav-hamburger"'))href='categorias.html';
 if(tag.includes('data-toggle="#nav-search"'))href='produtos.html?buscar=1';
 if(tag.includes('data-toggle="#modal-cart"'))href='carrinho.html';
 if(href==='#'&&tag.includes('js-toggle-menu-'))href='categorias.html';
 if(href==='#'&&tag.includes('js-accordion-private-toggle'))href='atendimento.html?assunto=cupom';
 if(href==='#'&&tag.includes('js-shipping-calculator-change-zipcode'))href='atendimento.html?assunto=entrega';
 if(href==='#'&&tag.includes('js-modal-close')&&!tag.includes('search-close-btn'))href='produtos.html';
 if(href==='mailto:veenuus.cs@gmail.com')href='atendimento.html';
 tag=tag.replace(/href="[^"]*"/,`href="${href}"`);
 if(href&&!href.startsWith('#')&&!/^(?:mailto|tel):/.test(href)){
  tag=tag.replace(/\s(?:target|rel)="[^"]*"/g,'');tag=tag.slice(0,-1)+' target="_blank" rel="noopener noreferrer">';
 }
 return tag;
});
html=html.replace(/action="\/search\/"/g,'action="produtos.html" target="_blank"');
html=html.replace(/<form\b[^>]*data-store="(?:home-)?newsletter-form"[^>]*>/g,tag=>tag.replace(/\s(?:action|method|onsubmit|target)="[^"]*"/g,'').replace(/>$/,' action="atendimento.html" method="get" target="_blank">'));
html=html.replace('veenuus.cs@gmail.com','Atendimento J Griffes');
html=html.replace(/Faça login/g,'Área do cliente').replace(/Ou cadastre-se/g,'Acompanhe sua compra').replace(/Iniciar sessão/g,'Área do cliente').replace(/Criar uma conta/g,'Atendimento ao cliente');
if(!html.includes('js/jgriffes-navigation.js'))html=html.replace('</body>','<script type="module" src="js/jgriffes-navigation.js?v=20261114-links"></script>\n</body>');
await writeFile('index.html',html);
console.log('Menus, ícones, categorias, banners e rodapé ligados às páginas da loja.');
