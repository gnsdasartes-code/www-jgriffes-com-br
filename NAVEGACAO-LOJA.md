# Navegação da loja

A página inicial mantém a identidade visual e usa destinos locais para seus menus, categorias e banners. Os links de navegação abrem uma nova aba; setas de carrossel, limpeza da busca e confirmação de aviso continuam como controles da página.

| Clique | Destino |
| --- | --- |
| Menu / Categorias | `categorias.html` |
| Produto / Comprar | `produto.html?id=...` |
| Busca | `produtos.html?q=...` |
| Categoria / banner | `produtos.html?categoria=...` |
| Sacola | `carrinho.html` |
| Área do cliente | `cadastro.html` |
| Contato | `atendimento.html` |
| Quem somos | `sobre.html` |
| Como comprar | `como-comprar.html` |
| Trocas e devoluções | `trocas.html` |
| Privacidade | `privacidade.html` |

As páginas consultam a API existente. A sacola salva apenas IDs, tamanhos e quantidades no navegador; preços e disponibilidade são consultados novamente antes de montar o pedido. A compra segue pelo WhatsApp, com confirmação de entrega e pagamento pela loja.

A Área do cliente oferece acompanhamento e atendimento pelo WhatsApp. O antigo formulário público de cadastro, que não possuía backend, foi substituído por ações reais de atendimento. O login administrativo permanece em `/admin/`.

Os antigos formulários de newsletter agora permitem solicitar novidades pelo WhatsApp; não exibem uma inscrição automática em uma lista de e-mail inexistente.

Verificações: `npm run test:storefront` usa Chrome instalado e servidor PHP ativo em `http://127.0.0.1:8080`. `npm run build` inclui todos os destinos públicos na publicação Vercel. As mudanças locais precisam de um deploy para aparecer no domínio público.
