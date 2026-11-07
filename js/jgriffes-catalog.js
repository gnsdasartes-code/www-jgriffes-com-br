(() => {
 'use strict';
 document.querySelectorAll('[data-catalog-category]').forEach(container=>{
 if(!container)return;
 let last='',products=[],slider=null;
 const shell=document.createElement('div');shell.className='jg-catalog-pager';container.before(shell);shell.append(container);
 container.classList.add('swiper-container');
 const controls=document.createElement('nav');controls.className='jg-catalog-controls';controls.setAttribute('aria-label','Navegar pelos produtos');
 const prev=document.createElement('button'),next=document.createElement('button'),status=document.createElement('span');
 prev.type=next.type='button';prev.className='jg-catalog-prev';next.className='jg-catalog-next';
 prev.setAttribute('aria-label','Produtos anteriores');next.setAttribute('aria-label','Próximos produtos');
 prev.innerHTML='<svg viewBox="0 0 256 512" aria-hidden="true"><path fill="currentColor" d="M248.5 33.1a25.59 25.59 0 0 0-36.2 0L7.5 237.9a25.59 25.59 0 0 0 0 36.2l204.8 204.8a25.6 25.6 0 0 0 36.2-36.2L61.8 256 248.5 69.3a25.59 25.59 0 0 0 0-36.2Z"/></svg>';
 next.innerHTML='<svg viewBox="0 0 256 512" aria-hidden="true"><path fill="currentColor" d="M7.5 69.3 194.2 256 7.5 442.7a25.6 25.6 0 0 0 36.2 36.2l204.8-204.8a25.59 25.59 0 0 0 0-36.2L43.7 33.1A25.6 25.6 0 0 0 7.5 69.3Z"/></svg>';
 status.className='jg-catalog-page';status.setAttribute('role','status');status.setAttribute('aria-live','polite');controls.append(prev,status,next);shell.append(controls);
 const tablet=matchMedia('(max-width:991px)'),mobile=matchMedia('(max-width:767px)'),small=matchMedia('(max-width:359px)');
 const visibleColumns=()=>small.matches?1:mobile.matches?2.25:5;
 function updateControls(){controls.hidden=!slider||slider.isLocked;prev.disabled=!slider||slider.isBeginning;next.disabled=!slider||slider.isEnd;status.textContent='';}
 function alignArrows(){const image=container.querySelector('.item-image');if(image)shell.style.setProperty('--jg-arrow-top',`${image.getBoundingClientRect().height/2+3}px`);}
 const layoutObserver=new ResizeObserver(alignArrows);layoutObserver.observe(container);
 function render(reset=false){
  const index=reset?0:slider?.activeIndex||0;
  slider?.destroy(true,true);slider=null;
  const track=node('div','swiper-wrapper jg-catalog-track');
  // One slide per column: drag advances a column, not a whole screen.
  // Keep the requested reading order: five above and five below.
  for(let i=0;i<products.length;i+=10){
   for(let col=0;col<Math.min(5,products.length-i);col++){
    const column=node('div','swiper-slide jg-catalog-column');
    column.append(card(products[i+col]));
    if(products[i+col+5])column.append(card(products[i+col+5]));
    track.append(column);
   }
  }
  container.dataset.rows=products.length>5?'2':'1';
  if(!products.length)track.append(node('p','jg-catalog-empty','Novidades em breve. Estamos preparando nossos produtos para você.'));
  container.replaceChildren(track);
  if(products.length&&typeof Swiper==='function')slider=new Swiper(container,{slidesPerView:visibleColumns(),slidesPerGroup:1,spaceBetween:15,initialSlide:Math.min(index,Math.max(0,track.children.length-Math.ceil(visibleColumns()))),loop:false,speed:matchMedia('(prefers-reduced-motion:reduce)').matches?0:300,grabCursor:true,watchOverflow:true,centerInsufficientSlides:true,watchSlidesProgress:true,watchSlidesVisibility:true,slideVisibleClass:'js-swiper-slide-visible',resistanceRatio:.85,threshold:5,preventClicks:true,preventClicksPropagation:true,on:{slideChange:updateControls,transitionEnd:updateControls,resize:alignArrows,imagesReady:alignArrows}});
  updateControls();alignArrows();
 }
 prev.onclick=()=>slider?.slidePrev();next.onclick=()=>slider?.slideNext();
 controls.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();event.key==='ArrowLeft'?slider?.slidePrev():slider?.slideNext();}});
 for(const breakpoint of [tablet,mobile,small])breakpoint.addEventListener('change',()=>render(true));
 const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
 function node(tag,cls,text){const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;}
 function card(p){
  const el=node('article','js-item-product jg-product-card');
  el.dataset.catalogId=p.id;el.dataset.catalogStock=p.stock;el.dataset.catalogDescription=p.description;el.dataset.catalogImages=JSON.stringify(p.images);
  const box=node('div','item-image'),link=node('a','item-link js-product-item-image-link-private');link.href='#produto-'+p.id;link.setAttribute('aria-label',p.name);
  if(p.images[0]){const img=node('img','product-item-image-featured');img.src=p.images[0];img.alt=p.name;img.loading='lazy';img.style.cssText='width:100%;aspect-ratio:3/4;object-fit:cover';link.append(img);}else{const empty=node('div','','Sem foto');empty.style.cssText='aspect-ratio:3/4;background:#f5f5f5;display:grid;place-items:center';link.append(empty);}
  if(p.images[1]){const secondary=node('img','jg-product-secondary');secondary.src=p.images[1];secondary.alt=p.name;secondary.loading='lazy';link.classList.add('jg-product-has-secondary');link.append(secondary);}
  box.append(link);
  const sizes=p.sizes||[];
  if(sizes.length){
   const group=node('div','js-product-variants-group');group.hidden=true;
   group.append(node('label','','Tamanho'));
   const select=document.createElement('select');select.name='variation_size';
   sizes.forEach(size=>{const option=document.createElement('option');option.value=size;option.textContent=size;select.append(option);});
   group.append(select);el.append(group);
  }
  const info=node('div','jg-product-info');
  info.append(node('div','js-item-name jg-product-name',p.name));
  const discounted=Number(p.comparePrice)>Number(p.price);
  if(discounted)info.append(node('div','jg-product-discount',`-${Math.round((1-p.price/p.comparePrice)*100)}% OFF`));
  const prices=node('div','jg-product-prices');
  prices.append(node('strong','js-price-display jg-product-price',money.format(p.price)));
  if(discounted)prices.append(node('del','js-compare-price-display jg-product-compare',money.format(p.comparePrice)));
  info.append(prices);
  if(p.installmentCount>0&&p.installmentValue>0)info.append(node('div','jg-product-installments',`${p.installmentCount}x de ${money.format(p.installmentValue)}`));
  if(p.stock<1)info.append(node('p','js-stock-label','Esgotado'));
  const buy=node('button','js-addtocart jg-product-buy',p.stock>0?'COMPRAR':'ESGOTADO');buy.type='button';buy.disabled=p.stock<1;
  if(p.stock>0){const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 564 512');icon.setAttribute('aria-hidden','true');icon.innerHTML='<path d="M542.31,138.44h-60c-.12-.13-.24-.26-.36-.39L359.23,15.34c-8.47-8.47-23.45-7.22-33.47,2.79-10.01,10.01-11.26,25-2.79,33.47l86.84,86.84H164.37L251.21,51.59c8.47-8.47,7.22-23.45-2.79-33.47-10.01-10.01-24.99-11.26-33.47-2.79l-122.71,122.71c-.13,.13-.24,.26-.36,.39H21.69c-11.98,0-21.69,11.48-21.69,25.64s9.71,25.64,21.69,25.64h29.6c-.04,3.11,.19,6.28,.75,9.47l43,270.17c4.26,24.58,25.58,42.54,50.52,42.54H431.07c24.94,0,46.26-17.96,50.52-42.54l44.42-270.17c.55-3.2,.78-6.36,.75-9.47h15.55c11.98,0,21.69-11.48,21.69-25.64s-9.71-25.64-21.69-25.64Zm-111.23,322.16H145.56L102.56,190.43H475.49l-44.42,270.17Zm-251.62-72.11V251.55c0-11.98,11.48-21.69,25.64-21.69s25.64,9.71,25.64,21.69v136.94c0,11.98-11.48,21.69-25.64,21.69s-25.64-9.71-25.64-21.69Zm86.77,0V251.55c0-11.98,11.48-21.69,25.64-21.69s25.64,9.71,25.64,21.69v136.94c0,11.98-11.48,21.69-25.64,21.69s-25.64-9.71-25.64-21.69Zm86.77,0V251.55c0-11.98,11.48-21.69,25.64-21.69s25.64,9.71,25.64,21.69v136.94c0,11.98-11.48,21.69-25.64,21.69s-25.64-9.71-25.64-21.69Z" fill="currentColor"/>';buy.append(icon);}
  info.append(buy);el.append(box,info);return el;
 }
 function matchesCategory(p){const category=(p.category||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();return container.dataset.catalogCategory==='calcas'?['calca','calcas'].includes(category):['','geral','camisa','camisas','camiseta','camisetas'].includes(category);}
 async function refresh(){try{
  const r=await fetch('api/index.php?action=products',{cache:'no-store'});if(!r.ok)throw Error('Catálogo indisponível');
  const incoming=(await r.json()).filter(p=>p.active&&matchesCategory(p)),signature=JSON.stringify(incoming);if(signature===last)return;last=signature;
  products=incoming;render();
 }catch(error){console.error('J Griffes:',error);if(!last)container.replaceChildren(node('p','col-12 text-center py-5','Não foi possível carregar os produtos. Atualize a página para tentar novamente.'));}}
 refresh();setInterval(()=>{if(!document.hidden)refresh();},15000);window.addEventListener('focus',refresh);
 });
})();
