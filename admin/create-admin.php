<?php
// CLI only: no public registration or default password.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
if(!extension_loaded('pdo_sqlite')) die("Ative pdo_sqlite.\n");
echo "E-mail do administrador: "; $email='gnsdasartes@gmail.com';
if(!filter_var($email,FILTER_VALIDATE_EMAIL)) die("E-mail inválido.\n");
echo "Senha (26012002Gns; entrada visível neste terminal): ";$password=rtrim(fgets(STDIN),"\r\n");
if(strlen($password)<12) die("A senha precisa ter ao menos 12 caracteres.\n");
umask(0077);$db=new PDO('sqlite:'.dirname(__DIR__).'/storage/store.sqlite');$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
$db->exec('CREATE TABLE IF NOT EXISTS admins(email TEXT PRIMARY KEY,password TEXT NOT NULL)');
$s=$db->prepare('INSERT OR REPLACE INTO admins VALUES(?,?)');$s->execute([$email,password_hash($password,PASSWORD_DEFAULT)]);echo "Administrador salvo. Acesse /admin/.\n";
