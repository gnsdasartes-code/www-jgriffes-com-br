import { test,expect } from '@playwright/test';
test.beforeEach(async({context})=>{await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());});
test('ícones de categoria, pesquisa e sacola abrem destinos em novas abas',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('a[data-toggle="#nav-hamburger"]')?.getAttribute('href')==='categorias.html');
 const menu=page.waitForEvent('popup');await page.getByRole('link',{name:'Categorias',exact:true}).first().click();const categories=await menu;await expect(categories).toHaveURL(/categorias\.html/);await expect(categories.locator('h1')).toHaveText('Categorias');await categories.close();
 const cart=page.waitForEvent('popup');await page.locator('a[data-toggle="#modal-cart"]:visible').first().click();const selection=await cart;await expect(selection).toHaveURL(/carrinho\.html/);await expect(selection.locator('h1')).toHaveText('Sua seleção');await selection.close();
 const search=page.locator('form.js-search-form:visible').first();await search.locator('input[name="q"]').fill('busca sem resultado 123456');const opened=page.waitForEvent('popup');await search.locator('button[type="submit"]').click();const result=await opened;await expect(result).toHaveURL(/produtos\.html\?q=/);await expect(result.locator('h2')).toContainText('Nenhum produto');
});
test('foto abre detalhes, tamanho é obrigatório e sacola persiste entre abas',async({page,context})=>{
 const response=await page.request.get('/api/index.php?action=products');const available=(await response.json()).find(p=>p.stock>0);test.skip(!available,'É necessário um produto ativo para verificar a compra.');
 await page.goto(`/produto.html?id=${available.id}`);await expect(page.locator('h1')).toHaveText(available.name);
 if(available.sizes?.length){await page.getByRole('button',{name:'Adicionar à sacola',exact:true}).click();await expect(page.locator('#jg-page-status')).toHaveText('Selecione o tamanho da peça.');await page.locator('.jg-size-options button').first().click();}
 await page.getByRole('button',{name:'Adicionar à sacola',exact:true}).click();await expect(page.locator('#jg-page-status')).toHaveText('Produto adicionado à sacola.');
 const popup=page.waitForEvent('popup');await page.locator('#jg-open-cart').click();const cart=await popup;await expect(cart.locator('.jg-cart-row h2')).toHaveText(available.name);await expect(cart.getByRole('button',{name:'Enviar pedido pelo WhatsApp'})).toBeEnabled();
 await cart.getByRole('button',{name:`Remover ${available.name} da sacola`}).click();await expect(cart.locator('.jg-empty h2')).toHaveText('Sua sacola está vazia.');
});
test('destinos institucionais carregam e layout móvel não transborda',async({page})=>{
 for(const file of ['atendimento.html','sobre.html','como-comprar.html','trocas.html','privacidade.html','cadastro.html']){await page.goto('/'+file);await expect(page.locator('h1')).toBeVisible();await expect(page.locator('#jg-content')).not.toContainText('Carregando…');}
 await page.setViewportSize({width:390,height:844});await page.goto('/produtos.html');await expect(page.locator('h1')).toHaveText('Todos os produtos');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('menu e busca móveis abrem destinos específicos',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('a[data-toggle="#nav-hamburger"]')?.getAttribute('href')==='categorias.html');
 const popup=page.waitForEvent('popup');await page.locator('a[data-toggle="#nav-hamburger"]:visible').click();const menu=await popup;await expect(menu.locator('h1')).toHaveText('Categorias');await menu.close();
 const form=page.locator('form.js-search-form:visible').first();await form.locator('input[name="q"]').fill('camiseta');const search=page.waitForEvent('popup');await form.locator('button[type="submit"]').click();const target=await search;await expect(target).toHaveURL(/produtos\.html\?q=camiseta/);await expect(target.getByRole('searchbox',{name:'Buscar produtos'})).toHaveValue('camiseta');
});
test('links locais da página inicial apontam para páginas existentes',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('script[src*="jgriffes-navigation"]'));
 const links=await page.locator('a[href]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.href).filter(h=>{const u=new URL(h);return u.origin===location.origin&&/\.html$/.test(u.pathname);} ))]);
 for(const url of links){const response=await page.request.get(url);expect(response.status(),url).toBe(200);}
});
