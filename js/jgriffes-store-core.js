export const WHATSAPP='5511925476299';
export const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
export const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export const productUrl=id=>`produto.html?id=${encodeURIComponent(id)}`;
export const whatsapp=message=>`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
export const node=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export async function products(){const response=await fetch('api/index.php?action=products',{cache:'no-store'});if(!response.ok)throw Error('Não foi possível carregar os produtos. Tente novamente.');return (await response.json()).filter(p=>p.active);}
export function matchesCategory(p,category){
 const key=normalize(category),actual=normalize(p.category);
 const families={camisetas:['camiseta','camisetas','camisa','camisas','geral'],calcas:['calca','calcas','calca jeans','calcas jeans'],bermudas:['bermuda','bermudas','bermuda jeans','bermuda jordan'],tenis:['tenis','calcados','calcado'],conjuntos:['conjunto','conjuntos'],moletons:['moletom','moletons'],sueteres:['sueter','sueteres'],polos:['polo','polos'],acessorios:['acessorio','acessorios']};
 return !key||key==='todos'||(families[key]||[key]).includes(actual);
}
const CART='jg-cart-v1';
export function readCart(){try{const value=JSON.parse(localStorage.getItem(CART)||'[]');return Array.isArray(value)?value.filter(v=>v&&/^[a-f0-9]{20}$/.test(v.id)&&typeof v.size==='string'&&v.size.length<=30&&Number.isInteger(v.quantity)&&v.quantity>0).slice(0,100):[];}catch{return [];}}
export function writeCart(items){try{localStorage.setItem(CART,JSON.stringify(items));window.dispatchEvent(new Event('jg-cart-change'));}catch{throw Error('O navegador bloqueou o armazenamento do carrinho. Ative-o ou compre diretamente pelo WhatsApp.');}}
export function addToCart(product,size,quantity){
 if(!product.active||product.stock<1)throw Error('Este produto não está disponível.');
 if((product.sizes||[]).length&&!product.sizes.includes(size))throw Error('Selecione um tamanho disponível.');
 if(!Number.isInteger(quantity)||quantity<1||quantity>product.stock)throw Error('Revise a quantidade.');
 const cart=readCart(),existing=cart.find(v=>v.id===product.id&&v.size===size);
 const inCart=cart.filter(v=>v.id===product.id).reduce((sum,v)=>sum+v.quantity,0);
 if(inCart+quantity>product.stock)throw Error('A quantidade no carrinho ultrapassa o estoque disponível.');
 if(existing)existing.quantity+=quantity;else cart.push({id:product.id,size,quantity});writeCart(cart);
}
