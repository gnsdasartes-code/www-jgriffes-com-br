import { writeFile,readFile } from 'node:fs/promises';
export const pages={
 'produtos.html':['catalog','Produtos'],
 'produto.html':['product','Detalhes do produto'],
 'carrinho.html':['cart','Sua seleção'],
 'categorias.html':['categories','Categorias'],
 'atendimento.html':['contact','Fale com a J Griffes'],
 'sobre.html':['about','Quem somos'],
 'como-comprar.html':['buy','Como comprar'],
 'privacidade.html':['privacy','Privacidade e dados'],
 'trocas.html':['exchanges','Trocas e devoluções'],
 'cadastro.html':['customer','Área do cliente']
};
for(const [file,[page,title]] of Object.entries(pages))await writeFile(file,`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${title} na J Griffes. Moda masculina, produtos e atendimento da loja."><title>${title} | J Griffes</title><link rel="stylesheet" href="css/jgriffes-pages.css"><script type="module" src="js/jgriffes-pages.js"></script></head>
<body data-page="${page}"><div class="jg-announcement">J GRIFFES · MODA MASCULINA</div>
<header class="jg-header"><a class="jg-logo" href="index.html" aria-label="J Griffes — início"><img src="images/logo-j-griffes.jpg" alt="J Griffes" width="100" height="100"></a><nav aria-label="Menu principal"><a href="index.html">Início</a><a href="produtos.html">Produtos</a><a href="categorias.html">Categorias</a><a href="atendimento.html">Contato</a></nav><div class="jg-header-actions"><a href="produtos.html?buscar=1" aria-label="Buscar produtos">Buscar</a><a href="cadastro.html" aria-label="Área do cliente">Cliente</a><a href="carrinho.html" aria-label="Carrinho de compras">Sacola <span data-cart-count>0</span></a></div></header>
<main id="jg-page"><nav class="jg-breadcrumb" aria-label="Localização"><a href="index.html">Início</a><span aria-hidden="true">/</span><span>${title}</span></nav><div id="jg-content" aria-live="polite"><p>Carregando…</p></div><noscript>Ative o JavaScript para consultar os produtos. Você também pode falar com a loja pelo <a href="https://wa.me/5511925476299">WhatsApp</a>.</noscript></main>
<footer class="jg-footer"><div><strong>J GRIFFES</strong><p>Moda masculina e atendimento próximo.</p></div><nav aria-label="Informações da loja"><a href="sobre.html">Quem somos</a><a href="como-comprar.html">Como comprar</a><a href="trocas.html">Trocas e devoluções</a><a href="privacidade.html">Privacidade</a></nav><a href="https://www.instagram.com/J__griffes/" target="_blank" rel="noopener noreferrer">Instagram ↗</a></footer></body></html>`);
console.log(`${Object.keys(pages).length} páginas de navegação criadas.`);
