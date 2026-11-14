import { products,node,money,normalize,matchesCategory,productUrl,whatsapp,readCart,writeCart,addToCart } from './jgriffes-store-core.js';
const root=document.getElementById('jg-content'),page=document.body.dataset.page,params=new URLSearchParams(location.search);
const categories=[['camisetas','Camisetas'],['calcas','Calças'],['bermudas','Bermudas'],['conjuntos','Conjuntos'],['moletons','Moletons'],['sueteres','Suéteres'],['tenis','Tênis'],['polos','Polos'],['acessorios','Acessórios']];
function link(label,href,cls='jg-button'){const a=node('a',cls,label);a.href=href;return a;}
function heading(title,intro){root.replaceChildren(node('div','jg-kicker','J Griffes · Loja online'),node('h1','',title));if(intro)root.append(node('p','jg-intro',intro));document.title=`${title} | J Griffes`;}
function empty(title,text,href='produtos.html',label='Ver produtos'){const block=node('div','jg-empty');block.append(node('h2','',title),node('p','',text),link(label,href));return block;}
function status(text){let output=document.getElementById('jg-page-status');if(!output){output=node('p','jg-status');output.id='jg-page-status';output.setAttribute('role','status');root.append(output);}output.textContent=text;}
function card(p){
 const article=node('article','jg-card'),photo=link('',productUrl(p.id),'jg-card-photo');photo.setAttribute('aria-label',`Ver ${p.name}`);
 if(p.images[0]){const img=node('img');img.src=p.images[0];img.alt=p.name;img.loading='lazy';photo.append(img);}else photo.append(node('span','','Sem foto'));
 const info=node('div','jg-card-info'),title=node('h2');title.append(link(p.name,productUrl(p.id),''));info.append(title);
 if(p.comparePrice>p.price)info.append(node('div','jg-discount',`-${Math.round((1-p.price/p.comparePrice)*100)}% OFF`));
 const price=node('div');price.append(node('strong','jg-price',money(p.price)));if(p.comparePrice>p.price)price.append(node('del','jg-compare',money(p.comparePrice)));info.append(price);
 if(p.installmentCount>0&&p.installmentValue>0)info.append(node('div','jg-installments',`${p.installmentCount}x de ${money(p.installmentValue)}`));
 info.append(link(p.stock>0?'COMPRAR':'VER PRODUTO',productUrl(p.id)));article.append(photo,info);return article;
}
async function catalog(){
 const all=await products(),initial=params.get('categoria')||'',categoryTitle=categories.find(([key])=>key===initial)?.[1]||initial;
 heading(initial?categoryTitle:'Todos os produtos','Escolha sua próxima peça. Consulte fotos, tamanhos e disponibilidade antes de comprar.');
 const form=node('form','jg-toolbar');form.setAttribute('role','search');
 const search=node('input');search.type='search';search.name='q';search.placeholder='Buscar produto ou descrição';search.setAttribute('aria-label','Buscar produtos');search.value=params.get('q')||'';
 const select=node('select');select.setAttribute('aria-label','Filtrar por categoria');select.name='categoria';const option=node('option','','Todas as categorias');option.value='';select.append(option);
 const options=[...categories];for(const c of [...new Set(all.map(p=>p.category))])if(c&&normalize(c)!=='geral'&&!options.some(([key,label])=>normalize(label)===normalize(c)))options.push([c,c]);
 options.forEach(([key,label])=>{const o=node('option','',label);o.value=key;select.append(o);});select.value=initial;
 if(initial&&!select.value){const o=node('option','',categoryTitle);o.value=initial;select.append(o);select.value=initial;}
 const sort=node('select');sort.setAttribute('aria-label','Ordenar produtos');[['recent','Mais recentes'],['low','Menor preço'],['high','Maior preço'],['name','Nome de A a Z']].forEach(([key,label])=>{const o=node('option','',label);o.value=key;sort.append(o);});
 const submit=node('button','','Buscar');submit.type='submit';form.append(search,select,sort,submit);const count=node('p'),grid=node('div','jg-grid');root.append(form,count,grid);
 function render(){const q=normalize(search.value);let filtered=all.filter(p=>matchesCategory(p,select.value)&&normalize(`${p.name} ${p.description} ${p.category} ${(p.sizes||[]).join(' ')}`).includes(q));
  if(sort.value==='low')filtered.sort((a,b)=>a.price-b.price);if(sort.value==='high')filtered.sort((a,b)=>b.price-a.price);if(sort.value==='name')filtered.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  count.textContent=`${filtered.length} ${filtered.length===1?'produto encontrado':'produtos encontrados'}`;grid.replaceChildren(...filtered.map(card));
  if(!filtered.length){grid.style.display='block';grid.append(empty('Nenhum produto por aqui ainda.','Experimente outra busca ou consulte a loja sobre o modelo que você procura.','atendimento.html','Falar com a loja'));}else grid.style.removeProperty('display');
  const url=new URL(location.href);search.value.trim()?url.searchParams.set('q',search.value.trim()):url.searchParams.delete('q');select.value?url.searchParams.set('categoria',select.value):url.searchParams.delete('categoria');history.replaceState({},'',url);
 }
 form.onsubmit=e=>{e.preventDefault();render();};search.oninput=render;select.onchange=render;sort.onchange=render;render();if(params.has('buscar'))search.focus();
}
async function detail(){
 const p=(await products()).find(p=>p.id===params.get('id'));if(!p){heading('Produto indisponível');root.append(empty('Esta peça não está disponível.','Ela pode ter sido desativada ou removida. Veja os produtos disponíveis na loja.'));return;}
 heading(p.name);const layout=node('div','jg-product'),gallery=node('div'),photo=node('img','jg-main-photo');photo.alt=p.name;
 if(p.images[0]){photo.src=p.images[0];gallery.append(photo);}else gallery.append(empty('Foto em preparação','Consulte a loja para saber mais sobre esta peça.','atendimento.html','Pedir fotos'));
 const thumbs=node('div','jg-thumbs');p.images.forEach((src,index)=>{const button=node('button'),img=node('img');button.type='button';button.setAttribute('aria-label',`Ver foto ${index+1}`);button.setAttribute('aria-pressed',String(index===0));img.src=src;img.alt=`${p.name}, foto ${index+1}`;button.append(img);button.onclick=()=>{photo.src=src;thumbs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};thumbs.append(button);});if(p.images.length>1)gallery.append(thumbs);
 const info=node('div','jg-product-detail');info.append(node('p','jg-kicker',p.category||'J Griffes'));
 if(p.comparePrice>p.price)info.append(node('div','jg-discount',`-${Math.round((1-p.price/p.comparePrice)*100)}% OFF`));
 const price=node('div');price.append(node('strong','jg-price',money(p.price)));if(p.comparePrice>p.price)price.append(node('del','jg-compare',money(p.comparePrice)));info.append(price);
 if(p.installmentCount>0&&p.installmentValue>0)info.append(node('p','',`${p.installmentCount}x de ${money(p.installmentValue)}`));
 info.append(node('p','',p.stock>0?'Disponível para compra':'Produto esgotado'));let selected='';
 if(p.sizes?.length){const field=node('fieldset');field.append(node('legend','','Escolha o tamanho'));const sizes=node('div','jg-size-options');p.sizes.forEach(size=>{const b=node('button','',size);b.type='button';b.setAttribute('aria-pressed','false');b.onclick=()=>{selected=size;sizes.querySelectorAll('button').forEach(v=>v.setAttribute('aria-pressed',String(v===b)));};sizes.append(b);});field.append(sizes);info.append(field);}
 const label=node('label','','Quantidade'),quantity=node('input');quantity.id='jg-quantity';quantity.type='number';quantity.min='1';quantity.max=String(Math.max(1,p.stock));quantity.step='1';quantity.value='1';label.htmlFor=quantity.id;
 const actions=node('div','jg-product-actions'),add=node('button','','Adicionar à sacola'),buy=node('button','','Comprar pelo WhatsApp');add.type=buy.type='button';add.disabled=buy.disabled=p.stock<1;actions.append(quantity,add,buy);info.append(label,actions);
 function validate(){const q=Number(quantity.value);if(p.sizes?.length&&!selected)throw Error('Selecione o tamanho da peça.');if(!Number.isInteger(q)||q<1||q>p.stock)throw Error('Informe uma quantidade dentro do estoque disponível.');return q;}
 add.onclick=()=>{try{addToCart(p,selected,validate());status('Produto adicionado à sacola.');if(!document.getElementById('jg-open-cart')){const a=link('Ver minha sacola','carrinho.html');a.id='jg-open-cart';info.append(a);}}catch(error){status(error.message);}};
 buy.onclick=()=>{try{const q=validate();window.open(whatsapp(['Olá! Gostaria de comprar na J Griffes:',p.name,selected?`Tamanho: ${selected}`:'',`Quantidade: ${q}`,`Preço unitário: ${money(p.price)}`,location.href].filter(Boolean).join('\n')),'_blank','noopener,noreferrer');}catch(error){status(error.message);}};
 const description=node('section','jg-description');description.append(node('h2','','Sobre a peça'),node('p','',p.description||'Fale com a J Griffes para consultar os detalhes desta peça.'),link('Consultar entrega e condições',whatsapp(`Olá! Quero consultar entrega e condições de compra para ${p.name}.`),'jg-button secondary'));info.append(description);layout.append(gallery,info);root.append(layout);
}
let cartRender=0;
async function cart(){
 const version=++cartRender,all=await products();if(version!==cartRender)return;heading('Sua seleção','Revise as peças e os tamanhos. O pedido será combinado diretamente com a loja pelo WhatsApp.');
 const items=readCart();if(!items.length){root.append(empty('Sua sacola está vazia.','Escolha seus produtos favoritos para começar.'));return;}
 const layout=node('div','jg-cart-layout'),list=node('div'),summary=node('aside','jg-summary'),problems=[];let total=0;
 const totals=new Map();items.forEach(item=>totals.set(item.id,(totals.get(item.id)||0)+item.quantity));
 items.forEach((item,index)=>{const p=all.find(p=>p.id===item.id),row=node('article','jg-cart-row'),info=node('div');
  if(p?.images[0]){const img=node('img');img.src=p.images[0];img.alt=p.name;row.append(img);}else row.append(node('div'));
  const h=node('h2');h.append(p?link(p.name,productUrl(p.id),''):node('span','','Produto indisponível'));info.append(h);if(item.size)info.append(node('p','',`Tamanho: ${item.size}`));
  let invalid=!p||p.stock<totals.get(item.id)||(p.sizes?.length&&!p.sizes.includes(item.size));if(invalid){problems.push(item.id);info.append(node('p','jg-status','Revise este item: estoque, tamanho ou disponibilidade foram alterados.'));}
  if(p){info.append(node('strong','jg-price',money(p.price*item.quantity)));total+=p.price*item.quantity;const label=node('label','','Quantidade'),q=node('input');q.type='number';q.value=String(item.quantity);q.min='1';q.max=String(Math.max(1,p.stock-(totals.get(item.id)-item.quantity)));q.setAttribute('aria-label',`Quantidade de ${p.name}`);q.onchange=()=>{const value=Number(q.value);if(!Number.isInteger(value)||value<1||value>Number(q.max)){q.value=String(item.quantity);status('A quantidade deve respeitar o estoque disponível.');return;}try{const next=readCart();next[index].quantity=value;writeCart(next);cart().catch(e=>status(e.message));}catch(e){status(e.message);}};label.append(q);info.append(label);}
  const remove=node('button','remove','Remover');remove.type='button';remove.setAttribute('aria-label',`Remover ${p?.name||'produto'} da sacola`);remove.onclick=()=>{try{const next=readCart();next.splice(index,1);writeCart(next);cart().catch(e=>status(e.message));}catch(e){status(e.message);}};row.append(info,remove);list.append(row);
 });
 summary.append(node('h2','','Resumo'),node('p','',`${items.reduce((s,i)=>s+i.quantity,0)} peça(s) selecionada(s)`),node('strong','',money(total)),node('p','','Entrega e pagamento serão confirmados com a loja. Nenhuma cobrança é feita nesta página.'));
 const checkout=node('button','','Enviar pedido pelo WhatsApp');checkout.disabled=problems.length>0;checkout.onclick=async()=>{checkout.disabled=true;try{
  const fresh=await products(),current=readCart();if(JSON.stringify(current)!==JSON.stringify(items)||items.some(i=>JSON.stringify(all.find(p=>p.id===i.id))!==JSON.stringify(fresh.find(p=>p.id===i.id)))){await cart();status('Os produtos foram atualizados. Revise a seleção e confirme novamente.');return;}
  const text=['Olá! Gostaria de fazer este pedido na J Griffes:',...items.map(i=>{const p=fresh.find(p=>p.id===i.id);return `${p.name}${i.size?' · Tamanho: '+i.size:''} · Quantidade: ${i.quantity} · ${money(p.price*i.quantity)}`;}),`Total dos produtos: ${money(total)}`,'Quero combinar entrega e pagamento.'].join('\n');
  const a=link('Abrir pedido no WhatsApp',whatsapp(text));a.target='_blank';a.rel='noopener noreferrer';summary.append(a);a.click();
 }catch(e){status(e.message);}finally{checkout.disabled=problems.length>0;}};summary.append(checkout);if(problems.length)summary.append(node('p','jg-status','Remova ou ajuste os itens indisponíveis para continuar.'));layout.append(list,summary);root.append(layout);
}
function panels(title,intro,entries){heading(title,intro);const grid=node('div','jg-panel-grid');entries.forEach(([name,description,href,label])=>{const box=node('article','jg-panel');box.append(node('h2','',name),node('p','',description),link(label||'Abrir',href));grid.append(box);});root.append(grid);}
function information(){
 const contents={
  about:['Quem somos','A J Griffes reúne moda masculina e atendimento direto para ajudar você a escolher a próxima peça.',[['Seu estilo, sua escolha','Explore camisetas, calças e outras categorias. Os produtos disponíveis são atualizados pelo catálogo da loja.'],['Atendimento próximo','Dúvidas sobre medidas, fotos, tamanhos ou entrega? Converse com a equipe antes de confirmar o pedido.']]],
  buy:['Como comprar','Da escolha da peça à confirmação com a loja.',[['1. Explore o catálogo','Abra uma categoria ou use a busca para encontrar sua peça. Confira as fotos e a descrição na página do produto.'],['2. Escolha tamanho e quantidade','Selecione um tamanho disponível e informe a quantidade. Você pode comprar diretamente ou reunir várias peças na sacola.'],['3. Confirme pelo WhatsApp','Envie a seleção e combine entrega, pagamento e demais condições com a loja. O envio da mensagem não efetua uma cobrança.'],['4. Acompanhe seu pedido','Depois da confirmação com a equipe, use a Área do cliente para solicitar informações sobre sua compra.']]],
  exchanges:['Trocas e devoluções','Solicite atendimento para sua compra.',[['Como solicitar','Fale com a equipe pelo WhatsApp, informando a referência do pedido, a peça e o motivo do contato. Se houver um problema com o produto, descreva o ocorrido e envie fotos pelo atendimento.'],['Antes de enviar a peça','Solicite as orientações da loja sobre procedimento, endereço e condições aplicáveis ao seu pedido. Não envie o produto sem combinar o recebimento com a equipe.'],['Precisa de outro tamanho?','Consulte a disponibilidade do tamanho desejado no catálogo e peça orientação para a troca.']]],
  privacy:['Privacidade e dados','Informações sobre os recursos disponíveis nesta loja.',[['Sua seleção de produtos','A sacola é salva no armazenamento local do seu navegador para manter os itens ao trocar de aba. Você pode remover as peças na página da sacola ou limpar os dados do site no navegador.'],['Atendimento pelo WhatsApp','Ao escolher enviar um pedido, o link leva ao WhatsApp com a seleção de produtos. Revise a mensagem antes de enviá-la. O atendimento também está sujeito às condições desse serviço externo.'],['Recursos externos','O site utiliza recursos externos, como fontes e links para redes sociais. Ao acessar esses serviços, consulte as informações de privacidade fornecidas por eles.'],['Dúvidas sobre seus dados','Entre em contato com a J Griffes para solicitar informações sobre o uso dos dados enviados durante seu atendimento ou sua compra. Não envie senhas ou dados completos de cartão pelo formulário de atendimento.']]]
 };
 const [title,intro,sections]=contents[page];heading(title,intro);const article=node('article','jg-article');sections.forEach(([h,p])=>{const section=node('section');section.append(node('h2','',h),node('p','',p));article.append(section);});article.append(link(page==='exchanges'?'Solicitar troca ou devolução':'Falar com a loja',whatsapp(page==='exchanges'?'Olá! Preciso de atendimento sobre troca ou devolução de uma compra.':'Olá! Gostaria de falar com a J Griffes.')));root.append(article);
}
function contact(){
 panels('Fale com a J Griffes','Escolha o assunto para falar com a equipe certa.',[
  ['Produtos e tamanhos','Consulte medidas, fotos, disponibilidade e sugestões.',whatsapp('Olá! Gostaria de tirar uma dúvida sobre um produto.'),'Consultar produto'],
  ['Entrega e pagamento','Informe sua cidade e consulte as condições para o seu pedido.',whatsapp('Olá! Quero consultar entrega e formas de pagamento.'),'Consultar condições'],
  ['Meu pedido','Peça uma atualização sobre uma compra já confirmada.',whatsapp('Olá! Gostaria de acompanhar meu pedido.'),'Acompanhar compra'],
  ['Trocas e devoluções','Veja como solicitar ajuda com uma peça comprada.','trocas.html','Ver orientações'],
  ['Instagram','Acompanhe as novidades da J Griffes.','https://www.instagram.com/J__griffes/','Abrir Instagram'],
  ['Novidades','Peça à equipe para receber informações sobre os próximos lançamentos.',whatsapp('Olá! Gostaria de receber novidades e lançamentos da J Griffes.'),'Pedir novidades']
 ]);
}
function customer(){
 panels('Área do cliente','Seu ponto de contato para acompanhar compras e receber ajuda da loja.',[
  ['Acompanhar meu pedido','Solicite à equipe o andamento de uma compra já confirmada.',whatsapp('Olá! Quero acompanhar o andamento do meu pedido.'),'Consultar pedido'],
  ['Minha sacola','Continue escolhendo ou revise as peças antes de enviar seu pedido.','carrinho.html','Ver seleção'],
  ['Atualizar meus dados','Peça à loja uma atualização dos dados usados no atendimento de sua compra.',whatsapp('Olá! Preciso atualizar meus dados de atendimento de uma compra.'),'Solicitar atualização'],
  ['Trocar uma peça','Veja as orientações para entrar em contato sobre uma troca.','trocas.html','Consultar troca'],
  ['Receber novidades','Converse com a equipe para solicitar avisos sobre lançamentos.',whatsapp('Olá! Gostaria de receber novidades da J Griffes.'),'Solicitar novidades'],
  ['Preciso de ajuda','Escolha um assunto e fale com a J Griffes.','atendimento.html','Abrir atendimento']
 ]);
 root.append(node('p','jg-newsletter-note','As compras são atendidas pelo WhatsApp. Não é necessário criar senha para consultar produtos ou enviar sua seleção.'));
}
function updateCount(){const count=readCart().reduce((s,i)=>s+i.quantity,0);document.querySelectorAll('[data-cart-count]').forEach(n=>n.textContent=count);}
window.addEventListener('jg-cart-change',updateCount);window.addEventListener('storage',()=>{updateCount();if(page==='cart')cart().catch(e=>status(e.message));});updateCount();
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||a.href.startsWith('mailto:')||a.href.startsWith('tel:'))return;a.target='_blank';a.rel='noopener noreferrer';});
try{
 if(page==='catalog')await catalog();else if(page==='product')await detail();else if(page==='cart')await cart();else if(page==='categories')panels('Categorias','Encontre a peça certa para o seu estilo.',categories.map(([key,title])=>[title,`Explore os produtos de ${title.toLocaleLowerCase('pt-BR')} disponíveis na loja.`,`produtos.html?categoria=${key}`,'Ver produtos']));else if(page==='contact')contact();else if(page==='customer')customer();else information();
}catch(error){heading('Vamos tentar novamente?');root.append(empty('Não conseguimos carregar esta página.',error.message,location.href,'Tentar novamente'));}
