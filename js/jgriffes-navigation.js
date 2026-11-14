import { readCart,whatsapp,productUrl } from './jgriffes-store-core.js';
try{if(localStorage.getItem('jg-cookie-notice')==='acknowledged')document.documentElement.classList.add('jg-cookie-acknowledged');}catch{}

const pages=new Set(['index.html','produtos.html','produto.html','carrinho.html','categorias.html','cadastro.html','atendimento.html','sobre.html','como-comprar.html','privacidade.html','trocas.html']);
const mapping={
 '/':'index.html','/produtos/':'produtos.html','/contato/':'atendimento.html',
 '/camiseta/':'produtos.html?categoria=camisetas','/calca-jeans/':'produtos.html?categoria=calcas',
 '/bermuda-jeans/':'produtos.html?categoria=bermudas','/bermuda-jordan/':'produtos.html?categoria=bermudas',
 '/conjunto/':'produtos.html?categoria=conjuntos','/moletom/':'produtos.html?categoria=moletons',
 '/sueter/':'produtos.html?categoria=sueteres','/tenis/':'produtos.html?categoria=tenis',
 '/polo/':'produtos.html?categoria=polos','/acessorios/':'produtos.html?categoria=acessorios',
 '/politica-de-privacidade/':'privacidade.html','/como-comprar/':'como-comprar.html',
 '/quem-somos/':'sobre.html','/trocas-e-devolucoes/':'trocas.html'
};
document.querySelectorAll('a[href]').forEach(a=>{
 const href=a.getAttribute('href');
 try{const url=new URL(href,location.href);if(url.origin===location.origin||/^(www\.)?jgriffes\.com(?:\.br)?$/.test(url.hostname)){if(mapping[url.pathname])a.href=mapping[url.pathname];}}catch{}
 const toggle=a.getAttribute('data-toggle');
 if(toggle==='#nav-hamburger')a.href='categorias.html';
 if(toggle==='#nav-search')a.href='produtos.html?buscar=1';
 if(toggle==='#modal-cart'){a.href='carrinho.html';a.setAttribute('aria-label','Abrir sacola de compras');}
 if(a.textContent.trim()==='Categorias')a.href='categorias.html';
 if(href==='#'){
  const text=a.textContent.trim().toLowerCase();
  if(text==='departamentos'||text==='produtos')a.href='categorias.html';
  if(text==='entre em contato')a.href='atendimento.html';
 }
 if(a.getAttribute('href')!=='#'&&!a.getAttribute('href').startsWith('#')){a.target='_blank';a.rel='noopener noreferrer';}
 if(!a.textContent.trim()&&!a.hasAttribute('aria-label')){const file=new URL(a.href,location.href).pathname.split('/').pop();const labels={'cadastro.html':'Abrir área do cliente','categorias.html':'Ver categorias','produtos.html':'Explorar produtos','index.html':'Voltar à loja'};if(labels[file])a.setAttribute('aria-label',labels[file]);}
});
function updateCart(){const count=readCart().reduce((sum,item)=>sum+item.quantity,0);document.querySelectorAll('.js-cart-widget-amount').forEach(n=>n.textContent=count);}
window.addEventListener('storage',updateCart);window.addEventListener('focus',updateCart);updateCart();
// Capture before legacy store handlers, so real page links are not swallowed by old modals.
window.addEventListener('click',event=>{
 const acknowledge=event.target.closest('.js-acknowledge-cookies');
 if(acknowledge){event.preventDefault();event.stopImmediatePropagation();document.documentElement.classList.add('jg-cookie-acknowledged');document.querySelectorAll('.js-notification-cookie-banner').forEach(n=>n.style.display='none');try{window.cookieNotificationService?.acknowledge();localStorage.setItem('jg-cookie-notice','acknowledged');}catch{}return;}
 const clear=event.target.closest('.js-empty-search');if(clear){event.preventDefault();event.stopImmediatePropagation();const input=clear.closest('form')?.querySelector('input[type="search"]');if(input){input.value='';input.focus();}return;}
 const buy=event.target.closest('.jg-product-card .jg-product-buy');
 if(buy){event.preventDefault();event.stopImmediatePropagation();if(buy.disabled)return;const card=buy.closest('[data-catalog-id]');if(card?.closest('[data-catalog-category]')?.swiper?.allowClick===false)return;if(card)window.open(productUrl(card.dataset.catalogId),'_blank','noopener,noreferrer');return;}
 const a=event.target.closest('a[href]');if(!a)return;
 const url=new URL(a.href,location.href),file=url.pathname.split('/').pop();
 if(url.origin===location.origin&&pages.has(file)){
  if(a.closest('[data-catalog-category]')?.swiper?.allowClick===false){event.preventDefault();event.stopImmediatePropagation();return;}
  a.target='_blank';a.rel='noopener noreferrer';event.stopImmediatePropagation();
 }
},true);
document.querySelectorAll('form.js-search-form').forEach(form=>{form.action='produtos.html';form.method='get';form.target='_blank';});
window.addEventListener('submit',event=>{
 const form=event.target;
 if(form.matches('form.js-search-form')){event.preventDefault();event.stopImmediatePropagation();const q=new FormData(form).get('q')||'';window.open(`produtos.html?q=${encodeURIComponent(q)}`,'_blank','noopener,noreferrer');}
 if(form.matches('[data-store="newsletter-form"],[data-store="home-newsletter-form"]')){
  event.preventDefault();event.stopImmediatePropagation();window.open(whatsapp('Olá! Gostaria de receber informações sobre novidades e lançamentos da J Griffes.'),'_blank','noopener,noreferrer');
 }
},true);
document.querySelectorAll('[data-store="newsletter-form"],[data-store="home-newsletter-form"]').forEach(form=>{
 const newsletter=form.closest('.js-newsletter');newsletter?.querySelector('h2,.font-small.text-uppercase')?.replaceChildren(document.createTextNode('NOVIDADES J GRIFFES'));
 const intro=newsletter?.querySelector('p.mb-4');if(intro)intro.textContent='Quer saber dos próximos lançamentos? Fale com a nossa equipe.';
 form.removeAttribute('onsubmit');form.action='atendimento.html';form.method='get';form.target='_blank';
 form.querySelectorAll('input[type="email"]').forEach(input=>{input.required=false;input.hidden=true;input.disabled=true;input.closest('.form-group')?.classList.add('jg-newsletter-no-email');});
 form.querySelectorAll('input[type="submit"]').forEach(input=>input.value='PEDIR NOVIDADES');
 const note=document.createElement('p');note.className='jg-newsletter-note';note.textContent='Solicite as novidades da loja diretamente pelo WhatsApp.';form.prepend(note);
});
