<?php
declare(strict_types=1);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'");
session_name('jg_admin');
session_start(['cookie_httponly'=>true,'cookie_secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off','cookie_samesite'=>'Strict','use_strict_mode'=>true]);
function reply($data, int $status=200): never { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
function body(): array { $v=json_decode(file_get_contents('php://input'),true); if(!is_array($v)) reply(['error'=>'Dados inválidos.'],400); return $v; }
function textfield($v,int $max): string { if(!is_string($v)||mb_strlen(trim($v))>$max) reply(['error'=>'Texto inválido ou muito longo.'],422); return trim($v); }
function verify_admin_password(string $password, string $hash): bool {
 if(!str_starts_with($hash,'pbkdf2_sha256:')) return password_verify($password,$hash);
 $parts=explode(':',$hash);
 if(count($parts)!==4 || $parts[1]!=='600000' || !ctype_xdigit($parts[2]) || strlen($parts[2])!==64 || !ctype_xdigit($parts[3]) || strlen($parts[3])!==64) return false;
 return hash_equals($parts[3],hash_pbkdf2('sha256',$password,hex2bin($parts[2]),600000,64));
}
try {
 $db=new PDO('sqlite:'.dirname(__DIR__).'/storage/store.sqlite');
 $db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
 $db->exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS admins(email TEXT PRIMARY KEY,password TEXT NOT NULL); CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS categories(name TEXT PRIMARY KEY); CREATE TABLE IF NOT EXISTS attempts(ip TEXT PRIMARY KEY,count INTEGER,started INTEGER); CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT);');
 // Provision once; later password changes must not be overwritten.
 if(!$db->query("SELECT value FROM meta WHERE key='initial_admin_v1'")->fetchColumn()) {
  $initial=require dirname(__DIR__).'/admin/initial-admin.php';
  $db->beginTransaction();
  $db->prepare('INSERT OR IGNORE INTO admins(email,password) VALUES(?,?)')->execute([$initial['email'],$initial['hash']]);
  $db->exec("INSERT OR IGNORE INTO meta VALUES('initial_admin_v1','1')");
  $db->commit();
 }
 // Products are managed exclusively through the admin.
 $db->exec("INSERT OR IGNORE INTO categories VALUES('Geral'),('Camisetas'),('Calças')");
 $action=$_GET['action']??'products'; $method=$_SERVER['REQUEST_METHOD'];
 if($action==='products'&&$method==='GET') { $all=array_map(fn($r)=>json_decode($r['data'],true),$db->query('SELECT data FROM products ORDER BY rowid DESC')->fetchAll(PDO::FETCH_ASSOC)); if(empty($_SESSION['email'])) $all=array_values(array_filter($all,fn($p)=>$p['active'])); reply($all); }
 if($action==='session'&&$method==='GET') { $_SESSION['csrf']??=bin2hex(random_bytes(32)); reply(['email'=>$_SESSION['email']??null,'csrf'=>$_SESSION['csrf']]); }
 if($action==='login'&&$method==='POST') {
  $v=body(); $ip=$_SERVER['REMOTE_ADDR']??'unknown'; $s=$db->prepare('SELECT * FROM attempts WHERE ip=?'); $s->execute([$ip]); $a=$s->fetch(PDO::FETCH_ASSOC);
  if($a && $a['started']>time()-900 && $a['count']>=8) reply(['error'=>'Muitas tentativas. Aguarde 15 minutos.'],429);
  $s=$db->prepare('SELECT password FROM admins WHERE email=?'); $s->execute([strtolower(trim($v['email']??''))]); $hash=$s->fetchColumn();
  if(!verify_admin_password($v['password']??'', $hash?:'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.') || !$hash) { $count=$a&&$a['started']>time()-900?(int)$a['count']+1:1; $s=$db->prepare('INSERT OR REPLACE INTO attempts VALUES(?,?,?)'); $s->execute([$ip,$count,$count===1?time():$a['started']]); reply(['error'=>'E-mail ou senha inválidos.'],401); }
  if(str_starts_with($hash,'pbkdf2_sha256:')) $db->prepare('UPDATE admins SET password=? WHERE email=?')->execute([password_hash($v['password'],PASSWORD_DEFAULT),strtolower(trim($v['email']))]);
  session_regenerate_id(true); $_SESSION['email']=strtolower(trim($v['email'])); $_SESSION['csrf']=bin2hex(random_bytes(32)); $_SESSION['last']=time(); $db->prepare('DELETE FROM attempts WHERE ip=?')->execute([$ip]); reply(['ok'=>true]);
 }
 if(empty($_SESSION['email']) || ($_SESSION['last']??0)<time()-3600) { unset($_SESSION['email']); reply(['error'=>'Faça login para continuar.'],401); }
 $_SESSION['last']=time();
 if($method!=='GET' && !hash_equals($_SESSION['csrf']??'',$_SERVER['HTTP_X_CSRF_TOKEN']??'')) reply(['error'=>'Sessão inválida. Atualize a página.'],403);
 if($action==='logout'&&$method==='POST') { $_SESSION=[]; session_destroy(); reply(['ok'=>true]); }
 if($action==='categories') {
  if($method==='POST') { $v=body(); $name=textfield($v['name']??'',100); if(!$name) reply(['error'=>'Informe a categoria.'],422); $db->prepare('INSERT OR IGNORE INTO categories VALUES(?)')->execute([$name]); }
  elseif($method!=='GET') reply(['error'=>'Método inválido.'],405);
  reply($db->query('SELECT name FROM categories ORDER BY name')->fetchAll(PDO::FETCH_COLUMN));
 }
 if($action==='upload'&&$method==='POST') {
  $f=$_FILES['image']??null; if(!$f||$f['error']!==UPLOAD_ERR_OK||$f['size']>5*1024*1024) reply(['error'=>'Envie uma imagem de até 5 MB.'],422);
  $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']); $ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime]??null;
  $size=@getimagesize($f['tmp_name']); if(!$ext||!$size||$size[0]>10000||$size[1]>10000) reply(['error'=>'Use uma imagem JPG, PNG ou WebP válida.'],422);
  $path='uploads/'.bin2hex(random_bytes(20)).'.'.$ext; if(!move_uploaded_file($f['tmp_name'],dirname(__DIR__).'/'.$path)) throw new RuntimeException('Upload failed'); reply(['path'=>$path]);
 }
 if($action==='product-status'&&$method==='POST') {
  $v=body();
  if(!is_string($v['id']??null)||!is_bool($v['active']??null)) reply(['error'=>'Produto ou situação inválida.'],422);
  $db->beginTransaction();
  $s=$db->prepare('SELECT data FROM products WHERE id=?');$s->execute([$v['id']]);$raw=$s->fetchColumn();
  if(!$raw){$db->rollBack();reply(['error'=>'Produto não encontrado.'],404);}
  $p=json_decode($raw,true);$p['active']=$v['active'];
  $db->prepare('UPDATE products SET data=? WHERE id=?')->execute([json_encode($p),$v['id']]);
  $db->commit();reply($p);
 }
 if($action==='products'&&$method==='POST') {
  // New products are published and available immediately.
  // Existing products retain manual stock and activation controls.
  $v=body(); $id=$v['id']??bin2hex(random_bytes(10)); if(!is_string($id)||!preg_match('/^[a-f0-9]{20}$/',$id)) reply(['error'=>'Produto inválido.'],422);
  if(empty($v['id'])) {
   $v['active']=true;
   if(!isset($v['stock']) || $v['stock']==='' || (is_numeric($v['stock']) && (float)$v['stock']<=0)) $v['stock']=1;
  }
  $name=textfield($v['name']??'',200); $description=textfield($v['description']??'',10000); $category=textfield($v['category']??'Geral',100);
  if(!$name||!is_numeric($v['price']??null)||$v['price']<0||$v['price']>9999999||filter_var($v['stock']??null,FILTER_VALIDATE_INT)===false||$v['stock']<0||$v['stock']>1000000||!is_bool($v['active']??null)) reply(['error'=>'Revise nome, preço, estoque e situação.'],422);
  $images=$v['images']??[]; if(!is_array($images)||count($images)>10) reply(['error'=>'Limite de 10 imagens.'],422);
  foreach($images as $path) if(!is_string($path)||!preg_match('~^(images|uploads)/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$~i',$path)||!is_file(dirname(__DIR__).'/'.$path)) reply(['error'=>'Imagem inválida.'],422);
  $s=$db->prepare('SELECT data FROM products WHERE id=?'); $s->execute([$id]); $old=json_decode($s->fetchColumn()?:'{}',true);
  $sizes=$v['sizes']??($old['sizes']??[]);
  if(!is_array($sizes)||!array_is_list($sizes)||count($sizes)>30) reply(['error'=>'Informe até 30 tamanhos.'],422);
  $sizes=array_values(array_unique(array_map(fn($size)=>mb_strtoupper(textfield($size,30)), $sizes)));
  if(in_array('', $sizes,true)) reply(['error'=>'Tamanho inválido.'],422);
  $p=['id'=>$id,'name'=>$name,'description'=>$description,'price'=>round((float)$v['price'],2),'stock'=>(int)$v['stock'],'active'=>$v['active'],'category'=>$category,'images'=>$images,'originalUrl'=>$old['originalUrl']??''];
  $p['sizes']=$sizes;
  $compare=$v['comparePrice']??($old['comparePrice']??null);
  if($compare!==null&&$compare!==''&&(!is_numeric($compare)||$compare<0||$compare>9999999)) reply(['error'=>'Preço anterior inválido.'],422);
  $count=$v['installmentCount']??($old['installmentCount']??0);
  $value=$v['installmentValue']??($old['installmentValue']??null);
  if(filter_var($count,FILTER_VALIDATE_INT)===false||$count<0||$count>24) reply(['error'=>'Use de 0 a 24 parcelas.'],422);
  if($count>0&&(!is_numeric($value)||$value<=0||$value>9999999||(float)$value*(int)$count+0.01<(float)$v['price'])) reply(['error'=>'Revise o valor das parcelas: o total não pode ser inferior ao preço.'],422);
  $p['comparePrice']=$compare===null||$compare===''?null:round((float)$compare,2);
  $p['installmentCount']=(int)$count;
  $p['installmentValue']=$count>0?round((float)$value,2):null;
  $db->prepare('INSERT OR REPLACE INTO products VALUES(?,?)')->execute([$id,json_encode($p)]); $db->prepare('INSERT OR IGNORE INTO categories VALUES(?)')->execute([$category]); reply($p);
 }
 if($action==='products'&&$method==='DELETE') { $v=body(); $db->prepare('DELETE FROM products WHERE id=?')->execute([$v['id']??'']); reply(['ok'=>true]); }
 reply(['error'=>'Operação não encontrada.'],404);
} catch(Throwable $e) { if(isset($db)&&$db->inTransaction()) $db->rollBack(); error_log((string)$e); reply(['error'=>'Não foi possível concluir. Verifique a configuração do servidor.'],500); }
