<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
$db=new PDO('sqlite:'.dirname(__DIR__).'/storage/store.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
$db->exec('PRAGMA busy_timeout=5000');
$db->beginTransaction();
try {
 $rows=$db->query('SELECT id,data FROM products')->fetchAll(PDO::FETCH_ASSOC);
 $update=$db->prepare('UPDATE products SET data=? WHERE id=?');$changed=0;
 foreach($rows as $row){
  $p=json_decode($row['data'],true,512,JSON_THROW_ON_ERROR);
  if(($p['active']??false) && (int)($p['stock']??0)>0)continue;
  $p['active']=true;$p['stock']=max(1,(int)($p['stock']??0));
  $update->execute([json_encode($p,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),$row['id']]);$changed++;
 }
 $db->commit();
 echo 'Produtos cadastrados: '.count($rows).'; atualizados: '.$changed.PHP_EOL;
 foreach($db->query('SELECT data FROM products') as $row){$p=json_decode($row['data'],true);if(!$p['active']||$p['stock']<1)throw new RuntimeException('Produto indisponível após atualização');}
 echo 'Verificado: todos os produtos estão ativos e com estoque positivo.'.PHP_EOL;
}catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
