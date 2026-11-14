# Publicação da loja e do admin na Vercel

O projeto agora inclui backend Node.js em `api/store.mjs`, banco remoto Turso (libSQL) e imagens em Vercel Blob. O backend PHP continua disponível para uso local. O endereço antigo `/api/index.php` é encaminhado para a função Node na Vercel, preservando a integração das páginas existentes.

## Serviços e variáveis necessários

No projeto Vercel conectado a este repositório:

1. Em Storage/Marketplace, conecte um banco **Turso/libSQL** e um armazenamento **Vercel Blob público**. Nenhum produto ou imagem depende do disco temporário das funções.
2. Configure as variáveis de ambiente de **Production**:

| Variável | Origem |
| --- | --- |
| `TURSO_DATABASE_URL` | URL libsql do banco Turso |
| `TURSO_AUTH_TOKEN` | Token privado do banco |
| `BLOB_READ_WRITE_TOKEN` | Conexão Vercel Blob |
| `ADMIN_EMAIL` | E-mail autorizado |
| `ADMIN_PASSWORD_HASH` | Hash gerado pelo comando abaixo |
| `SESSION_SECRET` | Segredo gerado pelo comando abaixo |

3. Execute `npm run credentials:vercel` localmente. Leia o arquivo privado `.runtime/vercel-credentials.json`: `password` é a nova senha de acesso; configure as entradas de `environment` na Vercel. A senha anterior, exposta no histórico público, não deve ser reutilizada. O comando não sobrescreve credenciais já geradas.
4. Não envie credenciais por chat, issues ou commits. Não use prefixos públicos como `NEXT_PUBLIC_` para esses valores. O arquivo `.env.example` é apenas um modelo.

## Transferir os produtos atuais

Crie `.env.production.local` no computador, com os três valores privados de conexão dos serviços, e execute:

```text
npm ci
npm run migrate:vercel
```

O comando lê o SQLite atual, transfere as fotos para Blob e cadastra os produtos no Turso. Mantém IDs, estoque, categorias, tamanhos, descontos e parcelas. Pode ser retomado: não sobrescreve produtos já existentes no banco online. A migração não transfere contas nem senhas locais. Preserve o banco e as fotos locais como backup até validar a loja publicada.

## Deploy

Importe o repositório em `https://vercel.com/new`, selecione o projeto existente se ele já estiver conectado e mantenha a configuração de `vercel.json`: Node 22, build `npm run build`, saída estática `public`. Publique somente depois de configurar as variáveis e migrar os produtos. Não crie um segundo projeto por engano.

O build copia apenas HTML e assets públicos. PHP, SQLite, credenciais, scripts de manutenção e dados locais não entram na saída pública. A senha não fica preenchida no formulário publicado.

Após o deploy, a loja será a URL retornada pela Vercel; o painel usa a mesma URL com `/admin/`. Use o e-mail configurado e a nova senha privada. As sessões duram uma hora, têm cookies HttpOnly/SameSite e são revogadas no logout. Todas as alterações autenticadas exigem CSRF; há limite persistente de tentativas de login.

## Validar

Execute `npm test` e `npm run build`. Depois do deploy, confira login/logout, upload, cadastro, edição e ativação em janela anônima. Confira também o catálogo depois de um novo deploy, para verificar persistência nos serviços externos. Uploads pela função têm limite de 4 MB para respeitar o limite de requisição da plataforma. A compra continua pelo WhatsApp.

Sem os serviços conectados, a API retorna erro de configuração; a publicação dos arquivos sozinha não configura banco, imagens ou login. Nenhuma publicação remota foi realizada apenas pela criação desses arquivos.
