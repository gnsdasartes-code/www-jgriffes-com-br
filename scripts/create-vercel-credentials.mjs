import { randomBytes,pbkdf2Sync } from 'node:crypto';
import { mkdir,writeFile } from 'node:fs/promises';

// Generated privately; neither password nor secrets are printed to the console.
const password=randomBytes(24).toString('base64url'),salt=randomBytes(32);
const hash=pbkdf2Sync(password,salt,600000,32,'sha256').toString('hex');
const values={ADMIN_EMAIL:'gnsdasartes@gmail.com',ADMIN_PASSWORD_HASH:`pbkdf2_sha256:600000:${salt.toString('hex')}:${hash}`,SESSION_SECRET:randomBytes(48).toString('hex')};
await mkdir('.runtime',{recursive:true});
const target='.runtime/vercel-credentials.json';
await writeFile(target,JSON.stringify({password,environment:values},null,2),{flag:'wx',mode:0o600});
console.log(`Credenciais novas geradas em ${target}. Arquivo privado, excluído do Git e do deploy.`);
console.log('Configure somente os valores de environment nas variáveis de produção da Vercel.');
