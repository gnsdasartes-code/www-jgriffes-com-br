# Administração J Griffes

## Servidor local configurado neste computador

PHP portátil instalado em `.runtime/php/`, com PDO SQLite, mbstring e fileinfo habilitados. Acesse o painel em `http://127.0.0.1:8080/admin/` e a loja em `http://127.0.0.1:8080/`. O login configurado foi validado contra o banco SQLite.

Para iniciar novamente após reiniciar o computador, execute `powershell -ExecutionPolicy Bypass -File .\iniciar-servidor.ps1` nesta pasta. O script usa `server-router.php` para bloquear arquivos privados, porque o servidor embutido do PHP não interpreta `.htaccess`. Este servidor é local, acessível apenas neste computador; não publica o site na internet.

O painel está em `/admin/`. Esta entrega precisa ser instalada em um servidor PHP; abrir o HTML diretamente ou hospedar apenas arquivos estáticos não executa o banco, o login nem os uploads.

## Instalação

1. Use PHP 8.2 ou superior com PDO SQLite, mbstring e fileinfo. Sirva esta pasta como raiz do site. Use HTTPS em produção.
2. Dê ao processo PHP permissão de escrita somente em `storage/` e `uploads/`. Preserve essas duas pastas entre publicações.
3. Bloqueie completamente o acesso HTTP a `/storage/`. O arquivo `.htaccess` fornecido faz isso no Apache com `AllowOverride` habilitado. Em Nginx configure `location ^~ /storage/ { deny all; }` e impeça execução de scripts em `/uploads/`; permita ali somente arquivos estáticos. Desative listagem de diretórios.
4. O administrador `gnsdasartes@gmail.com` é criado automaticamente no primeiro acesso à API, com a senha definida pelo proprietário, armazenada apenas como hash em `admin/initial-admin.php`. Inclua esse arquivo na instalação. Para redefinir a senha ou autorizar outro administrador, execute `php admin/create-admin.php` no terminal do servidor; esse comando exige uma nova senha de pelo menos 12 caracteres. Não existe cadastro público.
5. Entre em `https://SEU-DOMINIO/admin/` com as credenciais criadas. Para desenvolvimento local: `php -S 127.0.0.1:8080` nesta pasta, depois `http://127.0.0.1:8080/admin/`.

## Operação

O catálogo foi esvaziado a pedido do proprietário. Não há importação automática de produtos do HTML. Todos os produtos devem ser cadastrados pelo painel; a vitrine consulta o mesmo banco SQLite.

Crie categorias, adicione ou edite produtos, envie até dez fotos por produto (JPG, PNG ou WebP, 5 MB cada), ajuste preço e estoque e salve. As fotos enviadas aparecem no editor antes de salvar o produto. Remova fotos no editor para substituí-las. Produtos desativados desaparecem da vitrine; produtos sem estoque permanecem visíveis e não abrem a compra. A vitrine consulta a API ao abrir, ao retornar à aba e a cada 15 segundos. A compra existente continua pelo WhatsApp; estoque é informativo e precisa ser ajustado pelo administrador após a venda, pois não existe checkout ou confirmação automática de pagamento neste projeto.

Faça backup consistente de `storage/store.sqlite` (com a API de backup do SQLite ou com o serviço parado, incluindo arquivos WAL pendentes) e de `uploads/`. Fotos removidas do produto são mantidas no disco para evitar quebrar referências; limpeza de arquivos órfãos deve ser feita durante manutenção com backup.

## Verificação antes de produção

- Faça login, crie um produto com foto, categoria e estoque; abra a vitrine em sessão anônima e confira os dados.
- Edite preço e foto, desative e exclua o produto, confirmando os resultados na vitrine após atualização.
- Reinicie o servidor e confira persistência; teste logout, senha incorreta e bloqueio de acesso à API sem sessão.
- Confirme que `/storage/store.sqlite` retorna 403/404 e que uploads não executam scripts.

Não foi possível executar PHP ou testes de navegador neste ambiente, pois não há runtime PHP instalado. Não houve publicação nem alteração na hospedagem existente. O endereço público real será o domínio em que estes arquivos forem instalados, seguido de `/admin/`.

No formulário de produto, a seção “Desconto e parcelamento” permite informar o preço anterior, o número de parcelas e o valor real de cada parcela. O desconto percentual é calculado automaticamente quando o preço anterior é maior que o atual. Campos não preenchidos não geram condições de pagamento fictícias. Com duas fotos ou mais, a segunda aparece com fade ao passar o mouse. Os tamanhos continuam disponíveis na janela de compra.
